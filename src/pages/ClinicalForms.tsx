import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  ClipboardList, 
  Stethoscope, 
  UserRound, 
  FilePlus,
  ArrowRight,
  Pill,
  Activity,
  ClipboardCheck,
  MoreVertical,
  Trash2,
  Edit2,
  Clock,
  User
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { Notification, NotificationType } from '../components/Notification';
import { Button } from '../components/Button';
import { format } from 'date-fns';
import { clsx } from 'clsx';

const forms = [
  {
    id: 'gafc-progress-note',
    title: 'GAFC Progress Note',
    description: 'Monthly clinical progress note for GAFC participants.',
    icon: FileText,
    path: '/progress-note',
    color: 'bg-emerald-100 text-emerald-600'
  },
  {
    id: 'gafc-care-plan',
    title: 'GAFC Care Plan',
    description: 'Comprehensive MassHealth GAFC Program Care Plan.',
    icon: FileText,
    path: '/care-plan',
    color: 'bg-blue-100 text-blue-600'
  },
  {
    id: 'physician-summary',
    title: 'Physician Summary (PSF-1)',
    description: 'Physician verification and validation of medical information.',
    icon: FileText,
    path: '/physician-summary',
    color: 'bg-amber-100 text-amber-600'
  },
  {
    id: 'request-for-services',
    title: 'Request for Services (RFS-1)',
    description: 'Clinical eligibility determination for requested services.',
    icon: FileText,
    path: '/request-for-services',
    color: 'bg-rose-100 text-rose-600'
  },
  {
    id: 'patient-resource-data',
    title: 'Patient Resource Data',
    description: 'Demographic information and health/community resources.',
    icon: FileText,
    path: '/patient-resource-data',
    color: 'bg-indigo-100 text-indigo-600'
  },
  {
    id: 'physician-orders',
    title: 'Physician Orders',
    description: 'Physician orders and plan of care documentation.',
    icon: FileText,
    path: '/physician-orders',
    color: 'bg-purple-100 text-purple-600'
  },
  {
    id: 'mds-assessment',
    title: 'MDS Assessment',
    description: 'Minimum Data Set assessment for care planning.',
    icon: FileText,
    path: '/mds-assessment',
    color: 'bg-cyan-100 text-cyan-600'
  },
  {
    id: 'nursing-assessment',
    title: 'Nursing Assessment',
    description: 'Head-to-toe nursing evaluation.',
    icon: FileText,
    path: '/nursing-assessment',
    color: 'bg-orange-100 text-orange-600'
  },
  {
    id: 'mar',
    title: 'Medication Administration Record (MAR)',
    description: 'Monthly tracking of medication administration.',
    icon: FileText,
    path: '/mar',
    color: 'bg-pink-100 text-pink-600'
  },
  {
    id: 'tar',
    title: 'Treatment Administration Record (TAR)',
    description: 'Monthly tracking of non-medication treatments.',
    icon: FileText,
    path: '/tar',
    color: 'bg-lime-100 text-lime-600'
  },
  {
    id: 'clinical-note',
    title: 'Clinical Note',
    description: 'General clinical observations and documentation.',
    icon: FileText,
    path: '/clinical-note-form',
    color: 'bg-zinc-100 text-zinc-600'
  },
  {
    id: 'admission-assessment',
    title: 'Admission Assessment',
    description: 'Initial patient admission evaluation.',
    icon: FileText,
    path: '/admission-assessment',
    color: 'bg-emerald-50 text-emerald-700'
  },
  {
    id: 'discharge-summary',
    title: 'Discharge Summary',
    description: 'Final documentation upon patient discharge.',
    icon: FileText,
    path: '/discharge-summary',
    color: 'bg-red-50 text-red-700'
  }
];

