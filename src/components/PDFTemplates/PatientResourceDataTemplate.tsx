import React from 'react';
import { View, Text, StyleSheet } from '@react-pdf/renderer';
import { BasePDFTemplate, shared, BRAND } from './BasePDFTemplate';

const RESOURCE_FIELDS = ['Primary MD','Clinical Contact Person','Hospital of Preference','Social Worker','Pharmacy Name','Home Care/Case Manager','Meals on Wheels','Transportation','Adult Day Care','Laboratory','DME Company','Homemaker Name','Caregiver Support System'];

const s = StyleSheet.create({
  resourceKey: { padding: 5, flex: 1, fontSize: 8, fontFamily: 'Helvetica-Bold', color: BRAND.zinc700, backgroundColor: 'rgba(0, 86, 150, 0.03)', borderRightWidth: 1, borderRightColor: BRAND.zinc100, borderRightStyle: 'solid' },
  resourceVal: { padding: 5, flex: 2, fontSize: 8, color: BRAND.zinc600 },
});

const addr = (obj: any) => [obj?.street, obj?.apt, obj?.city && `${obj.city}, ${obj.state} ${obj.zip}`].filter(Boolean).join(', ') || 'N/A';

const Field: React.FC<{ label: string; value?: string; flex?: number }> = ({ label, value, flex }) => (
  <View style={{ flex: flex || 1, marginBottom: 6 }}>
    <Text style={shared.label}>{label}</Text>
    <Text style={shared.value}>{value != null && value !== '' ? String(value) : 'N/A'}</Text>
  </View>
);

export const PatientResourceDataTemplate: React.FC<{ data: any }> = ({ data }) => {
  const { patient = {}, demographics = {}, emergencyContact = {}, resources = {}, insurance = {}, specialInstructions } = data;
  return (
    <BasePDFTemplate title="Patient Resource Data Form" date={patient.admissionDate}>
      {/* Patient Info */}
      <Text style={shared.sectionTitle}>Patient Information</Text>
      <View style={shared.card}>
        <View style={shared.row3}>
          <View style={[shared.col3, { flex: 2 }]}><Field label="Patient Name" value={patient.name} /></View>
          <View style={shared.col3}><Field label="Gender" value={patient.gender} /></View>
        </View>
        <View style={shared.row3}>
          <View style={[shared.col3, { flex: 2 }]}><Field label="Address" value={addr(patient)} /></View>
          <View style={shared.col3}><Field label="Telephone" value={patient.phone} /></View>
        </View>
        <View style={shared.row3}>
          <View style={shared.col3}><Field label="M.R. #" value={patient.mrNumber} /></View>
          <View style={shared.col3}><Field label="Admission Date" value={patient.admissionDate} /></View>
        </View>
      </View>

      {specialInstructions && (
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
        <View style={shared.row3}>
          <View style={shared.col3}><Field label="Date of Birth" value={demographics.dob} /></View>
          <View style={shared.col3}><Field label="Primary Language" value={demographics.primaryLanguage} /></View>
          <View style={shared.col3}><Field label="Religion" value={demographics.religion} /></View>
        </View>
        <View style={shared.row2}>
          <View style={shared.col2}><Field label="Marital Status" value={demographics.maritalStatus} /></View>
          <View style={shared.col2}>
            <Text style={shared.label}>Race / Ethnicity</Text>
            <Text style={shared.value}>{[Array.isArray(demographics.raceEthnicity) ? demographics.raceEthnicity.join(', ') : demographics.raceEthnicity, demographics.raceOther].filter(Boolean).join(' — ') || 'N/A'}</Text>
          </View>
        </View>
      </View>

      {/* Emergency Contact */}
      <Text style={shared.sectionTitle}>Emergency Contact</Text>
      <View style={shared.card}>
        <View style={shared.row2}>
          <View style={shared.col2}><Field label="Name" value={emergencyContact.name} /></View>
          <View style={shared.col2}><Field label="Relationship" value={emergencyContact.relationship} /></View>
        </View>
        <Field label="Address" value={addr(emergencyContact)} />
        <View style={shared.row2}>
          <View style={shared.col2}><Field label="Telephone (Home)" value={emergencyContact.telephoneHome} /></View>
          <View style={shared.col2}><Field label="Telephone (Business)" value={emergencyContact.telephoneBusiness} /></View>
        </View>
      </View>

      {/* Resources Table */}
      <Text style={shared.sectionTitle}>Health and Community Resources</Text>
      <View style={shared.table}>
        <View style={shared.tableHeader}>
          <Text style={[shared.tableHeaderCell, { flex: 1 }]}>Resource</Text>
          <Text style={[shared.tableHeaderCell, { flex: 2 }]}>Name / Agency / Telephone</Text>
        </View>
        {RESOURCE_FIELDS.map((field, i) => (
          <View key={field} style={shared.tableRow}>
            <Text style={[s.resourceKey]}>{field}</Text>
            <Text style={s.resourceVal}>{resources[field] || '--'}</Text>
          </View>
        ))}
      </View>

      {/* Insurance */}
      <Text style={shared.sectionTitle}>Insurance Information</Text>
      <View style={shared.card}>
        <View style={shared.row3}>
          <View style={shared.col3}><Field label="Medicare Number" value={insurance.medicareNumber} /></View>
          <View style={shared.col3}><Field label="Medicaid Number" value={insurance.medicaidNumber} /></View>
          <View style={shared.col3}><Field label="Other Insurance" value={insurance.other} /></View>
        </View>
      </View>
    </BasePDFTemplate>
  );
};
