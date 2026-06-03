const SLOTS = {
  1: ["08:00"],
  2: ["08:00", "20:00"],
  3: ["08:00", "14:00", "21:00"],
  4: ["07:00", "12:00", "17:00", "22:00"],
};

export function buildSchedule(rxLines, startDate = new Date()) {
  const events = [];
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);

  for (const line of rxLines) {
    const freq = Math.min(4, Math.max(1, Number(line.frequency_per_day) || 1));
    const times = SLOTS[freq] || SLOTS[3];
    const days = Number(line.duration_days) || 7;
    const drug = matchDrugId(line.drug_name);
    const end = new Date(start);
    end.setDate(end.getDate() + days - 1);

    for (let d = 0; d < days; d++) {
      const day = new Date(start);
      day.setDate(day.getDate() + d);
      const dateStr = day.toISOString().slice(0, 10);

      for (const time of times) {
        events.push({
          date: dateStr,
          time,
          drug_name: line.drug_name,
          drug_id: drug,
          dose: line.dose_per_time,
          meal: line.meal_relation || "",
          label: `${line.drug_name} — ${line.dose_per_time}`,
        });
      }
    }
  }

  events.sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  return events;
}

function matchDrugId(name) {
  const n = (name || "").toLowerCase();
  if (n.includes("amox")) return "amoxicillin-500";
  if (n.includes("para") || n.includes("panadol")) return "paracetamol-500";
  if (n.includes("omep")) return "omeprazole-20";
  if (n.includes("vitamin") || n.includes("vit c")) return "vitamin-c-500";
  if (n.includes("ceti")) return "cetirizine-10";
  return "unknown";
}

export function groupScheduleByDate(events) {
  const map = new Map();
  for (const e of events) {
    if (!map.has(e.date)) map.set(e.date, []);
    map.get(e.date).push(e);
  }
  return map;
}
