import React from 'react';
import { View, Text, Image, StyleSheet } from '@react-pdf/renderer';
import { BasePDFTemplate, shared, BRAND } from './BasePDFTemplate';

const s = StyleSheet.create({
  ordersBox: { backgroundColor: BRAND.zinc50, borderWidth: 1, borderColor: BRAND.zinc100, borderStyle: 'solid', borderRadius: 4, padding: 10, minHeight: 120, marginBottom: 10 },
  sigPanel: { borderWidth: 1, borderColor: BRAND.zinc100, borderStyle: 'solid', borderRadius: 4, padding: 10, alignItems: 'center' },
  sigImg: { width: 160, height: 48, objectFit: 'contain', marginBottom: 4 },
  sigLine: { width: 160, height: 48, borderBottomWidth: 1, borderBottomColor: BRAND.zinc300, borderBottomStyle: 'solid', marginBottom: 4 },
});

export const PhysicianOrdersTemplate: React.FC<{ data: any }> = ({ data }) => {
  const { patient = {}, diagnosis = {}, medications = [], orders, physician = {} } = data;
  return (
    <BasePDFTemplate title="Physician Orders / Plan of Care" date={physician.date}>
      {/* Patient & Diagnosis */}
      <View style={shared.row2}>
        <View style={shared.col2}>
          <Text style={shared.sectionTitle}>Patient Information</Text>
          <View style={shared.card}>
            <Text style={shared.label}>Patient Name</Text>
            <Text style={[shared.valueBold, { marginBottom: 6 }]}>{patient.name || 'N/A'}</Text>
            <View style={shared.row2}>
              <View style={shared.col2}>
                <Text style={shared.label}>Date of Birth</Text>
                <Text style={shared.value}>{patient.dob || 'N/A'}</Text>
              </View>
              <View style={shared.col2}>
                <Text style={shared.label}>M.R. #</Text>
                <Text style={shared.value}>{patient.mrNumber || 'N/A'}</Text>
              </View>
            </View>
          </View>
        </View>
        <View style={shared.col2}>
          <Text style={shared.sectionTitle}>Diagnosis</Text>
          <View style={shared.card}>
            <Text style={shared.label}>Primary Diagnosis</Text>
            <Text style={[shared.value, { marginBottom: 6 }]}>{diagnosis.primary || 'N/A'}</Text>
            <Text style={shared.label}>Secondary Diagnosis</Text>
            <Text style={shared.value}>{diagnosis.secondary || 'N/A'}</Text>
          </View>
        </View>
      </View>

      {/* Medications Table */}
      <Text style={shared.sectionTitle}>Medications</Text>
      <View style={shared.table}>
        <View style={shared.tableHeader}>
          <Text style={[shared.tableHeaderCell, { flex: 2 }]}>Medication Name</Text>
          <Text style={[shared.tableHeaderCell, { flex: 1 }]}>Dose</Text>
          <Text style={[shared.tableHeaderCell, { flex: 1 }]}>Frequency</Text>
          <Text style={[shared.tableHeaderCell, { flex: 1 }]}>Route</Text>
        </View>
        {medications.length > 0 ? medications.map((med: any, idx: number) => (
          <View key={idx} style={shared.tableRow}>
            <Text style={[idx % 2 === 0 ? shared.tableCell : shared.tableCellAlt, { flex: 2, fontFamily: 'Helvetica-Bold' }]}>{med.name}</Text>
            <Text style={[idx % 2 === 0 ? shared.tableCell : shared.tableCellAlt, { flex: 1 }]}>{med.dose}</Text>
            <Text style={[idx % 2 === 0 ? shared.tableCell : shared.tableCellAlt, { flex: 1 }]}>{med.frequency}</Text>
            <Text style={[idx % 2 === 0 ? shared.tableCell : shared.tableCellAlt, { flex: 1 }]}>{med.route}</Text>
          </View>
        )) : (
          <View style={shared.tableRow}>
            <Text style={[shared.tableCell, { flex: 1, textAlign: 'center', color: BRAND.zinc400 }]}>No medications listed</Text>
          </View>
        )}
      </View>

      {/* Orders */}
      <Text style={shared.sectionTitle}>Orders / Plan of Care</Text>
      <View style={s.ordersBox}>
        <Text style={shared.value}>{orders || 'No specific orders provided.'}</Text>
      </View>

      {/* Physician Signature */}
      <View style={[shared.row2, { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: BRAND.zinc200, borderTopStyle: 'solid' }]}>
        <View style={shared.col2}>
          <View style={s.sigPanel}>
            {physician.signature ? <Image src={physician.signature} style={s.sigImg} /> : <View style={s.sigLine} />}
            <Text style={shared.label}>Physician Signature</Text>
            <Text style={shared.muted}>Date: {physician.date || 'N/A'}</Text>
          </View>
        </View>
        <View style={shared.col2}>
          <Text style={shared.label}>Physician Name</Text>
          <Text style={[shared.valueBold, { marginBottom: 8 }]}>{physician.name || 'N/A'}</Text>
          <View style={shared.row2}>
            <View style={shared.col2}>
              <Text style={shared.label}>NPI #</Text>
              <Text style={shared.value}>{physician.npi || 'N/A'}</Text>
            </View>
            <View style={shared.col2}>
              <Text style={shared.label}>Phone</Text>
              <Text style={shared.value}>{physician.phone || 'N/A'}</Text>
            </View>
          </View>
        </View>
      </View>
    </BasePDFTemplate>
  );
};
