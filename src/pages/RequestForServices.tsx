import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSearchParams, Link } from 'react-router-dom';
import * as z from 'zod';
import { Button } from '../components/Button';
import { ClipboardList, Save, Send, User, MapPin, Phone, Stethoscope, AlertCircle, ArrowLeft, Loader2, FileText } from 'lucide-react';
import { SignaturePad } from '../components/SignaturePad';
import { Notification, NotificationType } from '../components/Notification';
import { Logo } from '../components/Logo';
import { supabase, getFormIdByName, withTimeout } from '../services/supabase';
import { generateFormPDF } from '../services/pdfService';
import { useAuth } from '../context/AuthContext';

const DUMMY_PATIENT_ID = '00000000-0000-0000-0000-000000000000';
const FORM_NAME = 'Request for Services (RFS-1)';

const rfsSchema = z.object({
  date: z.string().min(1, 'Required'),
  servicesRequested: z.array(z.string()),
  otherService: z.string().optional(),
  nursingFacilityUseOnly: z.array(z.string()),
  memberInfo: z.object({
    lastName: z.string().min(1, 'Required'),
    firstName: z.string().min(1, 'Required'),
    telephone: z.string().optional(),
    street: z.string().optional(),
    apt: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zip: z.string().optional(),
    status: z.enum(['MassHealth member', 'MassHealth application pending', 'GAFC/Assisted living residence']).optional(),
    masshealthId: z.string().optional(),
    dateApplicationFiled: z.string().optional(),
    dateSsigApplicationFiled: z.string().optional(),
  }),
  nextOfKin: z.object({
    lastName: z.string().optional(),
    firstName: z.string().optional(),
    telephone: z.string().optional(),
    street: z.string().optional(),
    apt: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zip: z.string().optional(),
  }),
  physician: z.object({
    lastName: z.string().optional(),
    firstName: z.string().optional(),
    telephone: z.string().optional(),
    street: z.string().optional(),
    apt: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zip: z.string().optional(),
  }),
  screening: z.object({
    mentalIllness: z.boolean(),
    mentalIllnessSpecify: z.string().optional(),
    mentalRetardation: z.boolean(),
    developmentalDisability: z.boolean(),
    conditions: z.array(z.string()),
  }),
  communityServices: z.array(z.string()),
  communityServicesOther: z.string().optional(),
  additionalInfo: z.object({
    homeAvailable: z.enum(['yes', 'no']).optional(),
    caregiverAvailable: z.enum(['yes', 'no']).optional(),
    weightGain: z.enum(['yes', 'no']).optional(),
    personalCareServices: z.enum(['yes', 'no']).optional(),
    daysPerWeek: z.string().optional(),
    hoursPerWeek: z.string().optional(),
    changeInCondition: z.enum(['yes', 'no']).optional(),
    changeType: z.enum(['improvement', 'deterioration']).optional(),
    changeDetails: z.string().optional(),
  }),
  nursingFacilityRequests: z.object({
    interestToRemain: z.enum(['yes', 'no']).optional(),
    shortTermStay: z.enum(['yes', 'no']).optional(),
    longTermStay: z.enum(['yes', 'no']).optional(),
  }),
  referralSource: z.object({
    signature: z.string().min(1, 'Signature required'),
    printName: z.string().min(1, 'Required'),
    title: z.string().min(1, 'Required'),
    organization: z.string().optional(),
    telephone: z.string().optional(),
    street: z.string().optional(),
    apt: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zip: z.string().optional(),
  }),
});

type RFSFormValues = z.infer<typeof rfsSchema>;

