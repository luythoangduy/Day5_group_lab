const FIXTURES = {
  happy: "./fixtures/sample-rx-happy.json",
  low: "./fixtures/sample-rx-low-conf.json",
  risky: "./fixtures/sample-rx-risky.json",
};

export async function loadFixture(key) {
  const url = FIXTURES[key];
  if (!url) throw new Error("Unknown fixture");
  const res = await fetch(url);
  const data = await res.json();
  return cloneLines(data.lines);
}

export function cloneLines(lines) {
  return lines.map((l) => ({
    ...l,
    confidence: { ...l.confidence },
  }));
}

/** Kháng sinh uống 1 lần/ngày trong 7 ngày — pattern bất thường cho demo */
export function validateLines(lines) {
  const issues = [];
  lines.forEach((line, i) => {
    const freq = Number(line.frequency_per_day);
    const confFreq = line.confidence?.frequency ?? 1;

    if (confFreq < 0.65) {
      issues.push({ index: i, type: "warn", field: "frequency", msg: "OCR không chắc tần suất — vui lòng kiểm tra" });
    }

    const nameLower = (line.drug_name || "").toLowerCase();
    if (nameLower.includes("amoxicillin") && freq === 1 && (line.duration_days || 7) >= 5) {
      issues.push({
        index: i,
        type: "danger",
        field: "frequency",
        msg: "Amoxicillin thường uống 2–3 lần/ngày. 1 lần/ngày có thể là lỗi đọc đơn.",
      });
    }

    if (freq < 1 || freq > 4) {
      issues.push({ index: i, type: "danger", field: "frequency", msg: "Tần suất không hợp lệ (1–4 lần/ngày)" });
    }
  });
  return issues;
}

export function hasBlockingIssues(issues) {
  return issues.some((x) => x.type === "danger");
}

/** Map API response → rx lines */
export function linesFromApiResponse(data) {
  return cloneLines(data.lines || []);
}
