import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSearchParams, Link } from 'react-router-dom';
import * as z from 'zod';
import { Button } from '../components/Button';
import { FilePlus, Send, User, Activity, ClipboardCheck, ArrowLeft, Loader2, FileText } from 'lucide-react';
import { SignaturePad } from '../components/SignaturePad';
import { Notification, NotificationType } from '../components/Notification';
import { Logo } from '../components/Logo';
import { supabase, getFormIdByName, withTimeout } from '../services/supabase';
import { generateFormPDF } from '../services/pdfService';
import { PrintPreviewModal } from '../components/PrintPreviewModal';
import { PhysicianSummaryTemplate } from '../components/PDFTemplates/PhysicianSummaryTemplate';
import { useAuth } from '../context/AuthContext';

const DUMMY_PATIENT_ID = '00000000-0000-0000-0000-000000000000';
const FORM_NAME = 'Physician Summary (PSF-1)';

const psfSchema = z.object({
  patient: z.object({
    lastName: z.string().min(1, 'Required'),
    firstName: z.string().min(1, 'Required'),
    dob: z.string().min(1, 'Required'),
    gender: z.enum(['M', 'F']),
  }),
  diagnosis: z.object({
    diagnoses: z.string().min(1, 'Required'),
    mentalIllness: z.string().optional(),
    intellectualDisability: z.boolean(),
    developmentalDisability: z.boolean(),
  }),
  treatments: z.string().optional(),
  medications: z.string().optional(),
  skilledTherapy: z.string().optional(),
  vitals: z.object({
    date: z.string().optional(),
    t: z.string().optional(),
    p: z.string().optional(),
    r: z.string().optional(),
    bp: z.string().optional(),
  }),
  allergies: z.object({
    noKnownAllergies: z.boolean(),
    noKnownDrugAllergies: z.boolean(),
    list: z.string().optional(),
  }),
  physical: z.object({
    height: z.string().optional(),
    weight: z.string().optional(),
  }),
  continence: z.object({
    bowel: z.enum(['Continent', 'Incontinent', 'Colostomy']).optional(),
    bladder: z.enum(['Continent', 'Incontinent', 'Catheter']).optional(),
  }),
  mentalStatus: z.enum(['Alert & oriented', 'Alert & disoriented', 'Other']).optional(),
  mentalStatusOther: z.string().optional(),
  recentLabWork: z.string().optional(),
  diet: z.string().optional(),
  lastPhysicalExam: z.string().optional(),
  lastOfficeVisit: z.string().optional(),
  additionalComments: z.string().optional(),
  recommendedServices: z.array(z.string()),
  providerSignature: z.string().min(1, 'Signature required'),
  providerName: z.string().min(1, 'Required'),
  providerTitle: z.enum(['MD', 'NP', 'PA']),
  dateCompleted: z.string().min(1, 'Required'),
  providerAddress: z.string().optional(),
});

type PSFFormValues = z.infer<typeof psfSchema>;

