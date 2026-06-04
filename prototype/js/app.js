import {
  loadFixture,
  validateLines,
  hasBlockingIssues,
  linesFromApiResponse,
} from "./parse.js";
import { buildSchedule } from "./schedule.js";
import {
  loadDrugDb,
  matchDrug,
  resolveDrug,
  fetchDrugsBatchAI,
  checkDrugApi,
} from "./drugs.js";
import { fetchHealth, parseRxImage } from "./api.js";
import { renderCitationsHtml } from "./citations-ui.js";
import { attachCitations } from "./drug-citations.js";
import { mountNearbyBuySection } from "./nearby.js";
import {
  getTodayEvents,
  getNextReminder,
  eventId,
  minutesUntil,
  formatCountdown,
  getTodayIso,
} from "./reminders.js";
import {
  renderCalendarGrid,
  buildSyncView,
  toIso,
} from "./calendar-ui.js";

const STORAGE_KEY = "medilich_state";

const state = {
  rxLines: [],
  schedule: [],
  issues: [],
  uploadFile: null,
  previewUrl: null,
  meta: null,
  inputMode: "upload",
  scanStep: 1,
  mainTab: "home",
  takenIds: new Set(),
  calYear: new Date().getFullYear(),
  calMonth: new Date().getMonth(),
  selectedDate: getTodayIso(),
};

function saveState() {
  try {
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        rxLines: state.rxLines,
        schedule: state.schedule,
        meta: state.meta,
        takenIds: [...state.takenIds],
      })
    );
  } catch (_) {}
}

function loadState() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const data = JSON.parse(raw);
    state.rxLines = data.rxLines || [];
    state.schedule = data.schedule || [];
    state.meta = data.meta || null;
    state.takenIds = new Set(data.takenIds || []);
    return state.schedule.length > 0;
  } catch {
    return false;
  }
}

const $ = (id) => document.getElementById(id);

function showFlow(name) {
  $("flow-scan").classList.toggle("active", name === "scan");
  $("flow-main").classList.toggle("active", name === "main");
}

function setScanStep(n) {
  state.scanStep = n;
  document.querySelectorAll("[data-scan-panel]").forEach((p) => {
    p.classList.toggle("active", Number(p.dataset.scanPanel) === n);
  });
  document.querySelectorAll(".scan-step").forEach((s) => {
    const step = Number(s.dataset.scanStep);
    s.classList.toggle("active", step === n);
    s.classList.toggle("done", step < n);
  });
  $("scan-back").classList.toggle("hidden", n === 1);
  $("scan-title").textContent = n === 1 ? "Quét đơn thuốc" : "Xác nhận đơn";
}

function reflowShell() {
  const shell = document.querySelector(".phone-shell");
  if (shell) void shell.offsetWidth;
}

function setMainTab(tab) {
  state.mainTab = tab;
  document.querySelectorAll(".main-panel").forEach((p) => {
    p.classList.toggle("active", p.dataset.tab === tab);
  });
  document.querySelectorAll(".nav-item").forEach((n) => {
    n.classList.toggle("active", n.dataset.tab === tab);
  });
  const titles = { home: "Nhắc uống", calendar: "Lịch thuốc", meds: "Thuốc của tôi" };
  $("main-title").textContent = titles[tab] || "MediLịch";

  const mainScroll = document.querySelector("#flow-main .screen-content");
  if (mainScroll) mainScroll.scrollTop = 0;

  reflowShell();

  if (tab === "calendar") renderCalendar();
  if (tab === "meds") renderDrugCards();
  if (tab === "home") renderHome();
}

function setLoading(on, msg = "Đang xử lý…") {
  $("loading").classList.toggle("hidden", !on);
  $("loading").querySelector(".loading-text").textContent = msg;
  $("btn-analyze")?.toggleAttribute("disabled", on);
}

function setInputMode(mode) {
  state.inputMode = mode;
  document.querySelectorAll("[data-mode-panel]").forEach((el) => {
    el.classList.toggle("hidden", el.dataset.modePanel !== mode);
  });
  document.querySelectorAll("[data-mode-tab]").forEach((tab) => {
    tab.classList.toggle("active", tab.dataset.modeTab === mode);
  });
  reflowShell();
}

