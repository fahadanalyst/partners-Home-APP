import React from 'react';
import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer';
import { PDFHeader, PDFFooter, shared, BRAND } from './BasePDFTemplate';

const s = StyleSheet.create({
  yesNoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: BRAND.zinc100,
  },
  yesNoRowAlt: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: BRAND.zinc100,
    backgroundColor: BRAND.zinc100,
  },
  questionText: {
    fontSize: 8,
    color: BRAND.zinc700,
    flex: 1,
    paddingRight: 8,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
    minWidth: 28,
    alignItems: 'center',
  },
  badgeYes: {
    backgroundColor: '#dcfce7',
  },
  badgeNo: {
    backgroundColor: '#fee2e2',
  },
  badgeTextYes: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: '#16a34a',
  },
  badgeTextNo: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: '#dc2626',
  },
  sectionHeader: {
    backgroundColor: BRAND.zinc900,
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginBottom: 0,
    borderRadius: 3,
    marginTop: 8,
  },
  sectionHeaderText: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#ffffff',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});

/* ── Helpers ── */

const YesNoRow: React.FC<{ label: string; value?: string; index: number }> = ({ label, value, index }) => {
  const isYes = value === 'YES';
  const isNo = value === 'NO';
  return (
    <View style={index % 2 === 0 ? s.yesNoRow : s.yesNoRowAlt}>
      <Text style={s.questionText}>{label}</Text>
      <View style={[s.badge, isNo ? s.badgeNo : s.badgeYes]}>
        <Text style={isNo ? s.badgeTextNo : s.badgeTextYes}>
          {value || 'N/A'}
        </Text>
      </View>
    </View>
  );
};

const SectionHeader: React.FC<{ title: string }> = ({ title }) => (
  <View style={s.sectionHeader}>
    <Text style={s.sectionHeaderText}>{title}</Text>
  </View>
);

const Field: React.FC<{ label: string; value?: any }> = ({ label, value }) => (
  <View style={{ marginBottom: 6 }}>
    <Text style={shared.label}>{label}</Text>
    <Text style={shared.value}>{value != null && value !== '' ? String(value) : 'N/A'}</Text>
  </View>
);

/* ── Main Template ── */

