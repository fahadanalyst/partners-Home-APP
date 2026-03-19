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
