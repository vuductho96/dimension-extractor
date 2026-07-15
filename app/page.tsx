'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

// ─── Content (từ content.js gốc) ─────────────────────────────
const CONTENT = {
  brand: { name: 'Dimension Extractor', tagline: 'OCR bản vẽ dành cho đội ngũ kỹ thuật.' },
  nav: { cta: 'Dùng thử' },
  hero: {
    title: 'Biến bản vẽ kỹ thuật thành dữ liệu có cấu trúc.',
    description: 'Phát hiện kích thước, dung sai và ký hiệu. Kiểm tra, chỉnh sửa và xuất Excel trong một quy trình rõ ràng.',
    primaryCta: 'Thử với bản vẽ mẫu',
    secondaryCta: 'Xem quy trình',
  },
  features: {
    title: 'Đọc đúng thứ kỹ sư cần.',
    description: 'Tập trung vào dữ liệu kiểm tra, không biến bản vẽ thành một mớ văn bản.',
    items: [
      { icon: 'measure', title: 'Bắt kích thước & dung sai', description: 'Nhận diện số đo, Ø, R, góc và dung sai hai phía.' },
      { icon: 'steps',   title: 'Gom dữ liệu theo STEP',  description: 'Sắp xếp kết quả theo trình tự kiểm tra rõ ràng.' },
      { icon: 'edit',    title: 'Sửa nhanh trước khi xuất', description: 'Chỉnh số, trạng thái và đánh dấu kích thước quan trọng.' },
      { icon: 'excel',   title: 'Xuất Excel sạch',          description: 'Dữ liệu sẵn sàng cho QA, so sánh lot và lưu hồ sơ.' },
    ],
  },
  workflow: {
    title: 'Từ PDF đến Excel trong 4 bước.',
    description: 'Một luồng làm việc đủ ngắn để dùng hằng ngày, đủ rõ để kiểm soát kết quả.',
    steps: [
      { icon: 'upload', title: 'Thả bản vẽ',   description: 'PDF hoặc ảnh scan.' },
      { icon: 'select', title: 'Khoanh vùng',  description: 'Quét toàn trang hoặc chọn vùng cần đọc.' },
      { icon: 'check',  title: 'Kiểm tra',     description: 'Sửa số, dung sai và trạng thái.' },
      { icon: 'excel',  title: 'Xuất dữ liệu', description: 'Excel sẵn cho báo cáo QA.' },
    ],
  },
  example: {
    title: 'Một vùng quét. Một dòng dữ liệu rõ ràng.',
    description: 'Kết quả giữ đúng ngữ cảnh kỹ thuật để bạn kiểm tra nhanh trước khi đưa vào báo cáo.',
  },
  faq: {
    title: 'Câu hỏi thường gặp.',
    items: [
      { question: 'Công cụ đọc được định dạng nào?',            answer: 'Có thể xử lý PDF và các định dạng ảnh phổ biến như PNG, JPG. PDF cần có text layer từ phần mềm CAD (AutoCAD, SolidWorks, Creo, NX...).' },
      { question: 'Có nhận diện dung sai và ký hiệu Ø, R không?', answer: 'Có. Giao diện được thiết kế riêng cho kích thước, dung sai một hoặc hai phía, đường kính, bán kính và góc.' },
      { question: 'Dữ liệu có thể chỉnh sửa trước khi xuất không?', answer: 'Có. Người dùng có thể kiểm tra, sửa giá trị, đổi trạng thái và đánh dấu kích thước quan trọng trước khi xuất.' },
      { question: 'Dữ liệu lưu ở đâu?',                          answer: 'Dữ liệu kích thước được lưu vào tài khoản của bạn trên Supabase (PostgreSQL). File PDF xử lý hoàn toàn trong trình duyệt, không tải lên server.' },
    ],
  },
  cta: {
    title: 'Bắt đầu với một bản vẽ thật.',
    description: 'Thả bản vẽ mẫu, xem dữ liệu được tách ra và quyết định phần nào cần kiểm tra lại.',
  },
};

