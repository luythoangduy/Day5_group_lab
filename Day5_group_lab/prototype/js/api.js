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
