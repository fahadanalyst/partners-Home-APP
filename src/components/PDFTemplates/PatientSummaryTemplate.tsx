import React from 'react';
import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer';
import { PDFHeader, PDFFooter, shared, BRAND } from './BasePDFTemplate';

const s = StyleSheet.create({
  // Hero
  hero: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: 'rgba(0,86,150,0.04)', borderWidth: 2,
    borderColor: 'rgba(0,86,150,0.12)', borderStyle: 'solid',
    borderRadius: 8, padding: 14, marginBottom: 12,
  },
  avatar: {
    width: 48, height: 48, borderRadius: 6, backgroundColor: BRAND.blue,
    justifyContent: 'center', alignItems: 'center', flexShrink: 0,
  },
  avatarText: { color: BRAND.white, fontSize: 18, fontFamily: 'Helvetica-Bold' },
  heroName: { fontSize: 16, fontFamily: 'Helvetica-Bold', color: BRAND.zinc900 },
  heroMeta: { flexDirection: 'row', gap: 16, marginTop: 4 },
  heroMetaLabel: { fontSize: 7, color: BRAND.zinc400, textTransform: 'uppercase', letterSpacing: 0.5 },
  heroMetaVal: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: BRAND.zinc700 },
  badgeActive: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 20, backgroundColor: '#dcfce7' },
  badgeActiveText: { fontSize: 7, fontFamily: 'Helvetica-Bold', color: '#15803d', textTransform: 'uppercase' },
  badgeInactive: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 20, backgroundColor: BRAND.zinc100 },
  badgeInactiveText: { fontSize: 7, fontFamily: 'Helvetica-Bold', color: BRAND.zinc500, textTransform: 'uppercase' },
  // Compliance boxes
  compRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  compBox: {
    flex: 1, backgroundColor: BRAND.zinc50, borderWidth: 1,
    borderColor: BRAND.zinc100, borderStyle: 'solid', borderRadius: 5, padding: 8,
  },
  compLabel: { fontSize: 7, fontFamily: 'Helvetica-Bold', color: BRAND.zinc400, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 3 },
  compVal: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: BRAND.zinc900 },
  compValWarn: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: '#dc2626' },
  compRowInline: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  // Directive badge
  dirBadgeYes: { paddingHorizontal: 5, paddingVertical: 2, borderRadius: 3, backgroundColor: '#dcfce7' },
  dirBadgeYesText: { fontSize: 7, fontFamily: 'Helvetica-Bold', color: '#15803d' },
  dirBadgeNo: { paddingHorizontal: 5, paddingVertical: 2, borderRadius: 3, backgroundColor: BRAND.zinc100 },
  dirBadgeNoText: { fontSize: 7, color: BRAND.zinc500 },
  dirRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  dirItem: { width: '30%', marginBottom: 6 },
  // Diagnosis / Medication rows
  diagRow: {
    flexDirection: 'row', paddingVertical: 5,
    borderBottomWidth: 1, borderBottomColor: BRAND.zinc100, borderBottomStyle: 'solid',
  },
  medRow: {
    flexDirection: 'row', paddingVertical: 5,
    borderBottomWidth: 1, borderBottomColor: BRAND.zinc100, borderBottomStyle: 'solid',
  },
  // Visit table
  visitHeader: {
    flexDirection: 'row', backgroundColor: BRAND.zinc50,
    borderBottomWidth: 1, borderBottomColor: BRAND.zinc200, borderBottomStyle: 'solid', paddingVertical: 6,
  },
  visitRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: BRAND.zinc100, borderBottomStyle: 'solid', paddingVertical: 6 },
  visitRowAlt: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: BRAND.zinc100, borderBottomStyle: 'solid', paddingVertical: 6, backgroundColor: BRAND.zinc50 },
  colNum: { width: 24, paddingHorizontal: 4 },
  colDate: { width: 85, paddingHorizontal: 4 },
  colType: { flex: 1, paddingHorizontal: 4 },
  colStatus: { width: 75, paddingHorizontal: 4, alignItems: 'flex-end' },
  thText: { fontSize: 7, fontFamily: 'Helvetica-Bold', color: BRAND.zinc500, textTransform: 'uppercase', letterSpacing: 0.5 },
  visitBadgeGreen: { paddingHorizontal: 5, paddingVertical: 2, borderRadius: 8, backgroundColor: '#dcfce7' },
  visitBadgeGreenText: { fontSize: 7, fontFamily: 'Helvetica-Bold', color: '#15803d', textTransform: 'uppercase' },
  visitBadgeGray: { paddingHorizontal: 5, paddingVertical: 2, borderRadius: 8, backgroundColor: BRAND.zinc100 },
  visitBadgeGrayText: { fontSize: 7, color: BRAND.zinc500, textTransform: 'uppercase' },
  emptyState: {
    padding: 24, alignItems: 'center',
    borderWidth: 1, borderColor: BRAND.zinc200, borderStyle: 'dashed', borderRadius: 6, marginTop: 8,
  },
});

