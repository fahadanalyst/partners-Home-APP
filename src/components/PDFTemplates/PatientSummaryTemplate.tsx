import React from 'react';
import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer';
import { PDFHeader, PDFFooter, shared, BRAND } from './BasePDFTemplate';

// PatientSummary is a multi-page document: Page 1 = demographics, Page 2+ = visit history
// So we use Document/Page directly instead of the BasePDFTemplate wrapper.

const s = StyleSheet.create({
  patientHero: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: 'rgba(0,86,150,0.04)', borderWidth: 2,
    borderColor: 'rgba(0,86,150,0.12)', borderStyle: 'solid',
    borderRadius: 8, padding: 16, marginBottom: 14,
  },
  avatar: {
    width: 52, height: 52, borderRadius: 8,
    backgroundColor: BRAND.blue, justifyContent: 'center', alignItems: 'center', flexShrink: 0,
  },
  avatarText: { color: BRAND.white, fontSize: 20, fontFamily: 'Helvetica-Bold' },
  heroName: { fontSize: 18, fontFamily: 'Helvetica-Bold', color: BRAND.zinc900 },
  heroMeta: { flexDirection: 'row', gap: 20, marginTop: 4 },
  heroMetaLabel: { fontSize: 7, color: BRAND.zinc400, textTransform: 'uppercase', letterSpacing: 0.5 },
  heroMetaVal: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: BRAND.zinc700 },
  statusBadge: {
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20,
    backgroundColor: '#dcfce7',
  },
  statusText: { fontSize: 7, fontFamily: 'Helvetica-Bold', color: '#15803d', textTransform: 'uppercase', letterSpacing: 1 },
  statusBadgeInactive: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, backgroundColor: BRAND.zinc100 },
  statusTextInactive: { fontSize: 7, fontFamily: 'Helvetica-Bold', color: BRAND.zinc500, textTransform: 'uppercase', letterSpacing: 1 },
  infoPanel: {
    borderWidth: 1, borderColor: BRAND.zinc100, borderStyle: 'solid',
    borderRadius: 6, padding: 12, backgroundColor: BRAND.white,
  },
  complianceBox: {
    flex: 1, backgroundColor: BRAND.zinc50, borderWidth: 1,
    borderColor: BRAND.zinc100, borderStyle: 'solid', borderRadius: 6, padding: 10,
  },
  complianceLabel: { fontSize: 7, fontFamily: 'Helvetica-Bold', color: BRAND.zinc400, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  complianceVal: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: BRAND.zinc900 },
  complianceValWarning: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: '#dc2626' },
  // Visit history table
  visitTableHeader: {
    flexDirection: 'row', backgroundColor: BRAND.zinc50,
    borderBottomWidth: 1, borderBottomColor: BRAND.zinc200, borderBottomStyle: 'solid',
    paddingVertical: 6,
  },
  visitRow: {
    flexDirection: 'row', borderBottomWidth: 1,
    borderBottomColor: BRAND.zinc100, borderBottomStyle: 'solid', paddingVertical: 7,
  },
  visitRowAlt: {
    flexDirection: 'row', borderBottomWidth: 1,
    borderBottomColor: BRAND.zinc100, borderBottomStyle: 'solid', paddingVertical: 7,
    backgroundColor: BRAND.zinc50,
  },
  colNum: { width: 28, paddingHorizontal: 6 },
  colDate: { width: 90, paddingHorizontal: 6 },
  colType: { flex: 1, paddingHorizontal: 6 },
  colStatus: { width: 80, paddingHorizontal: 6, alignItems: 'flex-end' },
  thText: { fontSize: 7, fontFamily: 'Helvetica-Bold', color: BRAND.zinc500, textTransform: 'uppercase', letterSpacing: 0.5 },
  tdNum: { fontSize: 8, color: BRAND.zinc400, fontFamily: 'Helvetica-Bold' },
  tdDate: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: BRAND.zinc700 },
  tdType: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: BRAND.blue, textTransform: 'uppercase', letterSpacing: 0.5 },
  badgeCompleted: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10, backgroundColor: '#dcfce7' },
  badgeCompletedText: { fontSize: 7, fontFamily: 'Helvetica-Bold', color: '#15803d', textTransform: 'uppercase' },
  badgeOther: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10, backgroundColor: BRAND.zinc100 },
  badgeOtherText: { fontSize: 7, fontFamily: 'Helvetica-Bold', color: BRAND.zinc500, textTransform: 'uppercase' },
  emptyState: {
    padding: 30, alignItems: 'center',
    borderWidth: 2, borderColor: BRAND.zinc100, borderStyle: 'dashed', borderRadius: 8,
    marginTop: 12,
  },
});