export const PhysicianSummary: React.FC = () => {
  const { profile } = useAuth();
  const [searchParams] = useSearchParams();
  const patientId = searchParams.get('patientId') || DUMMY_PATIENT_ID;
  const [notification, setNotification] = useState<{ type: NotificationType, message: string } | null>(null);

  const { register, handleSubmit, setValue, watch, reset, getValues, formState: { errors, isSubmitting } } = useForm<PSFFormValues>({
    resolver: zodResolver(psfSchema),
    defaultValues: {
      patient: { gender: 'M' },
      diagnosis: { intellectualDisability: false, developmentalDisability: false },
      allergies: { noKnownAllergies: false, noKnownDrugAllergies: false },
      recommendedServices: [],
      dateCompleted: new Date().toISOString().split('T')[0],
      providerTitle: 'MD',
    }
  });

  const [formId, setFormId] = useState<string | null>(null);
  const [isFetchingForm, setIsFetchingForm] = useState(true);

  useEffect(() => {
    const fetchFormId = async () => {
      try {
        const id = await getFormIdByName(FORM_NAME);
        setFormId(id);
      } finally {
        setIsFetchingForm(false);
      }
    };
    fetchFormId();
  }, []);

  useEffect(() => {
    if (patientId && patientId !== DUMMY_PATIENT_ID) {
      const fetchPatient = async () => {
        const { data, error } = await supabase
          .from('patients')
          .select('first_name, last_name, dob, gender')
          .eq('id', patientId)
          .single();
        
        if (data && !error) {
          setValue('patient.firstName', data.first_name);
          setValue('patient.lastName', data.last_name);
          setValue('patient.dob', data.dob);
          setValue('patient.gender', data.gender === 'female' ? 'F' : 'M');
        }
      };
      fetchPatient();
    }
  }, [patientId, setValue]);

  const [isSavingDraft, setIsSavingDraft] = useState(false);

  const submitForm = async (data: PSFFormValues, status: 'draft' | 'submitted') => {
    if (!profile) {
      setNotification({ type: 'error', message: 'You must be logged in to submit forms.' });
      return;
    }

    console.log(`PSF Form: Starting submission (status: ${status})...`);
    try {
      if (status === 'draft') setIsSavingDraft(true);
      
      // 1. Get Form ID if not already fetched
      let currentFormId = formId;
      if (!currentFormId) {
        console.log(`PSF Form: Form ID missing, fetching for "${FORM_NAME}"...`);
        currentFormId = (await withTimeout(getFormIdByName(FORM_NAME))) as any;
        if (!currentFormId) {
          throw new Error(`The "${FORM_NAME}" form is missing from the database. Please go to the Dashboard to run the Database Setup.`);
        }
        setFormId(currentFormId);
      }
      
      console.log(`PSF Form: Using Form ID: ${currentFormId}, Patient ID: ${patientId}`);

      // 1.5 Verify patient exists
      const { data: patientExists, error: patientCheckError } = (await withTimeout(supabase
        .from('patients')
        .select('id')
        .eq('id', patientId)
        .maybeSingle(), 60000)) as any;
      
      if (patientCheckError) {
        console.error('PSF Form: Patient check error:', patientCheckError);
      }
      
      if (!patientExists) {
        throw new Error(`The patient (ID: ${patientId}) does not exist in the database. Please go to the Dashboard and click "Setup Now" to create the test patient.`);
      }

      // 2. Insert into form_responses
      console.log('PSF Form: Inserting form response...');
      const { data: responseData, error: responseError } = (await withTimeout(supabase
        .from('form_responses')
        .insert([{
          form_id: currentFormId,
          patient_id: patientId,
          staff_id: profile.id,
          data: data,
          status: status
        }])
        .select()
        .single(), 60000)) as any;
      
      if (responseError) {
        console.error('PSF Form: Response insertion error:', responseError);
        throw responseError;
      }

      if (!responseData) {
        throw new Error('No data returned from form submission. This might be due to database permissions (RLS).');
      }

      console.log('PSF Form: Response inserted successfully, ID:', responseData.id);

      // 3. Insert signature if present
      if (data.providerSignature) {
        console.log('PSF Form: Inserting signature...');
        const { error: sigError } = (await withTimeout(supabase
          .from('signatures')
          .insert([{
            parent_id: responseData.id,
            parent_type: 'form_response',
            signer_id: profile.id,
            signature_data: data.providerSignature
          }]), 30000)) as any;
        
        if (sigError) {
          console.error('PSF Form: Signature insertion error:', sigError);
          throw sigError;
        }
        console.log('PSF Form: Signature inserted successfully');
      }
      
      setNotification({ 
        type: 'success', 
        message: status === 'draft' ? 'Draft saved successfully!' : 'Physician Summary submitted successfully!' 
      });
      if (status === 'submitted') reset();
    } catch (error: any) {
      console.error('PSF Form: Caught error during submission:', error);
      setNotification({ type: 'error', message: `Error: ${error.message}` });
    } finally {
      setIsSavingDraft(false);
      console.log('PSF Form: Submission process finished.');
    }
  };

  const onSubmit = async (data: PSFFormValues) => await submitForm(data, 'submitted');
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const handlePrint = async () => {
    try {
      setIsGeneratingPDF(true);
      const formData = getValues();
      await generateFormPDF(FORM_NAME, formData);
    } catch (error) {
      console.error('PDF error:', error);
      setNotification({ type: 'error', message: 'Failed to generate PDF. Please try again.' });
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-8 space-y-8">
      <Link to="/clinical-forms" className="flex items-center gap-2 text-zinc-500 hover:text-partners-blue-dark transition-colors mb-6 group no-print">
        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
        <span className="text-sm font-medium">Back to Forms</span>
      </Link>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <Logo showText size={48} />
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-partners-blue-dark flex items-center gap-2 whitespace-nowrap">
              <FilePlus className="text-partners-green shrink-0" />
              Physician Summary Form (PSF-1)
            </h2>
            <p className="text-sm md:text-base text-partners-gray">Verification and validation of medical information.</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3 no-print w-full md:w-auto md:ml-auto justify-end">
          <Button 
            variant="secondary" 
            type="button" 
            onClick={() => setIsPreviewOpen(true)}
            className="h-11 px-4 md:px-6 rounded-xl shadow-sm flex-1 md:flex-none"
          >
            <FileText className="w-4 h-4 mr-2" />
            Preview & Print
          </Button>
          <Button 
            type="button"
            onClick={handleSubmit(onSubmit)}
            disabled={isSubmitting}
            className="h-11 px-6 md:px-8 rounded-xl shadow-md flex-1 md:flex-none"
          >
            <Send className="w-4 h-4 mr-2" />
            {isSubmitting ? 'Submitting...' : 'Submit Form'}
          </Button>
        </div>
      </div>

      <PrintPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        template={PhysicianSummaryTemplate}
        data={getValues()}
        title="Physician Summary"
        filename={`Physician_Summary_${getValues().patient?.lastName}_${getValues().patient?.firstName}.pdf`}
      />

      <form
        className="space-y-8 bg-white p-4 sm:p-8 rounded-2xl border border-zinc-200 shadow-sm overflow-hidden"
      >
        {/* Patient Section */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-partners-blue-dark font-bold border-b pb-2">
            <User size={20} />
            <h3>Patient Information</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-zinc-700">Last Name</label>
              <input {...register('patient.lastName')} className="w-full px-4 py-2 rounded-xl border border-zinc-200" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-zinc-700">First Name</label>
              <input {...register('patient.firstName')} className="w-full px-4 py-2 rounded-xl border border-zinc-200" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-zinc-700">Date of Birth</label>
              <input type="date" {...register('patient.dob')} className="w-full px-4 py-2 rounded-xl border border-zinc-200" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-zinc-700">Gender</label>
              <select {...register('patient.gender')} className="w-full px-4 py-2 rounded-xl border border-zinc-200">
                <option value="M">Male</option>
                <option value="F">Female</option>
              </select>
            </div>
          </div>
        </section>

        {/* Diagnosis Section */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-partners-blue-dark font-bold border-b pb-2">
            <Activity size={20} />
            <h3>Diagnosis</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="text-sm font-medium text-zinc-700">Diagnosis(es)</label>
              <textarea {...register('diagnosis.diagnoses')} rows={3} className="w-full px-4 py-2 rounded-xl border border-zinc-200" />
            </div>
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-zinc-700">Mental illness (indicate diagnosis):</label>
                <input {...register('diagnosis.mentalIllness')} className="w-full px-4 py-2 rounded-xl border border-zinc-200" />
              </div>
              <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" {...register('diagnosis.intellectualDisability')} className="w-4 h-4 rounded border-zinc-300" />
                  <span className="text-sm">Intellectual disability</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" {...register('diagnosis.developmentalDisability')} className="w-4 h-4 rounded border-zinc-300" />
                  <span className="text-sm">Developmental disability</span>
                </label>
              </div>
            </div>
          </div>
        </section>

        {/* Treatments & Medications */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-700">Treatments (List type and frequency)</label>
            <textarea {...register('treatments')} rows={4} className="w-full px-4 py-2 rounded-xl border border-zinc-200" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-700">Medications (List drug, dose, route, and frequency)</label>
            <textarea {...register('medications')} rows={4} className="w-full px-4 py-2 rounded-xl border border-zinc-200" />
          </div>
        </section>

        {/* Skilled Therapy */}
        <section className="space-y-2">
          <label className="text-sm font-medium text-zinc-700">Skilled Therapy (Direct therapy by OT, PT, ST)</label>
          <textarea {...register('skilledTherapy')} rows={2} className="w-full px-4 py-2 rounded-xl border border-zinc-200" />
        </section>

        {/* Vital Signs & Allergies */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4 bg-zinc-50 p-4 rounded-2xl border border-zinc-100">
            <h4 className="font-bold text-sm text-zinc-900 uppercase tracking-wider">Recent Vital Signs</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-500">Date</label>
                <input type="date" {...register('vitals.date')} className="w-full px-3 py-1.5 rounded-lg border border-zinc-200" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-500">T</label>
                <input {...register('vitals.t')} className="w-full px-3 py-1.5 rounded-lg border border-zinc-200" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-500">P</label>
                <input {...register('vitals.p')} className="w-full px-3 py-1.5 rounded-lg border border-zinc-200" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-500">R</label>
                <input {...register('vitals.r')} className="w-full px-3 py-1.5 rounded-lg border border-zinc-200" />
              </div>
              <div className="space-y-1 col-span-2">
                <label className="text-xs font-medium text-zinc-500">BP</label>
                <input {...register('vitals.bp')} className="w-full px-3 py-1.5 rounded-lg border border-zinc-200" />
              </div>
            </div>
          </div>

          <div className="space-y-4 bg-zinc-50 p-4 rounded-2xl border border-zinc-100">
            <h4 className="font-bold text-sm text-zinc-900 uppercase tracking-wider">Allergies</h4>
            <div className="space-y-3">
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" {...register('allergies.noKnownAllergies')} className="w-4 h-4 rounded border-zinc-300" />
                  <span className="text-sm">No known allergies</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" {...register('allergies.noKnownDrugAllergies')} className="w-4 h-4 rounded border-zinc-300" />
                  <span className="text-sm">No known drug allergies</span>
                </label>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-500">Allergies, list:</label>
                <textarea {...register('allergies.list')} rows={3} className="w-full px-3 py-1.5 rounded-lg border border-zinc-200" />
              </div>
            </div>
          </div>
        </section>

        {/* Physical & Continence */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-zinc-700">Height</label>
              <input {...register('physical.height')} className="w-full px-4 py-2 rounded-xl border border-zinc-200" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-zinc-700">Weight</label>
              <input {...register('physical.weight')} className="w-full px-4 py-2 rounded-xl border border-zinc-200" />
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-zinc-700">Bowel Continence</label>
              <select {...register('continence.bowel')} className="w-full px-4 py-2 rounded-xl border border-zinc-200">
                <option value="">Select...</option>
                <option value="Continent">Continent</option>
                <option value="Incontinent">Incontinent</option>
                <option value="Colostomy">Colostomy</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-zinc-700">Bladder Continence</label>
              <select {...register('continence.bladder')} className="w-full px-4 py-2 rounded-xl border border-zinc-200">
                <option value="">Select...</option>
                <option value="Continent">Continent</option>
                <option value="Incontinent">Incontinent</option>
                <option value="Catheter">Catheter</option>
              </select>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-zinc-700">Mental Status</label>
              <select {...register('mentalStatus')} className="w-full px-4 py-2 rounded-xl border border-zinc-200">
                <option value="">Select...</option>
                <option value="Alert & oriented">Alert & oriented</option>
                <option value="Alert & disoriented">Alert & disoriented</option>
                <option value="Other">Other</option>
              </select>
            </div>
            {watch('mentalStatus') === 'Other' && (
              <div className="space-y-1">
                <label className="text-sm font-medium text-zinc-700">Specify Other:</label>
                <input {...register('mentalStatusOther')} className="w-full px-4 py-2 rounded-xl border border-zinc-200" />
              </div>
            )}
          </div>
        </section>

        {/* Labs, Diet, Exams */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-700">Recent Lab work</label>
            <textarea {...register('recentLabWork')} rows={2} className="w-full px-4 py-2 rounded-xl border border-zinc-200" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-700">Diet</label>
            <textarea {...register('diet')} rows={2} className="w-full px-4 py-2 rounded-xl border border-zinc-200" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-700">Date of last physical exam</label>
            <input type="date" {...register('lastPhysicalExam')} className="w-full px-4 py-2 rounded-xl border border-zinc-200" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-700">Date of last office visit</label>
            <input type="date" {...register('lastOfficeVisit')} className="w-full px-4 py-2 rounded-xl border border-zinc-200" />
          </div>
        </section>

        {/* Recommended Services */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-partners-blue-dark font-bold border-b pb-2">
            <ClipboardCheck size={20} />
            <h3>Recommended Services</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              'Adult day health (ADH)',
              'Group adult foster care (GAFC)',
              'Adult foster care (AFC)',
              'Program for All-inclusive Care for the Elderly (PACE)',
              'Nursing facility (NF)'
            ].map(service => (
              <label key={service} className="flex items-center gap-2 p-3 rounded-xl border border-zinc-100 hover:bg-zinc-50 cursor-pointer transition-colors">
                <input 
                  type="checkbox" 
                  value={service} 
                  {...register('recommendedServices')} 
                  className="w-4 h-4 rounded border-zinc-300" 
                />
                <span className="text-sm text-zinc-700">{service}</span>
              </label>
            ))}
          </div>
        </section>

        {/* Signature Section */}
        <section className="space-y-6 pt-8 border-t border-zinc-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <SignaturePad 
                label="Provider's Signature" 
                onSave={(sig) => setValue('providerSignature', sig, { shouldValidate: true })} 
              />
              {errors.providerSignature && <p className="text-xs text-red-500">{errors.providerSignature.message}</p>}
            </div>
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-zinc-700">Print Name</label>
                <input {...register('providerName')} className="w-full px-4 py-2 rounded-xl border border-zinc-200" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-zinc-700">Title</label>
                  <select {...register('providerTitle')} className="w-full px-4 py-2 rounded-xl border border-zinc-200">
                    <option value="MD">MD</option>
                    <option value="NP">NP</option>
                    <option value="PA">PA</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-zinc-700">Date Completed</label>
                  <input type="date" {...register('dateCompleted')} className="w-full px-4 py-2 rounded-xl border border-zinc-200" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-zinc-700">Print Address</label>
                <textarea {...register('providerAddress')} rows={2} className="w-full px-4 py-2 rounded-xl border border-zinc-200" />
              </div>
            </div>
          </div>
        </section>
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