// ─── Helpers ─────────────────────────────────────────────────────────────────
const v = (val: any) => (val != null && val !== '') ? String(val) : 'N/A';

const safeDate = (val: any) => {
  if (!val || val === 'Never') return 'Never';
  const d = new Date(val);
  return isNaN(d.getTime()) ? 'Never' : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const Field: React.FC<{ label: string; value?: any }> = ({ label, value }) => (
  <View style={{ marginBottom: 7 }}>
    <Text style={shared.label}>{label}</Text>
    <Text style={shared.value}>{v(value)}</Text>
  </View>
);

const Row2: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <View style={{ flexDirection: 'row', gap: 12, marginBottom: 4 }}>{children}</View>
);
const Row3: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <View style={{ flexDirection: 'row', gap: 8, marginBottom: 4 }}>{children}</View>
);
const Col: React.FC<{ children: React.ReactNode; flex?: number }> = ({ children, flex = 1 }) => (
  <View style={{ flex }}>{children}</View>
);

const Directive: React.FC<{ label: string; value?: string | null }> = ({ label, value }) => {
  const isYes = value === 'Yes';
  return (
    <View style={s.dirItem}>
      <Text style={shared.label}>{label}</Text>
      <View style={isYes ? s.dirBadgeYes : s.dirBadgeNo}>
        <Text style={isYes ? s.dirBadgeYesText : s.dirBadgeNoText}>{value || 'No'}</Text>
      </View>
    </View>
  );
};

