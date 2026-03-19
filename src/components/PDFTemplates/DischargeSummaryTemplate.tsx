import React from 'react';
import { View, Text, Image, StyleSheet } from '@react-pdf/renderer';
import { BasePDFTemplate, shared, BRAND } from './BasePDFTemplate';

const s = StyleSheet.create({
  textArea: { backgroundColor: BRAND.zinc50, borderWidth: 1, borderColor: BRAND.zinc100, borderStyle: 'solid', borderRadius: 4, padding: 10, minHeight: 200, marginBottom: 10 },
  sigImg: { width: 200, height: 50, objectFit: 'contain', marginBottom: 4 },
  sigLine: { width: 200, height: 50, borderBottomWidth: 1, borderBottomColor: BRAND.zinc400, borderBottomStyle: 'solid', marginBottom: 4 },
});

export const DischargeSummaryTemplate: React.FC<{ data: any }> = ({ data }) => {
  const { date, patientName, dischargeReason, summary, signature } = data;
  return (
    <BasePDFTemplate title="Discharge Summary" date={date}>
      <Text style={shared.sectionTitle}>Patient Information</Text>
      <View style={shared.card}>
        <View style={shared.row2}>
          <View style={shared.col2}>
            <Text style={shared.label}>Patient Name</Text>
            <Text style={shared.valueBold}>{patientName || 'N/A'}</Text>
          </View>
          <View style={shared.col2}>
            <Text style={shared.label}>Discharge Date</Text>
            <Text style={shared.value}>{date || 'N/A'}</Text>
          </View>
        </View>
      </View>

      <Text style={shared.sectionTitle}>Reason for Discharge</Text>
      <View style={[shared.card, { marginBottom: 10 }]}>
        <Text style={shared.value}>{dischargeReason || 'N/A'}</Text>
      </View>

      <Text style={shared.sectionTitle}>Summary of Care</Text>
      <View style={s.textArea}>
        <Text style={shared.value}>{summary || 'No summary provided.'}</Text>
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
