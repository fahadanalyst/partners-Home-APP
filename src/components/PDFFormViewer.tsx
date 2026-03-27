/**
 * PDFFormViewer
 * pdfjs-dist renders pages → canvas (visual)
 * pdf-lib extracts field positions → HTML inputs overlaid exactly on fields
 * Download  → bake values → hidden iframe → browser print dialog (Save as PDF)
 * Submit    → bake values → Supabase Storage + DB row → reset
 *
 * npm install pdfjs-dist pdf-lib
 *
 * If the pdfjs worker import causes a TS error, add to vite-env.d.ts:
 *   /// <reference types="vite/client" />
 *
 * If the ?url worker import fails at runtime, copy the worker manually:
 *   cp node_modules/pdfjs-dist/build/pdf.worker.min.mjs public/pdf.worker.min.mjs
 *   then change workerSrc to: '/pdf.worker.min.mjs'
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ArrowLeft, Download, FileText, AlertCircle,
  Send, X, CheckCircle, Loader2, ChevronDown,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import {
  PDFDocument,
  PDFCheckBox, PDFTextField, PDFDropdown, PDFRadioGroup,
} from 'pdf-lib';
import { supabase } from '../services/supabase';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorkerUrl;

const RENDER_SCALE = 1.8;

type FieldType = 'text' | 'multiline' | 'checkbox' | 'radio' | 'dropdown';

interface FieldInfo {
  name: string;
  /** Unique key per widget — name for single-widget, name__x__y for multi-widget */
  valueKey: string;
  type: FieldType; pageIndex: number;
  /** PDF-space coords from pdfjs (NOT pdf-lib) — guaranteed to match rendered canvas */
  px1: number; py1: number; px2: number; py2: number;
  options?: string[];
  isComb?: boolean;
  combLen?: number;
}

interface PageDim {
  width: number; height: number;  // canvas pixels at RENDER_SCALE
  /** MediaBox bottom-left origin in PDF points (usually 0,0 but not always) */
  mbX: number; mbY: number;
  /** Page rotation in degrees (0, 90, 180, 270) */
  rotation: number;
}
interface Patient  { id: string; first_name: string; last_name: string; }

