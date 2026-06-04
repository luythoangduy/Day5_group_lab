/** Hiển thị trích dẫn — chỉ nguồn tra cứu thật */

export function renderCitationsHtml(citations, { loading = false } = {}) {
  if (loading) {
    return `
      <section class="drug-citations">
        <h4 class="label-sm">Nguồn tham khảo</h4>
        <p class="cite-disclaimer body-sm">Đang tra nguồn Vinmec…</p>
      </section>`;
  }

  if (!citations?.length) {
    return `
      <section class="drug-citations drug-citations-empty">
        <h4 class="label-sm">Nguồn tham khảo</h4>
        <p class="cite-disclaimer body-sm">
          Chưa tìm thấy bài viết Vinmec khớp tên này.
          Hỏi dược sĩ hoặc bác sĩ kê đơn.
        </p>
      </section>`;
  }

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
      <h4 class="label-sm">Nguồn tham khảo Vinmec</h4>
      <p class="cite-disclaimer body-sm">
        Chỉ hiển thị bài viết hoặc trang thuốc tìm thấy trên vinmec.com.
      </p>
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
