/**
 * Commonwealth of Massachusetts — Physician Summary Form (PSF-1, Rev. 07/10)
 * Exact replication of the official government form layout.
 */
import React from 'react';
import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer';

const C = { black: '#000000', white: '#ffffff', gray: '#f0f0f0', border: '#000000', blue: '#003366' };

const s = StyleSheet.create({
  page: {
    backgroundColor: C.white,
    paddingTop: 20,
    paddingBottom: 20,
    paddingHorizontal: 26,
    fontFamily: 'Helvetica',
    fontSize: 7.5,
    color: C.black,
  },
  // Gov header
  govHeader: { marginBottom: 6 },
  commonwealthText: { fontSize: 7, color: '#444444', textAlign: 'center' },
  execOfficeText: { fontSize: 7, color: '#444444', textAlign: 'center' },
  websiteText: { fontSize: 7, color: '#444444', textAlign: 'center' },
  formTitleLarge: { fontSize: 13, fontFamily: 'Helvetica-Bold', textAlign: 'center', marginTop: 3, marginBottom: 2 },
  // Certification block
  certBox: {
    borderWidth: 1, borderColor: C.border, borderStyle: 'solid',
    padding: 5, marginBottom: 6,
  },
  certText: { fontSize: 6.5, lineHeight: 1.4 },
  // Field / layout
  box: { borderWidth: 1, borderColor: C.border, borderStyle: 'solid', marginBottom: 0 },
  row: { flexDirection: 'row' },
  col: { flex: 1 },
  // Bordered cell
  cell: { borderRightWidth: 1, borderColor: C.border, borderStyle: 'solid', borderBottomWidth: 1, padding: 3 },
  cellNB: { borderRightWidth: 1, borderColor: C.border, borderStyle: 'solid', padding: 3 }, // no bottom
  // Field label
  fieldLabel: { fontSize: 6, color: '#555555', fontFamily: 'Helvetica-Bold', marginBottom: 1 },
  fieldValue: { fontSize: 8, minHeight: 10 },
  // Checkbox
  checkRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 2 },
  checkbox: { width: 7, height: 7, borderWidth: 1, borderColor: C.border, borderStyle: 'solid', marginRight: 3, marginTop: 0.5 },
  checkboxFilled: { width: 7, height: 7, borderWidth: 1, borderColor: C.border, borderStyle: 'solid', marginRight: 3, marginTop: 0.5, backgroundColor: C.black },
  checkLabel: { fontSize: 7, flex: 1 },
  // Signature
  sigBox: { borderBottomWidth: 1, borderColor: C.border, borderStyle: 'solid', minHeight: 18, paddingBottom: 2 },
  tiny: { fontSize: 6, color: '#555555' },
  bold: { fontFamily: 'Helvetica-Bold' },
  body: { fontSize: 7.5 },
  // Section label (left dark cell)
  sectionCell: {
    backgroundColor: C.gray, borderRightWidth: 1, borderColor: C.border, borderStyle: 'solid',
    borderBottomWidth: 1, padding: 3, width: 110,
  },
  sectionCellText: { fontSize: 6.5, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase' },
  contentCell: { flex: 1, borderBottomWidth: 1, borderColor: C.border, borderStyle: 'solid', padding: 3 },
  // Table
  tableHeader: { backgroundColor: C.gray, flexDirection: 'row', borderBottomWidth: 1, borderColor: C.border, borderStyle: 'solid' },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderColor: C.border, borderStyle: 'solid', minHeight: 16 },
  tableCell: { padding: 2, borderRightWidth: 1, borderColor: C.border, borderStyle: 'solid', fontSize: 7 },
  // Radio
  radio: { fontSize: 7 },
});

const v = (val: any) => (val != null && val !== '') ? String(val) : '';
const bool = (val: any) => val ? '■' : '□';
const radio = (val: any, match: string) => val === match ? '●' : '○';

