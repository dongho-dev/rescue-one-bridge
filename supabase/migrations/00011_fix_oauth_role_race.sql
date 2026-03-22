-- ============================================================
-- Fix: apply_oauth_role 기존 role 조건 없음 + 5분 race condition
-- Closes #73
-- ============================================================
-- 변경 사항:
-- 1. AND role = 'paramedic' 조건 추가 (기본 role에서만 변경 가능)
-- 2. 시간 제한 5분 → 15분으로 확대

CREATE OR REPLACE FUNCTION apply_oauth_role(p_role text)
RETURNS void AS $$
BEGIN
  IF p_role NOT IN ('hospital_staff', 'paramedic') THEN
    RAISE EXCEPTION 'invalid role';
  END IF;

  UPDATE profiles
  SET role = p_role::user_role
  WHERE id = auth.uid()
    AND role = 'paramedic'  -- 기본값에서만 변경 가능 (이미 변경된 경우 무시)
    AND created_at > (now() - interval '15 minutes');  -- 15분으로 확대
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
   SET search_path = public;

REVOKE ALL ON FUNCTION apply_oauth_role(text) FROM public, anon;
GRANT EXECUTE ON FUNCTION apply_oauth_role(text) TO authenticated;
