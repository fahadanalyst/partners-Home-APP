import React from 'react';
import { View, Text, Image, StyleSheet } from '@react-pdf/renderer';
import { BasePDFTemplate, shared, BRAND } from './BasePDFTemplate';

const s = StyleSheet.create({
  adlRow: { flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: BRAND.zinc50, borderBottomStyle: 'solid', paddingVertical: 3 },
  sigLine: { height: 36, borderBottomWidth: 1, borderBottomColor: BRAND.zinc300, borderBottomStyle: 'solid', marginBottom: 4, marginTop: 8 },
  sigImg: { width: 160, height: 36, objectFit: 'contain', marginBottom: 4, marginTop: 8 },
});

const ADL_KEYS = ['bathing','dressing','toileting','ambulation','transfers','eating'];

export const GAFCCarePlanTemplate: React.FC<{ data: any }> = ({ data }) => {
  const ec = data.emergencyContact || {};
  const pcp = data.primaryCareProvider || {};
  const member = data.memberInfo || {};
  const interventions: any[] = data.interventions || [];
  const sigs = data.signatures || {};

  return (
    <BasePDFTemplate title="GAFC Care Plan">
      {/* Member Info */}
      <Text style={shared.sectionTitle}>Member Information</Text>
      <View style={shared.card}>
        <View style={shared.row2}>
          <View style={shared.col2}>
            <Text style={shared.label}>Member Name</Text>
            <Text style={[shared.valueBold, { marginBottom: 6 }]}>{member.name || 'N/A'}</Text>
          </View>
          <View style={shared.col2}>
            <Text style={shared.label}>MassHealth ID</Text>
            <Text style={[shared.value, { marginBottom: 6 }]}>{member.massHealthId || 'N/A'}</Text>
          </View>
          <View style={shared.col2}>
            <Text style={shared.label}>Date of Birth</Text>
            <Text style={shared.value}>{member.dob || 'N/A'}</Text>
          </View>
          <View style={shared.col2}>
            <Text style={shared.label}>Primary Language</Text>
            <Text style={shared.value}>{member.primaryLanguage || 'English'}</Text>
          </View>
        </View>
      </View>

      {/* Emergency & PCP */}
      <View style={shared.row2}>
        <View style={shared.col2}>
          <Text style={shared.label}>Emergency Contact</Text>
          <View style={[shared.card, { marginTop: 4 }]}>
            <Text style={shared.label}>Name</Text>
            <Text style={[shared.value, { marginBottom: 4 }]}>{ec.name || 'N/A'}</Text>
            <Text style={shared.label}>Relationship</Text>
            <Text style={[shared.value, { marginBottom: 4 }]}>{ec.relationship || 'N/A'}</Text>
            <Text style={shared.label}>Phone</Text>
            <Text style={shared.value}>{ec.phone || 'N/A'}</Text>
          </View>
        </View>
        <View style={shared.col2}>
          <Text style={shared.label}>Primary Care Provider</Text>
          <View style={[shared.card, { marginTop: 4 }]}>
            <Text style={shared.label}>Name</Text>
            <Text style={[shared.value, { marginBottom: 4 }]}>{pcp.name || 'N/A'}</Text>
            <Text style={shared.label}>Phone</Text>
            <Text style={shared.value}>{pcp.phone || 'N/A'}</Text>
          </View>
        </View>
      </View>

      {/* Medical Conditions */}
      <Text style={shared.sectionTitle}>Medical Conditions / Diagnoses</Text>
      <View style={[shared.card, { marginBottom: 10 }]}>
        <Text style={shared.value}>{data.medicalConditions || 'No conditions recorded'}</Text>
      </View>

      {/* Functional Assessment */}
      <Text style={shared.sectionTitle}>Functional Assessment</Text>
      <View style={shared.card}>
        {ADL_KEYS.map((adl) => (
          <View key={adl} style={s.adlRow}>
            <Text style={[shared.label, { textTransform: 'capitalize' }]}>{adl}</Text>
            <Text style={shared.valueBold}>{data.functionalAssessment?.[adl] || 'Independent'}</Text>
          </View>
        ))}
      </View>

      {/* Goals */}
      <Text style={shared.sectionTitle}>Member Centered Goals</Text>
      <View style={shared.card}>
        <Text style={shared.label}>Member's Own Goals</Text>
        <Text style={[shared.value, { marginBottom: 8, fontStyle: 'italic' }]}>"{data.goals?.memberGoals || 'N/A'}"</Text>
        <Text style={shared.label}>Provider Goals</Text>
        <Text style={shared.value}>{data.goals?.providerGoals || 'N/A'}</Text>
      </View>

      {/* Interventions Table */}
      <Text style={shared.sectionTitle}>Interventions & Services</Text>
      <View style={shared.table}>
        <View style={shared.tableHeader}>
          <Text style={[shared.tableHeaderCell, { flex: 2 }]}>Need / Goal</Text>
          <Text style={[shared.tableHeaderCell, { flex: 2 }]}>Intervention</Text>
          <Text style={[shared.tableHeaderCell, { flex: 1 }]}>Frequency</Text>
        </View>
        {interventions.length > 0 ? interventions.map((item: any, idx: number) => (
          <View key={idx} style={shared.tableRow}>
            <Text style={[idx % 2 === 0 ? shared.tableCell : shared.tableCellAlt, { flex: 2 }]}>{item.needGoal}</Text>
            <Text style={[idx % 2 === 0 ? shared.tableCell : shared.tableCellAlt, { flex: 2 }]}>{item.intervention}</Text>
            <Text style={[idx % 2 === 0 ? shared.tableCell : shared.tableCellAlt, { flex: 1 }]}>{item.frequency}</Text>
          </View>
        )) : (
          <View style={shared.tableRow}>
            <Text style={[shared.tableCell, { flex: 1, textAlign: 'center', color: BRAND.zinc400 }]}>No interventions listed</Text>
          </View>
        )}
      </View>

      {/* Signatures */}
      <View style={[shared.row2, { marginTop: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: BRAND.zinc200, borderTopStyle: 'solid' }]}>
        <View style={shared.col2}>
          <Text style={shared.label}>Member Signature</Text>
          {sigs.memberSignature ? <Image src={sigs.memberSignature} style={s.sigImg} /> : <View style={s.sigLine} />}
          <Text style={shared.valueBold}>{member.name || ''}</Text>
        </View>
        <View style={shared.col2}>
          <Text style={shared.label}>Care Manager Signature</Text>
          {sigs.careManagerSignature ? <Image src={sigs.careManagerSignature} style={s.sigImg} /> : <View style={s.sigLine} />}
          <Text style={shared.valueBold}>Care Manager</Text>
        </View>
      </View>
    </BasePDFTemplate>
  );
};
