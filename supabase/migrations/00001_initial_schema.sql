-- ============================================================
-- rescue-one-bridge: Initial Database Schema
-- ============================================================

-- 1. ENUM TYPES
CREATE TYPE user_role AS ENUM ('hospital_staff', 'paramedic');
CREATE TYPE bed_status AS ENUM ('occupied', 'available', 'maintenance', 'cleaning');
CREATE TYPE patient_severity AS ENUM ('critical', 'urgent', 'stable');
CREATE TYPE patient_status AS ENUM ('waiting', 'treating', 'stable', 'discharged');
CREATE TYPE staff_role AS ENUM ('doctor', 'nurse', 'technician', 'admin');
CREATE TYPE staff_shift AS ENUM ('day', 'night', 'evening');
CREATE TYPE staff_status AS ENUM ('on_duty', 'off_duty', 'break', 'emergency');
CREATE TYPE equipment_type AS ENUM ('monitor', 'ventilator', 'defibrillator', 'xray', 'ultrasound', 'infusion', 'other');
CREATE TYPE equipment_status AS ENUM ('operational', 'maintenance', 'error', 'offline');
CREATE TYPE request_status AS ENUM ('pending', 'matched', 'en_route', 'completed', 'cancelled');
CREATE TYPE request_priority AS ENUM ('emergency', 'urgent', 'normal');

-- 2. TABLES

