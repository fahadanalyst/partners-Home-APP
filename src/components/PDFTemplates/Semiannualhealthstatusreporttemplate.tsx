import React from 'react';
import { View, Text, StyleSheet } from '@react-pdf/renderer';
import { BasePDFTemplate, shared, BRAND } from './BasePDFTemplate';

const s = StyleSheet.create({
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  checkBox: {
    width: 10,
    height: 10,
    borderWidth: 1,
    borderColor: BRAND.zinc400,
    borderStyle: 'solid',
    borderRadius: 2,
    marginRight: 6,
    backgroundColor: BRAND.zinc50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkBoxFilled: {
    width: 10,
    height: 10,
    borderWidth: 1,
    borderColor: BRAND.blue,
    borderStyle: 'solid',
    borderRadius: 2,
    marginRight: 6,
    backgroundColor: BRAND.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkMark: {
    fontSize: 7,
    color: BRAND.white,
    fontFamily: 'Helvetica-Bold',
  },
  textAreaBox: {
    borderWidth: 1,
    borderColor: BRAND.zinc200,
    borderStyle: 'solid',
    borderRadius: 3,
    padding: 6,
    minHeight: 36,
    backgroundColor: BRAND.zinc50,
    marginBottom: 8,
  },
  sectionBanner: {
    backgroundColor: BRAND.blue,
    padding: 6,
    marginBottom: 8,
    borderRadius: 3,
  },
  sectionBannerText: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: BRAND.white,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  sigLine: {
    height: 28,
    borderBottomWidth: 1,
    borderBottomColor: BRAND.zinc400,
    borderBottomStyle: 'solid',
    marginBottom: 3,
    marginTop: 10,
  },
  returnBox: {
    borderWidth: 1,
    borderColor: BRAND.zinc200,
    borderStyle: 'solid',
    borderRadius: 3,
    padding: 8,
    backgroundColor: BRAND.zinc50,
    marginTop: 10,
  },
});

const LabelValue: React.FC<{ label: string; value?: string; flex?: number }> = ({ label, value, flex = 1 }) => (
  <View style={[shared.col2, { flex }]}>
    <Text style={shared.label}>{label}</Text>
    <Text style={shared.value}>{value || '—'}</Text>
  </View>
);

const TextBlock: React.FC<{ value?: string }> = ({ value }) => (
  <View style={s.textAreaBox}>
    <Text style={shared.value}>{value || '—'}</Text>
  </View>
);

export const SemiAnnualHealthStatusReportTemplate: React.FC<{ data: any }> = ({ data }) => {
  const d = data || {};

  return (
    <BasePDFTemplate title="Semi-Annual Health Status Report" date={d.authFrom}>

      {/* Authorization & Patient */}
      <Text style={shared.sectionTitle}>Authorization & Patient Information</Text>
      <View style={shared.card}>
        <View style={shared.row2}>
          <LabelValue label="Authorization From" value={d.authFrom} />
          <LabelValue label="Authorization To" value={d.authTo} />
        </View>
        <View style={shared.row2}>
          <LabelValue label="Client Name" value={d.clientName} flex={2} />
          <LabelValue label="Date of Birth" value={d.dob} />
        </View>
        <View style={{ marginBottom: 6 }}>
          <Text style={shared.label}>Client Address</Text>
          <Text style={shared.value}>{d.clientAddress || '—'}</Text>
        </View>
        <View style={{ marginBottom: 4 }}>
          <Text style={shared.label}>Primary Care Provider</Text>
          <Text style={shared.value}>{d.clientPCP || '—'}</Text>
        </View>
        <View style={shared.divider} />
        <Text style={shared.label}>Client Diagnoses</Text>
        <Text style={shared.value}>{d.clientDiagnoses || '—'}</Text>
      </View>

      {/* Nursing Review */}
      <View style={s.sectionBanner}>
        <Text style={s.sectionBannerText}>Nursing Review</Text>
      </View>

      <View style={shared.card}>
        <View style={[s.checkRow, { marginBottom: 8 }]}>
          <View style={s.checkBoxFilled}>
            <Text style={s.checkMark}>✓</Text>
          </View>
          <Text style={[shared.value, { fontFamily: 'Helvetica-Bold' }]}>
            Client Medications / Client Care Plan: see attached for PCP review
          </Text>
        </View>

        <Text style={shared.label}>Significant Findings or Changes</Text>
        <TextBlock value={d.significantFindings} />

        <View style={shared.row2}>
          <View style={shared.col2}>
            <Text style={shared.label}>Mental Status</Text>
            <Text style={[shared.value, { marginBottom: 6 }]}>{d.mentalStatus || '—'}</Text>
          </View>
          <View style={shared.col2}>
            <Text style={shared.label}>Continence</Text>
            <Text style={[shared.value, { marginBottom: 6 }]}>{d.continence || '—'}</Text>
          </View>
        </View>

        <View style={shared.row2}>
          <View style={shared.col2}>
            <Text style={shared.label}>Adaptive Equipment</Text>
            <Text style={[shared.value, { marginBottom: 6 }]}>{d.adaptiveEquipment || '—'}</Text>
          </View>
          <View style={shared.col2}>
            <Text style={shared.label}>Client Has Phone</Text>
            <Text style={[shared.value, { marginBottom: 6 }]}>{d.clientHasPhone || '—'}</Text>
          </View>
        </View>

        <Text style={shared.label}>Physical Assistance or Cueing/Supervision to complete at least 1 ADL</Text>
        <TextBlock value={d.physicalAssistanceADL} />

        <View style={[shared.row2, { marginTop: 6 }]}>
          <View style={shared.col2}>
            <Text style={shared.label}>RN Signature</Text>
            <View style={s.sigLine} />
            <Text style={shared.value}>{d.rnSignature || '—'}</Text>
          </View>
          <View style={shared.col2}>
            <Text style={shared.label}>Date</Text>
            <View style={s.sigLine} />
            <Text style={shared.value}>{d.rnSignatureDate || '—'}</Text>
          </View>
        </View>
      </View>

      {/* PCP Review */}
      <View style={s.sectionBanner}>
        <Text style={s.sectionBannerText}>PCP Review</Text>
      </View>

      <View style={shared.card}>
        <Text style={shared.label}>I have read the attached medication list. Changes are as follows</Text>
        <TextBlock value={d.medicationChanges} />

        <Text style={shared.label}>Significant changes in the client's condition are as follows</Text>
        <TextBlock value={d.conditionChanges} />

        <View style={{ marginBottom: 8 }}>
          <Text style={shared.label}>Date of Most Recent Physical Exam</Text>
          <Text style={shared.value}>{d.mostRecentPhysicalExam || '—'}</Text>
        </View>

        <View style={[s.textAreaBox, { marginBottom: 10 }]}>
          <Text style={[shared.muted, { fontStyle: 'italic' }]}>
            I certify that this patient is under my care and that the Group Adult Foster Care Program is appropriate
            to meet the physical and psychosocial needs of the patient. I approve GAFC program for the dates indicated above.
          </Text>
        </View>

        <View style={shared.row2}>
          <View style={shared.col2}>
            <Text style={shared.label}>MD Signature</Text>
            <View style={s.sigLine} />
            <Text style={shared.value}>{d.mdSignature || '—'}</Text>
          </View>
          <View style={shared.col2}>
            <Text style={shared.label}>Date</Text>
            <View style={s.sigLine} />
            <Text style={shared.value}>{d.mdSignatureDate || '—'}</Text>
          </View>
        </View>
      </View>

      {/* Return address */}
      <View style={s.returnBox}>
        <Text style={shared.muted}>
          Return to: Partners Home and Nursing Services  ·  208 Main St. #112 Milford MA 01757  ·  Fax: 508-484-6265
        </Text>
      </View>

    </BasePDFTemplate>
  );
};