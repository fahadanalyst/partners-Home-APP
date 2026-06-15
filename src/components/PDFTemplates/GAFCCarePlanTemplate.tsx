import React from 'react';
import { View, Text, Image, StyleSheet } from '@react-pdf/renderer';
import {
  BasePDFTemplate, shared, BRAND,
  RadioGroup, RadioCircle, CheckboxGroup,
} from './BasePDFTemplate';

const s = StyleSheet.create({
  sigLine: { height: 36, borderBottomWidth: 1, borderBottomColor: BRAND.zinc400, borderBottomStyle: 'solid', marginBottom: 4, marginTop: 8 },
  sigImg: { width: 160, height: 36, objectFit: 'contain', marginBottom: 4, marginTop: 8 },
  faRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: BRAND.zinc100,
    borderBottomStyle: 'solid',
    paddingVertical: 3,
  },
  faTask: {
    width: '24%',
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: BRAND.zinc700,
    textTransform: 'capitalize',
  },
  otherLine: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginTop: 2,
  },
  otherValue: {
    flex: 1,
    fontSize: 8,
    color: BRAND.zinc900,
    borderBottomWidth: 1,
    borderBottomColor: BRAND.zinc400,
    borderBottomStyle: 'solid',
    marginLeft: 4,
    paddingBottom: 1,
  },
});

const ADL_KEYS = ['bathing', 'dressing', 'toileting', 'ambulation', 'transfers', 'eating'];
const IADL_KEYS = ['mealPrep', 'housekeeping', 'laundry', 'medicationReminders', 'shopping'];
const ADL_LEVELS = ['Independent', 'Supervision', 'Partial Assist', 'Full Assist'];
const IADL_LEVELS = ['Independent', 'Needs Assistance'];

const ELIGIBILITY_ITEMS = [
  { key: 'assistanceWithADL', label: 'Member requires assistance with at least one ADL' },
  { key: 'approvedSetting', label: 'Member resides in a GAFC approved setting' },
  { key: 'noDuplicativeServices', label: 'No duplicative services (PCA, AFC, etc.)' },
  { key: 'dailyPersonalCare', label: 'Requires daily personal care services' },
  { key: 'monthlyCareManagement', label: 'Requires monthly care management' },
];

const PERSONAL_CARE_NEEDS = [
  'Bathing assistance', 'Dressing assistance', 'Toileting assistance',
  'Mobility support', 'Medication reminders', 'Meal preparation', 'Safety monitoring',
];
const CARE_MGMT_NEEDS = [
  'Monthly in person visit', 'Care coordination', 'Monitoring of service delivery',
  'Psychosocial support', 'Advocacy',
];
const RISKS = [
  'Fall risk', 'Medication non adherence', 'Cognitive impairment',
  'Social isolation', 'Poor nutrition', 'Behavioral health concerns',
];
const STRENGTHS = [
  'Motivated to remain independent', 'Supportive family/community',
  'Engages with staff', 'Stable medical conditions',
];
const PREFERENCES = [
  { key: 'dailyRoutines', label: 'Daily Routines' },
  { key: 'culturalReligious', label: 'Cultural / Religious Considerations' },
  { key: 'foodPreferences', label: 'Food Preferences' },
  { key: 'communicationPreferences', label: 'Communication Preferences' },
  { key: 'caregiverGenderPreference', label: 'Caregiver Gender Preference' },
  { key: 'privacyPreferences', label: 'Privacy Preferences' },
];

const prettify = (k: string) => k.replace(/([A-Z])/g, ' $1');

const Field: React.FC<{ label: string; value?: string; bold?: boolean }> = ({ label, value, bold }) => (
  <View style={{ marginBottom: 6 }}>
    <Text style={shared.label}>{label}</Text>
    <Text style={bold ? shared.valueBold : shared.value}>{value || 'N/A'}</Text>
  </View>
);

const OtherLine: React.FC<{ value?: string }> = ({ value }) => (
  <View style={s.otherLine} wrap={false}>
    <Text style={{ fontSize: 8, color: BRAND.zinc700 }}>Other:</Text>
    <Text style={s.otherValue}>{value || ' '}</Text>
  </View>
);

