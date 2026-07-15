// ============================================================
// Dimension Parser
// Parses technical drawing text items into structured data
// Handles: linear dims, diameters (Ø), radii (R), tolerances,
//          fit codes (H7/h6), angles (°), bilateral tolerances
// ============================================================

export type DimType =
  | 'Khoảng cách'
  | 'Đường kính'
  | 'Bán kính'
  | 'Góc'
  | 'Dung sai đối xứng'
  | 'Lắp ghép'
  | 'Chiều sâu';

export interface DimensionResult {
  id: string;
  no: number;
  type: DimType;
  nominal: string;
  tolMinus: string;
  tolPlus: string;
  unit: string;
  fit?: string;        // e.g. "H7", "h6"
  status: 'OK' | 'CHECK';
  rawText: string;
  x?: number;
  y?: number;
}

// ----------------------------------------------------------------
// Regex patterns — order matters (more specific first)
// ----------------------------------------------------------------

// Bilateral tolerance block: +0.021 / 0  or  +0.002 −0.002
const RE_BILATERAL =
  /\+\s*(\d+\.?\d*)\s*[\/\-−]\s*(\d+\.?\d*)/;

// Symmetric tolerance: 12.5 ±0.10  or  ±0.05
const RE_SYMMETRIC_FULL =
  /(\d+\.?\d*)\s*[±]\s*(\d+\.?\d*)/;

// Diameter: Ø20, ⌀8.00, Ø20 H7
const RE_DIAMETER =
  /[Øø⌀ÃÂ][\s]?(\d+\.?\d*)(?:\s*([A-Za-z]\d+))?/;

// Radius: R2.5, R 3
const RE_RADIUS = /\bR\s*(\d+\.?\d*)/;

// Angle: 45°, 30.5 °
const RE_ANGLE = /(\d+\.?\d*)\s*°/;

// Depth symbol: ⌵ or just a number after depth context
const RE_DEPTH = /[⌵▽]\s*(\d+\.?\d*)/;

// Fit code only: H7, h6, f7, js5  (when not already captured by diameter)
const RE_FIT_ONLY = /\b(\d+\.?\d*)\s*([A-Z][0-9]|[a-z]{1,2}[0-9])\b/;

// Plain numeric dimension: 12.920, 65, 0.021
const RE_PLAIN = /\b(\d{1,5}\.?\d{0,4})\b/;

// ----------------------------------------------------------------

function uid(prefix: string, idx: number) {
  return `${prefix}-${idx}-${Date.now()}`;
}

function isDimensionNumber(n: number): boolean {
  // Filter out obvious non-dimension numbers (page numbers, scale, revision, etc.)
  if (n <= 0) return false;
  if (n > 9999) return false;
  return true;
}

// Normalise Unicode minus (−) to ASCII minus (-)
function normalise(s: string) {
  return s.replace(/−/g, '-').replace(/[\u2010-\u2015]/g, '-');
}