const CheckItem: React.FC<{ checked?: boolean; label: string }> = ({ checked, label }) => (
  <View style={s.checkRow}>
    <View style={checked ? s.checkboxFilled : s.checkbox} />
    <Text style={s.checkLabel}>{label}</Text>
  </View>
);

const CheckArr: React.FC<{ arr?: string[]; val: string; label: string }> = ({ arr, val, label }) => (
  <CheckItem checked={arr?.includes(val)} label={label} />
);

const LabeledField: React.FC<{ label: string; val: any; flex?: number; minHeight?: number }> = ({ label, val, flex, minHeight }) => (
  <View style={{ flex: flex || 1, padding: 3, borderRightWidth: 1, borderColor: C.border, borderStyle: 'solid' }}>
    <Text style={s.fieldLabel}>{label}</Text>
    <View style={[s.sigBox, minHeight ? { minHeight } : {}]}>
      <Text style={s.fieldValue}>{v(val)}</Text>
    </View>
  </View>
);

export const PhysicianSummaryTemplate: React.FC<{ data: any }> = ({ data }) => {
  const patient = data.patient || {};
  const vitals = data.vitals || {};
  const allergies = data.allergies || {};
  const continence = data.continence || {};
  const mentalStatus = data.mentalStatus || {};
  const services = data.services || {};
  const treatments = data.treatments || [];
  const medications = data.medications || [];
  const skilledTherapy = data.skilledTherapy || {};
  const provider = data.provider || {};

  const serviceOptions: string[] = services.recommended || [];

  return (
    <Document>
      <Page size="LETTER" style={s.page}>

        {/* Government header */}
        <View style={s.govHeader}>
          <Text style={s.commonwealthText}>Commonwealth of Massachusetts</Text>
          <Text style={s.execOfficeText}>Executive Office of Health and Human Services</Text>
          <Text style={s.websiteText}>www.mass.gov/masshealth</Text>
          <Text style={s.formTitleLarge}>Physician Summary Form</Text>
          <Text style={[s.tiny, { textAlign: 'right' }]}>PSF-1 (Rev. 07/10)</Text>
        </View>

        {/* Certification block */}
        <View style={s.certBox}>
          <Text style={s.certText}>
            This form verifies and validates the medical information provided by your patient or the patient's legal guardian. This form must be returned as soon as possible. Without this information, your patient's ability to initiate or continue to receive timely MassHealth services may be impacted.
          </Text>
          <Text style={[s.certText, { marginTop: 4 }]}>
            I certify that the information on this form, and any attached statement that I have provided has been reviewed and signed by me, and is true, accurate, and complete, to the best of my knowledge. I understand that I may be subject to civil penalties or criminal prosecution for any falsification, omission, or concealment of any material fact contained herein.
          </Text>
          <Text style={[s.certText, { marginTop: 3, fontStyle: 'italic' }]}>
            (Signature and date stamps, or the signature of anyone other than the provider are not acceptable.)
          </Text>
        </View>

        {/* Provider signature block */}
        <View style={[s.box, { marginBottom: 6 }]}>
          <View style={s.row}>
            <View style={{ flex: 2, borderRightWidth: 1, borderColor: C.border, borderStyle: 'solid', padding: 3 }}>
              <Text style={s.fieldLabel}>Provider's signature MD/NP/PA (Circle one.)</Text>
              <View style={s.sigBox}><Text style={s.fieldValue}>{v(provider.signature)}</Text></View>
            </View>
            <View style={{ flex: 1, borderRightWidth: 1, borderColor: C.border, borderStyle: 'solid', padding: 3 }}>
              <Text style={s.fieldLabel}>Print name:</Text>
              <View style={s.sigBox}><Text style={s.fieldValue}>{v(provider.printName)}</Text></View>
            </View>
            <View style={{ flex: 1, padding: 3 }}>
              <Text style={s.fieldLabel}>Date completed:</Text>
              <View style={s.sigBox}><Text style={s.fieldValue}>{v(provider.dateCompleted)}</Text></View>
            </View>
          </View>
          <View style={{ borderTopWidth: 1, borderColor: C.border, borderStyle: 'solid', padding: 3 }}>
            <Text style={s.fieldLabel}>Print address:</Text>
            <View style={s.sigBox}><Text style={s.fieldValue}>{v(provider.address)}</Text></View>
          </View>
        </View>

        {/* Patient demographics */}
        <View style={[s.box, { marginBottom: 6 }]}>
          <View style={s.row}>
            <View style={[s.cell, { flex: 2 }]}>
              <Text style={s.fieldLabel}>Last name</Text>
              <Text style={s.fieldValue}>{v(patient.lastName)}</Text>
            </View>
            <View style={[s.cell, { flex: 2 }]}>
              <Text style={s.fieldLabel}>First name</Text>
              <Text style={s.fieldValue}>{v(patient.firstName)}</Text>
            </View>
            <View style={[s.cell, { flex: 1 }]}>
              <Text style={s.fieldLabel}>Date of birth</Text>
              <Text style={s.fieldValue}>{v(patient.dob)}</Text>
            </View>
            <View style={{ padding: 3, width: 60 }}>
              <Text style={s.fieldLabel}>Gender</Text>
              <Text style={s.radio}>{radio(patient.gender,'M')} M  {radio(patient.gender,'F')} F</Text>
            </View>
          </View>
        </View>

        {/* Diagnosis */}
        <View style={[s.box, { marginBottom: 6 }]}>
          <View style={s.row}>
            <View style={[s.sectionCell, { borderBottomWidth: 0 }]}>
              <Text style={s.sectionCellText}>Patient Diagnosis(es)</Text>
            </View>
            <View style={{ flex: 1, padding: 3 }}>
              <View style={{ borderBottomWidth: 1, borderColor: C.border, borderStyle: 'solid', minHeight: 14, marginBottom: 3 }}>
                <Text style={s.fieldValue}>{v(patient.diagnoses)}</Text>
              </View>
              <CheckItem checked={patient.mentalIllness} label="Mental illness (indicate diagnosis):" />
              {patient.mentalIllness && (
                <View style={{ borderBottomWidth: 1, borderColor: C.border, borderStyle: 'solid', marginLeft: 12, marginBottom: 2 }}>
                  <Text style={s.fieldValue}>{v(patient.mentalIllnessDiagnosis)}</Text>
                </View>
              )}
              <View style={s.row}>
                <CheckItem checked={patient.intellectualDisability} label="Intellectual disability" />
                <View style={{ width: 10 }} />
                <CheckItem checked={patient.developmentalDisability} label="Developmental disability" />
              </View>
            </View>
          </View>
        </View>

        {/* Vital signs + clinical info */}
        <View style={[s.box, { marginBottom: 6 }]}>
          <View style={s.row}>
            {/* Vitals */}
            <View style={{ borderRightWidth: 1, borderColor: C.border, borderStyle: 'solid', padding: 3, width: 130 }}>
              <Text style={s.fieldLabel}>Recent vital signs</Text>
              <Text style={s.tiny}>Date: {v(vitals.date)}</Text>
              <Text style={s.body}>T: {v(vitals.temperature)}</Text>
              <Text style={s.body}>P: {v(vitals.pulse)}</Text>
              <Text style={s.body}>R: {v(vitals.respirations)}</Text>
              <Text style={s.body}>BP: {v(vitals.bloodPressure)}</Text>
            </View>
            {/* Allergies */}
            <View style={{ borderRightWidth: 1, borderColor: C.border, borderStyle: 'solid', padding: 3, flex: 1 }}>
              <Text style={s.fieldLabel}>Allergies</Text>
              <CheckItem checked={allergies.noKnownAllergies} label="No known allergies" />
              <CheckItem checked={allergies.noKnownDrugAllergies} label="No known drug allergies" />
              {!allergies.noKnownAllergies && !allergies.noKnownDrugAllergies && (
                <>
                  <Text style={s.tiny}>Allergies, list:</Text>
                  <Text style={s.fieldValue}>{v(allergies.list)}</Text>
                </>
              )}
            </View>
            {/* Height/Weight */}
            <View style={{ borderRightWidth: 1, borderColor: C.border, borderStyle: 'solid', padding: 3, width: 80 }}>
              <Text style={s.fieldLabel}>Height</Text>
              <View style={s.sigBox}><Text style={s.fieldValue}>{v(patient.height)}</Text></View>
              <Text style={[s.fieldLabel, { marginTop: 4 }]}>Weight</Text>
              <View style={s.sigBox}><Text style={s.fieldValue}>{v(patient.weight)}</Text></View>
            </View>
            {/* Continence */}
            <View style={{ borderRightWidth: 1, borderColor: C.border, borderStyle: 'solid', padding: 3, width: 90 }}>
              <Text style={s.fieldLabel}>Continence</Text>
              <Text style={[s.tiny, { marginBottom: 1 }]}>Bowel</Text>
              <CheckItem checked={continence.bowelContinent} label="Continent" />
              <CheckItem checked={continence.bowelIncontinent} label="Incontinent" />
              <CheckItem checked={continence.colostomy} label="Colostomy" />
              <Text style={[s.tiny, { marginTop: 3, marginBottom: 1 }]}>Bladder</Text>
              <CheckItem checked={continence.bladderContinent} label="Continent" />
              <CheckItem checked={continence.bladderIncontinent} label="Incontinent" />
              <CheckItem checked={continence.catheter} label="Catheter" />
            </View>
            {/* Mental Status */}
            <View style={{ padding: 3, width: 90 }}>
              <Text style={s.fieldLabel}>Mental Status</Text>
              <CheckItem checked={mentalStatus.alertOriented} label="Alert & oriented" />
              <CheckItem checked={mentalStatus.alertDisoriented} label="Alert & disoriented" />
              <View style={s.checkRow}>
                <View style={mentalStatus.other ? s.checkboxFilled : s.checkbox} />
                <Text style={s.checkLabel}>Other: {v(mentalStatus.otherDetail)}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Additional comments */}
        <View style={[s.box, { marginBottom: 6 }]}>
          <View style={s.row}>
            <View style={[s.sectionCell, { borderBottomWidth: 0 }]}>
              <Text style={s.sectionCellText}>Additional comments/Special needs</Text>
            </View>
            <View style={{ flex: 1, padding: 3, minHeight: 30 }}>
              <Text style={s.fieldValue}>{v(data.additionalComments)}</Text>
            </View>
          </View>
        </View>

        {/* Lab work + dates */}
        <View style={[s.box, { marginBottom: 6 }]}>
          <View style={s.row}>
            <View style={{ flex: 2, borderRightWidth: 1, borderColor: C.border, borderStyle: 'solid', padding: 3 }}>
              <Text style={s.fieldLabel}>Recent Lab work</Text>
              <View style={s.sigBox}><Text style={s.fieldValue}>{v(data.recentLabWork)}</Text></View>
            </View>
            <View style={{ flex: 1, borderRightWidth: 1, borderColor: C.border, borderStyle: 'solid', padding: 3 }}>
              <Text style={s.fieldLabel}>Date of last physical exam</Text>
              <View style={s.sigBox}><Text style={s.fieldValue}>{v(data.lastPhysicalExamDate)}</Text></View>
            </View>
            <View style={{ flex: 1, borderRightWidth: 1, borderColor: C.border, borderStyle: 'solid', padding: 3 }}>
              <Text style={s.fieldLabel}>Date of last office visit</Text>
              <View style={s.sigBox}><Text style={s.fieldValue}>{v(data.lastOfficeVisitDate)}</Text></View>
            </View>
            <View style={{ width: 80, padding: 3 }}>
              <Text style={s.fieldLabel}>Diet</Text>
              <View style={s.sigBox}><Text style={s.fieldValue}>{v(data.diet)}</Text></View>
            </View>
          </View>
        </View>

        {/* Recommended services */}
        <View style={[s.box, { marginBottom: 6 }]}>
          <View style={{ padding: 3, borderBottomWidth: 1, borderColor: C.border, borderStyle: 'solid' }}>
            <Text style={[s.fieldLabel, { fontSize: 7, textTransform: 'none' }]}>I recommend this patient for the following service(s)</Text>
          </View>
          <View style={[s.row, { padding: 3 }]}>
            {[
              ['Adult day health (ADH)','Group adult foster care (GAFC)','Adult foster care (AFC)','Program for All-inclusive Care for the Elderly (PACE)','Nursing facility (NF)'],
            ].flat().map(sv => (
              <CheckArr key={sv} arr={serviceOptions} val={sv} label={sv} />
            ))}
          </View>
        </View>

        {/* Treatments + Medications */}
        <View style={[s.box, { marginBottom: 6 }]}>
          <View style={s.row}>
            <View style={{ flex: 1, borderRightWidth: 1, borderColor: C.border, borderStyle: 'solid', padding: 3 }}>
              <Text style={s.fieldLabel}>Treatments — List type and frequency.</Text>
              {treatments.length > 0 ? (
                treatments.map((t: any, i: number) => (
                  <Text key={i} style={s.fieldValue}>{v(t.type)}{t.frequency ? ' — ' + t.frequency : ''}</Text>
                ))
              ) : (
                <>
                  <View style={[s.sigBox, { marginTop: 3 }]} />
                  <View style={[s.sigBox, { marginTop: 3 }]} />
                  <View style={[s.sigBox, { marginTop: 3 }]} />
                  <View style={[s.sigBox, { marginTop: 3 }]} />
                </>
              )}
              <Text style={[s.fieldLabel, { marginTop: 8 }]}>Skilled Therapy — Direct therapy by OT, PT, ST</Text>
              <View style={s.sigBox}><Text style={s.fieldValue}>{v(skilledTherapy.detail)}</Text></View>
            </View>
            <View style={{ flex: 1, padding: 3 }}>
              <Text style={s.fieldLabel}>Medications — List drug, dose, route, and frequency.</Text>
              <Text style={[s.tiny, { marginBottom: 2 }]}>(Use back of form for additional medications)</Text>
              {medications.length > 0 ? (
                <View style={s.box}>
                  <View style={s.tableHeader}>
                    <Text style={[s.tableCell, { flex: 2, fontFamily: 'Helvetica-Bold' }]}>Drug / Dose</Text>
                    <Text style={[s.tableCell, { flex: 1, fontFamily: 'Helvetica-Bold' }]}>Route</Text>
                    <Text style={[s.tableCell, { flex: 1, fontFamily: 'Helvetica-Bold' }]}>Frequency</Text>
                  </View>
                  {medications.map((med: any, i: number) => (
                    <View key={i} style={s.tableRow}>
                      <Text style={[s.tableCell, { flex: 2 }]}>{v(med.drug)}{med.dose ? ' / ' + med.dose : ''}</Text>
                      <Text style={[s.tableCell, { flex: 1 }]}>{v(med.route)}</Text>
                      <Text style={[s.tableCell, { flex: 1 }]}>{v(med.frequency)}</Text>
                    </View>
                  ))}
                </View>
              ) : (
                <>
                  {Array.from({ length: 8 }, (_, i) => (
                    <View key={i} style={[s.sigBox, { marginTop: 3 }]} />
                  ))}
                </>
              )}
            </View>
          </View>
        </View>

      </Page>
    </Document>
  );
};