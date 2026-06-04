import { fetchNearbyPlaces, fetchPharmacyHint } from "./api.js";

function escapeHtml(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escapeAttr(s) {
  return String(s ?? "").replace(/"/g, "&quot;");
}

export function getUserPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Trình duyệt không hỗ trợ định vị"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        }),
      (err) => reject(new Error(err.message || "Không lấy được vị trí")),
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 }
    );
  });
}

function formatDistance(m) {
  if (m < 1000) return `${m} m`;
  return `${(m / 1000).toFixed(1)} km`;
}

function renderPlaceRow(p) {
  const addr = p.address ? `<p class="nearby-addr">${escapeHtml(p.address)}</p>` : "";
  const phone = p.phone
    ? `<a href="tel:${escapeAttr(p.phone)}" class="nearby-phone">${escapeHtml(p.phone)}</a>`
    : "";
  return `
    <li class="nearby-row">
      <div class="nearby-row-head">
        <strong>${escapeHtml(p.name)}</strong>
        <span class="nearby-dist">${formatDistance(p.distance_m)}</span>
      </div>
      <span class="nearby-type">${escapeHtml(p.type_label)}</span>
      ${addr}
      ${phone}
      <a href="${escapeAttr(p.maps_url)}" target="_blank" rel="noopener noreferrer" class="btn-tonal btn-sm nearby-maps">
        Chỉ đường
      </a>
    </li>`;
}

function renderHintBlock(hint) {
  if (!hint) return "";
  const asks = (hint.ask_pharmacist || [])
    .map((q) => `<li>${escapeHtml(q)}</li>`)
    .join("");
  return `
    <div class="nearby-ai-hint surface-inset">
      <p class="label-sm">Gợi ý AI khi mua thuốc</p>
      <p class="body-sm">${escapeHtml(hint.disclaimer || "")}</p>
      ${hint.buying_tips ? `<p class="body-sm"><strong>Lưu ý:</strong> ${escapeHtml(hint.buying_tips)}</p>` : ""}
      ${asks ? `<p class="label-sm">Nên hỏi dược sĩ:</p><ul class="hint-asks">${asks}</ul>` : ""}
      ${hint.hospital_note ? `<p class="body-sm muted">${escapeHtml(hint.hospital_note)}</p>` : ""}
    </div>`;
}

/**
 * Gắn khối "Mua gần đây" vào container (trong drug-detail)
 */
export async function mountNearbyBuySection(container, drug, line) {
  const drugName = line?.drug_name || drug?.display || "";
  const display = drug?.display || drugName;

  const section = document.createElement("section");
  section.className = "drug-nearby";
  section.innerHTML = `
    <h4 class="label-sm">Mua / nhận thuốc gần bạn</h4>
    <p class="body-sm muted">Bản đồ công cộng — không xác nhận còn hàng. Gọi trước khi đi.</p>
    <button type="button" class="btn-filled full btn-nearby-find">Tìm nhà thuốc & bệnh viện gần</button>
    <div class="nearby-results hidden"></div>
  `;
  container.appendChild(section);

  const btn = section.querySelector(".btn-nearby-find");
  const results = section.querySelector(".nearby-results");

  btn.addEventListener("click", async () => {
    btn.disabled = true;
    btn.textContent = "Đang định vị…";
    results.classList.remove("hidden");
    results.innerHTML = '<p class="drug-loading">Đang tải…</p>';

    let lat;
    let lng;
    try {
      ({ lat, lng } = await getUserPosition());
      btn.textContent = "Đang tìm địa điểm…";

      const [placesRes, hint] = await Promise.all([
        fetchNearbyPlaces(lat, lng),
        fetchPharmacyHint(drugName, display).catch(() => null),
      ]);

      const places = placesRes.places || [];
      const mapsQ = hint?.maps_search_query || `nhà thuốc ${display}`;
      const mapsSearch = `https://www.google.com/maps/search/${encodeURIComponent(mapsQ)}/@${lat},${lng},14z`;

      let listHtml = "";
      if (!places.length) {
        listHtml =
          '<p class="body-sm">Không tìm thấy nhà thuốc trong bán kính — thử Maps bên dưới.</p>';
      } else {
        listHtml = `<ul class="nearby-list">${places.map(renderPlaceRow).join("")}</ul>`;
      }

      results.innerHTML = `
        ${renderHintBlock(hint)}
        ${listHtml}
        <a href="${escapeAttr(mapsSearch)}" target="_blank" rel="noopener noreferrer" class="btn-tonal full nearby-maps-all">
          Mở Google Maps — "${escapeHtml(mapsQ)}"
        </a>
      `;
      btn.textContent = "Tìm lại";
      btn.disabled = false;
    } catch (e) {
      const is406 = String(e.message).includes("406");
      const extra = is406
        ? '<p class="body-sm">Overpass (OSM) chặn script không gửi tên app — đã sửa User-Agent trên server; <strong>khởi động lại npm start</strong> rồi Thử lại.</p>'
        : '<p class="body-sm">Cho phép quyền vị trí hoặc dùng Maps bên dưới.</p>';
      const mapsFallback =
        lat != null && lng != null
          ? `https://www.google.com/maps/search/nhà+thuốc/@${lat},${lng},14z`
          : `https://www.google.com/maps/search/nhà+thuốc+${encodeURIComponent(display)}`;
      results.innerHTML = `<p class="banner banner-error">${escapeHtml(e.message)}</p>
        ${extra}
        <a href="${escapeAttr(mapsFallback)}" target="_blank" rel="noopener noreferrer" class="btn-tonal full">Mở Google Maps — nhà thuốc</a>`;
      btn.textContent = "Thử lại";
      btn.disabled = false;
    }
  });
}
