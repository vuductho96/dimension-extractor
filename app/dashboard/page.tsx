'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { DimensionResult } from '@/lib/dimension-parser';

// ─── Types ────────────────────────────────────────────────────
interface Job {
  id: string;
  filename: string;
  page_count: number;
  page_index: number;
  results: DimensionResult[];
  created_at: string;
}

// ─── Toast hook ───────────────────────────────────────────────
function useToast() {
  const [msg, setMsg] = useState('');
  const [show, setShow] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const toast = useCallback((m: string) => {
    setMsg(m);
    setShow(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setShow(false), 2800);
  }, []);
  return { msg, show, toast };
}

// ─── Main component ───────────────────────────────────────────
export default function DashboardPage() {
  const router = useRouter();
  const supabase = createClient();
  const { msg: toastMsg, show: toastShow, toast } = useToast();

  // Auth
  const [userEmail, setUserEmail] = useState('');
  const [userId, setUserId]       = useState('');

  // Jobs
  const [jobs, setJobs]             = useState<Job[]>([]);
  const [activeJob, setActiveJob]   = useState<Job | null>(null);

  // PDF state
  const [file, setFile]             = useState<File | null>(null);
  const [pageIndex, setPageIndex]   = useState(1);
  const [pageCount, setPageCount]   = useState(1);
  const [scanning, setScanning]     = useState(false);
  const [results, setResults]       = useState<DimensionResult[]>([]);
  const [dragOver, setDragOver]     = useState(false);

  // Refs
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Load user & jobs ──────────────────────────────────────
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setUserEmail('Khách (Guest)');
        return;
      }
      setUserEmail(user.email ?? '');
      setUserId(user.id);
      await loadJobs(user.id);
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadJobs = async (uid: string) => {
    const { data } = await supabase
      .from('jobs')
      .select('*')
      .eq('user_id', uid)
      .order('created_at', { ascending: false })
      .limit(40);
    setJobs((data as Job[]) ?? []);
  };

  // ── Render PDF page ────────────────────────────────────────
  const renderPage = useCallback(async (f: File, page: number) => {
    if (!canvasRef.current) return;
    const { renderPDFPage } = await import('@/lib/pdf-extractor');
    await renderPDFPage(f, page, canvasRef.current, 1.6);
  }, []);

  // ── File load / drag & drop ───────────────────────────────
  const loadFile = useCallback(async (f: File) => {
    setFile(f);
    setResults([]);
    setActiveJob(null);
    const { extractPDFPage } = await import('@/lib/pdf-extractor');
    const { pageCount: pc } = await extractPDFPage(f, 1);
    setPageCount(pc);
    setPageIndex(1);
    await renderPage(f, 1);
  }, [renderPage]);

  const handleFileChange = (files: FileList | null) => {
    const f = files?.[0];
    if (!f) return;
    loadFile(f);
  };

  // ── Page navigation ────────────────────────────────────────
  const goPage = async (p: number) => {
    if (!file) return;
    setPageIndex(p);
    setResults([]);
    await renderPage(file, p);
  };

  // ── Extract dimensions ─────────────────────────────────────
  const extract = async () => {
    if (!file) return;
    setScanning(true);
    try {
      const { extractPDFPage } = await import('@/lib/pdf-extractor');
      const { items } = await extractPDFPage(file, pageIndex);
      const { parseDimensions } = await import('@/lib/dimension-parser');
      const dims = parseDimensions(items);
      setResults(dims);
      if (dims.length === 0) {
        toast('Không tìm thấy kích thước. Kiểm tra PDF có text layer không.');
      } else {
        toast(`Đã trích xuất ${dims.length} kích thước.`);
      }
    } catch (err) {
      console.error(err);
      toast('Lỗi khi đọc PDF. Thử lại với file khác.');
    } finally {
      setScanning(false);
    }
  };

  // ── Edit cell ─────────────────────────────────────────────
  const updateCell = (id: string, field: keyof DimensionResult, value: string) => {
    setResults(prev =>
      prev.map(r => r.id === id ? { ...r, [field]: value } : r)
    );
  };

  const toggleStatus = (id: string) => {
    setResults(prev =>
      prev.map(r => r.id === id
        ? { ...r, status: r.status === 'OK' ? 'CHECK' : 'OK' }
        : r)
    );
  };

  // ── Save job ──────────────────────────────────────────────
  const saveJob = async () => {
    if (!file || results.length === 0) return;
    if (!userId) {
      toast('Tính năng lưu trực tuyến chỉ dành cho thành viên. Vui lòng đăng nhập!');
      return;
    }
    const payload = {
      user_id:    userId,
      filename:   file.name,
      page_count: pageCount,
      page_index: pageIndex,
      results:    results as unknown as Record<string, unknown>[],
    };

    let savedJob: Job;
    if (activeJob) {
      const { data, error } = await supabase
        .from('jobs')
        .update({ results: payload.results, page_index: pageIndex })
        .eq('id', activeJob.id)
        .select()
        .single();
      if (error) { toast('Lỗi khi cập nhật. ' + error.message); return; }
      savedJob = data as Job;
    } else {
      const { data, error } = await supabase
        .from('jobs')
        .insert(payload)
        .select()
        .single();
      if (error) { toast('Lỗi khi lưu. ' + error.message); return; }
      savedJob = data as Job;
    }

    setActiveJob(savedJob);
    await loadJobs(userId);
    toast('Đã lưu thành công!');
  };

  // ── Load job from history ──────────────────────────────────
  const openJob = (job: Job) => {
    setActiveJob(job);
    setResults(job.results);
    setFile(null); // PDF không được lưu, chỉ metadata
    setPageIndex(job.page_index);
    setPageCount(job.page_count);
    toast(`Đã tải: ${job.filename}`);
  };

  // ── Delete job ────────────────────────────────────────────
  const deleteJob = async (jobId: string) => {
    await supabase.from('jobs').delete().eq('id', jobId);
    if (activeJob?.id === jobId) { setActiveJob(null); setResults([]); }
    await loadJobs(userId);
    toast('Đã xoá.');
  };

  // ── Export Excel ──────────────────────────────────────────
  const exportExcel = async () => {
    if (results.length === 0) return;
    const { exportToExcel } = await import('@/lib/excel-exporter');
    await exportToExcel(results, file?.name ?? activeJob?.filename ?? 'drawing', {
      filename:  file?.name ?? activeJob?.filename ?? 'drawing',
      pageIndex,
    });
    toast('Đã tải file Excel.');
  };

  // ── Logout ────────────────────────────────────────────────
  const logout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  // ── New / reset ───────────────────────────────────────────
  const newJob = () => {
    setFile(null);
    setResults([]);
    setActiveJob(null);
    setPageIndex(1);
    setPageCount(1);
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      ctx?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      canvasRef.current.width = 0;
    }
  };

  const initials = userEmail.charAt(0).toUpperCase();

  return (
    <div className="dash-root">
      {/* ── Header ── */}
      <header className="dash-header">
        <Link href="/" className="dash-brand">
          <span style={{ color: '#1550ff', fontSize: 24, fontWeight: 800, lineHeight: 1 }}>D</span>
          Dimension Extractor
        </Link>

        <div className="dash-header-mid">
          <span className="dash-file-name">
            {file?.name ?? activeJob?.filename ?? 'Chưa chọn file'}
          </span>
          {(file || activeJob) && (
            <span style={{ fontSize: 12, color: '#59657d' }}>
              · Trang {pageIndex}/{pageCount}
            </span>
          )}
        </div>

        <div className="dash-header-right">
          <div className="dash-user">
            <div className="dash-avatar">{!userId ? 'G' : initials}</div>
            <span>{userEmail}</span>
          </div>
          {!userId ? (
            <Link href="/login" className="dash-logout" style={{textDecoration: 'none'}}>Đăng nhập</Link>
          ) : (
            <button className="dash-logout" onClick={logout}>Đăng xuất</button>
          )}
        </div>
      </header>

      {/* ── Body ── */}
      <div className="dash-body">

        {/* ── Sidebar ── */}
        <aside className="dash-sidebar">
          <div className="sidebar-head">
            <span>Lịch sử</span>
            <button className="sidebar-new-btn" onClick={newJob}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 5v14M5 12h14"/>
              </svg>
              Mới
            </button>
          </div>
          <div className="sidebar-jobs">
            {jobs.length === 0 ? (
              <div className="sidebar-empty">
                {!userId ? (
                  <p>Bạn đang dùng thử (Guest).<br/>Hãy <Link href="/login" style={{color: 'var(--blue)'}}>đăng nhập</Link> để lưu lịch sử bản vẽ.</p>
                ) : (
                  <p>Chưa có job nào.<br/>Tải PDF và trích xuất để tạo job đầu tiên.</p>
                )}
              </div>
            ) : jobs.map(j => (
              <div
                key={j.id}
                className={`job-item${activeJob?.id === j.id ? ' active' : ''}`}
                onClick={() => openJob(j)}
              >
                <span className="job-item-name">{j.filename}</span>
                <span className="job-item-count">{Array.isArray(j.results) ? j.results.length : 0}</span>
                <span className="job-item-meta">
                  {new Date(j.created_at).toLocaleDateString('vi-VN')}
                  {' · '}Trang {j.page_index}/{j.page_count}
                </span>
                <button
                  onClick={e => { e.stopPropagation(); deleteJob(j.id); }}
                  title="Xoá"
                  style={{
                    border: 'none', background: 'transparent', cursor: 'pointer',
                    color: '#bbb', fontSize: 14, padding: 0, alignSelf: 'start',
                  }}
                >×</button>
              </div>
            ))}
          </div>
        </aside>

        {/* ── PDF Viewer ── */}
        <main className="dash-main">
          <div className="dash-toolbar">
            <span className="dash-toolbar-label">Bản vẽ</span>
            {file && (
              <>
                <div className="page-nav">
                  <button onClick={() => goPage(pageIndex - 1)} disabled={pageIndex <= 1}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M15 18l-6-6 6-6"/>
                    </svg>
                  </button>
                  <span>Trang {pageIndex} / {pageCount}</span>
                  <button onClick={() => goPage(pageIndex + 1)} disabled={pageIndex >= pageCount}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 18l6-6-6-6"/>
                    </svg>
                  </button>
                </div>
                <button
                  className="extract-btn"
                  onClick={extract}
                  disabled={scanning}
                >
                  {scanning ? (
                    <><span className="spinner" style={{ borderTopColor: 'white' }}></span> Đang đọc…</>
                  ) : (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                      </svg>
                      Trích xuất kích thước
                    </>
                  )}
                </button>
              </>
            )}
          </div>

          <div className="pdf-viewport"
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => {
              e.preventDefault(); setDragOver(false);
              handleFileChange(e.dataTransfer.files);
            }}
          >
            {!file ? (
              <label
                className={`upload-zone${dragOver ? ' drag-over' : ''}`}
                htmlFor="pdf-file-input"
                onKeyDown={e => e.key === 'Enter' && fileInputRef.current?.click()}
                tabIndex={0}
              >
                <input
                  id="pdf-file-input"
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  onChange={e => handleFileChange(e.target.files)}
                />
                <svg className="upload-icon" width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="12" y1="18" x2="12" y2="12"/>
                  <line x1="9" y1="15" x2="15" y2="15"/>
                </svg>
                <h3>Thả file PDF vào đây</h3>
                <p>hoặc nhấn để chọn file từ máy tính</p>
                <small>Chỉ hỗ trợ PDF có text layer (CAD export)</small>
                <span className="upload-btn">Chọn file PDF</span>
              </label>
            ) : (
              <div className="scanning-overlay">
                <canvas ref={canvasRef} className="pdf-canvas" />
                {scanning && (
                  <div className="scan-progress">
                    <span className="spinner"></span>
                    Đang phân tích text layer…
                  </div>
                )}
              </div>
            )}
          </div>
        </main>

        {/* ── Results Panel ── */}
        <aside className="dash-results">
          <div className="results-head">
            <div className="results-head-left">
              <strong>Kết quả</strong>
              <span className="results-count">{results.length}</span>
            </div>
            <div className="results-actions">
              <button
                className="btn-export-xl"
                onClick={exportExcel}
                disabled={results.length === 0}
                title="Xuất Excel"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 3h10l4 4v14H5zM14 3v5h5"/>
                </svg>
                Excel
              </button>
              <button
                className="btn-save"
                onClick={saveJob}
                disabled={results.length === 0}
                title="Lưu vào lịch sử"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                  <polyline points="17 21 17 13 7 13 7 21"/>
                  <polyline points="7 3 7 8 15 8"/>
                </svg>
                Lưu
              </button>
            </div>
          </div>

          {results.length === 0 ? (
            <div className="results-empty">
              <svg viewBox="0 0 24 24">
                <path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18"/>
              </svg>
              <p>
                {file
                  ? 'Nhấn "Trích xuất kích thước" để phân tích trang hiện tại.'
                  : 'Chọn file PDF để bắt đầu.'}
              </p>
            </div>
          ) : (
            <div className="results-table-wrap">
              <table className="res-table">
                <thead>
                  <tr>
                    <th style={{ width: 32 }}>#</th>
                    <th>Nominal</th>
                    <th>Tol −</th>
                    <th>Tol +</th>
                    <th>Fit</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map(r => (
                    <tr key={r.id}>
                      <td className="td-no">{r.no}</td>
                      <td>
                        <input
                          value={r.nominal}
                          onChange={e => updateCell(r.id, 'nominal', e.target.value)}
                          aria-label={`Nominal ${r.no}`}
                          title={`${r.type} · ${r.rawText}`}
                        />
                      </td>
                      <td>
                        <input
                          value={r.tolMinus}
                          onChange={e => updateCell(r.id, 'tolMinus', e.target.value)}
                          aria-label={`Tol- ${r.no}`}
                          placeholder="—"
                        />
                      </td>
                      <td>
                        <input
                          value={r.tolPlus}
                          onChange={e => updateCell(r.id, 'tolPlus', e.target.value)}
                          aria-label={`Tol+ ${r.no}`}
                          placeholder="—"
                        />
                      </td>
                      <td style={{ fontSize: 11, color: '#59657d' }}>{r.fit ?? '—'}</td>
                      <td>
                        <button
                          className={`status-badge ${r.status === 'OK' ? 'ok' : 'check'}`}
                          onClick={() => toggleStatus(r.id)}
                          title="Click để đổi trạng thái"
                        >
                          <i></i>
                          {r.status}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </aside>
      </div>

      {/* ── Toast ── */}
      <div className={`dash-toast${toastShow ? ' show' : ''}`}>{toastMsg}</div>
    </div>
  );
}
