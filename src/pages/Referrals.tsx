import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Plus, 
  Filter, 
  MoreVertical, 
  Phone, 
  Mail, 
  Calendar,
  UserPlus,
  Trash2,
  Edit2,
  ExternalLink,
  MessageSquare,
  X
} from 'lucide-react';
import { supabase } from '../services/supabase';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { ConfirmModal } from '../components/ConfirmModal';
import { Notification } from '../components/Notification';
import { clsx } from 'clsx';
import { format } from 'date-fns';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const referralSchema = z.object({
  referrer_name: z.string().min(2, 'Referrer name is required'),
  patient_id: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().email('Invalid email').optional().nullable().or(z.literal('')),
  fax: z.string().optional().nullable(),
  relationship: z.string().optional().nullable(),
  comment: z.string().optional().nullable(),
  status: z.string().min(1, 'Status is required')
});

type ReferralFormValues = z.infer<typeof referralSchema>;

interface Referral {
  id: string;
  referrer_name: string;
  patient_id: string | null;
  phone: string | null;
  email: string | null;
  fax: string | null;
  relationship: string | null;
  comment: string | null;
  status: string;
  created_at: string;
  patient?: {
    first_name: string;
    last_name: string;
  };
}

export const Referrals: React.FC = () => {
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'warning', message: string } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [referralToDelete, setReferralToDelete] = useState<string | null>(null);
  const [selectedReferral, setSelectedReferral] = useState<Referral | null>(null);
  const [patients, setPatients] = useState<{id: string, first_name: string, last_name: string}[]>([]);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<ReferralFormValues>({
    resolver: zodResolver(referralSchema),
    defaultValues: {
      status: 'Pending'
    }
  });

  useEffect(() => {
    fetchReferrals();
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      const { data, error } = await supabase
        .from('patients')
        .select('id, first_name, last_name')
        .order('last_name', { ascending: true });
      if (error) throw error;
      setPatients(data || []);
    } catch (error) {
      console.error('Error fetching patients:', error);
    }
  };

  const fetchReferrals = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('referrals')
        .select(`
          *,
          patient:patients(first_name, last_name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReferrals(data || []);
    } catch (error: any) {
      console.error('Error fetching referrals:', error);
      setNotification({ type: 'error', message: 'Error fetching referrals: ' + error.message });
    } finally {
      setLoading(false);
    }
  };

  const updateReferralStatus = async (id: string, status: string) => {
    try {
      const response = await fetch('/api/referrals/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status })
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to update referral status');

      setNotification({ type: 'success', message: `Referral status updated to ${status}` });
      fetchReferrals();
    } catch (error: any) {
      console.error('Error updating referral status:', error);
      setNotification({ type: 'error', message: 'Error updating referral status: ' + error.message });
    }
  };

  const deleteReferral = async (id: string) => {
    try {
      const response = await fetch('/api/referrals/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to delete referral');

      setNotification({ type: 'success', message: 'Referral record deleted successfully' });
      fetchReferrals();
    } catch (error: any) {
      console.error('Error deleting referral:', error);
      setNotification({ type: 'error', message: 'Error deleting referral: ' + error.message });
    }
  };

  const onSubmit = async (data: ReferralFormValues) => {
    try {
      const response = await fetch('/api/referrals/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to add referral');
      
      setNotification({ type: 'success', message: 'Referral added successfully!' });
      setIsModalOpen(false);
      reset();
      fetchReferrals();
    } catch (error: any) {
      console.error('Error adding referral:', error);
      setNotification({ type: 'error', message: 'Error adding referral: ' + error.message });
    }
  };

  const filteredReferrals = referrals.filter(ref => 
    ref.referrer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (ref.patient && `${ref.patient.first_name} ${ref.patient.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (ref.relationship && ref.relationship.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="p-4 lg:p-8 space-y-8">
      {notification && (
        <Notification
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900">Referrals</h1>
          <p className="text-zinc-500 mt-1">Manage and track patient referral sources</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2">
          <Plus size={20} />
          New Referral
        </Button>
      </div>

      <div className="bg-white rounded-3xl shadow-xl border border-zinc-200 overflow-hidden">
        <div className="p-6 border-b border-zinc-100 flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={20} />
            <input
              type="text"
              placeholder="Search referrals..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-partners-blue-dark outline-none transition-all"
            />
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={fetchReferrals} className="flex items-center gap-2">
              <Filter size={18} />
              Refresh
            </Button>
          </div>
        </div>

        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50">
                <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-wider">Referrer</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-wider">Patient</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-wider">Contact</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-wider">Relationship</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-zinc-500">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-8 h-8 border-4 border-partners-blue-dark border-t-transparent rounded-full animate-spin"></div>
                      <p className="font-medium">Loading referrals...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredReferrals.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-zinc-500">
                    <div className="flex flex-col items-center gap-2">
                      <Users size={48} className="text-zinc-200" />
                      <p className="font-medium">No referrals found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredReferrals.map((referral) => (
                  <tr key={referral.id} className="hover:bg-zinc-50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-partners-blue-dark/10 flex items-center justify-center text-partners-blue-dark font-bold">
                          {referral.referrer_name[0]}
                        </div>
                        <div>
                          <p className="font-bold text-zinc-900">{referral.referrer_name}</p>
                          {referral.comment && (
                            <p className="text-xs text-zinc-500 truncate max-w-[200px]">{referral.comment}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {referral.patient ? (
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-zinc-700">
                            {referral.patient.first_name} {referral.patient.last_name}
                          </span>
                        </div>
                      ) : (
                        <span className="text-zinc-400 italic text-sm">No patient linked</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        {referral.phone && (
                          <div className="flex items-center gap-2 text-sm text-zinc-600">
                            <Phone size={14} className="text-zinc-400" />
                            {referral.phone}
                          </div>
                        )}
                        {referral.email && (
                          <div className="flex items-center gap-2 text-sm text-zinc-600">
                            <Mail size={14} className="text-zinc-400" />
                            {referral.email}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-zinc-100 text-zinc-600 rounded-full text-xs font-bold">
                        {referral.relationship || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={referral.status || 'Pending'}
                        onChange={(e) => updateReferralStatus(referral.id, e.target.value)}
                        className={clsx(
                          "px-3 py-1 rounded-full text-xs font-bold border-none focus:ring-2 focus:ring-partners-blue-dark outline-none cursor-pointer",
                          referral.status === 'Approved' ? "bg-emerald-100 text-emerald-700" :
                          referral.status === 'Rejected' ? "bg-red-100 text-red-700" :
                          "bg-amber-100 text-amber-700"
                        )}
                      >
                        <option value="Pending">Pending</option>
                        <option value="Approved">Approved</option>
                        <option value="Rejected">Rejected</option>
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-zinc-600">
                        {format(new Date(referral.created_at), 'MMM d, yyyy')}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => {
                            setReferralToDelete(referral.id);
                            setIsDeleteModalOpen(true);
                          }}
                          className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                          title="Delete"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden space-y-4">
          {loading ? (
            <div className="flex flex-col items-center py-12 gap-2">
              <div className="w-8 h-8 border-4 border-partners-blue-dark border-t-transparent rounded-full animate-spin"></div>
              <p className="text-zinc-500 font-medium">Loading referrals...</p>
            </div>
          ) : filteredReferrals.length === 0 ? (
            <div className="flex flex-col items-center py-12 gap-2 text-zinc-500">
              <Users size={48} className="text-zinc-200" />
              <p className="font-medium">No referrals found</p>
            </div>
          ) : (
            filteredReferrals.map((referral) => (
              <div key={referral.id} className="bg-white p-4 rounded-2xl border border-zinc-200 shadow-sm space-y-4">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-partners-blue-dark/10 flex items-center justify-center text-partners-blue-dark font-bold">
                      {referral.referrer_name[0]}
                    </div>
                    <div>
                      <p className="font-bold text-zinc-900">{referral.referrer_name}</p>
                      <p className="text-xs text-zinc-500">
                        {format(new Date(referral.created_at), 'MMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setReferralToDelete(referral.id);
                      setIsDeleteModalOpen(true);
                    }}
                    className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4 py-3 border-y border-zinc-50">
                  <div>
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Patient</p>
                    <p className="text-sm font-medium text-zinc-700">
                      {referral.patient ? `${referral.patient.first_name} ${referral.patient.last_name}` : 'No patient linked'}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Relationship</p>
                    <span className="px-2 py-0.5 bg-zinc-100 text-zinc-600 rounded-full text-[10px] font-bold">
                      {referral.relationship || 'N/A'}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  {referral.phone && (
                    <div className="flex items-center gap-2 text-sm text-zinc-600">
                      <Phone size={14} className="text-zinc-400" />
                      {referral.phone}
                    </div>
                  )}
                  {referral.email && (
                    <div className="flex items-center gap-2 text-sm text-zinc-600">
                      <Mail size={14} className="text-zinc-400" />
                      {referral.email}
                    </div>
                  )}
                </div>

                <div className="pt-2">
                  <select
                    value={referral.status || 'Pending'}
                    onChange={(e) => updateReferralStatus(referral.id, e.target.value)}
                    className={clsx(
                      "w-full px-3 py-2 rounded-xl text-xs font-bold border-zinc-200 focus:ring-2 focus:ring-partners-blue-dark outline-none cursor-pointer",
                      referral.status === 'Approved' ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                      referral.status === 'Rejected' ? "bg-red-50 text-red-700 border-red-100" :
                      "bg-amber-50 text-amber-700 border-amber-100"
                    )}
                  >
                    <option value="Pending">Pending</option>
                    <option value="Approved">Approved</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          reset();
        }}
        title="Add New Referral"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-zinc-700">Referrer Name</label>
              <input
                {...register('referrer_name')}
                className="w-full px-4 py-2 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-partners-blue-dark outline-none transition-all"
                placeholder="Name of the person or facility referring"
              />
              {errors.referrer_name && <p className="text-xs text-red-500">{errors.referrer_name.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700">Link to Patient (Optional)</label>
              <select
                {...register('patient_id')}
                className="w-full px-4 py-2 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-partners-blue-dark outline-none transition-all"
              >
                <option value="">Select Patient</option>
                {patients.map(p => (
                  <option key={p.id} value={p.id}>{p.last_name}, {p.first_name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700">Relationship</label>
              <input
                {...register('relationship')}
                className="w-full px-4 py-2 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-partners-blue-dark outline-none transition-all"
                placeholder="e.g. PCP, Family, Hospital"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700">Phone</label>
              <input
                {...register('phone')}
                className="w-full px-4 py-2 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-partners-blue-dark outline-none transition-all"
                placeholder="Phone Number"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700">Email</label>
              <input
                {...register('email')}
                className="w-full px-4 py-2 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-partners-blue-dark outline-none transition-all"
                placeholder="Email Address"
              />
              {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700">Fax</label>
              <input
                {...register('fax')}
                className="w-full px-4 py-2 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-partners-blue-dark outline-none transition-all"
                placeholder="Fax Number"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700">Initial Status</label>
              <select
                {...register('status')}
                className="w-full px-4 py-2 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-partners-blue-dark outline-none transition-all"
              >
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-zinc-700">Comments / Notes</label>
              <textarea
                {...register('comment')}
                rows={3}
                className="w-full px-4 py-2 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-partners-blue-dark outline-none transition-all resize-none"
                placeholder="Additional details about the referral..."
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setIsModalOpen(false);
                reset();
              }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Add Referral'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setReferralToDelete(null);
        }}
        onConfirm={() => {
          if (referralToDelete) {
            deleteReferral(referralToDelete);
          }
        }}
        title="Delete Referral"
        message="Are you sure you want to delete this referral record? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
};