export const HomeSafetyInspectionTemplate: React.FC<{ data: any }> = ({ data }) => {
  const bathroom      = data.bathroom       || {};
  const bedroom       = data.bedroom        || {};
  const kitchen       = data.kitchen        || {};
  const livingArea    = data.livingArea     || {};
  const porchYard     = data.porchYard      || {};
  const safetyEquip   = data.safetyEquipment || {};

  return (
    <Document>
      {/* ══════════════════════════════════════════════════════
          PAGE 1 — Client Info, Bathroom, Bedroom, Kitchen
      ══════════════════════════════════════════════════════ */}
      <Page size="A4" style={shared.page}>
        <PDFHeader title="Home Safety Inspection" date={data.dateOfService} />

        {/* Client Information */}
        <Text style={[shared.sectionTitle, { marginTop: 0 }]}>Client Information</Text>
        <View style={shared.card}>
          <View style={shared.row3}>
            <View style={shared.col3}>
              <Field label="Client Name" value={data.clientName} />
            </View>
            <View style={shared.col3}>
              <Field label="Date of Service" value={data.dateOfService} />
            </View>
            <View style={shared.col3}>
              <View style={{ flexDirection: 'row', gap: 16 }}>
                <Field label="Housing Type" value={data.housingType} />
                <Field label="Subsidized" value={data.subsidized} />
              </View>
            </View>
          </View>
        </View>

        {/* Bathroom */}
        <SectionHeader title="Bathroom" />
        <View style={{ marginBottom: 4 }}>
          {[
            { field: 'pathWellLit',         label: 'Is the path from the bedroom to the bathroom well lit?' },
            { field: 'grabBars',            label: 'Are there grab bars near the toilet and in the shower and bathtub?' },
            { field: 'showerSeat',          label: 'If you have difficulty standing in the shower, do you use a shower seat?' },
            { field: 'slipResistantMats',   label: 'Do your bathmats have slip resistant backing?' },
            { field: 'soapBuildupRemoved',  label: 'Do you remove soap buildup in your shower?' },
            { field: 'reachSoapEasily',     label: 'Can you reach soap in the shower without bending down or turning too far around?' },
            { field: 'raisedToiletSeat',    label: 'Do you have a raised toilet seat if you have difficulty standing up or sitting down?' },
            { field: 'spillsCleaned',       label: 'Are spills cleaned up immediately?' },
          ].map((item, i) => (
            <YesNoRow key={item.field} label={item.label} value={bathroom[item.field]} index={i} />
          ))}
        </View>

        {/* Bedroom */}
        <SectionHeader title="Bedroom" />
        <View style={{ marginBottom: 4 }}>
          {[
            { field: 'tableNearBed',           label: 'Is there a table close to your bed?' },
            { field: 'lampOnTable',            label: 'Is there a lamp on the table within easy reach?' },
            { field: 'pathClear',              label: 'Is the path from your bed to the bathroom clear of obstacles?' },
            { field: 'phoneNearBed',           label: 'Is there a telephone close to your bed?' },
            { field: 'nightLight',             label: 'Do you use a night light?' },
            { field: 'bedHeightAppropriate',   label: 'Is your bed height appropriate for easy entry and exit?' },
            { field: 'rugsSecured',            label: 'Are all rugs in the bedroom secured to the floor?' },
            { field: 'emergencyExitClear',     label: 'Is the emergency exit from the bedroom clear?' },
          ].map((item, i) => (
            <YesNoRow key={item.field} label={item.label} value={bedroom[item.field]} index={i} />
          ))}
        </View>

        {/* Kitchen */}
        <SectionHeader title="Kitchen" />
        <View style={{ marginBottom: 4 }}>
          {[
            { field: 'itemsWithinReach',  label: 'Are items you use often on low shelves?' },
            { field: 'stepStoolSafe',     label: 'If you use a step stool, is it steady and does it have a handrail?' },
            { field: 'noLooseRugs',       label: 'Are there any loose rugs or mats?' },
            { field: 'spillsCleaned',     label: 'Are spills cleaned up immediately?' },
            { field: 'fireExtinguisher',  label: 'Is there a fire extinguisher nearby?' },
            { field: 'stoveKnobsSafe',    label: 'Are stove knobs easy to read and turn?' },
            { field: 'lightingAdequate',  label: 'Is the lighting adequate?' },
            { field: 'cordsSafe',         label: 'Are electrical cords in good condition?' },
          ].map((item, i) => (
            <YesNoRow key={item.field} label={item.label} value={kitchen[item.field]} index={i} />
          ))}
        </View>

        <PDFFooter formName="Home Safety Inspection" />
      </Page>

      {/* ══════════════════════════════════════════════════════
          PAGE 2 — Living Area, Porch/Yard, Safety Equipment, Signature
      ══════════════════════════════════════════════════════ */}
      <Page size="A4" style={shared.page}>
        <PDFHeader title="Home Safety Inspection (cont.)" date={data.dateOfService} />

        {/* Living Area */}
        <SectionHeader title="Living Area" />
        <View style={{ marginBottom: 4 }}>
          {[
            { field: 'pathsClear',               label: 'Are there clear paths through the rooms?' },
            { field: 'rugsSecured',              label: 'Are there any loose rugs or mats?' },
            { field: 'cordsOutOfWay',            label: 'Are electrical cords out of the way?' },
            { field: 'lightSwitchesAccessible',  label: 'Is there a light switch at the entrance to each room?' },
            { field: 'furnitureStable',          label: 'Are chairs and sofas easy to get in and out of?' },
            { field: 'lightingAdequate',         label: 'Is the lighting adequate?' },
            { field: 'noTrippingHazards',        label: 'Are there any tripping hazards?' },
            { field: 'handrailsOnStairs',        label: 'Are there handrails on any stairs?' },
          ].map((item, i) => (
            <YesNoRow key={item.field} label={item.label} value={livingArea[item.field]} index={i} />
          ))}
        </View>

        {/* Porch / Yard */}
        <SectionHeader title="Porch / Yard" />
        <View style={{ marginBottom: 4 }}>
          {[
            { field: 'stepsInRepair',        label: 'Are steps in good repair?' },
            { field: 'handrailsSturdy',      label: 'Are there sturdy handrails on both sides of the steps?' },
            { field: 'lightingAdequate',     label: 'Is there adequate lighting at the entrance?' },
            { field: 'walkwaysClear',        label: 'Are walkways clear of debris and tripping hazards?' },
            { field: 'porchConditionGood',   label: 'Is the porch or deck in good condition?' },
            { field: 'noLooseBoards',        label: 'Are there any loose boards or railings?' },
            { field: 'pathClearToMailbox',   label: 'Is there a clear path to the mailbox or trash area?' },
            { field: 'noOvergrownBushes',    label: 'Are there any overgrown bushes or trees blocking paths?' },
          ].map((item, i) => (
            <YesNoRow key={item.field} label={item.label} value={porchYard[item.field]} index={i} />
          ))}
        </View>

        {/* Safety Equipment */}
        <SectionHeader title="Safety Equipment" />
        <View style={{ marginBottom: 8 }}>
          {[
            { field: 'smokeDetectorsWorking',      label: 'Are there working smoke detectors on every level?' },
            { field: 'coDetectorsWorking',         label: 'Are there working carbon monoxide detectors?' },
            { field: 'fireExtinguisherKitchen',    label: 'Is there a fire extinguisher in the kitchen?' },
            { field: 'emergencyNumbersNearPhone',  label: 'Do you have a list of emergency numbers near the phone?' },
            { field: 'firstAidKitAvailable',       label: 'Do you have a first aid kit?' },
            { field: 'flashlightNearBed',          label: 'Is there a flashlight with working batteries near your bed?' },
            { field: 'emergencyCallMethod',        label: 'Do you have a way to call for help in an emergency?' },
            { field: 'emergencyExitsClear',        label: 'Are emergency exits clear?' },
          ].map((item, i) => (
            <YesNoRow key={item.field} label={item.label} value={safetyEquip[item.field]} index={i} />
          ))}
        </View>

        {/* Signature */}
        <Text style={[shared.sectionTitle, { marginTop: 8 }]}>Inspector Signature</Text>
        <View style={shared.card}>
          {data.signature ? (
            <View>
              {/* eslint-disable-next-line jsx-a11y/alt-text */}
              {/* @ts-ignore */}
              <Image src={data.signature} style={{ height: 50, maxWidth: 200 }} />
              <Text style={{ fontSize: 7, color: BRAND.zinc400, marginTop: 4 }}>
                Signed on {data.dateOfService || 'N/A'}
              </Text>
            </View>
          ) : (
            <View style={{ height: 50, borderBottomWidth: 1, borderBottomColor: BRAND.zinc400, width: 200, justifyContent: 'flex-end' }}>
              <Text style={{ fontSize: 7, color: BRAND.zinc400 }}>Signature on file</Text>
            </View>
          )}
        </View>

        <PDFFooter formName="Home Safety Inspection" />
      </Page>
    </Document>
  );
};