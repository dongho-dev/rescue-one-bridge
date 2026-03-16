-- Migration: Secure signup by validating role in handle_new_user trigger
-- and adding link_hospital RPC for server-side hospital_id assignment.

-- Override the handle_new_user trigger function with role validation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
DECLARE
  _role text;
BEGIN
  -- Extract role from user metadata, validate against allowed values
  _role := NEW.raw_user_meta_data ->> 'role';

  -- Only allow 'hospital_staff' and 'paramedic'; default to 'paramedic'
  IF _role IS NULL OR _role NOT IN ('hospital_staff', 'paramedic') THEN
    _role := 'paramedic';
  END IF;

  INSERT INTO public.profiles (id, role, display_name, hospital_id)
  VALUES (
    NEW.id,
    _role,
    COALESCE(NEW.raw_user_meta_data ->> 'display_name', ''),
    NULL  -- hospital_id is NOT taken from client metadata
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC function to link a hospital to the current user's profile
-- Only hospital_staff with no existing hospital_id can link
CREATE OR REPLACE FUNCTION link_hospital(p_hospital_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE profiles
  SET hospital_id = p_hospital_id
  WHERE id = auth.uid()
    AND role = 'hospital_staff'
    AND hospital_id IS NULL
    AND EXISTS (SELECT 1 FROM hospitals WHERE id = p_hospital_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
