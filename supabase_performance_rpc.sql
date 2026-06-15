-- Performance RPCs and views for Partners Home App.
-- Run this after supabase_performance_indexes.sql in the Supabase SQL editor.

CREATE OR REPLACE VIEW patient_list_view AS
SELECT
  p.id,
  p.first_name,
  p.last_name,
  p.dob,
  p.gender,
  p.phone,
  p.email,
  p.status,
  p.created_at,
  p.last_monthly_visit,
  p.last_annual_physical,
  p.last_semi_annual_report,
  lv.last_verified_visit
FROM patients p
LEFT JOIN LATERAL (
  SELECT v.scheduled_at AS last_verified_visit
  FROM visits v
  WHERE v.patient_id = p.id
    AND v.status = 'Verified'
  ORDER BY v.scheduled_at DESC
  LIMIT 1
) lv ON true;

CREATE OR REPLACE FUNCTION get_dashboard_summary(range_days integer DEFAULT 7)
RETURNS jsonb
LANGUAGE sql
STABLE
AS $$
WITH bounds AS (
  SELECT
    greatest(range_days, 1) AS days,
    date_trunc('week', now()) AS week_start,
    (current_date - (greatest(range_days, 1) - 1))::date AS range_start
),
counts AS (
  SELECT
    (SELECT count(*) FROM patients) AS active_patients_count,
    (SELECT count(*) FROM visits, bounds WHERE scheduled_at >= bounds.week_start) AS visits_this_week_count,
    (SELECT count(*) FROM form_responses WHERE status = 'draft') AS draft_forms_count,
    (SELECT count(*) FROM form_responses WHERE status = 'submitted') AS submitted_forms_count,
    (SELECT count(*) FROM referrals WHERE status = 'Pending') AS open_referrals_count
),
chart_days AS (
  SELECT generate_series(
    (SELECT range_start FROM bounds),
    current_date,
    interval '1 day'
  )::date AS bucket_date
),
chart AS (
  SELECT jsonb_agg(
    jsonb_build_object(
      'name', to_char(cd.bucket_date, 'Dy'),
      'visits', (
        SELECT count(*)
        FROM visits v
        WHERE v.scheduled_at::date = cd.bucket_date
      ),
      'forms', (
        SELECT count(*)
        FROM form_responses fr
        WHERE fr.created_at::date = cd.bucket_date
      )
    )
    ORDER BY cd.bucket_date
  ) AS chart_buckets
  FROM chart_days cd
),
activity AS (
  SELECT coalesce(jsonb_agg(row_data ORDER BY created_at DESC), '[]'::jsonb) AS recent_activity
  FROM (
    SELECT
      al.created_at,
      jsonb_build_object(
        'id', 'audit-' || al.id::text,
        'action', al.action,
        'label', al.action || ' on ' || coalesce(al.entity_type, 'record'),
        'created_at', al.created_at
      ) AS row_data
    FROM audit_logs al
    ORDER BY al.created_at DESC
    LIMIT 5
  ) s
)
SELECT jsonb_build_object(
  'active_patients_count', counts.active_patients_count,
  'visits_this_week_count', counts.visits_this_week_count,
  'draft_forms_count', counts.draft_forms_count,
  'submitted_forms_count', counts.submitted_forms_count,
  'open_referrals_count', counts.open_referrals_count,
  'chart_buckets', coalesce(chart.chart_buckets, '[]'::jsonb),
  'recent_activity', activity.recent_activity
)
FROM counts, chart, activity;
$$;

CREATE OR REPLACE FUNCTION get_compliance_summary()
RETURNS jsonb
LANGUAGE sql
STABLE
AS $$
WITH form_ids AS (
  SELECT
    max(id) FILTER (WHERE name = 'GAFC Progress Note') AS progress_note_form_id,
    max(id) FILTER (WHERE name = 'GAFC Care Plan') AS care_plan_form_id
  FROM forms
),
active_patients AS (
  SELECT id, first_name, last_name
  FROM patients
  WHERE status = 'active'
),
care_plan_patients AS (
  SELECT DISTINCT fr.patient_id
  FROM form_responses fr, form_ids
  WHERE fr.form_id = form_ids.care_plan_form_id
    AND fr.status = 'submitted'
),
monthly_progress_patients AS (
  SELECT DISTINCT fr.patient_id
  FROM form_responses fr, form_ids
  WHERE fr.form_id = form_ids.progress_note_form_id
    AND fr.status = 'submitted'
    AND fr.created_at >= date_trunc('month', now())
),
missing_care_plan AS (
  SELECT ap.id, ap.first_name, ap.last_name
  FROM active_patients ap
  LEFT JOIN care_plan_patients cp ON cp.patient_id = ap.id
  WHERE cp.patient_id IS NULL
),
missing_progress_note AS (
  SELECT ap.id, ap.first_name, ap.last_name
  FROM active_patients ap
  LEFT JOIN monthly_progress_patients mp ON mp.patient_id = ap.id
  WHERE mp.patient_id IS NULL
),
activity AS (
  SELECT coalesce(jsonb_agg(row_data ORDER BY created_at DESC), '[]'::jsonb) AS recent_audit_logs
  FROM (
    SELECT
      al.created_at,
      jsonb_build_object(
        'id', al.id,
        'action', al.action,
        'entity_type', al.entity_type,
        'created_at', al.created_at
      ) AS row_data
    FROM audit_logs al
    ORDER BY al.created_at DESC
    LIMIT 50
  ) s
)
SELECT jsonb_build_object(
  'active_patients_total', (SELECT count(*) FROM active_patients),
  'patients_with_current_care_plan', (SELECT count(*) FROM care_plan_patients),
  'patients_with_monthly_progress_note', (SELECT count(*) FROM monthly_progress_patients),
  'missing_care_plan_patients', coalesce((
    SELECT jsonb_agg(jsonb_build_object('id', id, 'first_name', first_name, 'last_name', last_name))
    FROM missing_care_plan
  ), '[]'::jsonb),
  'missing_progress_note_patients', coalesce((
    SELECT jsonb_agg(jsonb_build_object('id', id, 'first_name', first_name, 'last_name', last_name))
    FROM missing_progress_note
  ), '[]'::jsonb),
  'recent_audit_logs', activity.recent_audit_logs
)
FROM activity;
$$;