export const RequestForServices: React.FC = () => {
  const { profile } = useAuth();
  const [searchParams] = useSearchParams();
  const patientId = searchParams.get('patientId') || DUMMY_PATIENT_ID;

  const { register, handleSubmit, setValue, watch, reset, getValues, formState: { errors, isSubmitting } } = useForm<RFSFormValues>({
    resolver: zodResolver(rfsSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      servicesRequested: [],
      nursingFacilityUseOnly: [],
      screening: { 
        mentalIllness: false,
        mentalRetardation: false,
        developmentalDisability: false,
        conditions: [] 
      },
      communityServices: [],
      additionalInfo: {},
      nursingFacilityRequests: {},
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
          .select('first_name, last_name, phone, street, apt, city, state, zip')
          .eq('id', patientId)
          .single();
        
        if (data && !error) {
          setValue('memberInfo.firstName', data.first_name);
          setValue('memberInfo.lastName', data.last_name);
          setValue('memberInfo.telephone', data.phone || '');
          setValue('memberInfo.street', data.street || '');
          setValue('memberInfo.apt', data.apt || '');
          setValue('memberInfo.city', data.city || '');
          setValue('memberInfo.state', data.state || '');
          setValue('memberInfo.zip', data.zip || '');
        }
      };
      fetchPatient();
    }
  }, [patientId, setValue]);

  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [notification, setNotification] = useState<{ type: NotificationType, message: string } | null>(null);

  const handlePrint = async () => {
    console.log('Request for Services: Starting PDF generation...');
    try {
      setIsGeneratingPDF(true);
      const formData = getValues();
      console.log('Request for Services: Form data for PDF:', formData);
      await generateFormPDF(FORM_NAME, formData);
      console.log('Request for Services: PDF generation successful.');
    } catch (error) {
      console.error('Request for Services: PDF error:', error);
      setNotification({ type: 'error', message: 'Failed to generate PDF. Please try again.' });
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const submitForm = async (data: RFSFormValues, status: 'draft' | 'submitted') => {
    if (!profile) {
      setNotification({ type: 'error', message: 'You must be logged in to submit forms.' });
      return;
    }

    console.log(`Request for Services: Starting submission (status: ${status})...`);
    try {
      if (status === 'draft') setIsSavingDraft(true);
      
      // 1. Get Form ID if not already fetched
      let currentFormId = formId;
      if (!currentFormId) {
        console.log(`Request for Services: Form ID missing, fetching for "${FORM_NAME}"...`);
        currentFormId = (await withTimeout(getFormIdByName(FORM_NAME))) as any;
        if (!currentFormId) {
          throw new Error(`The "${FORM_NAME}" form is missing from the database. Please go to the Dashboard to run the Database Setup.`);
        }
        setFormId(currentFormId);
      }
      
      console.log(`Request for Services: Using Form ID: ${currentFormId}, Patient ID: ${patientId}`);

      const { data: responseData, error: responseError } = await supabase
        .from('form_responses')
        .insert([{
          form_id: currentFormId,
          patient_id: patientId,
          staff_id: profile.id,
          data: data,
          status: status
        }])
        .select()
        .single();
      
      if (responseError) {
        console.error('Request for Services: Response insertion error:', responseError);
        throw responseError;
      }

      if (data.referralSource.signature) {
        const { error: sigError } = await supabase
          .from('signatures')
          .insert([{
            parent_id: responseData.id,
            parent_type: 'form_response',
            signer_id: profile.id,
            signature_data: data.referralSource.signature
          }]);
        
        if (sigError) {
          console.error('Request for Services: Signature insertion error:', sigError);
          throw sigError;
        }
      }
      
      setNotification({ 
        type: 'success', 
        message: status === 'draft' ? 'Draft saved successfully!' : 'Request for Services submitted successfully!' 
      });
      if (status === 'submitted') reset();
    } catch (error: any) {
      console.error('Request for Services: Caught error during submission:', error);
      setNotification({ type: 'error', message: `Error submitting form: ${error.message || 'Please try again.'}` });
    } finally {
      setIsSavingDraft(false);
      console.log('Request for Services: Submission process finished.');
    }
  };

  const onSubmit = async (data: RFSFormValues) => await submitForm(data, 'submitted');
  const onSaveDraft = async () => {
    const data = watch();
    await submitForm(data, 'draft');
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-8 space-y-8">
      <Link to="/clinical-forms" className="flex items-center gap-2 text-zinc-500 hover:text-partners-blue-dark transition-colors mb-6 group no-print">
        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
        <span className="text-sm font-medium">Back to Forms</span>
      </Link>
      <div className="flex flex-col gap-4 mb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <Logo showText size={48} />
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-partners-blue-dark flex items-center gap-2">
              <ClipboardList className="text-partners-green shrink-0" />
              Request for Services (RFS-1)
            </h2>
            <p className="text-sm md:text-base text-partners-gray">Clinical eligibility determination for requested services.</p>
          </div>
        </div>
        <div className="flex flex-row items-center justify-end gap-3 no-print w-full md:w-auto mt-auto">
          <Button 
            variant="secondary" 
            type="button" 
            onClick={handlePrint}
            disabled={isSubmitting || isSavingDraft || isGeneratingPDF}
            className="h-10 px-4 rounded-xl shadow-sm"
          >
            {isGeneratingPDF ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileText className="w-4 h-4 mr-2" />}
            {isGeneratingPDF ? 'Generating...' : 'Download PDF'}
          </Button>
          <Button 
            type="button"
            onClick={handleSubmit(onSubmit)}
            disabled={isSubmitting || isSavingDraft || isGeneratingPDF}
            className="h-10 px-4 rounded-xl shadow-md bg-partners-blue-dark hover:bg-partners-blue transition-all active:scale-95"
          >
            <Send className="w-4 h-4 mr-2" />
            {isSubmitting ? 'Submitting...' : 'Submit Form'}
          </Button>
        </div>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
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
        <div className="flex justify-end">
          <div className="space-y-1">
            <label className="text-sm font-medium text-zinc-700">Date</label>
            <input type="date" {...register('date')} className="px-4 py-2 rounded-xl border border-zinc-200" />
          </div>
        </div>

        {/* Services Requested */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h3 className="font-bold text-zinc-900 border-b pb-2">Service(s) requested</h3>
            <div className="grid grid-cols-1 gap-2">
              {[
                'Pre-admission nursing facility (NF)',
                'Adult day health (ADH)',
                'Adult foster care (AFC)',
                'Group adult foster care (GAFC)',
                'Home and community based services (HCBS) waiver',
                'Program for All-inclusive Care for the Elderly (PACE)',
              ].map(service => (
                <label key={service} className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" value={service} {...register('servicesRequested')} className="w-4 h-4 rounded border-zinc-300" />
                  <span className="text-sm">{service}</span>
                </label>
              ))}
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2 cursor-pointer shrink-0">
                  <input type="checkbox" value="Other" {...register('servicesRequested')} className="w-4 h-4 rounded border-zinc-300" />
                  <span className="text-sm">Other</span>
                </label>
                <input {...register('otherService')} className="flex-1 px-3 py-1 border-b border-zinc-200 outline-none text-sm" />
              </div>
            </div>
          </div>

          <div className="space-y-4 bg-zinc-50 p-4 rounded-2xl border border-zinc-100">
            <h3 className="font-bold text-zinc-900 border-b pb-2">Nursing facility use only</h3>
            <div className="grid grid-cols-1 gap-2">
              {[
                'Conversion',
                'Continued stay',
                'Short term review',
                'Transfer NF to NF',
                'Retrospective'
              ].map(item => (
                <label key={item} className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" value={item} {...register('nursingFacilityUseOnly')} className="w-4 h-4 rounded border-zinc-300" />
                  <span className="text-sm">{item}</span>
                </label>
              ))}
            </div>
          </div>
        </section>

        {/* Member Information */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-partners-blue-dark font-bold border-b pb-2">
            <User size={20} />
            <h3>Member information</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-zinc-700">Last Name</label>
              <input {...register('memberInfo.lastName')} className="w-full px-4 py-2 rounded-xl border border-zinc-200" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-zinc-700">First Name</label>
              <input {...register('memberInfo.firstName')} className="w-full px-4 py-2 rounded-xl border border-zinc-200" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-zinc-700">Telephone</label>
              <input {...register('memberInfo.telephone')} className="w-full px-4 py-2 rounded-xl border border-zinc-200" />
            </div>
            <div className="space-y-1 col-span-full">
              <label className="text-sm font-medium text-zinc-700">Address</label>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-3">
                  <input {...register('memberInfo.street')} placeholder="Street" className="w-full px-4 py-2 rounded-xl border border-zinc-200" />
                </div>
                <div>
                  <input {...register('memberInfo.apt')} placeholder="Apt/Suite" className="w-full px-4 py-2 rounded-xl border border-zinc-200" />
                </div>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-zinc-700">City</label>
              <input {...register('memberInfo.city')} className="w-full px-4 py-2 rounded-xl border border-zinc-200" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-zinc-700">State</label>
              <input {...register('memberInfo.state')} className="w-full px-4 py-2 rounded-xl border border-zinc-200" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-zinc-700">Zip</label>
              <input {...register('memberInfo.zip')} className="w-full px-4 py-2 rounded-xl border border-zinc-200" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
            <div className="space-y-3">
              {[
                'MassHealth member',
                'MassHealth application pending',
                'GAFC/Assisted living residence'
              ].map(status => (
                <label key={status} className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" value={status} {...register('memberInfo.status')} className="w-4 h-4 text-partners-blue-dark" />
                  <span className="text-sm">{status}</span>
                </label>
              ))}
            </div>
            <div className="space-y-4 col-span-2">
              <div className="space-y-1">
                <label className="text-sm font-medium text-zinc-700">MassHealth ID number</label>
                <input {...register('memberInfo.masshealthId')} className="w-full px-4 py-2 rounded-xl border border-zinc-200" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-zinc-700">Date application filed</label>
                  <input type="date" {...register('memberInfo.dateApplicationFiled')} className="w-full px-4 py-2 rounded-xl border border-zinc-200" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-zinc-700">Date SSI-G application filed</label>
                  <input type="date" {...register('memberInfo.dateSsigApplicationFiled')} className="w-full px-4 py-2 rounded-xl border border-zinc-200" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Next of Kin & Physician */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-partners-blue-dark font-bold border-b pb-2">
              <User size={18} />
              <h3>Next of kin/Responsible party</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input {...register('nextOfKin.lastName')} placeholder="Last Name" className="px-3 py-1.5 rounded-lg border border-zinc-200 text-sm" />
              <input {...register('nextOfKin.firstName')} placeholder="First Name" className="px-3 py-1.5 rounded-lg border border-zinc-200 text-sm" />
              <input {...register('nextOfKin.telephone')} placeholder="Telephone" className="col-span-full px-3 py-1.5 rounded-lg border border-zinc-200 text-sm" />
              <input {...register('nextOfKin.street')} placeholder="Street" className="col-span-full px-3 py-1.5 rounded-lg border border-zinc-200 text-sm" />
              <input {...register('nextOfKin.apt')} placeholder="Apt/Suite" className="px-3 py-1.5 rounded-lg border border-zinc-200 text-sm" />
              <input {...register('nextOfKin.city')} placeholder="City" className="px-3 py-1.5 rounded-lg border border-zinc-200 text-sm" />
              <input {...register('nextOfKin.state')} placeholder="State" className="px-3 py-1.5 rounded-lg border border-zinc-200 text-sm" />
              <input {...register('nextOfKin.zip')} placeholder="Zip" className="px-3 py-1.5 rounded-lg border border-zinc-200 text-sm" />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2 text-partners-blue-dark font-bold border-b pb-2">
              <Stethoscope size={18} />
              <h3>Physician</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input {...register('physician.lastName')} placeholder="Last Name" className="px-3 py-1.5 rounded-lg border border-zinc-200 text-sm" />
              <input {...register('physician.firstName')} placeholder="First Name" className="px-3 py-1.5 rounded-lg border border-zinc-200 text-sm" />
              <input {...register('physician.telephone')} placeholder="Telephone" className="col-span-full px-3 py-1.5 rounded-lg border border-zinc-200 text-sm" />
              <input {...register('physician.street')} placeholder="Street" className="col-span-full px-3 py-1.5 rounded-lg border border-zinc-200 text-sm" />
              <input {...register('physician.apt')} placeholder="Apt/Suite" className="px-3 py-1.5 rounded-lg border border-zinc-200 text-sm" />
              <input {...register('physician.city')} placeholder="City" className="px-3 py-1.5 rounded-lg border border-zinc-200 text-sm" />
              <input {...register('physician.state')} placeholder="State" className="px-3 py-1.5 rounded-lg border border-zinc-200 text-sm" />
              <input {...register('physician.zip')} placeholder="Zip" className="px-3 py-1.5 rounded-lg border border-zinc-200 text-sm" />
            </div>
          </div>
        </section>

        {/* Screening Section */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-partners-blue-dark font-bold border-b pb-2">
            <AlertCircle size={20} />
            <h3>Screening for mental illness, mental retardation, and developmental disability</h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" {...register('screening.mentalIllness')} className="w-4 h-4 rounded border-zinc-300" />
                <span className="text-sm">Mental illness</span>
              </label>
              <div className="flex-1 flex items-center gap-2">
                <span className="text-xs text-zinc-500">Specify:</span>
                <input {...register('screening.mentalIllnessSpecify')} className="flex-1 border-b border-zinc-200 outline-none text-sm" />
              </div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" {...register('screening.mentalRetardation')} className="w-4 h-4 rounded border-zinc-300" />
              <span className="text-sm">Mental retardation without related condition</span>
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" {...register('screening.developmentalDisability')} className="w-4 h-4 rounded border-zinc-300" />
                <span className="text-sm font-bold">Developmental disability with related condition that occurred prior to age 22.</span>
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pl-6">
                {[
                  'Autism', 'Deafness/severe hearing impairment', 'Multiple sclerosis', 'Severe learning disability',
                  'Blindness/severe visual impairment', 'Epilepsy/seizure disorder', 'Muscular dystrophy', 'Spina bifida',
                  'Cerebral palsy', 'Head/brain injury', 'Orthopedic impairment', 'Spinal cord injury',
                  'Cystic fibrosis', 'Major mental illness', 'Speech/language impairment'
                ].map(cond => (
                  <label key={cond} className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" value={cond} {...register('screening.conditions')} className="w-3 h-3 rounded border-zinc-300" />
                    <span className="text-[11px] text-zinc-600">{cond}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Community Services Recommended */}
        <section className="space-y-4">
          <h3 className="font-bold text-zinc-900 border-b pb-2">Community services recommended</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {[
              'Skilled nursing', 'HCBS waiver', 'Rest home', 'Homemaker',
              'Physical therapy', 'Personal emergency response system', 'Elderly housing', 'Meals',
              'Occupational therapy', 'Adult foster care', 'Adult day health', 'Transportation',
              'Speech therapy', 'Group adult foster care', 'PACE', 'Chore service',
              'Mental health services', 'Assisted living', 'Home health aide', 'Grocery shopping/delivery',
              'Social worker services', 'Congregate housing', 'Personal care/homemaker'
            ].map(service => (
              <label key={service} className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" value={service} {...register('communityServices')} className="w-3 h-3 rounded border-zinc-300" />
                <span className="text-[11px] text-zinc-600">{service}</span>
              </label>
            ))}
            <div className="flex items-center gap-2 col-span-2">
              <label className="flex items-center gap-2 cursor-pointer shrink-0">
                <input type="checkbox" value="Other" {...register('communityServices')} className="w-3 h-3 rounded border-zinc-300" />
                <span className="text-[11px] text-zinc-600">Other:</span>
              </label>
              <input {...register('communityServicesOther')} className="flex-1 border-b border-zinc-200 outline-none text-xs" />
            </div>
          </div>
        </section>

        {/* Additional Information */}
        <section className="space-y-6">
          <h3 className="font-bold text-zinc-900 border-b pb-2">Additional information</h3>
          <div className="space-y-4">
            {[
              { id: 'homeAvailable', label: '1. Is the home or apartment available for the member or applicant?' },
              { id: 'caregiverAvailable', label: '2. Is there a caregiver to assist the member in the community?' },
              { id: 'weightGain', label: '3. Has the member or applicant experienced unexplained weight gain in the last 30 days?' },
              { id: 'personalCareServices', label: '4. Does the member or applicant receive personal care/homemaker services?' },
            ].map(q => (
              <div key={q.id} className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                <span className="text-sm text-zinc-700">{q.label}</span>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" value="yes" {...register(`additionalInfo.${q.id}` as any)} className="w-4 h-4 text-partners-blue-dark" />
                    <span className="text-sm">yes</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" value="no" {...register(`additionalInfo.${q.id}` as any)} className="w-4 h-4 text-partners-blue-dark" />
                    <span className="text-sm">no</span>
                  </label>
                </div>
              </div>
            ))}
            
            {watch('additionalInfo.personalCareServices') === 'yes' && (
              <div className="flex gap-4 pl-6">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-zinc-500">days per week:</span>
                  <input {...register('additionalInfo.daysPerWeek')} className="w-16 border-b border-zinc-200 outline-none text-sm text-center" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-zinc-500">hours per week:</span>
                  <input {...register('additionalInfo.hoursPerWeek')} className="w-16 border-b border-zinc-200 outline-none text-sm text-center" />
                </div>
              </div>
            )}

            <div className="space-y-3">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                <span className="text-sm text-zinc-700">5. Has the member or applicant experienced a significant change in condition in the last 30 days?</span>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" value="yes" {...register('additionalInfo.changeInCondition')} className="w-4 h-4 text-partners-blue-dark" />
                    <span className="text-sm">yes</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" value="no" {...register('additionalInfo.changeInCondition')} className="w-4 h-4 text-partners-blue-dark" />
                    <span className="text-sm">no</span>
                  </label>
                </div>
              </div>
              {watch('additionalInfo.changeInCondition') === 'yes' && (
                <div className="space-y-3 pl-6">
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" value="improvement" {...register('additionalInfo.changeType')} className="w-4 h-4 text-partners-blue-dark" />
                      <span className="text-sm italic">improvement</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" value="deterioration" {...register('additionalInfo.changeType')} className="w-4 h-4 text-partners-blue-dark" />
                      <span className="text-sm italic">deterioration</span>
                    </label>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-zinc-500">Indicate the changes below:</label>
                    <textarea {...register('additionalInfo.changeDetails')} rows={2} className="w-full px-4 py-2 rounded-xl border border-zinc-200" />
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Nursing Facility Requests */}
        <section className="space-y-4 bg-zinc-50 p-6 rounded-3xl border border-zinc-100">
          <h3 className="font-bold text-zinc-900 border-b pb-2">For nursing facility requests only</h3>
          <div className="space-y-4">
            {[
              { id: 'interestToRemain', label: '1. Does the nursing facility member/applicant express an interest to remain in or return to the community?' },
              { id: 'shortTermStay', label: '2. Is the nursing facility stay expected to be short-term (up to 90 days)?' },
              { id: 'longTermStay', label: '3. Is the nursing facility stay expected to be long-term (more than 90 days)?' },
            ].map(q => (
              <div key={q.id} className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                <span className="text-sm text-zinc-700">{q.label}</span>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" value="yes" {...register(`nursingFacilityRequests.${q.id}` as any)} className="w-4 h-4 text-partners-blue-dark" />
                    <span className="text-sm">yes</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" value="no" {...register(`nursingFacilityRequests.${q.id}` as any)} className="w-4 h-4 text-partners-blue-dark" />
                    <span className="text-sm">no</span>
                  </label>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Referral Source */}
        <section className="space-y-6 pt-8 border-t border-zinc-200">
          <h3 className="font-bold text-zinc-900">Referral source <span className="font-normal text-zinc-500 text-sm">Name of registered nurse completing this form</span></h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <SignaturePad 
                label="Signature" 
                onSave={(sig) => setValue('referralSource.signature', sig, { shouldValidate: true })} 
              />
              {errors.referralSource?.signature && <p className="text-xs text-red-500">{errors.referralSource.signature.message}</p>}
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-zinc-700">Print Name</label>
                  <input {...register('referralSource.printName')} className="w-full px-4 py-2 rounded-xl border border-zinc-200" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-zinc-700">Title</label>
                  <input {...register('referralSource.title')} className="w-full px-4 py-2 rounded-xl border border-zinc-200" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-zinc-700">Name of organization</label>
                  <input {...register('referralSource.organization')} className="w-full px-4 py-2 rounded-xl border border-zinc-200" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-zinc-700">Telephone</label>
                  <input {...register('referralSource.telephone')} className="w-full px-4 py-2 rounded-xl border border-zinc-200" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-zinc-700">Address</label>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="md:col-span-3">
                    <input {...register('referralSource.street')} placeholder="Street" className="w-full px-4 py-2 rounded-xl border border-zinc-200" />
                  </div>
                  <div>
                    <input {...register('referralSource.apt')} placeholder="Apt/Suite" className="w-full px-4 py-2 rounded-xl border border-zinc-200" />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-zinc-700">City</label>
                  <input {...register('referralSource.city')} className="w-full px-4 py-2 rounded-xl border border-zinc-200" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-zinc-700">State</label>
                  <input {...register('referralSource.state')} className="w-full px-4 py-2 rounded-xl border border-zinc-200" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-zinc-700">Zip</label>
                  <input {...register('referralSource.zip')} className="w-full px-4 py-2 rounded-xl border border-zinc-200" />
                </div>
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
