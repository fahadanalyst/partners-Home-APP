/**
 * BasePDFTemplate — @react-pdf/renderer version
 *
 * This is the shared header/footer wrapper for ALL form PDFs.
 *
 * IMPORTANT: This file uses @react-pdf/renderer primitives only.
 * Do NOT use HTML elements (div, p, span) or Tailwind classes here.
 * All styling is done via StyleSheet.create().
 */
import React from 'react';
import { Document, Page, View, Text, StyleSheet, Font } from '@react-pdf/renderer';

// ─── Brand colours ──────────────────────────────────────────────────────────
export const BRAND = {
  blue: '#005696',
  green: '#00A651',
  zinc900: '#18181b',
  zinc700: '#3f3f46',
  zinc600: '#52525b',
  zinc500: '#71717a',
  zinc400: '#a1a1aa',
  zinc200: '#e4e4e7',
  zinc100: '#f4f4f5',
  zinc50:  '#fafafa',
  white:   '#ffffff',
};

// ─── Shared styles you can import in every template ─────────────────────────
export const shared = StyleSheet.create({
  // Page
  page: {
    backgroundColor: BRAND.white,
    paddingTop: 36,
    paddingBottom: 48,
    paddingHorizontal: 36,
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: BRAND.zinc900,
  },
  // Section heading (blue underline)
  sectionTitle: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: BRAND.blue,
    textTransform: 'uppercase',
    letterSpacing: 1,
    borderBottomWidth: 1,
    borderBottomColor: BRAND.zinc200,
    borderBottomStyle: 'solid',
    paddingBottom: 3,
    marginBottom: 6,
  },
  // Label above a value
  label: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: BRAND.zinc400,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  // Value text
  value: {
    fontSize: 9,
    color: BRAND.zinc900,
    fontFamily: 'Helvetica',
  },
  // Bold value
  valueBold: {
    fontSize: 9,
    color: BRAND.zinc900,
    fontFamily: 'Helvetica-Bold',
  },
  // Light muted text
  muted: {
    fontSize: 8,
    color: BRAND.zinc500,
  },
  // Card container
  card: {
    backgroundColor: BRAND.zinc50,
    borderWidth: 1,
    borderColor: BRAND.zinc200,
    borderStyle: 'solid',
    borderRadius: 4,
    padding: 10,
    marginBottom: 10,
  },
  // 2-column row
  row2: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  col2: {
    flex: 1,
  },
  // 3-column row
  row3: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  col3: {
    flex: 1,
  },
  // 4-column row
  row4: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 8,
  },
  col4: {
    flex: 1,
  },
  // Space between sections
  spacer: {
    marginBottom: 12,
  },
  // Divider line
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: BRAND.zinc200,
    borderBottomStyle: 'solid',
    marginVertical: 8,
  },
  // Table
  table: {
    width: '100%',
    borderWidth: 1,
    borderColor: BRAND.zinc200,
    borderStyle: 'solid',
    marginBottom: 10,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: BRAND.zinc200,
    borderBottomStyle: 'solid',
  },
  tableHeader: {
    backgroundColor: BRAND.blue,
    flexDirection: 'row',
  },
  tableHeaderCell: {
    padding: 5,
    flex: 1,
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: BRAND.white,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tableCell: {
    padding: 5,
    flex: 1,
    fontSize: 8,
    color: BRAND.zinc700,
    fontFamily: 'Helvetica',
  },
  tableCellAlt: {
    padding: 5,
    flex: 1,
    fontSize: 8,
    color: BRAND.zinc700,
    fontFamily: 'Helvetica',
    backgroundColor: BRAND.zinc50,
  },
  // Signature line
  signatureLine: {
    borderBottomWidth: 1,
    borderBottomColor: BRAND.zinc400,
    borderBottomStyle: 'solid',
    marginBottom: 2,
    marginTop: 20,
    width: '60%',
  },
});

// ─── Header bar ─────────────────────────────────────────────────────────────
const headerStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 3,
    borderBottomColor: BRAND.blue,
    borderBottomStyle: 'solid',
    paddingBottom: 8,
    marginBottom: 16,
  },
  left: {
    flexDirection: 'column',
  },
  orgName: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    color: BRAND.blue,
    letterSpacing: -0.5,
  },
  orgSub: {
    fontSize: 6,
    fontFamily: 'Helvetica-Bold',
    color: BRAND.zinc400,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginTop: 1,
  },
  right: {
    alignItems: 'flex-end',
  },
  formTitle: {
    fontSize: 13,
    fontFamily: 'Helvetica-Bold',
    color: BRAND.zinc900,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    textAlign: 'right',
  },
  dateLine: {
    fontSize: 7,
    color: BRAND.zinc500,
    marginTop: 3,
    textAlign: 'right',
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});

interface HeaderProps {
  title: string;
  date?: string;
}
export const PDFHeader: React.FC<HeaderProps> = ({ title, date }) => (
  <View style={headerStyles.container} fixed>
    <View style={headerStyles.left}>
      <Text style={headerStyles.orgName}>Partners Home</Text>
      <Text style={headerStyles.orgSub}>Nursing Services  ·  HIPAA Portal</Text>
    </View>
    <View style={headerStyles.right}>
      <Text style={headerStyles.formTitle}>{title}</Text>
      {date && <Text style={headerStyles.dateLine}>Form Date: {date}</Text>}
      <Text style={headerStyles.dateLine}>Generated: {new Date().toLocaleDateString()}</Text>
    </View>
  </View>
);

// ─── Footer bar ─────────────────────────────────────────────────────────────
const footerStyles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 18,
    left: 36,
    right: 36,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: BRAND.zinc200,
    borderTopStyle: 'solid',
    paddingTop: 4,
  },
  phi: {
    fontSize: 6.5,
    color: BRAND.zinc400,
    fontFamily: 'Helvetica',
    flex: 1,
  },
  pageNum: {
    fontSize: 7,
    color: BRAND.zinc400,
    fontFamily: 'Helvetica-Bold',
  },
});

export const PDFFooter: React.FC<{ formName?: string }> = ({ formName }) => (
  <View style={footerStyles.container} fixed>
    <Text style={footerStyles.phi}>
      Protected Health Information (PHI) — Authorized use only.
      Partners Home Nursing Services © {new Date().getFullYear()}
      {formName ? `  ·  ${formName}` : ''}
    </Text>
    <Text style={footerStyles.pageNum} render={({ pageNumber, totalPages }) =>
      `Page ${pageNumber} of ${totalPages}`
    } />
  </View>
);

// ─── Convenience wrapper ─────────────────────────────────────────────────────
interface BasePDFTemplateProps {
  title: string;
  children: React.ReactNode;
  date?: string;
  orientation?: 'portrait' | 'landscape';
}

/**
 * Wrap your page content in this to get the standard header + footer.
 *
 * Usage:
 *   <BasePDFTemplate title="Nursing Assessment" date={data.date}>
 *     <View>...</View>
 *   </BasePDFTemplate>
 */
export const BasePDFTemplate: React.FC<BasePDFTemplateProps> = ({
  title,
  children,
  date,
  orientation = 'portrait',
}) => (
  <Document>
    <Page size="A4" orientation={orientation} style={shared.page}>
      <PDFHeader title={title} date={date} />
      {children}
      <PDFFooter formName={title} />
    </Page>
  </Document>
);
