export function buildRequestForServicesFields(data: any): Record<string, string | boolean | undefined> {
  const member     = data.member          || {};
  const nextOfKin  = data.nextOfKin       || {};
  const physician  = data.physician       || {};
  const services   = data.services        || {};
  const screening  = data.screening       || {};
  const additional = data.additional      || {};
  const nf         = data.nursingFacility || {};
  const referral   = data.referral        || {};

  const requested: string[]  = services.requested       || [];
  const nfServices: string[] = services.nursingFacility  || [];

  const yesNo = (val: any) =>
    val === true || val === '1' || val === 'yes' ? 'yes' : 'no';

  return {
    // ── Header ───────────────────────────────────────
    'date': data.date,

    // ── Services requested (checkboxes) ──────────────
    'checkbox_3zsqs':  requested.includes('Pre-admission nursing facility (NF)'),
    'checkbox_4vnix':  requested.includes('Adult day health (ADH)'),
    'checkbox_5oiww':  requested.includes('Adult foster care (AFC)'),
    'checkbox_6kbpt':  requested.includes('Group adult foster care (GAFC)'),
    'checkbox_7uqig':  requested.includes('Home and community based services (HCBS) waiver'),
    'checkbox_8ezph':  requested.includes('Program for All-inclusive Care for the Elderly (PACE)'),
    'checkbox_9myts':  requested.includes('Other'),

    // ── Nursing facility use only ─────────────────────
    'checkbox_10plnm': nfServices.includes('Conversion'),
    'checkbox_11pmgw': nfServices.includes('Continued stay'),
    'checkbox_12ubqs': nfServices.includes('Short term review'),
    'checkbox_13nxlm': nfServices.includes('Transfer NF to NF'),
    'checkbox_14dmuh': nfServices.includes('Retrospective'),

    // ── Member info ───────────────────────────────────
    'text_15rcfx': member.lastName,
    'text_16ukli': member.firstName,
    'text_17sxfl': member.telephone,
    'text_18xiwb': member.address,
    'text_19prnb': member.city,
    'text_20qqoq': member.zip,

    // ── Member checkboxes ─────────────────────────────
    'checkbox_21vndm': member.massHealthMember,
    'checkbox_22cxia': member.massHealthApplicationPending,
    'checkbox_23mbig': member.gafcAssistedLiving,

    // ── Member ID fields ──────────────────────────────
    'text_24pcib': member.massHealthId,
    'text_25mrhr': member.dateApplicationFiled,
    'text_26qdid': member.dateSSIGFiled,

    // ── Next of kin ───────────────────────────────────
    'text_27trge': nextOfKin.lastName,
    'text_28zayr': nextOfKin.firstName,
    'text_29nprq': nextOfKin.telephone,
    'text_30zsgu': nextOfKin.address,
    'text_31bwlk': nextOfKin.city,
    'text_32mluj': nextOfKin.zip,

    // ── Physician ─────────────────────────────────────
    'text_33rmgp': physician.lastName,
    'text_34lkhz': physician.firstName,
    'text_35aqj':  physician.telephone,
    'text_36gefh': physician.address,
    'text_37xxzh': physician.city,
    'text_39dgec': physician.zip,

    // ── Screening ─────────────────────────────────────
    'checkbox_40vqmr': screening.mentalIllness,
    'checkbox_41uayi': screening.mentalRetardation,
    'checkbox_42ynll': screening.developmentalDisability,
    'text_58obvm':     screening.mentalIllnessSpec,

    // ── Additional information (yes/no fields) ────────
    // radio_group_43ybkr handles yes/no questions on page 2
    // text fields for additional info
    'text_97hes':  additional.personalCareDaysPerWeek != null
                     ? String(additional.personalCareDaysPerWeek) : undefined,
    'text_98dntg': additional.personalCareHoursPerWeek != null
                     ? String(additional.personalCareHoursPerWeek) : undefined,

    'checkbox_99jcwd':  additional.changeImprovement,
    'checkbox_100nisg': additional.changeDeterioration,
    'text_101woya':     services.otherDetail,
    'textarea_102zfyk': additional.changeDescription,

    // ── Referral / signature block ────────────────────
    'text_109mbbp': referral.source,
    'text_110drpj': referral.nurseName,
    'text_111swvu': referral.signature,
    'text_112ll':   referral.printName,
    'text_113pxms': referral.title,
    'text_114caun': referral.organization,
    'text_115owmw': referral.telephone,
    'text_116xhsf': `${member.firstName || ''} ${member.lastName || ''}`.trim(),
  };
}