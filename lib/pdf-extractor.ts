'use client';

// ============================================================
// PDF Text-Layer Extractor
// Works with CAD/technical-drawing PDFs that have a text layer
// (exports from AutoCAD, SolidWorks, Creo, NX, etc.)
// ============================================================

export interface TextItem {
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
}

export interface PDFExtractionResult {
  items: TextItem[];
  pageCount: number;
  pageWidth: number;
  pageHeight: number;
  rawText: string;
}

let pdfjsLib: typeof import('pdfjs-dist') | null = null;

async function getPdfjs() {
  if (!pdfjsLib) {
    // Dynamic import to avoid SSR issues
    pdfjsLib = await import('pdfjs-dist');
    // Use CDN worker — works in both dev and Vercel production
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
  }
  return pdfjsLib;
}

export async function extractPDFPage(
  file: File,
  pageNumber: number = 1
): Promise<PDFExtractionResult> {
  const pdfjs = await getPdfjs();
  const arrayBuffer = await file.arrayBuffer();

  const loadingTask = pdfjs.getDocument({
    data: arrayBuffer,
    // Enable text layer
    useSystemFonts: true,
  });

  const pdf = await loadingTask.promise;
  const pageCount = pdf.numPages;

  const page = await pdf.getPage(Math.max(1, Math.min(pageNumber, pageCount)));
  const viewport = page.getViewport({ scale: 1.0 });
  const textContent = await page.getTextContent();

  const items: TextItem[] = textContent.items
    .filter((item: any) => typeof item.str === 'string' && item.str.length > 0)
    .map((item: any) => {
      // item.transform = [scaleX, skewX, skewY, scaleY, translateX, translateY]
      const [, , , scaleY, tx, ty] = item.transform as number[];
      return {
        text: item.str as string,
        x: tx,
        y: viewport.height - ty, // flip Y for natural reading order
        width: (item.width as number) ?? 0,
        height: (item.height as number) ?? Math.abs(scaleY),
        fontSize: Math.abs(scaleY),
      };
    })
    .filter((item) => item.text.trim().length > 0);

  // Build a raw text string (approximately top-to-bottom, left-to-right)
  const sorted = [...items].sort((a, b) =>
    Math.round(a.y / 4) - Math.round(b.y / 4) || a.x - b.x
  );
  const rawText = sorted.map((i) => i.text).join(' ');

  return {
    items,
    pageCount,
    pageWidth: viewport.width,
    pageHeight: viewport.height,
    rawText,
  };
}

/** Render a PDF page to a canvas element (for preview) */
export async function renderPDFPage(
  file: File,
  pageNumber: number,
  canvas: HTMLCanvasElement,
  scale: number = 1.5
) {
  const pdfjs = await getPdfjs();
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
  const page = await pdf.getPage(Math.max(1, Math.min(pageNumber, pdf.numPages)));
  const viewport = page.getViewport({ scale });

  canvas.width = viewport.width;
  canvas.height = viewport.height;

  const ctx = canvas.getContext('2d')!;
  await page.render({ canvasContext: ctx, viewport }).promise;
}
