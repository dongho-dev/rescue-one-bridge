-- ============================================================
-- Fix: hospital_staff 재매칭 RPC 권한 거부 수정
-- Closes #65
-- ============================================================
-- 문제: match_hospital_for_request()가 paramedic_id != auth.uid() 검사를 해서
-- hospital_staff가 거절 후 재매칭 시 항상 forbidden 반환.
--
-- 해결: hospital_staff가 호출 시에도 허용하도록 권한 체크 확장.
-- rejectRequest가 먼저 hospital_id를 null로 변경하므로,
-- RPC 내에서 role 기반 체크로 변경. 또한 FOR UPDATE lock으로 race condition 방지.

CREATE OR REPLACE FUNCTION match_hospital_for_request(p_request_id uuid)
RETURNS json AS $$
DECLARE
  v_req RECORD;
  v_best RECORD;
  v_result json;
  v_caller_role text;
BEGIN
  -- 호출자 role 조회
  v_caller_role := auth_user_role()::text;

  -- 요청 정보 조회 (FOR UPDATE로 동시 재매칭 방지)
  SELECT id, paramedic_id, latitude, longitude, severity, status, hospital_id
  INTO v_req
  FROM requests
  WHERE id = p_request_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN json_build_object('matched', false, 'reason', 'request_not_found');
  END IF;

  -- Authorization: paramedic 본인 또는 hospital_staff 허용
  IF v_req.paramedic_id != auth.uid() THEN
    -- hospital_staff가 자기 병원의 요청을 재매칭하는 경우 허용
    -- (rejectRequest가 hospital_id를 null로 바꾸기 전에 호출될 수도 있고,
    --  바꾼 후에 호출될 수도 있으므로 role 체크로 허용)
    IF v_caller_role != 'hospital_staff' THEN
      RETURN json_build_object('matched', false, 'reason', 'forbidden');
    END IF;
  END IF;

  IF v_req.status != 'pending' THEN
    RETURN json_build_object('matched', false, 'reason', 'already_processed');
  END IF;

  -- hospital_staff가 호출한 경우: hospital_id를 null로 초기화 (atomic reject + rematch)
  IF v_caller_role = 'hospital_staff' AND v_req.hospital_id IS NOT NULL THEN
    UPDATE requests
    SET hospital_id = NULL, matched_at = NULL, distance_km = NULL, eta_minutes = NULL
    WHERE id = p_request_id;
  END IF;

  -- 최적 병원 선정 (기존 거절한 병원 제외를 위해 hospital_staff의 병원 ID 추적)
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
    -- hospital_staff가 거절한 경우 해당 병원 제외
    AND (
      v_caller_role != 'hospital_staff'
      OR h.id != auth_hospital_id()
    )
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

  -- Audit log entry
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

-- Preserve grants
REVOKE ALL ON FUNCTION match_hospital_for_request(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION match_hospital_for_request(uuid) TO authenticated;
