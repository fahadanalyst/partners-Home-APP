import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { FileUpload } from '../components/FileUpload';
import { Button } from '../components/Button';
import {
  UserPlus, Search, Edit2, Trash2, X,
  ChevronDown, ChevronUp, AlertCircle, CheckCircle2,
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────
interface Education {
  name: string;
  datesAttended: string;
  address: string;
  graduated: boolean;
  degree: string;
}

interface StaffCompliance {
  completedAssessment: boolean;
  completedAssessmentDate: string;
  semiAnnualStatusDate: string;
  monthlySupervisionDate: string;
  licenseNumber: string;
  licenseExpiry: string;
  certifications: string;
}

interface StaffMember {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  date_of_hire: string;
  ssn: string;
  high_school: Education;
  college: Education;
  emergency_contact: string;
  emergency_phone: string;
  pay_rate_hourly: string;
  compliance: StaffCompliance;
  status: 'active' | 'inactive';
  created_at: string;
}

const EMPTY_EDUCATION: Education = { name: '', datesAttended: '', address: '', graduated: false, degree: '' };
const EMPTY_COMPLIANCE: StaffCompliance = {
  completedAssessment: false, completedAssessmentDate: '',
  semiAnnualStatusDate: '', monthlySupervisionDate: '',
  licenseNumber: '', licenseExpiry: '', certifications: '',
};

type StaffForm = Omit<StaffMember, 'id' | 'created_at'>;

const EMPTY_FORM: StaffForm = {
  name: '', address: '', phone: '', email: '', date_of_hire: '',
  ssn: '', emergency_contact: '', emergency_phone: '', pay_rate_hourly: '',
  high_school: { ...EMPTY_EDUCATION },
  college: { ...EMPTY_EDUCATION },
  compliance: { ...EMPTY_COMPLIANCE },
  status: 'active',
};

// ── Compliance badge ──────────────────────────────────────────────────────────
const ComplianceBadge: React.FC<{ ok: boolean; label: string }> = ({ ok, label }) => (
  <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${ok ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
    {ok ? <CheckCircle2 size={10} /> : <AlertCircle size={10} />}
    {label}
  </div>
);

// ── Main Component ────────────────────────────────────────────────────────────
export const StaffManagement: React.FC = () => {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<StaffMember | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [form, setForm] = useState<StaffForm>(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { fetchStaff(); }, []);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('staff')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setStaff(data || []);
    } catch (err: any) {
      setError('Failed to load staff: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const filtered = staff.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    (s.email || '').toLowerCase().includes(search.toLowerCase())
  );

  const openAdd = () => {
    setForm({
      ...EMPTY_FORM,
      high_school: { ...EMPTY_EDUCATION },
      college: { ...EMPTY_EDUCATION },
      compliance: { ...EMPTY_COMPLIANCE },
    });
    setEditing(null);
    setShowModal(true);
  };

  const openEdit = (s: StaffMember) => {
    setForm({
      name: s.name,
      address: s.address || '',
      phone: s.phone || '',
      email: s.email || '',
      date_of_hire: s.date_of_hire || '',
      ssn: s.ssn || '',
      high_school: s.high_school || { ...EMPTY_EDUCATION },
      college: s.college || { ...EMPTY_EDUCATION },
      emergency_contact: s.emergency_contact || '',
      emergency_phone: s.emergency_phone || '',
      pay_rate_hourly: s.pay_rate_hourly || '',
      compliance: s.compliance || { ...EMPTY_COMPLIANCE },
      status: s.status,
    });
    setEditing(s);
    setShowModal(true);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      const payload = {
        name: form.name,
        address: form.address,
        phone: form.phone,
        email: form.email,
        date_of_hire: form.date_of_hire,
        ssn: form.ssn,
        high_school: form.high_school,
        college: form.college,
        emergency_contact: form.emergency_contact,
        emergency_phone: form.emergency_phone,
        pay_rate_hourly: form.pay_rate_hourly,
        compliance: form.compliance,
        status: form.status,
      };

      if (editing) {
        const { error } = await supabase
          .from('staff')
          .update(payload)
          .eq('id', editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('staff')
          .insert([payload]);
        if (error) throw error;
      }

      await fetchStaff();
      setShowModal(false);
      setEditing(null);
    } catch (err: any) {
      setError('Failed to save: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this staff member? Their uploaded files will remain in storage.')) return;
    try {
      const { error } = await supabase.from('staff').delete().eq('id', id);
      if (error) throw error;
      setStaff(prev => prev.filter(s => s.id !== id));
    } catch (err: any) {
      setError('Failed to delete: ' + err.message);
    }
  };

  const set = (key: keyof StaffForm, val: any) => setForm(prev => ({ ...prev, [key]: val }));
  const setEdu = (type: 'high_school' | 'college', key: keyof Education, val: any) =>
    setForm(prev => ({ ...prev, [type]: { ...prev[type], [key]: val } }));
  const setComp = (key: keyof StaffCompliance, val: any) =>
    setForm(prev => ({ ...prev, compliance: { ...prev.compliance, [key]: val } }));

  const complianceOk = (s: StaffMember) => {
    const c = s.compliance;
    if (!c) return false;
    return c.completedAssessment && !!c.semiAnnualStatusDate && !!c.monthlySupervisionDate && !!c.licenseNumber;
  };

  const inputCls = "w-full px-3 py-2 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-partners-blue-dark outline-none text-sm";

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-partners-blue-dark italic">Staff Management</h2>
          <p className="text-sm md:text-base text-partners-gray">Track staff compliance, licenses, certifications and documents.</p>
        </div>
        <Button className="rounded-full px-6 w-full sm:w-auto" onClick={openAdd}>
          <UserPlus className="w-4 h-4 mr-2" /> Add Staff Member
        </Button>
      </div>

      {/* Error banner */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center justify-between text-red-600 text-sm">
          <div className="flex items-center gap-2"><AlertCircle size={16} />{error}</div>
          <button onClick={() => setError(null)}><X size={16} /></button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Staff', value: staff.length, color: 'text-partners-blue-dark', bg: 'bg-blue-50' },
          { label: 'Active', value: staff.filter(s => s.status === 'active').length, color: 'text-emerald-700', bg: 'bg-emerald-50' },
          { label: 'Compliant', value: staff.filter(s => complianceOk(s)).length, color: 'text-partners-green', bg: 'bg-green-50' },
          { label: 'Needs Attention', value: staff.filter(s => !complianceOk(s) && s.status === 'active').length, color: 'text-red-600', bg: 'bg-red-50' },
        ].map(stat => (
          <div key={stat.label} className={`${stat.bg} rounded-2xl p-4`}>
            <p className="text-xs font-bold text-zinc-400 uppercase tracking-wide">{stat.label}</p>
            <p className={`text-3xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
        <input type="text" placeholder="Search by name or email..." value={search} onChange={e => setSearch(e.target.value)}
          className="w-full pl-12 pr-4 py-3 rounded-2xl border border-zinc-200 focus:ring-2 focus:ring-partners-blue-dark outline-none bg-white" />
      </div>

      {/* Staff List */}
      <div className="space-y-3">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-20 bg-white rounded-3xl border border-zinc-200 animate-pulse" />
          ))
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-3xl border border-zinc-200 p-12 text-center text-zinc-400">
            {search ? 'No staff match your search.' : 'No staff members yet. Click "Add Staff Member" to get started.'}
          </div>
        ) : filtered.map(s => (
          <div key={s.id} className="bg-white rounded-3xl border border-zinc-200 shadow-sm overflow-hidden">
            {/* Row header */}
            <div className="flex items-center justify-between p-4 sm:p-6">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-partners-blue-dark/10 text-partners-blue-dark flex items-center justify-center font-bold shrink-0">
                  {s.name?.[0] || '?'}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold text-zinc-900">{s.name}</p>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${s.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
                      {s.status}
                    </span>
                    {complianceOk(s)
                      ? <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 flex items-center gap-1"><CheckCircle2 size={10} /> Compliant</span>
                      : <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-600 flex items-center gap-1"><AlertCircle size={10} /> Needs Attention</span>
                    }
                  </div>
                  <p className="text-xs text-zinc-500">{s.email} · {s.phone}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => openEdit(s)}><Edit2 size={15} /></Button>
                <Button variant="ghost" size="sm" className="text-red-400" onClick={() => handleDelete(s.id)}><Trash2 size={15} /></Button>
                <button onClick={() => setExpandedId(expandedId === s.id ? null : s.id)}
                  className="p-1 text-zinc-400 hover:text-zinc-600 transition-colors">
                  {expandedId === s.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>
              </div>
            </div>

            {/* Expanded detail */}
            {expandedId === s.id && (
              <div className="border-t border-zinc-100 p-4 sm:p-6 space-y-6 bg-zinc-50/50">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Personal info */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wide">Personal Info</h4>
                    {[
                      ['Date of Hire', s.date_of_hire],
                      ['Address', s.address],
                      ['Pay Rate', s.pay_rate_hourly ? `$${s.pay_rate_hourly}/hr` : '—'],
                      ['Emergency Contact', s.emergency_contact ? `${s.emergency_contact} · ${s.emergency_phone}` : '—'],
                    ].map(([label, val]) => (
                      <div key={label as string}>
                        <p className="text-[10px] font-bold text-zinc-400 uppercase">{label}</p>
                        <p className="text-sm text-zinc-700">{val || '—'}</p>
                      </div>
                    ))}
                  </div>

                  {/* Education */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wide">Education</h4>
                    {(['high_school', 'college'] as const).map(type => (
                      <div key={type}>
                        <p className="text-[10px] font-bold text-zinc-400 uppercase">{type === 'high_school' ? 'High School' : 'College'}</p>
                        <p className="text-sm text-zinc-700">{s[type]?.name || '—'}</p>
                        {s[type]?.degree && <p className="text-xs text-zinc-500">Degree: {s[type].degree} · {s[type].graduated ? 'Graduated' : 'Did not graduate'}</p>}
                      </div>
                    ))}
                  </div>

                  {/* Compliance */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wide">Compliance Tracking</h4>
                    <div className="flex flex-wrap gap-2">
                      <ComplianceBadge ok={s.compliance?.completedAssessment} label="Assessment" />
                      <ComplianceBadge ok={!!s.compliance?.semiAnnualStatusDate} label="Semi-Annual" />
                      <ComplianceBadge ok={!!s.compliance?.monthlySupervisionDate} label="Monthly Supervision" />
                      <ComplianceBadge ok={!!s.compliance?.licenseNumber} label="License" />
                    </div>
                    {[
                      ['License #', s.compliance?.licenseNumber],
                      ['License Expiry', s.compliance?.licenseExpiry],
                      ['Last Assessment', s.compliance?.completedAssessmentDate],
                      ['Semi-Annual Date', s.compliance?.semiAnnualStatusDate],
                      ['Monthly Supervision', s.compliance?.monthlySupervisionDate],
                      ['Certifications', s.compliance?.certifications],
                    ].map(([label, val]) => (
                      <div key={label as string}>
                        <p className="text-[10px] font-bold text-zinc-400 uppercase">{label}</p>
                        <p className="text-sm text-zinc-700">{val || '—'}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* File Upload — now uses staff.id which exists in public.staff table */}
                <div className="border-t border-zinc-200 pt-6">
                  <FileUpload
                    staffId={s.id}
                    onUploadSuccess={() => {}}
                  />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-2xl border border-zinc-200 w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-zinc-100">
              <h3 className="text-xl font-bold text-zinc-900">{editing ? 'Edit Staff Member' : 'Add Staff Member'}</h3>
              <button onClick={() => setShowModal(false)} className="text-zinc-400 hover:text-zinc-600"><X size={20} /></button>
            </div>

            <div className="overflow-y-auto p-6 space-y-6">

              {/* Personal Info */}
              <section className="space-y-4">
                <h4 className="text-sm font-bold text-partners-blue-dark uppercase tracking-wide border-b pb-2">Personal Information</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {([
                    ['Name', 'name', 'text'],
                    ['Phone', 'phone', 'tel'],
                    ['Email', 'email', 'email'],
                    ['Date of Hire', 'date_of_hire', 'date'],
                    ['Pay Rate (Hourly $)', 'pay_rate_hourly', 'number'],
                  ] as [string, keyof StaffForm, string][]).map(([lbl, key, type]) => (
                    <div key={key} className="space-y-1">
                      <label className="text-xs font-medium text-zinc-500 uppercase">{lbl}</label>
                      <input type={type} value={(form as any)[key] || ''} onChange={e => set(key, e.target.value)} className={inputCls} />
                    </div>
                  ))}
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-zinc-500 uppercase">Status</label>
                    <select value={form.status} onChange={e => set('status', e.target.value)} className={`${inputCls} bg-white`}>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-zinc-500 uppercase">Address</label>
                  <input type="text" value={form.address} onChange={e => set('address', e.target.value)} className={inputCls} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-zinc-500 uppercase">Social Security Number</label>
                  <input type="text" value={form.ssn} onChange={e => set('ssn', e.target.value)} className={inputCls} placeholder="XXX-XX-XXXX" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-zinc-500 uppercase">Emergency Contact Name</label>
                    <input type="text" value={form.emergency_contact} onChange={e => set('emergency_contact', e.target.value)} className={inputCls} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-zinc-500 uppercase">Emergency Contact Phone</label>
                    <input type="tel" value={form.emergency_phone} onChange={e => set('emergency_phone', e.target.value)} className={inputCls} />
                  </div>
                </div>
              </section>

              {/* Education */}
              {(['high_school', 'college'] as const).map(type => (
                <section key={type} className="space-y-4">
                  <h4 className="text-sm font-bold text-partners-blue-dark uppercase tracking-wide border-b pb-2">
                    {type === 'high_school' ? 'High School' : 'College / University'}
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-zinc-500 uppercase">Institution Name</label>
                      <input type="text" value={form[type].name} onChange={e => setEdu(type, 'name', e.target.value)} className={inputCls} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-zinc-500 uppercase">Dates Attended</label>
                      <input type="text" value={form[type].datesAttended} onChange={e => setEdu(type, 'datesAttended', e.target.value)} placeholder="e.g. 2010 - 2014" className={inputCls} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-zinc-500 uppercase">Address</label>
                      <input type="text" value={form[type].address} onChange={e => setEdu(type, 'address', e.target.value)} className={inputCls} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-zinc-500 uppercase">Degree Obtained</label>
                      <input type="text" value={form[type].degree} onChange={e => setEdu(type, 'degree', e.target.value)}
                        placeholder={type === 'high_school' ? 'High School Diploma' : 'B.S. Nursing'} className={inputCls} />
                    </div>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form[type].graduated} onChange={e => setEdu(type, 'graduated', e.target.checked)} className="w-4 h-4 rounded border-zinc-300" />
                    <span className="text-sm text-zinc-700">Graduated</span>
                  </label>
                </section>
              ))}

              {/* Compliance */}
              <section className="space-y-4">
                <h4 className="text-sm font-bold text-partners-blue-dark uppercase tracking-wide border-b pb-2">Compliance Tracking</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-zinc-500 uppercase">License Number</label>
                    <input type="text" value={form.compliance.licenseNumber} onChange={e => setComp('licenseNumber', e.target.value)} className={inputCls} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-zinc-500 uppercase">License Expiry</label>
                    <input type="date" value={form.compliance.licenseExpiry} onChange={e => setComp('licenseExpiry', e.target.value)} className={inputCls} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-zinc-500 uppercase">Semi-Annual Status Assessment Date</label>
                    <input type="date" value={form.compliance.semiAnnualStatusDate} onChange={e => setComp('semiAnnualStatusDate', e.target.value)} className={inputCls} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-zinc-500 uppercase">Monthly Supervision Visit Date</label>
                    <input type="date" value={form.compliance.monthlySupervisionDate} onChange={e => setComp('monthlySupervisionDate', e.target.value)} className={inputCls} />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-zinc-500 uppercase">Certifications</label>
                  <textarea value={form.compliance.certifications} onChange={e => setComp('certifications', e.target.value)}
                    rows={2} placeholder="e.g. CPR/AED, HIPAA Training, Wound Care Certification"
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-partners-blue-dark outline-none text-sm resize-none" />
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.compliance.completedAssessment}
                    onChange={e => setComp('completedAssessment', e.target.checked)} className="w-4 h-4 rounded border-zinc-300" />
                  <span className="text-sm text-zinc-700">Completed Assessment</span>
                </label>
                {form.compliance.completedAssessment && (
                  <div className="space-y-1 pl-6">
                    <label className="text-xs font-medium text-zinc-500 uppercase">Assessment Completion Date</label>
                    <input type="date" value={form.compliance.completedAssessmentDate}
                      onChange={e => setComp('completedAssessmentDate', e.target.value)} className={inputCls} />
                  </div>
                )}
              </section>
            </div>

            {/* Footer */}
            <div className="flex gap-3 p-6 border-t border-zinc-100">
              <Button variant="secondary" className="flex-1" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button className="flex-1" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : editing ? 'Save Changes' : 'Add Staff Member'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};