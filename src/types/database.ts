// ============================================================
// DB Schema-aligned TypeScript types
// Source of truth: supabase/migrations/00001_initial_schema.sql
// ============================================================

// -- ENUM TYPES --

export type UserRole = 'hospital_staff' | 'paramedic';
export type BedStatus = 'occupied' | 'available' | 'maintenance' | 'cleaning';
export type PatientSeverity = 'critical' | 'urgent' | 'stable';
export type PatientStatus = 'waiting' | 'treating' | 'stable' | 'discharged';
export type StaffRole = 'doctor' | 'nurse' | 'technician' | 'admin';
export type StaffShift = 'day' | 'night' | 'evening';
export type StaffStatus = 'on_duty' | 'off_duty' | 'break' | 'emergency';
export type EquipmentType = 'monitor' | 'ventilator' | 'defibrillator' | 'xray' | 'ultrasound' | 'infusion' | 'other';
export type EquipmentStatus = 'operational' | 'maintenance' | 'error' | 'offline';
export type RequestStatus = 'pending' | 'matched' | 'en_route' | 'completed' | 'cancelled';
export type RequestPriority = 'emergency' | 'urgent' | 'normal';

// -- JSONB STRUCTURES --

export interface PatientVitals {
  heart_rate?: number;
  blood_pressure?: string;
  temperature?: number;
  oxygen_saturation?: number;
}

// -- TABLE ROW TYPES --

export interface Hospital {
  id: string;
  name: string;
  accepting: boolean;
  queue: number;
  specialties: string[];
  contact: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  avg_wait_time_min: number | null;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  hospital_id: string | null;
  role: UserRole;
  display_name: string;
  phone: string | null;
  email: string | null;
  created_at: string;
  updated_at: string;
}

export interface Bed {
  id: string;
  hospital_id: string;
  section: string;
  number: string;
  status: BedStatus;
  last_cleaned: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Patient {
  id: string;
  hospital_id: string;
  bed_id: string | null;
  name: string;
  age: number | null;
  gender: string | null;
  diagnosis: string | null;
  severity: PatientSeverity;
  status: PatientStatus;
  admission_time: string;
  discharge_time: string | null;
  vitals: PatientVitals;
  allergies: string[];
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Staff {
  id: string;
  hospital_id: string;
  profile_id: string | null;
  name: string;
  role: StaffRole;
  department: string | null;
  shift: StaffShift;
  status: StaffStatus;
  phone: string | null;
  email: string | null;
  specialization: string | null;
  years_of_experience: number;
  current_location: string | null;
  shift_start: string | null;
  shift_end: string | null;
  certifications: string[];
  emergency_contact: string | null;
  created_at: string;
  updated_at: string;
}

export interface Equipment {
  id: string;
  hospital_id: string;
  assigned_bed_id: string | null;
  name: string;
  type: EquipmentType;
  model: string | null;
  manufacturer: string | null;
  status: EquipmentStatus;
  location: string | null;
  last_maintenance: string | null;
  next_maintenance: string | null;
  battery_level: number | null;
  usage_hours: number;
  alerts: string[];
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Request {
  id: string;
  hospital_id: string | null;
  paramedic_id: string;
  status: RequestStatus;
  priority: RequestPriority;
  severity: number;
  symptom: string;
  patient_name: string | null;
  patient_age: number | null;
  patient_gender: string | null;
  allergies: string[];
  vitals: PatientVitals;
  distance_km: number | null;
  eta_minutes: number | null;
  location_text: string | null;
  latitude: number | null;
  longitude: number | null;
  notes: string | null;
  requested_at: string;
  matched_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

// -- RPC RETURN TYPES --

export interface HospitalAvailability {
  hospital_id: string;
  hospital_name: string;
  accepting: boolean;
  available_beds: number;
  queue: number;
  specialties: string[];
  contact: string | null;
  avg_wait_time: number | null;
}
