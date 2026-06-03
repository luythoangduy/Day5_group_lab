import {
  loadFixture,
  validateLines,
  hasBlockingIssues,
  linesFromApiResponse,
} from "./parse.js";
import { buildSchedule, groupScheduleByDate } from "./schedule.js";
import { loadDrugDb, matchDrug } from "./drugs.js";
import { fetchHealth, parseRxImage } from "./api.js";

const state = {
  step: 1,
  rxLines: [],
  schedule: [],
  issues: [],
  uploadFile: null,
  previewUrl: null,
  meta: null,
  inputMode: "upload",
};

const panels = document.querySelectorAll(".panel");
const dots = document.querySelectorAll(".step-dot");
const btnNext = document.getElementById("btn-next");
const btnBack = document.getElementById("btn-back");
const blockAlert = document.getElementById("block-alert");
const btnAnalyze = document.getElementById("btn-analyze");
const loadingEl = document.getElementById("loading");
const statusPill = document.getElementById("status-pill");
const ocrPreview = document.getElementById("ocr-preview");

function setStep(n) {
  state.step = n;
  panels.forEach((p) => p.classList.toggle("active", Number(p.dataset.step) === n));
  dots.forEach((d) => {
    const s = Number(d.dataset.step);
    d.classList.toggle("active", s === n);
    d.classList.toggle("done", s < n);
  });
  btnBack.classList.toggle("hidden", n === 1);
  btnNext.textContent = n === 4 ? "Quay lại đầu" : n === 2 ? "Lưu lịch uống" : "Tiếp";
  if (n === 2) btnNext.disabled = hasBlockingIssues(state.issues);
  else btnNext.disabled = false;
}

function setLoading(on, msg = "Đang đọc đơn thuốc…") {
  loadingEl.classList.toggle("hidden", !on);
  loadingEl.querySelector(".loading-text").textContent = msg;
  btnAnalyze.disabled = on;
}

function setInputMode(mode) {
  state.inputMode = mode;
  document.querySelectorAll("[data-mode-panel]").forEach((el) => {
    el.classList.toggle("hidden", el.dataset.modePanel !== mode);
  });
  document.querySelectorAll("[data-mode-tab]").forEach((tab) => {
    tab.classList.toggle("active", tab.dataset.modeTab === mode);
  });
}

function updatePreview(file) {
  if (state.previewUrl) URL.revokeObjectURL(state.previewUrl);
  state.uploadFile = file;
  if (!file) {
    state.previewUrl = null;
    document.getElementById("preview-img").classList.add("hidden");
    document.getElementById("preview-placeholder").classList.remove("hidden");
    return;
  }
  state.previewUrl = URL.createObjectURL(file);
  const img = document.getElementById("preview-img");
  img.src = state.previewUrl;
  img.classList.remove("hidden");
  document.getElementById("preview-placeholder").classList.add("hidden");
}

async function init() {
  await loadDrugDb();

  const health = await fetchHealth();
  if (health?.openai) {
    const parts = [];
    if (health.vietocr) parts.push("VietOCR");
    else parts.push("OpenAI Vision");
    statusPill.textContent = `AI: ${parts.join(" + ")}`;
    statusPill.classList.add("ok");
  } else {
    statusPill.textContent = "Chưa có API — dùng demo mẫu";
    statusPill.classList.add("warn");
  }

  document.querySelectorAll("[data-mode-tab]").forEach((tab) => {
    tab.addEventListener("click", () => setInputMode(tab.dataset.modeTab));
  });

  const drop = document.getElementById("drop-zone");
  const fileInput = document.getElementById("file-input");

  drop.addEventListener("click", () => fileInput.click());
  fileInput.addEventListener("change", () => {
    const f = fileInput.files?.[0];
    if (f) updatePreview(f);
  });
  drop.addEventListener("dragover", (e) => {
    e.preventDefault();
    drop.classList.add("dragover");
  });
  drop.addEventListener("dragleave", () => drop.classList.remove("dragover"));
  drop.addEventListener("drop", (e) => {
    e.preventDefault();
    drop.classList.remove("dragover");
    const f = e.dataTransfer.files?.[0];
    if (f?.type.startsWith("image/")) updatePreview(f);
  });

  btnAnalyze.addEventListener("click", onAnalyze);
  btnNext.addEventListener("click", onNext);
  btnBack.addEventListener("click", () => setStep(Math.max(1, state.step - 1)));
  setInputMode("upload");
  setStep(1);
}

