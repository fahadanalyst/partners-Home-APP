-- Focused performance indexes for common app loading paths.
-- Run this once in the Supabase SQL editor.

CREATE INDEX IF NOT EXISTS idx_forms_active_name
  ON forms (is_active, name);

CREATE INDEX IF NOT EXISTS idx_form_responses_created_at
  ON form_responses (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_form_responses_status_created_at
  ON form_responses (status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_form_responses_form_status
  ON form_responses (form_id, status);

CREATE INDEX IF NOT EXISTS idx_form_responses_patient_form_created_at
  ON form_responses (patient_id, form_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_form_responses_visit_status
  ON form_responses (visit_id, status);

CREATE INDEX IF NOT EXISTS idx_form_responses_staff_created_at
  ON form_responses (staff_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_visits_scheduled_at
  ON visits (scheduled_at);

CREATE INDEX IF NOT EXISTS idx_visits_patient_scheduled_at
  ON visits (patient_id, scheduled_at DESC);

CREATE INDEX IF NOT EXISTS idx_visits_staff_scheduled_at
  ON visits (staff_id, scheduled_at DESC);

CREATE INDEX IF NOT EXISTS idx_visits_status_scheduled_at
  ON visits (status, scheduled_at DESC);

CREATE INDEX IF NOT EXISTS idx_patients_last_first_name
  ON patients (last_name, first_name);

CREATE INDEX IF NOT EXISTS idx_patients_status
  ON patients (status);

CREATE INDEX IF NOT EXISTS idx_referrals_status_updated_at
  ON referrals (status, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at
  ON audit_logs (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_clinical_notes_visit_id
  ON clinical_notes (visit_id);

CREATE INDEX IF NOT EXISTS idx_clinical_notes_patient_created_at
  ON clinical_notes (patient_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_files_patient_created_at
  ON files (patient_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_medical_providers_last_first_name
  ON medical_providers (last_name, first_name);

ANALYZE forms;
ANALYZE form_responses;
ANALYZE visits;
ANALYZE patients;
ANALYZE referrals;
ANALYZE audit_logs;
ANALYZE clinical_notes;
ANALYZE files;
ANALYZE medical_providers;
