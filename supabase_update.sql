-- Update patients table with new fields from Face Sheet
ALTER TABLE patients 
ADD COLUMN IF NOT EXISTS preferred_name TEXT,
ADD COLUMN IF NOT EXISTS race TEXT,
ADD COLUMN IF NOT EXISTS religion TEXT,
ADD COLUMN IF NOT EXISTS marital_status TEXT,
ADD COLUMN IF NOT EXISTS primary_language TEXT,
ADD COLUMN IF NOT EXISTS height TEXT,
ADD COLUMN IF NOT EXISTS weight TEXT,
ADD COLUMN IF NOT EXISTS is_responsible_for_self BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS mds_date DATE,
ADD COLUMN IF NOT EXISTS hospital_of_choice TEXT,
ADD COLUMN IF NOT EXISTS start_of_service DATE,
ADD COLUMN IF NOT EXISTS occupation TEXT,
ADD COLUMN IF NOT EXISTS mothers_maiden_name TEXT,
ADD COLUMN IF NOT EXISTS primary_payer TEXT,
ADD COLUMN IF NOT EXISTS medicare_id TEXT,
ADD COLUMN IF NOT EXISTS medicaid_id TEXT,
ADD COLUMN IF NOT EXISTS other_insurance TEXT,
ADD COLUMN IF NOT EXISTS other_insurance_id TEXT,
-- Advanced Directives
ADD COLUMN IF NOT EXISTS living_will TEXT,
ADD COLUMN IF NOT EXISTS full_code TEXT,
ADD COLUMN IF NOT EXISTS organ_donation TEXT,
ADD COLUMN IF NOT EXISTS autopsy_request TEXT,
ADD COLUMN IF NOT EXISTS hospice TEXT,
ADD COLUMN IF NOT EXISTS dnr TEXT,
ADD COLUMN IF NOT EXISTS dni TEXT,
ADD COLUMN IF NOT EXISTS dnh TEXT,
ADD COLUMN IF NOT EXISTS feeding_restrictions TEXT,
ADD COLUMN IF NOT EXISTS medication_restrictions TEXT,
ADD COLUMN IF NOT EXISTS other_treatment_restrictions TEXT,
-- Emergency Contact
ADD COLUMN IF NOT EXISTS emergency_contact_name TEXT,
ADD COLUMN IF NOT EXISTS emergency_contact_phone TEXT,
ADD COLUMN IF NOT EXISTS emergency_contact_relationship TEXT,
ADD COLUMN IF NOT EXISTS emergency_contact_address TEXT,
-- Referral Source
ADD COLUMN IF NOT EXISTS referral_source_name TEXT,
ADD COLUMN IF NOT EXISTS referral_source_phone TEXT,
ADD COLUMN IF NOT EXISTS referral_source_email TEXT,
ADD COLUMN IF NOT EXISTS referral_source_fax TEXT,
ADD COLUMN IF NOT EXISTS referral_source_relationship TEXT,
ADD COLUMN IF NOT EXISTS referral_source_comment TEXT;

-- Update visits table for cancellation reasons
ALTER TABLE visits ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;

-- Create referrals table
CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referrer_name TEXT NOT NULL,
  patient_id UUID REFERENCES patients(id) ON DELETE SET NULL,
  phone TEXT,
  email TEXT,
  fax TEXT,
  relationship TEXT,
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for referrals
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Referrals are viewable by authenticated users" ON referrals FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Referrals are insertable by authenticated users" ON referrals FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Referrals are updatable by authenticated users" ON referrals FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Referrals are deletable by authenticated users" ON referrals FOR DELETE USING (auth.role() = 'authenticated');
