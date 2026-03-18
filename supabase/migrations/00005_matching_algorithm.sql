-- 매칭 알고리즘: 요청에 대해 최적 병원을 선정하고 배정
-- 점수 = 거리 가중치(40%) + 병상 가용률(30%) + 대기 인원(20%) + 수용 상태(10%)

CREATE OR REPLACE FUNCTION match_hospital_for_request(p_request_id uuid)
RETURNS json AS $$
DECLARE
  v_req RECORD;
  v_best RECORD;
  v_result json;
BEGIN
  -- 요청 정보 조회
  SELECT id, latitude, longitude, severity, status
  INTO v_req
  FROM requests
  WHERE id = p_request_id;

  IF NOT FOUND THEN
    RETURN json_build_object('matched', false, 'reason', 'request_not_found');
  END IF;

  IF v_req.status != 'pending' THEN
    RETURN json_build_object('matched', false, 'reason', 'already_processed');
  END IF;

  -- 최적 병원 선정 (점수 높은 순)
  SELECT
    h.id AS hospital_id,
    h.name AS hospital_name,
    h.latitude,
    h.longitude,
    avail.available_beds,
    h.queue,
    -- 거리 계산 (Haversine, km)
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
    -- 종합 점수 (높을수록 좋음)
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
      -- 수용 상태 보너스
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
    eta_minutes = GREATEST(5, ROUND(v_best.distance_km * 3)::int) -- 대략 km * 3분
  WHERE id = p_request_id;

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
$$ LANGUAGE plpgsql SECURITY DEFINER;
