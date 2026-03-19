import React from 'react';
import { View, Text, Image, StyleSheet } from '@react-pdf/renderer';
import { BasePDFTemplate, shared, BRAND } from './BasePDFTemplate';

const s = StyleSheet.create({
  soapBox: { backgroundColor: BRAND.zinc50, borderWidth: 1, borderColor: BRAND.zinc100, borderStyle: 'solid', borderRadius: 4, padding: 8, marginBottom: 8 },
  narrativeBox: { backgroundColor: BRAND.white, borderWidth: 1, borderColor: BRAND.zinc200, borderStyle: 'solid', borderRadius: 4, padding: 10, minHeight: 120, marginBottom: 10 },
  sigBox: { width: 200, alignItems: 'center' },
  sigImg: { width: 180, height: 48, objectFit: 'contain', marginBottom: 4 },
  sigLine: { width: 180, borderBottomWidth: 1, borderBottomColor: BRAND.zinc900, borderBottomStyle: 'solid', height: 48, marginBottom: 4 },
});

export const ClinicalNoteTemplate: React.FC<{ data: any }> = ({ data }) => {
  const { date, time, patient = {}, noteType, soap = {}, narrative, signature } = data;
  return (
    <BasePDFTemplate title="Clinical Note" date={date}>
      {/* Header Metadata */}
      <View style={[shared.card, { marginBottom: 12 }]}>
        <View style={shared.row3}>
          <View style={shared.col3}>
            <Text style={shared.label}>Patient Name</Text>
            <Text style={shared.valueBold}>{patient.name || 'N/A'}</Text>
          </View>
          <View style={shared.col3}>
            <Text style={shared.label}>Note Type</Text>
            <Text style={[shared.valueBold, { color: BRAND.blue }]}>{noteType || 'N/A'}</Text>
          </View>
          <View style={shared.col3}>
            <Text style={shared.label}>Time of Note</Text>
            <Text style={shared.value}>{time || 'N/A'}</Text>
          </View>
        </View>
      </View>

      {/* SOAP */}
      {(soap.subjective || soap.objective || soap.assessment || soap.plan) && (
        <>
          <Text style={shared.sectionTitle}>SOAP Documentation</Text>
          {[['Subjective', soap.subjective], ['Objective', soap.objective], ['Assessment', soap.assessment], ['Plan', soap.plan]]
            .filter(([, v]) => v)
            .map(([label, val]) => (
              <View key={label as string} style={s.soapBox}>
                <Text style={shared.label}>{label}</Text>
                <Text style={shared.value}>{val}</Text>
              </View>
            ))}
        </>
      )}

      {/* Narrative */}
      {narrative && (
        <>
          <Text style={shared.sectionTitle}>Narrative Note</Text>
          <View style={s.narrativeBox}>
            <Text style={shared.value}>{narrative}</Text>
          </View>
        </>
      )}

      {/* Signature */}
      <View style={{ paddingTop: 12, borderTopWidth: 1, borderTopColor: BRAND.zinc200, borderTopStyle: 'solid', alignItems: 'flex-end' }}>
        <View style={s.sigBox}>
          <Text style={shared.label}>Clinician Signature</Text>
          {signature ? <Image src={signature} style={s.sigImg} /> : <View style={s.sigLine} />}
        </View>
      </View>
    </BasePDFTemplate>
  );
};
