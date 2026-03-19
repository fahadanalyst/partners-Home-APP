import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  User, 
  Plus,
  Search,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Filter,
  FileText,
  AlertCircle,
  CheckCircle2,
  X
} from 'lucide-react';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { Notification, NotificationType } from '../components/Notification';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { clsx } from 'clsx';

const visitSchema = z.object({
  patient_id: z.string().min(1, 'Required'),
  staff_id: z.string().min(1, 'Required'),
  scheduled_at: z.string().min(1, 'Required'),
  start_time: z.string().min(1, 'Required'),
  end_time: z.string().min(1, 'Required'),
  location: z.string().min(1, 'Required'),
  notes: z.string().optional(),
  status: z.string().min(1, 'Required'),
  cancellation_reason: z.string().optional(),
});

type VisitFormValues = z.infer<typeof visitSchema>;

interface Visit {
  id: string;
  patient_id: string;
  staff_id: string;
  scheduled_at: string;
  start_time: string | null;
  end_time: string | null;
  status: string;
  location: string;
  cancellation_reason?: string;
  patient: {
    first_name: string;
    last_name: string;
  };
  staff: {
    full_name: string;
  };
}

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
}

interface Staff {
  id: string;
  full_name: string;
}

export const Schedule: React.FC = () => {
  const [visits, setVisits] = useState<Visit[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [selectedVisitId, setSelectedVisitId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelStatus, setCancelStatus] = useState<string>('');
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);
  const [filteredPatientsForSelect, setFilteredPatients] = useState<Patient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [patientSearchTerm, setPatientSearchTerm] = useState('');
  const [notification, setNotification] = useState<{ type: NotificationType, message: string } | null>(null);

  const { register, handleSubmit, reset, setValue, formState: { errors, isSubmitting } } = useForm<VisitFormValues>({
    resolver: zodResolver(visitSchema),
    defaultValues: {
      status: 'Open'
    }
  });

  useEffect(() => {
    fetchVisits();
  }, [currentMonth]);

  useEffect(() => {
    fetchFormData();
  }, []);

  const getStatusColor = (status: string) => {
    const s = status.toLowerCase();
    if (s.includes('cancelled') || s.includes('canceled') || s === 'archived') return 'bg-red-100 text-red-700 border-red-200';
    if (s === 'approved') return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    if (s === 'scheduled') return 'bg-blue-100 text-blue-700 border-blue-200';
    if (s === 'verified' || s === 'reviewed') return 'bg-purple-100 text-purple-700 border-purple-200';
    return 'bg-zinc-100 text-zinc-600 border-zinc-200';
  };

  const fetchFormData = async () => {
    try {
      const [patientsRes, staffRes] = await Promise.all([
        supabase.from('patients').select('id, first_name, last_name').order('last_name'),
        supabase.from('profiles').select('id, full_name').order('full_name')
      ]);
      setPatients(patientsRes.data || []);
      setFilteredPatients(patientsRes.data || []);
      setStaffList(staffRes.data || []);
    } catch (error) {
      console.error('Error fetching form data:', error);
    }
  };

  const fetchVisits = async () => {
    try {
      setLoading(true);
      
      // Get start and end of current month
      const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).toISOString();
      const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0, 23, 59, 59).toISOString();

      const { data, error } = await supabase
        .from('visits')
        .select(`
          *,
          patient:patients(first_name, last_name),
          staff:profiles(full_name)
        `)
        .gte('scheduled_at', startOfMonth)
        .lte('scheduled_at', endOfMonth)
        .order('scheduled_at', { ascending: true });

      if (error) throw error;
      setVisits(data || []);
    } catch (error) {
      console.error('Error fetching visits:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      console.warn('Schedule: Form validation errors:', errors);
    }
  }, [errors]);

  const onSubmit = async (data: VisitFormValues) => {
    try {
      const response = await fetch('/api/visits/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          status: data.status || 'Open'
        })
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to schedule visit');
      
      setIsModalOpen(false);
      reset();
      setSelectedPatientId(null);
      setPatientSearchTerm('');
      fetchVisits();
      setNotification({ type: 'success', message: 'Visit scheduled successfully!' });
    } catch (error: any) {
      console.error('Error scheduling visit:', error);
      setNotification({ type: 'error', message: 'Error scheduling visit: ' + error.message });
    }
  };

  const updateVisitStatus = async (visitId: string, newStatus: string) => {
    console.log(`Schedule: Updating visit ${visitId} status to ${newStatus}`);
    
    try {
      if (newStatus === 'Verified') {
        // Check if there are any notes for this visit in either clinical_notes or form_responses
        const [notesRes, formsRes] = await Promise.all([
          supabase.from('clinical_notes').select('id').eq('visit_id', visitId),
          supabase.from('form_responses').select('id').eq('visit_id', visitId).eq('status', 'submitted')
        ]);

        if (notesRes.error) throw notesRes.error;
        if (formsRes.error) throw formsRes.error;

        const hasNotes = (notesRes.data && notesRes.data.length > 0) || (formsRes.data && formsRes.data.length > 0);

        if (!hasNotes) {
          setNotification({ type: 'warning', message: 'Cannot verify shift: Staff has not completed all notes for this shift.' });
          return;
        }
      }

      const response = await fetch('/api/visits/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: visitId, status: newStatus })
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to update status');
      
      if (selectedVisit?.id === visitId) {
        setSelectedVisit(prev => prev ? { ...prev, status: newStatus as any } : null);
      }
      
      fetchVisits();
      setNotification({ type: 'success', message: `Visit status updated to ${newStatus}` });
    } catch (error: any) {
      console.error('Error updating status:', error);
      setNotification({ type: 'error', message: 'Error updating status: ' + error.message });
    }
  };

  const handleConfirmCancel = async () => {
    console.log(`Schedule: Confirming cancellation for visit ${selectedVisitId} with reason: ${cancelReason}`);
    if (!selectedVisitId) return;

    try {
      // Update visit status and reason using backend API
      const response = await fetch('/api/visits/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id: selectedVisitId,
          status: cancelStatus,
          cancellation_reason: cancelReason 
        })
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to cancel visit');

      setIsCancelModalOpen(false);
      setCancelReason('');
      fetchVisits();
      setNotification({ type: 'success', message: 'Visit cancelled successfully' });
    } catch (error: any) {
      console.error('Error canceling visit:', error);
      setNotification({ type: 'error', message: 'Error canceling visit: ' + error.message });
    }
  };

  const filteredVisits = visits.filter(v => {
    const visitDate = new Date(v.scheduled_at).toDateString();
    const isSameDate = visitDate === selectedDate.toDateString();
    
    if (filterStatus === 'all') return isSameDate;
    return isSameDate && v.status === filterStatus;
  });

  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-zinc-900 italic">Schedule</h1>
          <p className="text-sm md:text-base text-zinc-500">Manage nursing visits and caregiver appointments</p>
        </div>
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:flex-none">
            <Button 
              variant="secondary" 
              className="rounded-full w-full"
              onClick={() => setIsFilterOpen(!isFilterOpen)}
            >
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
            
            {isFilterOpen && (
              <div className="absolute right-0 md:right-0 left-0 md:left-auto mt-2 w-full md:w-64 bg-white rounded-2xl shadow-xl border border-zinc-100 z-50 p-2 max-h-[60vh] overflow-y-auto">
                {['all', 'Scheduled', 'Approved', 'Cancelled', 'Client Cancelled – Health (MLOA)', 'Client Cancelled – Non-Medical (NMLOA)', 'Staff Cancelled', 'Office Cancelled', 'Verified'].map((status) => (
                  <button
                    key={status}
                    onClick={() => {
                      setFilterStatus(status);
                      setIsFilterOpen(false);
                    }}
                    className={clsx(
                      "w-full text-left px-4 py-2 rounded-xl text-sm capitalize transition-colors",
                      filterStatus === status ? "bg-partners-blue-dark text-white" : "hover:bg-zinc-50 text-zinc-600"
                    )}
                  >
                    {status}
                  </button>
                ))}
              </div>
            )}
          </div>
          <Button className="rounded-full px-6 flex-1 md:flex-none" onClick={() => setIsModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Schedule Visit
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Calendar Sidebar */}
        <div className="lg:col-span-1 space-y-6 order-2 lg:order-1">
          <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-zinc-900">
                {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
              </h3>
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" className="p-1" onClick={handlePrevMonth}><ChevronLeft size={18} /></Button>
                <Button variant="ghost" size="sm" className="p-1" onClick={handleNextMonth}><ChevronRight size={18} /></Button>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold text-zinc-400 mb-4">
              <div>S</div><div>M</div><div>T</div><div>W</div><div>T</div><div>F</div><div>S</div>
            </div>
            <div className="grid grid-cols-7 gap-2 text-center">
              {/* Empty cells for days before the first day of the month */}
              {Array.from({ length: firstDayOfMonth(currentMonth.getFullYear(), currentMonth.getMonth()) }).map((_, i) => (
                <div key={`empty-${i}`} className="py-2"></div>
              ))}
              {Array.from({ length: daysInMonth(currentMonth.getFullYear(), currentMonth.getMonth()) }).map((_, i) => {
                const day = i + 1;
                const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
                const isSelected = date.toDateString() === selectedDate.toDateString();
                const isToday = date.toDateString() === new Date().toDateString();
                
                return (
                  <div 
                    key={day} 
                    onClick={() => setSelectedDate(date)}
                    className={clsx(
                      "py-2 rounded-lg text-sm cursor-pointer transition-colors",
                      isSelected ? "bg-partners-blue-dark text-white shadow-md shadow-partners-blue-dark/20" : 
                      isToday ? "bg-zinc-100 text-partners-blue-dark font-bold" : "hover:bg-zinc-50 text-zinc-600"
                    )}
                  >
                    {day}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-partners-blue-dark p-6 rounded-3xl text-white shadow-lg shadow-partners-blue-dark/20">
            <h4 className="font-bold mb-2">Summary for {selectedDate.toLocaleDateString()}</h4>
            <div className="space-y-4 mt-4">
              <div className="flex justify-between items-center text-sm">
                <span className="opacity-70">Total Visits</span>
                <span className="font-bold">
                  {visits.filter(v => new Date(v.scheduled_at).toDateString() === selectedDate.toDateString()).length}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="opacity-70">Verified</span>
                <span className="font-bold">
                  {visits.filter(v => 
                    new Date(v.scheduled_at).toDateString() === selectedDate.toDateString() && 
                    v.status === 'Verified'
                  ).length}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="opacity-70">Assigned</span>
                <span className="font-bold">
                  {visits.filter(v => 
                    new Date(v.scheduled_at).toDateString() === selectedDate.toDateString() && 
                    v.status === 'Assigned'
                  ).length}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Visit List */}
        <div className="lg:col-span-2 space-y-4 order-1 lg:order-2">
          <h3 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
            <Clock className="text-partners-blue-dark" size={20} />
            {filterStatus === 'all' ? 'Upcoming Visits' : `${filterStatus.charAt(0).toUpperCase() + filterStatus.slice(1)} Visits`}
          </h3>

          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-32 bg-white rounded-3xl border border-zinc-200 animate-pulse"></div>
            ))
          ) : filteredVisits.length === 0 ? (
            <div className="bg-white p-12 rounded-3xl border border-zinc-200 text-center space-y-4">
              <div className="w-16 h-16 bg-zinc-50 rounded-full flex items-center justify-center mx-auto text-zinc-300">
                <CalendarIcon size={32} />
              </div>
              <p className="text-zinc-500">No visits found for {selectedDate.toLocaleDateString()}.</p>
              <Button variant="secondary" size="sm" onClick={() => { setIsModalOpen(true); }}>Schedule Visit</Button>
            </div>
          ) : (
            filteredVisits.map((visit) => (
              <div key={visit.id} className="bg-white p-4 md:p-6 rounded-3xl border border-zinc-200 shadow-sm hover:shadow-md transition-shadow group">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                  <div className="space-y-4 w-full">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-zinc-50 flex items-center justify-center text-partners-blue-dark shrink-0">
                        <User size={20} className="md:w-6 md:h-6" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-zinc-900 truncate">{visit.patient.last_name}, {visit.patient.first_name}</h4>
                        <p className="text-xs text-zinc-500 flex items-center gap-1">
                          <Clock size={12} />
                          {visit.start_time || '--'} - {visit.end_time || '--'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-zinc-600">
                      <div className="flex items-center gap-2">
                        <MapPin size={16} className="text-zinc-400" />
                        <span className="truncate max-w-[150px]">{visit.location}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <User size={16} className="text-zinc-400" />
                        <span className="truncate max-w-[150px]">Staff: {visit.staff.full_name}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start w-full sm:w-auto gap-4">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${getStatusColor(visit.status)}`}>
                      {visit.status === 'archived' ? (visit.cancellation_reason || 'Cancelled') : visit.status}
                    </span>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="lg:opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => {
                        setSelectedVisit(visit);
                        setIsDetailsModalOpen(true);
                      }}
                    >
                      View Details
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Cancellation Modal */}
      {isCancelModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl">
            <div className="px-8 py-6 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/50">
              <div>
                <h2 className="text-xl font-bold text-zinc-900">Cancel Visit</h2>
                <p className="text-sm text-zinc-500">Please provide a reason for cancellation</p>
              </div>
              <button onClick={() => setIsCancelModalOpen(false)} className="p-2 hover:bg-zinc-100 rounded-full transition-colors">
                <X className="w-5 h-5 text-zinc-500" />
              </button>
            </div>

            <div className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700">Reason for Cancellation</label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-rose-500 outline-none transition-all min-h-[100px]"
                  placeholder="Enter detailed reason for cancellation..."
                />
              </div>
            </div>

            <div className="px-8 py-6 border-t border-zinc-100 flex justify-end gap-3 bg-zinc-50/50">
              <button
                onClick={() => setIsCancelModalOpen(false)}
                className="px-6 py-2 rounded-xl border border-zinc-200 text-zinc-600 font-medium hover:bg-zinc-100 transition-all"
              >
                Go Back
              </button>
              <button
                onClick={handleConfirmCancel}
                className="px-6 py-2 rounded-xl bg-rose-600 text-white font-medium hover:bg-rose-700 shadow-lg shadow-rose-200 transition-all"
              >
                Confirm Cancellation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Visit Details Modal */}
      <Modal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        title="Visit Details"
        size="md"
      >
        {selectedVisit && (
          <div className="space-y-6">
            <div className="flex items-center gap-4 p-4 bg-zinc-50 rounded-2xl">
              <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center text-partners-blue-dark shadow-sm">
                <User size={32} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-zinc-900">
                  {selectedVisit.patient.last_name}, {selectedVisit.patient.first_name}
                </h3>
                <p className="text-sm text-zinc-500">Patient</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Scheduled For</p>
                <div className="flex flex-col gap-1 text-zinc-700">
                  <div className="flex items-center gap-2">
                    <CalendarIcon size={16} className="text-partners-blue-dark" />
                    {new Date(selectedVisit.scheduled_at).toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock size={16} className="text-partners-blue-dark" />
                    {selectedVisit.start_time || '--'} - {selectedVisit.end_time || '--'}
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Location</p>
                <div className="flex items-center gap-2 text-zinc-700">
                  <MapPin size={16} className="text-partners-blue-dark" />
                  {selectedVisit.location}
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Assigned Staff</p>
                <div className="flex items-center gap-2 text-zinc-700">
                  <User size={16} className="text-partners-blue-dark" />
                  {selectedVisit.staff.full_name}
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Current Status</p>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${getStatusColor(selectedVisit.status)}`}>
                    {selectedVisit.status === 'archived' ? (selectedVisit.cancellation_reason || 'Cancelled') : selectedVisit.status}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2 pt-4 border-t border-zinc-100">
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Actions</p>
              <div className="flex flex-wrap gap-2">
                <Link 
                  to={`/clinical-note-form?patientId=${selectedVisit.patient_id}&visitId=${selectedVisit.id}`}
                  className="inline-flex items-center px-4 py-2 bg-partners-blue-dark text-white rounded-xl text-sm font-bold hover:bg-blue-800 transition-colors"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Clinical Note
                </Link>
                <Link 
                  to={`/progress-note?patientId=${selectedVisit.patient_id}&visitId=${selectedVisit.id}`}
                  className="inline-flex items-center px-4 py-2 bg-partners-green text-white rounded-xl text-sm font-bold hover:bg-green-700 transition-colors"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  GAFC Progress Note
                </Link>
              </div>
            </div>

            <div className="space-y-2 pt-4 border-t border-zinc-100">
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Update Status</p>
              <div className="flex flex-wrap gap-2">
                {['Scheduled', 'Approved', 'Cancelled', 'Client Cancelled – Health (MLOA)', 'Client Cancelled – Non-Medical (NMLOA)', 'Staff Cancelled', 'Office Cancelled', 'Verified'].map((status) => {
                  const isActive = selectedVisit.status === status || 
                                 (selectedVisit.status === 'archived' && selectedVisit.cancellation_reason === status) ||
                                 (selectedVisit.status === 'reviewed' && status === 'Verified') ||
                                 (selectedVisit.status === 'scheduled' && status === 'Scheduled') ||
                                 (selectedVisit.status === 'approved' && status === 'Approved');

                  return (
                    <Button
                      key={status}
                      variant={isActive ? 'primary' : 'secondary'}
                      size="sm"
                      className={clsx(
                        "text-[10px] font-bold uppercase tracking-wider",
                        isActive && "ring-2 ring-offset-2 ring-partners-blue-dark"
                      )}
                      onClick={() => updateVisitStatus(selectedVisit.id, status)}
                    >
                      {status}
                    </Button>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end pt-6 border-t border-zinc-100">
              <Button variant="secondary" onClick={() => setIsDetailsModalOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedPatientId(null);
          setPatientSearchTerm('');
          reset();
        }}
        title="Schedule New Visit"
        size="md"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-700">Patient</label>
            <div className="relative">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
                <input
                  type="text"
                  placeholder="Search patient..."
                  value={patientSearchTerm}
                  className="w-full pl-10 pr-4 py-2 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-partners-blue-dark outline-none transition-all"
                  onChange={(e) => {
                    const term = e.target.value;
                    setPatientSearchTerm(term);
                    const filtered = patients.filter(p => 
                      `${p.first_name} ${p.last_name}`.toLowerCase().includes(term.toLowerCase())
                    );
                    setFilteredPatients(filtered);
                    setShowPatientDropdown(true);
                  }}
                  onFocus={() => setShowPatientDropdown(true)}
                />
              </div>
              
              {showPatientDropdown && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-zinc-200 rounded-xl shadow-xl max-h-60 overflow-y-auto custom-scrollbar">
                  {filteredPatientsForSelect.length === 0 ? (
                    <div className="p-4 text-sm text-zinc-500 text-center">No patients found</div>
                  ) : (
                    filteredPatientsForSelect.map(p => (
                      <button
                        key={p.id}
                        type="button"
                        className={clsx(
                          "w-full text-left px-4 py-3 text-sm hover:bg-zinc-50 transition-colors flex items-center justify-between",
                          selectedPatientId === p.id ? "bg-partners-blue-dark/5 text-partners-blue-dark font-bold" : "text-zinc-700"
                        )}
                        onClick={() => {
                          setValue('patient_id', p.id);
                          setSelectedPatientId(p.id);
                          setPatientSearchTerm(`${p.first_name} ${p.last_name}`);
                          setShowPatientDropdown(false);
                        }}
                      >
                        <span>{p.last_name}, {p.first_name}</span>
                        {selectedPatientId === p.id && <CheckCircle2 size={14} />}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
            <input type="hidden" {...register('patient_id')} />
            {errors.patient_id && <p className="text-xs text-red-500">{errors.patient_id.message}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-700">Assigned Staff</label>
            <select
              {...register('staff_id')}
              className="w-full px-4 py-2 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-partners-blue-dark outline-none transition-all"
            >
              <option value="">Select Staff</option>
              {staffList.map(s => (
                <option key={s.id} value={s.id}>{s.full_name}</option>
              ))}
            </select>
            {errors.staff_id && <p className="text-xs text-red-500">{errors.staff_id.message}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-700">Scheduled Date</label>
            <div className="relative">
              <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
              <input
                type="date"
                {...register('scheduled_at')}
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-partners-blue-dark outline-none transition-all"
              />
            </div>
            {errors.scheduled_at && <p className="text-xs text-red-500">{errors.scheduled_at.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700">Start Time</label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                <input
                  type="time"
                  {...register('start_time')}
                  className="w-full pl-10 pr-4 py-2 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-partners-blue-dark outline-none transition-all"
                />
              </div>
              {errors.start_time && <p className="text-xs text-red-500">{errors.start_time.message}</p>}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700">End Time</label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                <input
                  type="time"
                  {...register('end_time')}
                  className="w-full pl-10 pr-4 py-2 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-partners-blue-dark outline-none transition-all"
                />
              </div>
              {errors.end_time && <p className="text-xs text-red-500">{errors.end_time.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-700">Status</label>
            <select
              {...register('status')}
              className="w-full px-4 py-2 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-partners-blue-dark outline-none transition-all"
            >
              <option value="Scheduled">Scheduled</option>
              <option value="Approved">Approved</option>
              <option value="Cancelled">Cancelled</option>
              <option value="Client Cancelled – Health (MLOA)">Client Cancelled – Health (MLOA)</option>
              <option value="Client Cancelled – Non-Medical (NMLOA)">Client Cancelled – Non-Medical (NMLOA)</option>
              <option value="Staff Cancelled">Staff Cancelled</option>
              <option value="Office Cancelled">Office Cancelled</option>
              <option value="Verified">Verified</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-700">Location</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
              <input
                {...register('location')}
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-partners-blue-dark outline-none transition-all"
                placeholder="Patient's Home"
              />
            </div>
            {errors.location && <p className="text-xs text-red-500">{errors.location.message}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-700">Notes (Optional)</label>
            <textarea
              {...register('notes')}
              rows={3}
              className="w-full px-4 py-2 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-partners-blue-dark outline-none transition-all"
              placeholder="Any special instructions..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)} type="button">
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Scheduling...' : 'Schedule Visit'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Notification Toast */}
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
