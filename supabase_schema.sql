-- HIPAA-aligned Clinical Management System Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Roles Enum
CREATE TYPE user_role AS ENUM ('admin', 'manager', 'frontdesk', 'clinical_worker', 'reviewer', 'nurse');

-- 2. Profiles (Extends Auth Users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role user_role NOT NULL DEFAULT 'clinical_worker',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Medical Providers
CREATE TABLE medical_providers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  facility_name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  fax TEXT,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Patients
CREATE TABLE patients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  dob DATE NOT NULL,
  gender TEXT,
  ssn_encrypted TEXT, -- PHI
  address_line1 TEXT,
  address_line2 TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  phone TEXT,
  email TEXT,
  insurance_id TEXT,
  status TEXT DEFAULT 'active',
  mloa_days INTEGER DEFAULT 0,
  nmloa_days INTEGER DEFAULT 0,
  last_annual_physical DATE,
  last_semi_annual_report DATE,
  last_monthly_visit DATE,
  preferred_name TEXT,
  race TEXT,
  religion TEXT,
  marital_status TEXT,
  primary_language TEXT,
  height TEXT,
  weight TEXT,
  is_responsible_for_self BOOLEAN DEFAULT true,
  mds_date DATE,
  hospital_of_choice TEXT,
  start_of_service DATE,
  occupation TEXT,
  mothers_maiden_name TEXT,
  primary_payer TEXT,
  medicare_id TEXT,
  medicaid_id TEXT,
  other_insurance TEXT,
  other_insurance_id TEXT,
  living_will TEXT,
  full_code TEXT,
  organ_donation TEXT,
  autopsy_request TEXT,
  hospice TEXT,
  dnr TEXT,
  dni TEXT,
  dnh TEXT,
  feeding_restrictions TEXT,
  medication_restrictions TEXT,
  other_treatment_restrictions TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  emergency_contact_relationship TEXT,
  emergency_contact_address JSONB, -- {street, apt, city, state, zip}
  pcp_id UUID REFERENCES medical_providers(id),
  other_provider_ids UUID[],
  diagnoses JSONB DEFAULT '[]'::jsonb, -- [{disease, icd10}]
  medications JSONB DEFAULT '[]'::jsonb, -- [{medicine, dosage, schedule}]
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Schedules / Visits
CREATE TYPE visit_status AS ENUM ('scheduled', 'in-progress', 'completed', 'reviewed', 'approved', 'archived');

CREATE TABLE visits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE NOT NULL,
  staff_id UUID REFERENCES profiles(id) NOT NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'Scheduled',
  notes TEXT,
  cancellation_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Referrals
CREATE TABLE referrals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referrer_name TEXT NOT NULL,
  patient_id UUID REFERENCES patients(id) ON DELETE SET NULL,
  phone TEXT,
  email TEXT,
  fax TEXT,
  relationship TEXT,
  comment TEXT,
  status TEXT DEFAULT 'Pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Form Definitions
CREATE TABLE forms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  schema JSONB NOT NULL, -- Dynamic form structure
  version INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Form Responses
CREATE TABLE form_responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  form_id UUID REFERENCES forms(id) NOT NULL,
  visit_id UUID REFERENCES visits(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE NOT NULL,
  staff_id UUID REFERENCES profiles(id) NOT NULL,
  data JSONB NOT NULL,
  status TEXT DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Clinical Notes
CREATE TABLE clinical_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  visit_id UUID REFERENCES visits(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE NOT NULL,
  staff_id UUID REFERENCES profiles(id) NOT NULL,
  content TEXT NOT NULL,
  icd_codes TEXT[],
  cpt_codes TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Signatures
CREATE TABLE signatures (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  parent_id UUID NOT NULL, -- ID of form_response or clinical_note
  parent_type TEXT NOT NULL, -- 'form_response' or 'clinical_note'
  signer_id UUID REFERENCES profiles(id) NOT NULL,
  signature_data TEXT NOT NULL, -- Base64 or path to storage
  signed_at TIMESTAMPTZ DEFAULT NOW(),
  ip_address TEXT
);

-- 9. Audit Logs
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  old_data JSONB,
  new_data JSONB,
  severity TEXT DEFAULT 'info',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Files
CREATE TABLE files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  uploaded_by UUID REFERENCES profiles(id),
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT,
  is_encrypted BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS POLICIES (Example for Profiles)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by authenticated users"
  ON profiles FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- 12. Create Dummy Users (Run this in SQL Editor)
-- Note: Passwords are set to 'Password123' (hashed)
-- You may need to enable the pgcrypto extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
  admin_id UUID := uuid_generate_v4();
  manager_id UUID := uuid_generate_v4();
  worker_id UUID := uuid_generate_v4();
  frontdesk_id UUID := uuid_generate_v4();
  reviewer_id UUID := uuid_generate_v4();
  nurse_id UUID := uuid_generate_v4();
  password_hash TEXT := crypt('Password123', gen_salt('bf'));
BEGIN
  -- Admin
  INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, aud, role)
  VALUES (admin_id, 'admin@clinicaflow.com', password_hash, now(), '{"provider":"email","providers":["email"]}', '{"full_name":"System Admin"}', 'authenticated', 'authenticated');
  INSERT INTO public.profiles (id, email, full_name, role) VALUES (admin_id, 'admin@clinicaflow.com', 'System Admin', 'admin');

  -- Manager
  INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, aud, role)
  VALUES (manager_id, 'manager@clinicaflow.com', password_hash, now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Clinic Manager"}', 'authenticated', 'authenticated');
  INSERT INTO public.profiles (id, email, full_name, role) VALUES (manager_id, 'manager@clinicaflow.com', 'Clinic Manager', 'manager');

  -- Clinical Worker
  INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, aud, role)
  VALUES (worker_id, 'worker@clinicaflow.com', password_hash, now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Clinical Worker"}', 'authenticated', 'authenticated');
  INSERT INTO public.profiles (id, email, full_name, role) VALUES (worker_id, 'worker@clinicaflow.com', 'Clinical Worker', 'clinical_worker');

  -- Front Desk
  INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, aud, role)
  VALUES (frontdesk_id, 'frontdesk@clinicaflow.com', password_hash, now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Front Desk"}', 'authenticated', 'authenticated');
  INSERT INTO public.profiles (id, email, full_name, role) VALUES (frontdesk_id, 'frontdesk@clinicaflow.com', 'Front Desk', 'frontdesk');

  -- Reviewer
  INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, aud, role)
  VALUES (reviewer_id, 'reviewer@clinicaflow.com', password_hash, now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Compliance Reviewer"}', 'authenticated', 'authenticated');
  INSERT INTO public.profiles (id, email, full_name, role) VALUES (reviewer_id, 'reviewer@clinicaflow.com', 'Compliance Reviewer', 'reviewer');

  -- Nurse
  INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, aud, role)
  VALUES (nurse_id, 'nurse@clinicaflow.com', password_hash, now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Staff Nurse"}', 'authenticated', 'authenticated');
  INSERT INTO public.profiles (id, email, full_name, role) VALUES (nurse_id, 'nurse@clinicaflow.com', 'Staff Nurse', 'nurse');
END $$;

-- Seed GAFC Forms
INSERT INTO forms (id, name, description, schema) VALUES 
('e1b1b1b1-b1b1-b1b1-b1b1-e1b1b1b1b1b1', 'GAFC Progress Note', 'Monthly GAFC clinical progress note', '{}'),
('e2b2b2b2-b2b2-b2b2-b2b2-e2b2b2b2b2b2', 'GAFC Care Plan', 'MassHealth GAFC Program Care Plan', '{}'),
('e3b3b3b3-b3b3-b3b3-b3b3-e3b3b3b3b3b3', 'Physician Summary (PSF-1)', 'Physician summary for GAFC services', '{}'),
('e4b4b4b4-b4b4-b4b4-b4b4-e4b4b4b4b4b4', 'Request for Services (RFS-1)', 'Request for GAFC services', '{}'),
('e5b5b5b5-b5b5-b5b5-b5b5-e5b5b5b5b5b5', 'Patient Resource Data', 'Patient demographic and resource information', '{}'),
('e6b6b6b6-b6b6-b6b6-b6b6-e6b6b6b6b6b6', 'Physician Orders', 'Physician orders for clinical care', '{}'),
('e7b7b7b7-b7b7-b7b7-b7b7-e7b7b7b7b7b7', 'MDS Assessment', 'Minimum Data Set assessment', '{}'),
('e8b8b8b8-b8b8-b8b8-b8b8-e8b8b8b8b8b8', 'Nursing Assessment', 'Comprehensive nursing assessment', '{}'),
('e9b9b9b9-b9b9-b9b9-b9b9-e9b9b9b9b9b9', 'Medication Administration Record', 'Monthly MAR tracking', '{}'),
('f1b1b1b1-b1b1-b1b1-b1b1-f1b1b1b1b1b1', 'Treatment Administration Record', 'Monthly TAR tracking', '{}'),
('f2b2b2b2-b2b2-b2b2-b2b2-f2b2b2b2b2b2', 'Clinical Note', 'General clinical documentation', '{}')
ON CONFLICT (id) DO NOTHING;