function updatePreview(file) {
  if (state.previewUrl) URL.revokeObjectURL(state.previewUrl);
  state.uploadFile = file;
  const img = $("preview-img");
  const ph = $("preview-placeholder");
  if (!file) {
    state.previewUrl = null;
    img.classList.add("hidden");
    ph.classList.remove("hidden");
    return;
  }
  state.previewUrl = URL.createObjectURL(file);
  img.src = state.previewUrl;
  img.classList.remove("hidden");
  ph.classList.add("hidden");
}

function esc(s) {
  return String(s ?? "").replace(/"/g, "&quot;");
}

function updateStatusBarTime() {
  const el = $("sb-time");
  if (el) {
    const d = new Date();
    el.textContent = d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
  }
}

// ——— Scan flow ———

async function onAnalyze() {
  try {
    if (state.inputMode === "demo") {
      const preset = document.querySelector('input[name="preset"]:checked')?.value || "happy";
      setLoading(true, "Đang tải mẫu…");
      state.rxLines = await loadFixture(preset);
      state.meta = { ocr_engine: "fixture", parse_model: preset };
    } else {
      if (!state.uploadFile) {
        alert("Chọn ảnh đơn thuốc trước.");
        return;
      }
      setLoading(true, "AI đang đọc đơn…");
      const data = await parseRxImage(state.uploadFile);
      state.rxLines = linesFromApiResponse(data);
      state.meta = {
        ocr_engine: data.ocr_engine,
        parse_model: data.parse_model,
        raw_text: data.raw_text,
      };
      if (!state.rxLines.length) {
        alert("Không trích xuất được thuốc. Thử ảnh rõ hơn hoặc tab Demo.");
        return;
      }
    }
    state.issues = validateLines(state.rxLines);
    renderReview();
    setScanStep(2);
  } catch (e) {
    console.error(e);
    alert(e.message || "Lỗi server — chạy npm start trong server/");
  } finally {
    setLoading(false);
  }
}

function renderReview() {
  const root = $("review-lines");
  root.innerHTML = "";
  const block = $("block-alert");
  block.classList.add("hidden");

  const ocr = $("ocr-preview");
  if (state.meta?.raw_text) {
    ocr.classList.remove("hidden");
    ocr.querySelector("pre").textContent = state.meta.raw_text.slice(0, 800);
    ocr.querySelector(".ocr-meta").textContent = `${state.meta.ocr_engine} · ${state.meta.parse_model}`;
  } else ocr.classList.add("hidden");

  state.issues = validateLines(state.rxLines);
  if (hasBlockingIssues(state.issues)) {
    block.textContent = "Sửa ô đỏ trước khi đồng bộ lịch.";
    block.classList.remove("hidden");
  }

  state.rxLines.forEach((line, i) => {
    const lineIssues = state.issues.filter((x) => x.index === i);
    const div = document.createElement("div");
    div.className =
      "rx-line" +
      (lineIssues.some((x) => x.type === "danger") ? " danger" : "") +
      (lineIssues.some((x) => x.type === "warn") ? " warn" : "");

    let badges = "";
    lineIssues.forEach((iss) => {
      badges += `<span class="badge badge-${iss.type === "danger" ? "danger" : "warn"}">${iss.msg}</span>`;
    });

    div.innerHTML = `
      ${badges}
      <label>Tên thuốc</label>
      <input data-i="${i}" data-field="drug_name" value="${esc(line.drug_name)}" />
      <label>Liều / lần</label>
      <input data-i="${i}" data-field="dose_per_time" value="${esc(line.dose_per_time)}" />
      <label>Lần / ngày</label>
      <input type="number" min="1" max="4" data-i="${i}" data-field="frequency_per_day" value="${line.frequency_per_day}" />
      <label>Ăn uống</label>
      <input data-i="${i}" data-field="meal_relation" value="${esc(line.meal_relation)}" />
      <label>Số ngày</label>
      <input type="number" min="1" data-i="${i}" data-field="duration_days" value="${line.duration_days}" />
    `;
    root.appendChild(div);
  });

  root.querySelectorAll("input").forEach((inp) => {
    inp.addEventListener("input", (e) => {
      const i = Number(e.target.dataset.i);
      const field = e.target.dataset.field;
      let val = e.target.value;
      if (field === "frequency_per_day" || field === "duration_days") val = Number(val);
      state.rxLines[i][field] = val;
      renderReview();
    });
  });

  $("btn-save-sync").disabled = hasBlockingIssues(state.issues);
}

function onSaveAndSync() {
  if (hasBlockingIssues(validateLines(state.rxLines))) return;
  state.schedule = buildSchedule(state.rxLines);
  state.takenIds = new Set();
  saveState();
  showFlow("main");
  setMainTab("home");
  renderHome();
  renderCalendar();
  prefetchDrugInfo();
  showNotif("Đã đồng bộ lịch từ đơn thuốc", `${state.schedule.length} nhắc đã tạo`);
}

/** Tải trước thẻ thuốc (AI cho thuốc chưa có trong DB) */
async function prefetchDrugInfo() {
  const names = [...new Set(state.rxLines.map((l) => l.drug_name?.trim()).filter(Boolean))];
  const needAi = names.filter((n) => !matchDrug(n));
  if (!needAi.length) return;
  try {
    await fetchDrugsBatchAI(needAi);
  } catch (e) {
    console.warn("Batch drug prefetch:", e);
  }
}

// ——— Main app ———

function renderHome() {
  const next = getNextReminder(state.schedule, state.takenIds);
  const today = getTodayEvents(state.schedule);

  if (!state.schedule.length) {
    $("next-time").textContent = "—";
    $("next-drug").textContent = "Quét đơn để tạo lịch nhắc";
    $("next-countdown").textContent = "";
    $("today-count").textContent = "0 nhắc";
    $("today-reminders").innerHTML =
      '<li class="body-sm muted" style="padding:12px 0">Chưa có lịch</li>';
    return;
  }

  if (next) {
    $("next-time").textContent = next.time;
    $("next-drug").textContent = next.drug_name;
    const mins = minutesUntil(next.time, next.date);
    $("next-countdown").textContent =
      next.date === getTodayIso() ? formatCountdown(mins) : formatDateShort(next.date);
  } else {
    $("next-time").textContent = "✓";
    $("next-drug").textContent = "Hôm nay đã xong các nhắc";
    $("next-countdown").textContent = "";
  }

  $("today-count").textContent = `${today.length} nhắc`;

  const ul = $("today-reminders");
  ul.innerHTML = "";
  if (!today.length) {
    ul.innerHTML = '<li class="body-sm muted" style="padding:12px 0">Không còn nhắc hôm nay</li>';
    return;
  }

  today.forEach((ev) => {
    const id = eventId(ev);
    const done = state.takenIds.has(id);
    const li = document.createElement("li");
    li.className = "reminder-item" + (done ? " done" : "");
    li.innerHTML = `
      <button type="button" class="reminder-check" aria-label="Đã uống"></button>
      <div>
        <span class="reminder-time">${ev.time}</span>
        <p class="body-sm" style="color:var(--md-on-surface);margin-top:2px">${esc(ev.drug_name)}</p>
        <p class="body-sm">${esc(ev.dose)} · ${esc(ev.meal)}</p>
      </div>
    `;
    li.querySelector(".reminder-check").addEventListener("click", () => {
      if (done) state.takenIds.delete(id);
      else state.takenIds.add(id);
      saveState();
      renderHome();
    });
    ul.appendChild(li);
  });
}

function formatDateShort(iso) {
  const d = new Date(iso + "T12:00:00");
  return d.toLocaleDateString("vi-VN", { weekday: "short", day: "numeric", month: "short" });
}

function onMarkTaken() {
  const next = getNextReminder(state.schedule, state.takenIds);
  if (!next) return;
  state.takenIds.add(eventId(next));
  saveState();
  renderHome();
  showNotif("Đã ghi nhận", `Đã uống ${next.drug_name}`);
}

function renderCalendar() {
  const label = $("cal-month-label");
  label.textContent = new Date(state.calYear, state.calMonth).toLocaleDateString("vi-VN", {
    month: "long",
    year: "numeric",
  });

  renderCalendarGrid(
    $("calendar-grid"),
    state.calYear,
    state.calMonth,
    state.schedule,
    state.selectedDate,
    (iso) => {
      state.selectedDate = iso;
      renderCalendar();
      openSyncSheet(iso);
    }
  );
}

function openSyncSheet(dateIso) {
  const iso = dateIso || state.selectedDate || getTodayIso();
  state.selectedDate = iso;

  const view = buildSyncView(state.rxLines, state.schedule, iso);
  $("sync-date-label").textContent = formatDateShort(iso);

  const rxEl = $("sync-rx");
  const calEl = $("sync-cal");

  if (!state.rxLines.length) {
    rxEl.innerHTML = '<p class="body-sm">Chưa có đơn — quét đơn mới</p>';
  } else {
    rxEl.innerHTML = view.prescription
      .map(
        (p) => `
      <div class="sync-item">
        <strong>${esc(p.drug_name)}</strong><br>
        ${esc(p.dose)} · ${p.frequency} lần/ngày · ${esc(p.meal)}<br>
        <small>${p.duration_days} ngày</small>
      </div>`
      )
      .join("");
  }

  if (!view.reminders.length) {
    calEl.innerHTML = '<p class="body-sm">Không có nhắc ngày này</p>';
  } else {
    calEl.innerHTML = view.reminders
      .map(
        (r) => `
      <div class="sync-item">
        <strong>${r.time}</strong> — ${esc(r.drug_name)}<br>
        ${esc(r.dose)} · ${esc(r.meal)}
      </div>`
      )
      .join("");
  }

  const status = $("sync-status");
  if (view.inSync && view.totalReminders > 0) {
    status.className = "banner banner-ok";
    status.textContent = `✓ Đồng bộ: ${view.totalReminders} nhắc khớp đơn (${view.prescription.length} thuốc)`;
  } else if (state.rxLines.length && !view.reminders.length) {
    status.className = "banner banner-error";
    status.textContent = "Ngày này chưa có nhắc — kiểm tra số ngày uống trên đơn";
  } else {
    status.className = "banner banner-ok";
    status.textContent = "Chọn ngày có chấm trên lịch để xem chi tiết";
  }

  $("sync-sheet").classList.add("open");
  $("sync-sheet").classList.remove("hidden");
  $("sheet-backdrop").classList.remove("hidden");
}

function closeSyncSheet() {
  $("sync-sheet").classList.remove("open");
  setTimeout(() => {
    $("sync-sheet").classList.add("hidden");
    $("sheet-backdrop").classList.add("hidden");
  }, 280);
}

function sourceBadge(source) {
  if (source === "openai") return '<span class="chip-ai">AI</span>';
  if (source === "local") return '<span class="chip-ai chip-local">Có sẵn</span>';
  return "";
}

function renderDrugDetail(detail, drug, line) {
  const showCites = drug.source !== "fallback";
  const hasVerifiedCites =
    showCites && Array.isArray(drug.citations) && drug.citations.some((c) => c.source_id);
  detail.innerHTML = `
    <div class="drug-detail" style="margin-top: 16px; border-top: 1px solid var(--md-outline); padding-top: 16px;">
      <h4 class="label-sm" style="margin-bottom: 6px;">Hướng dẫn cách uống</h4>
      <p class="drug-body" style="font-size: 0.95rem; margin-bottom: 12px; color: var(--md-on-surface);">${esc(drug.how_to_take)}</p>
      
      <div class="rx-specific-instruction" style="background: var(--md-primary-container); color: var(--md-primary); padding: 10px 14px; border-radius: 8px; font-size: 0.9rem; font-weight: 500; display: flex; align-items: center; gap: 8px; margin-bottom: 16px;">
        <span style="font-size: 1.2rem;">📋</span>
        <span><strong>Chỉ định theo đơn:</strong> ${line.frequency_per_day} lần/ngày (${esc(line.meal_relation || "không yêu cầu ăn uống")})</span>
      </div>

      <h4 class="label-sm" style="margin-bottom: 8px; color: #ba1a1a;">Lưu ý quan trọng</h4>
      <div class="drug-warnings-list" style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 16px;">
        ${(drug.warnings || []).map((w) => `
          <div class="warning-item" style="display: flex; gap: 8px; align-items: flex-start; background: #fff5f5; border-left: 4px solid #ba1a1a; padding: 10px 12px; border-radius: 6px; font-size: 0.9rem; color: #7f1d1d;">
            <span style="font-size: 1rem; line-height: 1.2;">⚠️</span>
            <span style="line-height: 1.4;">${esc(w)}</span>
          </div>
        `).join("")}
      </div>

      ${showCites ? '<div class="cite-mount"></div>' : ""}
      ${drug.source === "fallback" ? '<button type="button" class="btn-tonal btn-retry-drug">Tra lại bằng AI</button>' : ""}
    </div>`;

  detail.querySelector(".btn-retry-drug")?.addEventListener("click", async (e) => {
    e.stopPropagation();
    e.target.disabled = true;
    e.target.textContent = "Đang tra…";
    const d = await resolveDrug(line.drug_name, { forceRetry: true });
    renderDrugDetail(detail, d, line);
  });

  if (showCites) {
    const citeMount = detail.querySelector(".cite-mount");
    citeMount.innerHTML = renderCitationsHtml(
      hasVerifiedCites ? drug.citations : null,
      { loading: !hasVerifiedCites }
    );

    if (!hasVerifiedCites) {
      attachCitations(drug).then((d) => {
        if (citeMount.isConnected) {
          citeMount.innerHTML = renderCitationsHtml(d.citations);
        }
      });
    }

    const card = detail.querySelector(".drug-detail");
    mountNearbyBuySection(card, drug, line);
  }
}

function mountDrugCard(list, line, drug, autoExpand = false) {
  const card = document.createElement("div");
  card.className = "surface-card drug-card" + (drug.source === "fallback" ? " drug-card-error" : "");
  card.innerHTML = `
    <div class="drug-card-header" style="cursor: pointer;">
      <h3 class="drug-title" style="display: flex; justify-content: space-between; align-items: center;">
        <span>${esc(drug.display)} ${sourceBadge(drug.source)}</span>
        <span class="expand-icon" style="transition: transform 0.2s; font-size: 1rem; color: var(--md-primary);">▼</span>
      </h3>
      <p class="drug-summary">${esc(drug.summary)}</p>
      ${drug.source === "fallback" ? '<button type="button" class="btn-tonal btn-sm btn-retry-inline" style="margin-top: 8px;">Tra lại</button>' : ""}
    </div>
    <div class="drug-card-details hidden" style="margin-top: 0;"></div>
  `;

  const detailsContainer = card.querySelector(".drug-card-details");
  const expandIcon = card.querySelector(".expand-icon");

  const toggleExpand = () => {
    // Collapse other cards
    list.querySelectorAll(".drug-card").forEach((otherCard) => {
      if (otherCard !== card) {
        otherCard.querySelector(".drug-card-details")?.classList.add("hidden");
        const otherIcon = otherCard.querySelector(".expand-icon");
        if (otherIcon) otherIcon.style.transform = "rotate(0deg)";
      }
    });

    const isHidden = detailsContainer.classList.contains("hidden");
    if (isHidden) {
      if (!detailsContainer.innerHTML) {
        renderDrugDetail(detailsContainer, drug, line);
      }
      detailsContainer.classList.remove("hidden");
      expandIcon.style.transform = "rotate(180deg)";
      // Scroll smoothly into view
      setTimeout(() => {
        card.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }, 100);
    } else {
      detailsContainer.classList.add("hidden");
      expandIcon.style.transform = "rotate(0deg)";
    }
  };

  card.querySelector(".drug-card-header").addEventListener("click", (e) => {
    if (e.target.classList.contains("btn-retry-inline")) {
      e.stopPropagation();
      resolveDrug(line.drug_name, { forceRetry: true }).then((d) => {
        renderDrugCards();
      });
      return;
    }
    toggleExpand();
  });

  list.appendChild(card);

  if (autoExpand) {
    toggleExpand();
  }
}

async function renderDrugCards() {
  const list = $("drug-list");
  const detail = $("drug-detail");
  const banner = $("drug-api-banner");
  list.innerHTML = "";
  if (detail) detail.innerHTML = "";

  if (!state.rxLines.length) {
    list.innerHTML = '<div class="surface-card drug-body">Quét đơn để xem thẻ thuốc</div>';
    return;
  }

  const apiOk = await checkDrugApi();
  if (banner) {
    banner.classList.toggle("hidden", apiOk);
    if (!apiOk) {
      banner.textContent =
        "Tra AI cần Node server: cd prototype/server → npm start (không dùng npx serve). Thuốc có trong thư viện vẫn hiện.";
    }
  }

  list.innerHTML = '<div class="drug-loading">Đang tra thuốc…</div>';

  const unique = [];
  const seen = new Set();
  for (const line of state.rxLines) {
    const name = line.drug_name?.trim();
    if (!name || seen.has(name)) continue;
    seen.add(name);
    unique.push(line);
  }

  const names = unique.map((l) => l.drug_name);
  try {
    await fetchDrugsBatchAI(names);
  } catch (e) {
    console.warn("Batch:", e);
  }

  const resolved = await Promise.all(
    unique.map(async (line) => ({
      line,
      drug: await resolveDrug(line.drug_name),
    }))
  );

  list.innerHTML = "";
  const autoExpand = resolved.length === 1;
  resolved.forEach(({ line, drug }) => mountDrugCard(list, line, drug, autoExpand));
}

function showNotif(body, title = "MediLịch") {
  const toast = $("notif-toast");
  $("notif-body").textContent = body;
  toast.querySelector(".notif-title").textContent = title;
  toast.classList.remove("hidden");
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 4000);
}

