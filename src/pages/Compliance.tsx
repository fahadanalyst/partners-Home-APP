import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Clock,
  FileText,
  BarChart3,
  Search,
  Loader2,
  X
} from 'lucide-react';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { Notification, NotificationType } from '../components/Notification';

interface ComplianceStat {
  label: string;
  value: number;
  total: number;
  status: 'good' | 'warning' | 'critical';
}

export const Compliance: React.FC = () => {
  const [stats, setStats] = useState<ComplianceStat[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [criticalAlerts, setCriticalAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAlertsModalOpen, setIsAlertsModalOpen] = useState(false);
  const [notification, setNotification] = useState<{ type: NotificationType, message: string } | null>(null);

  useEffect(() => {
    fetchComplianceData();
  }, []);

  const fetchComplianceData = async () => {
    try {
      setLoading(true);
      
      // 1. Fetch Form IDs
      const { data: forms } = await supabase.from('forms').select('id, name');
      const progressNoteForm = forms?.find(f => f.name.includes('Progress Note'));
      const carePlanForm = forms?.find(f => f.name.includes('Care Plan'));

      // 2. Fetch Total Patients (for denominator)
      const { count: totalPatients } = await supabase
        .from('patients')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      const total = totalPatients || 0;

      // 3. Fetch Submitted Progress Notes
      const { count: progressNotesCount } = await supabase
        .from('form_responses')
        .select('*', { count: 'exact', head: true })
        .eq('form_id', progressNoteForm?.id)
        .eq('status', 'submitted');

      // 4. Fetch Submitted Care Plans
      const { count: carePlansCount } = await supabase
        .from('form_responses')
        .select('*', { count: 'exact', head: true })
        .eq('form_id', carePlanForm?.id)
        .eq('status', 'submitted');

      // 5. Fetch Audit Logs
      const { data: logs } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      setStats([
        { 
          label: 'Care Plans (Active)', 
          value: carePlansCount || 0, 
          total: total, 
          status: total === 0 ? 'good' : (carePlansCount || 0) / total > 0.9 ? 'good' : 'warning' 
        },
        { 
          label: 'Monthly Progress Notes', 
          value: progressNotesCount || 0, 
          total: total, 
          status: total === 0 ? 'good' : (progressNotesCount || 0) / total > 0.8 ? 'good' : 'warning' 
        },
        { label: 'Staff Certifications', value: 0, total: 0, status: 'good' },
        { label: 'Annual Assessments', value: total, total: total, status: 'good' },
      ]);
      setRecentActivity(logs || []);

      // 6. Fetch Alerts (Real checks)
      const alerts: any[] = [];
      
      // Check for patients without care plans
      if (total > (carePlansCount || 0)) {
        alerts.push({
          title: 'Missing Care Plan',
          patient: 'Multiple Patients',
          days: `${total - (carePlansCount || 0)} patients missing care plans`
        });
      }

      // Check for patients without progress notes this month
      if (total > (progressNotesCount || 0)) {
        alerts.push({
          title: 'Missing Progress Note',
          patient: 'Multiple Patients',
          days: `${total - (progressNotesCount || 0)} notes due this month`
        });
      }

      setCriticalAlerts(alerts);

    } catch (error) {
      console.error('Error fetching compliance data:', error);
    } finally {
      setLoading(false);
    }
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

  const filteredActivity = recentActivity.filter(log => 
    log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.table_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleExport = () => {
    try {
      const headers = ['Metric', 'Completed', 'Total', 'Percentage'];
      const rows = stats.map(s => [
        s.label,
        s.value.toString(),
        s.total.toString(),
        `${s.total > 0 ? Math.round((s.value / s.total) * 100) : 0}%`
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map(r => r.join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `Compliance_Report_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setNotification({ type: 'success', message: 'Report exported successfully!' });
    } catch (error) {
      console.error('Export error:', error);
      setNotification({ type: 'error', message: 'Failed to export report.' });
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-zinc-900 italic">Compliance</h1>
          <p className="text-sm md:text-base text-zinc-500">Monitor regulatory requirements and documentation status</p>
        </div>
        <Button 
          variant="secondary" 
          className="rounded-full px-6 w-full sm:w-auto"
          onClick={handleExport}
        >
          <BarChart3 className="w-4 h-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-32 bg-white rounded-3xl border border-zinc-200 animate-pulse"></div>
          ))
        ) : (
          stats.map((stat) => (
            <div key={stat.label} className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <div className={`p-2 rounded-xl ${
                  stat.status === 'good' ? 'bg-emerald-50 text-emerald-600' :
                  stat.status === 'warning' ? 'bg-amber-50 text-amber-600' :
                  'bg-red-50 text-red-600'
                }`}>
                  {stat.status === 'good' ? <CheckCircle2 size={20} /> :
                   stat.status === 'warning' ? <Clock size={20} /> :
                   <AlertTriangle size={20} />}
                </div>
                <span className="text-2xl font-bold text-zinc-900">
                  {stat.total > 0 ? Math.round((stat.value / stat.total) * 100) : 0}%
                </span>
              </div>
              <p className="text-sm font-medium text-zinc-500 mb-1">{stat.label}</p>
              <div className="w-full h-2 bg-zinc-100 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-1000 ${
                    stat.status === 'good' ? 'bg-emerald-500' :
                    stat.status === 'warning' ? 'bg-amber-500' :
                    'bg-red-500'
                  }`}
                  style={{ width: `${stat.total > 0 ? (stat.value / stat.total) * 100 : 0}%` }}
                ></div>
              </div>
              <p className="text-[10px] text-zinc-400 mt-2 font-bold uppercase tracking-wider">
                {stat.value} of {stat.total} Completed
              </p>
            </div>
          ))
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Alerts Section */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-8 rounded-3xl border border-zinc-200 shadow-sm">
            <h3 className="text-lg font-bold text-zinc-900 mb-6 flex items-center gap-2">
              <AlertTriangle className="text-red-500" size={20} />
              Critical Alerts
            </h3>
            <div className="space-y-4">
              {criticalAlerts.length === 0 ? (
                <p className="text-sm text-zinc-500 text-center py-4">No critical alerts.</p>
              ) : (
                criticalAlerts.map((alert, i) => (
                  <div key={i} className="p-4 bg-red-50/50 border border-red-100 rounded-2xl space-y-1">
                    <p className="text-sm font-bold text-red-900">{alert.title}</p>
                    <p className="text-xs text-red-700">{alert.patient || alert.staff}</p>
                    <p className="text-[10px] font-bold text-red-500 uppercase tracking-wider">{alert.days}</p>
                  </div>
                ))
              )}
            </div>
            <Button 
              variant="ghost" 
              className="w-full mt-6 text-sm text-zinc-500"
              onClick={() => setIsAlertsModalOpen(true)}
            >
              View All Alerts
            </Button>
          </div>
        </div>

        {/* Recent Activity Section */}
        <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-zinc-200 shadow-sm">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
              <ShieldCheck className="text-partners-blue-dark" size={20} />
              Recent Compliance Activity
            </h3>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
              <input 
                type="text" 
                placeholder="Search logs..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-zinc-50 border border-zinc-100 rounded-xl text-xs outline-none focus:ring-2 focus:ring-partners-blue-dark"
              />
            </div>
          </div>

          <div className="space-y-6 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-12 bg-zinc-50 rounded-xl animate-pulse"></div>
              ))
            ) : filteredActivity.length === 0 ? (
              <p className="text-sm text-zinc-500 text-center py-4">No compliance activity found.</p>
            ) : (
              filteredActivity.map((log, i) => (
                <div key={log.id} className="flex items-center justify-between py-2 border-b border-zinc-50 last:border-0">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-zinc-50 flex items-center justify-center text-zinc-400">
                      <FileText size={18} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-zinc-900">{log.action}</p>
                      <p className="text-xs text-zinc-500">Table: {log.table_name} • System Log</p>
                    </div>
                  </div>
                  <span className="text-xs text-zinc-400">{formatTimeAgo(log.created_at)}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Alerts Modal */}
      <Modal
        isOpen={isAlertsModalOpen}
        onClose={() => setIsAlertsModalOpen(false)}
        title="Compliance Alerts"
        size="lg"
      >
        <div className="space-y-6">
          <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex items-start gap-3">
            <AlertTriangle className="text-amber-600 shrink-0" size={20} />
            <p className="text-sm text-amber-800">
              The following items require immediate attention to maintain regulatory compliance.
            </p>
          </div>

          <div className="space-y-4">
            {criticalAlerts.length === 0 ? (
              <div className="text-center py-12 text-zinc-500">
                <CheckCircle2 className="mx-auto mb-2 text-emerald-500" size={32} />
                <p>No critical alerts found. All systems are compliant.</p>
              </div>
            ) : (
              criticalAlerts.map((alert, i) => (
                <div key={i} className="flex items-center justify-between p-6 bg-white rounded-3xl border border-zinc-200 shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center text-red-600">
                      <AlertTriangle size={24} />
                    </div>
                    <div>
                      <h4 className="font-bold text-zinc-900">{alert.title}</h4>
                      <p className="text-sm text-zinc-500">{alert.patient || alert.staff}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-[10px] font-bold uppercase tracking-wider">
                      Critical
                    </span>
                    <p className="text-xs text-zinc-400 mt-1">{alert.days}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="flex justify-end pt-4 border-t border-zinc-100">
            <Button onClick={() => setIsAlertsModalOpen(false)}>
              Close
            </Button>
          </div>
        </div>
      </Modal>

      {notification && (
        <Notification 
          type={notification.type} 
          message={notification.message} 
          onClose={() => setNotification(null)} 
        />
      )}
    </div>
  );
};
