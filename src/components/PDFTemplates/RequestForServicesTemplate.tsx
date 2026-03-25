/**
 * MassHealth Request for Services (RFS-1, Rev. 10/02)
 * Exact replication of the official government form layout.
 */
import React from 'react';
import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer';

const C = { black: '#000000', white: '#ffffff', gray: '#f0f0f0', border: '#000000', blue: '#003366' };

const s = StyleSheet.create({
  page: {
    backgroundColor: C.white,
    paddingTop: 22,
    paddingBottom: 22,
    paddingHorizontal: 28,
    fontFamily: 'Helvetica',
    fontSize: 7.5,
    color: C.black,
  },
  // Header
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 6 },
  massHealthLogo: { fontSize: 16, fontFamily: 'Helvetica-Bold', color: C.blue, marginRight: 10 },
  formTitleLarge: { fontSize: 16, fontFamily: 'Helvetica-Bold', color: C.black },
  dateRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  dateLine: { fontSize: 8 },
  dateUnderline: { flex: 1, borderBottomWidth: 1, borderColor: C.black, borderStyle: 'solid', marginLeft: 8, height: 12 },
  // Section headers
  sectionHeading: { fontSize: 11, fontFamily: 'Helvetica-Bold', marginTop: 8, marginBottom: 4 },
  subHeading: { fontSize: 8, fontFamily: 'Helvetica-Bold', marginBottom: 3 },
  // Table / box
  box: { borderWidth: 1, borderColor: C.border, borderStyle: 'solid', marginBottom: 6 },
  row: { flexDirection: 'row' },
  cell: { borderRightWidth: 1, borderColor: C.border, borderStyle: 'solid', padding: 3 },
  cellNoBorder: { padding: 3, flex: 1 },
  // Field
  fieldBox: {
    borderWidth: 1, borderColor: C.border, borderStyle: 'solid',
    padding: 3, minHeight: 18, marginBottom: 3,
  },
  fieldLabel: { fontSize: 6, color: '#555555', marginBottom: 1 },
  fieldValue: { fontSize: 8 },
  // Checkbox
  checkRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 2 },
  checkbox: { width: 8, height: 8, borderWidth: 1, borderColor: C.border, borderStyle: 'solid', marginRight: 4, marginTop: 0.5 },
  checkboxFilled: { width: 8, height: 8, borderWidth: 1, borderColor: C.border, borderStyle: 'solid', marginRight: 4, marginTop: 0.5, backgroundColor: C.black },
  checkLabel: { fontSize: 7, flex: 1 },
  // Radio
  radioRow: { flexDirection: 'row', alignItems: 'center', marginRight: 12 },
  radioLabel: { fontSize: 7 },
  // Yes/No
  yesno: { flexDirection: 'row', gap: 8 },
  // Signature
  sigLine: { borderBottomWidth: 1, borderColor: C.border, borderStyle: 'solid', minHeight: 16, marginBottom: 2, marginTop: 4 },
  tiny: { fontSize: 6, color: '#555555' },
  bold: { fontFamily: 'Helvetica-Bold' },
  body: { fontSize: 7.5 },
  footnote: { fontSize: 5.5, color: '#555555', marginTop: 6 },
  pageNum: { fontSize: 6, textAlign: 'right', marginBottom: 4 },
  borderBox: {
    borderWidth: 1.5, borderColor: C.black, borderStyle: 'solid', padding: 5, marginBottom: 5,
  },
});

const v = (val: any) => (val != null && val !== '') ? String(val) : '';
const bool = (val: any) => val ? '■' : '□';
const radio = (val: any, match: string) => val === match ? '●' : '○';

const CheckItem: React.FC<{ checked?: boolean; label: string; small?: boolean }> = ({ checked, label, small }) => (
  <View style={s.checkRow}>
    <View style={checked ? s.checkboxFilled : s.checkbox} />
    <Text style={[s.checkLabel, small ? { fontSize: 6.5 } : {}]}>{label}</Text>
  </View>
);

const CheckArr: React.FC<{ arr?: string[]; val: string; label: string; small?: boolean }> = ({ arr, val, label, small }) => (
  <CheckItem checked={arr?.includes(val)} label={label} small={small} />
);

