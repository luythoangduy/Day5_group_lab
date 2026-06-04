/** Trích dẫn mặc định cho thuốc từ thư viện local (URL thật) */

function enc(q) {
  return encodeURIComponent(q);
}

export function defaultCitationsForDrug(drug) {
  const q = drug.display || drug.names?.[0] || "medication";
  return [
    {
      key: "drugbank",
      title: "DrugBank",
      type: "database",
      url: `https://go.drugbank.com/unearth/q?searcher=drugs&query=${enc(q)}`,
      excerpt: "Tra cứu hoạt chất và tương tác thuốc.",
    },
    {
      key: "pubmed",
      title: "PubMed (NIH)",
      type: "research",
      url: `https://pubmed.ncbi.nlm.nih.gov/?term=${enc(q)}`,
      excerpt: "Tài liệu y học có kiểm chứng.",
    },
    {
      key: "byt",
      title: "Cổng dữ liệu dược quốc gia (Bộ Y tế)",
      type: "official",
      url: "https://duocquocgia.com.vn/",
      excerpt: "Thông tin thuốc đăng ký tại Việt Nam.",
    },
  ];
}

export function withCitations(drug) {
  if (!drug) return drug;
  if (drug.citations?.length) return drug;
  return { ...drug, citations: defaultCitationsForDrug(drug) };
}
