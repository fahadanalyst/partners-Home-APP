# PDF Migration Guide — Partners Home Nursing Services

## Root Cause of the Broken PDFs

Your app uses **Tailwind v4**, which generates `oklch()` CSS color functions.  
`html2canvas` (your old approach) **cannot parse `oklch()`** — it silently fails,  
producing blank pages, wrong colors, or completely broken output.

No amount of patching `html2canvas` fixes this reliably for long clinical forms.

---

## The Fix: Switch to `@react-pdf/renderer`

`@react-pdf/renderer` converts React components **directly to a real PDF** — no canvas,
no screenshot, no DOM rendering, no color parsing. It:

- Handles multi-page forms automatically
- Produces real searchable/selectable text
- Never has color issues (you define colors as hex strings)
- Renders cleanly on every browser

---

## Step 1 — Install the package

```bash
npm install @react-pdf/renderer
```

---

## Step 2 — Files already updated for you

The following files have been rewritten and are ready to use:

| File | Status |
|------|--------|
| `src/utils/pdfGenerator.ts` | ✅ Rewritten — uses `@react-pdf/renderer` |
| `src/components/PDFTemplates/BasePDFTemplate.tsx` | ✅ Rewritten — exports shared styles, `PDFHeader`, `PDFFooter`, `BasePDFTemplate` wrapper |
| `src/components/PDFTemplates/NursingAssessmentTemplate.tsx` | ✅ Rewritten — **use as the reference implementation** |

The `pdfService.ts` and all page-level `handlePrint()` functions do **not** need to change.

---

## Step 3 — Migrate the remaining 13 templates

For each remaining template, follow this pattern (use `NursingAssessmentTemplate.tsx` as your guide):

### Template skeleton

```tsx
import React from 'react';
import { View, Text, Image, StyleSheet } from '@react-pdf/renderer';
import { BasePDFTemplate, shared, BRAND } from './BasePDFTemplate';

// 1. Define local styles with StyleSheet.create()
const s = StyleSheet.create({
  // your styles here — NO Tailwind, NO class names
});

export const YourTemplate: React.FC<{ data: any }> = ({ data }) => {
  const { /* destructure your fields */ } = data;

  return (
    // 2. BasePDFTemplate wraps everything in <Document><Page>
    // It adds the branded header + footer automatically
    <BasePDFTemplate title="Your Form Title" date={data.date}>

      {/* 3. Use View (not div), Text (not p/span) */}
      <View style={shared.card}>
        <Text style={shared.label}>Field Label</Text>
        <Text style={shared.value}>{data.someField || 'N/A'}</Text>
      </View>

    </BasePDFTemplate>
  );
};
```

### Conversion cheat sheet

| HTML / Tailwind | @react-pdf/renderer |
|-----------------|---------------------|
| `<div>` | `<View>` |
| `<p>`, `<span>`, `<h3>` | `<Text>` |
| `<img src={...}>` | `<Image src={...}>` |
| `className="grid grid-cols-2 gap-4"` | `style={{ flexDirection: 'row', gap: 16 }}` |
| `className="text-zinc-500 text-xs font-bold uppercase"` | `style={shared.label}` |
| `className="text-sm text-zinc-900"` | `style={shared.value}` |
| `className="bg-zinc-50 border border-zinc-200 p-4 rounded"` | `style={shared.card}` |
| `className="text-partners-blue-dark uppercase font-bold border-b"` | `style={shared.sectionTitle}` |
| `className="grid grid-cols-2 gap-4"` | `<View style={shared.row2}><View style={shared.col2}>...` |
| `className="grid grid-cols-3 gap-4"` | `<View style={shared.row3}><View style={shared.col3}>...` |

### Colors (use these constants from `BasePDFTemplate`)

```ts
import { BRAND } from './BasePDFTemplate';
// BRAND.blue      '#005696'
// BRAND.green     '#00A651'
// BRAND.zinc900   '#18181b'
// BRAND.zinc500   '#71717a'
// BRAND.zinc200   '#e4e4e7'
// BRAND.white     '#ffffff'
// etc.
```

### Tables (MAR/TAR templates)

