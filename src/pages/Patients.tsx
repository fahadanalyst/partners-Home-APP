import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../services/supabase';
import { clsx } from 'clsx';
import { 
  Search, Plus, Trash2, Edit2, UserPlus, Filter,
  Calendar as CalendarIcon, FileText, X, ClipboardCheck,
  Stethoscope, Pill, Activity, FileSignature, UserMinus,
  ChevronDown, Paperclip,
} from 'lucide-react';
import { Button } from '../components/Button';
import { Link, useSearchParams } from 'react-router-dom';
import { Modal } from '../components/Modal';
import { Notification, NotificationType } from '../components/Notification';
import { FileUpload } from '../components/FileUpload';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const patientSchema = z.object({
  first_name: z.string().min(1, 'Required'),
  last_name: z.string().min(1, 'Required'),
  dob: z.string().min(1, 'Required'),
  gender: z.string().min(1, 'Required'),
  phone: z.string().optional(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  street: z.string().optional(),
  apt: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
  insurance_id: z.string().optional(),
  ssn_encrypted: z.string().optional(),
  status: z.enum(['active', 'inactive']).optional(),
  mloa_days: z.number().min(0).max(365).optional(),
  nmloa_days: z.number().min(0).max(365).optional(),
  last_annual_physical: z.string().optional().or(z.literal('')),
  last_semi_annual_report: z.string().optional().or(z.literal('')),
  last_monthly_visit: z.string().optional().or(z.literal('')),
  preferred_name: z.string().optional(),
  race: z.string().optional(),
  religion: z.string().optional(),
  marital_status: z.string().optional(),
  primary_language: z.string().optional(),
  height: z.string().optional(),
  weight: z.string().optional(),
  is_responsible_for_self: z.boolean().optional(),
  mds_date: z.string().optional().or(z.literal('')),
  hospital_of_choice: z.string().optional(),
  start_of_service: z.string().optional().or(z.literal('')),
  occupation: z.string().optional(),
  mothers_maiden_name: z.string().optional(),
  primary_payer: z.string().optional(),
  medicare_id: z.string().optional(),
  medicaid_id: z.string().optional(),
  other_insurance: z.string().optional(),
  other_insurance_id: z.string().optional(),
  living_will: z.string().optional(),
  full_code: z.string().optional(),
  organ_donation: z.string().optional(),
  autopsy_request: z.string().optional(),
  hospice: z.string().optional(),
  dnr: z.string().optional(),
  dni: z.string().optional(),
  dnh: z.string().optional(),
  feeding_restrictions: z.string().optional(),
  medication_restrictions: z.string().optional(),
  other_treatment_restrictions: z.string().optional(),
  emergency_contact_name: z.string().optional(),
  emergency_contact_phone: z.string().optional(),
  emergency_contact_relationship: z.string().optional(),
  emergency_contact_address: z.object({
    street: z.string().optional(), apt: z.string().optional(),
    city: z.string().optional(), state: z.string().optional(), zip: z.string().optional(),
  }).optional(),
  pcp_id: z.string().optional(),
  other_provider_ids: z.string().optional(),
  diagnoses: z.array(z.object({ disease: z.string().min(1, 'Required'), icd10: z.string().min(1, 'Required') })).optional(),
  medications: z.array(z.object({ medicine: z.string().min(1, 'Required'), dosage: z.string().min(1, 'Required'), schedule: z.string().min(1, 'Required') })).optional(),
});

type PatientFormValues = z.infer<typeof patientSchema>;

interface Patient {
  id: string; first_name: string; last_name: string; dob: string; gender: string;
  phone: string | null; email: string | null; street: string | null; apt: string | null;
  city: string | null; state: string | null; zip: string | null; insurance_id: string | null;
  ssn_encrypted: string | null; status: 'active' | 'inactive'; mloa_days: number; nmloa_days: number;
  last_annual_physical: string | null; last_semi_annual_report: string | null; last_monthly_visit: string | null;
  preferred_name: string | null; race: string | null; religion: string | null; marital_status: string | null;
  primary_language: string | null; height: string | null; weight: string | null;
  is_responsible_for_self: boolean; mds_date: string | null; hospital_of_choice: string | null;
  start_of_service: string | null; occupation: string | null; mothers_maiden_name: string | null;
  primary_payer: string | null; medicare_id: string | null; medicaid_id: string | null;
  other_insurance: string | null; other_insurance_id: string | null; living_will: string | null;
  full_code: string | null; organ_donation: string | null; autopsy_request: string | null;
  hospice: string | null; dnr: string | null; dni: string | null; dnh: string | null;
  feeding_restrictions: string | null; medication_restrictions: string | null; other_treatment_restrictions: string | null;
  emergency_contact_name: string | null; emergency_contact_phone: string | null; emergency_contact_relationship: string | null;
  emergency_contact_address: { street?: string; apt?: string; city?: string; state?: string; zip?: string; } | null;
  pcp_id: string | null; other_provider_ids: string | null;
  diagnoses: { disease: string; icd10: string; }[] | null;
  medications: { medicine: string; dosage: string; schedule: string; }[] | null;
  created_at: string; last_visit?: string;
}

export const Patients: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [patientToDelete, setPatientToDelete] = useState<string | null>(null);
  const [patientForFiles, setPatientForFiles] = useState<Patient | null>(null); // ← NEW
  const [notification, setNotification] = useState<{ type: NotificationType, message: string } | null>(null);
  const [filterStatus, setFilterStatus] = useState('All');
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [medicalProviders, setMedicalProviders] = useState<any[]>([]);
  const [searchParams] = useSearchParams();
  const editFromUrlHandled = useRef(false);

  useEffect(() => {
    const editId = searchParams.get('edit');
    if (!editId || patients.length === 0 || editFromUrlHandled.current) return;
    const patient = patients.find(p => p.id === editId);
    if (patient) { editFromUrlHandled.current = true; openEditModal(patient); }
  }, [searchParams, patients]);

  const { register, handleSubmit, reset, setValue, watch, control, formState: { errors, isSubmitting } } = useForm<PatientFormValues>({
    resolver: zodResolver(patientSchema),
    defaultValues: {
      mloa_days: 0, nmloa_days: 0, status: 'active',
      emergency_contact_address: { street: '', apt: '', city: '', state: '', zip: '' },
      diagnoses: [], medications: []
    }
  });

  const { fields: diagnosisFields, append: appendDiagnosis, remove: removeDiagnosis } = useFieldArray({ control, name: 'diagnoses' });
  const { fields: medicationFields, append: appendMedication, remove: removeMedication } = useFieldArray({ control, name: 'medications' });

  const dob = watch('dob');
  const calculateAge = (d: string) => {
    if (!d) return '';
    const bd = new Date(d); const today = new Date();
    let age = today.getFullYear() - bd.getFullYear();
    const m = today.getMonth() - bd.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < bd.getDate())) age--;
    return age;
  };

  const openEditModal = (patient: Patient) => {
    setEditingPatient(patient);
    const fields: [keyof PatientFormValues, any][] = [
      ['first_name', patient.first_name], ['last_name', patient.last_name], ['dob', patient.dob],
      ['gender', patient.gender], ['phone', patient.phone || ''], ['email', patient.email || ''],
      ['street', patient.street || ''], ['apt', patient.apt || ''], ['city', patient.city || ''],
      ['state', patient.state || ''], ['zip', patient.zip || ''], ['insurance_id', patient.insurance_id || ''],
      ['ssn_encrypted', patient.ssn_encrypted || ''], ['status', patient.status],
      ['mloa_days', patient.mloa_days || 0], ['nmloa_days', patient.nmloa_days || 0],
      ['last_annual_physical', patient.last_annual_physical || ''],
      ['last_semi_annual_report', patient.last_semi_annual_report || ''],
      ['last_monthly_visit', patient.last_monthly_visit || ''],
      ['preferred_name', patient.preferred_name || ''], ['race', patient.race || ''],
      ['religion', patient.religion || ''], ['marital_status', patient.marital_status || ''],
      ['primary_language', patient.primary_language || ''], ['height', patient.height || ''],
      ['weight', patient.weight || ''], ['is_responsible_for_self', patient.is_responsible_for_self ?? true],
      ['mds_date', patient.mds_date || ''], ['hospital_of_choice', patient.hospital_of_choice || ''],
      ['start_of_service', patient.start_of_service || ''], ['occupation', patient.occupation || ''],
      ['mothers_maiden_name', patient.mothers_maiden_name || ''], ['primary_payer', patient.primary_payer || ''],
      ['medicare_id', patient.medicare_id || ''], ['medicaid_id', patient.medicaid_id || ''],
      ['other_insurance', patient.other_insurance || ''], ['other_insurance_id', patient.other_insurance_id || ''],
      ['living_will', patient.living_will || 'No'], ['full_code', patient.full_code || 'No'],
      ['organ_donation', patient.organ_donation || 'No'], ['autopsy_request', patient.autopsy_request || 'No'],
      ['hospice', patient.hospice || 'No'], ['dnr', patient.dnr || 'No'],
      ['dni', patient.dni || 'No'], ['dnh', patient.dnh || 'No'],
      ['feeding_restrictions', patient.feeding_restrictions || 'No'],
      ['medication_restrictions', patient.medication_restrictions || 'No'],
      ['other_treatment_restrictions', patient.other_treatment_restrictions || 'No'],
      ['emergency_contact_name', patient.emergency_contact_name || ''],
      ['emergency_contact_phone', patient.emergency_contact_phone || ''],
      ['emergency_contact_relationship', patient.emergency_contact_relationship || ''],
      ['emergency_contact_address', patient.emergency_contact_address || { street: '', apt: '', city: '', state: '', zip: '' }],
      ['pcp_id', patient.pcp_id || ''], ['other_provider_ids', patient.other_provider_ids || ''],
      ['diagnoses', patient.diagnoses || []], ['medications', patient.medications || []],
    ];
    fields.forEach(([k, v]) => setValue(k, v));
    setIsModalOpen(true);
  };

  useEffect(() => { fetchPatients(); fetchMedicalProviders(); }, []);

  const fetchMedicalProviders = async () => {
    try {
      const { data, error } = await supabase.from('medical_providers').select('*').order('last_name', { ascending: true });
      if (error) throw error;
      setMedicalProviders(data || []);
    } catch (e) { console.error('Error fetching providers:', e); }
  };

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const { data: patientsData, error: patientsError } = await supabase.from('patients').select('*').order('last_name', { ascending: true });
      if (patientsError) throw patientsError;
      const { data: visitsData } = await supabase.from('visits').select('patient_id, scheduled_at').eq('status', 'Verified').order('scheduled_at', { ascending: false });
      setPatients((patientsData || []).map(p => ({ ...p, last_visit: visitsData?.find(v => v.patient_id === p.id)?.scheduled_at })));
    } catch (e) { console.error('Error fetching patients:', e); }
    finally { setLoading(false); }
  };

  const onSubmit = async (data: PatientFormValues) => {
    try {
      const patientData: any = {
        first_name: data.first_name, last_name: data.last_name, dob: data.dob, gender: data.gender,
        phone: data.phone, email: data.email, street: data.street, apt: data.apt, city: data.city,
        state: data.state, zip: data.zip, insurance_id: data.insurance_id, ssn_encrypted: data.ssn_encrypted,
        status: data.status || 'active', mloa_days: data.mloa_days, nmloa_days: data.nmloa_days,
        last_annual_physical: data.last_annual_physical || null, last_semi_annual_report: data.last_semi_annual_report || null,
        last_monthly_visit: data.last_monthly_visit || null, preferred_name: data.preferred_name || null,
        race: data.race || null, religion: data.religion || null, marital_status: data.marital_status || null,
        primary_language: data.primary_language || null, height: data.height || null, weight: data.weight || null,
        is_responsible_for_self: data.is_responsible_for_self, mds_date: data.mds_date || null,
        hospital_of_choice: data.hospital_of_choice || null, start_of_service: data.start_of_service || null,
        occupation: data.occupation || null, mothers_maiden_name: data.mothers_maiden_name || null,
        primary_payer: data.primary_payer || null, medicare_id: data.medicare_id || null,
        medicaid_id: data.medicaid_id || null, other_insurance: data.other_insurance || null,
        other_insurance_id: data.other_insurance_id || null, living_will: data.living_will || null,
        full_code: data.full_code || null, organ_donation: data.organ_donation || null,
        autopsy_request: data.autopsy_request || null, hospice: data.hospice || null,
        dnr: data.dnr || null, dni: data.dni || null, dnh: data.dnh || null,
        feeding_restrictions: data.feeding_restrictions || null, medication_restrictions: data.medication_restrictions || null,
        other_treatment_restrictions: data.other_treatment_restrictions || null,
        emergency_contact_name: data.emergency_contact_name || null, emergency_contact_phone: data.emergency_contact_phone || null,
        emergency_contact_relationship: data.emergency_contact_relationship || null,
        emergency_contact_address: data.emergency_contact_address || null, pcp_id: data.pcp_id || null,
        other_provider_ids: data.other_provider_ids || null, diagnoses: data.diagnoses || [], medications: data.medications || []
      };
      const url = editingPatient ? '/api/patients/update' : '/api/patients/create';
      const body = editingPatient ? { id: editingPatient.id, ...patientData } : patientData;
      const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to save patient');
      setNotification({ type: 'success', message: editingPatient ? 'Patient updated successfully!' : 'New patient added successfully!' });
      setIsModalOpen(false); setEditingPatient(null); reset(); await fetchPatients();
    } catch (e: any) {
      setNotification({ type: 'error', message: 'Error saving patient: ' + e.message });
    }
  };

  const handleDelete = async () => {
    if (!patientToDelete) return;
    try {
      const res = await fetch('/api/patients/delete', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: patientToDelete }) });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to delete');
      await fetchPatients();
      setNotification({ type: 'success', message: 'Patient deleted successfully.' });
    } catch (e: any) {
      setNotification({ type: 'error', message: 'Error deleting patient: ' + e.message });
    } finally { setPatientToDelete(null); }
  };

  const filteredPatients = patients.filter(p =>
    (filterStatus === 'All' || p.status === filterStatus.toLowerCase()) &&
    `${p.first_name} ${p.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const FormsDropdown = ({ patientId }: { patientId: string }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [position, setPosition] = useState<'top' | 'bottom'>('bottom');
    const containerRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
      if (isOpen && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setPosition(window.innerHeight - rect.bottom < 350 && rect.top > window.innerHeight - rect.bottom ? 'top' : 'bottom');
      }
    }, [isOpen]);
    const links = [
      { to: `/progress-note?patientId=${patientId}`, icon: <FileText size={14} className="text-emerald-500" />, label: 'Progress Note' },
      { to: `/care-plan?patientId=${patientId}`, icon: <FileText size={14} className="text-blue-500" />, label: 'Care Plan' },
      { to: `/mds-assessment?patientId=${patientId}`, icon: <ClipboardCheck size={14} className="text-cyan-500" />, label: 'MDS Assessment' },
      { to: `/nursing-assessment?patientId=${patientId}`, icon: <Stethoscope size={14} className="text-orange-500" />, label: 'Nursing Assessment' },
      { to: `/mar?patientId=${patientId}`, icon: <Pill size={14} className="text-pink-500" />, label: 'MAR' },
      { to: `/tar?patientId=${patientId}`, icon: <Activity size={14} className="text-indigo-500" />, label: 'TAR' },
      { to: `/physician-summary?patientId=${patientId}`, icon: <FileText size={14} className="text-amber-500" />, label: 'Physician Summary' },
      { to: `/physician-orders?patientId=${patientId}`, icon: <FileSignature size={14} className="text-purple-500" />, label: 'Physician Orders' },
      { to: `/admission-assessment?patientId=${patientId}`, icon: <UserPlus size={14} className="text-emerald-500" />, label: 'Admission Assessment' },
      { to: `/discharge-summary?patientId=${patientId}`, icon: <UserMinus size={14} className="text-rose-500" />, label: 'Discharge Summary' },
    ];
    return (
      <div ref={containerRef} className="relative inline-block" onMouseEnter={() => setIsOpen(true)} onMouseLeave={() => setIsOpen(false)}>
        <Button variant="ghost" size="sm" className="rounded-full text-xs flex items-center gap-1">
          Forms <ChevronDown size={14} />
        </Button>
        <div className={clsx(
          'absolute left-1/2 -translate-x-1/2 w-64 bg-white rounded-2xl border border-zinc-200 shadow-2xl z-50 overflow-hidden transition-all duration-200',
          isOpen ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none',
          position === 'bottom' ? 'top-full mt-2' : 'bottom-full mb-2'
        )}>
          <div className="p-2 grid grid-cols-1 gap-1 max-h-80 overflow-y-auto">
            {links.map(l => (
              <Link key={l.to} to={l.to} className="flex items-center gap-2 px-3 py-2 text-xs text-zinc-600 hover:bg-zinc-50 rounded-xl transition-colors">
                {l.icon} {l.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const inputCls = "w-full px-4 py-2 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-partners-blue-dark outline-none transition-all";
  const sectionTitle = "text-sm font-bold text-partners-blue-dark uppercase tracking-wider border-b-2 border-partners-blue-dark/20 pb-2";

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-zinc-900 italic">Patients</h1>
          <p className="text-sm md:text-base text-zinc-500">Manage participant records and clinical history</p>
        </div>
        <Button className="rounded-full px-6 w-full sm:w-auto" onClick={() => { setEditingPatient(null); reset(); setIsModalOpen(true); }}>
          <UserPlus className="w-4 h-4 mr-2" /> Add Patient
        </Button>
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="relative w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={20} />
          <input type="text" placeholder="Search by name..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-zinc-200 rounded-2xl focus:ring-2 focus:ring-partners-blue-dark outline-none transition-all shadow-sm" />
        </div>
        <div className="relative w-full md:w-auto">
          <Button variant="secondary" className="rounded-2xl h-[50px] w-full md:w-auto" onClick={() => setShowFilterMenu(!showFilterMenu)}>
            <Filter className="w-4 h-4 mr-2" />{filterStatus === 'All' ? 'Filter' : filterStatus}
          </Button>
          {showFilterMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl border border-zinc-200 shadow-xl z-50 overflow-hidden">
              {['All', 'Active', 'Inactive'].map(s => (
                <button key={s} onClick={() => { setFilterStatus(s); setShowFilterMenu(false); }}
                  className={`w-full text-left px-4 py-3 text-sm hover:bg-zinc-50 transition-colors ${filterStatus === s ? 'text-partners-blue-dark font-bold bg-partners-blue-dark/5' : 'text-zinc-600'}`}>
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block bg-white rounded-3xl border border-zinc-200 shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-zinc-50 border-b border-zinc-200">
              {['Name', 'DOB', 'Status', 'Last Visit'].map(h => (
                <th key={h} className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">{h}</th>
              ))}
              <th className="px-6 py-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  {[32, 24, 16, 24].map((w, j) => <td key={j} className="px-6 py-4"><div className={`h-4 bg-zinc-100 rounded w-${w}`}></div></td>)}
                  <td className="px-6 py-4"></td>
                </tr>
              ))
            ) : filteredPatients.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-12 text-center text-zinc-500">No patients found.</td></tr>
            ) : filteredPatients.map(patient => (
              <tr key={patient.id} className="hover:bg-zinc-50 transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-partners-blue-dark/10 text-partners-blue-dark flex items-center justify-center font-bold">
                      {patient.first_name[0]}{patient.last_name[0]}
                    </div>
                    <div>
                      <p className="font-bold text-zinc-900">{patient.last_name}, {patient.first_name}</p>
                      <p className="text-xs text-zinc-500">ID: {patient.id.slice(0, 8)}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-zinc-600 font-mono text-sm">{new Date(patient.dob).toLocaleDateString()}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${patient.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-zinc-100 text-zinc-600'}`}>
                    {patient.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-zinc-500 text-sm">{patient.last_visit ? new Date(patient.last_visit).toLocaleDateString() : '--'}</td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEditModal(patient)} title="Edit" className="p-2 text-zinc-400 hover:text-partners-blue-dark hover:bg-partners-blue-dark/5 rounded-xl transition-colors"><Edit2 size={16} /></button>
                    <Link to={`/patient-profile/${patient.id}`}><Button variant="ghost" size="sm" className="rounded-full text-xs">Profile</Button></Link>
                    <FormsDropdown patientId={patient.id} />
                    {/* ── Files button ── */}
                    <button onClick={() => setPatientForFiles(patient)} title="Documents & Files" className="p-2 text-zinc-400 hover:text-partners-blue-dark hover:bg-partners-blue-dark/5 rounded-xl transition-colors"><Paperclip size={16} /></button>
                    <button onClick={() => setPatientToDelete(patient.id)} title="Delete" className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"><Trash2 size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-4">
        {loading ? Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-40 bg-white rounded-3xl border border-zinc-200 animate-pulse"></div>)
          : filteredPatients.length === 0 ? <div className="bg-white p-12 rounded-3xl border border-zinc-200 text-center text-zinc-500">No patients found.</div>
          : filteredPatients.map(patient => (
            <div key={patient.id} className="bg-white p-4 rounded-3xl border border-zinc-200 shadow-sm space-y-4">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-partners-blue-dark/10 text-partners-blue-dark flex items-center justify-center font-bold">
                    {patient.first_name[0]}{patient.last_name[0]}
                  </div>
                  <div>
                    <p className="font-bold text-zinc-900">{patient.last_name}, {patient.first_name}</p>
                    <p className="text-xs text-zinc-500">ID: {patient.id.slice(0, 8)}</p>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${patient.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-zinc-100 text-zinc-600'}`}>{patient.status}</span>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><p className="text-xs text-zinc-400 font-bold uppercase">DOB</p><p className="text-zinc-600">{new Date(patient.dob).toLocaleDateString()}</p></div>
                <div><p className="text-xs text-zinc-400 font-bold uppercase">Last Visit</p><p className="text-zinc-600">{patient.last_visit ? new Date(patient.last_visit).toLocaleDateString() : '--'}</p></div>
              </div>
              <div className="flex flex-wrap gap-2 pt-2">
                <button onClick={() => openEditModal(patient)} className="p-2 text-zinc-400 hover:text-partners-blue-dark rounded-xl transition-colors"><Edit2 size={16} /></button>
                <Link to={`/patient-profile/${patient.id}`} className="flex-1"><Button variant="secondary" size="sm" className="w-full text-xs">Profile</Button></Link>
                <FormsDropdown patientId={patient.id} />
                {/* ── Files button (mobile) ── */}
                <Button variant="secondary" size="sm" className="flex-none text-zinc-500 hover:text-partners-blue-dark rounded-xl px-3" onClick={() => setPatientForFiles(patient)} title="Files"><Paperclip size={16} /></Button>
                <Button variant="secondary" size="sm" className="flex-none text-red-500 hover:text-red-700 hover:bg-red-50 rounded-xl px-3" onClick={() => setPatientToDelete(patient.id)}><Trash2 size={16} /></Button>
              </div>
            </div>
          ))}
      </div>

      {/* ── File Upload Modal ─────────────────────────────────────────────── */}
      <Modal
        isOpen={!!patientForFiles}
        onClose={() => setPatientForFiles(null)}
        title={patientForFiles ? `Files — ${patientForFiles.last_name}, ${patientForFiles.first_name}` : 'Files'}
        size="lg"
      >
        <div className="p-2">
          {patientForFiles && <FileUpload patientId={patientForFiles.id} />}
        </div>
      </Modal>

      {/* Add / Edit Patient Modal */}
      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingPatient(null); reset(); }}
        title={editingPatient ? 'Edit Patient' : 'Add New Patient'} size="lg">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">

          {/* DEMOGRAPHICS */}
          <div className="space-y-4">
            <h3 className={sectionTitle}>Demographics</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2"><label className="text-sm font-medium text-zinc-700">First Name</label><input {...register('first_name')} className={inputCls} placeholder="First Name" />{errors.first_name && <p className="text-xs text-red-500">{errors.first_name.message}</p>}</div>
              <div className="space-y-2"><label className="text-sm font-medium text-zinc-700">Last Name</label><input {...register('last_name')} className={inputCls} placeholder="Last Name" />{errors.last_name && <p className="text-xs text-red-500">{errors.last_name.message}</p>}</div>
              <div className="space-y-2"><label className="text-sm font-medium text-zinc-700">Email</label><input {...register('email')} className={inputCls} placeholder="Email" />{errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}</div>
              <div className="space-y-2"><label className="text-sm font-medium text-zinc-700">Preferred Name</label><input {...register('preferred_name')} className={inputCls} placeholder="Preferred Name" /></div>
              <div className="space-y-2"><label className="text-sm font-medium text-zinc-700">Race</label><input {...register('race')} className={inputCls} placeholder="Race" /></div>
              <div className="space-y-2"><label className="text-sm font-medium text-zinc-700">Sex</label>
                <select {...register('gender')} className={inputCls}>
                  <option value="">Select Sex</option><option value="male">Male</option><option value="female">Female</option><option value="other">Other</option>
                </select>{errors.gender && <p className="text-xs text-red-500">{errors.gender.message}</p>}</div>
              <div className="space-y-2"><label className="text-sm font-medium text-zinc-700">Religion</label><input {...register('religion')} className={inputCls} placeholder="Religion" /></div>
              <div className="space-y-2"><label className="text-sm font-medium text-zinc-700">Date of Birth</label>
                <div className="relative"><CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} /><input type="date" {...register('dob')} className={`${inputCls} pl-10`} /></div>
                {errors.dob && <p className="text-xs text-red-500">{errors.dob.message}</p>}</div>
              <div className="space-y-2"><label className="text-sm font-medium text-zinc-700">Marital Status</label>
                <select {...register('marital_status')} className={inputCls}>
                  <option value="">Select Status</option><option value="Single">Single</option><option value="Married">Married</option><option value="Divorced">Divorced</option><option value="Widowed">Widowed</option>
                </select></div>
              <div className="space-y-2"><label className="text-sm font-medium text-zinc-700">Patient Status</label>
                <select {...register('status')} className={inputCls}><option value="active">Active</option><option value="inactive">Inactive</option></select></div>
              <div className="space-y-2"><label className="text-sm font-medium text-zinc-700">Age</label><input type="text" readOnly value={calculateAge(dob)} className="w-full px-4 py-2 rounded-xl border border-zinc-200 bg-zinc-50 text-zinc-500 outline-none" placeholder="Auto from DOB" /></div>
              <div className="space-y-2"><label className="text-sm font-medium text-zinc-700">Primary Language</label><input {...register('primary_language')} className={inputCls} placeholder="Primary Language" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><label className="text-sm font-medium text-zinc-700">Height</label><input {...register('height')} className={inputCls} placeholder="e.g. 5ft 10in" /></div>
                <div className="space-y-2"><label className="text-sm font-medium text-zinc-700">Weight</label><input {...register('weight')} className={inputCls} placeholder="e.g. 160 lbs" /></div>
              </div>
              <div className="flex items-center gap-2 pt-6">
                <input type="checkbox" {...register('is_responsible_for_self')} className="w-4 h-4 rounded border-zinc-300 text-partners-blue-dark focus:ring-partners-blue-dark" />
                <label className="text-sm font-medium text-zinc-700">Is Responsible for Self</label>
              </div>
            </div>
          </div>

          {/* CENSUS SUMMARY */}
          <div className="space-y-4">
            <h3 className={sectionTitle}>Census Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { label: 'MDS Date', name: 'mds_date' }, { label: 'Start of Service', name: 'start_of_service' },
                { label: 'Last Annual Physical', name: 'last_annual_physical' },
                { label: 'Last Semi-Annual Report', name: 'last_semi_annual_report' },
                { label: 'Last Monthly Visit', name: 'last_monthly_visit' },
              ].map(f => (
                <div key={f.name} className="space-y-2"><label className="text-sm font-medium text-zinc-700">{f.label}</label><input type="date" {...register(f.name as any)} className={inputCls} /></div>
              ))}
              <div className="space-y-2"><label className="text-sm font-medium text-zinc-700">Hospital of Choice</label><input {...register('hospital_of_choice')} className={inputCls} placeholder="Hospital Name" /></div>
              <div className="space-y-2"><label className="text-sm font-medium text-zinc-700">MLOA Days</label><input type="number" {...register('mloa_days', { valueAsNumber: true })} className={inputCls} placeholder="0" /></div>
              <div className="space-y-2"><label className="text-sm font-medium text-zinc-700">NMLOA Days</label><input type="number" {...register('nmloa_days', { valueAsNumber: true })} className={inputCls} placeholder="0" /></div>
            </div>
          </div>

          {/* PERSONAL INFORMATION */}
          <div className="space-y-4">
            <h3 className={sectionTitle}>Personal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2 md:col-span-2"><label className="text-sm font-medium text-zinc-700">Address (Street)</label><input {...register('street')} className={inputCls} placeholder="Street Address" /></div>
              {[{ label: 'Apt', name: 'apt', ph: 'Apt #' }, { label: 'City', name: 'city', ph: 'City' }, { label: 'State', name: 'state', ph: 'State' }, { label: 'Zip', name: 'zip', ph: 'Zip Code' }, { label: 'Telephone', name: 'phone', ph: 'Phone' }, { label: 'Occupation', name: 'occupation', ph: 'Occupation' }, { label: "Mother's Maiden Name", name: 'mothers_maiden_name', ph: "Mother's Maiden Name" }].map(f => (
                <div key={f.name} className="space-y-2"><label className="text-sm font-medium text-zinc-700">{f.label}</label><input {...register(f.name as any)} className={inputCls} placeholder={f.ph} /></div>
              ))}
            </div>
          </div>

          {/* PAYER INFORMATION */}
          <div className="space-y-4">
            <h3 className={sectionTitle}>Payer Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[{ label: 'Primary Payer', name: 'primary_payer', ph: 'Primary Payer Name' }, { label: 'SSN', name: 'ssn_encrypted', ph: 'SSN' }, { label: 'Medical Record #', name: 'insurance_id', ph: 'Medical Record #' }, { label: 'Medicare ID#', name: 'medicare_id', ph: 'Medicare ID#' }, { label: 'Medicaid ID#', name: 'medicaid_id', ph: 'Medicaid ID#' }].map(f => (
                <div key={f.name} className="space-y-2"><label className="text-sm font-medium text-zinc-700">{f.label}</label><input {...register(f.name as any)} className={inputCls} placeholder={f.ph} /></div>
              ))}
            </div>
          </div>

          {/* OTHER INSURANCE */}
          <div className="space-y-4">
            <h3 className={sectionTitle}>Other Insurance Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2"><label className="text-sm font-medium text-zinc-700">Insurance</label><input {...register('other_insurance')} className={inputCls} placeholder="Insurance Name" /></div>
              <div className="space-y-2"><label className="text-sm font-medium text-zinc-700">ID Number</label><input {...register('other_insurance_id')} className={inputCls} placeholder="ID Number" /></div>
            </div>
          </div>

          {/* ADVANCED DIRECTIVES */}
          <div className="space-y-4">
            <h3 className={sectionTitle}>Advanced Directives</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { name: 'living_will', label: 'Living Will' }, { name: 'dnr', label: 'DNR' }, { name: 'full_code', label: 'Full Code' },
                { name: 'dni', label: 'DNI' }, { name: 'organ_donation', label: 'Organ Donation' }, { name: 'dnh', label: 'DNH' },
                { name: 'autopsy_request', label: 'Autopsy Request' }, { name: 'feeding_restrictions', label: 'Feeding Restrictions' },
                { name: 'hospice', label: 'Hospice' }, { name: 'medication_restrictions', label: 'Medication Restrictions' },
                { name: 'other_treatment_restrictions', label: 'Other Treatment Restrictions' },
              ].map(f => (
                <div key={f.name} className="space-y-1">
                  <label className="text-xs font-medium text-zinc-700">{f.label}</label>
                  <select {...register(f.name as any)} className="w-full px-3 py-1.5 rounded-lg border border-zinc-200 text-sm focus:ring-2 focus:ring-partners-blue-dark outline-none">
                    <option value="No">No</option><option value="Yes">Yes</option><option value="Not Applicable">Not Applicable</option>
                  </select>
                </div>
              ))}
            </div>
          </div>

          {/* PCP */}
          <div className="space-y-4">
            <h3 className={sectionTitle}>Primary Care Physician</h3>
            <div className="space-y-2"><label className="text-sm font-medium text-zinc-700">Select PCP</label>
              <select {...register('pcp_id')} className={inputCls}>
                <option value="">Select a Provider</option>
                {medicalProviders.map(p => <option key={p.id} value={p.id}>{p.last_name}, {p.first_name} — {p.facility_name}</option>)}
              </select>
              <p className="text-[10px] text-zinc-400 italic">Define providers in medical-providers and attach to patient</p>
            </div>
          </div>

          {/* OTHER PROVIDERS */}
          <div className="space-y-4">
            <h3 className={sectionTitle}>Other Provider(s)</h3>
            <textarea {...register('other_provider_ids')} className="w-full px-4 py-2 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-partners-blue-dark outline-none transition-all min-h-[80px]" placeholder="Enter other provider names or IDs..." />
          </div>

          {/* DIAGNOSES */}
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b-2 border-partners-blue-dark/20 pb-2">
              <h3 className="text-sm font-bold text-partners-blue-dark uppercase tracking-wider">Current Diagnosis</h3>
              <Button type="button" variant="ghost" size="sm" onClick={() => appendDiagnosis({ disease: '', icd10: '' })}><Plus size={16} className="mr-1" /> Add Diagnosis</Button>
            </div>
            {diagnosisFields.map((field, index) => (
              <div key={field.id} className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-zinc-50 p-4 rounded-2xl relative">
                <button type="button" onClick={() => removeDiagnosis(index)} className="absolute top-2 right-2 p-1 text-zinc-400 hover:text-red-500"><X size={16} /></button>
                <div className="space-y-2"><label className="text-xs font-medium text-zinc-700 uppercase">Disease</label><input {...register(`diagnoses.${index}.disease` as const)} className="w-full px-4 py-2 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-partners-blue-dark outline-none bg-white" placeholder="Disease Name" /></div>
                <div className="space-y-2"><label className="text-xs font-medium text-zinc-700 uppercase">ICD-10 Code</label><input {...register(`diagnoses.${index}.icd10` as const)} className="w-full px-4 py-2 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-partners-blue-dark outline-none bg-white" placeholder="ICD-10 Code" /></div>
              </div>
            ))}
          </div>

          {/* EMERGENCY CONTACT */}
          <div className="space-y-4">
            <h3 className={sectionTitle}>Emergency Contact</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2"><label className="text-sm font-medium text-zinc-700">Name</label><input {...register('emergency_contact_name')} className={inputCls} placeholder="Contact Name" /></div>
              <div className="space-y-2"><label className="text-sm font-medium text-zinc-700">Phone</label><input {...register('emergency_contact_phone')} className={inputCls} placeholder="Phone" /></div>
              <div className="space-y-2"><label className="text-sm font-medium text-zinc-700">Relationship</label><input {...register('emergency_contact_relationship')} className={inputCls} placeholder="Relationship" /></div>
              <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 md:col-span-2"><label className="text-sm font-medium text-zinc-700">Address (Street)</label><input {...register('emergency_contact_address.street')} className={inputCls} placeholder="Street" /></div>
                {['apt', 'city', 'state', 'zip'].map(f => (
                  <div key={f} className="space-y-2"><label className="text-sm font-medium text-zinc-700 capitalize">{f}</label><input {...register(`emergency_contact_address.${f}` as any)} className={inputCls} placeholder={f.charAt(0).toUpperCase() + f.slice(1)} /></div>
                ))}
              </div>
            </div>
          </div>

          {/* MEDICATIONS */}
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b-2 border-partners-blue-dark/20 pb-2">
              <h3 className="text-sm font-bold text-partners-blue-dark uppercase tracking-wider">Medications</h3>
              <Button type="button" variant="ghost" size="sm" onClick={() => appendMedication({ medicine: '', dosage: '', schedule: 'once a day' })}><Plus size={16} className="mr-1" /> Add Medication</Button>
            </div>
            {medicationFields.map((field, index) => (
              <div key={field.id} className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-zinc-50 p-4 rounded-2xl relative">
                <button type="button" onClick={() => removeMedication(index)} className="absolute top-2 right-2 p-1 text-zinc-400 hover:text-red-500"><X size={16} /></button>
                <div className="space-y-2"><label className="text-xs font-medium text-zinc-700 uppercase">Medicine</label><input {...register(`medications.${index}.medicine` as const)} className="w-full px-4 py-2 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-partners-blue-dark outline-none bg-white" placeholder="Medicine Name" /></div>
                <div className="space-y-2"><label className="text-xs font-medium text-zinc-700 uppercase">Dosage</label><input {...register(`medications.${index}.dosage` as const)} className="w-full px-4 py-2 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-partners-blue-dark outline-none bg-white" placeholder="Dosage" /></div>
                <div className="space-y-2"><label className="text-xs font-medium text-zinc-700 uppercase">Schedule</label>
                  <select {...register(`medications.${index}.schedule` as const)} className="w-full px-4 py-2 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-partners-blue-dark outline-none bg-white">
                    <option value="once a day">Once a day</option><option value="twice a day">Twice a day</option>
                    <option value="three times a day">Three times a day</option><option value="four times a day">Four times a day</option>
                    <option value="as needed">As needed</option>
                  </select>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-zinc-100">
            <Button variant="secondary" onClick={() => { setIsModalOpen(false); setEditingPatient(null); reset(); }} type="button">Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Saving...' : editingPatient ? 'Update Patient' : 'Add Patient'}</Button>
          </div>
        </form>
      </Modal>

      {/* Delete Modal */}
      <Modal isOpen={!!patientToDelete} onClose={() => setPatientToDelete(null)} title="Confirm Deletion" size="sm">
        <div className="space-y-6">
          <div className="flex items-center gap-4 p-4 bg-red-50 rounded-2xl border border-red-100">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center shrink-0"><Trash2 className="text-red-600" size={24} /></div>
            <div><p className="text-sm font-bold text-red-900">Are you sure?</p><p className="text-xs text-red-700">This action cannot be undone and will permanently delete the patient record.</p></div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setPatientToDelete(null)}>Cancel</Button>
            <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={handleDelete}>Delete Record</Button>
          </div>
        </div>
      </Modal>

      {notification && <Notification type={notification.type} message={notification.message} onClose={() => setNotification(null)} />}
    </div>
  );
};