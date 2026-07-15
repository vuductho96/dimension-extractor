import type { DimensionResult } from './dimension-parser';

// ============================================================
// Excel exporter using SheetJS (xlsx)
// ============================================================

export async function exportToExcel(
  results: DimensionResult[],
  filename: string,
  jobInfo?: { filename: string; pageIndex: number }
) {
  // Dynamic import — xlsx is large, only load when needed
  const XLSX = await import('xlsx');

  // Header row
  const header = [
    'No.',
    'Loại',
    'Nominal',
    'Tol −',
    'Tol +',
    'Fit/Grade',
    'Đơn vị',
    'Trạng thái',
    'Ghi chú (raw)',
  ];

  const rows = results.map((r) => [
    r.no,
    r.type,
    r.nominal,
    r.tolMinus || '—',
    r.tolPlus  || '—',
    r.fit      || '—',
    r.unit,
    r.status,
    r.rawText,
  ]);

  // Build worksheet
  const ws = XLSX.utils.aoa_to_sheet([header, ...rows]);

  // Column widths
  ws['!cols'] = [
    { wch: 5 },   // No.
    { wch: 22 },  // Loại
    { wch: 14 },  // Nominal
    { wch: 10 },  // Tol−
    { wch: 10 },  // Tol+
    { wch: 10 },  // Fit
    { wch: 8 },   // Đơn vị
    { wch: 8 },   // Trạng thái
    { wch: 30 },  // Raw
  ];

  // Style header row bold (xlsx community edition — basic styling)
  for (let c = 0; c < header.length; c++) {
    const cellRef = XLSX.utils.encode_cell({ r: 0, c });
    if (ws[cellRef]) {
      ws[cellRef].s = { font: { bold: true } };
    }
  }

  // Info sheet
  const infoData = [
    ['Dimension Extractor — Kết quả trích xuất'],
    [],
    ['Tệp nguồn', jobInfo?.filename ?? filename],
    ['Trang', jobInfo?.pageIndex ?? 1],
    ['Số kích thước', results.length],
    ['Xuất lúc', new Date().toLocaleString('vi-VN')],
  ];
  const wsInfo = XLSX.utils.aoa_to_sheet(infoData);
  wsInfo['!cols'] = [{ wch: 20 }, { wch: 40 }];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Kích thước');
  XLSX.utils.book_append_sheet(wb, wsInfo, 'Thông tin');

  // Download
  const safeFilename = filename.replace(/\.[^.]+$/, '').replace(/[^a-z0-9_\-\.]/gi, '_');
  XLSX.writeFile(wb, `${safeFilename}_dims.xlsx`);
}