async function onAnalyze() {
  try {
    if (state.inputMode === "demo") {
      const preset = document.querySelector('input[name="preset"]:checked')?.value || "happy";
      setLoading(true, "Đang tải đơn mẫu…");
      state.rxLines = await loadFixture(preset);
      state.meta = { ocr_engine: "fixture", parse_model: preset };
    } else {
      if (!state.uploadFile) {
        alert("Chọn hoặc kéo thả ảnh đơn thuốc trước.");
        return;
      }
      setLoading(true, "OCR + AI đang phân tích…");
      const data = await parseRxImage(state.uploadFile);
      state.rxLines = linesFromApiResponse(data);
      state.meta = {
        ocr_engine: data.ocr_engine,
        parse_model: data.parse_model,
        raw_text: data.raw_text,
      };
      if (!state.rxLines.length) {
        alert("Không trích xuất được thuốc nào. Thử ảnh rõ hơn hoặc dùng đơn mẫu demo.");
        return;
      }
    }

    state.issues = validateLines(state.rxLines);
    renderReview();
    setStep(2);
  } catch (e) {
    console.error(e);
    alert(e.message || "Lỗi phân tích. Kiểm tra server/.env và chạy npm start trong server/");
  } finally {
    setLoading(false);
  }
}

function renderReview() {
  const root = document.getElementById("review-lines");
  root.innerHTML = "";
  blockAlert.classList.add("hidden");

  if (state.meta?.raw_text) {
    ocrPreview.classList.remove("hidden");
    ocrPreview.querySelector("pre").textContent = state.meta.raw_text.slice(0, 1200);
    const eng = state.meta.ocr_engine || "?";
    ocrPreview.querySelector(".ocr-meta").textContent = `Engine: ${eng} · Model: ${state.meta.parse_model || "—"}`;
  } else {
    ocrPreview.classList.add("hidden");
  }

  state.issues = validateLines(state.rxLines);
  if (hasBlockingIssues(state.issues)) {
    blockAlert.textContent = "Không thể lưu: có dòng cần sửa (ô đỏ). Kiểm tra tần suất / liều.";
    blockAlert.classList.remove("hidden");
  }

  state.rxLines.forEach((line, i) => {
    const lineIssues = state.issues.filter((x) => x.index === i);
    const isDanger = lineIssues.some((x) => x.type === "danger");
    const isWarn = lineIssues.some((x) => x.type === "warn");
    const div = document.createElement("div");
    div.className = "rx-line" + (isDanger ? " danger" : isWarn ? " warn" : "");

    let badges = "";
    lineIssues.forEach((iss) => {
      badges += `<span class="badge badge-${iss.type === "danger" ? "danger" : "warn"}">${iss.msg}</span>`;
    });

    div.innerHTML = `
      ${badges}
      <label>Tên thuốc</label>
      <input data-i="${i}" data-field="drug_name" value="${esc(line.drug_name)}" />
      <label>Liều mỗi lần</label>
      <input data-i="${i}" data-field="dose_per_time" value="${esc(line.dose_per_time)}" />
      <label>Số lần / ngày</label>
      <input type="number" min="1" max="4" data-i="${i}" data-field="frequency_per_day" value="${line.frequency_per_day}" />
      <label>Ăn uống</label>
      <input data-i="${i}" data-field="meal_relation" value="${esc(line.meal_relation)}" />
      <label>Số ngày</label>
      <input type="number" min="1" data-i="${i}" data-field="duration_days" value="${line.duration_days}" />
    `;
    root.appendChild(div);
  });

  root.querySelectorAll("input").forEach((inp) => {
    inp.addEventListener("input", onReviewEdit);
  });

  btnNext.disabled = hasBlockingIssues(state.issues);
}

