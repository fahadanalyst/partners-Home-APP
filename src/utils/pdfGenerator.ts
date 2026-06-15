import React from 'react';

/**
 * Generates a PDF using @react-pdf/renderer.
 *
 * We lazy-import the renderer so it never touches the browser DOM renderer.
 * This prevents the "CSSStyleDeclaration indexed setter" crash on React 19.
 */
export const generatePDFFromTemplate = async (
  Template: React.FC<any>,
  data: any,
  filename: string
): Promise<boolean> => {
  // Lazy import — keeps the PDF renderer completely separate from React DOM
  const { pdf } = await import('@react-pdf/renderer');
  
  console.log('PDF DATA:', JSON.stringify(data, null, 2));
  try {
    const element = React.createElement(Template, { data });
    const blob = await pdf(element).toBlob();

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    return true;
  } catch (error) {
    console.error('PDF generation error:', error);
    throw error;
  }
};

export const exportToPDF = async (
  element: HTMLElement,
  filename: string,
): Promise<boolean> => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    throw new Error('Unable to open print window. Please allow popups and try again.');
  }

  printWindow.document.write(`
    <!doctype html>
    <html>
      <head>
        <title>${filename}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 24px; color: #111827; }
          input, textarea, select { border: 1px solid #d4d4d8; padding: 4px; }
          button { display: none !important; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>${element.outerHTML}</body>
    </html>
  `);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
  printWindow.close();
  return true;
};