function mockNotif() {
  const next = getNextReminder(state.schedule, state.takenIds);
  if (next) {
    showNotif(`Đến giờ uống ${next.drug_name} — ${next.dose}`, "🔔 Nhắc uống thuốc");
  } else {
    showNotif("Đến giờ uống Paracetamol 500mg — 1 viên", "🔔 Nhắc uống thuốc (demo)");
  }
}

// ——— Init ———

async function init() {
  await loadDrugDb();
  updateStatusBarTime();
  setInterval(updateStatusBarTime, 30000);

  const health = await fetchHealth();
  const pill = $("status-pill");
  if (health?.server === "medilich-node" && health?.openai) {
    pill.textContent = health.vietocr ? "AI+VietOCR" : "AI OK";
    pill.classList.add("ok");
  } else if (health?.openai) {
    pill.textContent = "API?";
    pill.classList.add("warn");
  } else {
    pill.textContent = "Chỉ demo";
    pill.classList.add("warn");
  }

  document.querySelectorAll("[data-mode-tab]").forEach((tab) => {
    tab.addEventListener("click", () => setInputMode(tab.dataset.modeTab));
  });

  const drop = $("drop-zone");
  const fileInput = $("file-input");
  drop.addEventListener("click", () => fileInput.click());
  fileInput.addEventListener("change", () => {
    const f = fileInput.files?.[0];
    if (f) updatePreview(f);
  });

  $("btn-analyze").addEventListener("click", onAnalyze);
  $("btn-analyze-demo").addEventListener("click", () => onAnalyze());
  $("btn-save-sync").addEventListener("click", onSaveAndSync);
  $("scan-back").addEventListener("click", () => setScanStep(1));

  document.querySelectorAll(".nav-item").forEach((n) => {
    n.addEventListener("click", () => setMainTab(n.dataset.tab));
  });

  $("btn-scan-fab-nav").addEventListener("click", () => {
    showFlow("scan");
    setScanStep(1);
  });

  $("cal-prev").addEventListener("click", () => {
    state.calMonth--;
    if (state.calMonth < 0) {
      state.calMonth = 11;
      state.calYear--;
    }
    renderCalendar();
  });
  $("cal-next").addEventListener("click", () => {
    state.calMonth++;
    if (state.calMonth > 11) {
      state.calMonth = 0;
      state.calYear++;
    }
    renderCalendar();
  });

  $("btn-open-sync").addEventListener("click", () => openSyncSheet(state.selectedDate));
  $("sheet-close").addEventListener("click", closeSyncSheet);
  $("sheet-backdrop").addEventListener("click", closeSyncSheet);

  $("btn-mark-taken").addEventListener("click", onMarkTaken);
  $("btn-snooze").addEventListener("click", () =>
    showNotif("Sẽ nhắc lại sau 10 phút", "Tạm hoãn")
  );
  $("btn-mock-notif").addEventListener("click", mockNotif);

  if (loadState()) {
    showFlow("main");
    setMainTab("home");
    prefetchDrugInfo();
  } else {
    showFlow("scan");
    setScanStep(1);
    setInputMode("upload");
  }
}

init();
