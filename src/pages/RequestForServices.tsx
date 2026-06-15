import React from 'react';
import { PDFFormViewer } from '../components/PDFFormViewer';
 
export const RequestForServices: React.FC = () => (
  <PDFFormViewer
    title="Request for Services (RFS-1)"
    description="Clinical eligibility determination for requested services."
    pdfPath="/pdfs/RequestForServices.pdf"
    accentColor="bg-rose-100 text-rose-600"
    formName="Request for Services (RFS-1)"
  />
);