export function parseDimensions(
  rawTextItems: { text: string; x?: number; y?: number }[]
): DimensionResult[] {
  const results: DimensionResult[] = [];
  let counter = 0;

  // First pass: join nearby tokens into candidate strings
  // We process each text item independently; adjacent tokens
  // are also merged pair-wise for multi-token dimensions.
  const texts: { text: string; x?: number; y?: number }[] = [];

  for (let i = 0; i < rawTextItems.length; i++) {
    const cur = rawTextItems[i];
    const next = rawTextItems[i + 1];
    texts.push(cur);
    if (next) {
      // Merge if items are close (within ~40 units)
      const dx = Math.abs((next.x ?? 0) - (cur.x ?? 0) - ((cur as any).width ?? 0));
      if (dx < 60) {
        texts.push({ text: cur.text + next.text, x: cur.x, y: cur.y });
        texts.push({ text: cur.text + ' ' + next.text, x: cur.x, y: cur.y });
      }
    }
  }

  const seen = new Set<string>();

  const addResult = (r: Omit<DimensionResult, 'id' | 'no' | 'status'>) => {
    const key = `${r.type}|${r.nominal}|${r.tolMinus}|${r.tolPlus}|${r.fit ?? ''}`;
    if (seen.has(key)) return;
    seen.add(key);
    counter++;
    results.push({
      id: uid(r.type, counter),
      no: counter,
      status: 'OK',
      ...r,
    });
  };

  for (const { text: rawText, x, y } of texts) {
    const text = normalise(rawText.trim());
    if (!text) continue;

    // --- Diameter ---
    const mDia = RE_DIAMETER.exec(text);
    if (mDia) {
      const nom = mDia[1];
      const fit = mDia[2];
      if (isDimensionNumber(parseFloat(nom))) {
        addResult({
          type: 'Đường kính',
          nominal: `Ø${nom}`,
          tolMinus: '',
          tolPlus: '',
          unit: 'mm',
          fit,
          rawText: text,
          x,
          y,
        });
        continue;
      }
    }

    // --- Radius ---
    const mRad = RE_RADIUS.exec(text);
    if (mRad) {
      const nom = mRad[1];
      if (isDimensionNumber(parseFloat(nom))) {
        addResult({
          type: 'Bán kính',
          nominal: `R${nom}`,
          tolMinus: '',
          tolPlus: '',
          unit: 'mm',
          rawText: text,
          x,
          y,
        });
        continue;
      }
    }

    // --- Angle ---
    const mAng = RE_ANGLE.exec(text);
    if (mAng) {
      addResult({
        type: 'Góc',
        nominal: mAng[1],
        tolMinus: '',
        tolPlus: '',
        unit: '°',
        rawText: text,
        x,
        y,
      });
      continue;
    }

    // --- Depth ---
    const mDep = RE_DEPTH.exec(text);
    if (mDep) {
      addResult({
        type: 'Chiều sâu',
        nominal: mDep[1],
        tolMinus: '',
        tolPlus: '',
        unit: 'mm',
        rawText: text,
        x,
        y,
      });
      continue;
    }

    // --- Symmetric tolerance ---
    const mSym = RE_SYMMETRIC_FULL.exec(text);
    if (mSym) {
      const nom = mSym[1];
      const tol = mSym[2];
      if (isDimensionNumber(parseFloat(nom))) {
        addResult({
          type: 'Dung sai đối xứng',
          nominal: nom,
          tolMinus: tol,
          tolPlus: tol,
          unit: 'mm',
          rawText: text,
          x,
          y,
        });
        continue;
      }
    }

    // --- Bilateral tolerance +X/Y or +X-Y ---
    const mBi = RE_BILATERAL.exec(text);
    if (mBi) {
      // Try to find nominal before it
      const before = text.slice(0, (mBi.index ?? 0)).trim();
      const nomMatch = RE_PLAIN.exec(before);
      addResult({
        type: 'Khoảng cách',
        nominal: nomMatch ? nomMatch[1] : before,
        tolPlus: mBi[1],
        tolMinus: mBi[2],
        unit: 'mm',
        rawText: text,
        x,
        y,
      });
      continue;
    }

    // --- Fit code (e.g. 20 H7) ---
    const mFit = RE_FIT_ONLY.exec(text);
    if (mFit) {
      const nom = mFit[1];
      const fit = mFit[2];
      if (isDimensionNumber(parseFloat(nom))) {
        addResult({
          type: 'Khoảng cách',
          nominal: nom,
          tolMinus: '',
          tolPlus: '',
          unit: 'mm',
          fit,
          rawText: text,
          x,
          y,
        });
        continue;
      }
    }

    // --- Plain dimension ---
    // Only keep if text is just the number (or number + unit)
    const mPlain = RE_PLAIN.exec(text);
    if (
      mPlain &&
      /^[\d\s\.]+(?:mm|cm|m|in)?$/i.test(text) &&
      isDimensionNumber(parseFloat(mPlain[1]))
    ) {
      addResult({
        type: 'Khoảng cách',
        nominal: mPlain[1],
        tolMinus: '',
        tolPlus: '',
        unit: 'mm',
        rawText: text,
        x,
        y,
      });
    }
  }

  return results;
}
