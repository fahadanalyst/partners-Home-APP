import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { 
  User, 
  Calendar, 
  Phone, 
  Mail, 
  MapPin, 
  Shield, 
  ArrowLeft,
  FileText,
  Activity,
  ClipboardList,
  Clock,
  ChevronRight,
  Edit2,
  Printer,
  AlertCircle,
  CheckCircle2,
  ClipboardCheck,
  Stethoscope,
  Pill,
  FileSignature,
  UserPlus,
  UserMinus,
  Upload,
  Eye,
  Trash2,
  Paperclip,
  Loader2
} from 'lucide-react';
import { Button } from '../components/Button';
import { Logo } from '../components/Logo';
import { format, addYears, addMonths, isAfter, isBefore, subDays, addDays } from 'date-fns';
import { generateFormPDF } from '../services/pdfService';
import { PrintPreviewModal } from '../components/PrintPreviewModal';
import { PatientSummaryTemplate } from '../components/PDFTemplates/PatientSummaryTemplate';

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  dob: string;
  gender: string;
  phone: string | null;
  email: string | null;
  street: string | null;
  apt: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  insurance_id: string | null;
  ssn_encrypted: string | null;
  status: string;
  mloa_days: number;
  nmloa_days: number;
  last_annual_physical: string | null;
  last_semi_annual_report: string | null;
  last_monthly_visit: string | null;
  preferred_name: string | null;
  race: string | null;
  religion: string | null;
  marital_status: string | null;
  primary_language: string | null;
  height: string | null;
  weight: string | null;
  is_responsible_for_self: boolean;
  mds_date: string | null;
  hospital_of_choice: string | null;
  start_of_service: string | null;
  occupation: string | null;
  mothers_maiden_name: string | null;
  primary_payer: string | null;
  medicare_id: string | null;
  medicaid_id: string | null;
  other_insurance: string | null;
  other_insurance_id: string | null;
  living_will: string | null;
  full_code: string | null;
  organ_donation: string | null;
  autopsy_request: string | null;
  hospice: string | null;
  dnr: string | null;
  dni: string | null;
  dnh: string | null;
  feeding_restrictions: string | null;
  medication_restrictions: string | null;
  other_treatment_restrictions: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  emergency_contact_relationship: string | null;
  emergency_contact_address: {
    street?: string;
    apt?: string;
    city?: string;
    state?: string;
    zip?: string;
  } | null;
  pcp_id: string | null;
  other_provider_ids: string | null;
  diagnoses: {
    disease: string;
    icd10: string;
  }[] | null;
  medications: {
    medicine: string;
    dosage: string;
    schedule: string;
  }[] | null;
  created_at: string;
}

interface Visit {
  id: string;
  scheduled_at: string;
  status: string;
  type: string;
}

interface PatientFile {
  id: string;
  name: string;
  size: string;
  url: string;
  uploaded_at: string;
}

const ComplianceItem: React.FC<{ 
  title: string; 
  lastDate: string | null; 
  dueDate: Date | null;
  type: string;
}> = ({ title, lastDate, dueDate }) => {
  const today = new Date();
  const isOverdue = dueDate && isBefore(dueDate, today);
  const isDueSoon = dueDate && !isOverdue && isBefore(dueDate, addDays(today, 30));
  const isOverdueAlert = dueDate && isOverdue && isBefore(today, addDays(dueDate, 5));

  return (
    <div className={`p-4 rounded-2xl border transition-all ${
      isOverdue ? 'bg-red-50 border-red-100' : 
      isDueSoon ? 'bg-amber-50 border-amber-100' : 
      'bg-zinc-50 border-zinc-100'
    }`}>
      <div className="flex justify-between items-start mb-2">
        <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">{title}</p>
        {isOverdue ? (
          <span className="flex items-center gap-1 text-[10px] font-bold text-red-600 uppercase">
            <AlertCircle size={12} />
            Overdue
          </span>
        ) : isDueSoon ? (
          <span className="flex items-center gap-1 text-[10px] font-bold text-amber-600 uppercase">
            <Clock size={12} />
            Due Soon
          </span>
        ) : (
          <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 uppercase">
            <CheckCircle2 size={12} />
            Compliant
          </span>
        )}
      </div>
      <div className="space-y-1">
        <p className="text-sm font-bold text-zinc-900">
          {lastDate ? format(new Date(lastDate), 'MMM d, yyyy') : 'Never'}
        </p>
        <p className="text-[10px] text-zinc-500">
          Next Due: {dueDate ? format(dueDate, 'MMM d, yyyy') : 'TBD'}
        </p>
      </div>
      {isOverdueAlert && (
        <div className="mt-3 p-2 bg-red-100/50 rounded-lg text-[10px] text-red-700 font-medium flex items-center gap-1 animate-pulse">
          <AlertCircle size={12} />
          Critical: Action required immediately
        </div>
      )}
    </div>
  );
};

