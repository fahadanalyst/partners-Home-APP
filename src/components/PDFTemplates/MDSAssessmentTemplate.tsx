import React from 'react';
import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer';
import { PDFHeader, PDFFooter, shared, BRAND } from './BasePDFTemplate';

const s = StyleSheet.create({
  checkbox: { width: 9, height: 9, borderWidth: 1, borderColor: BRAND.zinc400, borderStyle: 'solid', borderRadius: 1, marginRight: 4 },
  checkboxFilled: { width: 9, height: 9, backgroundColor: BRAND.zinc900, borderWidth: 1, borderColor: BRAND.zinc400, borderStyle: 'solid', borderRadius: 1, marginRight: 4 },
  checkRow: { flexDirection: 'row', alignItems: 'center', marginRight: 10, marginBottom: 3 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 3 },
  tag: { backgroundColor: BRAND.zinc100, borderRadius: 3, paddingHorizontal: 5, paddingVertical: 2 },
  tagText: { fontSize: 7, color: BRAND.zinc700 },
});

const Field: React.FC<{ label: string; value?: any }> = ({ label, value }) => (
  <View style={{ marginBottom: 6 }}>
    <Text style={shared.label}>{label}</Text>
    <Text style={shared.value}>{value != null && value !== '' ? String(value) : 'N/A'}</Text>
  </View>
);

const Check: React.FC<{ label: string; checked?: boolean | null }> = ({ label, checked }) => (
  <View style={s.checkRow}>
    <View style={checked ? s.checkboxFilled : s.checkbox} />
    <Text style={{ fontSize: 8, color: BRAND.zinc500 }}>{label}</Text>
  </View>
);

const Tags: React.FC<{ label: string; values?: string[] }> = ({ label, values }) => (
  <View style={{ marginBottom: 6 }}>
    <Text style={shared.label}>{label}</Text>
    {Array.isArray(values) && values.length > 0 ? (
      <View style={s.tagRow}>
        {values.map((v, i) => (
          <View key={i} style={s.tag}><Text style={s.tagText}>{v}</Text></View>
        ))}
      </View>
    ) : (
      <Text style={shared.value}>None</Text>
    )}
  </View>
);

const SecTitle: React.FC<{ children: string }> = ({ children }) => (
  <Text style={[shared.sectionTitle, { marginTop: 6 }]}>{children}</Text>
);