-- hospitals
CREATE TABLE hospitals (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL,
  accepting     boolean NOT NULL DEFAULT true,
  queue         int NOT NULL DEFAULT 0,
  specialties   text[] NOT NULL DEFAULT '{}',
  contact       text,
  address       text,
  latitude      double precision,
  longitude     double precision,
  avg_wait_time_min int,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- profiles (Supabase Auth)
CREATE TABLE profiles (
  id            uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  hospital_id   uuid REFERENCES hospitals(id) ON DELETE SET NULL,
  role          user_role NOT NULL,
  display_name  text NOT NULL,
  phone         text,
  email         text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- beds
CREATE TABLE beds (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id   uuid NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  section       text NOT NULL,
  number        text NOT NULL,
  status        bed_status NOT NULL DEFAULT 'available',
  last_cleaned  timestamptz,
  notes         text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (hospital_id, section, number)
);
CREATE INDEX idx_beds_hospital_status ON beds (hospital_id, status);

-- patients
CREATE TABLE patients (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id     uuid NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  bed_id          uuid REFERENCES beds(id) ON DELETE SET NULL,
  name            text NOT NULL,
  age             int,
  gender          text,
  diagnosis       text,
  severity        patient_severity NOT NULL DEFAULT 'stable',
  status          patient_status NOT NULL DEFAULT 'waiting',
  admission_time  timestamptz NOT NULL DEFAULT now(),
  discharge_time  timestamptz,
  vitals          jsonb DEFAULT '{}'::jsonb,
  allergies       text[] DEFAULT '{}',
  notes           text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_patients_hospital ON patients (hospital_id);
CREATE INDEX idx_patients_bed ON patients (bed_id);
CREATE INDEX idx_patients_status ON patients (hospital_id, status);

-- staff
CREATE TABLE staff (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id         uuid NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  profile_id          uuid REFERENCES profiles(id) ON DELETE SET NULL,
  name                text NOT NULL,
  role                staff_role NOT NULL,
  department          text,
  shift               staff_shift NOT NULL DEFAULT 'day',
  status              staff_status NOT NULL DEFAULT 'on_duty',
  phone               text,
  email               text,
  specialization      text,
  years_of_experience int DEFAULT 0,
  current_location    text,
  shift_start         time,
  shift_end           time,
  certifications      text[] DEFAULT '{}',
  emergency_contact   text,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_staff_hospital ON staff (hospital_id);
CREATE INDEX idx_staff_role_status ON staff (hospital_id, role, status);

-- equipment
CREATE TABLE equipment (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id       uuid NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  assigned_bed_id   uuid REFERENCES beds(id) ON DELETE SET NULL,
  name              text NOT NULL,
  type              equipment_type NOT NULL DEFAULT 'other',
  model             text,
  manufacturer      text,
  status            equipment_status NOT NULL DEFAULT 'operational',
  location          text,
  last_maintenance  date,
  next_maintenance  date,
  battery_level     int CHECK (battery_level >= 0 AND battery_level <= 100),
  usage_hours       int DEFAULT 0,
  alerts            text[] DEFAULT '{}',
  notes             text,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_equipment_hospital ON equipment (hospital_id);
CREATE INDEX idx_equipment_status ON equipment (hospital_id, status);

-- requests
CREATE TABLE requests (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id     uuid REFERENCES hospitals(id) ON DELETE SET NULL,
  paramedic_id    uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status          request_status NOT NULL DEFAULT 'pending',
  priority        request_priority NOT NULL DEFAULT 'normal',
  severity        int NOT NULL CHECK (severity >= 1 AND severity <= 5),
  symptom         text NOT NULL,
  patient_name    text,
  patient_age     int,
  patient_gender  text,
  allergies       text[] DEFAULT '{}',
  vitals          jsonb DEFAULT '{}'::jsonb,
  distance_km     numeric(5,1),
  eta_minutes     int,
  location_text   text,
  latitude        double precision,
  longitude       double precision,
  notes           text,
  requested_at    timestamptz NOT NULL DEFAULT now(),
  matched_at      timestamptz,
  completed_at    timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_requests_hospital ON requests (hospital_id, status);
CREATE INDEX idx_requests_paramedic ON requests (paramedic_id, status);
CREATE INDEX idx_requests_status ON requests (status, requested_at DESC);

-- 3. AUTO UPDATED_AT TRIGGER
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_hospitals_updated   BEFORE UPDATE ON hospitals  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_profiles_updated    BEFORE UPDATE ON profiles   FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_beds_updated        BEFORE UPDATE ON beds       FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_patients_updated    BEFORE UPDATE ON patients   FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_staff_updated       BEFORE UPDATE ON staff      FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_equipment_updated   BEFORE UPDATE ON equipment  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_requests_updated    BEFORE UPDATE ON requests   FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 4. AUTO-CREATE PROFILE ON SIGNUP
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, role, display_name, email)
  VALUES (
    NEW.id,
    COALESCE((NEW.raw_user_meta_data ->> 'role')::user_role, 'paramedic'),
    COALESCE(NEW.raw_user_meta_data ->> 'display_name', ''),
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 5. ROW LEVEL SECURITY
ALTER TABLE hospitals  ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles   ENABLE ROW LEVEL SECURITY;
ALTER TABLE beds       ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients   ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff      ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment  ENABLE ROW LEVEL SECURITY;
ALTER TABLE requests   ENABLE ROW LEVEL SECURITY;

-- helpers
CREATE OR REPLACE FUNCTION auth_hospital_id()
RETURNS uuid AS $$
  SELECT hospital_id FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION auth_user_role()
RETURNS user_role AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- hospitals: 모든 인증 사용자 조회 가능, 병원 직원만 자기 병원 수정
CREATE POLICY "hospitals_select" ON hospitals FOR SELECT TO authenticated USING (true);
CREATE POLICY "hospitals_update" ON hospitals FOR UPDATE TO authenticated
  USING (id = auth_hospital_id()) WITH CHECK (id = auth_hospital_id());

-- profiles
CREATE POLICY "profiles_select_own" ON profiles FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY "profiles_select_colleagues" ON profiles FOR SELECT TO authenticated
  USING (hospital_id = auth_hospital_id() AND auth_user_role() = 'hospital_staff');
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE TO authenticated
  USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- beds: 병원 직원만
CREATE POLICY "beds_select" ON beds FOR SELECT TO authenticated USING (hospital_id = auth_hospital_id());
CREATE POLICY "beds_insert" ON beds FOR INSERT TO authenticated WITH CHECK (hospital_id = auth_hospital_id() AND auth_user_role() = 'hospital_staff');
CREATE POLICY "beds_update" ON beds FOR UPDATE TO authenticated USING (hospital_id = auth_hospital_id() AND auth_user_role() = 'hospital_staff') WITH CHECK (hospital_id = auth_hospital_id());
CREATE POLICY "beds_delete" ON beds FOR DELETE TO authenticated USING (hospital_id = auth_hospital_id() AND auth_user_role() = 'hospital_staff');

-- patients: 병원 직원만
CREATE POLICY "patients_select" ON patients FOR SELECT TO authenticated USING (hospital_id = auth_hospital_id() AND auth_user_role() = 'hospital_staff');
CREATE POLICY "patients_insert" ON patients FOR INSERT TO authenticated WITH CHECK (hospital_id = auth_hospital_id() AND auth_user_role() = 'hospital_staff');
CREATE POLICY "patients_update" ON patients FOR UPDATE TO authenticated USING (hospital_id = auth_hospital_id() AND auth_user_role() = 'hospital_staff') WITH CHECK (hospital_id = auth_hospital_id());

-- staff: 병원 직원만
CREATE POLICY "staff_select" ON staff FOR SELECT TO authenticated USING (hospital_id = auth_hospital_id() AND auth_user_role() = 'hospital_staff');
CREATE POLICY "staff_insert" ON staff FOR INSERT TO authenticated WITH CHECK (hospital_id = auth_hospital_id() AND auth_user_role() = 'hospital_staff');
CREATE POLICY "staff_update" ON staff FOR UPDATE TO authenticated USING (hospital_id = auth_hospital_id() AND auth_user_role() = 'hospital_staff') WITH CHECK (hospital_id = auth_hospital_id());

-- equipment: 병원 직원만
CREATE POLICY "equipment_select" ON equipment FOR SELECT TO authenticated USING (hospital_id = auth_hospital_id() AND auth_user_role() = 'hospital_staff');
CREATE POLICY "equipment_insert" ON equipment FOR INSERT TO authenticated WITH CHECK (hospital_id = auth_hospital_id() AND auth_user_role() = 'hospital_staff');
CREATE POLICY "equipment_update" ON equipment FOR UPDATE TO authenticated USING (hospital_id = auth_hospital_id() AND auth_user_role() = 'hospital_staff') WITH CHECK (hospital_id = auth_hospital_id());

-- requests: 구급대원은 자기 요청, 병원은 자기 병원 요청
CREATE POLICY "requests_insert_paramedic" ON requests FOR INSERT TO authenticated WITH CHECK (paramedic_id = auth.uid() AND auth_user_role() = 'paramedic');
CREATE POLICY "requests_select_paramedic" ON requests FOR SELECT TO authenticated USING (paramedic_id = auth.uid() AND auth_user_role() = 'paramedic');
CREATE POLICY "requests_update_paramedic" ON requests FOR UPDATE TO authenticated USING (paramedic_id = auth.uid() AND auth_user_role() = 'paramedic') WITH CHECK (paramedic_id = auth.uid());
CREATE POLICY "requests_select_hospital" ON requests FOR SELECT TO authenticated USING (hospital_id = auth_hospital_id() AND auth_user_role() = 'hospital_staff');
CREATE POLICY "requests_update_hospital" ON requests FOR UPDATE TO authenticated USING (hospital_id = auth_hospital_id() AND auth_user_role() = 'hospital_staff') WITH CHECK (hospital_id = auth_hospital_id());

-- 6. REALTIME
ALTER PUBLICATION supabase_realtime ADD TABLE beds;
ALTER PUBLICATION supabase_realtime ADD TABLE patients;
ALTER PUBLICATION supabase_realtime ADD TABLE requests;
ALTER PUBLICATION supabase_realtime ADD TABLE equipment;
ALTER PUBLICATION supabase_realtime ADD TABLE hospitals;

-- 7. RPC: 병원 가용 현황 (구급대원용)
CREATE OR REPLACE FUNCTION get_hospital_availability()
RETURNS TABLE (
  hospital_id uuid, hospital_name text, accepting boolean,
  available_beds bigint, queue int, specialties text[],
  contact text, avg_wait_time int
) AS $$
  SELECT h.id, h.name, h.accepting,
    COUNT(b.id) FILTER (WHERE b.status = 'available'),
    h.queue, h.specialties, h.contact, h.avg_wait_time_min
  FROM hospitals h LEFT JOIN beds b ON b.hospital_id = h.id
  GROUP BY h.id;
$$ LANGUAGE sql STABLE SECURITY DEFINER;
