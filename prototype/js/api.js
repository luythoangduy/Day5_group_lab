const API_BASE = "";

export async function fetchHealth() {
  try {
    const res = await fetch(`${API_BASE}/api/health`);
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function parseRxImage(file) {
  const fd = new FormData();
  fd.append("image", file, file.name || "prescription.jpg");

  const res = await fetch(`${API_BASE}/api/parse-rx`, {
    method: "POST",
    body: fd,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Lỗi server (${res.status})`);
  }
  return data;
}

export async function fetchDrugInfo(drugName) {
  const res = await fetch(`${API_BASE}/api/drug-info`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ drug_name: drugName }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Lỗi tra thuốc (${res.status})`);
  return data;
}
