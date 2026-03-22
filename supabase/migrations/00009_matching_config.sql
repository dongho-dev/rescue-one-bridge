-- ============================================================
-- Matching Config Migration
-- Extract magic numbers from match_hospital_for_request into
-- a configurable table so weights can be tuned without redeployment.
-- ============================================================

-- 1. Create matching_config table
CREATE TABLE IF NOT EXISTS matching_config (
  key text PRIMARY KEY,
  value numeric NOT NULL CHECK (value >= 0),
  description text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Seed default values (same as existing hard-coded values)
INSERT INTO matching_config (key, value, description) VALUES
  ('distance_max_score',        40, '거리 점수 최대값'),
  ('distance_penalty_per_km',    4, 'km당 거리 점수 감점'),
  ('beds_max_score',            30, '병상 가용 점수 최대값'),
  ('beds_score_per_bed',        10, '가용 병상 1개당 점수'),
  ('queue_max_score',           20, '대기열 점수 최대값'),
  ('queue_penalty_per_person',   2, '대기 1명당 점수 감점'),
  ('accepting_bonus',           10, '수용 상태 보너스 점수'),
  ('eta_minutes_per_km',         3, 'ETA 계산: km당 분'),
  ('eta_min_minutes',            5, 'ETA 최솟값 (분)')
ON CONFLICT (key) DO NOTHING;

-- 3. RLS
ALTER TABLE matching_config ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read config
CREATE POLICY "matching_config_select" ON matching_config
  FOR SELECT TO authenticated USING (true);

-- Only hospital_staff can update config
CREATE POLICY "matching_config_update" ON matching_config
  FOR UPDATE TO authenticated
  USING (auth_user_role() = 'hospital_staff')
  WITH CHECK (auth_user_role() = 'hospital_staff');

-- 4. Auto-update updated_at on change
CREATE TRIGGER trg_matching_config_updated_at
  BEFORE UPDATE ON matching_config
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- 5. Replace match_hospital_for_request to read from matching_config
CREATE OR REPLACE FUNCTION match_hospital_for_request(p_request_id uuid)
RETURNS json AS $$
DECLARE
  v_req RECORD;
  v_best RECORD;
  v_result json;
  -- Config values (with COALESCE fallbacks to original defaults)
  c_dist_max numeric;
  c_dist_penalty numeric;
  c_beds_max numeric;
  c_beds_per numeric;
  c_queue_max numeric;
  c_queue_penalty numeric;
  c_accept_bonus numeric;
  c_eta_per_km numeric;
  c_eta_min numeric;
BEGIN
  -- Load config values (fallback to defaults if table is empty)
  SELECT COALESCE((SELECT value FROM matching_config WHERE key = 'distance_max_score'), 40) INTO c_dist_max;
  SELECT COALESCE((SELECT value FROM matching_config WHERE key = 'distance_penalty_per_km'), 4) INTO c_dist_penalty;
  SELECT COALESCE((SELECT value FROM matching_config WHERE key = 'beds_max_score'), 30) INTO c_beds_max;
  SELECT COALESCE((SELECT value FROM matching_config WHERE key = 'beds_score_per_bed'), 10) INTO c_beds_per;
  SELECT COALESCE((SELECT value FROM matching_config WHERE key = 'queue_max_score'), 20) INTO c_queue_max;
  SELECT COALESCE((SELECT value FROM matching_config WHERE key = 'queue_penalty_per_person'), 2) INTO c_queue_penalty;
  SELECT COALESCE((SELECT value FROM matching_config WHERE key = 'accepting_bonus'), 10) INTO c_accept_bonus;
  SELECT COALESCE((SELECT value FROM matching_config WHERE key = 'eta_minutes_per_km'), 3) INTO c_eta_per_km;
  SELECT COALESCE((SELECT value FROM matching_config WHERE key = 'eta_min_minutes'), 5) INTO c_eta_min;

  -- 요청 정보 조회
  SELECT id, paramedic_id, latitude, longitude, severity, status
  INTO v_req
  FROM requests
  WHERE id = p_request_id;

  IF NOT FOUND THEN
    RETURN json_build_object('matched', false, 'reason', 'request_not_found');
  END IF;

  -- Authorization: only the owning paramedic can trigger matching (C4)
  IF v_req.paramedic_id != auth.uid() THEN
    RETURN json_build_object('matched', false, 'reason', 'forbidden');
  END IF;

  IF v_req.status != 'pending' THEN
    RETURN json_build_object('matched', false, 'reason', 'already_processed');
  END IF;

  -- 최적 병원 선정 (configurable weights)
  SELECT
    h.id AS hospital_id,
    h.name AS hospital_name,
    h.latitude,
    h.longitude,
    avail.available_beds,
    h.queue,
    CASE
      WHEN v_req.latitude IS NOT NULL AND h.latitude IS NOT NULL THEN
        6371 * acos(
          LEAST(1.0, GREATEST(-1.0,
            cos(radians(v_req.latitude)) * cos(radians(h.latitude))
            * cos(radians(h.longitude) - radians(v_req.longitude))
            + sin(radians(v_req.latitude)) * sin(radians(h.latitude))
          ))
        )
      ELSE 9999
    END AS distance_km,
    (
      CASE
        WHEN v_req.latitude IS NOT NULL AND h.latitude IS NOT NULL THEN
          GREATEST(0, c_dist_max - (
            6371 * acos(
              LEAST(1.0, GREATEST(-1.0,
                cos(radians(v_req.latitude)) * cos(radians(h.latitude))
                * cos(radians(h.longitude) - radians(v_req.longitude))
                + sin(radians(v_req.latitude)) * sin(radians(h.latitude))
              ))
            )
          ) * c_dist_penalty)
        ELSE 0
      END
      + LEAST(c_beds_max, avail.available_beds * c_beds_per)
      + GREATEST(0, c_queue_max - h.queue * c_queue_penalty)
      + CASE WHEN h.accepting THEN c_accept_bonus ELSE 0 END
    ) AS score
  INTO v_best
  FROM hospitals h
  LEFT JOIN LATERAL (
    SELECT COUNT(*) FILTER (WHERE b.status = 'available') AS available_beds
    FROM beds b WHERE b.hospital_id = h.id
  ) avail ON true
  WHERE h.accepting = true
    AND avail.available_beds > 0
  ORDER BY score DESC
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN json_build_object('matched', false, 'reason', 'no_available_hospital');
  END IF;

  -- 요청에 병원 배정 (configurable ETA)
  UPDATE requests
  SET
    hospital_id = v_best.hospital_id,
    status = 'matched',
    matched_at = NOW(),
    distance_km = ROUND(v_best.distance_km::numeric, 1),
    eta_minutes = GREATEST(c_eta_min, ROUND(v_best.distance_km * c_eta_per_km)::int)
  WHERE id = p_request_id;

  -- Audit log entry (M7)
  INSERT INTO audit_logs (user_id, action, resource_type, resource_id, metadata)
  VALUES (
    auth.uid(),
    'match',
    'request',
    p_request_id,
    json_build_object('hospital_id', v_best.hospital_id, 'score', ROUND(v_best.score::numeric, 1))::jsonb
  );

  v_result := json_build_object(
    'matched', true,
    'hospital_id', v_best.hospital_id,
    'hospital_name', v_best.hospital_name,
    'distance_km', ROUND(v_best.distance_km::numeric, 1),
    'available_beds', v_best.available_beds,
    'score', ROUND(v_best.score::numeric, 1)
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
   SET search_path = public;
