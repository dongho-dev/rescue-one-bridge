-- ============================================================
-- #127: hospitals INSERT/DELETE RLS 정책 추가
-- ============================================================

-- hospitals_insert: hospital_staff만 INSERT 가능
CREATE POLICY "hospitals_insert" ON hospitals
  FOR INSERT TO authenticated
  WITH CHECK (auth_user_role() = 'hospital_staff');

-- hospitals_delete: 아무도 삭제 불가 (기본 거부)
-- RLS가 활성화된 상태에서 DELETE 정책이 없으면 거부되지만,
-- 명시적으로 false 정책을 추가하여 의도를 명확히 함
CREATE POLICY "hospitals_delete" ON hospitals
  FOR DELETE TO authenticated
  USING (false);
