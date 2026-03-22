-- ============================================================
-- 통합 매칭 함수: 재매칭 권한 + 전문과/중증도 로직
-- Closes #139
-- ============================================================
-- 00009_fix_rematch_auth (hospital_staff 재매칭 허용, FOR UPDATE lock)
-- 00010_matching_severity_specialty (전문과 필터링, 중증도 가중치)
-- 위 두 마이그레이션의 로직을 통합하여 충돌 해소.
-- 기존 00009/00010 파일은 수정하지 않음 (이 마이그레이션이 덮어씀).

CREATE OR REPLACE FUNCTION match_hospital_for_request(p_request_id uuid)
RETURNS json AS $$
DECLARE
  v_req RECORD;
  v_best RECORD;
  v_result json;
  v_caller_role text;
  v_required_specs text[];
  v_prev_hospital_id uuid;
BEGIN
  -- 호출자 role 조회
  v_caller_role := auth_user_role()::text;

  -- 요청 정보 조회 (FOR UPDATE로 동시 재매칭 방지)
  SELECT id, paramedic_id, latitude, longitude, severity, status, hospital_id, symptom
  INTO v_req
  FROM requests
  WHERE id = p_request_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN json_build_object('matched', false, 'reason', 'request_not_found');
  END IF;

  -- Authorization: paramedic 본인 또는 hospital_staff 허용
  IF v_req.paramedic_id != auth.uid() THEN
    IF v_caller_role != 'hospital_staff' THEN
      RETURN json_build_object('matched', false, 'reason', 'forbidden');
    END IF;
  END IF;

  IF v_req.status != 'pending' THEN
    RETURN json_build_object('matched', false, 'reason', 'already_processed');
  END IF;

  -- 이전 병원 ID 기록 (재매칭 시 제외 대상)
  v_prev_hospital_id := v_req.hospital_id;

  -- hospital_staff가 호출한 경우: hospital_id를 null로 초기화 (atomic reject + rematch)
  IF v_caller_role = 'hospital_staff' AND v_req.hospital_id IS NOT NULL THEN
    UPDATE requests
    SET hospital_id = NULL, matched_at = NULL, distance_km = NULL, eta_minutes = NULL
    WHERE id = p_request_id;
  END IF;

  -- 증상 기반 필요 전문과 계산
  v_required_specs := get_required_specialties(v_req.symptom, v_req.severity);

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
      -- 거리 점수 (가까울수록 높음, 최대 40점)
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
      -- 병상 가용 점수 (최대 30점)
      + LEAST(30, avail.available_beds * 10)
      -- 대기 인원 점수 (적을수록 높음, 최대 20점)
      + GREATEST(0, 20 - h.queue * 2)
      -- 수용 상태 보너스 (10점)
      + CASE WHEN h.accepting THEN 10 ELSE 0 END
      -- 전문과 일치 보너스 (최대 20점)
      + CASE
          WHEN v_required_specs = ARRAY[]::text[] THEN 0
          WHEN h.specialties && v_required_specs THEN 20
          ELSE -10
        END
      -- 중증도 가중치 (severity 4-5: 전문과 일치 시 추가 보너스)
      + CASE
          WHEN v_req.severity >= 4 AND h.specialties && v_required_specs THEN 15
          WHEN v_req.severity >= 5 THEN 5
          ELSE 0
        END
    ) AS score
  INTO v_best
  FROM hospitals h
  LEFT JOIN LATERAL (
    SELECT COUNT(*) FILTER (WHERE b.status = 'available') AS available_beds
    FROM beds b WHERE b.hospital_id = h.id
  ) avail ON true
  WHERE h.accepting = true
    AND avail.available_beds > 0
    -- 이전 병원 제외 (재매칭 시)
    AND (v_prev_hospital_id IS NULL OR h.id != v_prev_hospital_id)
    -- hospital_staff가 거절한 경우 해당 병원도 제외
    AND (
      v_caller_role != 'hospital_staff'
      OR h.id != auth_hospital_id()
    )
    -- severity >= 4이고 전문과 매핑이 있으면 전문과 필수 (fallback: 해당 전문과 병원이 없으면 필터 해제)
    AND (
      v_req.severity < 4
      OR v_required_specs = ARRAY[]::text[]
      OR h.specialties && v_required_specs
      OR NOT EXISTS (
        SELECT 1 FROM hospitals h2
        LEFT JOIN LATERAL (
          SELECT COUNT(*) FILTER (WHERE b2.status = 'available') AS available_beds
          FROM beds b2 WHERE b2.hospital_id = h2.id
        ) avail2 ON true
        WHERE h2.accepting = true
          AND avail2.available_beds > 0
          AND h2.specialties && v_required_specs
          AND (v_prev_hospital_id IS NULL OR h2.id != v_prev_hospital_id)
      )
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
    eta_minutes = GREATEST(5, ROUND(v_best.distance_km * 3)::int),
    required_specialties = v_required_specs
  WHERE id = p_request_id;

  -- Audit log entry
  INSERT INTO audit_logs (user_id, action, resource_type, resource_id, metadata)
  VALUES (
    auth.uid(),
    'match',
    'request',
    p_request_id,
    json_build_object(
      'hospital_id', v_best.hospital_id,
      'score', ROUND(v_best.score::numeric, 1),
      'required_specialties', v_required_specs
    )::jsonb
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
