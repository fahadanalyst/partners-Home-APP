import { generatePDFFromTemplate } from '../utils/pdfGenerator';
//import { fillAndDownloadPDF } from '../utils/fillGovernmentPDF';
//import { buildMDSAssessmentFields } from '../utils/pdfTemplateFillers/MDSAssessmentFields';
//import { buildPhysicianSummaryFields } from '../utils/pdfTemplateFillers/PhysicianSummaryFields';
//import { buildRequestForServicesFields } from '../utils/pdfTemplateFillers/RequestForServicesFields';

// ── React-PDF templates (unchanged) ─────────────────────────────────────────
import { GAFCProgressNoteTemplate } from '../components/PDFTemplates/GAFCProgressNoteTemplate';
import { GAFCCarePlanTemplate } from '../components/PDFTemplates/GAFCCarePlanTemplate';
import { NursingAssessmentTemplate } from '../components/PDFTemplates/NursingAssessmentTemplate';
import { PhysicianOrdersTemplate } from '../components/PDFTemplates/PhysicianOrdersTemplate';
import { AdmissionAssessmentTemplate } from '../components/PDFTemplates/AdmissionAssessmentTemplate';
import { DischargeSummaryTemplate } from '../components/PDFTemplates/DischargeSummaryTemplate';
import { MAR_Template } from '../components/PDFTemplates/MAR_Template';
import { TAR_Template } from '../components/PDFTemplates/TAR_Template';
import { ClinicalNoteTemplate } from '../components/PDFTemplates/ClinicalNoteTemplate';
import { PatientResourceDataTemplate } from '../components/PDFTemplates/PatientResourceDataTemplate';
import { PatientSummaryTemplate } from '../components/PDFTemplates/PatientSummaryTemplate';
import { HomeSafetyInspectionTemplate } from '../components/PDFTemplates/HomeSafetyInspectionTemplate';

// ── NEW templates ─────────────────────────────────────────────────────────────
import { SemiAnnualHealthStatusReportTemplate } from '../components/PDFTemplates/Semiannualhealthstatusreporttemplate';
import { GAFCAideCarePlanTemplate } from '../components/PDFTemplates/Gafcaidecareplantemplate';
import { MedicationListTemplate } from '../components/PDFTemplates/Medicationlisttemplate';

// ── Forms routed to editable PDF templates ───────────────────────────────────
// These 3 use pdf-lib to fill the government PDFs in /public/pdfs/
// Update these filenames if your actual files are named differently.
const GOVERNMENT_PDF_TEMPLATES: Record<string, string> = {
  'MDS Assessment':               '/pdfs/MDSAssessment.pdf',
  'Physician Summary (PSF-1)':    '/pdfs/physicalsummary.pdf',
  'Request for Services (RFS-1)': '/pdfs/RequestForServices.pdf',
};

// ── Forms still using react-pdf/renderer ─────────────────────────────────────
const REACT_PDF_TEMPLATE_MAP: Record<string, any> = {
  'GAFC Progress Note':                     GAFCProgressNoteTemplate,
  'GAFC Care Plan':                         GAFCCarePlanTemplate,
  'Nursing Assessment':                     NursingAssessmentTemplate,
  'Physician Orders':                       PhysicianOrdersTemplate,
  'Admission Assessment':                   AdmissionAssessmentTemplate,
  'Discharge Summary':                      DischargeSummaryTemplate,
  'Medication Administration Record (MAR)': MAR_Template,
  'Treatment Administration Record (TAR)':  TAR_Template,
  'Clinical Note':                          ClinicalNoteTemplate,
  'Patient Resource Data':                  PatientResourceDataTemplate,
  'Patient Summary':                        PatientSummaryTemplate,
  'Home Safety Inspection':                 HomeSafetyInspectionTemplate,
  // ── NEW ──
  'Semi-Annual Health Status Report':       SemiAnnualHealthStatusReportTemplate,
  'GAFC Aide Care Plan':                    GAFCAideCarePlanTemplate,
  'Medication List':                        MedicationListTemplate,
};

// ── Field-map builders for the 3 government forms ────────────────────────────
function buildGovernmentFields(formName: string, data: any): Record<string, string | boolean | undefined> {
  switch (formName) {
    case 'MDS Assessment':
      return buildMDSAssessmentFields(data);
    case 'Physician Summary (PSF-1)':
      return buildPhysicianSummaryFields(data);
    case 'Request for Services (RFS-1)':
      return buildRequestForServicesFields(data);
    default:
      return {};
  }
}

// ── Main export — same signature as before, fully backward-compatible ─────────
export const generateFormPDF = async (
  formName: string,
  data: any,
  filename?: string
): Promise<boolean> => {
  const finalFilename =
    filename || `${formName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;

  // Route to pdf-lib filler for the 3 government forms
  if (GOVERNMENT_PDF_TEMPLATES[formName]) {
    const templatePath = GOVERNMENT_PDF_TEMPLATES[formName];
    const fields = buildGovernmentFields(formName, data);
    return fillAndDownloadPDF(templatePath, fields, finalFilename);
  }

  // All other forms — react-pdf/renderer (unchanged)
  const Template = REACT_PDF_TEMPLATE_MAP[formName];
  if (!Template) {
    console.warn(`No template found for "${formName}".`);
    throw new Error(`No PDF template found for form: "${formName}"`);
  }

  const { generatePDFFromTemplate: gen } = await import('../utils/pdfGenerator');
  return gen(Template, data, finalFilename);
};