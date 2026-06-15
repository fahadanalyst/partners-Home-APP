import type React from 'react';

type TemplateLoader = () => Promise<React.FC<any>>;
type FieldBuilder = (data: any) => Record<string, string | boolean | undefined>;

const GOVERNMENT_PDF_TEMPLATES: Record<string, string> = {
  'MDS Assessment': '/pdfs/MDSAssessment.pdf',
  'Physician Summary (PSF-1)': '/pdfs/physicalsummary.pdf',
  'Request for Services (RFS-1)': '/pdfs/RequestForServices.pdf',
};

const REACT_PDF_TEMPLATE_LOADERS: Record<string, TemplateLoader> = {
  'GAFC Progress Note': () => import('../components/PDFTemplates/GAFCProgressNoteTemplate').then(m => m.GAFCProgressNoteTemplate),
  'GAFC Care Plan': () => import('../components/PDFTemplates/GAFCCarePlanTemplate').then(m => m.GAFCCarePlanTemplate),
  'Nursing Assessment': () => import('../components/PDFTemplates/NursingAssessmentTemplate').then(m => m.NursingAssessmentTemplate),
  'Physician Orders': () => import('../components/PDFTemplates/PhysicianOrdersTemplate').then(m => m.PhysicianOrdersTemplate),
  'Admission Assessment': () => import('../components/PDFTemplates/AdmissionAssessmentTemplate').then(m => m.AdmissionAssessmentTemplate),
  'Discharge Summary': () => import('../components/PDFTemplates/DischargeSummaryTemplate').then(m => m.DischargeSummaryTemplate),
  'Medication Administration Record (MAR)': () => import('../components/PDFTemplates/MAR_Template').then(m => m.MAR_Template),
  'Treatment Administration Record (TAR)': () => import('../components/PDFTemplates/TAR_Template').then(m => m.TAR_Template),
  'Clinical Note': () => import('../components/PDFTemplates/ClinicalNoteTemplate').then(m => m.ClinicalNoteTemplate),
  'Patient Resource Data': () => import('../components/PDFTemplates/PatientResourceDataTemplate').then(m => m.PatientResourceDataTemplate),
  'Patient Summary': () => import('../components/PDFTemplates/PatientSummaryTemplate').then(m => m.PatientSummaryTemplate),
  'Home Safety Inspection': () => import('../components/PDFTemplates/HomeSafetyInspectionTemplate').then(m => m.HomeSafetyInspectionTemplate),
  'Semi-Annual Health Status Report': () => import('../components/PDFTemplates/Semiannualhealthstatusreporttemplate').then(m => m.SemiAnnualHealthStatusReportTemplate),
  'GAFC Aide Care Plan': () => import('../components/PDFTemplates/Gafcaidecareplantemplate').then(m => m.GAFCAideCarePlanTemplate),
  'Medication List': () => import('../components/PDFTemplates/Medicationlisttemplate').then(m => m.MedicationListTemplate),
};

const loadGovernmentFieldBuilder = async (formName: string): Promise<FieldBuilder> => {
  switch (formName) {
    case 'MDS Assessment':
      return import('../utils/pdfTemplateFillers/MDSAssessmentFields').then(m => m.buildMDSAssessmentFields);
    case 'Physician Summary (PSF-1)':
      return import('../utils/pdfTemplateFillers/PhysicianSummaryFields').then(m => m.buildPhysicianSummaryFields);
    case 'Request for Services (RFS-1)':
      return import('../utils/pdfTemplateFillers/RequestForServicesFields').then(m => m.buildRequestForServicesFields);
    default:
      return () => ({});
  }
};

const downloadBytes = (bytes: Uint8Array, filename: string) => {
  const blob = new Blob([bytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const fillAndDownloadPDF = async (
  templatePath: string,
  fields: Record<string, string | boolean | undefined>,
  filename: string,
): Promise<boolean> => {
  const [{ PDFDocument, PDFCheckBox, PDFRadioGroup }, response] = await Promise.all([
    import('pdf-lib'),
    fetch(templatePath),
  ]);

  if (!response.ok) {
    throw new Error(`Unable to load PDF template: ${templatePath}`);
  }

  const pdfDoc = await PDFDocument.load(await response.arrayBuffer());
  const form = pdfDoc.getForm();

  Object.entries(fields).forEach(([name, value]) => {
    if (value === undefined || value === null) return;

    try {
      const field = form.getFieldMaybe(name);
      if (!field) return;

      if (typeof value === 'boolean') {
        if (field instanceof PDFCheckBox) {
          value ? field.check() : field.uncheck();
          return;
        }
        if (field instanceof PDFRadioGroup && value) {
          const options = field.getOptions();
          if (options[0]) field.select(options[0]);
          return;
        }
      }

      if ('setText' in field && typeof field.setText === 'function') {
        field.setText(String(value));
      }
    } catch (error) {
      console.warn(`PDF field "${name}" could not be filled:`, error);
    }
  });

  downloadBytes(await pdfDoc.save(), filename);
  return true;
};

export const generateFormPDF = async (
  formName: string,
  data: any,
  filename?: string,
): Promise<boolean> => {
  const finalFilename =
    filename || `${formName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;

  if (GOVERNMENT_PDF_TEMPLATES[formName]) {
    const buildFields = await loadGovernmentFieldBuilder(formName);
    return fillAndDownloadPDF(GOVERNMENT_PDF_TEMPLATES[formName], buildFields(data), finalFilename);
  }

  const loadTemplate = REACT_PDF_TEMPLATE_LOADERS[formName];
  if (!loadTemplate) {
    console.warn(`No template found for "${formName}".`);
    throw new Error(`No PDF template found for form: "${formName}"`);
  }

  const [Template, { generatePDFFromTemplate }] = await Promise.all([
    loadTemplate(),
    import('../utils/pdfGenerator'),
  ]);

  return generatePDFFromTemplate(Template, data, finalFilename);
};
