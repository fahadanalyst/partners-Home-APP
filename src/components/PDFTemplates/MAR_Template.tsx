import React from 'react';
import { Document, Page, View, Text, Image, StyleSheet } from '@react-pdf/renderer';
import { PDFHeader, PDFFooter, shared, BRAND } from './BasePDFTemplate';

// MAR uses landscape for the wide day-grid table
const s = StyleSheet.create({
  page: { ...shared.page, size: 'A4' },
  headerBox: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: BRAND.zinc50, borderWidth: 1, borderColor: BRAND.zinc200,
    borderStyle: 'solid', borderRadius: 4, padding: 10, marginBottom: 10,
  },
  avatar: {
    width: 36, height: 36, borderRadius: 4, backgroundColor: BRAND.blue,
    justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { color: BRAND.white, fontSize: 14, fontFamily: 'Helvetica-Bold' },
  patientName: { fontSize: 14, fontFamily: 'Helvetica-Bold', color: BRAND.zinc900 },
  allergies: { fontSize: 8, color: '#dc2626', fontFamily: 'Helvetica-Bold', marginTop: 2 },
  // The MAR grid
  gridRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: BRAND.zinc200, borderBottomStyle: 'solid', minHeight: 20 },
  gridHeader: { backgroundColor: BRAND.blue, flexDirection: 'row' },
  medCell: { width: 100, padding: 3, borderRightWidth: 1, borderRightColor: BRAND.zinc200, borderRightStyle: 'solid' },
  timeCell: { width: 30, padding: 3, borderRightWidth: 1, borderRightColor: BRAND.zinc200, borderRightStyle: 'solid', textAlign: 'center' },
  dayCell: { flex: 1, padding: 2, borderRightWidth: 1, borderRightColor: BRAND.zinc200, borderRightStyle: 'solid', textAlign: 'center', minWidth: 14 },
  cellText: { fontSize: 6, color: BRAND.zinc700 },
  headerCellText: { fontSize: 6, color: BRAND.white, fontFamily: 'Helvetica-Bold' },
  sigRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginTop: 8 },
  sigEntry: { flexDirection: 'row', alignItems: 'center', gap: 4, borderBottomWidth: 1, borderBottomColor: BRAND.zinc100, borderBottomStyle: 'solid', paddingBottom: 2, width: '30%' },
  initials: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: BRAND.blue, width: 20 },
  sigImg: { width: 40, height: 16, objectFit: 'contain' },
});

const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);

export const MAR_Template: React.FC<{ data: any }> = ({ data }) => {
  const { month, year, patient = {}, medications = [], staffSignatures = [] } = data;
  const title = `MAR: ${patient.name || 'Patient'}`;
  const dateStr = `${month || ''} ${year || ''}`;

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={shared.page}>
        <PDFHeader title={title} date={dateStr} />

        {/* Patient Header */}
        <View style={s.headerBox}>
          <View style={s.avatar}>
            <Text style={s.avatarText}>{(patient.name || 'P')[0]}</Text>
          </View>
          <View>
            <Text style={s.patientName}>{patient.name || 'Patient'}</Text>
            <Text style={s.allergies}>Allergies: {patient.allergies || 'NKA'}</Text>
          </View>
          <View style={{ marginLeft: 20 }}>
            <Text style={shared.label}>Month / Year</Text>
            <Text style={shared.valueBold}>{dateStr}</Text>
          </View>
        </View>

        {/* MAR Grid */}
        <View style={[shared.table, { marginBottom: 10 }]}>
          {/* Header Row */}
          <View style={s.gridHeader}>
            <Text style={[s.medCell, s.headerCellText]}>Medication / Dose / Route / Freq</Text>
            <Text style={[s.timeCell, s.headerCellText]}>Time</Text>
            {DAYS.map(d => (
              <Text key={d} style={[s.dayCell, s.headerCellText]}>{d}</Text>
            ))}
          </View>
          {/* Medication Rows */}
          {(medications.length > 0 ? medications : Array(8).fill({})).map((med: any, idx: number) => (
            <View key={idx} style={[s.gridRow, { backgroundColor: idx % 2 === 0 ? BRAND.white : BRAND.zinc50 }]}>
              <View style={s.medCell}>
                <Text style={[s.cellText, { fontFamily: 'Helvetica-Bold' }]}>{med.name || ''}</Text>
                {med.name && <Text style={[s.cellText, { color: BRAND.zinc500 }]}>{med.dose} {med.route} {med.frequency}</Text>}
              </View>
              <Text style={[s.timeCell, s.cellText]}>{med.times || ''}</Text>
              {DAYS.map(d => (
                <Text key={d} style={[s.dayCell, s.cellText, { color: BRAND.blue }]}>
                  {med.administrations?.[d] || ''}
                </Text>
              ))}
            </View>
          ))}
        </View>

        {/* Legend & Signatures */}
        <View style={shared.row2}>
          <View style={shared.col2}>
            <Text style={shared.label}>Initials Legend</Text>
            <View style={s.sigRow}>
              {(staffSignatures as any[]).filter(sig => sig.initials).map((sig, i) => (
                <View key={i} style={s.sigEntry}>
                  <Text style={s.initials}>{sig.initials}</Text>
                  <View>
                    <Text style={[s.cellText, { color: BRAND.zinc600 }]}>{sig.name}</Text>
                    {sig.signature && <Image src={sig.signature} style={s.sigImg} />}
                  </View>
                </View>
              ))}
            </View>
          </View>
          <View style={shared.col2}>
            <Text style={shared.label}>Notes / Exceptions</Text>
            <View style={{ height: 50, borderBottomWidth: 1, borderBottomColor: BRAND.zinc200, borderBottomStyle: 'dashed' }} />
          </View>
        </View>

        <PDFFooter formName="Medication Administration Record" />
      </Page>
    </Document>
  );
};
