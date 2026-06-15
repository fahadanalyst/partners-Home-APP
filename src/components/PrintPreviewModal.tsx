import { useEffect } from 'react';
import { generatePDFFromTemplate } from '../utils/pdfGenerator';

interface PrintPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  template: React.FC<any>;
  data: any;
  title: string;
  filename: string;
}

export const PrintPreviewModal: React.FC<PrintPreviewModalProps> = ({
  isOpen,
  onClose,
  template: Template,
  data,
  filename
}) => {
  useEffect(() => {
    if (!isOpen) return;

    generatePDFFromTemplate(Template, data, filename)
      .then(() => onClose())
      .catch((err) => {
        console.error('PDF failed:', err);
        onClose();
      });
  }, [isOpen]);

  return null;
};