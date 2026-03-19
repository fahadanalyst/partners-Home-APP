/**
 * NursingAssessmentTemplate — @react-pdf/renderer version
 *
 * This is a REFERENCE IMPLEMENTATION showing the full pattern for migrating
 * all other templates. Key rules:
 *
 *  1. Import from '@react-pdf/renderer', NOT from 'react'.
 *     (React itself is still imported for JSX.)
 *  2. Use View, Text, Image, Page, Document — NO div, p, span, table.
 *  3. All styles via StyleSheet.create(). NO Tailwind classes.
 *  4. Use shared styles from BasePDFTemplate where possible.
 *  5. Return a <Document> (via BasePDFTemplate wrapper) at the top level.
 *  6. For multi-page forms, add a second <Page> or let @react-pdf auto-paginate.
 */
import React from 'react';
import { View, Text, Image, StyleSheet } from '@react-pdf/renderer';
import { BasePDFTemplate, PDFHeader, PDFFooter, shared, BRAND } from './BasePDFTemplate';

// ─── Local styles ────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  vitalsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  vitalBox: {
    width: '13%',
    backgroundColor: BRAND.white,
    borderWidth: 1,
    borderColor: BRAND.zinc100,
    borderStyle: 'solid',
    borderRadius: 3,
    padding: 5,
  },
  vitalValue: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: BRAND.zinc900,
    marginTop: 2,
  },
  systemsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 10,
  },
  systemBox: {
    flex: 1,
    borderWidth: 1,
    borderColor: BRAND.zinc100,
    borderStyle: 'solid',
    borderRadius: 3,
    padding: 8,
  },
  textArea: {
    backgroundColor: BRAND.zinc50,
    borderWidth: 1,
    borderColor: BRAND.zinc100,
    borderStyle: 'solid',
    borderRadius: 3,
    padding: 8,
    marginBottom: 10,
    minHeight: 50,
  },
  sigSection: {
    marginTop: 16,
    alignItems: 'flex-end',
  },
  sigBox: {
    alignItems: 'center',
    width: 180,
  },
  sigLine: {
    borderBottomWidth: 1,
    borderBottomColor: BRAND.zinc400,
    borderBottomStyle: 'solid',
    width: 160,
    marginBottom: 3,
    height: 36,
  },
  sigImage: {
    width: 160,
    height: 36,
    objectFit: 'contain',
    marginBottom: 3,
  },
  sigLabel: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: BRAND.zinc500,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sigDate: {
    fontSize: 7,
    color: BRAND.zinc400,
    marginTop: 1,
  },
});

// ─── Helper components ───────────────────────────────────────────────────────
const Field: React.FC<{ label: string; value?: string }> = ({ label, value }) => (
  <View style={{ marginBottom: 6 }}>
    <Text style={shared.label}>{label}</Text>
    <Text style={shared.value}>{value || 'N/A'}</Text>
  </View>
);

const SectionTitle: React.FC<{ children: string }> = ({ children }) => (
  <Text style={shared.sectionTitle}>{children}</Text>
);

// ─── Template ────────────────────────────────────────────────────────────────
interface NursingAssessmentTemplateProps {
  data: any;
}

