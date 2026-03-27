import React from 'react';
import { PDFFormViewer } from '../components/PDFFormViewer';

export const CIRF: React.FC = () => (
  <PDFFormViewer
    title="CIRF"
    description="MassHealth Community Services Critical Incident Report Form."
    pdfPath="/pdfs/cirf.pdf"
    accentColor="bg-purple-100 text-purple-600"
    formName="CIRF"
  />
);