/** One ADL/IADL row showing ALL levels with the selected radio filled — matches the form. */
const FunctionalRow: React.FC<{ task: string; levels: string[]; value?: string }> = ({ task, levels, value }) => (
  <View style={s.faRow} wrap={false}>
    <Text style={s.faTask}>{prettify(task)}</Text>
    <View style={{ flex: 1, flexDirection: 'row', flexWrap: 'wrap' }}>
      {levels.map((level) => (
        <View key={level} style={{ flexDirection: 'row', alignItems: 'center', marginRight: 10 }}>
          <RadioCircle selected={value === level} />
          <Text style={{ fontSize: 7.5, marginLeft: 3, color: value === level ? BRAND.zinc900 : BRAND.zinc500, fontFamily: value === level ? 'Helvetica-Bold' : 'Helvetica' }}>
            {level}
          </Text>
        </View>
      ))}
    </View>
  </View>
);

export const GAFCCarePlanTemplate: React.FC<{ data: any }> = ({ data }) => {
  const ec = data.emergencyContact || {};
  const pcp = data.primaryCareProvider || {};
  const member = data.memberInfo || {};
  const dates = data.dates || {};
  const eligibility = data.eligibility || {};
  const fa = data.functionalAssessment || {};
  const needs = data.identifiedNeeds || {};
  const risk = data.riskAssessment || {};
  const prefs = data.memberPreferences || {};
  const review = data.monthlyReview || {};
  const interventions: any[] = data.interventions || [];
  const sigs = data.signatures || {};

  return (
    <BasePDFTemplate title="GAFC Care Plan" date={dates.carePlan}>
      {/* Member Info */}
      <Text style={shared.sectionTitle}>Member Information</Text>
      <View style={shared.card}>
        <View style={shared.row3}>
          <View style={shared.col3}><Field label="Member Name" value={member.name} bold /></View>
          <View style={shared.col3}><Field label="MassHealth ID" value={member.massHealthId} /></View>
          <View style={shared.col3}><Field label="Date of Birth" value={member.dob} /></View>
        </View>
        <View style={shared.row3}>
          <View style={shared.col3}><Field label="Address / Residence Type" value={member.addressResidenceType} /></View>
          <View style={shared.col3}><Field label="Primary Language" value={member.primaryLanguage} /></View>
          <View style={shared.col3}>
            <Text style={shared.label}>Interpreter Needed</Text>
            <RadioGroup options={['Yes', 'No']} value={member.interpreterNeeded} />
          </View>
        </View>
        <View style={shared.row2}>
          <View style={shared.col2}><Field label="Date of Initial Assessment" value={dates.initialAssessment} /></View>
          <View style={shared.col2}><Field label="Date of Care Plan" value={dates.carePlan} /></View>
        </View>
      </View>

      {/* Emergency & PCP */}
      <View style={shared.row2}>
        <View style={shared.col2}>
          <Text style={shared.label}>Emergency Contact</Text>
          <View style={[shared.card, { marginTop: 4 }]}>
            <Field label="Name" value={ec.name} />
            <Field label="Relationship" value={ec.relationship} />
            <Field label="Phone" value={ec.phone} />
          </View>
        </View>
        <View style={shared.col2}>
          <Text style={shared.label}>Primary Care Provider</Text>
          <View style={[shared.card, { marginTop: 4 }]}>
            <Field label="Name" value={pcp.name} />
            <Field label="Phone" value={pcp.phone} />
          </View>
        </View>
      </View>

      {/* Eligibility Confirmation */}
      <Text style={shared.sectionTitle}>Eligibility Confirmation</Text>
      <View style={shared.card}>
        <CheckboxGroup
          direction="column"
          options={ELIGIBILITY_ITEMS.map(i => i.label)}
          selected={ELIGIBILITY_ITEMS.filter(i => !!eligibility[i.key]).map(i => i.label)}
        />
      </View>

      {/* Medical Conditions */}
      <Text style={shared.sectionTitle}>Medical Conditions / Diagnoses</Text>
      <View style={[shared.card, { marginBottom: 10 }]}>
        <Text style={shared.value}>{data.medicalConditions || 'No conditions recorded'}</Text>
      </View>

      {/* Functional Assessment */}
      <Text style={shared.sectionTitle}>Functional Assessment (ADLs & IADLs)</Text>
      <View style={shared.card}>
        <Text style={[shared.label, { marginBottom: 4 }]}>Activities of Daily Living</Text>
        {ADL_KEYS.map((adl) => (
          <FunctionalRow key={adl} task={adl} levels={ADL_LEVELS} value={fa[adl]} />
        ))}
        <Text style={[shared.label, { marginTop: 8, marginBottom: 4 }]}>Instrumental ADLs</Text>
        {IADL_KEYS.map((iadl) => (
          <FunctionalRow key={iadl} task={iadl} levels={IADL_LEVELS} value={fa[iadl]} />
        ))}
        {!!fa.notes && (
          <View style={{ marginTop: 6 }}>
            <Text style={shared.label}>Notes</Text>
            <Text style={shared.value}>{fa.notes}</Text>
          </View>
        )}
      </View>

      {/* Goals */}
      <Text style={shared.sectionTitle}>Member Centered Goals</Text>
      <View style={shared.card}>
        <Text style={shared.label}>A. Member's Own Goals (in their words)</Text>
        <Text style={[shared.value, { marginBottom: 8, fontStyle: 'italic' }]}>"{data.goals?.memberGoals || 'N/A'}"</Text>
        <Text style={shared.label}>B. Provider Goals</Text>
        <Text style={shared.value}>{data.goals?.providerGoals || 'N/A'}</Text>
      </View>

      {/* Identified Needs & Services */}
      <Text style={shared.sectionTitle}>Identified Needs & Services</Text>
      <View style={[shared.card]}>
        <View style={shared.row2}>
          <View style={shared.col2}>
            <Text style={[shared.label, { marginBottom: 4 }]}>Personal Care Needs</Text>
            <CheckboxGroup direction="column" options={PERSONAL_CARE_NEEDS} selected={needs.personalCare} />
            <OtherLine value={needs.personalCareOther} />
          </View>
          <View style={shared.col2}>
            <Text style={[shared.label, { marginBottom: 4 }]}>Care Management Needs</Text>
            <CheckboxGroup direction="column" options={CARE_MGMT_NEEDS} selected={needs.careManagement} />
            <OtherLine value={needs.careManagementOther} />
          </View>
        </View>
      </View>

      {/* Interventions Table */}
      <Text style={shared.sectionTitle}>Interventions, Frequency & Responsible Party</Text>
      <View style={shared.table}>
        <View style={shared.tableHeader}>
          <Text style={[shared.tableHeaderCell, { flex: 2 }]}>Need / Goal</Text>
          <Text style={[shared.tableHeaderCell, { flex: 2 }]}>Intervention</Text>
          <Text style={[shared.tableHeaderCell, { flex: 1.5 }]}>Responsible Party</Text>
          <Text style={[shared.tableHeaderCell, { flex: 1 }]}>Frequency</Text>
        </View>
        {interventions.length > 0 ? interventions.map((item: any, idx: number) => (
          <View key={idx} style={shared.tableRow}>
            <Text style={[idx % 2 === 0 ? shared.tableCell : shared.tableCellAlt, { flex: 2 }]}>{item.needGoal}</Text>
            <Text style={[idx % 2 === 0 ? shared.tableCell : shared.tableCellAlt, { flex: 2 }]}>{item.intervention}</Text>
            <Text style={[idx % 2 === 0 ? shared.tableCell : shared.tableCellAlt, { flex: 1.5 }]}>{item.responsibleParty}</Text>
            <Text style={[idx % 2 === 0 ? shared.tableCell : shared.tableCellAlt, { flex: 1 }]}>{item.frequency}</Text>
          </View>
        )) : (
          <View style={shared.tableRow}>
            <Text style={[shared.tableCell, { flex: 1, textAlign: 'center', color: BRAND.zinc400 }]}>No interventions listed</Text>
          </View>
        )}
      </View>

      {/* Risk Assessment */}
      <Text style={shared.sectionTitle}>Risk Assessment</Text>
      <View style={shared.card}>
        <View style={shared.row2}>
          <View style={shared.col2}>
            <Text style={[shared.label, { marginBottom: 4 }]}>Risks Identified</Text>
            <CheckboxGroup direction="column" options={RISKS} selected={risk.risks} />
            <OtherLine value={risk.risksOther} />
          </View>
          <View style={shared.col2}>
            <Text style={[shared.label, { marginBottom: 4 }]}>Mitigation Strategies</Text>
            <Text style={shared.value}>{risk.mitigationStrategies || 'N/A'}</Text>
          </View>
        </View>
      </View>

      {/* Member Strengths */}
      <Text style={shared.sectionTitle}>Member Strengths</Text>
      <View style={shared.card}>
        <CheckboxGroup direction="column" options={STRENGTHS} selected={data.memberStrengths} />
        <OtherLine value={data.memberStrengthsOther} />
      </View>

      {/* Member Preferences */}
      <Text style={shared.sectionTitle}>Member Preferences</Text>
      <View style={shared.card}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {PREFERENCES.map(pref => (
            <View key={pref.key} style={{ width: '50%', paddingRight: 8 }}>
              <Field label={pref.label} value={prefs[pref.key]} />
            </View>
          ))}
        </View>
      </View>

      {/* Monthly Care Management Review */}
      <Text style={shared.sectionTitle}>Monthly Care Management Review</Text>
      <View style={shared.card}>
        <View style={shared.row2}>
          <View style={shared.col2}><Field label="Monthly Visit Completed By" value={review.completedBy} /></View>
          <View style={shared.col2}><Field label="Observations" value={review.observations} /></View>
        </View>
        <View style={shared.row2}>
          <View style={shared.col2}><Field label="Changes in Condition" value={review.changesInCondition} /></View>
          <View style={shared.col2}><Field label="Medication Changes" value={review.medicationChanges} /></View>
        </View>
        <View style={shared.row2}>
          <View style={shared.col2}><Field label="Referrals Made" value={review.referralsMade} /></View>
          <View style={shared.col2}>
            <Text style={shared.label}>Care Plan Updated</Text>
            <RadioGroup options={['Yes', 'No']} value={review.carePlanUpdated} />
          </View>
        </View>
      </View>

      {/* Signatures */}
      <Text style={shared.sectionTitle}>Care Plan Agreement</Text>
      <View style={[shared.row2, { marginTop: 4 }]}>
        <View style={shared.col2}>
          <Text style={shared.label}>Member Signature</Text>
          {sigs.memberSignature ? <Image src={sigs.memberSignature} style={s.sigImg} /> : <View style={s.sigLine} />}
          <Text style={shared.valueBold}>{member.name || ''}</Text>
          <Text style={shared.muted}>Date: {sigs.memberDate || 'N/A'}</Text>
        </View>
        <View style={shared.col2}>
          <Text style={shared.label}>Care Manager Signature</Text>
          {sigs.careManagerSignature ? <Image src={sigs.careManagerSignature} style={s.sigImg} /> : <View style={s.sigLine} />}
          <Text style={shared.valueBold}>Care Manager</Text>
          <Text style={shared.muted}>Date: {sigs.careManagerDate || 'N/A'}</Text>
        </View>
      </View>
      <View style={[shared.row2, { marginTop: 10, paddingTop: 8, borderTopWidth: 1, borderTopColor: BRAND.zinc200, borderTopStyle: 'solid' }]}>
        <View style={shared.col2}><Field label="Nurse Reviewer (if applicable)" value={sigs.nurseReviewer} /></View>
        <View style={shared.col2}><Field label="Date" value={sigs.nurseDate} /></View>
      </View>
    </BasePDFTemplate>
  );
};