export const MDSAssessmentTemplate: React.FC<{ data: any }> = ({ data }) => {
  const aa = data.sectionAA  || {};
  const bb = data.sectionBB  || {};
  const cc = data.sectionCC  || {};
  const sA = data.sectionA   || {};
  const sB = data.sectionB   || {};
  const sC = data.sectionC   || {};
  const sD = data.sectionD   || {};
  const sE = data.sectionE   || {};
  const sG = data.sectionG   || {};
  const sH = data.sectionH   || {};
  const sI = data.sectionI   || {};
  const sJ = data.sectionJ   || {};
  const sK = data.sectionK   || {};
  const sL = data.sectionL   || {};
  const sM = data.sectionM   || {};
  const sN = data.sectionN   || {};
  const sO = data.sectionO   || {};
  const sQ = data.sectionQ   || {};

  const genderMap: Record<string, string> = { '1': 'Male', '2': 'Female' };
  const patientName = [aa.firstName, aa.middleInitial, aa.lastName].filter(Boolean).join(' ') || 'N/A';

  return (
    <Document>
      {/* ── PAGE 1: Identification, Demographics, Referral, Cognitive, Communication ── */}
      <Page size="A4" style={shared.page}>
        <PDFHeader title="MDS Assessment" date={data.assessmentDate} />

        <SecTitle>AA. Identification Information</SecTitle>
        <View style={shared.card}>
          <View style={shared.row2}>
            <View style={shared.col2}><Field label="Patient Name" value={patientName} /></View>
            <View style={shared.col2}><Field label="Assessment Date" value={data.assessmentDate} /></View>
          </View>
          <View style={shared.row4}>
            <View style={shared.col4}><Field label="Case Record No." value={aa.caseRecordNo} /></View>
            <View style={shared.col4}><Field label="SSN" value={aa.ssn} /></View>
            <View style={shared.col4}><Field label="Health Insurance No." value={aa.healthInsuranceNo} /></View>
            <View style={shared.col4}><Field label="Assessment Ref. Date" value={sA.assessmentReferenceDate} /></View>
          </View>
          <Field label="Reason for Assessment" value={sA.reasonForAssessment} />
        </View>

        <SecTitle>BB. Demographic Information</SecTitle>
        <View style={shared.card}>
          <View style={shared.row4}>
            <View style={shared.col4}><Field label="Gender" value={genderMap[bb.gender] || bb.gender} /></View>
            <View style={shared.col4}><Field label="Birthdate" value={bb.birthdate} /></View>
            <View style={shared.col4}><Field label="Marital Status" value={bb.maritalStatus} /></View>
            <View style={shared.col4}><Field label="Education" value={bb.education} /></View>
          </View>
          <Tags label="Race / Ethnicity" values={bb.race} />
          <View style={{ flexDirection: 'row', gap: 16, marginTop: 4 }}>
            <Check label="Legal Guardian" checked={bb.legalGuardian} />
            <Check label="Advanced Directives" checked={bb.advancedDirectives} />
          </View>
        </View>

        <SecTitle>CC. Referral Information</SecTitle>
        <View style={shared.card}>
          <View style={shared.row2}>
            <View style={shared.col2}><Field label="Date Opened" value={cc.dateOpened} /></View>
            <View style={shared.col2}><Field label="Reason for Referral" value={cc.reasonForReferral} /></View>
          </View>
          <Tags label="Goals of Care" values={cc.goalsOfCare} />
          <View style={shared.row2}>
            <View style={shared.col2}><Field label="Where Lived at Referral" value={cc.whereLivedAtReferral} /></View>
            <View style={shared.col2}><Field label="Who Lived With" value={cc.whoLivedWithAtReferral} /></View>
          </View>
        </View>

        <SecTitle>B. Cognitive Patterns</SecTitle>
        <View style={shared.card}>
          <View style={shared.row2}>
            <View style={shared.col2}><Field label="Memory Recall" value={sB.memoryRecall} /></View>
            <View style={shared.col2}><Field label="Cognitive Skills" value={sB.cognitiveSkills} /></View>
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 4 }}>
            <Check label="Short-term Memory Problem" checked={sB.shortTermMemory} />
            <Check label="Procedural Memory Problem" checked={sB.proceduralMemory} />
            <Check label="Decision Making Decline" checked={sB.decisionMakingDecline} />
            <Check label="Delirium — Sudden Onset" checked={sB.deliriumSuddenOnset} />
            <Check label="Delirium — Agitated" checked={sB.deliriumAgitated} />
          </View>
        </View>

        <SecTitle>C. Communication / Hearing</SecTitle>
        <View style={shared.card}>
          <View style={shared.row3}>
            <View style={shared.col3}><Field label="Hearing" value={sC.hearing} /></View>
            <View style={shared.col3}><Field label="Making Self Understood" value={sC.makingSelfUnderstood} /></View>
            <View style={shared.col3}><Field label="Understanding Others" value={sC.abilityToUnderstandOthers} /></View>
          </View>
          <Check label="Communication Decline" checked={sC.communicationDecline} />
        </View>

        <SecTitle>D. Vision</SecTitle>
        <View style={shared.card}>
          <View style={{ flexDirection: 'row', gap: 16, alignItems: 'center' }}>
            <View style={{ flex: 1 }}><Field label="Vision" value={sD.vision} /></View>
            <View style={{ flexDirection: 'row', gap: 12, flex: 1 }}>
              <Check label="Visual Limitations" checked={sD.visualLimitations} />
              <Check label="Vision Decline" checked={sD.visionDecline} />
            </View>
          </View>
        </View>

        <PDFFooter formName="MDS Assessment" />
      </Page>

      {/* ── PAGE 2: Mood, Functional Status, Continence, Diagnoses, Medications ── */}
      <Page size="A4" style={shared.page}>
        <PDFHeader title="MDS Assessment (cont.)" />

        <SecTitle>E. Mood / Behavior</SecTitle>
        <View style={shared.card}>
          <View style={shared.row2}>
            <View style={shared.col2}><Field label="Sadness Indicators" value={sE.sadness} /></View>
            <View style={shared.col2}><Field label="Anger / Conflict" value={sE.anger} /></View>
          </View>
          <View style={shared.row2}>
            <View style={shared.col2}><Field label="Unrealistic Fears" value={sE.unrealisticFears} /></View>
            <View style={shared.col2}><Field label="Repetitive Anxious Complaints" value={sE.repetitiveAnxiousComplaints} /></View>
          </View>
        </View>

        <SecTitle>G. Primary Caregiver / Support</SecTitle>
        <View style={shared.card}>
          <View style={shared.row3}>
            <View style={shared.col3}><Field label="Primary Helper" value={sG.primaryHelper?.name} /></View>
            <View style={shared.col3}><Field label="Relationship" value={sG.primaryHelper?.relationship} /></View>
            <View style={shared.col3}><Check label="Lives with Client" checked={sG.primaryHelper?.livesWithClient} /></View>
          </View>
          <Tags label="Areas of Help" values={sG.primaryHelper?.areasOfHelp} />
        </View>

        <SecTitle>H. Functional Status (IADLs)</SecTitle>
        <View style={shared.table}>
          <View style={shared.tableHeader}>
            <Text style={[shared.tableHeaderCell, { flex: 2 }]}>Activity</Text>
            <Text style={[shared.tableHeaderCell, { flex: 1 }]}>Performance</Text>
            <Text style={[shared.tableHeaderCell, { flex: 1 }]}>Difficulty</Text>
          </View>
          {Object.entries(sH.iadl || {}).map(([key, val]: [string, any], i) => (
            <View key={key} style={shared.tableRow}>
              <Text style={[i % 2 === 0 ? shared.tableCell : shared.tableCellAlt, { flex: 2, fontFamily: 'Helvetica-Bold' }]}>
                {key.replace(/([A-Z])/g, ' $1').replace(/^./, c => c.toUpperCase())}
              </Text>
              <Text style={[i % 2 === 0 ? shared.tableCell : shared.tableCellAlt, { flex: 1 }]}>{val?.perf || 'N/A'}</Text>
              <Text style={[i % 2 === 0 ? shared.tableCell : shared.tableCellAlt, { flex: 1 }]}>{val?.diff || 'N/A'}</Text>
            </View>
          ))}
        </View>

        <SecTitle>I. Continence</SecTitle>
        <View style={shared.card}>
          <View style={shared.row2}>
            <View style={shared.col2}><Field label="Bladder Continence" value={sI.bladderContinence} /></View>
            <View style={shared.col2}><Field label="Bowel Continence" value={sI.bowelContinence} /></View>
          </View>
          <Check label="Bladder Decline" checked={sI.bladderDecline} />
          <Tags label="Bladder Devices" values={sI.bladderDevices} />
        </View>

        <SecTitle>J. Diagnoses / Health Conditions</SecTitle>
        <View style={shared.card}>
          <Tags label="Active Diseases" values={sJ.diseases} />
          {sJ.otherDiagnoses && <Field label="Other Diagnoses" value={sJ.otherDiagnoses} />}
        </View>

        <SecTitle>K. Problem Conditions</SecTitle>
        <View style={shared.card}>
          <Tags label="Conditions" values={sK.problemConditions} />
        </View>

        <SecTitle>L. Swallowing / Nutrition</SecTitle>
        <View style={shared.card}>
          <Field label="Swallowing Status" value={sL.swallowing} />
          <Tags label="Weight Issues" values={sL.weight} />
          <Tags label="Consumption Issues" values={sL.consumption} />
        </View>

        <SecTitle>M. Oral / Dental Status</SecTitle>
        <View style={shared.card}>
          <Tags label="Oral Status" values={sM.oralStatus} />
        </View>

        <SecTitle>N. Skin Conditions</SecTitle>
        <View style={shared.card}>
          <Check label="Skin Problems Present" checked={sN.skinProblems} />
          {sN.ulcers?.highestStage && <Field label="Pressure Ulcer — Highest Stage" value={sN.ulcers.highestStage} />}
          <Tags label="Other Skin Problems" values={sN.otherSkinProblems} />
        </View>

        <SecTitle>O. Home Environment</SecTitle>
        <View style={shared.card}>
          <Tags label="Home Environment Factors" values={sO.homeEnvironment} />
        </View>

        <SecTitle>Q. Medication Management</SecTitle>
        <View style={shared.card}>
          <View style={shared.row2}>
            <View style={shared.col2}><Field label="Number of Medications" value={sQ.numberOfMedications} /></View>
            <View style={shared.col2}><Tags label="Psychotropic Medications" values={sQ.psychotropicMedication} /></View>
          </View>
        </View>

        <PDFFooter formName="MDS Assessment" />
      </Page>
    </Document>
  );
};