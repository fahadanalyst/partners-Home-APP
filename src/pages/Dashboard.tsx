import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Calendar, 
  FileText, 
  TrendingUp,
  ShieldCheck,
  CheckCircle,
  ClipboardList,
  UserPlus,
  ArrowRight,
  RefreshCw,
  Settings,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Trash2,
  AlertCircle,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/Button';
import { supabase } from '../services/supabase';
import { clsx } from 'clsx';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
} from 'recharts';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { useDashboardSummary, useSubmittedForms } from '../queries/dashboard';

const FORMS_PER_PAGE = 10;

const FORM_ROUTES: Record<string, string> = {
  'GAFC Progress Note': '/progress-note',
  'GAFC Care Plan': '/care-plan',
  'Physician Summary (PSF-1)': '/physician-summary',
  'Request for Services (RFS-1)': '/request-for-services',
  'Patient Resource Data': '/patient-resource-data',
  'Physician Orders': '/physician-orders',
  'MDS Assessment': '/mds-assessment',
  'Nursing Assessment': '/nursing-assessment',
  'Medication Administration Record (MAR)': '/mar',
  'Treatment Administration Record (TAR)': '/tar',
  'Clinical Note': '/clinical-note-form',
  'Semi-Annual Health Status Report': '/semi-annual-health-status',
  'GAFC Aide Care Plan': '/gafc-aide-care-plan',
  'Medication List': '/medication-list',
  'Home Safety Inspection': '/home-safety-inspection',
  'CIRF': '/cirf',
  'Admission Assessment': '/admission-assessment',
  'Discharge Summary': '/discharge-summary',
};

const statusStyle = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'submitted': return 'bg-emerald-100 text-emerald-700';
    case 'draft':     return 'bg-amber-100 text-amber-700';
    case 'reviewed':  return 'bg-blue-100 text-blue-700';
    case 'approved':  return 'bg-partners-blue-dark/10 text-partners-blue-dark';
    default:          return 'bg-zinc-100 text-zinc-600';
  }
};

const StatCard = ({ title, value, icon: Icon, trend, color, loading }: any) => {
  const getIconColor = (bgClass: string) => {
    if (bgClass.includes('blue')) return 'text-blue-600';
    if (bgClass.includes('emerald')) return 'text-emerald-600';
    if (bgClass.includes('amber')) return 'text-amber-600';
    if (bgClass.includes('rose')) return 'text-rose-600';
    if (bgClass.includes('violet')) return 'text-violet-600';
    return 'text-zinc-600';
  };

  return (
    <div className="bg-white p-5 rounded-2xl border border-zinc-100 shadow-sm hover:border-partners-blue-dark/30 hover:shadow-md transition-all duration-200">
      <div className="flex justify-between items-start mb-3">
        <div className={`p-2.5 rounded-xl ${color} bg-opacity-10`}>
          <Icon className={getIconColor(color)} size={20} />
        </div>
        {trend && (
          <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
            {trend}
          </span>
        )}
      </div>
      <h3 className="text-zinc-500 text-xs font-medium uppercase tracking-wide">{title}</h3>
      {loading ? (
        <div className="h-7 w-14 bg-zinc-100 animate-pulse rounded mt-1.5"></div>
      ) : (
        <p className="text-2xl font-bold text-zinc-900 mt-1">{value}</p>
      )}
    </div>
  );
};

