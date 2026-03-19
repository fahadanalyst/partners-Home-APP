import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { 
  FileText, 
  Search, 
  Plus, 
  User, 
  Calendar,
  Filter,
  MoreVertical,
  MessageSquare,
  AlertCircle
} from 'lucide-react';
import { Button } from '../components/Button';
import { useAuth } from '../context/AuthContext';
import { Modal } from '../components/Modal';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { Notification, NotificationType } from '../components/Notification';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const noteSchema = z.object({
  patient_id: z.string().min(1, 'Required'),
  note_type: z.string().min(1, 'Required'),
  content: z.string().min(1, 'Content cannot be empty'),
});

type NoteFormValues = z.infer<typeof noteSchema>;

interface ClinicalNote {
  id: string;
  patient_id: string;
  staff_id: string;
  note_type: string;
  content: string;
  created_at: string;
  patient: {
    first_name: string;
    last_name: string;
  };
  staff: {
    full_name: string;
  };
}

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
}

export const ClinicalNotes: React.FC = () => {
  const { profile } = useAuth();
  const [notes, setNotes] = useState<ClinicalNote[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<ClinicalNote | null>(null);
  const [filterType, setFilterType] = useState('All');
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [activeNoteMenu, setActiveNoteMenu] = useState<{ id: string, rect: DOMRect | null }>({ id: '', rect: null });
  const [noteToDelete, setNoteToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [notification, setNotification] = useState<{ type: NotificationType, message: string } | null>(null);

  const filterMenuRef = React.useRef<HTMLDivElement>(null);
  const [filterMenuPos, setFilterMenuPos] = useState<'bottom' | 'top'>('bottom');

  useEffect(() => {
    if (showFilterMenu && filterMenuRef.current) {
      const rect = filterMenuRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      if (spaceBelow < 200) {
        setFilterMenuPos('top');
      } else {
        setFilterMenuPos('bottom');
      }
    }
  }, [showFilterMenu]);

  const { register, handleSubmit, reset, setValue, formState: { errors, isSubmitting } } = useForm<NoteFormValues>({
    resolver: zodResolver(noteSchema)
  });

  useEffect(() => {
    if (editingNote) {
      setValue('patient_id', editingNote.patient_id);
      setValue('note_type', editingNote.note_type);
      setValue('content', editingNote.content);
    } else {
      reset();
    }
  }, [editingNote, setValue, reset]);

  useEffect(() => {
    fetchNotes();
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      const { data } = await supabase.from('patients').select('id, first_name, last_name').order('last_name');
      setPatients(data || []);
    } catch (error) {
      console.error('Error fetching patients:', error);
    }
  };

  const fetchNotes = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('clinical_notes')
        .select(`
          *,
          patient:patients(first_name, last_name),
          staff:profiles(full_name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotes(data || []);
    } catch (error) {
      console.error('Error fetching clinical notes:', error);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: NoteFormValues) => {
    if (!profile) return;
    try {
      if (editingNote) {
        const { error } = await supabase
          .from('clinical_notes')
          .update({
            ...data,
            staff_id: profile.id
          })
          .eq('id', editingNote.id);

        if (error) throw error;
        setNotification({ type: 'success', message: 'Clinical note updated successfully!' });
      } else {
        const { error } = await supabase
          .from('clinical_notes')
          .insert([{
            ...data,
            staff_id: profile.id
          }]);

        if (error) throw error;
        setNotification({ type: 'success', message: 'Clinical note added successfully!' });
      }
      
      setIsModalOpen(false);
      setEditingNote(null);
      reset();
      fetchNotes();
    } catch (error: any) {
      console.error('Error saving clinical note:', error);
      setNotification({ type: 'error', message: 'Error saving clinical note: ' + error.message });
    }
  };

  const filteredNotes = notes.filter(n => 
    (filterType === 'All' || n.note_type === filterType) &&
    (`${n.patient.first_name} ${n.patient.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    n.content.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const deleteNote = async (id: string) => {
    try {
      setIsDeleting(true);
      console.log('ClinicalNotes: Attempting to delete note:', id);
      const { error, status } = await supabase.from('clinical_notes').delete().eq('id', id);
      
      if (error) {
        console.error('ClinicalNotes: Delete error:', error);
        throw error;
      }
      
      console.log('ClinicalNotes: Delete successful, status:', status);
      
      // Refresh data from server to ensure sync
      await fetchNotes();
      setNotification({ type: 'success', message: 'Note deleted successfully' });
    } catch (error: any) {
      console.error('ClinicalNotes: Caught error during delete:', error);
      setNotification({ type: 'error', message: 'Error deleting note: ' + (error.message || 'Unknown error') });
    } finally {
      setIsDeleting(false);
      setNoteToDelete(null);
      setActiveNoteMenu({ id: '', rect: null });
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-zinc-900 italic">Clinical Notes</h1>
          <p className="text-sm md:text-base text-zinc-500">General patient observations and nursing documentation</p>
        </div>
        <Button className="rounded-full px-6 w-full sm:w-auto" onClick={() => setIsModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          New Note
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="relative w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={20} />
          <input
            type="text"
            placeholder="Search notes or patients..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-zinc-200 rounded-2xl focus:ring-2 focus:ring-partners-blue-dark outline-none transition-all shadow-sm"
          />
        </div>
        <div className="relative w-full md:w-auto">
          <Button 
            variant="secondary" 
            className="rounded-2xl h-[50px] w-full md:w-auto"
            onClick={(e) => {
              setShowFilterMenu(!showFilterMenu);
            }}
          >
            <Filter className="w-4 h-4 mr-2" />
            {filterType === 'All' ? 'Filter' : filterType}
          </Button>
          
          {showFilterMenu && (
            <div 
              ref={filterMenuRef}
              className={`absolute right-0 ${filterMenuPos === 'top' ? 'bottom-full mb-2' : 'mt-2'} w-48 bg-white rounded-2xl border border-zinc-200 shadow-xl z-50 overflow-hidden`}
            >
              {['All', 'General', 'Nursing', 'Follow-up', 'Incident', 'Medication'].map((type) => (
                <button
                  key={type}
                  onClick={() => {
                    setFilterType(type);
                    setShowFilterMenu(false);
                  }}
                  className={`w-full text-left px-4 py-3 text-sm hover:bg-zinc-50 transition-colors ${filterType === type ? 'text-partners-blue-dark font-bold bg-partners-blue-dark/5' : 'text-zinc-600'}`}
                >
                  {type}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-48 bg-white rounded-3xl border border-zinc-200 animate-pulse"></div>
          ))
        ) : filteredNotes.length === 0 ? (
          <div className="bg-white p-12 rounded-3xl border border-zinc-200 text-center space-y-4">
            <div className="w-16 h-16 bg-zinc-50 rounded-full flex items-center justify-center mx-auto text-zinc-300">
              <MessageSquare size={32} />
            </div>
            <p className="text-zinc-500">No clinical notes found.</p>
          </div>
        ) : (
          filteredNotes.map((note) => (
            <div key={note.id} className="bg-white p-8 rounded-3xl border border-zinc-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-partners-blue-dark/5 flex items-center justify-center text-partners-blue-dark">
                    <FileText size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-zinc-900">{note.patient.last_name}, {note.patient.first_name}</h4>
                    <div className="flex items-center gap-3 text-xs text-zinc-500 mt-1">
                      <span className="flex items-center gap-1">
                        <Calendar size={12} />
                        {new Date(note.created_at).toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <User size={12} />
                        By: {note.staff.full_name}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 relative">
                  <span className="px-3 py-1 bg-zinc-100 text-zinc-600 rounded-full text-[10px] font-bold uppercase tracking-wider">
                    {note.note_type}
                  </span>
                  <div className="relative">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="p-1"
                      onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        setActiveNoteMenu(activeNoteMenu.id === note.id ? { id: '', rect: null } : { id: note.id, rect });
                      }}
                    >
                      < MoreVertical size={18} />
                    </Button>
                    
                    {activeNoteMenu.id === note.id && (
                      <div 
                        className={`absolute right-0 ${activeNoteMenu.rect && (window.innerHeight - activeNoteMenu.rect.bottom < 150) ? 'bottom-full mb-2' : 'mt-2'} w-32 bg-white rounded-xl border border-zinc-200 shadow-xl z-50 overflow-hidden`}
                      >
                        <button
                          onClick={() => {
                            setEditingNote(note);
                            setIsModalOpen(true);
                            setActiveNoteMenu({ id: '', rect: null });
                          }}
                          className="w-full text-left px-4 py-2 text-xs text-zinc-600 hover:bg-zinc-50 transition-colors font-medium border-b border-zinc-50"
                        >
                          Edit Note
                        </button>
                        <button
                          onClick={() => {
                            setNoteToDelete(note.id);
                            setActiveNoteMenu({ id: '', rect: null });
                          }}
                          className="w-full text-left px-4 py-2 text-xs text-red-600 hover:bg-red-50 transition-colors font-medium"
                        >
                          Delete Note
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="prose prose-sm max-w-none text-zinc-700 bg-zinc-50 p-4 rounded-2xl border border-zinc-100">
                {note.content}
              </div>
            </div>
          ))
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingNote(null);
        }}
        title={editingNote ? "Edit Clinical Note" : "New Clinical Note"}
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700">Patient</label>
              <select
                {...register('patient_id')}
                className="w-full px-4 py-2 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-partners-blue-dark outline-none transition-all"
              >
                <option value="">Select Patient</option>
                {patients.map(p => (
                  <option key={p.id} value={p.id}>{p.last_name}, {p.first_name}</option>
                ))}
              </select>
              {errors.patient_id && <p className="text-xs text-red-500">{errors.patient_id.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700">Note Type</label>
              <select
                {...register('note_type')}
                className="w-full px-4 py-2 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-partners-blue-dark outline-none transition-all"
              >
                <option value="General">General Observation</option>
                <option value="Nursing">Nursing Visit</option>
                <option value="Follow-up">Follow-up</option>
                <option value="Incident">Incident Report</option>
                <option value="Medication">Medication Review</option>
              </select>
              {errors.note_type && <p className="text-xs text-red-500">{errors.note_type.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-700">Clinical Observations</label>
            <textarea
              {...register('content')}
              rows={8}
              className="w-full px-4 py-3 rounded-2xl border border-zinc-200 focus:ring-2 focus:ring-partners-blue-dark outline-none transition-all resize-none"
              placeholder="Enter detailed clinical observations..."
            />
            {errors.content && <p className="text-xs text-red-500">{errors.content.message}</p>}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100">
            <Button variant="secondary" onClick={() => {
              setIsModalOpen(false);
              setEditingNote(null);
            }} type="button">
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : editingNote ? 'Update Clinical Note' : 'Save Clinical Note'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmationModal
        isOpen={!!noteToDelete}
        onClose={() => setNoteToDelete(null)}
        onConfirm={() => noteToDelete && deleteNote(noteToDelete)}
        title="Delete Clinical Note"
        message="Are you sure you want to delete this clinical note? This action cannot be undone."
        confirmText="Delete Note"
        isLoading={isDeleting}
      />

      {notification && (
        <Notification 
          type={notification.type} 
          message={notification.message} 
          onClose={() => setNotification(null)} 
        />
      )}
    </div>
  );
};