export const NursingAssessmentTemplate: React.FC<NursingAssessmentTemplateProps> = ({ data }) => {
  const {
    date,
    time,
    patient = {},
    vitals = {},
    neurological = {},
    respiratory = {},
    cardiovascular = {},
    gi = {},
    gu = {},
    skin = {},
    psychosocial,
    nursingDiagnosis,
    plan,
    signature,
  } = data;

  const vitalsItems = [
    { label: 'Temp', value: vitals.temp ? `${vitals.temp} °F` : '--' },
    { label: 'Pulse', value: vitals.pulse ? `${vitals.pulse} bpm` : '--' },
    { label: 'Resp', value: vitals.resp ? `${vitals.resp} /min` : '--' },
    { label: 'BP', value: vitals.bp || '--' },
    { label: 'SpO2', value: vitals.spo2 ? `${vitals.spo2}%` : '--' },
    { label: 'Weight', value: vitals.weight ? `${vitals.weight} lbs` : '--' },
    { label: 'Pain', value: vitals.pain ? `${vitals.pain}/10` : '--' },
  ];

  return (
    <BasePDFTemplate title="Comprehensive Nursing Assessment" date={date}>
      {/* ── Patient Info ─────────────────────────────────────── */}
      <View style={shared.card}>
        <View style={shared.row2}>
          <View style={shared.col2}>
            <Field label="Patient Name" value={patient.name} />
          </View>
          <View style={shared.col2}>
            <Field label="Date / Time of Assessment" value={`${date || 'N/A'}${time ? ` @ ${time}` : ''}`} />
          </View>
          <View style={shared.col2}>
            <Field label="Nurse / Clinician" value={patient.nurse} />
          </View>
          <View style={shared.col2}>
            <Field label="MR Number" value={patient.mrNumber} />
          </View>
        </View>
      </View>

      {/* ── Vital Signs ──────────────────────────────────────── */}
      <SectionTitle>Vital Signs</SectionTitle>
      <View style={s.vitalsGrid}>
        {vitalsItems.map((v) => (
          <View key={v.label} style={s.vitalBox}>
            <Text style={shared.label}>{v.label}</Text>
            <Text style={s.vitalValue}>{v.value}</Text>
          </View>
        ))}
      </View>

      {/* ── Systems Review ───────────────────────────────────── */}
      <SectionTitle>Systems Review</SectionTitle>
      <View style={s.systemsGrid}>
        {/* Neurological */}
        <View style={s.systemBox}>
          <Text style={[shared.label, { marginBottom: 4 }]}>Neurological</Text>
          <Field label="Orientation" value={
            neurological.orientation?.length > 0
              ? neurological.orientation.join(', ')
              : 'None specified'
          } />
          <View style={shared.row2}>
            <View style={shared.col2}><Field label="Pupils" value={neurological.pupils} /></View>
            <View style={shared.col2}><Field label="Speech" value={neurological.speech} /></View>
          </View>
        </View>

        {/* Respiratory */}
        <View style={s.systemBox}>
          <Text style={[shared.label, { marginBottom: 4 }]}>Respiratory</Text>
          <Field label="Breath Sounds" value={respiratory.breathSounds} />
          <View style={shared.row2}>
            <View style={shared.col2}><Field label="Cough" value={respiratory.cough} /></View>
            <View style={shared.col2}><Field label="Oxygen" value={respiratory.oxygen} /></View>
          </View>
        </View>
      </View>

      <View style={s.systemsGrid}>
        {/* Cardiovascular */}
        <View style={s.systemBox}>
          <Text style={[shared.label, { marginBottom: 4 }]}>Cardiovascular</Text>
          <Field label="Rhythm" value={cardiovascular.rhythm} />
          <View style={shared.row2}>
            <View style={shared.col2}><Field label="Edema" value={cardiovascular.edema} /></View>
            <View style={shared.col2}><Field label="Cap. Refill" value={cardiovascular.capRefill} /></View>
          </View>
        </View>

        {/* GI / GU */}
        <View style={s.systemBox}>
          <Text style={[shared.label, { marginBottom: 4 }]}>GI / GU</Text>
          <View style={shared.row2}>
            <View style={shared.col2}><Field label="Bowel Sounds" value={gi.bowelSounds} /></View>
            <View style={shared.col2}><Field label="Last BM" value={gi.lastBm} /></View>
          </View>
          <View style={shared.row2}>
            <View style={shared.col2}><Field label="Voiding" value={gu.voiding} /></View>
            <View style={shared.col2}><Field label="Urine Color" value={gu.urineColor} /></View>
          </View>
        </View>
      </View>

      {/* ── Skin & Psychosocial ──────────────────────────────── */}
      <View style={s.systemsGrid}>
        <View style={s.systemBox}>
          <Text style={[shared.label, { marginBottom: 4 }]}>Integumentary (Skin)</Text>
          <Field label="Condition" value={skin.condition} />
          <Field label="Wounds / Incisions" value={skin.wounds} />
        </View>
        <View style={s.systemBox}>
          <Text style={[shared.label, { marginBottom: 6 }]}>Psychosocial</Text>
          <Text style={shared.value}>{psychosocial || 'No psychosocial notes provided.'}</Text>
        </View>
      </View>

      {/* ── Nursing Diagnosis ────────────────────────────────── */}
      <SectionTitle>Nursing Diagnosis</SectionTitle>
      <View style={s.textArea}>
        <Text style={shared.value}>{nursingDiagnosis || 'N/A'}</Text>
      </View>

      {/* ── Plan of Care ─────────────────────────────────────── */}
      <SectionTitle>Plan of Care / Interventions</SectionTitle>
      <View style={s.textArea}>
        <Text style={shared.value}>{plan || 'N/A'}</Text>
      </View>

      {/* ── Signature ────────────────────────────────────────── */}
      <View style={s.sigSection}>
        <View style={s.sigBox}>
          {signature
            ? <Image src={signature} style={s.sigImage} />
            : <View style={s.sigLine} />
          }
          <Text style={s.sigLabel}>Nurse Signature</Text>
          <Text style={s.sigDate}>Electronically signed on {date || 'N/A'}</Text>
        </View>
      </View>
    </BasePDFTemplate>
  );
};
