-- ============================================================
-- #129: profiles role/hospital_id 직접 업데이트 방지
-- 사용자가 자신의 role, hospital_id를 직접 변경하지 못하도록
-- WITH CHECK에서 기존 값과 동일해야 함을 검증
-- ============================================================

-- 기존 정책 제거
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;

-- 재생성: role과 hospital_id는 기존 값 유지 강제
CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid()
    AND role = (SELECT role FROM profiles WHERE id = auth.uid())
    AND hospital_id IS NOT DISTINCT FROM (SELECT hospital_id FROM profiles WHERE id = auth.uid())
  );
