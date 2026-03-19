import React from 'react';
import { View, Text, Image, StyleSheet } from '@react-pdf/renderer';
import { BasePDFTemplate, shared, BRAND } from './BasePDFTemplate';

const s = StyleSheet.create({
  bullet: { flexDirection: 'row', alignItems: 'center', marginBottom: 3 },
  dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: BRAND.green, marginRight: 6 },
  dotGray: { width: 5, height: 5, borderRadius: 3, backgroundColor: BRAND.zinc400, marginRight: 6 },
  inlineKV: { flexDirection: 'row', marginBottom: 3 },
  inlineKey: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: BRAND.zinc400, textTransform: 'uppercase', marginRight: 4 },
  inlineVal: { fontSize: 8, color: BRAND.zinc700 },
  sigLine: { width: '100%', borderBottomWidth: 1, borderBottomColor: BRAND.zinc300, borderBottomStyle: 'solid', height: 40, marginBottom: 4 },
  sigImg: { width: 160, height: 40, objectFit: 'contain', marginBottom: 4 },
});

const addr = (obj: any) => [obj?.street, obj?.apt, obj?.city && `${obj.city}, ${obj.state} ${obj.zip}`].filter(Boolean).join(', ') || 'N/A';

export const RequestForServicesTemplate: React.FC<{ data: any }> = ({ data }) => {
  const { date, servicesRequested = [], otherService, nursingFacilityUseOnly = [], memberInfo = {},
    nextOfKin = {}, physician = {}, screening = {}, communityServices = [],
    communityServicesOther, additionalInfo = {}, referralSource = {} } = data;

  return (
    <BasePDFTemplate title="Request for Services (RFS-1)" date={date}>
      {/* Services */}
      <View style={shared.row2}>
        <View style={shared.col2}>
          <Text style={shared.sectionTitle}>Service(s) Requested</Text>
          <View style={[shared.card, { minHeight: 60 }]}>
            {servicesRequested.map((sv: string) => (
              <View key={sv} style={s.bullet}>
                <View style={s.dot} /><Text style={shared.value}>{sv === 'Other' ? `Other: ${otherService || ''}` : sv}</Text>
              </View>
            ))}
          </View>
        </View>
        <View style={shared.col2}>
          <Text style={shared.sectionTitle}>Nursing Facility Use Only</Text>
          <View style={[shared.card, { backgroundColor: BRAND.zinc50, minHeight: 60 }]}>
            {nursingFacilityUseOnly.map((sv: string) => (
              <View key={sv} style={s.bullet}>
                <View style={s.dotGray} /><Text style={shared.value}>{sv}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* Member Info */}
      <Text style={shared.sectionTitle}>Member Information</Text>
      <View style={shared.card}>
        <View style={shared.row3}>
          <View style={shared.col3}>
            <Text style={shared.label}>Member Name</Text>
            <Text style={[shared.valueBold, { marginBottom: 6 }]}>{`${memberInfo.firstName || ''} ${memberInfo.lastName || ''}`.trim() || 'N/A'}</Text>
          </View>
          <View style={shared.col3}>
            <Text style={shared.label}>Telephone</Text>
            <Text style={shared.value}>{memberInfo.telephone || 'N/A'}</Text>
          </View>
          <View style={shared.col3}>
            <Text style={shared.label}>MassHealth ID</Text>
            <Text style={shared.value}>{memberInfo.masshealthId || 'N/A'}</Text>
          </View>
        </View>
        <View style={shared.row2}>
          <View style={[shared.col2, { flex: 2 }]}>
            <Text style={shared.label}>Address</Text>
            <Text style={shared.value}>{addr(memberInfo)}</Text>
          </View>
          <View style={shared.col2}>
            <Text style={shared.label}>Status</Text>
            <Text style={shared.value}>{memberInfo.status || 'N/A'}</Text>
          </View>
        </View>
      </View>

      {/* Next of Kin & Physician */}
      <View style={shared.row2}>
        <View style={shared.col2}>
          <Text style={shared.sectionTitle}>Next of Kin</Text>
          <View style={shared.card}>
            <View style={s.inlineKV}><Text style={s.inlineKey}>Name:</Text><Text style={s.inlineVal}>{`${nextOfKin.firstName || ''} ${nextOfKin.lastName || ''}`.trim() || 'N/A'}</Text></View>
            <View style={s.inlineKV}><Text style={s.inlineKey}>Phone:</Text><Text style={s.inlineVal}>{nextOfKin.telephone || 'N/A'}</Text></View>
            <View style={s.inlineKV}><Text style={s.inlineKey}>Address:</Text><Text style={s.inlineVal}>{addr(nextOfKin)}</Text></View>
          </View>
        </View>
        <View style={shared.col2}>
          <Text style={shared.sectionTitle}>Physician</Text>
          <View style={shared.card}>
            <View style={s.inlineKV}><Text style={s.inlineKey}>Name:</Text><Text style={s.inlineVal}>{`${physician.firstName || ''} ${physician.lastName || ''}`.trim() || 'N/A'}</Text></View>
            <View style={s.inlineKV}><Text style={s.inlineKey}>Phone:</Text><Text style={s.inlineVal}>{physician.telephone || 'N/A'}</Text></View>
            <View style={s.inlineKV}><Text style={s.inlineKey}>Address:</Text><Text style={s.inlineVal}>{addr(physician)}</Text></View>
          </View>
        </View>
      </View>

      {/* Screening */}
      <Text style={shared.sectionTitle}>Screening</Text>
      <View style={shared.card}>
        <View style={shared.row2}>
          <View style={shared.col2}>
            <View style={s.inlineKV}><Text style={s.inlineKey}>Mental Illness:</Text><Text style={s.inlineVal}>{screening.mentalIllness ? `Yes (${screening.mentalIllnessSpecify || 'N/A'})` : 'No'}</Text></View>
            <View style={s.inlineKV}><Text style={s.inlineKey}>Mental Retardation:</Text><Text style={s.inlineVal}>{screening.mentalRetardation ? 'Yes' : 'No'}</Text></View>
            <View style={s.inlineKV}><Text style={s.inlineKey}>Dev. Disability:</Text><Text style={s.inlineVal}>{screening.developmentalDisability ? 'Yes' : 'No'}</Text></View>
          </View>
          <View style={shared.col2}>
            <Text style={shared.label}>Related Conditions</Text>
            <Text style={shared.value}>{screening.conditions?.length > 0 ? screening.conditions.join(', ') : 'None'}</Text>
          </View>
        </View>
      </View>

      {/* Community Services */}
      <Text style={shared.sectionTitle}>Community Services Recommended</Text>
      <View style={shared.card}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {communityServices.map((sv: string) => (
            <View key={sv} style={[s.bullet, { width: '33%' }]}>
              <View style={[s.dot, { backgroundColor: BRAND.blue }]} />
              <Text style={[shared.value, { fontSize: 8 }]}>{sv === 'Other' ? `Other: ${communityServicesOther || ''}` : sv}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Additional Info */}
      <Text style={shared.sectionTitle}>Additional Information</Text>
      <View style={shared.card}>
        <View style={shared.row2}>
          <View style={shared.col2}>
            <View style={s.inlineKV}><Text style={s.inlineKey}>Home Available:</Text><Text style={s.inlineVal}>{additionalInfo.homeAvailable || 'N/A'}</Text></View>
            <View style={s.inlineKV}><Text style={s.inlineKey}>Caregiver Available:</Text><Text style={s.inlineVal}>{additionalInfo.caregiverAvailable || 'N/A'}</Text></View>
            <View style={s.inlineKV}><Text style={s.inlineKey}>Weight Gain:</Text><Text style={s.inlineVal}>{additionalInfo.weightGain || 'N/A'}</Text></View>
          </View>
          <View style={shared.col2}>
            <View style={s.inlineKV}><Text style={s.inlineKey}>Personal Care:</Text><Text style={s.inlineVal}>{additionalInfo.personalCareServices === 'yes' ? `Yes (${additionalInfo.daysPerWeek} days/wk, ${additionalInfo.hoursPerWeek} hrs/wk)` : 'No'}</Text></View>
            <View style={s.inlineKV}><Text style={s.inlineKey}>Change in Condition:</Text><Text style={s.inlineVal}>{additionalInfo.changeInCondition === 'yes' ? `Yes (${additionalInfo.changeType}: ${additionalInfo.changeDetails})` : 'No'}</Text></View>
          </View>
        </View>
      </View>

      {/* Referral Source & Signature */}
      <View style={[shared.row2, { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: BRAND.zinc200, borderTopStyle: 'solid' }]}>
        <View style={shared.col2}>
          <Text style={shared.label}>Referral Signature</Text>
          {referralSource.signature ? <Image src={referralSource.signature} style={s.sigImg} /> : <View style={s.sigLine} />}
          <Text style={shared.muted}>Signed by: {[referralSource.printName, referralSource.title].filter(Boolean).join(', ') || 'N/A'}</Text>
        </View>
        <View style={shared.col2}>
          <View style={s.inlineKV}><Text style={s.inlineKey}>Organization:</Text><Text style={s.inlineVal}>{referralSource.organization || 'N/A'}</Text></View>
          <View style={s.inlineKV}><Text style={s.inlineKey}>Telephone:</Text><Text style={s.inlineVal}>{referralSource.telephone || 'N/A'}</Text></View>
          <View style={s.inlineKV}><Text style={s.inlineKey}>Address:</Text><Text style={s.inlineVal}>{addr(referralSource)}</Text></View>
        </View>
      </View>
    </BasePDFTemplate>
  );
};
