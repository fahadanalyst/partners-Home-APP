import { useQuery } from '@tanstack/react-query';
import { supabase } from '../services/supabase';

const emptyStats = {
  activePatients: 0,
  visitsThisWeek: 0,
  pendingForms: 0,
  submittedForms: 0,
  openReferrals: 0,
};

const buildActivityRange = (timeRange: string) => {
  const rangeDays = parseInt(timeRange, 10);
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const useWeeklyBuckets = rangeDays > 30;
  const bucketCount = useWeeklyBuckets ? Math.ceil(rangeDays / 7) : rangeDays;

  return Array.from({ length: bucketCount }).map((_, i) => {
    if (useWeeklyBuckets) {
      const end = new Date();
      end.setDate(end.getDate() - (bucketCount - 1 - i) * 7);
      const start = new Date(end);
      start.setDate(start.getDate() - 6);
      return {
        date: start.toISOString().split('T')[0],
        endDate: end.toISOString().split('T')[0],
        name: `${start.getMonth() + 1}/${start.getDate()}`,
      };
    }

    const d = new Date();
    d.setDate(d.getDate() - (bucketCount - 1 - i));
    return {
      date: d.toISOString().split('T')[0],
      endDate: d.toISOString().split('T')[0],
      name: rangeDays <= 7 ? days[d.getDay()] : `${d.getMonth() + 1}/${d.getDate()}`,
    };
  });
};

const fetchDashboardSummaryFallback = async (timeRange: string) => {
  const startOfWeek = new Date();
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());

  const activityRange = buildActivityRange(timeRange);
  const rangeStart = activityRange[0]?.date;

  const [
    patientCountRes,
    visitCountRes,
    pendingCountRes,
    submittedCountRes,
    referralCountRes,
    logsRes,
    recentVisitsRes,
    recentFormsRes,
  ] = await Promise.all([
    supabase.from('patients').select('id', { count: 'estimated', head: true }),
    supabase.from('visits').select('id', { count: 'estimated', head: true }).gte('scheduled_at', startOfWeek.toISOString()),
    supabase.from('form_responses').select('id', { count: 'estimated', head: true }).eq('status', 'draft'),
    supabase.from('form_responses').select('id', { count: 'estimated', head: true }).eq('status', 'submitted'),
    supabase.from('referrals').select('id', { count: 'estimated', head: true }).eq('status', 'Pending'),
    supabase.from('audit_logs').select('id, action, entity_type, created_at').order('created_at', { ascending: false }).limit(20),
    supabase.from('visits').select('scheduled_at').gte('scheduled_at', rangeStart),
    supabase.from('form_responses').select('created_at').gte('created_at', rangeStart),
  ]);

  let recentActivity = (logsRes.data || []).map((log: any) => ({
    id: `audit-${log.id}`,
    action: log.action,
    label: `${log.action} on ${log.entity_type ?? 'record'}`,
    created_at: log.created_at,
  }));

  if (recentActivity.length < 5) {
    const [recentFormResponses, recentPatients, recentReferrals, recentVisits2] = await Promise.all([
      supabase
        .from('form_responses')
        .select('id, status, created_at, updated_at, forms(name), patients(first_name, last_name)')
        .order('updated_at', { ascending: false })
        .limit(10),
      supabase
        .from('patients')
        .select('id, first_name, last_name, created_at')
        .order('created_at', { ascending: false })
        .limit(5),
      supabase
        .from('referrals')
        .select('id, referrer_name, status, created_at, updated_at')
        .order('updated_at', { ascending: false })
        .limit(5),
      supabase
        .from('visits')
        .select('id, scheduled_at, status, created_at, patients(first_name, last_name)')
        .order('created_at', { ascending: false })
        .limit(5),
    ]);

    const derived: any[] = [];

    (recentFormResponses.data || []).forEach((fr: any) => {
      const formName = fr.forms?.name ?? 'Form';
      const patientName = fr.patients ? `${fr.patients.first_name} ${fr.patients.last_name}` : '';
      const wasUpdated = fr.updated_at && fr.updated_at !== fr.created_at;
      derived.push({
        id: `form-${fr.id}`,
        action: wasUpdated ? 'UPDATE' : 'INSERT',
        label: `${formName}${fr.status === 'draft' ? ' saved as draft' : wasUpdated ? ' updated' : ' submitted'}${patientName ? ` for ${patientName}` : ''}`,
        created_at: fr.updated_at || fr.created_at,
      });
    });

    (recentPatients.data || []).forEach((p: any) => {
      derived.push({
        id: `patient-${p.id}`,
        action: 'INSERT',
        label: `New patient added: ${p.first_name} ${p.last_name}`,
        created_at: p.created_at,
      });
    });

    (recentReferrals.data || []).forEach((r: any) => {
      const wasUpdated = r.updated_at && r.updated_at !== r.created_at;
      derived.push({
        id: `referral-${r.id}`,
        action: wasUpdated ? 'UPDATE' : 'INSERT',
        label: `Referral from ${r.referrer_name}${wasUpdated ? ` marked ${r.status}` : ' received'}`,
        created_at: r.updated_at || r.created_at,
      });
    });

    (recentVisits2.data || []).forEach((v: any) => {
      const patientName = v.patients ? `${v.patients.first_name} ${v.patients.last_name}` : 'patient';
      derived.push({
        id: `visit-${v.id}`,
        action: 'INSERT',
        label: `Visit scheduled for ${patientName}`,
        created_at: v.created_at,
      });
    });

    recentActivity = [...recentActivity, ...derived]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  const activityData = activityRange.map(bucket => {
    const visits = recentVisitsRes.data?.filter((v: any) => {
      const d = v.scheduled_at.split('T')[0];
      return d >= bucket.date && d <= bucket.endDate;
    }).length || 0;
    const forms = recentFormsRes.data?.filter((f: any) => {
      const d = f.created_at.split('T')[0];
      return d >= bucket.date && d <= bucket.endDate;
    }).length || 0;
    return { name: bucket.name, visits, forms };
  });

  return {
    stats: {
      activePatients: patientCountRes.count || 0,
      visitsThisWeek: visitCountRes.count || 0,
      pendingForms: pendingCountRes.count || 0,
      submittedForms: submittedCountRes.count || 0,
      openReferrals: referralCountRes.count || 0,
    },
    recentActivity: recentActivity.slice(0, 5),
    activityData,
  };
};

