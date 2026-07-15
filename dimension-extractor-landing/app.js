(() => {
  const content = window.SITE_CONTENT || {};

  const get = (path) => path.split(".").reduce((value, key) => value?.[key], content);

  document.querySelectorAll("[data-content]").forEach((element) => {
    const value = get(element.dataset.content);
    if (typeof value === "string") element.textContent = value;
  });

  const icons = {
    measure: '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M6 5v22M26 5v22M6 12h20M10 9v6M16 9v6M22 9v6M10 21h12M13 18v6M19 18v6"/></svg>',
    steps: '<svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="7" cy="8" r="2"/><circle cx="7" cy="16" r="2"/><circle cx="7" cy="24" r="2"/><path d="M12 8h14M12 16h14M12 24h14"/></svg>',
    edit: '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="m7 25 2-7L22 5l5 5-13 13zM19 8l5 5M7 25l7-2"/></svg>',
    excel: '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M7 3h13l5 5v21H7zM20 3v6h6M11 15l6 9M17 15l-6 9M20 15h2M20 19h2M20 23h2"/></svg>',
    upload: '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M6 4h13l7 7v17H6zM19 4v7h7M16 24V13M11 18l5-5 5 5"/></svg>',
    select: '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M7 12V7h5M20 7h5v5M25 20v5h-5M12 25H7v-5" stroke-dasharray="3 2"/></svg>',
    check: '<svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="14" cy="14" r="9"/><path d="m10 14 3 3 6-7M21 21l6 6"/></svg>',
  };

  const featureList = document.querySelector("[data-feature-list]");
  if (featureList && content.features?.items) {
    featureList.innerHTML = content.features.items
      .map(
        (item, index) => `
          <article class="feature-item reveal">
            <div class="feature-top">
              <span class="line-icon">${icons[item.icon] || icons.measure}</span>
              <span class="item-index">${String(index + 1).padStart(2, "0")}</span>
            </div>
            <h3>${item.title}</h3>
            <p>${item.description}</p>
          </article>`,
      )
      .join("");
  }

  const workflowList = document.querySelector("[data-workflow-list]");
  if (workflowList && content.workflow?.steps) {
    workflowList.innerHTML = content.workflow.steps
      .map(
        (step, index) => `
          <article class="workflow-step reveal">
            <div class="step-node"><span>${icons[step.icon] || icons.check}</span></div>
            <div class="step-copy">
              <span class="step-number">${String(index + 1).padStart(2, "0")}</span>
              <div><h3>${step.title}</h3><p>${step.description}</p></div>
            </div>
          </article>`,
      )
      .join("");
  }

  const faqList = document.querySelector("[data-faq-list]");
  if (faqList && content.faq?.items) {
    faqList.innerHTML = content.faq.items
      .map(
        (item, index) => `
          <details class="faq-item reveal" ${index === 0 ? "open" : ""}>
            <summary>
              <span class="faq-index">${String(index + 1).padStart(2, "0")}</span>
              <span>${item.question}</span>
              <span class="faq-toggle" aria-hidden="true"></span>
            </summary>
            <p>${item.answer}</p>
          </details>`,
      )
      .join("");
  }

  const menuButton = document.querySelector("[data-menu-button]");
  const menu = document.querySelector("[data-menu]");
  menuButton?.addEventListener("click", () => {
    const open = menuButton.getAttribute("aria-expanded") === "true";
    menuButton.setAttribute("aria-expanded", String(!open));
    menu?.classList.toggle("is-open", !open);
  });
  menu?.querySelectorAll("a").forEach((link) =>
    link.addEventListener("click", () => {
      menuButton?.setAttribute("aria-expanded", "false");
      menu.classList.remove("is-open");
    }),
  );

  const productWindow = document.querySelector("[data-product-window]");
  const scanStatus = document.querySelector("[data-scan-status]");
  let scanTimer;

  const showToast = (message) => {
    const toast = document.querySelector("[data-toast]");
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("is-visible");
    window.setTimeout(() => toast.classList.remove("is-visible"), 2600);
  };

  const runSample = ({ scroll = true } = {}) => {
    if (scroll) productWindow?.scrollIntoView({ behavior: "smooth", block: "center" });
    window.clearTimeout(scanTimer);
    productWindow?.classList.remove("scan-complete");
    productWindow?.classList.add("is-scanning");
    if (scanStatus) scanStatus.textContent = "Đang quét…";
    scanTimer = window.setTimeout(() => {
      productWindow?.classList.remove("is-scanning");
      productWindow?.classList.add("scan-complete");
      if (scanStatus) scanStatus.textContent = "4 kích thước · Đã nhận diện";
      showToast("Bản vẽ mẫu đã được phân tích.");
    }, 1500);
  };

  document.querySelectorAll("[data-run-sample], [data-run-sample-bottom]").forEach((button) => {
    button.addEventListener("click", () => runSample());
  });

  const exampleVisual = document.querySelector("[data-example-visual]");
  document.querySelector("[data-run-example]")?.addEventListener("click", () => {
    exampleVisual?.classList.remove("is-running");
    void exampleVisual?.offsetWidth;
    exampleVisual?.classList.add("is-running");
    exampleVisual?.scrollIntoView({ behavior: "smooth", block: "center" });
  });

  document.querySelector("[data-export-demo]")?.addEventListener("click", () => {
    showToast("Đây là nút minh họa — bản tĩnh chưa tạo tệp Excel.");
  });

  const fileInput = document.querySelector("[data-file-input]");
  const fileLabel = document.querySelector("[data-file-label]");
  const uploadNote = document.querySelector("[data-upload-note]");
  fileInput?.addEventListener("change", () => {
    const file = fileInput.files?.[0];
    if (!file) return;
    if (fileLabel) fileLabel.textContent = file.name;
    if (uploadNote) uploadNote.textContent = `Đã chọn ${file.name}. Tệp chỉ nằm trên thiết bị của bạn; bản landing page không gửi tệp đi.`;
    showToast("Đã chọn tệp. Đây là bản demo giao diện tĩnh.");
  });

  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      });
    },
    { threshold: 0.12 },
  );
  document.querySelectorAll(".reveal").forEach((element) => revealObserver.observe(element));

  const header = document.querySelector("[data-header]");
  const updateHeader = () => header?.classList.toggle("is-scrolled", window.scrollY > 12);
  updateHeader();
  window.addEventListener("scroll", updateHeader, { passive: true });

  const year = document.querySelector("[data-current-year]");
  if (year) year.textContent = new Date().getFullYear();
})();