const safeDate = (val: any) => {
  if (!val || val === 'Never') return 'Never';
  const d = new Date(val);
  if (isNaN(d.getTime())) return 'Never';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

export const PatientSummaryTemplate: React.FC<{ data: any }> = ({ data }) => {
  const { patient = {}, visits = [] } = data;
  const fullName = `${patient.last_name || 'Patient'}, ${patient.first_name || ''}`;
  const title = `Patient Summary: ${fullName}`;
  const isActive = patient.status === 'active';

  // Address string
  const addrLines = [patient.street, patient.apt, patient.city && `${patient.city}, ${patient.state} ${patient.zip}`].filter(Boolean);

  return (
    <Document>
      {/* ─── Page 1: Demographics & Compliance ─────────────── */}
      <Page size="A4" style={shared.page}>
        <PDFHeader title={title} />

        {/* Patient Hero */}
        <View style={s.patientHero}>
          <View style={s.avatar}>
            <Text style={s.avatarText}>
              {(patient.first_name?.[0] || 'P')}{(patient.last_name?.[0] || 'T')}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
              <Text style={s.heroName}>{fullName}</Text>
              <View style={isActive ? s.statusBadge : s.statusBadgeInactive}>
                <Text style={isActive ? s.statusText : s.statusTextInactive}>{patient.status || 'Active'}</Text>
              </View>
            </View>
            <View style={s.heroMeta}>
              {[['DOB', safeDate(patient.dob)], ['Gender', patient.gender || 'N/A'], ['ID', patient.id?.slice(0, 8) || 'N/A']].map(([lbl, val]) => (
                <View key={lbl}>
                  <Text style={s.heroMetaLabel}>{lbl}</Text>
                  <Text style={s.heroMetaVal}>{val}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Contact & Insurance */}
        <View style={[shared.row2, { marginBottom: 12 }]}>
          <View style={[shared.col2]}>
            <Text style={shared.sectionTitle}>Contact Information</Text>
            <View style={[s.infoPanel, { flex: 1 }]}>
              <Text style={shared.label}>Primary Phone</Text>
              <Text style={[shared.valueBold, { marginBottom: 8 }]}>{patient.phone || 'Not provided'}</Text>
              <Text style={shared.label}>Email Address</Text>
              <Text style={[shared.valueBold, { marginBottom: 8 }]}>{patient.email || 'Not provided'}</Text>
              <Text style={shared.label}>Residential Address</Text>
              {addrLines.length > 0
                ? addrLines.map((line, i) => <Text key={i} style={shared.valueBold}>{line}</Text>)
                : <Text style={shared.valueBold}>Not provided</Text>
              }
            </View>
          </View>
          <View style={shared.col2}>
            <Text style={shared.sectionTitle}>Insurance & Billing</Text>
            <View style={[s.infoPanel, { flex: 1 }]}>
              <Text style={shared.label}>Insurance ID</Text>
              <Text style={[shared.valueBold, { marginBottom: 8 }]}>{patient.insurance_id || 'Not provided'}</Text>
              <Text style={shared.label}>SSN (Last 4)</Text>
              <Text style={[shared.valueBold, { marginBottom: 8 }]}>***-**-{patient.ssn_encrypted || '****'}</Text>
              <Text style={shared.label}>Primary Payer</Text>
              <Text style={shared.valueBold}>{patient.primary_payer || 'N/A'}</Text>
            </View>
          </View>
        </View>

        {/* Compliance Summary */}
        <Text style={shared.sectionTitle}>Compliance & Tracking</Text>
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
          {[
            ['Annual Physical', patient.last_annual_physical],
            ['Health Status Report', patient.last_semi_annual_report],
            ['Monthly Visit', patient.last_monthly_visit],
          ].map(([label, val]) => (
            <View key={label as string} style={s.complianceBox}>
              <Text style={s.complianceLabel}>{label}</Text>
              <Text style={s.complianceVal}>{safeDate(val)}</Text>
            </View>
          ))}
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <View style={[s.complianceBox, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
            <Text style={s.complianceLabel}>MLOA Days Used</Text>
            <Text style={(patient.mloa_days || 0) > 30 ? s.complianceValWarning : s.complianceVal}>
              {patient.mloa_days || 0}/30
            </Text>
          </View>
          <View style={[s.complianceBox, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
            <Text style={s.complianceLabel}>NMLOA Days Used</Text>
            <Text style={(patient.nmloa_days || 0) > 45 ? s.complianceValWarning : s.complianceVal}>
              {patient.nmloa_days || 0}/45
            </Text>
          </View>
        </View>

        <PDFFooter formName="Patient Summary" />
      </Page>

      {/* ─── Page 2: Clinical Visit History ─────────────────── */}
      <Page size="A4" style={shared.page}>
        <PDFHeader title={`${title} — Visit History`} />

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <Text style={[shared.sectionTitle, { borderBottomWidth: 0, marginBottom: 0 }]}>Clinical Visit History</Text>
          <Text style={shared.muted}>{visits.length} total visit{visits.length !== 1 ? 's' : ''}</Text>
        </View>

        {visits && visits.length > 0 ? (
          <View style={[shared.table]}>
            {/* Table Header */}
            <View style={s.visitTableHeader}>
              <Text style={[s.colNum, s.thText]}>#</Text>
              <Text style={[s.colDate, s.thText]}>Scheduled Date</Text>
              <Text style={[s.colType, s.thText]}>Service Type</Text>
              <Text style={[s.colStatus, s.thText]}>Status</Text>
            </View>
            {/* Visit Rows */}
            {visits.map((visit: any, index: number) => (
              <View key={visit.id || index} style={index % 2 === 0 ? s.visitRow : s.visitRowAlt}>
                <Text style={[s.colNum, s.tdNum]}>{index + 1}</Text>
                <Text style={[s.colDate, s.tdDate]}>
                  {visit.scheduled_at ? safeDate(visit.scheduled_at) : 'N/A'}
                </Text>
                <Text style={[s.colType, s.tdType]}>{visit.type || 'N/A'}</Text>
                <View style={s.colStatus}>
                  <View style={visit.status === 'completed' ? s.badgeCompleted : s.badgeOther}>
                    <Text style={visit.status === 'completed' ? s.badgeCompletedText : s.badgeOtherText}>
                      {visit.status || 'N/A'}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={s.emptyState}>
            <Text style={[shared.muted, { fontStyle: 'italic' }]}>No clinical visits recorded in the system for this patient.</Text>
          </View>
        )}

        <PDFFooter formName="Patient Summary" />
      </Page>
    </Document>
  );
};
