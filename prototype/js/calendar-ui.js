import { groupScheduleByDate } from "./schedule.js";

export function getMonthDays(year, month) {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const startPad = (first.getDay() + 6) % 7; // Mon=0
  const days = [];
  for (let i = 0; i < startPad; i++) days.push(null);
  for (let d = 1; d <= last.getDate(); d++) {
    days.push(new Date(year, month, d));
  }
  return days;
}

export function toIso(d) {
  if (!d) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Số nhắc trong ngày từ schedule */
export function countEventsOnDate(schedule, dateIso) {
  return schedule.filter((e) => e.date === dateIso).length;
}

/** Đồng bộ: đơn (rx lines) vs lịch (events) cho một ngày */
export function buildSyncView(rxLines, schedule, dateIso) {
  const dayEvents = schedule.filter((e) => e.date === dateIso);
  const rxSummary = rxLines.map((line) => ({
    drug_name: line.drug_name,
    dose: line.dose_per_time,
    frequency: line.frequency_per_day,
    meal: line.meal_relation,
    duration_days: line.duration_days,
  }));

  return {
    date: dateIso,
    prescription: rxSummary,
    reminders: dayEvents,
    inSync: dayEvents.length > 0,
    totalReminders: dayEvents.length,
  };
}

export function renderCalendarGrid(container, year, month, schedule, selectedIso, onSelectDay) {
  const days = getMonthDays(year, month);
  const todayIso = toIso(new Date());
  const grouped = groupScheduleByDate(schedule);

  container.innerHTML = "";
  const weekdays = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
  const head = document.createElement("div");
  head.className = "cal-weekdays";
  weekdays.forEach((w) => {
    const c = document.createElement("span");
    c.textContent = w;
    head.appendChild(c);
  });
  container.appendChild(head);

  const grid = document.createElement("div");
  grid.className = "cal-grid";

  days.forEach((d) => {
    const cell = document.createElement("button");
    cell.type = "button";
    cell.className = "cal-day";
    if (!d) {
      cell.classList.add("empty");
      cell.disabled = true;
      grid.appendChild(cell);
      return;
    }
    const iso = toIso(d);
    const count = countEventsOnDate(schedule, iso);
    cell.innerHTML = `<span class="cal-num">${d.getDate()}</span>${count ? `<span class="cal-dot">${count}</span>` : ""}`;
    if (iso === todayIso) cell.classList.add("today");
    if (iso === selectedIso) cell.classList.add("selected");
    if (count) cell.classList.add("has-events");
    cell.addEventListener("click", () => onSelectDay(iso));
    grid.appendChild(cell);
  });

  container.appendChild(grid);
}
