import React from 'react';
import { View, Text, Image, StyleSheet } from '@react-pdf/renderer';
import { BasePDFTemplate, shared, BRAND } from './BasePDFTemplate';

const s = StyleSheet.create({
  vitalsRow: { flexDirection: 'row', gap: 6, marginBottom: 10 },
  vitalBox: {
    flex: 1, backgroundColor: BRAND.zinc50, borderWidth: 1,
    borderColor: BRAND.zinc100, borderStyle: 'solid', borderRadius: 3, padding: 5,
  },
  vitalVal: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: BRAND.zinc900, marginTop: 2 },
  adlRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: BRAND.zinc100, borderBottomStyle: 'solid', paddingVertical: 4 },
  adlTask: { width: '25%', fontSize: 8, fontFamily: 'Helvetica-Bold', color: BRAND.zinc700 },
  adlLevel: { width: '35%', fontSize: 8, color: BRAND.zinc600 },
  adlNotes: { flex: 1, fontSize: 8, color: BRAND.zinc500 },
  sigRow: { flexDirection: 'row', gap: 24, marginTop: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: BRAND.zinc200, borderTopStyle: 'solid' },
  sigBox: { flex: 1 },
  sigLine: { height: 36, borderBottomWidth: 1, borderBottomColor: BRAND.zinc300, borderBottomStyle: 'solid', marginBottom: 4 },
  sigImg: { width: 120, height: 36, objectFit: 'contain', marginBottom: 4 },
});

const ADL_TASKS = ['Bathing','Dressing','Grooming','Toileting','Mobility','Meal Prep','Housekeeping','Medication Mgmt'];

const Field: React.FC<{ label: string; value?: string }> = ({ label, value }) => (
  <View style={{ marginBottom: 6 }}>
    <Text style={shared.label}>{label}</Text>
    <Text style={shared.value}>{value || 'N/A'}</Text>
  </View>
);

