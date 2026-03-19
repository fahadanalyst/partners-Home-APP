import React from 'react';
import { View, Text, Image, StyleSheet } from '@react-pdf/renderer';
import { BasePDFTemplate, shared, BRAND } from './BasePDFTemplate';

const s = StyleSheet.create({
  patientHero: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: 'rgba(0,86,150,0.04)', borderWidth: 1,
    borderColor: 'rgba(0,86,150,0.12)', borderStyle: 'solid',
    borderRadius: 6, padding: 12, marginBottom: 12,
  },
  avatar: {
    width: 44, height: 44, borderRadius: 6,
    backgroundColor: BRAND.blue, justifyContent: 'center', alignItems: 'center', flexShrink: 0,
  },
  avatarText: { color: BRAND.white, fontSize: 16, fontFamily: 'Helvetica-Bold' },
  heroName: { fontSize: 16, fontFamily: 'Helvetica-Bold', color: BRAND.zinc900 },
  heroMeta: { flexDirection: 'row', gap: 16, marginTop: 3 },
  heroMetaItem: { fontSize: 8, color: BRAND.zinc500, fontFamily: 'Helvetica-Bold' },
  textBox: {
    backgroundColor: BRAND.zinc50, borderWidth: 1, borderColor: BRAND.zinc100,
    borderStyle: 'solid', borderRadius: 3, padding: 8, minHeight: 60, marginBottom: 10,
  },
  vitalBox: {
    flex: 1, borderWidth: 1, borderColor: BRAND.zinc100, borderStyle: 'solid',
    borderRadius: 3, padding: 5,
  },
  checkbox: { width: 9, height: 9, borderWidth: 1, borderColor: BRAND.zinc400, borderStyle: 'solid', borderRadius: 1, marginRight: 4 },
  checkboxFilled: { width: 9, height: 9, backgroundColor: BRAND.zinc900, borderWidth: 1, borderColor: BRAND.zinc400, borderStyle: 'solid', borderRadius: 1, marginRight: 4 },
  checkRow: { flexDirection: 'row', alignItems: 'center', marginRight: 12, marginBottom: 4 },
  serviceRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 5, width: '50%' },
  sigPanel: {
    borderWidth: 1, borderColor: BRAND.zinc100, borderStyle: 'solid',
    borderRadius: 4, padding: 10, alignItems: 'center',
  },
  sigImg: { width: 160, height: 48, objectFit: 'contain', marginBottom: 4 },
  sigLine: { width: '100%', height: 48, borderBottomWidth: 1, borderBottomColor: BRAND.zinc300, borderBottomStyle: 'solid', marginBottom: 4 },
});

const RECOMMENDED_SERVICES = [
  'Adult day health (ADH)',
  'Group adult foster care (GAFC)',
  'Adult foster care (AFC)',
  'Program for All-inclusive Care for the Elderly (PACE)',
  'Nursing facility (NF)',
];

const Check: React.FC<{ label: string; checked?: boolean }> = ({ label, checked }) => (
  <View style={s.checkRow}>
    <View style={checked ? s.checkboxFilled : s.checkbox} />
    <Text style={{ fontSize: 8, color: BRAND.zinc500, textTransform: 'uppercase' }}>{label}</Text>
  </View>
);

const Field: React.FC<{ label: string; value?: string }> = ({ label, value }) => (
  <View style={{ marginBottom: 6 }}>
    <Text style={shared.label}>{label}</Text>
    <Text style={shared.value}>{value || 'N/A'}</Text>
  </View>
);

