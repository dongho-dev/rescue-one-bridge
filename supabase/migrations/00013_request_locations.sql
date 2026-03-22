-- #91: 이송 경로 이력 보존 — request_locations 테이블
-- requests.latitude/longitude는 "현재 위치"만 덮어씀 → 경로 이력 보존 불가
-- request_locations에 15초 간격으로 INSERT하여 전체 이송 경로를 기록

CREATE TABLE IF NOT EXISTS request_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  recorded_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_request_locations_request ON request_locations(request_id, recorded_at);

ALTER TABLE request_locations ENABLE ROW LEVEL SECURITY;

-- 구급대원: 자기 요청의 위치만 INSERT
CREATE POLICY "paramedic_insert_location"
  ON request_locations FOR INSERT
  TO authenticated
  WITH CHECK (
    request_id IN (
      SELECT id FROM requests WHERE paramedic_id = auth.uid()
    )
  );

-- 병원/구급대원: 매칭된 요청의 위치 조회
CREATE POLICY "hospital_select_location"
  ON request_locations FOR SELECT
  TO authenticated
  USING (
    request_id IN (
      SELECT id FROM requests
      WHERE paramedic_id = auth.uid()
         OR hospital_id IN (SELECT hospital_id FROM profiles WHERE id = auth.uid())
    )
  );

-- Realtime 활성화
ALTER PUBLICATION supabase_realtime ADD TABLE request_locations;
