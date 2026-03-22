-- #66: RLS 강화 — requests INSERT 시 hospital_id IS NULL 강제
-- paramedic이 insert할 때 hospital_id를 주입할 수 없도록 RLS 정책에 조건 추가
-- hospital_id는 match_hospital_for_request RPC(SECURITY DEFINER)에서만 설정되어야 함

DROP POLICY IF EXISTS "requests_insert_paramedic" ON requests;
CREATE POLICY "requests_insert_paramedic" ON requests FOR INSERT TO authenticated
  WITH CHECK (
    paramedic_id = auth.uid()
    AND auth_user_role() = 'paramedic'
    AND hospital_id IS NULL
  );
