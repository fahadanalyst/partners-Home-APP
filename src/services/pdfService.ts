import { generatePDFFromTemplate } from '../utils/pdfGenerator';
import { GAFCProgressNoteTemplate } from '../components/PDFTemplates/GAFCProgressNoteTemplate';
import { GAFCCarePlanTemplate } from '../components/PDFTemplates/GAFCCarePlanTemplate';
import { NursingAssessmentTemplate } from '../components/PDFTemplates/NursingAssessmentTemplate';
import { PhysicianOrdersTemplate } from '../components/PDFTemplates/PhysicianOrdersTemplate';
import { PhysicianSummaryTemplate } from '../components/PDFTemplates/PhysicianSummaryTemplate';
import { MDSAssessmentTemplate } from '../components/PDFTemplates/MDSAssessmentTemplate';
import { AdmissionAssessmentTemplate } from '../components/PDFTemplates/AdmissionAssessmentTemplate';
import { DischargeSummaryTemplate } from '../components/PDFTemplates/DischargeSummaryTemplate';
import { RequestForServicesTemplate } from '../components/PDFTemplates/RequestForServicesTemplate';
import { MAR_Template } from '../components/PDFTemplates/MAR_Template';
import { TAR_Template } from '../components/PDFTemplates/TAR_Template';
import { ClinicalNoteTemplate } from '../components/PDFTemplates/ClinicalNoteTemplate';
import { PatientResourceDataTemplate } from '../components/PDFTemplates/PatientResourceDataTemplate';
import { PatientSummaryTemplate } from '../components/PDFTemplates/PatientSummaryTemplate';

const TEMPLATE_MAP: Record<string, any> = {
  'GAFC Progress Note': GAFCProgressNoteTemplate,
  'GAFC Care Plan': GAFCCarePlanTemplate,
  'Nursing Assessment': NursingAssessmentTemplate,
  'Physician Orders': PhysicianOrdersTemplate,
  'Physician Summary (PSF-1)': PhysicianSummaryTemplate,
  'MDS Assessment': MDSAssessmentTemplate,
  'Admission Assessment': AdmissionAssessmentTemplate,
  'Discharge Summary': DischargeSummaryTemplate,
  'Request for Services (RFS-1)': RequestForServicesTemplate,
  'Medication Administration Record (MAR)': MAR_Template,
  'Treatment Administration Record (TAR)': TAR_Template,
  'Clinical Note': ClinicalNoteTemplate,
  'Patient Resource Data': PatientResourceDataTemplate,
  'Patient Summary': PatientSummaryTemplate,
};

export const generateFormPDF = async (
  formName: string,
  data: any,
  filename?: string
): Promise<boolean> => {
  const Template = TEMPLATE_MAP[formName];

  if (!Template) {
    console.warn(`No template found for "${formName}".`);
    throw new Error(`No PDF template found for form: "${formName}"`);
  }

  const finalFilename =
    filename || `${formName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;

  await generatePDFFromTemplate(Template, data, finalFilename);
  return true;
};
