-- ============================================================
-- Fix handle_new_user: include email column from auth.users
-- Closes #85
-- ============================================================
-- The profiles table has an email column but handle_new_user
-- was not populating it, causing NULL emails for new signups.

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
DECLARE
  _role text;
BEGIN
  _role := NEW.raw_user_meta_data ->> 'role';
  IF _role IS NULL OR _role NOT IN ('hospital_staff', 'paramedic') THEN
    _role := 'paramedic';
  END IF;

  INSERT INTO public.profiles (id, role, display_name, hospital_id, email)
  VALUES (
    NEW.id,
    _role,
    COALESCE(NEW.raw_user_meta_data ->> 'display_name', ''),
    NULL,
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
   SET search_path = public, auth;