export const Dashboard: React.FC = () => {
  const { profile } = useAuth();
  const [stats, setStats] = useState({
    activePatients: 0,
    visitsThisWeek: 0,
    pendingForms: 0,
    submittedForms: 0,
    openReferrals: 0,
  });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [activityData, setActivityData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7');

  // Submitted forms table state
  const [allForms, setAllForms] = useState<any[]>([]);
  const [formsLoading, setFormsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalForms, setTotalForms] = useState(0);

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const dashboardSummaryQuery = useDashboardSummary(timeRange);
  const submittedFormsQuery = useSubmittedForms(currentPage, FORMS_PER_PAGE);

  useEffect(() => {
    const summary = dashboardSummaryQuery.data;
    if (!summary) return;

    setStats(summary.stats);
    setRecentActivity(summary.recentActivity);
    setActivityData(summary.activityData);
    setLoading(dashboardSummaryQuery.isLoading || dashboardSummaryQuery.isFetching);
  }, [dashboardSummaryQuery.data, dashboardSummaryQuery.isLoading, dashboardSummaryQuery.isFetching]);

  useEffect(() => {
    const result = submittedFormsQuery.data;
    if (!result) return;

    setAllForms(result.forms);
    setTotalForms(result.total);
    setFormsLoading(submittedFormsQuery.isLoading || submittedFormsQuery.isFetching);
  }, [submittedFormsQuery.data, submittedFormsQuery.isLoading, submittedFormsQuery.isFetching]);

  const fetchSubmittedForms = async () => {
    setFormsLoading(true);
    try {
      const from = (currentPage - 1) * FORMS_PER_PAGE;
      const to = from + FORMS_PER_PAGE - 1;

      const { data, error, count } = await supabase
        .from('form_responses')
        .select(`
          id, created_at, status, form_id, patient_id, storage_path, data,
          forms(name),
          patients(first_name, last_name)
        `, { count: 'estimated' })
        .order('created_at', { ascending: false })
        .range(from, to);

      if (!error) {
        setAllForms(data || []);
        setTotalForms(count || 0);
      }
    } catch (err) {
      console.error('Error fetching submitted forms:', err);
    } finally {
      setFormsLoading(false);
    }
  };

  // ── Delete a submitted form everywhere: storage file + DB row(s) ───────────
  const handleDeleteForm = async (form: any) => {
    if (!form?.id) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      // 1. Resolve the storage file path (top-level column or nested in data JSON)
      const storagePath =
        form.storage_path ||
        form.data?.storage_path ||
        form.data?.pdf_storage_path;

      // 2. Remove the file from the pdf-submissions bucket, if any
      if (storagePath) {
        const { error: storageErr } = await supabase.storage
          .from('pdf-submissions')
          .remove([storagePath]);
        // Don't block the DB delete if the file is already missing
        if (storageErr) console.warn('[Dashboard] storage delete warning:', storageErr.message);
      }

      // 3. Remove any signatures linked to this form response
      const { error: sigErr } = await supabase
        .from('signatures')
        .delete()
        .eq('parent_id', form.id)
        .eq('parent_type', 'form_response');
      if (sigErr) console.warn('[Dashboard] signatures delete warning:', sigErr.message);

      // 4. Remove the form_responses row itself
      const { error: dbErr } = await supabase
        .from('form_responses')
        .delete()
        .eq('id', form.id);
      if (dbErr) throw dbErr;

      // 5. Refresh the table (step back a page if this was the last row on it)
      if (allForms.length === 1 && currentPage > 1) {
        setCurrentPage(p => p - 1);
      } else {
        await fetchSubmittedForms();
      }

      setDeleteTarget(null);
    } catch (err: any) {
      console.error('[Dashboard] delete form error:', err);
      setDeleteError(err?.message ?? 'Failed to delete this form.');
    } finally {
      setIsDeleting(false);
    }
  };

  const fetchDashboardDataFast = async () => {
    try {
      setLoading(true);

      const startOfWeek = new Date();
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());

      const rangeDays = parseInt(timeRange);
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const useWeeklyBuckets = rangeDays > 30;
      const bucketCount = useWeeklyBuckets ? Math.ceil(rangeDays / 7) : rangeDays;

      const activityRange = Array.from({ length: bucketCount }).map((_, i) => {
        if (useWeeklyBuckets) {
          const end = new Date();
          end.setDate(end.getDate() - (bucketCount - 1 - i) * 7);
          const start = new Date(end);
          start.setDate(start.getDate() - 6);
          return {
            date: start.toISOString().split('T')[0],
            endDate: end.toISOString().split('T')[0],
            name: `${start.getMonth() + 1}/${start.getDate()}`,
            visits: 0,
            forms: 0,
          };
        }

        const d = new Date();
        d.setDate(d.getDate() - (bucketCount - 1 - i));
        return {
          date: d.toISOString().split('T')[0],
          endDate: d.toISOString().split('T')[0],
          name: rangeDays <= 7 ? days[d.getDay()] : `${d.getMonth() + 1}/${d.getDate()}`,
          visits: 0,
          forms: 0,
        };
      });

      const rangeStart = activityRange[0].date;

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
        supabase.from('patients').select('*', { count: 'estimated', head: true }),
        supabase.from('visits').select('*', { count: 'estimated', head: true }).gte('scheduled_at', startOfWeek.toISOString()),
        supabase.from('form_responses').select('*', { count: 'estimated', head: true }).eq('status', 'draft'),
        supabase.from('form_responses').select('*', { count: 'estimated', head: true }).eq('status', 'submitted'),
        supabase.from('referrals').select('*', { count: 'estimated', head: true }).eq('status', 'Pending'),
        supabase.from('audit_logs').select('id, action, entity_type, created_at').order('created_at', { ascending: false }).limit(20),
        supabase.from('visits').select('scheduled_at').gte('scheduled_at', rangeStart),
        supabase.from('form_responses').select('created_at').gte('created_at', rangeStart),
      ]);

      let activityFeed: any[] = (logsRes.data || []).map(l => ({
        id: `audit-${l.id}`,
        action: l.action,
        label: `${l.action} on ${l.entity_type ?? 'record'}`,
        created_at: l.created_at,
      }));

      if (activityFeed.length < 5) {
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

        activityFeed = [...activityFeed, ...derived]
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      }

      const chartData = activityRange.map(bucket => {
        const dayVisits = recentVisitsRes.data?.filter(v => {
          const d = v.scheduled_at.split('T')[0];
          return d >= bucket.date && d <= bucket.endDate;
        }).length || 0;
        const dayForms = recentFormsRes.data?.filter(f => {
          const d = f.created_at.split('T')[0];
          return d >= bucket.date && d <= bucket.endDate;
        }).length || 0;
        return { name: bucket.name, visits: dayVisits, forms: dayForms };
      });

      setStats({
        activePatients: patientCountRes.count || 0,
        visitsThisWeek: visitCountRes.count || 0,
        pendingForms: pendingCountRes.count || 0,
        submittedForms: submittedCountRes.count || 0,
        openReferrals: referralCountRes.count || 0,
      });
      setRecentActivity(activityFeed.slice(0, 5));
      setActivityData(chartData);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // 1. Active Patients
      const { count: patientCount } = await supabase
        .from('patients')
        .select('*', { count: 'exact', head: true });

      // 2. Visits This Week
      const startOfWeek = new Date();
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
      const { count: visitCount } = await supabase
        .from('visits')
        .select('*', { count: 'exact', head: true })
        .gte('scheduled_at', startOfWeek.toISOString());

      // 3. Pending Forms (drafts)
      const { count: pendingCount } = await supabase
        .from('form_responses')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'draft');

      // 4. Submitted Forms (total)
      const { count: submittedCount } = await supabase
        .from('form_responses')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'submitted');

      // 5. Open Referrals
      const { count: referralCount } = await supabase
        .from('referrals')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'Pending');

      // ── Recent Activity ────────────────────────────────────────────────────
      // Prefer real audit_logs entries if the system has started writing them.
      const { data: logs } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      let activityFeed: any[] = (logs || []).map(l => ({
        id: `audit-${l.id}`,
        action: l.action,
        label: `${l.action} on ${l.entity_type ?? 'record'}`,
        created_at: l.created_at,
      }));

      // Fallback / supplement: derive a feed from recently created or updated
      // records across the core tables, so the panel is meaningful even
      // before audit logging is fully wired up everywhere.
      if (activityFeed.length < 5) {
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

        // Merge, sort by recency, dedupe against audit log entries already present
        const merged = [...activityFeed, ...derived]
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        activityFeed = merged;
      }

      // Cap to the latest 5 for display
      activityFeed = activityFeed.slice(0, 5);

      // ── Clinical Activity chart ────────────────────────────────────────────
      const rangeDays = parseInt(timeRange);
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

      // For longer ranges, bucket by week so the chart stays readable.
      const useWeeklyBuckets = rangeDays > 30;
      const bucketCount = useWeeklyBuckets ? Math.ceil(rangeDays / 7) : rangeDays;

      const activityRange = Array.from({ length: bucketCount }).map((_, i) => {
        if (useWeeklyBuckets) {
          const end = new Date();
          end.setDate(end.getDate() - (bucketCount - 1 - i) * 7);
          const start = new Date(end);
          start.setDate(start.getDate() - 6);
          return {
            date: start.toISOString().split('T')[0],
            endDate: end.toISOString().split('T')[0],
            name: `${start.getMonth() + 1}/${start.getDate()}`,
            visits: 0,
            forms: 0,
          };
        }
        const d = new Date();
        d.setDate(d.getDate() - (bucketCount - 1 - i));
        return {
          date: d.toISOString().split('T')[0],
          endDate: d.toISOString().split('T')[0],
          name: rangeDays <= 7 ? days[d.getDay()] : `${d.getMonth() + 1}/${d.getDate()}`,
          visits: 0,
          forms: 0,
        };
      });

      const rangeStart = activityRange[0].date;

      const { data: recentVisits } = await supabase
        .from('visits')
        .select('scheduled_at')
        .gte('scheduled_at', rangeStart);

      const { data: recentForms } = await supabase
        .from('form_responses')
        .select('created_at')
        .gte('created_at', rangeStart);

      const activityData = activityRange.map(bucket => {
        const dayVisits = recentVisits?.filter(v => {
          const d = v.scheduled_at.split('T')[0];
          return d >= bucket.date && d <= bucket.endDate;
        }).length || 0;
        const dayForms = recentForms?.filter(f => {
          const d = f.created_at.split('T')[0];
          return d >= bucket.date && d <= bucket.endDate;
        }).length || 0;
        return { name: bucket.name, visits: dayVisits, forms: dayForms };
      });

      setStats({
        activePatients: patientCount || 0,
        visitsThisWeek: visitCount || 0,
        pendingForms: pendingCount || 0,
        submittedForms: submittedCount || 0,
        openReferrals: referralCount || 0,
      });
      setRecentActivity(activityFeed);
      setActivityData(activityData);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (action: string) => {
    if (action.includes('INSERT')) return UserPlus;
    if (action.includes('UPDATE')) return CheckCircle;
    if (action.includes('DELETE')) return ShieldCheck;
    return FileText;
  };

  const getActivityColor = (action: string) => {
    if (action.includes('INSERT')) return { text: 'text-purple-600', bg: 'bg-purple-50' };
    if (action.includes('UPDATE')) return { text: 'text-emerald-600', bg: 'bg-emerald-50' };
    if (action.includes('DELETE')) return { text: 'text-red-600', bg: 'bg-red-50' };
    return { text: 'text-blue-600', bg: 'bg-blue-50' };
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="p-4 md:p-8 space-y-6 bg-zinc-50 min-h-screen">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-zinc-900">Dashboard</h1>
          <p className="text-sm md:text-base text-zinc-500 mt-1">Welcome back, {profile?.full_name || 'User'}</p>
        </div>
        <div className="flex items-center gap-2 md:gap-4 w-full sm:w-auto">
          <div className="flex items-center gap-2 px-3 md:px-4 py-2 bg-white rounded-xl border border-zinc-100 shadow-sm flex-1 sm:flex-none justify-center">
            <ShieldCheck size={18} className="text-partners-blue-dark shrink-0" />
            <span className="text-[10px] md:text-sm font-medium text-zinc-600 whitespace-nowrap">HIPAA Secure Session</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard 
          title="Active Patients" 
          value={stats.activePatients} 
          icon={Users} 
          trend="+12%" 
          color="bg-blue-500"
          loading={loading}
        />
        <StatCard 
          title="Visits This Week" 
          value={stats.visitsThisWeek} 
          icon={Calendar} 
          trend="+5%" 
          color="bg-emerald-500"
          loading={loading}
        />
        <StatCard 
          title="Pending Forms" 
          value={stats.pendingForms} 
          icon={FileText} 
          color="bg-amber-500"
          loading={loading}
        />
        <StatCard 
          title="Submitted Forms" 
          value={stats.submittedForms} 
          icon={CheckCircle} 
          color="bg-violet-500"
          loading={loading}
        />
        <StatCard 
          title="Open Referrals" 
          value={stats.openReferrals} 
          icon={ClipboardList} 
          color="bg-rose-500"
          loading={loading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-zinc-900">Clinical Activity</h3>
              <select 
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-1.5 text-sm outline-none"
              >
                <option value="7">Last 7 Days</option>
                <option value="14">Last 14 Days</option>
                <option value="30">Last 30 Days</option>
                <option value="90">Last 90 Days</option>
              </select>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={activityData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="visits" fill="#005696" radius={[6, 6, 0, 0]} barSize={32} />
                  <Bar dataKey="forms" fill="#10b981" radius={[6, 6, 0, 0]} barSize={32} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link to="/progress-note" className="group bg-partners-blue-dark p-5 rounded-2xl text-white shadow-sm hover:shadow-md hover:opacity-95 transition-all">
              <div className="flex justify-between items-start mb-3">
                <div className="p-2.5 bg-white/10 rounded-xl">
                  <FileText size={20} />
                </div>
                <ArrowRight size={18} className="opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <h4 className="text-base font-bold">New Progress Note</h4>
              <p className="text-white/70 text-xs mt-1">Complete monthly GAFC nursing visit documentation.</p>
            </Link>
            <Link to="/care-plan" className="group bg-emerald-600 p-5 rounded-2xl text-white shadow-sm hover:shadow-md hover:opacity-95 transition-all">
              <div className="flex justify-between items-start mb-3">
                <div className="p-2.5 bg-white/10 rounded-xl">
                  <ClipboardList size={20} />
                </div>
                <ArrowRight size={18} className="opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <h4 className="text-base font-bold">New Care Plan</h4>
              <p className="text-white/70 text-xs mt-1">Develop or update MassHealth GAFC Care Plan.</p>
            </Link>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-bold text-zinc-900">Recent Activity</h3>
            </div>
            <div className="space-y-5 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex gap-4 animate-pulse">
                    <div className="w-10 h-10 rounded-2xl bg-zinc-100 shrink-0"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-zinc-100 rounded w-3/4"></div>
                      <div className="h-3 bg-zinc-100 rounded w-1/2"></div>
                    </div>
                  </div>
                ))
              ) : recentActivity.length === 0 ? (
                <p className="text-sm text-zinc-500 text-center py-4">No recent activity.</p>
              ) : (
                recentActivity.map((log) => {
                  const colors = getActivityColor(log.action);
                  const Icon = getActivityIcon(log.action);
                  return (
                    <div key={log.id} className="flex gap-3">
                      <div className={`w-9 h-9 rounded-xl ${colors.bg} flex items-center justify-center shrink-0`}>
                        <Icon className={colors.text} size={17} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-zinc-900 leading-snug">{log.label}</p>
                      </div>
                      <span className="text-[10px] font-medium text-zinc-400 whitespace-nowrap mt-0.5">{formatTimeAgo(log.created_at)}</span>
                    </div>
                  );
                })
              )}
            </div>
            <Link
              to="/compliance"
              className="block w-full mt-6 py-2.5 rounded-xl border border-zinc-200 text-zinc-600 text-sm font-bold text-center hover:bg-zinc-50 hover:border-partners-blue-dark/30 transition-colors"
            >
              View All Activity
            </Link>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp size={18} className="text-partners-blue-dark" />
              <h3 className="text-lg font-bold text-zinc-900">Quick Actions</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Link
                to="/patients"
                className="group flex flex-col items-start gap-2 p-3.5 rounded-xl border border-zinc-100 hover:border-partners-blue-dark/30 hover:bg-partners-blue-dark/5 transition-colors"
              >
                <div className="p-2 rounded-lg bg-blue-50 text-blue-600"><UserPlus size={16} /></div>
                <span className="text-xs font-bold text-zinc-700">Add Patient</span>
              </Link>
              <Link
                to="/schedule"
                className="group flex flex-col items-start gap-2 p-3.5 rounded-xl border border-zinc-100 hover:border-partners-blue-dark/30 hover:bg-partners-blue-dark/5 transition-colors"
              >
                <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600"><Calendar size={16} /></div>
                <span className="text-xs font-bold text-zinc-700">Schedule Visit</span>
              </Link>
              <Link
                to="/clinical-forms"
                className="group flex flex-col items-start gap-2 p-3.5 rounded-xl border border-zinc-100 hover:border-partners-blue-dark/30 hover:bg-partners-blue-dark/5 transition-colors"
              >
                <div className="p-2 rounded-lg bg-violet-50 text-violet-600"><ClipboardList size={16} /></div>
                <span className="text-xs font-bold text-zinc-700">Clinical Forms</span>
              </Link>
              <Link
                to="/compliance"
                className="group flex flex-col items-start gap-2 p-3.5 rounded-xl border border-zinc-100 hover:border-partners-blue-dark/30 hover:bg-partners-blue-dark/5 transition-colors"
              >
                <div className="p-2 rounded-lg bg-amber-50 text-amber-600"><ShieldCheck size={16} /></div>
                <span className="text-xs font-bold text-zinc-700">Compliance</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ── Submitted Forms Table ─────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-zinc-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
              <FileText size={18} className="text-partners-blue-dark" />
              Submitted Forms
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              All clinical forms — newest first
            </p>
          </div>
          {!formsLoading && totalForms > 0 && (
            <span className="text-xs font-bold text-zinc-500 bg-zinc-100 px-3 py-1.5 rounded-full self-start sm:self-auto">
              {totalForms} total
            </span>
          )}
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {formsLoading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="animate-pulse flex items-center gap-4 py-3 border-b border-zinc-50">
                  <div className="h-3 bg-zinc-100 rounded w-1/4" />
                  <div className="h-3 bg-zinc-100 rounded w-1/5" />
                  <div className="h-3 bg-zinc-100 rounded w-1/6" />
                  <div className="h-5 bg-zinc-100 rounded-full w-20" />
                  <div className="h-3 bg-zinc-100 rounded w-12 ml-auto" />
                </div>
              ))}
            </div>
          ) : allForms.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-14 h-14 rounded-2xl bg-zinc-100 flex items-center justify-center mb-4">
                <FileText size={26} className="text-zinc-400" />
              </div>
              <p className="text-sm font-bold text-zinc-500">No forms submitted yet</p>
              <p className="text-xs text-zinc-400 mt-1">Submitted clinical forms will appear here.</p>
            </div>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="bg-zinc-50">
                  <th className="px-6 py-3.5 text-[11px] font-bold text-zinc-500 uppercase tracking-wider">#</th>
                  <th className="px-6 py-3.5 text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Form Name</th>
                  <th className="px-6 py-3.5 text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Patient</th>
                  <th className="px-6 py-3.5 text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Submitted On</th>
                  <th className="px-6 py-3.5 text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3.5 text-[11px] font-bold text-zinc-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50">
                {allForms.map((fr, idx) => {
                  const formName = fr.forms?.name ?? fr.data?.form_name ?? 'Unknown Form';
                  const patientName = fr.patients
                    ? `${fr.patients.last_name}, ${fr.patients.first_name}`
                    : '—';
                  const routePath = FORM_ROUTES[formName];
                  const viewUrl = routePath
                    ? `${routePath}?patientId=${fr.patient_id}&id=${fr.id}`
                    : null;
                  const rowNum = (currentPage - 1) * FORMS_PER_PAGE + idx + 1;

                  return (
                    <tr key={fr.id} className="hover:bg-zinc-50/70 transition-colors group">
                      <td className="px-6 py-4 text-xs font-bold text-zinc-400">{rowNum}</td>

                      {/* Form name */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-partners-blue-dark/8 flex items-center justify-center flex-shrink-0">
                            <FileText size={14} className="text-partners-blue-dark" />
                          </div>
                          <span className="text-sm font-bold text-zinc-900">{formName}</span>
                        </div>
                      </td>

                      {/* Patient */}
                      <td className="px-6 py-4 text-sm text-zinc-600 font-medium">{patientName}</td>

                      {/* Date */}
                      <td className="px-6 py-4 text-sm text-zinc-500">
                        {fr.created_at
                          ? format(new Date(fr.created_at), 'MMM d, yyyy · h:mm a')
                          : '—'}
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${statusStyle(fr.status)}`}>
                          {fr.status ?? 'unknown'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100">
                          {viewUrl ? (
                            <Link
                              to={viewUrl}
                              className="inline-flex items-center gap-1.5 text-xs font-bold text-partners-blue-dark bg-partners-blue-dark/10 hover:bg-partners-blue-dark/20 px-3 py-1.5 rounded-lg transition-colors"
                            >
                              <Pencil size={13} /> View / Edit
                            </Link>
                          ) : (
                            <span className="text-xs text-zinc-300">—</span>
                          )}
                          <button
                            onClick={() => { setDeleteTarget(fr); setDeleteError(null); }}
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors"
                          >
                            <Trash2 size={13} /> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {totalForms > FORMS_PER_PAGE && (
          <div className="px-6 py-4 border-t border-zinc-100 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-zinc-500">
              Showing{' '}
              <span className="font-bold text-zinc-700">
                {(currentPage - 1) * FORMS_PER_PAGE + 1}–{Math.min(currentPage * FORMS_PER_PAGE, totalForms)}
              </span>{' '}
              of <span className="font-bold text-zinc-700">{totalForms}</span> forms
            </p>
            <div className="flex items-center gap-1">
              {/* Prev */}
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-zinc-500 hover:bg-zinc-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={15} />
              </button>

              {/* Page numbers */}
              {Array.from({ length: Math.ceil(totalForms / FORMS_PER_PAGE) }, (_, i) => i + 1)
                .filter(p => p === 1 || p === Math.ceil(totalForms / FORMS_PER_PAGE) || Math.abs(p - currentPage) <= 1)
                .reduce<(number | '...')[]>((acc, p, i, arr) => {
                  if (i > 0 && typeof arr[i - 1] === 'number' && (p as number) - (arr[i - 1] as number) > 1) acc.push('...');
                  acc.push(p);
                  return acc;
                }, [])
                .map((p, i) =>
                  p === '...' ? (
                    <span key={`ellipsis-${i}`} className="w-8 h-8 flex items-center justify-center text-xs text-zinc-400">…</span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => setCurrentPage(p as number)}
                      className={`w-8 h-8 rounded-xl text-xs font-bold transition-colors ${
                        currentPage === p
                          ? 'bg-partners-blue-dark text-white'
                          : 'text-zinc-600 hover:bg-zinc-100'
                      }`}
                    >
                      {p}
                    </button>
                  )
                )}

              {/* Next */}
              <button
                onClick={() => setCurrentPage(p => Math.min(Math.ceil(totalForms / FORMS_PER_PAGE), p + 1))}
                disabled={currentPage === Math.ceil(totalForms / FORMS_PER_PAGE)}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-zinc-500 hover:bg-zinc-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          onClick={e => { if (e.target === e.currentTarget && !isDeleting) setDeleteTarget(null); }}
        >
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-100">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-red-100 text-red-600"><Trash2 size={18} /></div>
                <div>
                  <h2 className="text-base font-bold text-zinc-900">Delete Form</h2>
                  <p className="text-xs text-zinc-500">{deleteTarget.forms?.name ?? 'Unknown Form'}</p>
                </div>
              </div>
              <button
                onClick={() => !isDeleting && setDeleteTarget(null)}
                disabled={isDeleting}
                className="p-2 rounded-full text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors disabled:opacity-50"
              >
                <X size={18} />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              <p className="text-sm text-zinc-600">
                This will permanently delete this form submission
                {deleteTarget.patients ? (
                  <> for <strong>{deleteTarget.patients.last_name}, {deleteTarget.patients.first_name}</strong></>
                ) : null}
                , including its record in the database, any associated signatures, and the stored PDF file (if any).
                This action cannot be undone.
              </p>

              {deleteError && (
                <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                  <AlertCircle size={16} className="flex-shrink-0" />{deleteError}
                </div>
              )}

              <div className="flex items-center gap-3 pt-1">
                <button
                  onClick={() => setDeleteTarget(null)}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-zinc-600 bg-zinc-100 hover:bg-zinc-200 rounded-xl transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteForm(deleteTarget)}
                  disabled={isDeleting}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDeleting
                    ? <><Loader2 size={16} className="animate-spin" /> Deleting…</>
                    : <><Trash2 size={16} /> Delete</>
                  }
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