const fetchDashboardSummary = async (timeRange: string) => {
  const { data, error } = await supabase.rpc('get_dashboard_summary', {
    range_days: parseInt(timeRange, 10),
  });

  if (!error && data) {
    return {
      stats: {
        activePatients: data.active_patients_count ?? 0,
        visitsThisWeek: data.visits_this_week_count ?? 0,
        pendingForms: data.draft_forms_count ?? 0,
        submittedForms: data.submitted_forms_count ?? 0,
        openReferrals: data.open_referrals_count ?? 0,
      },
      recentActivity: data.recent_activity ?? [],
      activityData: data.chart_buckets ?? [],
    };
  }

  return fetchDashboardSummaryFallback(timeRange);
};

export const useDashboardSummary = (timeRange: string) =>
  useQuery({
    queryKey: ['dashboard-summary', timeRange],
    queryFn: () => fetchDashboardSummary(timeRange),
    placeholderData: {
      stats: emptyStats,
      recentActivity: [],
      activityData: [],
    },
    staleTime: 30_000,
  });

export const useSubmittedForms = (page: number, pageSize: number) =>
  useQuery({
    queryKey: ['submitted-forms', page, pageSize],
    queryFn: async () => {
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      const { data, error, count } = await supabase
        .from('form_responses')
        .select(`
          id, created_at, status, form_id, patient_id, storage_path, data,
          forms(name),
          patients(first_name, last_name)
        `, { count: 'estimated' })
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;
      return { forms: data || [], total: count || 0 };
    },
    staleTime: 30_000,
  });
