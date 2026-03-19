import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { 
  Building2, 
  Search, 
  Plus, 
  MoreVertical, 
  Trash2,
  Edit2,
  Phone,
  Mail,
  MapPin,
  Printer,
  X,
  User,
  CheckCircle,
  Stethoscope
} from 'lucide-react';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { clsx } from 'clsx';

const providerSchema = z.object({
  first_name: z.string().min(1, 'Required'),
  last_name: z.string().min(1, 'Required'),
  facility_name: z.string().min(1, 'Required'),
  street: z.string().optional(),
  apt: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
  phone: z.string().optional(),
  fax: z.string().optional(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
});

type ProviderFormValues = z.infer<typeof providerSchema>;

interface MedicalProvider {
  id: string;
  first_name: string;
  last_name: string;
  facility_name: string;
  street: string | null;
  apt: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  phone: string | null;
  fax: string | null;
  email: string | null;
  created_at: string;
}

export const MedicalProviders: React.FC = () => {
  const [providers, setProviders] = useState<MedicalProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProvider, setEditingProvider] = useState<MedicalProvider | null>(null);
  const [providerToDelete, setProviderToDelete] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const { register, handleSubmit, reset, setValue, formState: { errors, isSubmitting } } = useForm<ProviderFormValues>({
    resolver: zodResolver(providerSchema)
  });

  useEffect(() => {
    fetchProviders();
  }, []);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const fetchProviders = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('medical_providers')
        .select('*')
        .order('last_name', { ascending: true });

      if (error) {
        // If table doesn't exist, we'll handle it gracefully
        if (error.code === '42P01') {
          console.warn('Medical Providers table does not exist yet.');
          setProviders([]);
        } else {
          throw error;
        }
      } else {
        setProviders(data || []);
      }
    } catch (error) {
      console.error('Error fetching providers:', error);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: ProviderFormValues) => {
    try {
      if (editingProvider) {
        const response = await fetch('/api/medical-providers/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingProvider.id, ...data })
        });
        
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Failed to update provider');
        
        setNotification({ type: 'success', message: 'Provider updated successfully!' });
      } else {
        const response = await fetch('/api/medical-providers/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Failed to create provider');
        
        setNotification({ type: 'success', message: 'Provider added successfully!' });
      }
      
      setIsModalOpen(false);
      setEditingProvider(null);
      reset();
      fetchProviders();
    } catch (error: any) {
      console.error('Error saving provider:', error);
      setNotification({ type: 'error', message: 'Error saving provider: ' + (error.message || 'Check console for details') });
    }
  };

  const handleDelete = async () => {
    if (!providerToDelete) return;

    try {
      const response = await fetch('/api/medical-providers/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: providerToDelete })
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to delete provider');
      
      fetchProviders();
      setNotification({ type: 'success', message: 'Provider deleted successfully.' });
    } catch (error: any) {
      console.error('Error deleting provider:', error);
      setNotification({ type: 'error', message: 'Error deleting provider: ' + (error.message || 'Check console for details') });
    } finally {
      setProviderToDelete(null);
    }
  };

  const openEditModal = (provider: MedicalProvider) => {
    setEditingProvider(provider);
    setValue('first_name', provider.first_name);
    setValue('last_name', provider.last_name);
    setValue('facility_name', provider.facility_name);
    setValue('street', provider.street || '');
    setValue('apt', provider.apt || '');
    setValue('city', provider.city || '');
    setValue('state', provider.state || '');
    setValue('zip', provider.zip || '');
    setValue('phone', provider.phone || '');
    setValue('fax', provider.fax || '');
    setValue('email', provider.email || '');
    setIsModalOpen(true);
  };

  const filteredProviders = providers.filter(p => 
    `${p.first_name} ${p.last_name} ${p.facility_name}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-zinc-900 italic">Medical Providers</h1>
          <p className="text-sm md:text-base text-zinc-500">Directory of physicians, specialists, and facilities</p>
        </div>
        <Button className="rounded-full px-6 w-full sm:w-auto" onClick={() => {
          setEditingProvider(null);
          reset();
          setIsModalOpen(true);
        }}>
          <Plus className="w-4 h-4 mr-2" />
          Add Provider
        </Button>
      </div>

      <div className="relative w-full">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={20} />
        <input
          type="text"
          placeholder="Search by name or facility..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-white border border-zinc-200 rounded-2xl focus:ring-2 focus:ring-partners-blue-dark outline-none transition-all shadow-sm"
        />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-48 bg-white rounded-3xl border border-zinc-200 animate-pulse"></div>
          ))}
        </div>
      ) : filteredProviders.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-zinc-200 text-center space-y-4 shadow-sm">
          <div className="w-16 h-16 bg-zinc-50 rounded-full flex items-center justify-center mx-auto text-zinc-300">
            <Stethoscope size={32} />
          </div>
          <p className="text-zinc-500">No medical providers found.</p>
          <Button variant="secondary" size="sm" onClick={() => setIsModalOpen(true)}>Add Your First Provider</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProviders.map((provider) => (
            <div key={provider.id} className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm hover:shadow-md transition-all group relative">
              <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => openEditModal(provider)}
                  className="p-2 text-zinc-400 hover:text-partners-blue-dark hover:bg-partners-blue-dark/5 rounded-xl transition-colors"
                >
                  <Edit2 size={16} />
                </button>
                <button 
                  onClick={() => setProviderToDelete(provider.id)}
                  className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-partners-blue-dark/10 text-partners-blue-dark flex items-center justify-center shrink-0">
                    <User size={24} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-zinc-900 truncate">{provider.first_name} {provider.last_name}</h3>
                    <p className="text-sm text-partners-blue-dark font-medium truncate flex items-center gap-1">
                      <Building2 size={14} />
                      {provider.facility_name}
                    </p>
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-zinc-50">
                  {provider.phone && (
                    <div className="flex items-center gap-2 text-sm text-zinc-600">
                      <Phone size={14} className="text-zinc-400" />
                      {provider.phone}
                    </div>
                  )}
                  {provider.fax && (
                    <div className="flex items-center gap-2 text-sm text-zinc-600">
                      <Printer size={14} className="text-zinc-400" />
                      Fax: {provider.fax}
                    </div>
                  )}
                  {provider.email && (
                    <div className="flex items-center gap-2 text-sm text-zinc-600">
                      <Mail size={14} className="text-zinc-400" />
                      <span className="truncate">{provider.email}</span>
                    </div>
                  )}
                  {(provider.street || provider.city) && (
                    <div className="flex items-start gap-2 text-sm text-zinc-600">
                      <MapPin size={14} className="text-zinc-400 mt-0.5" />
                      <span className="line-clamp-2">
                        {provider.street}{provider.apt ? `, ${provider.apt}` : ''}
                        {(provider.street || provider.apt) && (provider.city || provider.state || provider.zip) ? <br /> : ''}
                        {provider.city}{provider.city && (provider.state || provider.zip) ? ', ' : ''}{provider.state} {provider.zip}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingProvider(null);
          reset();
        }}
        title={editingProvider ? "Edit Provider" : "Add Medical Provider"}
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700">First Name</label>
              <input
                {...register('first_name')}
                className="w-full px-4 py-2 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-partners-blue-dark outline-none transition-all"
                placeholder="Dr. Jane"
              />
              {errors.first_name && <p className="text-xs text-red-500">{errors.first_name.message}</p>}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700">Last Name</label>
              <input
                {...register('last_name')}
                className="w-full px-4 py-2 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-partners-blue-dark outline-none transition-all"
                placeholder="Smith"
              />
              {errors.last_name && <p className="text-xs text-red-500">{errors.last_name.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-700">Facility Name</label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
              <input
                {...register('facility_name')}
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-partners-blue-dark outline-none transition-all"
                placeholder="General Hospital / Clinic Name"
              />
            </div>
            {errors.facility_name && <p className="text-xs text-red-500">{errors.facility_name.message}</p>}
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-3 space-y-2">
                <label className="text-sm font-medium text-zinc-700">Street Address</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                  <input
                    {...register('street')}
                    className="w-full pl-10 pr-4 py-2 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-partners-blue-dark outline-none transition-all"
                    placeholder="123 Medical Way"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700">Apt/Suite</label>
                <input
                  {...register('apt')}
                  className="w-full px-4 py-2 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-partners-blue-dark outline-none transition-all"
                  placeholder="Suite 400"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700">City</label>
                <input
                  {...register('city')}
                  className="w-full px-4 py-2 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-partners-blue-dark outline-none transition-all"
                  placeholder="Boston"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700">State</label>
                <input
                  {...register('state')}
                  className="w-full px-4 py-2 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-partners-blue-dark outline-none transition-all"
                  placeholder="MA"
                />
              </div>
              <div className="col-span-2 md:col-span-1 space-y-2">
                <label className="text-sm font-medium text-zinc-700">ZIP Code</label>
                <input
                  {...register('zip')}
                  className="w-full px-4 py-2 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-partners-blue-dark outline-none transition-all"
                  placeholder="02114"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                <input
                  {...register('phone')}
                  className="w-full pl-10 pr-4 py-2 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-partners-blue-dark outline-none transition-all"
                  placeholder="(555) 000-0000"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700">Fax Number</label>
              <div className="relative">
                <Printer className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                <input
                  {...register('fax')}
                  className="w-full pl-10 pr-4 py-2 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-partners-blue-dark outline-none transition-all"
                  placeholder="(555) 000-0001"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-700">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
              <input
                type="email"
                {...register('email')}
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-partners-blue-dark outline-none transition-all"
                placeholder="provider@example.com"
              />
            </div>
            {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)} type="button">
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : editingProvider ? 'Update Provider' : 'Add Provider'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!providerToDelete}
        onClose={() => setProviderToDelete(null)}
        title="Confirm Deletion"
        size="sm"
      >
        <div className="space-y-6">
          <div className="flex items-center gap-4 p-4 bg-red-50 rounded-2xl border border-red-100">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center shrink-0">
              <Trash2 className="text-red-600" size={24} />
            </div>
            <div>
              <p className="text-sm font-bold text-red-900">Are you sure?</p>
              <p className="text-xs text-red-700">This will permanently remove this provider from your directory.</p>
            </div>
          </div>
          
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setProviderToDelete(null)}>
              Cancel
            </Button>
            <Button 
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={handleDelete}
            >
              Delete Provider
            </Button>
          </div>
        </div>
      </Modal>

      {/* Notification Toast */}
      {notification && (
        <div className={clsx(
          "fixed bottom-8 right-8 z-[100] px-6 py-4 rounded-2xl shadow-2xl border animate-in slide-in-from-bottom-4 duration-300 flex items-center gap-3",
          notification.type === 'success' ? "bg-emerald-50 border-emerald-100 text-emerald-800" : "bg-red-50 border-red-100 text-red-800"
        )}>
          {notification.type === 'success' ? (
            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
              <CheckCircle className="text-emerald-600" size={18} />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center shrink-0">
              <Trash2 className="text-red-600" size={18} />
            </div>
          )}
          <p className="text-sm font-bold">{notification.message}</p>
          <button onClick={() => setNotification(null)} className="ml-4 text-zinc-400 hover:text-zinc-600">
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
};
