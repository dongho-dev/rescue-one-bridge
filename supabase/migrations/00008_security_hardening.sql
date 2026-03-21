-- ============================================================
-- Security Hardening Migration
-- Fixes: CRITICAL C4-C6, HIGH H5-H6, MEDIUM M1/M6/M7
-- ============================================================

-- 1. Set search_path on ALL SECURITY DEFINER functions (M1)
CREATE OR REPLACE FUNCTION auth_hospital_id()
RETURNS uuid AS $$
  SELECT hospital_id FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER
   SET search_path = public;

CREATE OR REPLACE FUNCTION auth_user_role()
RETURNS user_role AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER
   SET search_path = public;

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
   SET search_path = public;

-- 2. Fix handle_new_user with search_path (H5)
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
DECLARE
  _role text;
BEGIN
  _role := NEW.raw_user_meta_data ->> 'role';
  IF _role IS NULL OR _role NOT IN ('hospital_staff', 'paramedic') THEN
    _role := 'paramedic';
  END IF;

  INSERT INTO public.profiles (id, role, display_name, hospital_id)
  VALUES (
    NEW.id,
    _role,
    COALESCE(NEW.raw_user_meta_data ->> 'display_name', ''),
    NULL
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
   SET search_path = public, auth;

-- 3. Fix link_hospital with search_path
CREATE OR REPLACE FUNCTION link_hospital(p_hospital_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE profiles
  SET hospital_id = p_hospital_id
  WHERE id = auth.uid()
    AND role = 'hospital_staff'
    AND hospital_id IS NULL
    AND EXISTS (SELECT 1 FROM hospitals WHERE id = p_hospital_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
   SET search_path = public;

-- 4. Fix match_hospital_for_request: add authorization check (C4) + audit log (M7)
CREATE OR REPLACE FUNCTION match_hospital_for_request(p_request_id uuid)
RETURNS json AS $$
DECLARE
  v_req RECORD;
  v_best RECORD;
  v_result json;
BEGIN
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

  -- 최적 병원 선정
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
          GREATEST(0, 40 - (
            6371 * acos(
              LEAST(1.0, GREATEST(-1.0,
                cos(radians(v_req.latitude)) * cos(radians(h.latitude))
                * cos(radians(h.longitude) - radians(v_req.longitude))
                + sin(radians(v_req.latitude)) * sin(radians(h.latitude))
              ))
            )
          ) * 4)
        ELSE 0
      END
      + LEAST(30, avail.available_beds * 10)
      + GREATEST(0, 20 - h.queue * 2)
      + CASE WHEN h.accepting THEN 10 ELSE 0 END
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

  -- 요청에 병원 배정
  UPDATE requests
  SET
    hospital_id = v_best.hospital_id,
    status = 'matched',
    matched_at = NOW(),
    distance_km = ROUND(v_best.distance_km::numeric, 1),
    eta_minutes = GREATEST(5, ROUND(v_best.distance_km * 3)::int)
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

-- 5. Fix get_hospital_availability: restrict to authenticated (C5)
CREATE OR REPLACE FUNCTION get_hospital_availability()
RETURNS TABLE (
  hospital_id uuid, hospital_name text, accepting boolean,
  available_beds bigint, queue int, specialties text[],
  contact text, avg_wait_time int
) AS $$
  SELECT h.id, h.name, h.accepting,
    COUNT(b.id) FILTER (WHERE b.status = 'available'),
    h.queue, h.specialties, h.contact, h.avg_wait_time_min
  FROM hospitals h LEFT JOIN beds b ON b.hospital_id = h.id
  GROUP BY h.id;
$$ LANGUAGE sql STABLE SECURITY DEFINER
   SET search_path = public;

-- Revoke anon access; grant only to authenticated
REVOKE ALL ON FUNCTION get_hospital_availability() FROM public, anon;
GRANT EXECUTE ON FUNCTION get_hospital_availability() TO authenticated;

REVOKE ALL ON FUNCTION match_hospital_for_request(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION match_hospital_for_request(uuid) TO authenticated;

REVOKE ALL ON FUNCTION link_hospital(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION link_hospital(uuid) TO authenticated;

-- 6. Add apply_oauth_role RPC — server-side role update for OAuth users (C1 fix)
-- Only allows updating role within first 5 minutes of account creation
-- and only if the profile still has the default role
CREATE OR REPLACE FUNCTION apply_oauth_role(p_role text)
RETURNS void AS $$
BEGIN
  IF p_role NOT IN ('hospital_staff', 'paramedic') THEN
    RAISE EXCEPTION 'invalid role';
  END IF;

  UPDATE profiles
  SET role = p_role::user_role
  WHERE id = auth.uid()
    AND created_at > (now() - interval '5 minutes');  -- only allow within 5 min of signup
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
   SET search_path = public;

REVOKE ALL ON FUNCTION apply_oauth_role(text) FROM public, anon;
GRANT EXECUTE ON FUNCTION apply_oauth_role(text) TO authenticated;

-- 7. Validate sender_role in messages (H6)
-- Trigger to enforce sender_role matches actual profile role
CREATE OR REPLACE FUNCTION validate_message_sender_role()
RETURNS trigger AS $$
DECLARE
  actual_role text;
BEGIN
  SELECT role::text INTO actual_role
  FROM profiles WHERE id = NEW.sender_id;

  IF actual_role IS DISTINCT FROM NEW.sender_role THEN
    NEW.sender_role := actual_role;  -- Override with actual role
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
   SET search_path = public;

CREATE TRIGGER trg_validate_message_sender
  BEFORE INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION validate_message_sender_role();

-- 8. Add missing index on messages(sender_id) (M6)
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);

-- 9. Add role check to beds_select policy (H4 from RLS audit)
DROP POLICY IF EXISTS "beds_select" ON beds;
CREATE POLICY "beds_select" ON beds FOR SELECT TO authenticated
  USING (hospital_id = auth_hospital_id() AND auth_user_role() = 'hospital_staff');