export interface PDFFormViewerProps {
  title: string;
  description: string;
  pdfPath: string;
  accentColor?: string;
  formName?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
export const PDFFormViewer: React.FC<PDFFormViewerProps> = ({
  title, description, pdfPath,
  accentColor = 'bg-blue-100 text-blue-600',
  formName,
}) => {
  const navigate = useNavigate();

  // Refs keep latest state readable inside callbacks without stale closures
  const formValuesRef = useRef<Record<string, string>>({});
  const fieldsRef     = useRef<FieldInfo[]>([]);

  // ── UI state ────────────────────────────────────────────────────────────────
  const [pageDims,    setPageDims]    = useState<PageDim[]>([]);
  const [fields,      setFields]      = useState<FieldInfo[]>([]);
  const [formValues,  setFormValues]  = useState<Record<string, string>>({});
  const [pdfLoading,  setPdfLoading]  = useState(true);
  const [loadError,   setLoadError]   = useState<string | null>(null);
  const [containerW,  setContainerW]  = useState(0);

  // Keep refs in sync with state so callbacks always read latest values
  formValuesRef.current = formValues;
  fieldsRef.current     = fields;

  // ── Refs ────────────────────────────────────────────────────────────────────
  const pdfjsDocRef    = useRef<pdfjsLib.PDFDocumentProxy | null>(null);
  const canvasRefs     = useRef<Record<number, HTMLCanvasElement | null>>({});
  const renderTasks    = useRef<Record<number, { cancel(): void } | null>>({});
  const containerRef   = useRef<HTMLDivElement>(null);

  // ── Container width → CSS scale ────────────────────────────────────────────
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    setContainerW(el.clientWidth);
    const ro = new ResizeObserver(([e]) => setContainerW(e.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const maxW    = pageDims.length ? Math.max(...pageDims.map(d => d.width)) : 1;
  const cssScale = containerW > 0 ? Math.min((containerW - 32) / maxW, 1) : 1;

  // ── Render one page to its canvas ──────────────────────────────────────────
  const renderPage = useCallback(async (canvas: HTMLCanvasElement, idx: number) => {
    const doc = pdfjsDocRef.current;
    if (!doc) return;
    // Cancel any in-flight render for this canvas first
    try { renderTasks.current[idx]?.cancel(); } catch {}
    renderTasks.current[idx] = null;
    try {
      const page     = await doc.getPage(idx + 1);
      const viewport = page.getViewport({ scale: RENDER_SCALE });
      canvas.width   = viewport.width;
      canvas.height  = viewport.height;
      const task = page.render({ canvasContext: canvas.getContext('2d')!, viewport });
      renderTasks.current[idx] = task;
      await task.promise;
    } catch (e: any) {
      if (e?.name !== 'RenderingCancelledException')
        console.warn('[PDFFormViewer] render error page', idx, e);
    } finally {
      renderTasks.current[idx] = null;
    }
  }, []);

  // Canvas ref callback — only triggers renderPage when the DOM element changes
  const setCanvasRef = useCallback((el: HTMLCanvasElement | null, idx: number) => {
    const prev = canvasRefs.current[idx];
    canvasRefs.current[idx] = el;
    if (el && el !== prev) renderPage(el, idx);
  }, [renderPage]);

  // ── Load PDF ────────────────────────────────────────────────────────────────
  useEffect(() => {
    let active = true;

    // Cancel previous renders
    Object.values(renderTasks.current).forEach(t => { try { t?.cancel(); } catch {} });
    renderTasks.current  = {};
    canvasRefs.current   = {};
    pdfjsDocRef.current  = null;

    setPdfLoading(true);
    setLoadError(null);
    setPageDims([]);
    setFields([]);
    setFormValues({});

    (async () => {
      try {
        // ── 1. Fetch bytes ──────────────────────────────────────────────────
        const res = await fetch(pdfPath);
        if (!res.ok) throw new Error(`Server returned HTTP ${res.status} for "${pdfPath}"`);

        // Validate content-type — Vite can return HTML on misconfigured paths
        const ct = res.headers.get('content-type') ?? '';
        if (ct.includes('text/html'))
          throw new Error(`"${pdfPath}" returned HTML — check the file exists in /public/`);

        const buffer = await res.arrayBuffer();
        const bytes  = new Uint8Array(buffer);

        // Validate PDF magic bytes (%PDF)
        if (bytes[0] !== 0x25 || bytes[1] !== 0x50 || bytes[2] !== 0x44 || bytes[3] !== 0x46)
          throw new Error(`"${pdfPath}" is not a valid PDF (magic bytes: ${bytes[0]},${bytes[1]},${bytes[2]},${bytes[3]})`);

        if (!active) return;

        // ── 2. Load pdfjs FIRST — use it as ground truth for page ownership ──
        // pdfjs.getAnnotations() is the definitive source for which page owns
        // which widget. We build a rect-keyed map: "x1_y1_x2_y2" → pageIndex.
        // Both pdfjs and pdf-lib read the same /Rect array from the same file,
        // so rects match exactly (within rounding).
        // .slice() copies the buffer — pdfjs transfers (detaches) the ArrayBuffer
        // it receives, so without a copy, bytes would be empty when pdf-lib reads it.
        const pdfjsDoc = await pdfjsLib.getDocument({ data: bytes.slice() }).promise;
        if (!active) return;
        pdfjsDocRef.current = pdfjsDoc;

        // rectInfoMap: "round(x1)_round(y1)_round(x2)_round(y2)"
        //   → { pageIndex, pdfjsRect, fieldName }
        // We store the pdfjs rect (not pdf-lib's) for positioning because pdfjs
        // already accounts for CropBox/MediaBox differences — its rect is guaranteed
        // to match the rendered canvas pixel positions.
        type RectInfo = { pageIndex: number; pdfjsRect: number[]; fieldName?: string };
        const rectInfoMap = new Map<string, RectInfo>();
        const dims: PageDim[] = [];

        for (let i = 0; i < pdfjsDoc.numPages; i++) {
          const pdfjsPage = await pdfjsDoc.getPage(i + 1);
          const vp        = pdfjsPage.getViewport({ scale: RENDER_SCALE });
          const view      = (pdfjsPage as any).view as [number, number, number, number];
          dims.push({
            width:    vp.width,
            height:   vp.height,
            mbX:      view[0],
            mbY:      view[1],
            rotation: (pdfjsPage as any).rotate ?? 0,
          });

          const annots = await pdfjsPage.getAnnotations();
          for (const annot of annots) {
            if (annot.subtype === 'Widget' && annot.rect) {
              const r       = annot.rect as number[];
              const key     = `${Math.round(r[0])}_${Math.round(r[1])}_${Math.round(r[2])}_${Math.round(r[3])}`;
              const fName   = annot.fieldName as string | undefined;
              rectInfoMap.set(key, { pageIndex: i, pdfjsRect: r, fieldName: fName });
            }
          }
        }

        if (!active) return;

        // ── 3. Extract AcroForm fields with pdf-lib ────────────────────────
        // Use rectPageMap (from pdfjs) to determine page ownership — reliable
        // for all PDFs regardless of whether widget.P() is present/correct.
        const pdfLibDoc = await PDFDocument.load(bytes, { ignoreEncryption: true });
        if (!active) return;

        const libForm  = pdfLibDoc.getForm();
        const extracted: FieldInfo[]            = [];
        const initVals: Record<string, string>  = {};

        for (const field of libForm.getFields()) {
          const name    = field.getName();
          const widgets = field.acroField.getWidgets();

          let type: FieldType = 'text';
          let options: string[] | undefined;

          if      (field instanceof PDFCheckBox)   type = 'checkbox';
          else if (field instanceof PDFRadioGroup) { type = 'radio';    options = (field as any).getOptions?.() ?? []; }
          else if (field instanceof PDFDropdown)   { type = 'dropdown'; options = (field as any).getOptions?.() ?? []; }
          else if (field instanceof PDFTextField)  type   = (field as any).isMultiline?.() ? 'multiline' : 'text';

          // Detect comb fields (MaxLen + Comb flag = individual char boxes)
          let isComb = false;
          let combLen = 0;
          if (field instanceof PDFTextField && widgets.length === 1) {
            const acro = field.acroField;
            const flags = acro.getFlags();
            const hasCombFlag = (flags & (1 << 24)) !== 0;
            const maxLen = acro.getMaxLength();
            if (hasCombFlag && maxLen && maxLen > 1) {
              isComb  = true;
              combLen = maxLen;
            }
          }

          const multiWidget = widgets.length > 1;
          for (const widget of widgets) {
            const rect = widget.getRectangle();

            // Match widget to pdfjs annotation by rect coordinates.
            // Use pdfjs rect [x1,y1,x2,y2] for positioning — it's the ground truth.
            const x2  = rect.x + rect.width;
            const y2  = rect.y + rect.height;
            const key = `${Math.round(rect.x)}_${Math.round(rect.y)}_${Math.round(x2)}_${Math.round(y2)}`;
            let info  = rectInfoMap.get(key);

            if (!info) {
              // ±2pt tolerance fallback for floating-point rounding differences
              for (const [k, v] of rectInfoMap) {
                const p = k.split('_').map(Number);
                if (Math.abs(p[0]-rect.x)<2 && Math.abs(p[1]-rect.y)<2 &&
                    Math.abs(p[2]-x2)<2     && Math.abs(p[3]-y2)<2) {
                  info = v; break;
                }
              }
            }

            const pageIndex = info?.pageIndex ?? 0;
            // Use pdfjs rect for pixel-accurate positioning; fall back to pdf-lib rect
            const pr = info?.pdfjsRect ?? [rect.x, rect.y, x2, y2];

            const valueKey = multiWidget
              ? `${name}__${Math.round(rect.x)}__${Math.round(rect.y)}`
              : name;
            extracted.push({
              name, valueKey, type, pageIndex,
              px1: pr[0], py1: pr[1], px2: pr[2], py2: pr[3],
              options, isComb, combLen,
            });
            if (!(valueKey in initVals)) initVals[valueKey] = type === 'checkbox' ? 'false' : '';
          }
        }

        if (!active) return;
        setFields(extracted);
        setFormValues(initVals);

        if (!active) return;
        setPageDims(dims);  // triggers canvas mounts → setCanvasRef → renderPage
      } catch (err: any) {
        console.error('[PDFFormViewer] load error:', err);
        if (active) setLoadError(err?.message ?? 'Unknown error loading PDF');
      } finally {
        if (active) setPdfLoading(false);
      }
    })();

    return () => { active = false; };
  }, [pdfPath]);

  // ── Bake form values into PDF bytes ────────────────────────────────────────
  // Re-fetches the PDF directly every time — 100% reliable because:
  //  • the file is in /public so the browser serves it from cache (instant)
  //  • avoids ALL ref/stale-closure timing issues entirely
  const buildFilledBytes = useCallback(async (): Promise<Uint8Array> => {
    // Fetch fresh from /public (browser cache hit — effectively instant)
    const res = await fetch(pdfPath);
    if (!res.ok) throw new Error(`Cannot fetch PDF: HTTP ${res.status}`);
    const src = new Uint8Array(await res.arrayBuffer());

    if (src[0] !== 0x25 || src[1] !== 0x50 || src[2] !== 0x44 || src[3] !== 0x46)
      throw new Error(`"${pdfPath}" is not a valid PDF file.`);

    const doc      = await PDFDocument.load(src, { ignoreEncryption: true });
    const form     = doc.getForm();
    const vals     = formValuesRef.current;
    // fieldsSnapshot lets us map valueKey back to field name for multi-widget fields
    const snapshot = fieldsRef.current;

    for (const field of form.getFields()) {
      const name = field.getName();
      // Find all FieldInfo entries that belong to this pdf-lib field
      const entries = snapshot.filter(f => f.name === name);

      if (entries.length === 0) continue;

      try {
        if (field instanceof PDFTextField) {
          if (entries.length === 1) {
            // Normal single-widget text field — use its valueKey directly
            (field as any).setText(vals[entries[0].valueKey] ?? '');
          } else {
            // Multi-widget text field (rare) — concatenate all char-box values
            const combined = entries
              .sort((a, b) => a.px1 - b.px1 || a.py1 - b.py1)
              .map(e => vals[e.valueKey] ?? '')
              .join('');
            (field as any).setText(combined);
          }
        } else if (field instanceof PDFCheckBox) {
          const value = vals[entries[0].valueKey] ?? 'false';
          (field as any)[value === 'true' ? 'check' : 'uncheck']();
        } else if (field instanceof PDFDropdown) {
          const value = vals[entries[0].valueKey] ?? '';
          if (value) (field as any).select(value);
        } else if (field instanceof PDFRadioGroup) {
          const value = vals[entries[0].valueKey] ?? '';
          if (value) (field as any).select(value);
        }
      } catch (e) {
        console.warn(`[PDFFormViewer] skipping field "${name}":`, e);
      }
    }

    return doc.save();
  }, [pdfPath]); // pdfPath needed since we fetch it directly

  // ── Reset ───────────────────────────────────────────────────────────────────
  const resetForm = useCallback(() => {
    setFormValues(prev => {
      const blank: Record<string, string> = {};
      for (const k of Object.keys(prev))
        blank[k] = prev[k] === 'true' || prev[k] === 'false' ? 'false' : '';
      return blank;
    });
  }, []);

  // ── Download → print dialog (Save as PDF) ──────────────────────────────────
  const handleDownload = useCallback(async () => {
    try {
      const filled  = await buildFilledBytes();
      const blobUrl = URL.createObjectURL(new Blob([filled], { type: 'application/pdf' }));
      const frame   = document.createElement('iframe');
      frame.style.cssText = 'position:fixed;width:1px;height:1px;opacity:0;top:-9999px;';
      frame.src = blobUrl;
      document.body.appendChild(frame);
      frame.onload = () => {
        frame.contentWindow?.focus();
        frame.contentWindow?.print();
        setTimeout(() => {
          document.body.removeChild(frame);
          URL.revokeObjectURL(blobUrl);
        }, 3000);
      };
    } catch (err: any) {
      console.error('[PDFFormViewer] download error', err);
      alert(`Download failed: ${err?.message}`);
    }
  }, [buildFilledBytes]);

  // ── Submit modal ─────────────────────────────────────────────────────────────
  const [showModal,          setShowModal]          = useState(false);
  const [patients,           setPatients]           = useState<Patient[]>([]);
  const [patientsLoading,    setPatientsLoading]    = useState(false);
  const [selectedPatientId,  setSelectedPatientId]  = useState('');
  const [notes,              setNotes]              = useState('');
  const [isSubmitting,       setIsSubmitting]       = useState(false);
  const [submitResult,       setSubmitResult]       = useState<
    { type: 'success' | 'error'; message: string } | null
  >(null);

  useEffect(() => {
    if (!showModal) return;
    setPatientsLoading(true);
    supabase.from('patients').select('id, first_name, last_name').order('last_name')
      .then(({ data }) => { setPatients(data ?? []); setPatientsLoading(false); });
  }, [showModal]);

  const closeModal = () => {
    setShowModal(false);
    setSelectedPatientId('');
    setNotes('');
    setSubmitResult(null);
  };

  const handleSubmit = async () => {
    if (!selectedPatientId) return;
    setIsSubmitting(true);
    setSubmitResult(null);
    try {
      const { data: { user }, error: authErr } = await supabase.auth.getUser();
      if (authErr || !user) throw new Error('Not authenticated — please log in again.');

      const filled      = await buildFilledBytes();
      const slug        = (formName ?? title).toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const storagePath = `${slug}/${selectedPatientId}/${Date.now()}.pdf`;

      const { error: upErr } = await supabase.storage
        .from('pdf-submissions')
        .upload(storagePath, filled, { contentType: 'application/pdf', upsert: false });
      if (upErr) throw upErr;

      const { data: formRec } = await supabase
        .from('forms').select('id').eq('name', formName ?? title).maybeSingle();

      const { error: dbErr } = await supabase.from('form_responses').insert({
        form_id:      formRec?.id ?? null,
        patient_id:   selectedPatientId,
        staff_id:     user.id,
        status:       'submitted',
        storage_path: storagePath,
        notes:        notes.trim() || null,
        data: { form_name: formName ?? title, submitted_at: new Date().toISOString(), storage_path: storagePath },
      });
      if (dbErr) throw dbErr;

      resetForm();
      setSubmitResult({ type: 'success', message: 'Submitted!' });
    } catch (err: any) {
      console.error('[PDFFormViewer] submit error', err);
      setSubmitResult({ type: 'error', message: err?.message ?? 'Unexpected error.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Field overlay renderer ──────────────────────────────────────────────────
  const renderOverlay = (field: FieldInfo, dim: PageDim) => {
    // Use pdfjs rect [px1,py1,px2,py2] for pixel-accurate positioning.
    // pdfjs already accounts for CropBox, MediaBox origin, and page rotation —
    // its coordinates are guaranteed to match what's rendered on the canvas.
    //
    // Transform: PDF space (origin bottom-left) → CSS space (origin top-left)
    // The rendered canvas height in PDF points is dim.height / RENDER_SCALE.
    // pdfjs view[1] (mbY) is the bottom of the visible area in PDF points.
    const pageHpt = dim.height / RENDER_SCALE;  // canvas height in PDF points

    // For 0° and 180° pages: left = (px1-mbX)*S, top = (pageHpt-(py2-mbY))*S
    // For 90° and 270° pages: axes are swapped by pdfjs in the viewport
    // BUT pdfjs rect is always in the original (unrotated) PDF coordinate space,
    // so we still apply the rotation ourselves for correct CSS positioning.
    let left: number, top: number, width: number, height: number;
    const x1 = field.px1 - dim.mbX;
    const y1 = field.py1 - dim.mbY;
    const x2 = field.px2 - dim.mbX;
    const y2 = field.py2 - dim.mbY;
    const fw = x2 - x1;
    const fh = y2 - y1;
    const pageWpt = dim.width / RENDER_SCALE;

    if (dim.rotation === 90) {
      left   = y1                  * RENDER_SCALE;
      top    = (pageWpt - x2)      * RENDER_SCALE;
      width  = fh                  * RENDER_SCALE;
      height = fw                  * RENDER_SCALE;
    } else if (dim.rotation === 180) {
      left   = (pageWpt - x2)      * RENDER_SCALE;
      top    = (pageHpt - y2)      * RENDER_SCALE;
      width  = fw                  * RENDER_SCALE;
      height = fh                  * RENDER_SCALE;
    } else if (dim.rotation === 270) {
      left   = (pageHpt - y2)      * RENDER_SCALE;
      top    = x1                  * RENDER_SCALE;
      width  = fh                  * RENDER_SCALE;
      height = fw                  * RENDER_SCALE;
    } else {
      // 0° — flip Y axis only
      left   = x1                  * RENDER_SCALE;
      top    = (pageHpt - y2)      * RENDER_SCALE;
      width  = fw                  * RENDER_SCALE;
      height = fh                  * RENDER_SCALE;
    }

    const fs  = Math.max(8, Math.min(height * 0.58, 13));
    const key = `${field.name}__${field.pageIndex}__${field.px1}__${field.py1}`;
    const style: React.CSSProperties = { position: 'absolute', left, top, width, height };

    // All inputs are fully transparent — the PDF canvas already draws the field
    // boxes/borders. We only render the typed text on top, exactly like a real
    // PDF viewer. Focus gives a subtle blue tint so the user knows what's active.
    const transparentBase: React.CSSProperties = {
      width: '100%',
      height: '100%',
      background: 'transparent',
      border: 'none',
      outline: 'none',
      color: '#18181b',
      fontSize: fs,
      padding: '0 2px',
      boxSizing: 'border-box' as const,
      cursor: 'text',
    };

    // ── Checkbox ──────────────────────────────────────────────────────────────
    if (field.type === 'checkbox') {
      const checked = formValues[field.valueKey] === 'true';
      return (
        <div
          key={key}
          style={{ ...style, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setFormValues(p => ({ ...p, [field.valueKey]: checked ? 'false' : 'true' }))}
          title={checked ? 'Click to uncheck' : 'Click to check'}
        >
          {checked && (
            <svg viewBox="0 0 12 12"
              style={{ width: Math.min(width, height) * 0.82, height: Math.min(width, height) * 0.82, pointerEvents: 'none' }}>
              <polyline points="1.5,6 4.5,9.5 10.5,2.5"
                fill="none" stroke="#2563eb" strokeWidth="2.2"
                strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </div>
      );
    }

    // ── Dropdown ──────────────────────────────────────────────────────────────
    if (field.type === 'dropdown' && field.options?.length) {
      return (
        <div key={key} style={style}>
          <select
            value={formValues[field.valueKey] ?? ''}
            onChange={e => setFormValues(p => ({ ...p, [field.valueKey]: e.target.value }))}
            style={{ ...transparentBase, cursor: 'pointer' }}
          >
            <option value="">—</option>
            {field.options.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
      );
    }

    // ── Multiline text ────────────────────────────────────────────────────────
    if (field.type === 'multiline') {
      return (
        <div key={key} style={style}>
          <textarea
            value={formValues[field.valueKey] ?? ''}
            onChange={e => setFormValues(p => ({ ...p, [field.valueKey]: e.target.value }))}
            style={{ ...transparentBase, resize: 'none', lineHeight: 1.3, padding: '1px 2px' }}
            onFocus={e => e.currentTarget.style.background = 'rgba(219,234,254,0.35)'}
            onBlur={e  => e.currentTarget.style.background = 'transparent'}
          />
        </div>
      );
    }

    // ── Comb field: N transparent char inputs over the PDF's own boxes ────────
    if (field.isComb && field.combLen) {
      const n       = field.combLen;
      const boxW    = width / n;
      const current = formValues[field.valueKey] ?? '';
      return (
        <div key={key} style={{ ...style, display: 'flex' }}>
          {Array.from({ length: n }, (_, ci) => {
            const charVal = current[ci] ?? '';
            return (
              <input
                key={ci}
                type="text"
                maxLength={1}
                value={charVal}
                onChange={e => {
                  const ch    = e.target.value.slice(-1);
                  const chars = (formValues[field.valueKey] ?? '').split('');
                  chars[ci]   = ch;
                  const joined = chars.join('').trimEnd();
                  setFormValues(p => ({ ...p, [field.valueKey]: joined }));
                  if (ch && e.target.nextElementSibling)
                    (e.target.nextElementSibling as HTMLInputElement).focus();
                }}
                onKeyDown={e => {
                  if (e.key === 'Backspace' && !charVal && e.currentTarget.previousElementSibling)
                    (e.currentTarget.previousElementSibling as HTMLInputElement).focus();
                }}
                onFocus={e => e.currentTarget.style.background = 'rgba(219,234,254,0.45)'}
                onBlur={e  => e.currentTarget.style.background = 'transparent'}
                style={{
                  width: boxW, height,
                  fontSize: Math.max(8, Math.min(height * 0.65, 14)),
                  textAlign: 'center',
                  padding: 0,
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: '#18181b',
                  boxSizing: 'border-box',
                }}
              />
            );
          })}
        </div>
      );
    }

    // ── Single-char narrow box ────────────────────────────────────────────────
    const isSingleChar = (field.px2 - field.px1) < 18;

    // ── Regular text input ────────────────────────────────────────────────────
    return (
      <div key={key} style={style}>
        <input
          type="text"
          value={formValues[field.valueKey] ?? ''}
          maxLength={isSingleChar ? 1 : undefined}
          onChange={e => {
            const val = isSingleChar ? e.target.value.slice(-1) : e.target.value;
            setFormValues(p => ({ ...p, [field.valueKey]: val }));
          }}
          onFocus={e => e.currentTarget.style.background = 'rgba(219,234,254,0.35)'}
          onBlur={e  => e.currentTarget.style.background = 'transparent'}
          style={{
            ...transparentBase,
            fontSize: isSingleChar ? Math.max(8, Math.min(height * 0.65, 14)) : fs,
            textAlign: isSingleChar ? 'center' : 'left',
            padding: isSingleChar ? '0' : '0 2px',
          }}
        />
      </div>
    );
  };

  const filledCount = Object.values(formValues).filter(v => v !== '' && v !== 'false').length;

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/clinical-forms')}
          className="p-2 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-600 transition-colors"
          aria-label="Back">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-zinc-900 italic">{title}</h1>
          <p className="text-sm text-zinc-500">{description}</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white rounded-2xl border border-zinc-200 px-5 py-3 shadow-sm">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`p-2 rounded-xl flex-shrink-0 ${accentColor}`}><FileText size={18} /></div>
          <span className="text-sm font-semibold text-zinc-700 truncate">{title}</span>
          {!pdfLoading && fields.length > 0 && (
            <span className="text-xs text-zinc-400 flex-shrink-0">{filledCount}/{fields.length} filled</span>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {filledCount > 0 && (
            <button onClick={resetForm}
              className="px-3 py-2 text-xs font-medium text-zinc-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors">
              Clear
            </button>
          )}
          <button onClick={handleDownload} disabled={pdfLoading || !!loadError}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-zinc-700 bg-zinc-100 hover:bg-zinc-200 rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
            <Download size={16} />
            <span className="hidden sm:inline">Download</span>
          </button>
          <button onClick={() => setShowModal(true)} disabled={pdfLoading || !!loadError}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-partners-blue-dark hover:opacity-90 rounded-xl transition-opacity disabled:opacity-40 disabled:cursor-not-allowed">
            <Send size={16} />
            <span className="hidden sm:inline">Submit</span>
          </button>
        </div>
      </div>

      {/* PDF canvas viewer */}
      <div ref={containerRef} className="bg-white rounded-3xl border border-zinc-200 shadow-sm overflow-hidden">
        {pdfLoading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <Loader2 className="animate-spin text-partners-blue-dark" size={32} />
            <p className="text-sm text-zinc-400">Loading form…</p>
          </div>
        ) : loadError ? (
          <div className="flex flex-col items-center justify-center py-24 text-center px-6">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="text-red-400" size={32} />
            </div>
            <h3 className="text-lg font-bold text-zinc-900 mb-2 italic">Could not load PDF</h3>
            <p className="text-zinc-500 text-sm max-w-md font-mono bg-zinc-50 p-3 rounded-xl">{loadError}</p>
          </div>
        ) : (
          <div className="overflow-y-auto bg-zinc-200 p-4 space-y-4"
            style={{ maxHeight: 'calc(100vh - 280px)', minHeight: 600 }}>
            {pageDims.map((dim, i) => (
              /* Outer: takes up scaled space in the flow */
              <div key={i} className="mx-auto"
                style={{ width: dim.width * cssScale, height: dim.height * cssScale, position: 'relative' }}>
                {/* Inner: full resolution, scaled down via CSS transform */}
                <div style={{
                  width: dim.width, height: dim.height,
                  transform: `scale(${cssScale})`, transformOrigin: 'top left',
                  position: 'relative', background: '#fff',
                  boxShadow: '0 2px 12px rgba(0,0,0,0.18)',
                }}>
                  <canvas
                    ref={el => setCanvasRef(el, i)}
                    style={{ display: 'block', position: 'absolute', top: 0, left: 0 }}
                  />
                  {fields.filter(f => f.pageIndex === i).map(f => renderOverlay(f, dim))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info banner */}
      {!loadError && !pdfLoading && (
        <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-2xl px-5 py-4 text-sm text-blue-700">
          <AlertCircle size={18} className="mt-0.5 flex-shrink-0" />
          <p>
            Click any field on the PDF to fill it. <strong>Download</strong> opens the print dialog
            (choose "Save as PDF"). <strong>Submit</strong> saves to the patient record and resets the form.
          </p>
        </div>
      )}

      {/* Submit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          onClick={e => { if (e.target === e.currentTarget) closeModal(); }}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">

            <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-100">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl ${accentColor}`}><Send size={18} /></div>
                <div>
                  <h2 className="text-base font-bold text-zinc-900">Submit Form</h2>
                  <p className="text-xs text-zinc-500">{title}</p>
                </div>
              </div>
              <button onClick={closeModal}
                className="p-2 rounded-full text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors">
                <X size={18} />
              </button>
            </div>

            {submitResult?.type === 'success' ? (
              <div className="flex flex-col items-center justify-center py-12 px-6 text-center gap-4">
                <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center">
                  <CheckCircle className="text-emerald-500" size={32} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-zinc-900 mb-1">Submitted!</h3>
                  <p className="text-sm text-zinc-500">Saved to patient record. Form has been reset.</p>
                </div>
                <button onClick={closeModal}
                  className="mt-2 px-6 py-2.5 text-sm font-medium text-white bg-partners-blue-dark hover:opacity-90 rounded-xl">
                  Done
                </button>
              </div>
            ) : (
              <div className="px-6 py-5 space-y-5">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider">
                    Patient <span className="text-red-500">*</span>
                  </label>
                  {patientsLoading ? (
                    <div className="flex items-center gap-2 h-10 text-sm text-zinc-400">
                      <Loader2 size={16} className="animate-spin" /> Loading patients…
                    </div>
                  ) : (
                    <div className="relative">
                      <select value={selectedPatientId}
                        onChange={e => setSelectedPatientId(e.target.value)}
                        className="w-full appearance-none px-4 py-2.5 pr-10 text-sm bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 focus:outline-none focus:ring-2 focus:ring-partners-blue-dark/30 focus:border-partners-blue-dark transition-colors">
                        <option value="">Select a patient…</option>
                        {patients.map(p => (
                          <option key={p.id} value={p.id}>{p.last_name}, {p.first_name}</option>
                        ))}
                      </select>
                      <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider">
                    Notes <span className="text-zinc-400 font-normal">(optional)</span>
                  </label>
                  <textarea value={notes} onChange={e => setNotes(e.target.value)}
                    placeholder="Any additional notes…" rows={3}
                    className="w-full px-4 py-2.5 text-sm bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-partners-blue-dark/30 focus:border-partners-blue-dark transition-colors resize-none"
                  />
                </div>

                {submitResult?.type === 'error' && (
                  <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                    <AlertCircle size={16} className="flex-shrink-0" />
                    {submitResult.message}
                  </div>
                )}

                <div className="flex items-center gap-3 pt-1">
                  <button onClick={closeModal} disabled={isSubmitting}
                    className="flex-1 px-4 py-2.5 text-sm font-medium text-zinc-600 bg-zinc-100 hover:bg-zinc-200 rounded-xl transition-colors disabled:opacity-50">
                    Cancel
                  </button>
                  <button onClick={handleSubmit} disabled={!selectedPatientId || isSubmitting}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-partners-blue-dark hover:opacity-90 rounded-xl transition-opacity disabled:opacity-50 disabled:cursor-not-allowed">
                    {isSubmitting
                      ? <><Loader2 size={16} className="animate-spin" /> Submitting…</>
                      : <><Send size={16} /> Submit</>}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};