export function buildMDSAssessmentFields(data: any): Record<string, string | boolean | undefined> {
  const aa = data.sectionAA || {};
  const bb = data.sectionBB || {};
  const sA = data.sectionA  || {};
  const sG = data.sectionG  || {};
  const sH = data.sectionH  || {};
  const sP = data.sectionP?.formalCare || {};
  const sQ = data.sectionQ  || {};
  const sR = data.sectionR  || {};

  const str = (val: any) => val != null ? String(val) : undefined;

  return {
    // ── Section AA — clearly named fields ────────────
    'LastName':   aa.lastName,
    'FirstName':  aa.firstName,
    'MiddleInt':  aa.middleInitial,
    'CRN':        aa.caseRecordNo,

    // Also fill the XFA-path versions for compatibility
    'MDS_HC[0].Page1[0].TextField1[1]': aa.lastName,
    'MDS_HC[0].Page1[0].TextField1[2]': aa.firstName,
    'MDS_HC[0].Page1[0].TextField1[3]': aa.middleInitial,
    'MDS_HC[0].Page1[0].TextField1[4]': aa.caseRecordNo,
    'MDS_HC[0].Page1[0].TextField1[5]': aa.ssn,
    'MDS_HC[0].Page1[0].TextField1[6]': aa.healthInsuranceNo,

    // ── Section BB ────────────────────────────────────
    'BB_year': bb.birthdate,
    'BB_1':    bb.gender,
    'A2':      sA.assessmentReferenceDate,

    // ── Section B — Cognitive (Page 1 NumericFields) ──
    // NumericField1[1-5] = cognitive/memory scores
    'MDS_HC[0].Page1[0].NumericField1[1]': str(data.sectionB?.memoryRecall),
    'MDS_HC[0].Page1[0].NumericField1[2]': str(data.sectionB?.cognitiveSkills),
    'MDS_HC[0].Page1[0].NumericField1[3]': str(data.sectionB?.decisionMakingDecline ? 1 : 0),
    'MDS_HC[0].Page1[0].NumericField1[4]': str(data.sectionB?.deliriumSuddenOnset ? 1 : 0),
    'MDS_HC[0].Page1[0].NumericField1[5]': str(data.sectionB?.deliriumAgitated ? 1 : 0),

    // ── Section C — Communication ────────────────────
    'MDS_HC[0].Page1[0].NumericField1[6]':  str(data.sectionC?.hearing),
    'MDS_HC[0].Page1[0].NumericField1[7]':  str(data.sectionC?.makingSelfUnderstood),
    'MDS_HC[0].Page1[0].NumericField1[8]':  str(data.sectionC?.abilityToUnderstandOthers),
    'MDS_HC[0].Page1[0].NumericField1[9]':  str(data.sectionC?.communicationDecline ? 1 : 0),

    // ── Section D — Vision ────────────────────────────
    'MDS_HC[0].Page1[0].NumericField1[10]': str(data.sectionD?.vision),
    'MDS_HC[0].Page1[0].NumericField1[11]': str(data.sectionD?.visionDecline ? 1 : 0),

    // ── Section AA text continued ─────────────────────
    'MDS_HC[0].Page1[0].TextField1[8]':  aa.ssn,
    'MDS_HC[0].Page1[0].TextField1[9]':  aa.healthInsuranceNo,
    'MDS_HC[0].Page1[0].TextField1[10]': sA.reasonForAssessment,

    // ── Section BB checkboxes (race/ethnicity) ────────
    'MDS_HC[0].Page1[0].CheckBox1[0]': (bb.race || []).includes('a. American Indian/Alaskan Native'),
    'MDS_HC[0].Page1[0].CheckBox1[1]': (bb.race || []).includes('b. Asian'),
    'MDS_HC[0].Page1[0].CheckBox1[2]': (bb.race || []).includes('c. Black or African American'),
    'MDS_HC[0].Page1[0].CheckBox1[3]': (bb.race || []).includes('d. Native Hawaiian or other Pacific Islander'),
    'MDS_HC[0].Page1[0].CheckBox1[4]': (bb.race || []).includes('e. White'),
    'MDS_HC[0].Page1[0].CheckBox1[5]': (bb.race || []).includes('f. Hispanic or Latino'),

    // ── Section E — Mood scores (Page 2 NumericFields) ─
    'MDS_HC[0].Page2[0].NumericField1[0]':  str(data.sectionE?.sadness),
    'MDS_HC[0].Page2[0].NumericField1[1]':  str(data.sectionE?.anger),
    'MDS_HC[0].Page2[0].NumericField1[2]':  str(data.sectionE?.unrealisticFears),
    'MDS_HC[0].Page2[0].NumericField1[3]':  str(data.sectionE?.repetitiveHealthComplaints),
    'MDS_HC[0].Page2[0].NumericField1[4]':  str(data.sectionE?.repetitiveAnxiousComplaints),
    'MDS_HC[0].Page2[0].NumericField1[5]':  str(data.sectionE?.sadPainedWorriedFacial),
    'MDS_HC[0].Page2[0].NumericField1[6]':  str(data.sectionE?.recurrentCrying),
    'MDS_HC[0].Page2[0].NumericField1[7]':  str(data.sectionE?.withdrawalFromActivities),
    'MDS_HC[0].Page2[0].NumericField1[8]':  str(data.sectionE?.reducedSocialInteraction),
    'MDS_HC[0].Page2[0].NumericField1[9]':  str(data.sectionE?.moodDecline ? 1 : 0),
    // Behavioral symptoms
    'MDS_HC[0].Page2[0].NumericField1[10]': str(data.sectionE?.behavioralSymptoms?.wandering),
    'MDS_HC[0].Page2[0].NumericField1[11]': str(data.sectionE?.behavioralSymptoms?.verballyAbusive),
    'MDS_HC[0].Page2[0].NumericField1[12]': str(data.sectionE?.behavioralSymptoms?.physicallyAbusive),
    'MDS_HC[0].Page2[0].NumericField1[13]': str(data.sectionE?.behavioralSymptoms?.sociallyInappropriate),
    'MDS_HC[0].Page2[0].NumericField1[14]': str(data.sectionE?.behavioralSymptoms?.resistsCare),
    'MDS_HC[0].Page2[0].NumericField1[15]': str(data.sectionE?.behavioralSymptomsDecline ? 1 : 0),

    // ── Section F — Social ────────────────────────────
    'MDS_HC[0].Page2[0].NumericField1[16]': str(data.sectionF?.atEaseWithOthers),
    'MDS_HC[0].Page2[0].NumericField1[17]': str(data.sectionF?.expressesConflict ? 1 : 0),
    'MDS_HC[0].Page2[0].NumericField1[18]': str(data.sectionF?.changeInSocialActivities),
    'MDS_HC[0].Page2[0].NumericField1[19]': str(data.sectionF?.isolationLength),
    'MDS_HC[0].Page2[0].NumericField1[20]': str(data.sectionF?.feelsLonely ? 1 : 0),

    // ── Section G — Informal support ─────────────────
    'MDS_HC[0].Page2[0].TextField1[1]': sG.primaryHelper?.name,
    'MDS_HC[0].Page2[0].TextField1[2]': sG.secondaryHelper?.name,
    'G_1eB': str(sG.primaryHelper?.livesWithClient ? 0 : 1),
    'G_1iB': str(sG.primaryHelper?.relationship),

    // ── Section H — IADLs (Page 2) ────────────────────
    'MDS_HC[0].Page2[0].NumericField1[21]': str(sH.iadl?.mealPreparation?.perf),
    'MDS_HC[0].Page2[0].NumericField1[23]': str(sH.iadl?.mealPreparation?.diff),
    'MDS_HC[0].Page2[0].NumericField1[25]': str(sH.iadl?.ordinaryHousework?.perf),
    'MDS_HC[0].Page2[0].NumericField1[26]': str(sH.iadl?.ordinaryHousework?.diff),
    'MDS_HC[0].Page2[0].NumericField1[27]': str(sH.iadl?.managingFinance?.perf),
    'MDS_HC[0].Page2[0].NumericField1[28]': str(sH.iadl?.managingFinance?.diff),
    'MDS_HC[0].Page2[0].NumericField1[29]': str(sH.iadl?.managingMedications?.perf),
    'MDS_HC[0].Page2[0].NumericField1[30]': str(sH.iadl?.managingMedications?.diff),
    'MDS_HC[0].Page2[0].NumericField1[31]': str(sH.iadl?.phoneUse?.perf),
    'MDS_HC[0].Page2[0].NumericField1[32]': str(sH.iadl?.phoneUse?.diff),
    'MDS_HC[0].Page2[0].NumericField1[33]': str(sH.iadl?.shopping?.perf),
    'MDS_HC[0].Page2[0].NumericField1[34]': str(sH.iadl?.shopping?.diff),
    'MDS_HC[0].Page2[0].NumericField1[35]': str(sH.iadl?.transportation?.perf),
    'MDS_HC[0].Page2[0].NumericField1[36]': str(sH.iadl?.transportation?.diff),

    // ── Section H — ADLs (Page 3) ────────────────────
    'MDS_HC[0].Page3[0].NumericField1[0]':  str(sH.adl?.mobilityInBed),
    'MDS_HC[0].Page3[0].NumericField1[1]':  str(sH.adl?.transfer),
    'MDS_HC[0].Page3[0].NumericField1[2]':  str(sH.adl?.locomotionInHome),
    'MDS_HC[0].Page3[0].NumericField1[3]':  str(sH.adl?.locomotionOutside),
    'MDS_HC[0].Page3[0].NumericField1[4]':  str(sH.adl?.dressingUpperBody),
    'MDS_HC[0].Page3[0].NumericField1[5]':  str(sH.adl?.dressingLowerBody),
    'MDS_HC[0].Page3[0].NumericField1[6]':  str(sH.adl?.eating),
    'MDS_HC[0].Page3[0].NumericField1[7]':  str(sH.adl?.toiletUse),
    'MDS_HC[0].Page3[0].NumericField1[8]':  str(sH.adl?.personalHygiene),
    'MDS_HC[0].Page3[0].NumericField1[9]':  str(sH.adl?.bathing),
    'MDS_HC[0].Page3[0].NumericField1[10]': str(sH.adlDecline ? 1 : 0),
    'MDS_HC[0].Page3[0].NumericField1[11]': str(sH.primaryModesOfLocomotion?.indoors),
    'MDS_HC[0].Page3[0].NumericField1[12]': str(sH.primaryModesOfLocomotion?.outdoors),
    'MDS_HC[0].Page3[0].NumericField1[13]': str(sH.stairClimbing),
    'MDS_HC[0].Page3[0].NumericField1[14]': str(sH.stamina?.daysWentOut),
    'MDS_HC[0].Page3[0].NumericField1[15]': str(sH.stamina?.hoursOfPhysicalActivity),

    // ── Section I — Continence (Page 3) ──────────────
    'MDS_HC[0].Page3[0].NumericField1[16]': str(data.sectionI?.bladderContinence),
    'MDS_HC[0].Page3[0].NumericField1[17]': str(data.sectionI?.bladderDecline ? 1 : 0),
    'MDS_HC[0].Page3[0].NumericField1[18]': str(data.sectionI?.bowelContinence),

    // ── Section P — Service utilization ──────────────
    // rowA-rowK = service rows; each has Days/Hours/Mins
    'rowA': str(sP.homeHealthAides?.days),
    'rowB': str(sP.visitingNurses?.days),
    'rowC': str(sP.homemakingServices?.days),
    'rowD': str(sP.meals?.days),
    'rowE': str(sP.volunteerServices?.days),
    'rowF': str(sP.physicalTherapy?.days),
    'rowG': str(sP.occupationalTherapy?.days),
    'rowH': str(sP.speechTherapy?.days),
    'rowI': str(sP.dayCare?.days),
    'rowJ': str(sP.socialWorker?.days),

    // SecRow fields = hours/mins for each service
    'SecRowe': str(sP.volunteerServices?.hours),
    'SecRowf': str(sP.physicalTherapy?.hours),
    'SecRowg': str(sP.occupationalTherapy?.hours),
    'SecRowh': str(sP.speechTherapy?.hours),
    'SecRowi': str(sP.dayCare?.hours),
    'SecRowd': str(sP.meals?.hours),

    // ── Section Q — Medications (Page 5) ─────────────
    'MDS_HC[0].Page5[0].NumericField1[0]': str(sQ.numberOfMedications),
    'MDS_HC[0].Page5[0].CheckBox1[0]':     sQ.psychotropicMedication?.includes('a. Antipsychotic/neuroleptic'),

    // ── Section R — Signatures ────────────────────────
    'MDS_HC[0].Page5[0].TextField1[1]': sR.coordinatorSignature,
    'MDS_HC[0].Page5[0].TextField1[2]': sR.coordinatorTitle,
    'MDS_HC[0].Page5[0].TextField1[3]': sR.completionDate,
  };
}