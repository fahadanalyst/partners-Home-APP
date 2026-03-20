import React from 'react';
import { View, Text, StyleSheet } from '@react-pdf/renderer';
import { BasePDFTemplate, shared, BRAND } from './BasePDFTemplate';

const RESOURCE_FIELDS = [
  'Primary MD','Clinical Contact Person','Hospital of Preference','Social Worker',
  'Pharmacy Name','Home Care/Case Manager','Meals on Wheels','Transportation',
  'Adult Day Care','Laboratory','DME Company','Homemaker Name','Caregiver Support System'
];

const s = StyleSheet.create({
  resourceKey: {
    padding: 5, width: '35%', fontSize: 8, fontFamily: 'Helvetica-Bold',
    color: BRAND.zinc700, backgroundColor: 'rgba(0,86,150,0.03)',
    borderRightWidth: 1, borderRightColor: BRAND.zinc200, borderRightStyle: 'solid',
  },
  resourceVal: { padding: 5, flex: 1, fontSize: 8, color: BRAND.zinc600 },
});

const v = (val: any) => (val != null && val !== '') ? String(val) : 'N/A';

const Field: React.FC<{ label: string; value?: any }> = ({ label, value }) => (
  <View style={{ marginBottom: 8 }}>
    <Text style={shared.label}>{label}</Text>
    <Text style={shared.value}>{v(value)}</Text>
  </View>
);

const Row: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <View style={{ flexDirection: 'row', gap: 12, marginBottom: 4 }}>{children}</View>
);

const Col: React.FC<{ children: React.ReactNode; flex?: number }> = ({ children, flex = 1 }) => (
  <View style={{ flex }}>{children}</View>
);

const addr = (obj: any): string => {
  if (!obj) return 'N/A';
  const parts = [
    obj.street,
    obj.apt,
    obj.city ? `${obj.city}${obj.state ? ', ' + obj.state : ''}${obj.zip ? ' ' + obj.zip : ''}` : null
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(', ') : 'N/A';
};

export const PatientResourceDataTemplate: React.FC<{ data: any }> = ({ data }) => {
  const patient = data.patient || {};
  const demographics = data.demographics || {};
  const emergencyContact = data.emergencyContact || {};
  const resources = data.resources || {};
  const insurance = data.insurance || {};
  const specialInstructions = data.specialInstructions;

  const raceText = (() => {
    const r = Array.isArray(demographics.raceEthnicity)
      ? demographics.raceEthnicity.filter(Boolean).join(', ')
      : (demographics.raceEthnicity || '');
    const o = demographics.raceOther || '';
    return [r, o].filter(Boolean).join(' — ') || 'N/A';
  })();

  return (
    <BasePDFTemplate title="Patient Resource Data Form" date={patient.admissionDate}>

      {/* Patient Information */}
      <Text style={shared.sectionTitle}>Patient Information</Text>
      <View style={shared.card}>
        <Row>
          <Col flex={2}><Field label="Patient Name" value={patient.name} /></Col>
          <Col><Field label="Gender" value={patient.gender} /></Col>
        </Row>
        <Row>
          <Col flex={2}><Field label="Address" value={addr(patient)} /></Col>
          <Col><Field label="Telephone" value={patient.phone} /></Col>
        </Row>
        <Row>
          <Col><Field label="M.R. #" value={patient.mrNumber} /></Col>
          <Col><Field label="Admission Date" value={patient.admissionDate} /></Col>
        </Row>
      </View>

      {/* Special Instructions */}
      {!!specialInstructions && (
        <>
          <Text style={shared.sectionTitle}>Directions / Special Instructions</Text>
          <View style={[shared.card, { marginBottom: 10 }]}>
            <Text style={[shared.value, { fontStyle: 'italic' }]}>{specialInstructions}</Text>
          </View>
        </>
      )}

      {/* Demographics */}
      <Text style={shared.sectionTitle}>Demographic Information</Text>
      <View style={shared.card}>
        <Row>
          <Col><Field label="Date of Birth" value={demographics.dob} /></Col>
          <Col><Field label="Primary Language" value={demographics.primaryLanguage} /></Col>
          <Col><Field label="Religion" value={demographics.religion} /></Col>
        </Row>
        <Row>
          <Col><Field label="Marital Status" value={demographics.maritalStatus} /></Col>
          <Col flex={2}>
            <Text style={shared.label}>Race / Ethnicity</Text>
            <Text style={shared.value}>{raceText}</Text>
          </Col>
        </Row>
      </View>

      {/* Emergency Contact */}
      <Text style={shared.sectionTitle}>Emergency Contact</Text>
      <View style={shared.card}>
        <Row>
          <Col><Field label="Name" value={emergencyContact.name} /></Col>
          <Col><Field label="Relationship" value={emergencyContact.relationship} /></Col>
        </Row>
        <Field label="Address" value={addr(emergencyContact)} />
        <Row>
          <Col><Field label="Telephone (Home)" value={emergencyContact.telephoneHome} /></Col>
          <Col><Field label="Telephone (Business)" value={emergencyContact.telephoneBusiness} /></Col>
        </Row>
      </View>

      {/* Resources Table */}
      <Text style={shared.sectionTitle}>Health and Community Resources</Text>
      <View style={shared.table}>
        <View style={shared.tableHeader}>
          <Text style={[shared.tableHeaderCell, { width: '35%' }]}>Resource</Text>
          <Text style={[shared.tableHeaderCell, { flex: 1 }]}>Name / Agency / Telephone</Text>
        </View>
        {RESOURCE_FIELDS.map((field, i) => (
          <View key={field} style={shared.tableRow}>
            <Text style={s.resourceKey}>{field}</Text>
            <Text style={s.resourceVal}>{v(resources[field]) === 'N/A' ? '--' : v(resources[field])}</Text>
          </View>
        ))}
      </View>

      {/* Insurance */}
      <Text style={shared.sectionTitle}>Insurance Information</Text>
      <View style={shared.card}>
        <Row>
          <Col><Field label="Medicare Number" value={insurance.medicareNumber} /></Col>
          <Col><Field label="Medicaid Number" value={insurance.medicaidNumber} /></Col>
          <Col><Field label="Other Insurance" value={insurance.other} /></Col>
        </Row>
      </View>

    </BasePDFTemplate>
  );
};