// ─── Template ────────────────────────────────────────────────────────────────
export const PatientSummaryTemplate: React.FC<{ data: any }> = ({ data }) => {
  const { patient = {}, visits = [] } = data;
  const fullName = `${v(patient.last_name)}, ${v(patient.first_name)}`;
  const title = `Patient Summary: ${patient.last_name || 'Patient'}, ${patient.first_name || ''}`;
  const isActive = patient.status === 'active';
  const addrLines = [patient.street, patient.apt, patient.city ? `${patient.city}, ${patient.state || ''} ${patient.zip || ''}`.trim() : null].filter(Boolean);
  const diagnoses: any[] = patient.diagnoses || [];
  const medications: any[] = patient.medications || [];
  const ecAddr = patient.emergency_contact_address || {};

  return (
    <Document>

      {/* ══════════════════════════════════════════════════════════
          PAGE 1 — Identity, Contact, Demographic, Census
      ══════════════════════════════════════════════════════════ */}
      <Page size="A4" style={shared.page}>
        <PDFHeader title={title} />

        {/* Hero */}
        <View style={s.hero}>
          <View style={s.avatar}>
            <Text style={s.avatarText}>{(patient.first_name?.[0] || 'P')}{(patient.last_name?.[0] || 'T')}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
              <Text style={s.heroName}>{fullName}</Text>
              <View style={isActive ? s.badgeActive : s.badgeInactive}>
                <Text style={isActive ? s.badgeActiveText : s.badgeInactiveText}>{patient.status || 'active'}</Text>
              </View>
            </View>
            <View style={s.heroMeta}>
              {[['DOB', safeDate(patient.dob)], ['Gender', v(patient.gender)], ['ID', patient.id?.slice(0, 8) || 'N/A'], ['Start of Service', safeDate(patient.start_of_service)]].map(([lbl, val]) => (
                <View key={lbl as string}>
                  <Text style={s.heroMetaLabel}>{lbl}</Text>
                  <Text style={s.heroMetaVal}>{val}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Contact & Insurance */}
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 10 }}>
          <View style={{ width: '48%' }}>
            <Text style={shared.sectionTitle}>Contact Information</Text>
            <View style={shared.card}>
              <Field label="Primary Phone" value={patient.phone} />
              <Field label="Email Address" value={patient.email} />
              <Text style={shared.label}>Residential Address</Text>
              {addrLines.length > 0
                ? addrLines.map((l, i) => <Text key={i} style={shared.value}>{l}</Text>)
                : <Text style={shared.value}>Not provided</Text>}
            </View>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={shared.sectionTitle}>Insurance & Billing</Text>
            <View style={shared.card}>
              <Field label="Insurance ID / Medical Record #" value={patient.insurance_id} />
              <Field label="SSN (Last 4)" value={"***-**-" + (patient.ssn_encrypted || '****')} />
              <Field label="Primary Payer" value={patient.primary_payer} />
              <Field label="Medicare ID" value={patient.medicare_id} />
              <Field label="Medicaid ID" value={patient.medicaid_id} />
              {patient.other_insurance ? <Field label="Other Insurance" value={patient.other_insurance + (patient.other_insurance_id ? ' — ' + patient.other_insurance_id : '')} /> : null}
            </View>
          </View>
        </View>

        {/* Demographics */}
        <Text style={shared.sectionTitle}>Demographic Information</Text>
        <View style={shared.card}>
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 6 }}>
            <View style={{ flex: 1 }}><Field label="Preferred Name" value={patient.preferred_name} /></View>
            <View style={{ flex: 1 }}><Field label="Race" value={patient.race} /></View>
            <View style={{ flex: 1 }}><Field label="Religion" value={patient.religion} /></View>
          </View>
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 6 }}>
            <View style={{ flex: 1 }}><Field label="Marital Status" value={patient.marital_status} /></View>
            <View style={{ flex: 1 }}><Field label="Primary Language" value={patient.primary_language} /></View>
            <View style={{ flex: 1 }}><Field label="Occupation" value={patient.occupation} /></View>
          </View>
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 6 }}>
            <View style={{ flex: 1 }}><Field label="Height" value={patient.height} /></View>
            <View style={{ flex: 1 }}><Field label="Weight" value={patient.weight} /></View>
            <View style={{ flex: 1 }}><Field label="Responsible for Self" value={patient.is_responsible_for_self ? 'Yes' : 'No'} /></View>
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <View style={{ flex: 1 }}><Field label="Mother's Maiden Name" value={patient.mothers_maiden_name} /></View>
            <View style={{ flex: 1 }}><Field label="Hospital of Choice" value={patient.hospital_of_choice} /></View>
          </View>
        </View>

        {/* Census Summary */}
        <Text style={shared.sectionTitle}>Census Summary</Text>
        <View style={shared.card}>
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 6 }}>
            <View style={{ flex: 1 }}><Field label="MDS Date" value={safeDate(patient.mds_date)} /></View>
            <View style={{ flex: 1 }}><Field label="Start of Service" value={safeDate(patient.start_of_service)} /></View>
            <View style={{ flex: 1 }}><Field label="Last Annual Physical" value={safeDate(patient.last_annual_physical)} /></View>
          </View>
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 6 }}>
            <View style={{ flex: 1 }}><Field label="Last Semi-Annual Report" value={safeDate(patient.last_semi_annual_report)} /></View>
            <View style={{ flex: 1 }}><Field label="Last Monthly Visit" value={safeDate(patient.last_monthly_visit)} /></View>
          </View>
          <View style={s.compRow}>
            <View style={[s.compBox, s.compRowInline]}>
              <Text style={s.compLabel}>MLOA Days Used</Text>
              <Text style={(patient.mloa_days || 0) > 30 ? s.compValWarn : s.compVal}>{patient.mloa_days || 0}/30</Text>
            </View>
            <View style={[s.compBox, s.compRowInline]}>
              <Text style={s.compLabel}>NMLOA Days Used</Text>
              <Text style={(patient.nmloa_days || 0) > 45 ? s.compValWarn : s.compVal}>{patient.nmloa_days || 0}/45</Text>
            </View>
          </View>
        </View>

        <PDFFooter formName="Patient Summary" />
      </Page>

      {/* ══════════════════════════════════════════════════════════
          PAGE 2 — Advanced Directives, Emergency Contact,
                   Diagnoses, Medications, Providers
      ══════════════════════════════════════════════════════════ */}
      <Page size="A4" style={shared.page}>
        <PDFHeader title={`${title} — Clinical Details`} />

        {/* Advanced Directives */}
        <Text style={shared.sectionTitle}>Advanced Directives</Text>
        <View style={shared.card}>
          <View style={s.dirRow}>
            <Directive label="Living Will" value={patient.living_will} />
            <Directive label="Full Code" value={patient.full_code} />
            <Directive label="DNR" value={patient.dnr} />
            <Directive label="DNI" value={patient.dni} />
            <Directive label="DNH" value={patient.dnh} />
            <Directive label="Organ Donation" value={patient.organ_donation} />
            <Directive label="Autopsy Request" value={patient.autopsy_request} />
            <Directive label="Hospice" value={patient.hospice} />
            <Directive label="Feeding Restrictions" value={patient.feeding_restrictions} />
            <Directive label="Medication Restrictions" value={patient.medication_restrictions} />
            <Directive label="Other Treatment Restrictions" value={patient.other_treatment_restrictions} />
          </View>
        </View>

        {/* Emergency Contact */}
        <Text style={shared.sectionTitle}>Emergency Contact</Text>
        <View style={shared.card}>
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 6 }}>
            <View style={{ flex: 1 }}><Field label="Name" value={patient.emergency_contact_name} /></View>
            <View style={{ flex: 1 }}><Field label="Relationship" value={patient.emergency_contact_relationship} /></View>
            <View style={{ flex: 1 }}><Field label="Phone" value={patient.emergency_contact_phone} /></View>
          </View>
          {(ecAddr.street || ecAddr.city) && (
            <Field label="Address" value={[ecAddr.street, ecAddr.apt, ecAddr.city ? `${ecAddr.city}, ${ecAddr.state || ''} ${ecAddr.zip || ''}`.trim() : null].filter(Boolean).join(', ')} />
          )}
        </View>

        {/* Current Diagnoses */}
        <Text style={shared.sectionTitle}>Current Diagnoses</Text>
        {diagnoses.length > 0 ? (
          <View style={shared.table}>
            <View style={shared.tableHeader}>
              <Text style={[shared.tableHeaderCell, { flex: 2 }]}>Disease / Condition</Text>
              <Text style={[shared.tableHeaderCell, { flex: 1 }]}>ICD-10 Code</Text>
            </View>
            {diagnoses.map((d: any, i: number) => (
              <View key={i} style={shared.tableRow}>
                <Text style={[i % 2 === 0 ? shared.tableCell : shared.tableCellAlt, { flex: 2, fontFamily: 'Helvetica-Bold' }]}>{v(d.disease)}</Text>
                <Text style={[i % 2 === 0 ? shared.tableCell : shared.tableCellAlt, { flex: 1 }]}>{v(d.icd10)}</Text>
              </View>
            ))}
          </View>
        ) : (
          <View style={[shared.card, { marginBottom: 10 }]}>
            <Text style={shared.muted}>No diagnoses recorded.</Text>
          </View>
        )}

        {/* Current Medications */}
        <Text style={shared.sectionTitle}>Current Medications</Text>
        {medications.length > 0 ? (
          <View style={shared.table}>
            <View style={shared.tableHeader}>
              <Text style={[shared.tableHeaderCell, { flex: 2 }]}>Medicine</Text>
              <Text style={[shared.tableHeaderCell, { flex: 1 }]}>Dosage</Text>
              <Text style={[shared.tableHeaderCell, { flex: 1 }]}>Schedule</Text>
            </View>
            {medications.map((m: any, i: number) => (
              <View key={i} style={shared.tableRow}>
                <Text style={[i % 2 === 0 ? shared.tableCell : shared.tableCellAlt, { flex: 2, fontFamily: 'Helvetica-Bold' }]}>{v(m.medicine)}</Text>
                <Text style={[i % 2 === 0 ? shared.tableCell : shared.tableCellAlt, { flex: 1 }]}>{v(m.dosage)}</Text>
                <Text style={[i % 2 === 0 ? shared.tableCell : shared.tableCellAlt, { flex: 1 }]}>{v(m.schedule)}</Text>
              </View>
            ))}
          </View>
        ) : (
          <View style={[shared.card, { marginBottom: 10 }]}>
            <Text style={shared.muted}>No medications recorded.</Text>
          </View>
        )}

        {/* Other Providers */}
        {patient.other_provider_ids && (
          <>
            <Text style={shared.sectionTitle}>Other Providers</Text>
            <View style={[shared.card, { marginBottom: 10 }]}>
              <Text style={shared.value}>{patient.other_provider_ids}</Text>
            </View>
          </>
        )}

        <PDFFooter formName="Patient Summary" />
      </Page>

      {/* ══════════════════════════════════════════════════════════
          PAGE 3 — Clinical Visit History
      ══════════════════════════════════════════════════════════ */}
      <Page size="A4" style={shared.page}>
        <PDFHeader title={`${title} — Visit History`} />

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <Text style={[shared.sectionTitle, { borderBottomWidth: 0, marginBottom: 0 }]}>Clinical Visit History</Text>
          <Text style={shared.muted}>{visits.length} total visit{visits.length !== 1 ? 's' : ''}</Text>
        </View>

        {visits.length > 0 ? (
          <View style={shared.table}>
            <View style={s.visitHeader}>
              <Text style={[s.colNum, s.thText]}>#</Text>
              <Text style={[s.colDate, s.thText]}>Scheduled Date</Text>
              <Text style={[s.colType, s.thText]}>Service Type</Text>
              <Text style={[s.colStatus, s.thText]}>Status</Text>
            </View>
            {visits.map((visit: any, i: number) => (
              <View key={visit.id || i} style={i % 2 === 0 ? s.visitRow : s.visitRowAlt}>
                <Text style={[s.colNum, { fontSize: 8, color: BRAND.zinc400, fontFamily: 'Helvetica-Bold', paddingHorizontal: 4 }]}>{i + 1}</Text>
                <Text style={[s.colDate, { fontSize: 8, fontFamily: 'Helvetica-Bold', color: BRAND.zinc700, paddingHorizontal: 4 }]}>
                  {visit.scheduled_at ? safeDate(visit.scheduled_at) : 'N/A'}
                </Text>
                <Text style={[s.colType, { fontSize: 8, fontFamily: 'Helvetica-Bold', color: BRAND.blue, textTransform: 'uppercase', letterSpacing: 0.5, paddingHorizontal: 4 }]}>
                  {v(visit.type)}
                </Text>
                <View style={[s.colStatus, { paddingHorizontal: 4 }]}>
                  <View style={visit.status === 'completed' ? s.visitBadgeGreen : s.visitBadgeGray}>
                    <Text style={visit.status === 'completed' ? s.visitBadgeGreenText : s.visitBadgeGrayText}>{v(visit.status)}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={s.emptyState}>
            <Text style={[shared.muted, { fontStyle: 'italic' }]}>No clinical visits recorded for this patient.</Text>
          </View>
        )}

        <PDFFooter formName="Patient Summary" />
      </Page>

    </Document>
  );
};