export const GAFCProgressNoteTemplate: React.FC<{ data: any }> = ({ data }) => {
  const vitals = data.objective?.vitals || {};
  const interventions: string[] = (data.interventions || []).filter((i: string) => i.trim());
  return (
    <BasePDFTemplate title="GAFC Progress Note" date={data.visitDate}>
      {/* Header Info */}
      <View style={shared.card}>
        <View style={shared.row2}>
          <View style={shared.col2}><Field label="Participant Name" value={data.participantName} /></View>
          <View style={shared.col2}><Field label="DOB" value={data.dob} /></View>
          <View style={shared.col2}><Field label="GAFC Provider" value={data.gafcProvider} /></View>
          <View style={shared.col2}><Field label="Visit Date / Time" value={`${data.visitDate || 'N/A'} at ${data.visitTime || 'N/A'}`} /></View>
          <View style={shared.col2}><Field label="Location" value={data.location} /></View>
          <View style={shared.col2}><Field label="Staff Name & Title" value={data.staffNameTitle} /></View>
        </View>
      </View>

      {/* Reason for Visit */}
      <Text style={shared.sectionTitle}>Reason for Visit</Text>
      <View style={[shared.card, { marginBottom: 10 }]}>
        <Text style={shared.value}>{data.reasonForVisit || 'N/A'}</Text>
      </View>

      {/* Subjective */}
      <Text style={shared.sectionTitle}>Participant Report (Subjective)</Text>
      <View style={shared.card}>
        <Field label="Current Concerns" value={data.subjective?.currentConcerns} />
        <Field label="Changes Since Last Visit" value={data.subjective?.changesSinceLastVisit} />
        <Field label="Pain / Symptoms / New Issues" value={data.subjective?.painSymptoms} />
        <Field label="Mood / Mental Status" value={data.subjective?.moodMentalStatus} />
        <Field label="Participant Comments" value={data.subjective?.participantComments ? `"${data.subjective.participantComments}"` : '"No comments"'} />
      </View>

      {/* Objective / Vitals */}
      <Text style={shared.sectionTitle}>Observations (Objective)</Text>
      <View style={s.vitalsRow}>
        {[['BP', vitals.bp], ['HR', vitals.hr], ['RR', vitals.rr], ['Temp', vitals.temp], ['SpO2', vitals.spo2]].map(([lbl, val]) => (
          <View key={lbl as string} style={s.vitalBox}>
            <Text style={shared.label}>{lbl}</Text>
            <Text style={s.vitalVal}>{val || '--'}</Text>
          </View>
        ))}
      </View>
      <View style={shared.row2}>
        <View style={shared.col2}><Field label="General Appearance" value={data.objective?.generalAppearance} /></View>
        <View style={shared.col2}><Field label="Respiratory" value={data.objective?.physicalAssessment?.respiratory} /></View>
        <View style={shared.col2}><Field label="Cardiac" value={data.objective?.physicalAssessment?.cardiac} /></View>
        <View style={shared.col2}><Field label="Skin Integrity" value={data.objective?.physicalAssessment?.skinIntegrity} /></View>
        <View style={shared.col2}><Field label="Mobility / Gait" value={data.objective?.physicalAssessment?.mobilityGait} /></View>
        <View style={shared.col2}><Field label="Nutrition / Appetite" value={data.objective?.physicalAssessment?.nutritionAppetite} /></View>
      </View>

      {/* ADLs Table */}
      <Text style={shared.sectionTitle}>ADLs / IADLs Review</Text>
      <View style={shared.table}>
        <View style={shared.tableHeader}>
          <Text style={[shared.tableHeaderCell, { width: '25%' }]}>Task</Text>
          <Text style={[shared.tableHeaderCell, { width: '35%' }]}>Level of Assistance</Text>
          <Text style={[shared.tableHeaderCell, { flex: 1 }]}>Notes</Text>
        </View>
        {ADL_TASKS.map((task, i) => (
          <View key={task} style={shared.tableRow}>
            <Text style={[i % 2 === 0 ? shared.tableCell : shared.tableCellAlt, { width: '25%', fontFamily: 'Helvetica-Bold' }]}>{task}</Text>
            <Text style={[i % 2 === 0 ? shared.tableCell : shared.tableCellAlt, { width: '35%' }]}>{data.adls?.[task]?.level || 'Independent'}</Text>
            <Text style={[i % 2 === 0 ? shared.tableCell : shared.tableCellAlt, { flex: 1 }]}>{data.adls?.[task]?.notes || '--'}</Text>
          </View>
        ))}
      </View>

      {/* Assessment & Plan */}
      <Text style={shared.sectionTitle}>Clinical Assessment</Text>
      <View style={[shared.card, { marginBottom: 10 }]}><Text style={shared.value}>{data.assessment || 'N/A'}</Text></View>

      <Text style={shared.sectionTitle}>Interventions & Education</Text>
      <View style={shared.card}>
        <Text style={shared.label}>Interventions Provided</Text>
        {interventions.length > 0
          ? interventions.map((item, idx) => (
              <Text key={idx} style={[shared.value, { marginLeft: 8, marginBottom: 2 }]}>• {item}</Text>
            ))
          : <Text style={shared.value}>None recorded</Text>
        }
        <View style={{ marginTop: 6 }}>
          <Text style={shared.label}>Education Provided</Text>
          <Text style={shared.value}>{data.education || 'N/A'}</Text>
        </View>
      </View>

      {/* Signatures */}
      <View style={s.sigRow}>
        <View style={s.sigBox}>
          <Text style={shared.label}>Staff Signature</Text>
          {data.staffSignature ? <Image src={data.staffSignature} style={s.sigImg} /> : <View style={s.sigLine} />}
          <Text style={shared.valueBold}>{data.staffNameTitle || ''}</Text>
        </View>
        <View style={s.sigBox}>
          <Text style={shared.label}>Date</Text>
          <View style={s.sigLine}><Text style={[shared.value, { paddingTop: 18 }]}>{data.signatureDate || ''}</Text></View>
        </View>
      </View>
    </BasePDFTemplate>
  );
};