const Field2: React.FC<{ label: string; val: any; flex?: number }> = ({ label, val, flex }) => (
  <View style={[s.fieldBox, { flex: flex || 1 }]}>
    <Text style={s.fieldLabel}>{label}</Text>
    <Text style={s.fieldValue}>{v(val)}</Text>
  </View>
);

const YesNo: React.FC<{ val?: boolean | string; label: string }> = ({ val, label }) => {
  const isYes = val === true || val === 'yes' || val === '1';
  const isNo = val === false || val === 'no' || val === '0';
  return (
    <View style={[s.checkRow, { marginBottom: 3 }]}>
      <Text style={[s.body, { flex: 1 }]}>{label}</Text>
      <Text style={[s.body, { width: 60 }]}>{isYes ? '■ yes' : '□ yes'}  {isNo ? '■ no' : '□ no'}</Text>
    </View>
  );
};

export const RequestForServicesTemplate: React.FC<{ data: any }> = ({ data }) => {
  const member = data.member || {};
  const nextOfKin = data.nextOfKin || {};
  const physician = data.physician || {};
  const services = data.services || {};
  const screening = data.screening || {};
  const community = data.community || {};
  const additional = data.additional || {};
  const nf = data.nursingFacility || {};
  const referral = data.referral || {};

  const communityServices: string[] = community.services || [];
  const requestedServices: string[] = services.requested || [];
  const nfServices: string[] = services.nursingFacility || [];
  const devDisability: string[] = screening.developmentalDisabilityConditions || [];

  return (
    <Document>
      {/* ═══════ PAGE 1 ═══════ */}
      <Page size="LETTER" style={s.page}>
        <Text style={s.pageNum}>RFS-1 (Rev. 10/02)</Text>

        {/* MassHealth header */}
        <View style={s.headerRow}>
          <View style={{ marginRight: 14 }}>
            <Text style={[s.massHealthLogo]}>MassHealth</Text>
          </View>
          <Text style={s.formTitleLarge}>Request for Services</Text>
        </View>
        <View style={s.dateRow}>
          <Text style={s.dateLine}>Date</Text>
          <View style={s.dateUnderline}><Text style={s.body}>{v(data.date)}</Text></View>
        </View>

        {/* Type of clinical eligibility determination */}
        <Text style={[s.sectionHeading]}>Type of clinical eligibility determination</Text>
        <Text style={[s.body, { marginBottom: 4 }]}>all requested services.</Text>
        <View style={s.borderBox}>
          <View style={s.row}>
            {/* Left col — Services requested */}
            <View style={{ flex: 2, borderRightWidth: 1, borderColor: C.black, borderStyle: 'solid', paddingRight: 6 }}>
              <Text style={[s.body, s.bold, { marginBottom: 3 }]}>Service(s) requested</Text>
              {['Pre-admission nursing facility (NF)','Adult day health (ADH)','Adult foster care (AFC)','Group adult foster care (GAFC)'].map(sv => (
                <CheckArr key={sv} arr={requestedServices} val={sv} label={sv} />
              ))}
              <View style={{ marginTop: 3 }}>
                <CheckArr arr={requestedServices} val="Home and community based services (HCBS) waiver" label="Home and community based services (HCBS) waiver" />
                <CheckArr arr={requestedServices} val="Program for All-inclusive Care for the Elderly (PACE)" label="Program for All-inclusive Care for the Elderly (PACE)" />
                <View style={s.checkRow}>
                  <View style={requestedServices.includes('Other') ? s.checkboxFilled : s.checkbox} />
                  <Text style={s.checkLabel}>Other <Text style={{ borderBottomWidth: 1 }}>{v(services.otherDetail)}</Text></Text>
                </View>
              </View>
            </View>
            {/* Right col — Nursing facility use only */}
            <View style={{ flex: 1, paddingLeft: 6 }}>
              <Text style={[s.body, s.bold, { marginBottom: 3 }]}>Nursing facility use only</Text>
              {['Conversion','Continued stay','Short term review','Transfer NF to NF','Retrospective'].map(sv => (
                <CheckArr key={sv} arr={nfServices} val={sv} label={sv} />
              ))}
            </View>
          </View>
        </View>

        {/* Member information */}
        <Text style={s.sectionHeading}>Member information</Text>
        <Text style={s.subHeading}>Member/applicant</Text>
        <View style={s.row}>
          <Field2 label="Last name" val={member.lastName} flex={1} />
          <View style={{ width: 4 }} />
          <Field2 label="First name" val={member.firstName} flex={1} />
          <View style={{ width: 4 }} />
          <Field2 label="Telephone" val={member.telephone} flex={1} />
        </View>
        <View style={s.row}>
          <Field2 label="Address" val={member.address} flex={2} />
          <View style={{ width: 4 }} />
          <Field2 label="City" val={member.city} flex={1} />
          <View style={{ width: 4 }} />
          <Field2 label="Zip" val={member.zip} flex={0.6} />
        </View>
        {/* Check one row */}
        <View style={[s.borderBox, { paddingVertical: 3 }]}>
          <View style={s.row}>
            <View style={{ flex: 1 }}>
              <Text style={[s.tiny, { marginBottom: 2 }]}>Check one</Text>
              <CheckItem checked={member.massHealthMember} label="MassHealth member" />
              <CheckItem checked={member.massHealthApplicationPending} label="MassHealth application pending" />
              <CheckItem checked={member.gafcAssistedLiving} label="GAFC/Assisted living residence" />
            </View>
            <View style={{ flex: 1 }}>
              <View style={s.sigLine}><Text style={s.tiny}>MassHealth ID number</Text><Text style={s.body}>{v(member.massHealthId)}</Text></View>
              <View style={s.sigLine}><Text style={s.tiny}>Date application filed</Text><Text style={s.body}>{v(member.dateApplicationFiled)}</Text></View>
              <View style={s.sigLine}><Text style={s.tiny}>Date SSI-G application filed</Text><Text style={s.body}>{v(member.dateSSIGFiled)}</Text></View>
            </View>
          </View>
        </View>

        {/* Next of kin */}
        <Text style={s.subHeading}>Next of kin/Responsible party</Text>
        <View style={s.row}>
          <Field2 label="Last name" val={nextOfKin.lastName} flex={1} />
          <View style={{ width: 4 }} />
          <Field2 label="First name" val={nextOfKin.firstName} flex={1} />
          <View style={{ width: 4 }} />
          <Field2 label="Telephone" val={nextOfKin.telephone} flex={1} />
        </View>
        <View style={s.row}>
          <Field2 label="Address" val={nextOfKin.address} flex={2} />
          <View style={{ width: 4 }} />
          <Field2 label="City" val={nextOfKin.city} flex={1} />
          <View style={{ width: 4 }} />
          <Field2 label="Zip" val={nextOfKin.zip} flex={0.6} />
        </View>

        {/* Physician */}
        <Text style={s.subHeading}>Physician</Text>
        <View style={s.row}>
          <Field2 label="Last name" val={physician.lastName} flex={1} />
          <View style={{ width: 4 }} />
          <Field2 label="First name" val={physician.firstName} flex={1} />
          <View style={{ width: 4 }} />
          <Field2 label="Telephone" val={physician.telephone} flex={1} />
        </View>
        <View style={s.row}>
          <Field2 label="Address" val={physician.address} flex={2} />
          <View style={{ width: 4 }} />
          <Field2 label="City" val={physician.city} flex={1} />
          <View style={{ width: 4 }} />
          <Field2 label="Zip" val={physician.zip} flex={0.6} />
        </View>

        {/* Screening */}
        <Text style={s.sectionHeading}>Screening for mental illness, mental retardation, and developmental disability</Text>
        <View style={s.borderBox}>
          <Text style={[s.body, s.bold, { marginBottom: 4 }]}>Does the member/applicant have any of the following diagnoses/conditions? Check all that apply.</Text>
          <View style={s.checkRow}>
            <View style={screening.mentalIllness ? s.checkboxFilled : s.checkbox} />
            <Text style={s.checkLabel}>Mental illness   Specify: <Text style={{ borderBottomWidth: 1 }}>{v(screening.mentalIllnessSpec)}</Text></Text>
          </View>
          <CheckItem checked={screening.mentalRetardation} label="Mental retardation without related condition" />
          <View style={[s.checkRow, { marginBottom: 4 }]}>
            <View style={screening.developmentalDisability ? s.checkboxFilled : s.checkbox} />
            <Text style={s.checkLabel}>Developmental disability with related condition that occurred prior to age 22. <Text style={s.bold}>Check all that apply.</Text></Text>
          </View>
          <View style={s.row}>
            <View style={{ flex: 1 }}>
              {['Autism','Blindness/severe visual impairment','Cerebral palsy','Cystic fibrosis'].map(c => (
                <CheckArr key={c} arr={devDisability} val={c} label={c} small />
              ))}
            </View>
            <View style={{ flex: 1 }}>
              {['Deafness/severe hearing impairment','Epilepsy/seizure disorder','Head/brain injury','Major mental illness'].map(c => (
                <CheckArr key={c} arr={devDisability} val={c} label={c} small />
              ))}
            </View>
            <View style={{ flex: 1 }}>
              {['Multiple sclerosis','Muscular dystrophy','Orthopedic impairment','Speech/language impairment'].map(c => (
                <CheckArr key={c} arr={devDisability} val={c} label={c} small />
              ))}
            </View>
            <View style={{ flex: 1 }}>
              {['Severe learning disability','Spina bifida','Spinal cord injury'].map(c => (
                <CheckArr key={c} arr={devDisability} val={c} label={c} small />
              ))}
            </View>
          </View>
        </View>

        <Text style={s.pageNum}>OVER</Text>
      </Page>

      {/* ═══════ PAGE 2 ═══════ */}
      <Page size="LETTER" style={s.page}>
        {/* Community services recommended */}
        <Text style={s.sectionHeading}>Community services recommended</Text>
        <Text style={[s.body, { marginBottom: 4 }]}>Check all that apply.</Text>
        <View style={s.row}>
          {[
            ['Skilled nursing','Physical therapy','Occupational therapy','Speech therapy','Mental health services','Social worker services'],
            ['HCBS waiver','Personal emergency response system','Adult foster care','Group adult foster care','Assisted living','Congregate housing'],
            ['Rest home','Elderly housing','Adult day health','PACE','Home health aide','Personal care/homemaker'],
            ['Homemaker','Meals','Transportation','Chore service','Grocery shopping/delivery','Other:'],
          ].map((col, ci) => (
            <View key={ci} style={{ flex: 1 }}>
              {col.map(sv => (
                sv === 'Other:' ? (
                  <View key={sv} style={s.checkRow}>
                    <View style={communityServices.includes('Other') ? s.checkboxFilled : s.checkbox} />
                    <Text style={s.checkLabel}>Other: {v(community.otherService)}</Text>
                  </View>
                ) : (
                  <CheckArr key={sv} arr={communityServices} val={sv} label={sv} small />
                )
              ))}
            </View>
          ))}
        </View>

        {/* Additional information */}
        <Text style={[s.sectionHeading, { marginTop: 6 }]}>Additional information</Text>
        <YesNo val={additional.homeAvailable} label="1. Is the home or apartment available for the member or applicant?" />
        <YesNo val={additional.caregiverAvailable} label="2. Is there a caregiver to assist the member in the community?" />
        <YesNo val={additional.unexplainedWeightGain} label="3. Has the member or applicant experienced unexplained weight gain in the last 30 days?" />
        <YesNo val={additional.receivesPersonalCare} label="4. Does the member or applicant receive personal care/homemaker services?" />
        {(additional.receivesPersonalCare === true || additional.receivesPersonalCare === '1') && (
          <View style={[s.row, { marginLeft: 20, marginBottom: 3 }]}>
            <Text style={s.body}>If yes:  {v(additional.personalCareDaysPerWeek) || '___'} days per week    {v(additional.personalCareHoursPerWeek) || '___'} hours per week</Text>
          </View>
        )}
        <YesNo val={additional.significantChangeInCondition} label="5. Has the member or applicant experienced a significant change in condition in the last 30 days?" />
        {(additional.significantChangeInCondition === true || additional.significantChangeInCondition === '1') && (
          <View style={{ marginLeft: 20, marginBottom: 3 }}>
            <Text style={s.body}>If yes:  {bool(additional.changeImprovement)} improvement    {bool(additional.changeDeterioration)} deterioration</Text>
            <Text style={[s.body, { marginTop: 2 }]}>Indicate the changes below:</Text>
            <View style={[s.sigLine, { marginTop: 3 }]}><Text style={s.body}>{v(additional.changeDescription)}</Text></View>
          </View>
        )}

        {/* For nursing facility requests only */}
        <Text style={[s.sectionHeading, { marginTop: 6 }]}>For nursing facility requests only</Text>
        <YesNo val={nf.expressInterestToReturnToCommunity} label="1. Does the nursing facility member/applicant express an interest to remain in or return to the community?" />
        <YesNo val={nf.shortTermStay} label="2. Is the nursing facility stay expected to be short-term (up to 90 days)?" />
        <YesNo val={nf.longTermStay} label="3. Is the nursing facility stay expected to be long-term (more than 90 days)?" />

        {/* Referral source / Signature */}
        <View style={[s.row, { marginTop: 8 }]}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <Text style={s.tiny}>Referral source</Text>
            <View style={s.sigLine}><Text style={s.body}>{v(referral.source)}</Text></View>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.tiny}>Name of registered nurse completing this form</Text>
            <View style={s.sigLine}><Text style={s.body}>{v(referral.nurseName)}</Text></View>
          </View>
        </View>
        <View style={{ marginTop: 4 }}>
          <Text style={s.tiny}>For community providers: Attach the MDS-HC and Physician's Summary form according to provider's regulations/guidelines.</Text>
          <Text style={s.tiny}>For nursing facility providers: Attach the most recent comprehensive MDS, current quarterly MDS, and current physician orders.</Text>
        </View>
        <View style={[s.row, { marginTop: 8 }]}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <Text style={s.tiny}>Signature</Text>
            <View style={s.sigLine}><Text style={s.body}>{v(referral.signature)}</Text></View>
          </View>
          <View style={{ flex: 1, marginRight: 8 }}>
            <Text style={s.tiny}>Print name</Text>
            <View style={s.sigLine}><Text style={s.body}>{v(referral.printName)}</Text></View>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.tiny}>Title</Text>
            <View style={s.sigLine}><Text style={s.body}>{v(referral.title)}</Text></View>
          </View>
        </View>
        <View style={[s.row, { marginTop: 4 }]}>
          <View style={{ flex: 2, marginRight: 8 }}>
            <Text style={s.tiny}>Name of organization</Text>
            <View style={s.sigLine}><Text style={s.body}>{v(referral.organization)}</Text></View>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.tiny}>Telephone</Text>
            <View style={s.sigLine}><Text style={s.body}>{v(referral.telephone)}</Text></View>
          </View>
        </View>
        <View style={{ marginTop: 4 }}>
          <Text style={s.tiny}>Address</Text>
          <View style={s.row}>
            <View style={[s.sigLine, { flex: 2, marginRight: 8 }]}><Text style={s.body}>{v(referral.address)}</Text></View>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={s.tiny}>City</Text>
              <View style={s.sigLine}><Text style={s.body}>{v(referral.city)}</Text></View>
            </View>
            <View style={{ flex: 0.6 }}>
              <Text style={s.tiny}>Zip</Text>
              <View style={s.sigLine}><Text style={s.body}>{v(referral.zip)}</Text></View>
            </View>
          </View>
        </View>
        <View style={{ marginTop: 6 }}>
          <Text style={s.tiny}>Name of member/applicant</Text>
          <View style={s.sigLine}><Text style={s.body}>{v(`${member.firstName || ''} ${member.lastName || ''}`.trim())}</Text></View>
        </View>
        <Text style={[s.pageNum, { marginTop: 8 }]}>RFS-1 (Rev. 10/02)</Text>
      </Page>
    </Document>
  );
};