export const PatientProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);
  const [printing, setPrinting] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // File management state
  const [patientFiles, setPatientFiles] = useState<PatientFile[]>([]);
  const [uploadingFile, setUploadingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (id) {
      fetchPatientData();
      fetchPatientFiles();
    }
  }, [id]);

  const fetchPatientData = async () => {
    try {
      setLoading(true);
      
      const { data: patientData, error: patientError } = await supabase
        .from('patients')
        .select('*')
        .eq('id', id)
        .single();

      if (patientError) throw patientError;
      setPatient(patientData);

      const { data: visitsData, error: visitsError } = await supabase
        .from('visits')
        .select('*')
        .eq('patient_id', id)
        .order('scheduled_at', { ascending: false });

      if (visitsError) throw visitsError;
      setVisits(visitsData || []);

    } catch (error) {
      console.error('Error fetching patient data:', error);
      navigate('/patients');
    } finally {
      setLoading(false);
    }
  };

  const fetchPatientFiles = async () => {
    try {
      const { data, error } = await supabase
        .storage
        .from('patient-files')
        .list(`${id}/`, { sortBy: { column: 'created_at', order: 'desc' } });

      if (error) throw error;

      const files = await Promise.all(
        (data || []).map(async (file) => {
          const { data: urlData } = supabase.storage
            .from('patient-files')
            .getPublicUrl(`${id}/${file.name}`);
          return {
            id: file.id ?? file.name,
            name: file.name,
            size: file.metadata?.size
              ? `${(file.metadata.size / 1024).toFixed(1)} KB`
              : 'Unknown',
            url: urlData.publicUrl,
            uploaded_at: file.created_at ?? new Date().toISOString(),
          };
        })
      );
      setPatientFiles(files);
    } catch (err) {
      console.error('Error fetching patient files:', err);
    }
  };

  const handleFileUpload = async (file: File) => {
    try {
      setUploadingFile(true);
      const filePath = `${id}/${Date.now()}_${file.name}`;
      const { error } = await supabase.storage
        .from('patient-files')
        .upload(filePath, file);
      if (error) throw error;
      await fetchPatientFiles();
    } catch (err) {
      console.error('Error uploading file:', err);
    } finally {
      setUploadingFile(false);
    }
  };

  const handleDeleteFile = async (fileId: string, fileUrl: string) => {
    try {
      const parts = fileUrl.split(`${id}/`);
      const fileName = parts[parts.length - 1];
      const { error } = await supabase.storage
        .from('patient-files')
        .remove([`${id}/${fileName}`]);
      if (error) throw error;
      await fetchPatientFiles();
    } catch (err) {
      console.error('Error deleting file:', err);
    }
  };

  const handlePrint = async () => {
    if (!patient) return;
    try {
      setPrinting(true);
      await generateFormPDF('Patient Summary', { patient, visits }, `Patient_Summary_${patient.last_name}_${patient.first_name}.pdf`);
    } catch (error) {
      console.error('Error printing summary:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setPrinting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-partners-blue-dark"></div>
      </div>
    );
  }

  if (!patient) return null;

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <Link to="/patients" className="flex items-center gap-2 text-zinc-500 hover:text-partners-blue-dark transition-colors">
          <ArrowLeft size={20} />
          <span className="font-medium">Back to Patients</span>
        </Link>
        <div className="flex gap-3">
          <Button variant="secondary" size="sm" onClick={() => navigate(`/patients?edit=${patient.id}`)}>
            <Edit2 size={16} className="mr-2" />
            Edit Profile
          </Button>
          <Button size="sm" onClick={() => setIsPreviewOpen(true)}>
            <Printer size={16} className="mr-2" />
            Print Summary
          </Button>
        </div>
      </div>

      <PrintPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        template={PatientSummaryTemplate}
        data={{ patient, visits }}
        title="Patient Summary"
        filename={`Patient_Summary_${patient.last_name}_${patient.first_name}.pdf`}
      />

      {/* Header Card */}
      <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm overflow-hidden">
        <div className="bg-partners-blue-dark/5 p-4 sm:p-8 border-b border-zinc-100">
          <div className="flex flex-col md:flex-row gap-8 items-start md:items-center">
            <div className="w-24 h-24 rounded-3xl bg-partners-blue-dark text-white flex items-center justify-center text-2xl sm:text-4xl font-bold shadow-lg">
              {patient.first_name?.[0] || 'P'}{patient.last_name?.[0] || 'T'}
            </div>
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-4">
                <h1 className="text-xl sm:text-3xl font-bold text-zinc-900">{patient.last_name || 'Patient'}, {patient.first_name || ''}</h1>
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                  patient.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-zinc-100 text-zinc-600'
                }`}>
                  {patient.status}
                </span>
              </div>
              <div className="flex flex-wrap gap-6 text-zinc-500">
                <div className="flex items-center gap-2">
                  <Calendar size={18} className="text-zinc-400" />
                  <span>DOB: {patient.dob ? format(new Date(patient.dob), 'MMMM d, yyyy') : 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <User size={18} className="text-zinc-400" />
                  <span className="capitalize">{patient.gender}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield size={18} className="text-zinc-400" />
                  <span>ID: {patient.id.slice(0, 8)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-zinc-100">
          <div className="p-8 space-y-6">
            <h3 className="font-bold text-zinc-900 flex items-center gap-2">
              <Phone size={18} className="text-partners-blue-dark" />
              Contact Information
            </h3>
            <div className="space-y-4">
              <div className="space-y-1">
                <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Phone</p>
                <p className="text-zinc-700">{patient.phone || 'Not provided'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Email</p>
                <p className="text-zinc-700">{patient.email || 'Not provided'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Address</p>
                <div className="text-zinc-700 leading-relaxed">
                  {patient.street ? (
                    <>
                      <p>{patient.street}</p>
                      {patient.apt && <p>{patient.apt}</p>}
                      <p>{patient.city}, {patient.state} {patient.zip}</p>
                    </>
                  ) : (
                    'Not provided'
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="p-8 space-y-6">
            <h3 className="font-bold text-zinc-900 flex items-center gap-2">
              <Activity size={18} className="text-partners-green" />
              Insurance & Billing
            </h3>
            <div className="space-y-4">
              <div className="space-y-1">
                <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Insurance ID</p>
                <p className="text-zinc-700">{patient.insurance_id || 'Not provided'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">SSN (Last 4)</p>
                <p className="text-zinc-700">***-**-{patient.ssn_encrypted || '****'}</p>
              </div>
            </div>
          </div>

          <div className="p-8 space-y-6">
            <h3 className="font-bold text-zinc-900 flex items-center gap-2">
              <Clock size={18} className="text-partners-blue-dark" />
              Recent Activity
            </h3>
            <div className="space-y-4">
              {visits.length > 0 ? (
                <div className="space-y-3">
                  {visits.slice(0, 3).map((visit) => (
                    <div key={visit.id} className="flex items-center justify-between p-3 bg-zinc-50 rounded-xl border border-zinc-100">
                      <div>
                        <p className="text-sm font-bold text-zinc-900">{visit.type}</p>
                        <p className="text-xs text-zinc-500">{visit.scheduled_at ? format(new Date(visit.scheduled_at), 'MMM d, yyyy') : 'N/A'}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        visit.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-zinc-100 text-zinc-600'
                      }`}>
                        {visit.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-zinc-500 italic">No recent visits recorded.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Additional Information Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Demographics & Personal */}
        <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-zinc-100 bg-zinc-50/50">
            <h3 className="font-bold text-zinc-900 flex items-center gap-2">
              <User size={18} className="text-partners-blue-dark" />
              Expanded Demographics
            </h3>
          </div>
          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-1">
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Preferred Name</p>
              <p className="text-zinc-700">{patient.preferred_name || 'N/A'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Race</p>
              <p className="text-zinc-700">{patient.race || 'N/A'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Religion</p>
              <p className="text-zinc-700">{patient.religion || 'N/A'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Marital Status</p>
              <p className="text-zinc-700">{patient.marital_status || 'N/A'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Primary Language</p>
              <p className="text-zinc-700">{patient.primary_language || 'N/A'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Height / Weight</p>
              <p className="text-zinc-700">{patient.height || 'N/A'} / {patient.weight || 'N/A'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Responsible for Self</p>
              <p className="text-zinc-700">{patient.is_responsible_for_self ? 'Yes' : 'No'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Occupation</p>
              <p className="text-zinc-700">{patient.occupation || 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* Census & Service */}
        <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-zinc-100 bg-zinc-50/50">
            <h3 className="font-bold text-zinc-900 flex items-center gap-2">
              <ClipboardList size={18} className="text-partners-green" />
              Census & Service Details
            </h3>
          </div>
          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-1">
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">MDS Date</p>
              <p className="text-zinc-700">{patient.mds_date ? format(new Date(patient.mds_date), 'MMM d, yyyy') : 'N/A'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Hospital of Choice</p>
              <p className="text-zinc-700">{patient.hospital_of_choice || 'N/A'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Start of Service</p>
              <p className="text-zinc-700">{patient.start_of_service ? format(new Date(patient.start_of_service), 'MMM d, yyyy') : 'N/A'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Mother's Maiden Name</p>
              <p className="text-zinc-700">{patient.mothers_maiden_name || 'N/A'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Primary Payer</p>
              <p className="text-zinc-700">{patient.primary_payer || 'N/A'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Medicare ID</p>
              <p className="text-zinc-700">{patient.medicare_id || 'N/A'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Medicaid ID</p>
              <p className="text-zinc-700">{patient.medicaid_id || 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* Advanced Directives */}
        <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-zinc-100 bg-zinc-50/50">
            <h3 className="font-bold text-zinc-900 flex items-center gap-2">
              <Shield size={18} className="text-partners-blue-dark" />
              Advanced Directives
            </h3>
          </div>
          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-1">
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Living Will</p>
              <p className="text-zinc-700">{patient.living_will || 'N/A'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Full Code</p>
              <p className="text-zinc-700">{patient.full_code || 'N/A'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">DNR / DNI / DNH</p>
              <p className="text-zinc-700">{patient.dnr || 'No'} / {patient.dni || 'No'} / {patient.dnh || 'No'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Organ Donation</p>
              <p className="text-zinc-700">{patient.organ_donation || 'N/A'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Hospice</p>
              <p className="text-zinc-700">{patient.hospice || 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* Emergency Contact */}
        <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-zinc-100 bg-zinc-50/50">
            <h3 className="font-bold text-zinc-900 flex items-center gap-2">
              <Phone size={18} className="text-partners-green" />
              Emergency Contact
            </h3>
          </div>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-1">
                <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Name</p>
                <p className="text-zinc-700 font-bold">{patient.emergency_contact_name || 'N/A'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Relationship</p>
                <p className="text-zinc-700">{patient.emergency_contact_relationship || 'N/A'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Phone</p>
                <p className="text-zinc-700">{patient.emergency_contact_phone || 'N/A'}</p>
              </div>
            </div>
            {patient.emergency_contact_address && (
              <div className="space-y-1">
                <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Address</p>
                <p className="text-zinc-700">
                  {patient.emergency_contact_address.street}
                  {patient.emergency_contact_address.apt && `, ${patient.emergency_contact_address.apt}`}
                  <br />
                  {patient.emergency_contact_address.city}, {patient.emergency_contact_address.state} {patient.emergency_contact_address.zip}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Medical Info: Diagnoses & Medications */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-zinc-100 bg-zinc-50/50">
            <h3 className="font-bold text-zinc-900 flex items-center gap-2">
              <Activity size={18} className="text-red-500" />
              Diagnoses
            </h3>
          </div>
          <div className="p-6">
            {patient.diagnoses && patient.diagnoses.length > 0 ? (
              <div className="space-y-3">
                {patient.diagnoses.map((diag, idx) => (
                  <div key={idx} className="flex justify-between items-center p-3 bg-zinc-50 rounded-xl border border-zinc-100">
                    <span className="text-sm font-bold text-zinc-900">{diag.disease}</span>
                    <span className="text-xs font-mono bg-zinc-200 px-2 py-1 rounded text-zinc-600">{diag.icd10}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-zinc-500 italic">No diagnoses recorded.</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-zinc-100 bg-zinc-50/50">
            <h3 className="font-bold text-zinc-900 flex items-center gap-2">
              <ClipboardList size={18} className="text-partners-blue-dark" />
              Medications
            </h3>
          </div>
          <div className="p-6">
            {patient.medications && patient.medications.length > 0 ? (
              <div className="space-y-3">
                {patient.medications.map((med, idx) => (
                  <div key={idx} className="p-3 bg-zinc-50 rounded-xl border border-zinc-100">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-bold text-zinc-900">{med.medicine}</span>
                      <span className="text-xs font-medium text-partners-blue-dark">{med.dosage}</span>
                    </div>
                    <p className="text-xs text-zinc-500">{med.schedule}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-zinc-500 italic">No medications recorded.</p>
            )}
          </div>
        </div>
      </div>

      {/* Providers Section */}
      <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-zinc-100 bg-zinc-50/50">
          <h3 className="font-bold text-zinc-900 flex items-center gap-2">
            <User size={18} className="text-partners-blue-dark" />
            Healthcare Providers
          </h3>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-1">
            <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Primary Care Physician (PCP)</p>
            <p className="text-zinc-700">{patient.pcp_id || 'N/A'}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Other Providers</p>
            <p className="text-zinc-700 whitespace-pre-wrap">{patient.other_provider_ids || 'None listed'}</p>
          </div>
        </div>
      </div>

      {/* Compliance Tracking Section */}
      <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
          <h3 className="font-bold text-zinc-900 flex items-center gap-2">
            <Shield size={18} className="text-partners-blue-dark" />
            Compliance Tracking & Alerts
          </h3>
        </div>
        <div className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <ComplianceItem 
              title="Annual Physical"
              lastDate={patient.last_annual_physical}
              dueDate={patient.last_annual_physical ? addYears(new Date(patient.last_annual_physical), 1) : null}
              type="annual"
            />
            <ComplianceItem 
              title="Health Status Report"
              lastDate={patient.last_semi_annual_report}
              dueDate={patient.last_semi_annual_report ? addMonths(new Date(patient.last_semi_annual_report), 6) : null}
              type="semi-annual"
            />
            <ComplianceItem 
              title="Monthly Visit"
              lastDate={patient.last_monthly_visit}
              dueDate={patient.last_monthly_visit ? addMonths(new Date(patient.last_monthly_visit), 1) : null}
              type="monthly"
            />

            {/* MLOA Tracking */}
            <div className="p-4 rounded-2xl border border-zinc-100 bg-zinc-50/30 space-y-3">
              <div className="flex justify-between items-start">
                <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Medical Leave (MLOA)</p>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${patient.mloa_days > 30 ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                  {patient.mloa_days}/30 Days
                </span>
              </div>
              <div className="w-full bg-zinc-200 h-1.5 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all ${patient.mloa_days > 30 ? 'bg-red-500' : 'bg-partners-green'}`}
                  style={{ width: `${Math.min((patient.mloa_days / 30) * 100, 100)}%` }}
                />
              </div>
              {patient.mloa_days > 30 && (
                <p className="text-[10px] text-red-600 font-medium flex items-center gap-1">
                  <AlertCircle size={12} />
                  Exceeded annual billable limit
                </p>
              )}
            </div>

            {/* NMLOA Tracking */}
            <div className="p-4 rounded-2xl border border-zinc-100 bg-zinc-50/30 space-y-3">
              <div className="flex justify-between items-start">
                <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Non-Medical Leave (NMLOA)</p>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${patient.nmloa_days > 45 ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                  {patient.nmloa_days}/45 Days
                </span>
              </div>
              <div className="w-full bg-zinc-200 h-1.5 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all ${patient.nmloa_days > 45 ? 'bg-red-500' : 'bg-partners-green'}`}
                  style={{ width: `${Math.min((patient.nmloa_days / 45) * 100, 100)}%` }}
                />
              </div>
              {patient.nmloa_days > 45 && (
                <p className="text-[10px] text-red-600 font-medium flex items-center gap-1">
                  <AlertCircle size={12} />
                  Exceeded annual billable limit
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Link to={`/progress-note?patientId=${patient.id}`} className="bg-white p-3 sm:p-6 rounded-3xl border border-zinc-200 shadow-sm hover:shadow-md transition-all group">
          <div className="w-12 h-12 rounded-2xl bg-partners-green/10 text-partners-green flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <FileText size={24} />
          </div>
          <h4 className="font-bold text-zinc-900 mb-1">Progress Note</h4>
          <p className="text-xs text-zinc-500">Complete monthly clinical note</p>
        </Link>
        <Link to={`/care-plan?patientId=${patient.id}`} className="bg-white p-3 sm:p-6 rounded-3xl border border-zinc-200 shadow-sm hover:shadow-md transition-all group">
          <div className="w-12 h-12 rounded-2xl bg-partners-blue-dark/10 text-partners-blue-dark flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <FileText size={24} />
          </div>
          <h4 className="font-bold text-zinc-900 mb-1">Care Plan</h4>
          <p className="text-xs text-zinc-500">Update patient care plan</p>
        </Link>
        <Link to={`/physician-summary?patientId=${patient.id}`} className="bg-white p-3 sm:p-6 rounded-3xl border border-zinc-200 shadow-sm hover:shadow-md transition-all group">
          <div className="w-12 h-12 rounded-2xl bg-partners-green/10 text-partners-green flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <FileText size={24} />
          </div>
          <h4 className="font-bold text-zinc-900 mb-1">Physician Summary</h4>
          <p className="text-xs text-zinc-500">Generate PSF-1 form</p>
        </Link>
        <Link to={`/patient-resource-data?patientId=${patient.id}`} className="bg-white p-3 sm:p-6 rounded-3xl border border-zinc-200 shadow-sm hover:shadow-md transition-all group">
          <div className="w-12 h-12 rounded-2xl bg-partners-blue-dark/10 text-partners-blue-dark flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <FileText size={24} />
          </div>
          <h4 className="font-bold text-zinc-900 mb-1">Resource Data</h4>
          <p className="text-xs text-zinc-500">Patient demographic details</p>
        </Link>
      </div>

      {/* Clinical Forms */}
      <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-zinc-100 flex items-center justify-between">
          <h3 className="font-bold text-zinc-900">Clinical Forms</h3>
          <p className="text-xs text-zinc-500">Quickly create new clinical documentation</p>
        </div>
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <Link to={`/progress-note?patientId=${patient.id}`} className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl hover:shadow-md transition-all group">
            <FileText className="w-8 h-8 text-emerald-600 mb-3 group-hover:scale-110 transition-transform" />
            <p className="text-sm font-bold text-zinc-900">Progress Note</p>
          </Link>
          <Link to={`/care-plan?patientId=${patient.id}`} className="p-4 bg-blue-50 border border-blue-100 rounded-2xl hover:shadow-md transition-all group">
            <FileText className="w-8 h-8 text-blue-600 mb-3 group-hover:scale-110 transition-transform" />
            <p className="text-sm font-bold text-zinc-900">Care Plan</p>
          </Link>
          <Link to={`/mds-assessment?patientId=${patient.id}`} className="p-4 bg-cyan-50 border border-cyan-100 rounded-2xl hover:shadow-md transition-all group">
            <ClipboardCheck className="w-8 h-8 text-cyan-600 mb-3 group-hover:scale-110 transition-transform" />
            <p className="text-sm font-bold text-zinc-900">MDS Assessment</p>
          </Link>
          <Link to={`/nursing-assessment?patientId=${patient.id}`} className="p-4 bg-orange-50 border border-orange-100 rounded-2xl hover:shadow-md transition-all group">
            <Stethoscope className="w-8 h-8 text-orange-600 mb-3 group-hover:scale-110 transition-transform" />
            <p className="text-sm font-bold text-zinc-900">Nursing Assessment</p>
          </Link>
          <Link to={`/mar?patientId=${patient.id}`} className="p-4 bg-pink-50 border border-pink-100 rounded-2xl hover:shadow-md transition-all group">
            <Pill className="w-8 h-8 text-pink-600 mb-3 group-hover:scale-110 transition-transform" />
            <p className="text-sm font-bold text-zinc-900">MAR</p>
          </Link>
          <Link to={`/tar?patientId=${patient.id}`} className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl hover:shadow-md transition-all group">
            <Activity className="w-8 h-8 text-indigo-600 mb-3 group-hover:scale-110 transition-transform" />
            <p className="text-sm font-bold text-zinc-900">TAR</p>
          </Link>
          <Link to={`/physician-summary?patientId=${patient.id}`} className="p-4 bg-amber-50 border border-amber-100 rounded-2xl hover:shadow-md transition-all group">
            <FileText className="w-8 h-8 text-amber-600 mb-3 group-hover:scale-110 transition-transform" />
            <p className="text-sm font-bold text-zinc-900">Physician Summary</p>
          </Link>
          <Link to={`/physician-orders?patientId=${patient.id}`} className="p-4 bg-purple-50 border border-purple-100 rounded-2xl hover:shadow-md transition-all group">
            <FileSignature className="w-8 h-8 text-purple-600 mb-3 group-hover:scale-110 transition-transform" />
            <p className="text-sm font-bold text-zinc-900">Physician Orders</p>
          </Link>
          <Link to={`/admission-assessment?patientId=${patient.id}`} className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl hover:shadow-md transition-all group">
            <UserPlus className="w-8 h-8 text-emerald-600 mb-3 group-hover:scale-110 transition-transform" />
            <p className="text-sm font-bold text-zinc-900">Admission</p>
          </Link>
          <Link to={`/discharge-summary?patientId=${patient.id}`} className="p-4 bg-rose-50 border border-rose-100 rounded-2xl hover:shadow-md transition-all group">
            <UserMinus className="w-8 h-8 text-rose-600 mb-3 group-hover:scale-110 transition-transform" />
            <p className="text-sm font-bold text-zinc-900">Discharge</p>
          </Link>
        </div>
      </div>

      {/* Visit History */}
      <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-zinc-100 flex items-center justify-between">
          <h3 className="font-bold text-zinc-900">Visit History</h3>
          <Button variant="secondary" size="sm">View All</Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50">
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {visits.length > 0 ? (
                visits.map((visit) => (
                  <tr key={visit.id} className="hover:bg-zinc-50 transition-colors">
                    <td className="px-6 py-4 text-sm text-zinc-700">
                      {visit.scheduled_at ? format(new Date(visit.scheduled_at), 'MMM d, yyyy h:mm a') : 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-zinc-900">{visit.type || 'N/A'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        visit.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-zinc-100 text-zinc-600'
                      }`}>
                        {visit.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <Button variant="ghost" size="sm" className="text-partners-blue-dark">
                        View Details
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-zinc-500 italic">
                    No visits recorded for this patient.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Documents & Files */}
      <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
          <h3 className="font-bold text-zinc-900 flex items-center gap-2">
            <Paperclip size={18} className="text-partners-blue-dark" />
            Documents &amp; Files
            <span className="ml-2 text-xs font-normal text-zinc-400">
              {patientFiles.length} file{patientFiles.length !== 1 ? 's' : ''}
            </span>
          </h3>
          <div>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              onChange={e => {
                if (e.target.files?.[0]) {
                  handleFileUpload(e.target.files[0]);
                  e.target.value = '';
                }
              }}
            />
            <Button variant="secondary" onClick={() => fileInputRef.current?.click()} disabled={uploadingFile}>
              {uploadingFile
                ? <><Loader2 size={15} className="mr-2 animate-spin" /> Uploading...</>
                : <><Upload size={15} className="mr-2" /> Upload File</>
              }
            </Button>
          </div>
        </div>
        <div className="p-6">
          {patientFiles.length === 0 ? (
            <div className="text-center py-12 text-zinc-400">
              <Paperclip size={32} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm italic">No files uploaded yet.</p>
              <p className="text-xs mt-1">Upload documents, lab results, or any relevant files for this patient.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {patientFiles.map(file => (
                <div key={file.id} className="flex items-center gap-3 bg-zinc-50 border border-zinc-200 rounded-2xl p-3 group">
                  <div className="w-9 h-9 rounded-xl bg-partners-blue-dark/10 flex items-center justify-center shrink-0">
                    <FileText size={16} className="text-partners-blue-dark" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-zinc-800 truncate">{file.name}</p>
                    <p className="text-[10px] text-zinc-400">{file.size} · {new Date(file.uploaded_at).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <a
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-partners-blue-dark hover:bg-white transition-colors"
                    >
                      <Eye size={14} />
                    </a>
                    <button
                      onClick={() => handleDeleteFile(file.id, file.url)}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-white transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};