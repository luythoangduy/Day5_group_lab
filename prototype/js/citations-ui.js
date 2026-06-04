/** Hiển thị trích dẫn nguồn — URL từ server / thư viện local */

export function renderCitationsHtml(citations) {
  if (!citations?.length) return "";

  const items = citations
    .map((c) => {
      const url = c.url || "#";
      const excerpt = c.excerpt
        ? `<span class="cite-excerpt">${escapeHtml(c.excerpt)}</span>`
        : "";
      const typeLabel =
        c.type === "official"
          ? "Chính thức"
          : c.type === "research"
            ? "Nghiên cứu"
            : c.type === "database"
              ? "Cơ sở dữ liệu"
              : "Tham khảo";
      return `
        <li class="cite-item">
          <a href="${escapeAttr(url)}" target="_blank" rel="noopener noreferrer" class="cite-link">
            ${escapeHtml(c.title || "Nguồn")}
          </a>
          <span class="cite-type">${typeLabel}</span>
          ${excerpt}
        </li>`;
    })
    .join("");

  return `
    <section class="drug-citations">
      <h4 class="label-sm">Nguồn tham khảo</h4>
      <p class="cite-disclaimer body-sm">Mô tả có căn cứ từ các nguồn dưới — không thay tư vấn bác sĩ.</p>
      <ul class="cite-list">${items}</ul>
    </section>`;
}

function escapeHtml(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escapeAttr(s) {
  return String(s ?? "").replace(/"/g, "&quot;");
}
