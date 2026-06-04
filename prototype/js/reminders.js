/** Nhắc uống thuốc — logic thuần, không SDK native */

export function getTodayIso() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

export function parseTimeToMinutes(timeStr) {
  const [h, m] = (timeStr || "08:00").split(":").map(Number);
  return h * 60 + (m || 0);
}

export function getNowMinutes() {
  const d = new Date();
  return d.getHours() * 60 + d.getMinutes();
}

/** Sự kiện hôm nay, sắp theo giờ */
export function getTodayEvents(schedule) {
  const today = getTodayIso();
  return schedule
    .filter((e) => e.date === today)
    .sort((a, b) => parseTimeToMinutes(a.time) - parseTimeToMinutes(b.time));
}

export function getNextReminder(schedule, takenIds = new Set()) {
  const today = getTodayIso();
  const now = getNowMinutes();
  const upcoming = schedule
    .filter((e) => {
      const id = eventId(e);
      if (takenIds.has(id)) return false;
      if (e.date < today) return false;
      if (e.date === today && parseTimeToMinutes(e.time) < now - 30) return false;
      return true;
    })
    .sort((a, b) => {
      const da = a.date.localeCompare(b.date);
      if (da !== 0) return da;
      return parseTimeToMinutes(a.time) - parseTimeToMinutes(b.time);
    });
  return upcoming[0] || null;
}

export function eventId(e) {
  return `${e.date}|${e.time}|${e.drug_name}`;
}

export function minutesUntil(timeStr, dateIso = getTodayIso()) {
  const today = getTodayIso();
  if (dateIso !== today) {
    const d1 = new Date(today);
    const d2 = new Date(dateIso);
    const dayDiff = Math.round((d2 - d1) / 86400000);
    return dayDiff * 1440 + parseTimeToMinutes(timeStr) - getNowMinutes();
  }
  return parseTimeToMinutes(timeStr) - getNowMinutes();
}

export function formatCountdown(mins) {
  if (mins <= 0) return "Đến giờ uống";
  if (mins < 60) return `Còn ${mins} phút`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `Còn ${h}g ${m}p` : `Còn ${h} giờ`;
}