export const PhysicianSummaryTemplate: React.FC<{ data: any }> = ({ data }) => {
  const {
    patient = {}, diagnosis = {}, treatments, medications, vitals = {},
    allergies = {}, physical = {}, continence = {}, mentalStatus, mentalStatusOther,
    recentLabWork, diet, lastPhysicalExam, lastOfficeVisit, additionalComments,
    recommendedServices = [], providerSignature, providerName, providerTitle,
    dateCompleted, providerAddress,
  } = data;

  const patientTitle = `Physician Summary: ${patient.lastName || 'Patient'}, ${patient.firstName || ''}`;

  return (
    <BasePDFTemplate title={patientTitle} date={dateCompleted}>

      {/* Patient Hero */}
      <View style={s.patientHero}>
        <View style={s.avatar}>
          <Text style={s.avatarText}>
            {(patient.firstName?.[0] || 'P')}{(patient.lastName?.[0] || 'T')}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.heroName}>{patient.lastName || 'Patient'}, {patient.firstName || ''}</Text>
          <View style={s.heroMeta}>
            <Text style={s.heroMetaItem}>DOB: {patient.dob || 'N/A'}</Text>
            <Text style={s.heroMetaItem}>Gender: {patient.gender || 'N/A'}</Text>
            <Text style={s.heroMetaItem}>M.R. #: {patient.mrNumber || 'N/A'}</Text>
          </View>
        </View>
      </View>

      {/* Patient Information */}
      <Text style={shared.sectionTitle}>Patient Information</Text>
      <View style={shared.card}>
        <View style={shared.row4}>
          <View style={shared.col4}><Field label="Last Name" value={patient.lastName} /></View>
          <View style={shared.col4}><Field label="First Name" value={patient.firstName} /></View>
          <View style={shared.col4}><Field label="Date of Birth" value={patient.dob} /></View>
          <View style={shared.col4}><Field label="Gender" value={patient.gender} /></View>
        </View>
        <View style={shared.row4}>
          <View style={[shared.col4, { flex: 2 }]}><Field label="Address" value={patient.address} /></View>
          <View style={shared.col4}><Field label="Telephone" value={patient.telephone} /></View>
          <View style={shared.col4}><Field label="Medicare #" value={patient.medicareNumber} /></View>
        </View>
      </View>

      {/* Diagnosis */}
      <Text style={shared.sectionTitle}>Diagnosis</Text>
      <View style={shared.card}>
        <View style={shared.row2}>
          <View style={[shared.col2, { flex: 2 }]}>
            <Field label="Diagnosis(es)" value={diagnosis.diagnoses} />
          </View>
          <View style={shared.col2}>
            <Field label="Mental Illness" value={diagnosis.mentalIllness || 'None'} />
            <View style={{ flexDirection: 'row', marginTop: 4 }}>
              <Check label="Intellectual Disability" checked={diagnosis.intellectualDisability} />
              <Check label="Dev. Disability" checked={diagnosis.developmentalDisability} />
            </View>
          </View>
        </View>
      </View>

      {/* Treatments & Medications */}
      <View style={shared.row2}>
        <View style={shared.col2}>
          <Text style={shared.sectionTitle}>Treatments</Text>
          <View style={s.textBox}>
            <Text style={shared.value}>{treatments || 'None listed.'}</Text>
          </View>
        </View>
        <View style={shared.col2}>
          <Text style={shared.sectionTitle}>Medications</Text>
          <View style={s.textBox}>
            <Text style={shared.value}>{medications || 'None listed.'}</Text>
          </View>
        </View>
      </View>

      {/* Vitals & Allergies */}
      <View style={shared.row2}>
        <View style={shared.col2}>
          <Text style={shared.sectionTitle}>Recent Vital Signs</Text>
          <View style={[shared.card, { marginBottom: 10 }]}>
            <Field label="Date" value={vitals.date} />
            <View style={{ flexDirection: 'row', gap: 6 }}>
              {[['T', vitals.t], ['P', vitals.p], ['R', vitals.r], ['BP', vitals.bp], ['Wt', vitals.weight]].map(([lbl, val]) => (
                <View key={lbl as string} style={s.vitalBox}>
                  <Text style={shared.label}>{lbl}</Text>
                  <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', color: BRAND.zinc900, marginTop: 2 }}>{val || '--'}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
        <View style={shared.col2}>
          <Text style={shared.sectionTitle}>Allergies</Text>
          <View style={[shared.card, { marginBottom: 10 }]}>
            <View style={{ flexDirection: 'row', marginBottom: 6 }}>
              <Check label="NKA" checked={allergies.noKnownAllergies} />
              <Check label="NKDA" checked={allergies.noKnownDrugAllergies} />
            </View>
            <Text style={shared.value}>{allergies.list || 'No specific allergies listed.'}</Text>
          </View>
        </View>
      </View>

      {/* Physical, Continence, Mental Status */}
      <View style={shared.row3}>
        <View style={shared.col3}>
          <Text style={shared.sectionTitle}>Physical</Text>
          <View style={[shared.card, { marginBottom: 10 }]}>
            <Field label="Height" value={physical.height} />
            <Field label="Weight" value={physical.weight} />
          </View>
        </View>
        <View style={shared.col3}>
          <Text style={shared.sectionTitle}>Continence</Text>
          <View style={[shared.card, { marginBottom: 10 }]}>
            <Field label="Bowel" value={continence.bowel} />
            <Field label="Bladder" value={continence.bladder} />
          </View>
        </View>
        <View style={shared.col3}>
          <Text style={shared.sectionTitle}>Mental Status</Text>
          <View style={[shared.card, { marginBottom: 10 }]}>
            <Text style={shared.value}>{mentalStatus === 'Other' ? mentalStatusOther : mentalStatus || 'N/A'}</Text>
          </View>
        </View>
      </View>

      {/* Additional Clinical Info */}
      <View style={shared.row2}>
        <View style={shared.col2}>
          <Text style={shared.sectionTitle}>Recent Lab Work</Text>
          <View style={[s.textBox]}><Text style={shared.value}>{recentLabWork || 'N/A'}</Text></View>
        </View>
        <View style={shared.col2}>
          <Text style={shared.sectionTitle}>Diet</Text>
          <View style={[s.textBox]}><Text style={shared.value}>{diet || 'N/A'}</Text></View>
        </View>
      </View>

      <View style={shared.row2}>
        <View style={shared.col2}>
          <Field label="Last Physical Exam" value={lastPhysicalExam} />
        </View>
        <View style={shared.col2}>
          <Field label="Last Office Visit" value={lastOfficeVisit} />
        </View>
      </View>

      {additionalComments && (
        <>
          <Text style={shared.sectionTitle}>Additional Comments</Text>
          <View style={[s.textBox, { marginBottom: 10 }]}>
            <Text style={shared.value}>{additionalComments}</Text>
          </View>
        </>
      )}

      {/* Recommended Services */}
      <Text style={shared.sectionTitle}>Recommended Services</Text>
      <View style={[shared.card, { marginBottom: 12 }]}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {RECOMMENDED_SERVICES.map((service) => (
            <View key={service} style={s.serviceRow}>
              <View style={recommendedServices.includes(service) ? s.checkboxFilled : s.checkbox} />
              <Text style={{ fontSize: 8, color: BRAND.zinc700 }}>{service}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Provider Signature */}
      <View style={[shared.row2, { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: BRAND.zinc200, borderTopStyle: 'solid' }]}>
        <View style={shared.col2}>
          <View style={s.sigPanel}>
            {providerSignature
              ? <Image src={providerSignature} style={s.sigImg} />
              : <View style={s.sigLine} />
            }
            <Text style={shared.label}>Provider Signature</Text>
            <Text style={shared.muted}>Date: {dateCompleted || 'N/A'}</Text>
          </View>
        </View>
        <View style={shared.col2}>
          <Field label="Provider Name & Title" value={[providerName, providerTitle].filter(Boolean).join(', ') || 'N/A'} />
          <Field label="Address" value={providerAddress} />
        </View>
      </View>

    </BasePDFTemplate>
  );
};
