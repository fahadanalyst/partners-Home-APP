import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { Upload, File, Trash2, Download, Loader2, X, AlertCircle } from 'lucide-react';
import { Button } from './Button';

interface FileUploadProps {
  patientId?: string;
  staffId?: string;
  onUploadSuccess?: () => void;
}

interface FileRecord {
  id: string;
  file_name: string;
  file_path: string;
  file_type: string;
  created_at: string;
}

export const FileUpload: React.FC<FileUploadProps> = ({ patientId, staffId, onUploadSuccess }) => {
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fileToDelete, setFileToDelete] = useState<FileRecord | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => { fetchFiles(); }, [patientId, staffId]);

  const fetchFiles = async () => {
    try {
      setLoading(true);
      let query = supabase.from('files').select('*');
      if (patientId) query = query.eq('patient_id', patientId);
      else if (staffId) query = query.eq('staff_id', staffId);
      else { setFiles([]); setLoading(false); return; }
      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      setFiles(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = event.target.files?.[0];
      if (!file) return;
      setUploading(true);
      setError(null);
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${patientId ? 'patients' : 'staff'}/${patientId || staffId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('clinical-files')
        .upload(filePath, file);
      if (uploadError) {
        if (uploadError.message.includes('bucket not found'))
          throw new Error('Storage bucket "clinical-files" not found. Please create it in Supabase Dashboard.');
        throw uploadError;
      }

      const { error: dbError } = await supabase.from('files').insert([{
        patient_id: patientId || null,
        staff_id: staffId || null,
        file_name: file.name,
        file_path: filePath,
        file_type: file.type,
        uploaded_by: (await supabase.auth.getUser()).data.user?.id,
      }]);
      if (dbError) throw dbError;

      fetchFiles();
      if (onUploadSuccess) onUploadSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const handleDeleteConfirmed = async () => {
    if (!fileToDelete) return;
    try {
      setDeleting(true);
      const { error: storageError } = await supabase.storage
        .from('clinical-files')
        .remove([fileToDelete.file_path]);
      if (storageError) throw storageError;

      const { error: dbError } = await supabase.from('files').delete().eq('id', fileToDelete.id);
      if (dbError) throw dbError;

      setFiles(prev => prev.filter(f => f.id !== fileToDelete.id));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setDeleting(false);
      setFileToDelete(null);
    }
  };

  const handleDownload = async (file: FileRecord) => {
    try {
      const { data, error } = await supabase.storage.from('clinical-files').download(file.file_path);
      if (error) throw error;
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.file_name;
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-bold text-zinc-900 uppercase tracking-wider">Documents & Files</h4>
        <div className="relative">
          <input type="file" id="file-upload" className="hidden" onChange={handleFileUpload} disabled={uploading} />
          <label htmlFor="file-upload"
            className="inline-flex items-center justify-center rounded-xl font-medium transition-all active:scale-95 bg-white text-zinc-900 border border-zinc-200 hover:bg-zinc-50 px-3 py-1.5 text-sm cursor-pointer">
            {uploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
            {uploading ? 'Uploading...' : 'Upload File'}
          </label>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2 text-red-600 text-xs">
          <AlertCircle size={14} />
          <p className="flex-1">{error}</p>
          <button onClick={() => setError(null)}><X size={14} /></button>
        </div>
      )}

      {/* File List */}
      <div className="bg-zinc-50 rounded-2xl border border-zinc-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center"><Loader2 className="w-6 h-6 mx-auto animate-spin text-zinc-400" /></div>
        ) : files.length === 0 ? (
          <div className="p-8 text-center text-zinc-500">
            <File className="w-8 h-8 mx-auto mb-2 opacity-20" />
            <p className="text-sm italic">No documents uploaded yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-200">
            {files.map(file => (
              <div key={file.id} className="p-4 flex items-center justify-between hover:bg-white transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-partners-blue-dark/10 text-partners-blue-dark flex items-center justify-center">
                    <File size={16} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-zinc-900 truncate max-w-[200px] md:max-w-xs" title={file.file_name}>
                      {file.file_name}
                    </p>
                    <p className="text-[10px] text-zinc-500 uppercase tracking-wider">
                      {new Date(file.created_at).toLocaleDateString()} · {file.file_type?.split('/')[1]?.toUpperCase() || 'FILE'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => handleDownload(file)} className="p-2 text-zinc-400 hover:text-partners-blue-dark transition-colors" title="Download">
                    <Download size={16} />
                  </button>
                  <button onClick={() => setFileToDelete(file)} className="p-2 text-zinc-400 hover:text-red-500 transition-colors" title="Delete">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Custom Delete Confirmation Modal */}
      {fileToDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-2xl border border-zinc-200 w-full max-w-sm p-6 space-y-6">
            <div className="flex items-center gap-4 p-4 bg-red-50 rounded-2xl border border-red-100">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <Trash2 className="text-red-600" size={22} />
              </div>
              <div>
                <p className="text-sm font-bold text-red-900">Delete File?</p>
                <p className="text-xs text-red-700 mt-0.5">
                  "<span className="font-semibold">{fileToDelete.file_name}</span>" will be permanently removed.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={() => setFileToDelete(null)} disabled={deleting}>
                Cancel
              </Button>
              <Button className="flex-1 bg-red-600 hover:bg-red-700 text-white" onClick={handleDeleteConfirmed} disabled={deleting}>
                {deleting ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};