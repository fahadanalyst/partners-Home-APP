import { useQuery } from '@tanstack/react-query';
import { supabase } from '../services/supabase';

interface ComplianceStat {
  label: string;
  value: number;
  total: number;
  status: 'good' | 'warning' | 'critical';
}

const toStats = (total: number, carePlansCount: number, progressNotesCount: number): ComplianceStat[] => [
  {
    label: 'Care Plans (Active)',
    value: carePlansCount,
    total,
    status: total === 0 ? 'good' : carePlansCount / total > 0.9 ? 'good' : 'warning',
  },
  {
    label: 'Monthly Progress Notes',
    value: progressNotesCount,
    total,
    status: total === 0 ? 'good' : progressNotesCount / total > 0.8 ? 'good' : 'warning',
  },
  { label: 'Staff Certifications', value: 0, total: 0, status: 'good' },
  { label: 'Annual Assessments', value: total, total, status: 'good' },
];

const buildAlerts = (total: number, carePlansCount: number, progressNotesCount: number) => {
  const alerts: any[] = [];

  if (total > carePlansCount) {
    alerts.push({
      title: 'Missing Care Plan',
      patient: 'Multiple Patients',
      days: `${total - carePlansCount} patients missing care plans`,
    });
  }

  if (total > progressNotesCount) {
    alerts.push({
      title: 'Missing Progress Note',
      patient: 'Multiple Patients',
      days: `${total - progressNotesCount} notes due this month`,
    });
  }

  return alerts;
};

const fetchComplianceFallback = async () => {
  const [formsRes, totalPatientsRes, logsRes] = await Promise.all([
    supabase.from('forms').select('id, name').in('name', ['GAFC Progress Note', 'GAFC Care Plan']),
    supabase.from('patients').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    supabase
      .from('audit_logs')
      .select('id, action, entity_type, created_at')
      .order('created_at', { ascending: false })
      .limit(50),
  ]);

  const forms = formsRes.data || [];
  const progressNoteForm = forms.find((form: any) => form.name.includes('Progress Note'));
  const carePlanForm = forms.find((form: any) => form.name.includes('Care Plan'));

  const [progressNotesRes, carePlansRes] = await Promise.all([
    progressNoteForm?.id
      ? supabase
          .from('form_responses')
          .select('patient_id', { count: 'exact', head: true })
          .eq('form_id', progressNoteForm.id)
          .eq('status', 'submitted')
      : Promise.resolve({ count: 0 }),
    carePlanForm?.id
      ? supabase
          .from('form_responses')
          .select('patient_id', { count: 'exact', head: true })
          .eq('form_id', carePlanForm.id)
          .eq('status', 'submitted')
      : Promise.resolve({ count: 0 }),
  ]);

  const total = totalPatientsRes.count || 0;
  const progressNotesCount = progressNotesRes.count || 0;
  const carePlansCount = carePlansRes.count || 0;

  return {
    stats: toStats(total, carePlansCount, progressNotesCount),
    recentActivity: logsRes.data || [],
    criticalAlerts: buildAlerts(total, carePlansCount, progressNotesCount),
  };
};

const fetchCompliance = async () => {
  const { data, error } = await supabase.rpc('get_compliance_summary');

  if (!error && data) {
    const total = data.active_patients_total ?? 0;
    const carePlansCount = data.patients_with_current_care_plan ?? 0;
    const progressNotesCount = data.patients_with_monthly_progress_note ?? 0;

    return {
      stats: toStats(total, carePlansCount, progressNotesCount),
      recentActivity: data.recent_audit_logs ?? [],
      criticalAlerts: [
        ...(data.missing_care_plan_patients?.length
          ? [{
              title: 'Missing Care Plan',
              patient: `${data.missing_care_plan_patients.length} active patients`,
              days: `${data.missing_care_plan_patients.length} patients missing care plans`,
            }]
          : []),
        ...(data.missing_progress_note_patients?.length
          ? [{
              title: 'Missing Progress Note',
              patient: `${data.missing_progress_note_patients.length} active patients`,
              days: `${data.missing_progress_note_patients.length} notes due this month`,
            }]
          : []),
      ],
    };
  }

  return fetchComplianceFallback();
};

export const useComplianceSummary = () =>
  useQuery({
    queryKey: ['compliance-summary'],
    queryFn: fetchCompliance,
    staleTime: 2 * 60_000,
  });
