import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useSearchParams } from 'react-router-dom';
import * as z from 'zod';
import { Button } from '../components/Button';
import { FilePlus, Send, ArrowLeft, Loader2, FileText, User } from 'lucide-react';
import { SignaturePad } from '../components/SignaturePad';
import { Logo } from '../components/Logo';
import { Notification, NotificationType } from '../components/Notification';
import { supabase, getFormIdByName } from '../services/supabase';
import { generateFormPDF } from '../services/pdfService';
import { PrintPreviewModal } from '../components/PrintPreviewModal';
import { AdmissionAssessmentTemplate } from '../components/PDFTemplates/AdmissionAssessmentTemplate';
import { useAuth } from '../context/AuthContext';

const admissionSchema = z.object({
  date: z.string().min(1, 'Required'),
  patientName: z.string().min(1, 'Required'),
  dob: z.string().optional(),
  assessment: z.string().min(1, 'Required'),
  signature: z.string().optional()
});

type AdmissionValues = z.infer<typeof admissionSchema>;

export const AdmissionAssessment: React.FC = () => {
  const { profile } = useAuth();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('id');
  const patientIdFromUrl = searchParams.get('patientId');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [notification, setNotification] = useState<{ type: NotificationType, message: string } | null>(null);
  const [patients, setPatients] = useState<Array<{id: string, first_name: string, last_name: string}>>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(patientIdFromUrl || null);
  const [isFetchingPatients, setIsFetchingPatients] = useState(true);

  const { register, handleSubmit, formState: { errors }, setValue, watch, reset, getValues } = useForm<AdmissionValues>({
    resolver: zodResolver(admissionSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0]
    }
  });

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const { data, error } = await supabase
          .from('patients')
          .select('id, first_name, last_name')
          .eq('is_active', true)
          .order('last_name', { ascending: true });
        if (data && !error) setPatients(data);
      } finally {
        setIsFetchingPatients(false);
      }
    };
    fetchPatients();
  }, []);

  useEffect(() => {
    if (selectedPatientId) {
      const fetchPatient = async () => {
        const { data, error } = await supabase
          .from('patients')
          .select('first_name, last_name, dob')
          .eq('id', selectedPatientId)
          .single();
        if (data && !error) {
          setValue('patientName', `${data.first_name} ${data.last_name}`);
          setValue('dob', data.dob || '');
        }
      };
      fetchPatient();
    } else {
      setValue('patientName', '');
    }
  }, [selectedPatientId, setValue]);

  useEffect(() => {
    if (editId) {
      fetchSubmission();
    }
  }, [editId]);

  const fetchSubmission = async () => {
    try {
      const { data, error } = await supabase
        .from('form_responses')
        .select('*')
        .eq('id', editId)
        .single();
      
      if (data && !error) {
        reset(data.data);
      }
    } catch (error) {
      console.error('Error fetching submission:', error);
    }
  };

  const onSubmit = async (data: AdmissionValues) => {
    if (!profile) return;
    if (!selectedPatientId) {
      setNotification({ type: 'error', message: 'Please select a patient before submitting.' });
      return;
    }
    setIsSubmitting(true);
    try {
      const formId = await getFormIdByName('Admission Assessment');

      if (editId) {
        const { error } = await supabase
          .from('form_responses')
          .update({
            data: data,
            updated_at: new Date().toISOString()
          })
          .eq('id', editId);
        if (error) throw error;
        setNotification({ type: 'success', message: 'Admission Assessment updated successfully!' });
      } else {
        const { error } = await supabase.from('form_responses').insert([{
          form_id: formId,
          patient_id: selectedPatientId,
          staff_id: profile.id,
          data: data,
          status: 'submitted'
        }]);
        if (error) throw error;
        setNotification({ type: 'success', message: 'Admission Assessment submitted successfully!' });
        reset();
      }
    } catch (error: any) {
      setNotification({ type: 'error', message: `Error: ${error.message}` });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrint = async () => {
    console.log('Admission Assessment: Starting PDF generation...');
    try {
      setIsGeneratingPDF(true);
      const formData = getValues();
      console.log('Admission Assessment: Form data for PDF:', formData);
      await generateFormPDF('Admission Assessment', formData);
      console.log('Admission Assessment: PDF generation successful.');
    } catch (error) {
      console.error('Admission Assessment: PDF error:', error);
      setNotification({ type: 'error', message: 'Failed to generate PDF. Please try again.' });
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
      <Link to="/clinical-forms" className="flex items-center gap-2 text-zinc-500 hover:text-partners-blue-dark transition-colors mb-6 group no-print">
        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
        <span className="text-sm font-medium">Back to Forms</span>
      </Link>
      <div className="flex flex-col gap-4 mb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <Logo showText size={48} />
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-partners-blue-dark flex items-center gap-2">
              <FilePlus className="text-partners-green shrink-0" />
              Admission Assessment
            </h2>
            <p className="text-sm md:text-base text-partners-gray">Initial patient admission evaluation.</p>
          </div>
        </div>
        <div className="flex flex-row items-center justify-end gap-3 no-print">
          <Button 
            variant="secondary" 
            type="button" 
            onClick={() => setIsPreviewOpen(true)} 
            className="h-10 px-4 rounded-xl shadow-sm"
          >
            <FileText className="w-4 h-4 mr-2" />
            Preview & Print
          </Button>
          <Button 
            type="button" 
            onClick={handleSubmit(onSubmit)} 
            disabled={isSubmitting}
            className="h-10 px-4 rounded-xl shadow-md bg-partners-blue-dark hover:bg-partners-blue transition-all active:scale-95"
          >
            <Send className="w-4 h-4 mr-2" />
            {isSubmitting ? 'Submitting...' : 'Submit Form'}
          </Button>
        </div>
      </div>

      <PrintPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        template={AdmissionAssessmentTemplate}
        data={getValues()}
        title="Admission Assessment"
        filename={`Admission_Assessment_${getValues().patientName?.replace(/\s+/g, '_')}.pdf`}
      />

      <form 
        className="space-y-8 bg-white p-4 sm:p-8 rounded-2xl border border-zinc-200 shadow-sm overflow-hidden"
      >
        {Object.keys(errors).length > 0 && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm animate-in fade-in slide-in-from-top-4 duration-300">
            <p className="font-bold mb-1">Please correct the following errors before submitting:</p>
            <ul className="list-disc list-inside">
              {Object.entries(errors).map(([key, error]: [string, any]) => (
                <li key={key}>{error.message || `Error in ${key}`}</li>
              ))}
            </ul>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-zinc-700">Date <span className="text-red-500">*</span></label>
            <input type="date" {...register('date')} className="w-full px-4 py-2 rounded-xl border border-zinc-200 outline-none focus:ring-2 focus:ring-partners-blue-dark" />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-zinc-700 flex items-center gap-2">
              <User size={16} className="text-zinc-400" />
              Select Patient <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedPatientId || ''}
              onChange={(e) => setSelectedPatientId(e.target.value || null)}
              className="w-full px-4 py-2 rounded-xl border border-zinc-200 bg-white outline-none focus:ring-2 focus:ring-partners-blue-dark/20 transition-all"
            >
              <option value="">-- Select a Patient --</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.last_name}, {p.first_name}
                </option>
              ))}
            </select>
            {patients.length === 0 && !isFetchingPatients && (
              <p className="text-[10px] text-red-500 mt-1 italic">No patients found. Please add patients first.</p>
            )}
            <label className="text-sm font-medium text-zinc-700 mt-2 block">Patient Name</label>
            <input {...register('patientName')} readOnly className="w-full px-4 py-2 rounded-xl border border-zinc-200 bg-zinc-50 outline-none" />
          </div>
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium text-zinc-700">Assessment Details <span className="text-red-500">*</span></label>
          <textarea {...register('assessment')} rows={10} placeholder="Provide detailed admission assessment..." className="w-full px-4 py-2 rounded-xl border border-zinc-200 outline-none focus:ring-2 focus:ring-partners-blue-dark" />
        </div>
        <div className="space-y-4">
          <label className="text-sm font-medium text-zinc-700">Signature</label>
          <SignaturePad onSave={(sig) => setValue('signature', sig)} initialValue={watch('signature')} />
        </div>
        <div className="flex flex-row items-center justify-end gap-3 no-print pt-4 border-t border-zinc-100">
          <Button
            type="button"
            onClick={handleSubmit(onSubmit)}
            disabled={isSubmitting}
            className="h-10 px-4 rounded-xl shadow-md bg-partners-blue-dark hover:bg-partners-blue transition-all active:scale-95"
          >
            <Send className="w-4 h-4 mr-2" />
            {isSubmitting ? 'Submitting...' : 'Submit Form'}
          </Button>
        </div>
      </form>
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