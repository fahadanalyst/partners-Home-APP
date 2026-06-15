import React from 'react';
import { View, Text, Image, StyleSheet } from '@react-pdf/renderer';
import { BasePDFTemplate, shared, BRAND } from './BasePDFTemplate';

const s = StyleSheet.create({
  textArea: { backgroundColor: BRAND.zinc50, borderWidth: 1, borderColor: BRAND.zinc100, borderStyle: 'solid', borderRadius: 4, padding: 10, minHeight: 200, marginBottom: 10 },
  sigLine: { width: 200, height: 50, borderBottomWidth: 1, borderBottomColor: BRAND.zinc400, borderBottomStyle: 'solid', marginBottom: 4 },
  sigImg: { width: 200, height: 50, objectFit: 'contain', marginBottom: 4 },
});

export const AdmissionAssessmentTemplate: React.FC<{ data: any }> = ({ data }) => {
  const { date, patientName, dob, assessment, signature } = data;
  return (
    <BasePDFTemplate title="Admission Assessment" date={date}>
      <Text style={shared.sectionTitle}>Patient Information</Text>
      <View style={shared.card}>
        <View style={shared.row2}>
          <View style={shared.col2}>
            <Text style={shared.label}>Patient Name</Text>
            <Text style={shared.valueBold}>{patientName || 'N/A'}</Text>
          </View>
          <View style={shared.col2}>
            <Text style={shared.label}>Date of Birth</Text>
            <Text style={shared.value}>{dob || 'N/A'}</Text>
          </View>
        </View>
      </View>

      <Text style={shared.sectionTitle}>Assessment Details</Text>
      <View style={s.textArea}>
        <Text style={shared.value}>{assessment || 'No assessment details provided.'}</Text>
      </View>

      {signature && (
        <View style={{ marginTop: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: BRAND.zinc100, borderTopStyle: 'solid' }}>
          <Text style={shared.label}>Clinician Signature</Text>
          <Image src={signature} style={s.sigImg} />
          <View style={s.sigLine} />
          <Text style={shared.muted}>Signed on: {date || 'N/A'}</Text>
        </View>
      )}
    </BasePDFTemplate>
  );
};
