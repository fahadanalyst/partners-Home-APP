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
  Loader2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/Button';
import { supabase, testSupabaseConnection } from '../services/supabase';
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

const StatCard = ({ title, value, icon: Icon, trend, color, loading }: any) => {
  const getIconColor = (bgClass: string) => {
    if (bgClass.includes('blue')) return 'text-blue-600';
    if (bgClass.includes('emerald')) return 'text-emerald-600';
    if (bgClass.includes('amber')) return 'text-amber-600';
    return 'text-zinc-600';
  };

  return (
    <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-2xl ${color} bg-opacity-10`}>
          <Icon className={getIconColor(color)} size={24} />
        </div>
        {trend && (
          <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
            {trend}
          </span>
        )}
      </div>
      <h3 className="text-zinc-500 text-sm font-medium">{title}</h3>
      {loading ? (
        <div className="h-8 w-16 bg-zinc-100 animate-pulse rounded mt-1"></div>
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
  });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [activityData, setActivityData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7');

  useEffect(() => {
    checkConnection();
    fetchDashboardData();
  }, [timeRange]);

  const checkConnection = async () => {
    await testSupabaseConnection();
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // 1. Fetch Active Patients
      const { count: patientCount } = await supabase
        .from('patients')
        .select('*', { count: 'exact', head: true });

      // 2. Fetch Visits This Week
      const startOfWeek = new Date();
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
      const { count: visitCount, error: visitError } = await supabase
        .from('visits')
        .select('*', { count: 'exact', head: true })
        .gte('scheduled_at', startOfWeek.toISOString());

      // 3. Fetch Pending Forms
      const { count: formCount, error: formError } = await supabase
        .from('form_responses')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'draft');

      // 4. Fetch Recent Activity (Audit Logs)
      const { data: logs, error: logsError } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      // 5. Fetch Activity Data for Chart (Aggregate from DB)
      const rangeDays = parseInt(timeRange);
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const activityRange = Array.from({ length: rangeDays }).map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (rangeDays - 1 - i));
        return {
          date: d.toISOString().split('T')[0],
          name: rangeDays <= 7 ? days[d.getDay()] : d.getDate().toString(),
          visits: 0,
          forms: 0
        };
      });

      // Fetch visits for range
      const { data: recentVisits } = await supabase
        .from('visits')
        .select('scheduled_at')
        .gte('scheduled_at', activityRange[0].date);

      // Fetch forms for range
      const { data: recentForms } = await supabase
        .from('form_responses')
        .select('created_at')
        .gte('created_at', activityRange[0].date);

      const activityData = activityRange.map(day => {
        const dayVisits = recentVisits?.filter(v => v.scheduled_at.startsWith(day.date)).length || 0;
        const dayForms = recentForms?.filter(f => f.created_at.startsWith(day.date)).length || 0;
        return {
          name: day.name,
          visits: dayVisits,
          forms: dayForms
        };
      });

      setStats({
        activePatients: patientCount || 0,
        visitsThisWeek: visitCount || 0,
        pendingForms: formCount || 0,
      });
      setRecentActivity(logs || []);
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
    <div className="p-4 md:p-8 space-y-8 bg-zinc-50 min-h-screen">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-zinc-900">Dashboard</h1>
          <p className="text-sm md:text-base text-zinc-500 mt-1">Welcome back, {profile?.full_name || 'User'}</p>
        </div>
        <div className="flex items-center gap-2 md:gap-4 w-full sm:w-auto">
          <div className="flex items-center gap-2 px-3 md:px-4 py-2 bg-white rounded-2xl border border-zinc-200 shadow-sm flex-1 sm:flex-none justify-center">
            <ShieldCheck size={18} className="text-partners-blue-dark shrink-0" />
            <span className="text-[10px] md:text-sm font-medium text-zinc-600 whitespace-nowrap">HIPAA Secure Session</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white p-8 rounded-3xl border border-zinc-200 shadow-sm">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-xl font-bold text-zinc-900">Clinical Activity</h3>
              <select 
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-1.5 text-sm outline-none"
              >
                <option value="7">Last 7 Days</option>
                <option value="30">Last 30 Days</option>
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Link to="/progress-note" className="group bg-partners-blue-dark p-6 rounded-3xl text-white shadow-lg shadow-blue-900/20 hover:scale-[1.02] transition-all">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-white/10 rounded-2xl">
                  <FileText size={24} />
                </div>
                <ArrowRight size={20} className="opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <h4 className="text-lg font-bold">New Progress Note</h4>
              <p className="text-white/70 text-sm mt-1">Complete monthly GAFC nursing visit documentation.</p>
            </Link>
            <Link to="/care-plan" className="group bg-emerald-600 p-6 rounded-3xl text-white shadow-lg shadow-emerald-900/20 hover:scale-[1.02] transition-all">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-white/10 rounded-2xl">
                  <ClipboardList size={24} />
                </div>
                <ArrowRight size={20} className="opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <h4 className="text-lg font-bold">New Care Plan</h4>
              <p className="text-white/70 text-sm mt-1">Develop or update MassHealth GAFC Care Plan.</p>
            </Link>
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-zinc-900">Recent Activity</h3>
            </div>
            <div className="space-y-6 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
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
                recentActivity.map((log, i) => {
                  const colors = getActivityColor(log.action);
                  const Icon = getActivityIcon(log.action);
                  return (
                    <div key={log.id} className="flex gap-4">
                      <div className={`w-10 h-10 rounded-2xl ${colors.bg} flex items-center justify-center shrink-0`}>
                        <Icon className={colors.text} size={20} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-zinc-900 truncate">System Log</p>
                        <p className="text-xs text-zinc-500">{log.action} on {log.table_name}</p>
                      </div>
                      <span className="text-[10px] font-medium text-zinc-400 whitespace-nowrap">{formatTimeAgo(log.created_at)}</span>
                    </div>
                  );
                })
              )}
            </div>
            <button className="w-full mt-8 py-3 rounded-2xl border border-zinc-200 text-zinc-600 text-sm font-bold hover:bg-zinc-50 transition-colors">
              View All Activity
            </button>
          </div>

          <div className="bg-gradient-to-br from-partners-blue-dark to-blue-800 p-8 rounded-3xl text-white">
            <TrendingUp size={32} className="mb-4 text-blue-200" />
            <h3 className="text-xl font-bold mb-2">Quick Actions</h3>
            <p className="text-blue-100 text-sm leading-relaxed">
              Access your clinical tools and patient records quickly from the sidebar.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
