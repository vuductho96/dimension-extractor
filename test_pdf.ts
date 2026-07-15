import fs from 'fs';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.js';
import { parseDimensions } from './lib/dimension-parser';

async function main() {
  const filePath = "211(Cải tiến)-MF00102.pdf";
  const data = new Uint8Array(fs.readFileSync(filePath));
  
  const loadingTask = pdfjsLib.getDocument({ data });
  const pdfDoc = await loadingTask.promise;
  
  console.log(`Loaded PDF with ${pdfDoc.numPages} pages.`);
  
  for (let i = 1; i <= pdfDoc.numPages; i++) {
    const page = await pdfDoc.getPage(i);
    const textContent = await page.getTextContent();
    const viewport = page.getViewport({ scale: 1.0 });
    
    const items = textContent.items.map((item: any) => ({
      text: item.str,
      x: item.transform[4],
      y: viewport.height - item.transform[5],
      width: item.width,
      height: item.height,
      fontSize: Math.sqrt(item.transform[0]*item.transform[0] + item.transform[1]*item.transform[1])
    }));
    
    console.log(`\n--- Page ${i} ---`);
    console.log(`Extracted ${items.length} raw text items.`);
    
    const dims = parseDimensions(items);
    console.log(`Found ${dims.length} dimensions:\n`);
    
    dims.forEach(d => {
      console.log(`Nominal: ${d.nominal} | Tol: +${d.tolPlus}/-${d.tolMinus} | Type: ${d.type}`);
    });
  }
}

main().catch(console.error);
