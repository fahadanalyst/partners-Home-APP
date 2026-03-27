import React from 'react';
import { PDFFormViewer } from  '../PDFFormViewer';
 
export const MDSAssessment: React.FC = () => (
  <PDFFormViewer
    title="MDS Assessment"
    description="Minimum Data Set assessment for care planning."
    pdfPath="/pdfs/MDSAssessment.pdf"
    accentColor="bg-cyan-100 text-cyan-600"
    formName="MDS Assessment"
  />
);