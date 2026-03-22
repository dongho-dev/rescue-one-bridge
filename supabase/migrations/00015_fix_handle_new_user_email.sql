-- #85: handle_new_user에 email 컬럼 누락 수정
-- 00008_security_hardening.sql에서 email 컬럼이 빠져 신규 가입자의 profiles.email이 null이 됨
-- 기존 null email 프로필도 백필

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
DECLARE
  _role text;
BEGIN
  _role := NEW.raw_user_meta_data ->> 'role';
  IF _role IS NULL OR _role NOT IN ('hospital_staff', 'paramedic') THEN
    _role := 'paramedic';
  END IF;

  INSERT INTO public.profiles (id, role, display_name, email, hospital_id)
  VALUES (
    NEW.id,
    _role,
    COALESCE(NEW.raw_user_meta_data ->> 'display_name', ''),
    NEW.email,
    NULL
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
   SET search_path = public, auth;

-- 기존 사용자 중 email이 null인 프로필 백필
UPDATE public.profiles
SET email = u.email
FROM auth.users u
WHERE profiles.id = u.id
  AND profiles.email IS NULL;