// ─── Icons ───────────────────────────────────────────────────
const ICONS: Record<string, string> = {
  measure: '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M6 5v22M26 5v22M6 12h20M10 9v6M16 9v6M22 9v6M10 21h12M13 18v6M19 18v6"/></svg>',
  steps:   '<svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="7" cy="8" r="2"/><circle cx="7" cy="16" r="2"/><circle cx="7" cy="24" r="2"/><path d="M12 8h14M12 16h14M12 24h14"/></svg>',
  edit:    '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="m7 25 2-7L22 5l5 5-13 13zM19 8l5 5M7 25l7-2"/></svg>',
  excel:   '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M7 3h13l5 5v21H7zM20 3v6h6M11 15l6 9M17 15l-6 9M20 15h2M20 19h2M20 23h2"/></svg>',
  upload:  '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M6 4h13l7 7v17H6zM19 4v7h7M16 24V13M11 18l5-5 5 5"/></svg>',
  select:  '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M7 12V7h5M20 7h5v5M25 20v5h-5M12 25H7v-5" stroke-dasharray="3 2"/></svg>',
  check:   '<svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="14" cy="14" r="9"/><path d="m10 14 3 3 6-7M21 21l6 6"/></svg>',
};

export default function LandingPage() {
  const productWindowRef = useRef<HTMLDivElement>(null);
  const exampleVisualRef = useRef<HTMLDivElement>(null);
  const scanStatusRef    = useRef<HTMLSpanElement>(null);
  const toastRef         = useRef<HTMLDivElement>(null);
  const menuRef          = useRef<HTMLElement>(null);
  const menuBtnRef       = useRef<HTMLButtonElement>(null);
  const headerRef        = useRef<HTMLElement>(null);
  const fileLabelRef     = useRef<HTMLSpanElement>(null);
  const uploadNoteRef    = useRef<HTMLParagraphElement>(null);
  const scanTimerRef     = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const yearRef          = useRef<HTMLSpanElement>(null);
  const [user, setUser]  = useState<{ email?: string } | null>(null);

  // Check auth state
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setUser(data.user ?? null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Reveal on scroll
  useEffect(() => {
    document.documentElement.classList.add('js');

    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (!e.isIntersecting) return;
        e.target.classList.add('is-visible');
        observer.unobserve(e.target);
      }),
      { threshold: 0.12 }
    );
    document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));

    // Header scroll
    const updateHeader = () =>
      headerRef.current?.classList.toggle('is-scrolled', window.scrollY > 12);
    updateHeader();
    window.addEventListener('scroll', updateHeader, { passive: true });

    // Year
    if (yearRef.current) yearRef.current.textContent = String(new Date().getFullYear());

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', updateHeader);
    };
  }, []);

  const showToast = (msg: string) => {
    const t = toastRef.current;
    if (!t) return;
    t.textContent = msg;
    t.classList.add('is-visible');
    setTimeout(() => t.classList.remove('is-visible'), 2600);
  };

  const runSample = (scroll = true) => {
    const win = productWindowRef.current;
    const status = scanStatusRef.current;
    if (scroll) win?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    clearTimeout(scanTimerRef.current);
    win?.classList.remove('scan-complete');
    win?.classList.add('is-scanning');
    if (status) status.textContent = 'Đang quét…';
    scanTimerRef.current = setTimeout(() => {
      win?.classList.remove('is-scanning');
      win?.classList.add('scan-complete');
      if (status) status.textContent = '4 kích thước · Đã nhận diện';
      showToast('Bản vẽ mẫu đã được phân tích.');
    }, 1500);
  };

  const toggleMenu = () => {
    const btn = menuBtnRef.current;
    const nav = menuRef.current;
    const open = btn?.getAttribute('aria-expanded') === 'true';
    btn?.setAttribute('aria-expanded', String(!open));
    nav?.classList.toggle('is-open', !open);
  };

  const closeMenu = () => {
    menuBtnRef.current?.setAttribute('aria-expanded', 'false');
    menuRef.current?.classList.remove('is-open');
  };

  return (
    <>
      <a className="skip-link" href="#main">Bỏ qua điều hướng</a>

      {/* ── Header ── */}
      <header className="site-header" ref={headerRef}>
        <div className="container header-inner">
          <a className="brand" href="#top" aria-label="Dimension Extractor — về đầu trang">
            <span className="brand-mark" aria-hidden="true">
              <span className="brand-pixels"></span>
              <span className="brand-d">D</span>
            </span>
            <span>{CONTENT.brand.name}</span>
          </a>

          <button className="menu-button" type="button" ref={menuBtnRef}
            aria-expanded="false" aria-controls="main-nav" onClick={toggleMenu}>
            <span></span><span></span>
            <span className="sr-only">Mở menu</span>
          </button>

          <nav className="main-nav" id="main-nav" ref={menuRef} aria-label="Điều hướng chính">
            <a href="#tinh-nang" onClick={closeMenu}>Tính năng</a>
            <a href="#quy-trinh" onClick={closeMenu}>Quy trình</a>
            <a href="#minh-hoa"  onClick={closeMenu}>Minh họa</a>
            <a href="#faq"       onClick={closeMenu}>FAQ</a>
          </nav>

          <div className="header-auth">
            {user ? (
              <Link href="/dashboard" className="button button-small">Dashboard →</Link>
            ) : (
              <>
                <Link href="/login"    className="btn-login">Đăng nhập</Link>
                <Link href="/dashboard" className="button button-small">Dùng thử ngay</Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main id="main">
        {/* ── Hero ── */}
        <section className="hero" id="top">
          <div className="container hero-grid">
            <div className="hero-copy reveal">
              <h1>{CONTENT.hero.title}</h1>
              <p>{CONTENT.hero.description}</p>
              <div className="hero-actions">
                <button className="button" type="button" onClick={() => runSample()}>
                  <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M5 3h10l4 4v14H5zM14 3v5h5M8 13h8M8 17h5"/></svg>
                  <span>{CONTENT.hero.primaryCta}</span>
                </button>
                <a className="button button-ghost" href="#quy-trinh">
                  <svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="m10 8 6 4-6 4z"/></svg>
                  <span>{CONTENT.hero.secondaryCta}</span>
                </a>
              </div>
            </div>

            <div className="product-window reveal" ref={productWindowRef}
              aria-label="Minh họa giao diện OCR bản vẽ">
              <div className="window-toolbar">
                <div className="mini-brand">
                  <span className="mini-brand-mark">D</span>
                  <span>Dimension Extractor</span>
                </div>
                <div className="tool-cluster" aria-hidden="true">
                  <span className="tool active"><svg viewBox="0 0 24 24"><path d="m7 5 8 8-4 1-2 4z"/></svg></span>
                  <span className="tool"><svg viewBox="0 0 24 24"><path d="M8 12V6a2 2 0 0 1 4 0v5M12 10V5a2 2 0 0 1 4 0v7M16 10V7a2 2 0 0 1 4 0v7c0 4-3 7-7 7h-1c-3 0-5-2-6-4l-2-4a2 2 0 0 1 4-2l2 3"/></svg></span>
                  <span className="tool"><svg viewBox="0 0 24 24"><path d="M5 9V5h4M15 5h4v4M19 15v4h-4M9 19H5v-4"/></svg></span>
                  <span className="tool"><svg viewBox="0 0 24 24"><path d="M6 12h12"/></svg></span>
                  <span className="tool"><svg viewBox="0 0 24 24"><path d="M6 12h12M12 6v12"/></svg></span>
                  <span className="tool"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="6"/><path d="m16 16 4 4"/></svg></span>
                </div>
                <div className="tool-cluster" aria-hidden="true">
                  <span className="tool"><svg viewBox="0 0 24 24"><path d="M12 16V4M8 8l4-4 4 4M5 14v5h14v-5"/></svg></span>
                  <span className="tool"><svg viewBox="0 0 24 24"><path d="M12 4v12M8 12l4 4 4-4M5 14v5h14v-5"/></svg></span>
                </div>
              </div>

              <div className="product-body">
                <div className="drawing-stage">
                  <svg className="technical-drawing" viewBox="0 0 720 470" role="img"
                    aria-label="Bản vẽ cơ khí với các kích thước được nhận diện">
                    <defs>
                      <pattern id="hero-dots" width="20" height="20" patternUnits="userSpaceOnUse">
                        <circle cx="1.5" cy="1.5" r="1.1" fill="#dce4f2"/>
                      </pattern>
                      <marker id="hero-arrow" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
                        <path d="M8 0 0 4l8 4z" fill="#071537"/>
                      </marker>
                      <pattern id="hero-hatch" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(42)">
                        <line x1="0" y1="0" x2="0" y2="9" stroke="#8b95a8" strokeWidth="1"/>
                      </pattern>
                    </defs>
                    <rect width="720" height="470" fill="url(#hero-dots)"/>
                    <g fill="none" stroke="#0c1834" strokeWidth="2.2">
                      <path d="M172 208h108v-84h85v84h100v-38h75c24 0 43 19 43 43v44c0 24-19 43-43 43h-75v-38H365v84h-85v-84H172z" fill="#fff"/>
                      <path d="M280 124v222h85V124z" fill="url(#hero-hatch)"/>
                      <path d="M172 208h108v54H172z" fill="url(#hero-hatch)"/>
                      <path d="M365 208h100v54H365z" fill="url(#hero-hatch)"/>
                      <circle cx="211" cy="235" r="16"/>
                      <circle cx="534" cy="235" r="19"/>
                      <circle cx="534" cy="235" r="10"/>
                      <path d="M145 235h470" strokeDasharray="16 7 3 7" strokeWidth="1.2"/>
                      <path d="M322 90v-45M465 190V45M322 62h143" markerStart="url(#hero-arrow)" markerEnd="url(#hero-arrow)"/>
                      <path d="M165 168 123 136M185 204l-34-26"/>
                      <path d="M574 172 620 136M580 200l32-42"/>
                    </g>
                    <g className="dimension-label" fontFamily="Arial, sans-serif" fill="#071537">
                      <rect x="350" y="42" width="88" height="40" rx="3" fill="#fff" stroke="#1550ff" strokeWidth="2" strokeDasharray="6 4"/>
                      <text x="394" y="68" textAnchor="middle" fontSize="22">12.920</text>
                      <rect x="60" y="112" width="86" height="40" rx="3" fill="#fff" stroke="#1550ff" strokeWidth="2" strokeDasharray="6 4"/>
                      <text x="103" y="138" textAnchor="middle" fontSize="22">Ø8.00</text>
                      <rect x="590" y="105" width="72" height="40" rx="3" fill="#fff" stroke="#1550ff" strokeWidth="2" strokeDasharray="6 4"/>
                      <text x="626" y="131" textAnchor="middle" fontSize="22">R2.5</text>
                      <rect x="575" y="285" width="112" height="60" rx="3" fill="#fff" stroke="#1550ff" strokeWidth="2" strokeDasharray="6 4"/>
                      <text x="631" y="310" textAnchor="middle" fontSize="20">+0.002</text>
                      <text x="631" y="334" textAnchor="middle" fontSize="20">−0.002</text>
                    </g>
                    <g className="ocr-corners" stroke="#1550ff" strokeWidth="4">
                      <path d="M348 50v-10h10M430 40h10v10M440 74v10h-10M358 84h-10V74"/>
                    </g>
                  </svg>
                  <div className="scan-line" aria-hidden="true"></div>
                  <div className="scale-label">10 mm</div>
                </div>

                <div className="result-panel">
                  <div className="result-heading">
                    <div>
                      <strong>Kết quả trích xuất</strong>
                      <span ref={scanStatusRef}>Sẵn sàng</span>
                    </div>
                    <span className="filter-icon" aria-hidden="true">⌕</span>
                  </div>
                  <div className="result-table" role="table" aria-label="Kết quả OCR mẫu">
                    <div className="table-row table-head" role="row">
                      <span>No.</span><span>Nominal</span><span>Tol −</span><span>Tol +</span><span>Status</span>
                    </div>
                    <div className="table-row" role="row"><span>1</span><strong>12.920</strong><span>—</span><span>—</span><span className="status-ok"><i></i>OK</span></div>
                    <div className="table-row" role="row"><span>2</span><strong>Ø8.00</strong><span>—</span><span>—</span><span className="status-ok"><i></i>OK</span></div>
                    <div className="table-row" role="row"><span>3</span><strong>R2.5</strong><span>—</span><span>—</span><span className="status-ok"><i></i>OK</span></div>
                    <div className="table-row" role="row"><span>4</span><strong>12.920</strong><span>0.002</span><span>0.002</span><span className="status-ok"><i></i>OK</span></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Features ── */}
        <section className="section features-section" id="tinh-nang">
          <div className="container">
            <div className="section-heading reveal">
              <h2>{CONTENT.features.title}</h2>
              <p>{CONTENT.features.description}</p>
            </div>
            <div className="feature-rail">
              {CONTENT.features.items.map((item, i) => (
                <article className="feature-item reveal" key={i}>
                  <div className="feature-top">
                    <span className="line-icon" dangerouslySetInnerHTML={{ __html: ICONS[item.icon] || ICONS.measure }}/>
                    <span className="item-index">{String(i + 1).padStart(2, '0')}</span>
                  </div>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                </article>
              ))}
            </div>
            <div className="feature-visual reveal" aria-label="Minh họa liên kết vùng OCR với dữ liệu đầu ra">
              <div className="feature-blueprint">
                <svg viewBox="0 0 520 300" role="img" aria-label="Mặt bích cơ khí và vùng kích thước OCR">
                  <defs><marker id="small-arrow" markerWidth="7" markerHeight="7" refX="3.5" refY="3.5" orient="auto"><path d="M7 0 0 3.5 7 7z" fill="#071537"/></marker></defs>
                  <g fill="none" stroke="#071537" strokeWidth="1.8">
                    <path d="M150 66h220l38 38v112l-38 38H150l-38-38V104z"/>
                    <circle cx="260" cy="160" r="56"/><circle cx="260" cy="160" r="35"/>
                    <circle cx="165" cy="106" r="14"/><circle cx="355" cy="106" r="14"/><circle cx="165" cy="214" r="14"/><circle cx="355" cy="214" r="14"/>
                    <path d="M82 160h356M260 35v250" strokeDasharray="12 6 2 6" strokeWidth="1"/>
                    <path d="M150 48h220" markerStart="url(#small-arrow)" markerEnd="url(#small-arrow)"/>
                    <path d="M150 58V38M370 58V38"/>
                  </g>
                  <g fontFamily="Arial, sans-serif" fontSize="17" fill="#071537">
                    <rect x="216" y="30" width="88" height="30" fill="#fff" stroke="#1550ff" strokeWidth="2" strokeDasharray="5 4"/><text x="260" y="51" textAnchor="middle">70 ±0.10</text>
                    <rect x="28"  y="145" width="88" height="30" fill="#fff" stroke="#1550ff" strokeWidth="2" strokeDasharray="5 4"/><text x="72"  y="166" textAnchor="middle">50 ±0.05</text>
                    <rect x="392" y="86"  width="92" height="48" fill="#fff" stroke="#1550ff" strokeWidth="2" strokeDasharray="5 4"/>
                    <text x="438" y="107" textAnchor="middle">Ø20 H7</text>
                    <text x="438" y="126" textAnchor="middle" fontSize="14">+0.021 / 0</text>
                  </g>
                </svg>
              </div>
              <div className="visual-connector" aria-hidden="true"><span></span><span></span><span></span></div>
              <div className="editable-table">
                <div className="editable-head"><span>STEP</span><span>Nội dung</span><span>Giá trị</span><span>Dung sai</span><span>Trạng thái</span></div>
                <div className="editable-row"><span>10</span><span>Khoảng cách</span><label><input defaultValue="70" aria-label="Giá trị bước 10"/></label><label><input defaultValue="±0.10" aria-label="Dung sai bước 10"/></label><span className="status-ok"><i></i>OK</span></div>
                <div className="editable-row"><span>20</span><span>Khoảng cách</span><label><input defaultValue="50" aria-label="Giá trị bước 20"/></label><label><input defaultValue="±0.05" aria-label="Dung sai bước 20"/></label><span className="status-ok"><i></i>OK</span></div>
                <div className="editable-row"><span>30</span><span>Đường kính</span><label><input defaultValue="20" aria-label="Giá trị bước 30"/></label><label><input defaultValue="+0.021 / 0" aria-label="Dung sai bước 30"/></label><span className="status-ok"><i></i>OK</span></div>
                <div className="editable-row"><span>40</span><span>Bán kính</span><label><input defaultValue="3" aria-label="Giá trị bước 40"/></label><label><input defaultValue="—" aria-label="Dung sai bước 40"/></label><span className="status-ok"><i></i>OK</span></div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Workflow ── */}
        <section className="section workflow-section" id="quy-trinh">
          <div className="container">
            <div className="section-heading centered reveal">
              <h2>{CONTENT.workflow.title}</h2>
              <p>{CONTENT.workflow.description}</p>
            </div>
            <div className="workflow-rail">
              {CONTENT.workflow.steps.map((step, i) => (
                <article className="workflow-step reveal" key={i}>
                  <div className="step-node">
                    <span dangerouslySetInnerHTML={{ __html: ICONS[step.icon] || ICONS.check }}/>
                  </div>
                  <div className="step-copy">
                    <span className="step-number">{String(i + 1).padStart(2, '0')}</span>
                    <div><h3>{step.title}</h3><p>{step.description}</p></div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ── Example ── */}
        <section className="section example-section" id="minh-hoa">
          <div className="container">
            <div className="example-header reveal">
              <div>
                <h2>{CONTENT.example.title}</h2>
                <p>{CONTENT.example.description}</p>
              </div>
              <button className="text-link" type="button" onClick={() => {
                exampleVisualRef.current?.classList.remove('is-running');
                void exampleVisualRef.current?.offsetWidth;
                exampleVisualRef.current?.classList.add('is-running');
                exampleVisualRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }}>Xem hiệu ứng quét <span aria-hidden="true">→</span></button>
            </div>
            <div className="before-after reveal" ref={exampleVisualRef}>
              <div className="before-panel">
                <div className="panel-label"><span>Bản vẽ đầu vào</span><small>PDF · Trang 01</small></div>
                <div className="shaft-drawing">
                  <svg viewBox="0 0 650 330" role="img" aria-label="Bản vẽ trục cơ khí đầu vào">
                    <defs><marker id="shaft-arrow" markerWidth="7" markerHeight="7" refX="3.5" refY="3.5" orient="auto"><path d="M7 0 0 3.5 7 7z" fill="#071537"/></marker></defs>
                    <g fill="none" stroke="#071537" strokeWidth="2">
                      <path d="M130 125h130v-34h210v34h50v80h-50v34H260v-34H130z"/>
                      <path d="M105 165h440" strokeDasharray="15 7 2 7" strokeWidth="1"/>
                      <path d="M260 70v-34M470 70V36M260 52h210" markerStart="url(#shaft-arrow)" markerEnd="url(#shaft-arrow)"/>
                      <path d="M90 125H55M90 205H55M72 125v80" markerStart="url(#shaft-arrow)" markerEnd="url(#shaft-arrow)"/>
                      <path d="M130 255v38M520 220v73M130 278h390" markerStart="url(#shaft-arrow)" markerEnd="url(#shaft-arrow)"/>
                      <path d="M470 91h52v34M470 239h52v-34"/>
                    </g>
                    <g fontFamily="Arial, sans-serif" fontSize="20" fill="#071537">
                      <text x="365" y="45" textAnchor="middle">65</text>
                      <text x="63" y="171" textAnchor="middle" transform="rotate(-90 63 171)">Ø20</text>
                      <text x="325" y="308" textAnchor="middle">12.920</text>
                      <text x="536" y="176">Ø8.00</text>
                      <text x="118" y="230">R2.5</text>
                      <rect x="280" y="265" width="92" height="38" fill="#fff" stroke="#1550ff" strokeWidth="2.5" strokeDasharray="6 4"/>
                      <text x="326" y="290" textAnchor="middle">12.920</text>
                    </g>
                  </svg>
                  <span className="example-scan-line" aria-hidden="true"></span>
                </div>
              </div>
              <div className="transfer-arrow" aria-hidden="true"><span></span>→</div>
              <div className="after-panel">
                <div className="panel-label"><span>Dữ liệu đầu ra</span><small>Đã kiểm tra</small></div>
                <div className="output-record">
                  <div className="record-index">01</div>
                  <dl>
                    <div><dt>Loại</dt><dd>Khoảng cách</dd></div>
                    <div><dt>Nominal</dt><dd>12.920</dd></div>
                    <div><dt>Tol −</dt><dd>0.002</dd></div>
                    <div><dt>Tol +</dt><dd>0.002</dd></div>
                    <div><dt>Đơn vị</dt><dd>mm</dd></div>
                    <div><dt>Trạng thái</dt><dd className="status-ok"><i></i>OK</dd></div>
                  </dl>
                </div>
                <button className="export-button" type="button" onClick={() => showToast('Đây là minh họa — đăng nhập để xuất Excel thực.')}>
                  <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M5 3h10l4 4v14H5zM14 3v5h5M8 13h8M8 17h8"/></svg>
                  Xuất Excel mẫu
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section className="section faq-section" id="faq">
          <div className="container">
            <div className="section-heading centered reveal"><h2>{CONTENT.faq.title}</h2></div>
            <div className="faq-grid">
              {CONTENT.faq.items.map((item, i) => (
                <details className="faq-item reveal" key={i} open={i === 0}>
                  <summary>
                    <span className="faq-index">{String(i + 1).padStart(2, '0')}</span>
                    <span>{item.question}</span>
                    <span className="faq-toggle" aria-hidden="true"></span>
                  </summary>
                  <p>{item.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="cta-section" id="dung-thu">
          <div className="blueprint-decor blueprint-left" aria-hidden="true"></div>
          <div className="blueprint-decor blueprint-right" aria-hidden="true"></div>
          <div className="container cta-inner reveal">
            <h2>{CONTENT.cta.title}</h2>
            <p>{CONTENT.cta.description}</p>
            <div className="cta-actions">
              <Link href="/dashboard" className="button button-light">
                <span>Dùng thử không cần Đăng nhập</span>
                <span aria-hidden="true">→</span>
              </Link>
              <button className="button-link-light" type="button" onClick={() => runSample()}>
                Xem bản vẽ mẫu <span aria-hidden="true">→</span>
              </button>
            </div>
            <p className="cta-note" ref={uploadNoteRef}>
              Trải nghiệm ngay · Không cần tạo tài khoản · PDF xử lý hoàn toàn trong trình duyệt của bạn.
            </p>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="container footer-inner">
          <a className="brand" href="#top">
            <span className="brand-mark" aria-hidden="true"><span className="brand-pixels"></span><span className="brand-d">D</span></span>
            <span>{CONTENT.brand.name}</span>
          </a>
          <p>{CONTENT.brand.tagline}</p>
          <p className="footer-meta">© <span ref={yearRef}></span></p>
        </div>
      </footer>

      <div className="toast" role="status" aria-live="polite" ref={toastRef}></div>
    </>
  );
}