```tsx
import { shared } from './BasePDFTemplate';

<View style={shared.table}>
  <View style={shared.tableHeader}>
    <Text style={shared.tableHeaderCell}>Date</Text>
    <Text style={shared.tableHeaderCell}>Medication</Text>
    <Text style={shared.tableHeaderCell}>Dose</Text>
  </View>
  {rows.map((row, i) => (
    <View key={i} style={shared.tableRow}>
      <Text style={i % 2 === 0 ? shared.tableCell : shared.tableCellAlt}>{row.date}</Text>
      <Text style={i % 2 === 0 ? shared.tableCell : shared.tableCellAlt}>{row.medication}</Text>
      <Text style={i % 2 === 0 ? shared.tableCell : shared.tableCellAlt}>{row.dose}</Text>
    </View>
  ))}
</View>
```

### Signatures

```tsx
import { Image, View } from '@react-pdf/renderer';

{signature
  ? <Image src={signature} style={{ width: 160, height: 40, objectFit: 'contain' }} />
  : <View style={{ width: 160, height: 40, borderBottomWidth: 1, borderBottomColor: '#a1a1aa', borderBottomStyle: 'solid' }} />
}
```

### Multi-page (for very long forms like MDSAssessment, GAFCCarePlan)

If a form is too long to fit on one page, you have two options:

**Option A — Let @react-pdf auto-paginate** (simplest, usually works fine):
Just return `<BasePDFTemplate>` as normal. Content that doesn't fit will automatically overflow to the next page.

**Option B — Manual page breaks** (for forms with distinct sections):
```tsx
import { Document, Page } from '@react-pdf/renderer';
import { PDFHeader, PDFFooter, shared } from './BasePDFTemplate';

export const LongFormTemplate: React.FC<{ data: any }> = ({ data }) => (
  <Document>
    <Page size="A4" style={shared.page}>
      <PDFHeader title="Long Form" date={data.date} />
      {/* Section 1 content */}
      <PDFFooter formName="Long Form" />
    </Page>
    <Page size="A4" style={shared.page}>
      <PDFHeader title="Long Form (cont.)" />
      {/* Section 2 content */}
      <PDFFooter formName="Long Form" />
    </Page>
  </Document>
);
```

---

## Remaining templates to migrate

- [ ] `AdmissionAssessmentTemplate.tsx`
- [ ] `ClinicalNoteTemplate.tsx`
- [ ] `DischargeSummaryTemplate.tsx`
- [ ] `GAFCCarePlanTemplate.tsx`
- [ ] `GAFCProgressNoteTemplate.tsx`
- [ ] `MAR_Template.tsx`
- [ ] `MDSAssessmentTemplate.tsx`
- [ ] `PatientResourceDataTemplate.tsx`
- [ ] `PatientSummaryTemplate.tsx`
- [ ] `PhysicianOrdersTemplate.tsx`
- [ ] `PhysicianSummaryTemplate.tsx`
- [ ] `RequestForServicesTemplate.tsx`
- [ ] `TAR_Template.tsx`

---

## What to remove / clean up

Once all templates are migrated:

1. Remove `html2canvas` and `jsPDF` from `package.json` — they're no longer needed:
   ```bash
   npm uninstall html2canvas jspdf
   ```

2. Delete `src/utils/pdfExport.ts` — the fallback `html2canvas` export is no longer needed.

3. Remove the fallback block in all `handlePrint()` functions in your pages:
   ```ts
   // DELETE this block from every page:
   if (!success && formRef.current) {
     const { exportToPDF } = await import('../utils/pdfExport');
     await exportToPDF(...);
   }
   ```

---

## FAQ

**Q: Do I need to change `pdfService.ts` or any page files?**  
No. `generateFormPDF()` in `pdfService.ts` calls `generatePDFFromTemplate()` which now
uses `@react-pdf/renderer`. Pages just call `handlePrint()` as before.

**Q: What about the `pdfExport.ts` fallback?**  
It can stay temporarily as a safety net during migration. Once all templates are migrated, delete it.

**Q: Can I use Tailwind classes in the template?**  
No. `@react-pdf/renderer` renders to PDF, not a browser DOM. Tailwind classes don't exist there.
Use `StyleSheet.create()` and the `shared` styles from `BasePDFTemplate`.

**Q: Can I preview the PDF in the browser before downloading?**  
Yes — wrap your template in `<PDFViewer>` from `@react-pdf/renderer`. Useful for debugging.
