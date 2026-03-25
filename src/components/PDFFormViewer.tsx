import React, { useState } from 'react';
import { ArrowLeft, Download, FileText, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface PDFFormViewerProps {
  title: string;
  description: string;
  pdfPath: string;
  accentColor?: string;
}

export const PDFFormViewer: React.FC<PDFFormViewerProps> = ({
  title,
  description,
  pdfPath,
  accentColor = 'bg-blue-100 text-blue-600',
}) => {
  const navigate = useNavigate();
  const [loadError, setLoadError] = useState(false);

  const handleDownload = () => {
    const iframe = document.getElementById('pdf-iframe') as HTMLIFrameElement;
    if (iframe?.contentWindow) {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/clinical-forms')}
          className="p-2 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-600 transition-colors"
          aria-label="Back to Clinical Forms"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-zinc-900 italic">{title}</h1>
          <p className="text-sm text-zinc-500">{description}</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between bg-white rounded-2xl border border-zinc-200 px-5 py-3 shadow-sm">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl ${accentColor}`}>
            <FileText size={18} />
          </div>
          <span className="text-sm font-semibold text-zinc-700">{title}</span>
        </div>
        <button
          onClick={handleDownload}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-partners-blue-dark hover:opacity-90 rounded-xl transition-opacity"
        >
          <Download size={16} />
          <span className="hidden sm:inline">Download</span>
        </button>
      </div>

      {/* PDF Viewer */}
      <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm overflow-hidden">
        {loadError ? (
          <div className="flex flex-col items-center justify-center py-24 text-center px-6">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="text-red-400" size={32} />
            </div>
            <h3 className="text-lg font-bold text-zinc-900 mb-2 italic">PDF could not be loaded</h3>
            <p className="text-zinc-500 text-sm mb-6 max-w-md">
              Make sure the file exists at <code className="bg-zinc-100 px-1 rounded">{pdfPath}</code> in the
              project's <code className="bg-zinc-100 px-1 rounded">public</code> folder.
            </p>
          </div>
        ) : (
          <iframe
            id="pdf-iframe"
            src={`${pdfPath}#toolbar=1&navpanes=0&scrollbar=1&view=FitH`}
            title={title}
            className="w-full"
            style={{ height: 'calc(100vh - 280px)', minHeight: '600px', border: 'none' }}
            onError={() => setLoadError(true)}
          />
        )}
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-2xl px-5 py-4 text-sm text-blue-700">
        <AlertCircle size={18} className="mt-0.5 flex-shrink-0" />
        <p>
          Fill in the form fields directly in the PDF above. Click <strong>Download</strong> to save or print a copy.
        </p>
      </div>
    </div>
  );
};