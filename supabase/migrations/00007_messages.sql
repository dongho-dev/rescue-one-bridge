-- 병원 ↔ 구급대원 간 메시지 (요청 단위)
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES auth.users(id),
  sender_role text NOT NULL,  -- 'hospital_staff' | 'paramedic'
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_messages_request ON messages(request_id, created_at);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- 요청에 관련된 사용자만 메시지 조회/작성 가능
CREATE POLICY "Request participants can view messages"
  ON messages FOR SELECT
  TO authenticated
  USING (
    request_id IN (
      SELECT id FROM requests
      WHERE paramedic_id = auth.uid()
         OR hospital_id IN (SELECT hospital_id FROM profiles WHERE id = auth.uid())
    )
  );

CREATE POLICY "Request participants can send messages"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = sender_id
    AND request_id IN (
      SELECT id FROM requests
      WHERE paramedic_id = auth.uid()
         OR hospital_id IN (SELECT hospital_id FROM profiles WHERE id = auth.uid())
    )
  );

-- Realtime 활성화
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
