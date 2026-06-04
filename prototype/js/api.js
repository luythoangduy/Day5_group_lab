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

export async function fetchNearbyPlaces(lat, lng, radius = 2500) {
  const q = new URLSearchParams({
    lat: String(lat),
    lng: String(lng),
    radius: String(radius),
  });
  const res = await fetch(`${API_BASE}/api/nearby?${q}`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Lỗi tìm địa điểm (${res.status})`);
  return data;
}

export async function fetchPharmacyHint(drugName, display) {
  const res = await fetch(`${API_BASE}/api/pharmacy-hint`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ drug_name: drugName, display }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Lỗi gợi ý mua (${res.status})`);
  return data;
}