function onReviewEdit(e) {
  const i = Number(e.target.dataset.i);
  const field = e.target.dataset.field;
  let val = e.target.value;
  if (field === "frequency_per_day" || field === "duration_days") val = Number(val);
  state.rxLines[i][field] = val;
  if (field === "drug_name") {
    console.log("[Correction]", val, "→", matchDrug(val)?.id);
  }
  renderReview();
}

function esc(s) {
  return String(s ?? "").replace(/"/g, "&quot;");
}

function renderSchedule() {
  state.schedule = buildSchedule(state.rxLines);
  const root = document.getElementById("schedule-list");
  root.innerHTML = "";
  const grouped = groupScheduleByDate(state.schedule);
  const dates = [...grouped.keys()].slice(0, 3);

  dates.forEach((date) => {
    const h = document.createElement("div");
    h.className = "schedule-day";
    h.textContent = formatDate(date);
    root.appendChild(h);
    grouped.get(date).forEach((ev) => {
      const row = document.createElement("div");
      row.className = "schedule-item";
      row.innerHTML = `<span class="time">${ev.time}</span><span>${ev.label}<br><small>${ev.meal}</small></span>`;
      root.appendChild(row);
    });
  });

  if (grouped.size > 3) {
    const more = document.createElement("p");
    more.className = "hint";
    more.style.marginTop = "0.5rem";
    more.textContent = `+ ${grouped.size - 3} ngày nữa trong lịch đầy đủ`;
    root.appendChild(more);
  }
}

function formatDate(iso) {
  const d = new Date(iso + "T12:00:00");
  return d.toLocaleDateString("vi-VN", { weekday: "short", day: "numeric", month: "short" });
}

function renderDrugCards() {
  const list = document.getElementById("drug-list");
  const detail = document.getElementById("drug-detail");
  list.innerHTML = "";
  detail.innerHTML = "";

  const seen = new Set();
  state.rxLines.forEach((line) => {
    const drug = matchDrug(line.drug_name);
    const id = drug?.id || "unknown";
    if (seen.has(id)) return;
    seen.add(id);

    const card = document.createElement("div");
    card.className = "card drug-card";
    card.innerHTML = `
      <h3>${drug?.display || line.drug_name}</h3>
      <p>${drug?.summary || "Chưa có trong thư viện demo"}</p>
    `;
    card.addEventListener("click", () => showDrugDetail(drug, line));
    list.appendChild(card);
  });
}

function showDrugDetail(drug, line) {
  const detail = document.getElementById("drug-detail");
  if (!drug) {
    detail.innerHTML = `<div class="card"><p>Chưa có thẻ cho <strong>${esc(line.drug_name)}</strong></p></div>`;
    return;
  }
  detail.innerHTML = `
    <div class="card drug-detail">
      <h3>${drug.display}</h3>
      <p>${drug.summary}</p>
      <h4>Cách uống</h4>
      <p>${drug.how_to_take} · ${esc(line.dose_per_time)}, ${line.frequency_per_day} lần/ngày, ${esc(line.meal_relation)}</p>
      <h4>Lưu ý</h4>
      <ul>${drug.warnings.map((w) => `<li>${w}</li>`).join("")}</ul>
    </div>
  `;
}

function onNext() {
  if (state.step === 1) return;
  if (state.step === 2) {
    if (hasBlockingIssues(validateLines(state.rxLines))) return;
    renderSchedule();
    setStep(3);
    return;
  }
  if (state.step === 3) {
    renderDrugCards();
    setStep(4);
    return;
  }
  if (state.step === 4) {
    state.rxLines = [];
    state.schedule = [];
    state.meta = null;
    updatePreview(null);
    document.querySelector('input[name="preset"][value="happy"]').checked = true;
    setStep(1);
  }
}

init();
