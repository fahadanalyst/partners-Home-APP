import React from 'react';
import { View, Text, StyleSheet } from '@react-pdf/renderer';
import { BasePDFTemplate, shared, BRAND } from './BasePDFTemplate';

const s = StyleSheet.create({
  sectionBanner: {
    backgroundColor: BRAND.blue,
    padding: 6,
    marginBottom: 8,
    borderRadius: 3,
  },
  sectionBannerText: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: BRAND.white,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  checkBox: {
    width: 9,
    height: 9,
    borderWidth: 1,
    borderColor: BRAND.zinc400,
    borderStyle: 'solid',
    borderRadius: 1,
    marginRight: 5,
    backgroundColor: BRAND.white,
  },
  checkBoxFilled: {
    width: 9,
    height: 9,
    borderWidth: 1,
    borderColor: BRAND.blue,
    borderStyle: 'solid',
    borderRadius: 1,
    marginRight: 5,
    backgroundColor: BRAND.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkMark: {
    fontSize: 6,
    color: BRAND.white,
    fontFamily: 'Helvetica-Bold',
  },
  activityTableHeader: {
    flexDirection: 'row',
    backgroundColor: BRAND.zinc100,
    borderBottomWidth: 1,
    borderBottomColor: BRAND.zinc200,
    borderBottomStyle: 'solid',
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  activityRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: BRAND.zinc100,
    borderBottomStyle: 'solid',
    paddingVertical: 3,
    paddingHorizontal: 6,
  },
  activityRowAlt: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: BRAND.zinc100,
    borderBottomStyle: 'solid',
    paddingVertical: 3,
    paddingHorizontal: 6,
    backgroundColor: BRAND.zinc50,
  },
  colLabel: { flex: 2, fontSize: 8, color: BRAND.zinc700, fontFamily: 'Helvetica', textTransform: 'capitalize' },
  colHeaderLabel: { flex: 2, fontSize: 7, color: BRAND.zinc600, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase', letterSpacing: 0.5 },
  colCheck: { flex: 1, fontSize: 8, color: BRAND.zinc700, fontFamily: 'Helvetica', textAlign: 'center' },
  colHeaderCheck: { flex: 1, fontSize: 7, color: BRAND.zinc600, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase', letterSpacing: 0.5, textAlign: 'center' },
  colFreq: { flex: 2, fontSize: 8, color: BRAND.zinc700, fontFamily: 'Helvetica' },
  colHeaderFreq: { flex: 2, fontSize: 7, color: BRAND.zinc600, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase', letterSpacing: 0.5 },
  sigLine: {
    height: 28,
    borderBottomWidth: 1,
    borderBottomColor: BRAND.zinc400,
    borderBottomStyle: 'solid',
    marginBottom: 3,
    marginTop: 10,
  },
});

const CheckItem: React.FC<{ label: string; checked: boolean }> = ({ label, checked }) => (
  <View style={s.checkRow}>
    <View style={checked ? s.checkBoxFilled : s.checkBox}>
      {checked && <Text style={s.checkMark}>✓</Text>}
    </View>
    <Text style={[shared.value, { fontSize: 8 }]}>{label}</Text>
  </View>
);

const ActivityTable: React.FC<{ title: string; section: Record<string, { cue: boolean; assist: boolean; frequency: string }> }> = ({ title, section }) => {
  const rows = Object.entries(section || {});
  const formatKey = (k: string) =>
    k.replace(/([A-Z])/g, ' $1')
     .replace('to From', 'to/from ')
     .replace('Shoe Socks', 'Shoe/Socks')
     .trim();

  return (
    <View style={{ marginBottom: 8 }}>
      <View style={s.activityTableHeader}>
        <Text style={s.colHeaderLabel}>{title}</Text>
        <Text style={s.colHeaderCheck}>Cue/Supv.</Text>
        <Text style={s.colHeaderCheck}>Assist</Text>
        <Text style={s.colHeaderFreq}>Frequency</Text>
      </View>
      {rows.map(([key, val], idx) => (
        <View key={key} style={idx % 2 === 0 ? s.activityRow : s.activityRowAlt}>
          <Text style={s.colLabel}>{formatKey(key)}</Text>
          <Text style={s.colCheck}>{val?.cue ? '✓' : '—'}</Text>
          <Text style={s.colCheck}>{val?.assist ? '✓' : '—'}</Text>
          <Text style={s.colFreq}>{val?.frequency || '—'}</Text>
        </View>
      ))}
    </View>
  );
};

export const GAFCAideCarePlanTemplate: React.FC<{ data: any }> = ({ data }) => {
  const d = data || {};

  return (
    <BasePDFTemplate title="GAFC Aide Care Plan" date={d.completedDate}>

      {/* Demographics */}
      <Text style={shared.sectionTitle}>Client Information</Text>
      <View style={shared.card}>
        <View style={shared.row2}>
          <View style={shared.col2}>
            <Text style={shared.label}>Name</Text>
            <Text style={[shared.valueBold, { marginBottom: 6 }]}>{d.name || '—'}</Text>
          </View>
          <View style={shared.col2}>
            <Text style={shared.label}>Date of Birth</Text>
            <Text style={[shared.value, { marginBottom: 6 }]}>{d.dob || '—'}</Text>
          </View>
        </View>
        <View style={shared.row2}>
          <View style={shared.col2}>
            <Text style={shared.label}>Address</Text>
            <Text style={[shared.value, { marginBottom: 6 }]}>{d.address ? `${d.address}, ${d.city || ''}` : '—'}</Text>
          </View>
          <View style={shared.col2}>
            <Text style={shared.label}>Home Phone</Text>
            <Text style={[shared.value, { marginBottom: 6 }]}>{d.homePhone || '—'}</Text>
          </View>
        </View>
        <View style={shared.row2}>
          <View style={shared.col2}>
            <Text style={shared.label}>Cell Phone</Text>
            <Text style={shared.value}>{d.cellPhone || '—'}</Text>
          </View>
          <View style={shared.col2}>
            <Text style={shared.label}>Alerts</Text>
            <Text style={[shared.value, { color: d.alerts ? BRAND.zinc900 : BRAND.zinc400 }]}>{d.alerts || 'None'}</Text>
          </View>
        </View>
      </View>

      {/* Diagnoses + Equipment */}
      <View style={shared.row2}>
        <View style={[shared.col2, { flex: 3 }]}>
          <Text style={shared.sectionTitle}>Diagnoses</Text>
          <View style={[shared.card, { minHeight: 48 }]}>
            <Text style={shared.value}>{d.diagnoses || '—'}</Text>
          </View>
        </View>
        <View style={[shared.col2, { flex: 2 }]}>
          <Text style={shared.sectionTitle}>Equipment</Text>
          <View style={shared.card}>
            {[
              { key: 'dentures', label: 'Dentures' },
              { key: 'glasses', label: 'Glasses' },
              { key: 'hearingAids', label: 'Hearing Aids' },
              { key: 'cane', label: 'Cane' },
              { key: 'walker', label: 'Walker' },
              { key: 'wheelchair', label: 'Wheelchair' },
              { key: 'tubChair', label: 'Tub Chair' },
            ].map(item => (
              <CheckItem key={item.key} label={item.label} checked={!!d[item.key]} />
            ))}
          </View>
        </View>
      </View>

      {/* Goals */}
      <Text style={shared.sectionTitle}>Goals</Text>
      <View style={shared.card}>
        <Text style={[shared.muted, { fontStyle: 'italic', marginBottom: 4 }]}>
          {d.name || '[Client name]'} will have their personal care needs met by the GAFC Program.
        </Text>
        {d.goals ? (
          <>
            <Text style={shared.label}>Additional Goals</Text>
            <Text style={shared.value}>{d.goals}</Text>
          </>
        ) : null}
      </View>

      {/* Services */}
      <Text style={shared.sectionTitle}>Home Help, Reminders & Other Services</Text>
      <View style={shared.card}>
        <View style={shared.row3}>
          <View style={shared.col3}>
            <Text style={[shared.label, { marginBottom: 6 }]}>Home Help (as needed)</Text>
            <CheckItem label="Meal Preparation" checked={!!d.mealPrep} />
            <CheckItem label="Grocery Shopping" checked={!!d.groceryShopping} />
            <CheckItem label="Laundry" checked={!!d.laundry} />
            <CheckItem label={`Light Housekeeping${d.lightHousekeepingNote ? `: ${d.lightHousekeepingNote}` : ''}`} checked={!!d.lightHousekeeping} />
          </View>
          <View style={shared.col3}>
            <Text style={[shared.label, { marginBottom: 6 }]}>Reminders (as needed)</Text>
            <CheckItem label="Safe Smoking Reminder (daily)" checked={!!d.safeSmokingReminder} />
            <CheckItem label="Medication Reminder (daily)" checked={!!d.medicationReminder} />
            <CheckItem label="Program Reminder" checked={!!d.programReminder} />
          </View>
          <View style={shared.col3}>
            <Text style={[shared.label, { marginBottom: 6 }]}>Other (during personal care)</Text>
            <CheckItem label="Informal Socialization" checked={!!d.informalSocialization} />
            <CheckItem label={'Ask if "OK" daily'} checked={!!d.askIfOKDaily} />
          </View>
        </View>
      </View>

      {/* ADL Activity Tables */}
      <Text style={shared.sectionTitle}>Activities of Daily Living</Text>
      <Text style={[shared.muted, { marginBottom: 6, fontStyle: 'italic' }]}>
        Cue/Supervise = cueing/supervision to complete entire task  ·  Assist = physical assistance  ·  Personal Care 7×/week
      </Text>

      <View style={shared.row2}>
        <View style={shared.col2}>
          <ActivityTable title="Bathing" section={d.bathing} />
          <ActivityTable title="(Un)/Dressing" section={d.dressing} />
          <ActivityTable title="Grooming" section={d.grooming} />
        </View>
        <View style={shared.col2}>
          <ActivityTable title="Ambulation" section={d.ambulation} />
          <ActivityTable title="Toileting" section={d.toileting} />
          <ActivityTable title="Transfers" section={d.transfers} />
        </View>
      </View>

      {/* Completion */}
      <View style={[shared.row2, { marginTop: 8, paddingTop: 10, borderTopWidth: 1, borderTopColor: BRAND.zinc200, borderTopStyle: 'solid' }]}>
        <View style={shared.col2}>
          <Text style={shared.label}>Completed By</Text>
          <View style={s.sigLine} />
          <Text style={shared.value}>{d.completedBy || '—'}</Text>
        </View>
        <View style={shared.col2}>
          <Text style={shared.label}>Date</Text>
          <View style={s.sigLine} />
          <Text style={shared.value}>{d.completedDate || '—'}</Text>
        </View>
      </View>

    </BasePDFTemplate>
  );
};