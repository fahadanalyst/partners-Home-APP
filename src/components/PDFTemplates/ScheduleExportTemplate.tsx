import React from 'react';
import { View, Text, StyleSheet } from '@react-pdf/renderer';
import { BasePDFTemplate, shared, BRAND } from './BasePDFTemplate';

const s = StyleSheet.create({
  summaryCard: {
    backgroundColor: 'rgba(0,86,150,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(0,86,150,0.18)',
    borderStyle: 'solid',
    borderRadius: 6,
    padding: 10,
    marginBottom: 12,
  },
  metricRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  metric: {
    flex: 1,
    backgroundColor: BRAND.white,
    borderWidth: 1,
    borderColor: BRAND.zinc200,
    borderStyle: 'solid',
    borderRadius: 4,
    padding: 7,
  },
  table: {
    borderWidth: 1,
    borderColor: BRAND.zinc200,
    borderStyle: 'solid',
  },
  row: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: BRAND.zinc100,
    borderBottomStyle: 'solid',
    minHeight: 28,
  },
  header: {
    backgroundColor: BRAND.blue,
  },
  altRow: {
    backgroundColor: BRAND.zinc50,
  },
  patientCol: { width: '22%', padding: 5 },
  dateCol: { width: '15%', padding: 5 },
  timeCol: { width: '14%', padding: 5 },
  locationCol: { width: '18%', padding: 5 },
  staffCol: { width: '19%', padding: 5 },
  statusCol: { width: '12%', padding: 5 },
  th: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: BRAND.white,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  td: {
    fontSize: 8,
    color: BRAND.zinc700,
  },
  tdBold: {
    fontSize: 8,
    color: BRAND.zinc900,
    fontFamily: 'Helvetica-Bold',
  },
  statusBadge: {
    backgroundColor: 'rgba(0,86,150,0.1)',
    borderRadius: 8,
    paddingHorizontal: 5,
    paddingVertical: 2,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 6.5,
    color: BRAND.blue,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
  },
  emptyState: {
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: BRAND.zinc200,
    borderStyle: 'dashed',
    borderRadius: 6,
  },
});

const formatDate = (value?: string | null) => {
  if (!value) return '--';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? '--'
    : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const valueOrDash = (value?: string | null) => value || '--';

export const ScheduleExportTemplate: React.FC<{ data: any }> = ({ data }) => {
  const visits: any[] = data?.visits || [];

  return (
    <BasePDFTemplate title="Schedule Export" date={data?.rangeLabel}>
      <View style={s.summaryCard}>
        <View style={shared.row3}>
          <View style={shared.col3}>
            <Text style={shared.label}>Date Range</Text>
            <Text style={shared.valueBold}>{data?.rangeLabel || 'All selected dates'}</Text>
          </View>
          <View style={shared.col3}>
            <Text style={shared.label}>Status Filter</Text>
            <Text style={shared.valueBold}>{data?.filterLabel || 'All'}</Text>
          </View>
          <View style={shared.col3}>
            <Text style={shared.label}>Exported</Text>
            <Text style={shared.value}>{formatDate(data?.generatedAt)}</Text>
          </View>
        </View>

        <View style={s.metricRow}>
          <View style={s.metric}>
            <Text style={shared.label}>Visible Visits</Text>
            <Text style={shared.valueBold}>{String(visits.length)}</Text>
          </View>
          <View style={s.metric}>
            <Text style={shared.label}>Verified</Text>
            <Text style={shared.valueBold}>{String(data?.verifiedCount ?? 0)}</Text>
          </View>
          <View style={s.metric}>
            <Text style={shared.label}>Assigned</Text>
            <Text style={shared.valueBold}>{String(data?.assignedCount ?? 0)}</Text>
          </View>
        </View>
      </View>

      <Text style={shared.sectionTitle}>Visits</Text>
      {visits.length === 0 ? (
        <View style={s.emptyState}>
          <Text style={shared.muted}>No visits matched the current filters.</Text>
        </View>
      ) : (
        <View style={s.table}>
          <View style={[s.row, s.header]} fixed>
            <View style={s.patientCol}><Text style={s.th}>Patient</Text></View>
            <View style={s.dateCol}><Text style={s.th}>Date</Text></View>
            <View style={s.timeCol}><Text style={s.th}>Time</Text></View>
            <View style={s.locationCol}><Text style={s.th}>Location</Text></View>
            <View style={s.staffCol}><Text style={s.th}>Staff</Text></View>
            <View style={s.statusCol}><Text style={s.th}>Status</Text></View>
          </View>
          {visits.map((visit, index) => (
            <View key={visit.id || index} style={[s.row, index % 2 === 1 ? s.altRow : {}]} wrap={false}>
              <View style={s.patientCol}>
                <Text style={s.tdBold}>{valueOrDash(visit.patientName)}</Text>
              </View>
              <View style={s.dateCol}>
                <Text style={s.td}>{formatDate(visit.scheduledAt)}</Text>
              </View>
              <View style={s.timeCol}>
                <Text style={s.td}>{valueOrDash(visit.time)}</Text>
              </View>
              <View style={s.locationCol}>
                <Text style={s.td}>{valueOrDash(visit.location)}</Text>
              </View>
              <View style={s.staffCol}>
                <Text style={s.td}>{valueOrDash(visit.staffName)}</Text>
              </View>
              <View style={s.statusCol}>
                <View style={s.statusBadge}>
                  <Text style={s.statusText}>{valueOrDash(visit.status)}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      )}
    </BasePDFTemplate>
  );
};
