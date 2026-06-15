import React from 'react';
import { View, Text, StyleSheet } from '@react-pdf/renderer';
import { BasePDFTemplate, shared, BRAND } from './BasePDFTemplate';

const s = StyleSheet.create({
  tableWrapper: {
    width: '100%',
    borderWidth: 1,
    borderColor: BRAND.zinc200,
    borderStyle: 'solid',
    borderRadius: 3,
    marginBottom: 10,
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
    backgroundColor: BRAND.blue,
    paddingVertical: 5,
    paddingHorizontal: 4,
  },
  dataRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: BRAND.zinc100,
    borderBottomStyle: 'solid',
    paddingVertical: 5,
    paddingHorizontal: 4,
    minHeight: 22,
  },
  dataRowAlt: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: BRAND.zinc100,
    borderBottomStyle: 'solid',
    paddingVertical: 5,
    paddingHorizontal: 4,
    minHeight: 22,
    backgroundColor: BRAND.zinc50,
  },
  // Column widths
  colMed:   { flex: 3, fontSize: 8, color: BRAND.zinc900, fontFamily: 'Helvetica', paddingRight: 4 },
  colDose:  { flex: 1.5, fontSize: 8, color: BRAND.zinc900, fontFamily: 'Helvetica', paddingRight: 4 },
  colNum:   { flex: 1, fontSize: 8, color: BRAND.zinc900, fontFamily: 'Helvetica', paddingRight: 4 },
  colRoute: { flex: 1.5, fontSize: 8, color: BRAND.zinc900, fontFamily: 'Helvetica', paddingRight: 4 },
  colFreq:  { flex: 1.5, fontSize: 8, color: BRAND.zinc900, fontFamily: 'Helvetica', paddingRight: 4 },
  colDate:  { flex: 1.5, fontSize: 8, color: BRAND.zinc900, fontFamily: 'Helvetica', paddingRight: 4 },

  colMedH:   { flex: 3, fontSize: 7, color: BRAND.white, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase', letterSpacing: 0.5, paddingRight: 4 },
  colDoseH:  { flex: 1.5, fontSize: 7, color: BRAND.white, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase', letterSpacing: 0.5, paddingRight: 4 },
  colNumH:   { flex: 1, fontSize: 7, color: BRAND.white, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase', letterSpacing: 0.5, paddingRight: 4 },
  colRouteH: { flex: 1.5, fontSize: 7, color: BRAND.white, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase', letterSpacing: 0.5, paddingRight: 4 },
  colFreqH:  { flex: 1.5, fontSize: 7, color: BRAND.white, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase', letterSpacing: 0.5, paddingRight: 4 },
  colDateH:  { flex: 1.5, fontSize: 7, color: BRAND.white, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase', letterSpacing: 0.5, paddingRight: 4 },

  emptyRow: {
    padding: 12,
    alignItems: 'center',
  },
  reviewBox: {
    borderWidth: 1,
    borderColor: BRAND.zinc200,
    borderStyle: 'solid',
    borderRadius: 3,
    padding: 8,
    backgroundColor: BRAND.zinc50,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  totalBadge: {
    backgroundColor: BRAND.blue,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginLeft: 8,
  },
  totalBadgeText: {
    fontSize: 8,
    color: BRAND.white,
    fontFamily: 'Helvetica-Bold',
  },
});

export const MedicationListTemplate: React.FC<{ data: any }> = ({ data }) => {
  const d = data || {};
  const meds: any[] = d.medications || [];
  const activeMeds = meds.filter(m => m.medication?.trim());

  return (
    <BasePDFTemplate title="Client Medication List">

      {/* Client Info */}
      <Text style={shared.sectionTitle}>Client Information</Text>
      <View style={shared.card}>
        <View style={shared.row3}>
          <View style={shared.col3}>
            <Text style={shared.label}>Client Name</Text>
            <Text style={shared.valueBold}>{d.clientName || '—'}</Text>
          </View>
          <View style={shared.col3}>
            <Text style={shared.label}>PCP Name</Text>
            <Text style={shared.value}>{d.pcpName || '—'}</Text>
          </View>
          <View style={shared.col3}>
            <Text style={shared.label}>PCP Phone Number</Text>
            <Text style={shared.value}>{d.pcpNumber || '—'}</Text>
          </View>
        </View>
      </View>

      {/* Medication Count */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
        <Text style={shared.sectionTitle}>Medications</Text>
        <View style={[s.totalBadge, { marginLeft: 8, marginBottom: 4 }]}>
          <Text style={s.totalBadgeText}>{activeMeds.length} Total</Text>
        </View>
      </View>

      {/* Table */}
      <View style={s.tableWrapper}>
        {/* Header */}
        <View style={s.headerRow}>
          <Text style={s.colMedH}>Medication</Text>
          <Text style={s.colDoseH}>Dose</Text>
          <Text style={s.colNumH}>No.</Text>
          <Text style={s.colRouteH}>Route</Text>
          <Text style={s.colFreqH}>Frequency</Text>
          <Text style={s.colDateH}>Start Date</Text>
          <Text style={s.colDateH}>Stop Date</Text>
        </View>

        {/* Rows */}
        {activeMeds.length > 0 ? (
          activeMeds.map((med: any, idx: number) => (
            <View key={med.id || idx} style={idx % 2 === 0 ? s.dataRow : s.dataRowAlt}>
              <Text style={[s.colMed, { fontFamily: 'Helvetica-Bold' }]}>{med.medication || '—'}</Text>
              <Text style={s.colDose}>{med.dose || '—'}</Text>
              <Text style={s.colNum}>{med.number || '—'}</Text>
              <Text style={s.colRoute}>{med.route || '—'}</Text>
              <Text style={s.colFreq}>{med.frequency || '—'}</Text>
              <Text style={s.colDate}>{med.startDate || '—'}</Text>
              <Text style={s.colDate}>{med.stopDate || '—'}</Text>
            </View>
          ))
        ) : (
          <View style={s.emptyRow}>
            <Text style={[shared.muted, { textAlign: 'center' }]}>No medications recorded</Text>
          </View>
        )}
      </View>

      {/* Review confirmation */}
      <View style={s.reviewBox}>
        <Text style={shared.label}>Reviewed with Client every visit (initials / date):</Text>
        <Text style={[shared.value, { marginLeft: 8, fontFamily: 'Helvetica-Bold' }]}>
          {d.reviewedInitialsDate || '___________________________'}
        </Text>
      </View>

      {/* Summary note */}
      <View style={[shared.card, { marginTop: 10 }]}>
        <Text style={[shared.muted, { fontStyle: 'italic' }]}>
          This medication list was reviewed and verified at Partners Home and Nursing Services.
          Any changes to medications must be authorized by the Primary Care Provider.
          This document constitutes a legal medical record.
        </Text>
      </View>

    </BasePDFTemplate>
  );
};