import React from 'react';
import { View, Text, StyleSheet } from '@react-pdf/renderer';
import { BasePDFTemplate, shared, BRAND } from './BasePDFTemplate';

const s = StyleSheet.create({
  checkbox: { width: 10, height: 10, borderWidth: 1, borderColor: BRAND.zinc400, borderStyle: 'solid', borderRadius: 1, marginRight: 4 },
  checkboxFilled: { width: 10, height: 10, borderWidth: 1, borderColor: BRAND.zinc400, borderStyle: 'solid', borderRadius: 1, backgroundColor: BRAND.zinc900, marginRight: 4 },
  checkRow: { flexDirection: 'row', alignItems: 'center', marginRight: 12, marginBottom: 4 },
  checkLabel: { fontSize: 8, color: BRAND.zinc500, textTransform: 'uppercase' },
  textArea: { backgroundColor: BRAND.zinc50, borderWidth: 1, borderColor: BRAND.zinc100, borderStyle: 'solid', borderRadius: 4, padding: 8, minHeight: 60, marginBottom: 8 },
});

const Check: React.FC<{ label: string; checked?: boolean }> = ({ label, checked }) => (
  <View style={s.checkRow}>
    <View style={checked ? s.checkboxFilled : s.checkbox} />
    <Text style={s.checkLabel}>{label}</Text>
  </View>
);

const Field: React.FC<{ label: string; value?: string }> = ({ label, value }) => (
  <View style={{ marginBottom: 6 }}>
    <Text style={shared.label}>{label}</Text>
    <Text style={shared.value}>{value || 'N/A'}</Text>
  </View>
);

export const MDSAssessmentTemplate: React.FC<{ data: any }> = ({ data }) => {
  const { assessmentDate, patient = {}, cognitive = {}, mood = {}, physical = {}, diagnoses = [], diagnosesOther, medications = {}, summary } = data;
  return (
    <BasePDFTemplate title="Minimum Data Set (MDS) Assessment" date={assessmentDate}>
      {/* Identification */}
      <Text style={shared.sectionTitle}>Identification Information</Text>
      <View style={shared.card}>
        <View style={shared.row4}>
          <View style={[shared.col4, { flex: 2 }]}><Field label="Patient Name" value={patient.name} /></View>
          <View style={shared.col4}><Field label="Date of Birth" value={patient.dob} /></View>
          <View style={shared.col4}><Field label="Gender" value={patient.gender} /></View>
          <View style={[shared.col4, { flex: 2 }]}><Field label="M.R. #" value={patient.mrNumber} /></View>
          <View style={shared.col4}><Field label="Assessment Date" value={assessmentDate} /></View>
        </View>
      </View>

      {/* Cognitive & Mood */}
      <View style={shared.row2}>
        <View style={shared.col2}>
          <Text style={shared.sectionTitle}>Cognitive Patterns</Text>
          <View style={shared.card}>
            <Field label="Short-term Memory" value={cognitive.memory} />
            <Field label="Decision Making" value={cognitive.decisionMaking} />
            <Field label="Orientation" value={cognitive.orientation?.length > 0 ? cognitive.orientation.join(', ') : 'None specified'} />
            <Text style={shared.label}>Communication</Text>
            <Text style={shared.value}>{cognitive.communication || 'N/A'}</Text>
          </View>
        </View>
        <View style={shared.col2}>
          <Text style={shared.sectionTitle}>Mood and Behavior</Text>
          <View style={shared.card}>
            <Text style={shared.label}>Indicators</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 6 }}>
              <Check label="Depression" checked={mood.depression} />
              <Check label="Anxiety" checked={mood.anxiety} />
              <Check label="Agitation" checked={mood.agitation} />
            </View>
            <Field label="Behavioral Symptoms" value={mood.behavioralSymptoms || 'None reported.'} />
            <Field label="PHQ-9 Score" value={mood.phq9Score} />
          </View>
        </View>
      </View>

      {/* Physical Functioning */}
      <Text style={shared.sectionTitle}>Physical Functioning & Structural Problems</Text>
      <View style={shared.card}>
        <View style={shared.row4}>
          <View style={shared.col4}><Field label="Bed Mobility" value={physical.bedMobility} /></View>
          <View style={shared.col4}><Field label="Transfers" value={physical.transfers} /></View>
          <View style={shared.col4}><Field label="Walking in Room" value={physical.walkingRoom} /></View>
          <View style={shared.col4}><Field label="Walking in Corridor" value={physical.walkingCorridor} /></View>
          <View style={shared.col4}><Field label="Dressing" value={physical.dressing} /></View>
          <View style={shared.col4}><Field label="Eating" value={physical.eating} /></View>
          <View style={shared.col4}><Field label="Toilet Use" value={physical.toiletUse} /></View>
          <View style={shared.col4}><Field label="Personal Hygiene" value={physical.personalHygiene} /></View>
        </View>
        <View style={shared.row2}>
          <View style={shared.col2}><Field label="Continence — Bowel" value={physical.bowelContinence} /></View>
          <View style={shared.col2}><Field label="Continence — Bladder" value={physical.bladderContinence} /></View>
        </View>
        <View style={shared.row2}>
          <View style={shared.col2}><Field label="Pain Assessment" value={physical.painLevel} /></View>
          <View style={shared.col2}><Field label="Fall History" value={physical.fallHistory} /></View>
        </View>
        <Field label="Skin Condition" value={physical.skinCondition} />
      </View>

      {/* Diagnoses */}
      <Text style={shared.sectionTitle}>Active Diagnoses</Text>
      <View style={shared.card}>
        {diagnoses.length > 0 ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {diagnoses.map((d: string) => (
              <View key={d} style={{ flexDirection: 'row', alignItems: 'center', width: '50%', marginBottom: 3 }}>
                <Text style={{ fontSize: 8, color: BRAND.blue, marginRight: 4 }}>•</Text>
                <Text style={shared.value}>{d}</Text>
              </View>
            ))}
          </View>
        ) : <Text style={shared.value}>No active diagnoses recorded.</Text>}
        {diagnosesOther && <Field label="Other" value={diagnosesOther} />}
      </View>

      {/* Medications */}
      <Text style={shared.sectionTitle}>Medication Management</Text>
      <View style={shared.card}>
        <View style={shared.row2}>
          <View style={shared.col2}><Field label="Number of Medications" value={medications.count} /></View>
          <View style={shared.col2}><Field label="Injections" value={medications.injections} /></View>
        </View>
        <Field label="High-Risk Medications" value={medications.highRisk} />
      </View>

      {/* Summary */}
      <Text style={shared.sectionTitle}>Assessment Summary / Notes</Text>
      <View style={s.textArea}>
        <Text style={shared.value}>{summary || 'No summary provided.'}</Text>
      </View>
    </BasePDFTemplate>
  );
};