export const ClinicalForms: React.FC = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [recentSubmissions, setRecentSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [submissionToDelete, setSubmissionToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [notification, setNotification] = useState<{ type: NotificationType, message: string } | null>(null);

  useEffect(() => {
    fetchRecentSubmissions();
  }, []);

  const fetchRecentSubmissions = async () => {
    try {
      const { data, error } = await supabase
        .from('form_responses')
        .select(`
          id,
          created_at,
          status,
          form_id,
          forms (name),
          patients (first_name, last_name)
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setRecentSubmissions(data || []);
    } catch (error) {
      console.error('Error fetching recent submissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setIsDeleting(true);
      const { error } = await supabase
        .from('form_responses')
        .delete()
        .eq('id', id);
      if (error) throw error;
      
      // Refresh data from server to ensure sync
      await fetchRecentSubmissions();
      setNotification({ type: 'success', message: 'Submission deleted successfully' });
    } catch (error: any) {
      setNotification({ type: 'error', message: 'Error deleting submission: ' + error.message });
    } finally {
      setIsDeleting(false);
      setSubmissionToDelete(null);
      setActiveMenu(null);
    }
  };

  const getFormPath = (formName: string) => {
    const form = forms.find(f => f.title === formName);
    return form?.path || '/clinical-forms';
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-12">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-zinc-900 italic">Clinical Forms</h1>
        <p className="text-sm md:text-base text-zinc-500">Access and complete clinical documentation and assessments</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {forms.map((form) => (
          <Link 
            key={form.id} 
            to={form.path}
            className="group bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm hover:shadow-md transition-all hover:border-partners-blue-dark"
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`p-3 rounded-2xl ${form.color}`}>
                <form.icon size={24} />
              </div>
              <div className="p-2 rounded-full bg-zinc-50 text-zinc-400 group-hover:text-partners-blue-dark group-hover:bg-partners-blue-dark/10 transition-colors">
                <ArrowRight size={20} />
              </div>
            </div>
            <h3 className="text-lg font-bold text-zinc-900 mb-2">{form.title}</h3>
            <p className="text-sm text-zinc-500 leading-relaxed">
              {form.description}
            </p>
          </Link>
        ))}
      </div>

      {/* Recent Submissions Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-zinc-900 italic flex items-center gap-2">
            <Clock className="text-partners-blue-dark" size={24} />
            Recent Submissions
          </h2>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-partners-blue-dark border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : recentSubmissions.length > 0 ? (
          <div className="bg-white rounded-3xl border border-zinc-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-zinc-50 border-b border-zinc-200">
                    <th className="px-6 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Form Name</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Patient</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Date</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Status</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {recentSubmissions.map((submission) => (
                    <tr key={submission.id} className="hover:bg-zinc-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-zinc-100 rounded-lg text-zinc-500">
                            <FileText size={16} />
                          </div>
                          <span className="text-sm font-bold text-zinc-900">{submission.forms?.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm text-zinc-600">
                          <User size={14} className="text-zinc-400" />
                          {submission.patients ? `${submission.patients.first_name} ${submission.patients.last_name}` : 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-zinc-500">
                        {format(new Date(submission.created_at), 'MMM d, yyyy h:mm a')}
                      </td>
                      <td className="px-6 py-4">
                        <span className={clsx(
                          'px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider',
                          submission.status === 'submitted' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                        )}>
                          {submission.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right relative">
                        <button 
                          onClick={() => setActiveMenu(activeMenu === submission.id ? null : submission.id)}
                          className="p-2 text-zinc-400 hover:text-zinc-600 transition-colors"
                        >
                          <MoreVertical size={18} />
                        </button>
                        
                        {activeMenu === submission.id && (
                          <div className="absolute right-6 mt-2 w-32 bg-white rounded-xl border border-zinc-200 shadow-xl z-50 overflow-hidden">
                            <button
                              onClick={() => {
                                navigate(`${getFormPath(submission.forms?.name)}?id=${submission.id}`);
                                setActiveMenu(null);
                              }}
                              className="w-full text-left px-4 py-2 text-xs text-zinc-600 hover:bg-zinc-50 transition-colors font-medium flex items-center gap-2 border-b border-zinc-50"
                            >
                              <Edit2 size={14} />
                              Edit
                            </button>
                            <button
                              onClick={() => {
                                setSubmissionToDelete(submission.id);
                                setActiveMenu(null);
                              }}
                              className="w-full text-left px-4 py-2 text-xs text-red-600 hover:bg-red-50 transition-colors font-medium flex items-center gap-2"
                            >
                              <Trash2 size={14} />
                              Delete
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-zinc-200 p-12 text-center shadow-sm">
            <div className="w-16 h-16 bg-zinc-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="text-zinc-300" size={32} />
            </div>
            <h3 className="text-lg font-bold text-zinc-900 mb-1 italic">No submissions yet</h3>
            <p className="text-zinc-500">Your recently completed forms will appear here.</p>
          </div>
        )}
      </div>
      <ConfirmationModal
        isOpen={!!submissionToDelete}
        onClose={() => setSubmissionToDelete(null)}
        onConfirm={() => submissionToDelete && handleDelete(submissionToDelete)}
        title="Delete Submission"
        message="Are you sure you want to delete this form submission? This action cannot be undone."
        confirmText="Delete Submission"
        isLoading={isDeleting}
      />

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
