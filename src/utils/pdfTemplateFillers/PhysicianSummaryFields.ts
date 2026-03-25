export function buildPhysicianSummaryFields(data: any): Record<string, string | boolean | undefined> {
  const patient      = data.patient      || {};
  const vitals       = data.vitals       || {};
  const allergies    = data.allergies    || {};
  const continence   = data.continence   || {};
  const mentalStatus = data.mentalStatus || {};
  const services     = data.services     || {};
  const treatments   = data.treatments   || [];
  const medications  = data.medications  || [];
  const skilledTherapy = data.skilledTherapy || {};
  const provider     = data.provider     || {};
  const recommended: string[] = services.recommended || [];

  const fields: Record<string, string | boolean | undefined> = {
    // ── Provider block ──────────────────────────────
    'text_1pmwu':  provider.signature,
    'text_2pjez':  provider.printName,
    'text_3tpr':   provider.dateCompleted,
    'textarea_6xsnr': provider.address,

    // ── Patient demographics ─────────────────────────
    'checkbox_4ixqh': patient.gender === 'M',
    'checkbox_5mila': patient.gender === 'F',
    'text_10lllr': patient.lastName,
    'text_11hsdp': patient.firstName,
    'text_12ctpy': patient.dob,

    // ── Diagnosis ────────────────────────────────────
    'checkbox_7mpoo': patient.mentalIllness,
    'checkbox_8phou': patient.intellectualDisability,
    'checkbox_9iykp': patient.developmentalDisability,
    'text_22dqmz':    patient.diagnoses,
    'text_23mexe':    patient.mentalIllnessDiagnosis,

    // ── Vitals ───────────────────────────────────────
    'text_13jcep': vitals.date,
    'text_14caur': vitals.temperature,
    'text_15zzvl': vitals.pulse,
    'text_16qva':  vitals.respirations,
    'text_17lskj': vitals.bloodPressure,

    // ── Allergies ────────────────────────────────────
    'checkbox_37mpwr': allergies.noKnownAllergies,
    'checkbox_38extm': allergies.noKnownDrugAllergies,
    'text_18xets':     allergies.list,

    // ── Height / Weight ──────────────────────────────
    'text_19onoc': patient.height,
    'text_20nfqr': patient.weight,

    // ── Continence ───────────────────────────────────
    'checkbox_39uykr': continence.bowelContinent,
    'checkbox_40oqyx': continence.bowelIncontinent,
    'checkbox_41pybw': continence.colostomy,
    'checkbox_42zhcd': continence.bladderContinent,
    'checkbox_43rvmo': continence.bladderIncontinent,
    'checkbox_44edao': continence.catheter,

    // ── Mental Status ────────────────────────────────
    'checkbox_45mw':   mentalStatus.alertOriented,
    'checkbox_46zylt': mentalStatus.alertDisoriented,
    'checkbox_47wtkl': mentalStatus.other,
    'text_21jycm':     mentalStatus.otherDetail,

    // ── Additional comments ──────────────────────────
    'textarea_57vgex': data.additionalComments,

    // ── Lab / dates / diet ───────────────────────────
    'text_24fcxp': data.recentLabWork,
    'text_25xqxi': data.lastPhysicalExamDate,
    'text_26nohw': data.lastOfficeVisitDate,
    'text_27xkqb': data.diet,

    // ── Recommended services ─────────────────────────
    'checkbox_58bxwz': recommended.includes('Adult day health (ADH)'),
    'checkbox_59aagv': recommended.includes('Group adult foster care (GAFC)'),
    'checkbox_60jckl': recommended.includes('Adult foster care (AFC)'),
    'checkbox_61gjqt': recommended.includes('Program for All-inclusive Care for the Elderly (PACE)'),
    'checkbox_62sotu': recommended.includes('Nursing facility (NF)'),

    // ── Skilled therapy ──────────────────────────────
    'text_63thvc': skilledTherapy.detail,
  };

  // ── Treatments — up to 4 rows ─────────────────────
  // Fields paired: type then frequency, sequential
  const treatmentFields = [
    ['text_28woda', 'text_29mdfu'],
    ['text_30zqkp', 'text_31pylt'],
    ['text_32tfnw', 'text_33hwdk'],
    ['text_34ufjw', 'text_35whbh'],
  ];
  treatments.slice(0, 4).forEach((t: any, i: number) => {
    fields[treatmentFields[i][0]] = t.type;
    fields[treatmentFields[i][1]] = t.frequency;
  });

  // ── Medications — up to 6 rows ────────────────────
  // Fields grouped: drug, dose, route, frequency per row
  const medFields = [
    ['text_49jfvu', 'text_50fyqf', 'text_51fjew', 'text_52duza'],
    ['text_53nvgb', 'text_54cnsr', 'text_55qwqr', 'text_64lxi'],
    ['text_65gzvh', 'text_67vsnn', 'text_69cbad', 'text_70cpry'],
  ];
  medications.slice(0, 3).forEach((med: any, i: number) => {
    fields[medFields[i][0]] = med.drug;
    fields[medFields[i][1]] = med.dose;
    fields[medFields[i][2]] = med.route;
    fields[medFields[i][3]] = med.frequency;
  });

  // Remaining medication field
  fields['text_71blro'] = medications[3]?.drug;

  return fields;
}