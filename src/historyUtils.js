const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];

export function dayKey(date) {
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${m}-${d}`;
}

export function parseDayKey(key) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function formatDay(key) {
  const date = parseDayKey(key);
  const sameYear = date.getFullYear() === new Date().getFullYear();
  const base = `${date.getMonth() + 1}月${date.getDate()}日`;
  return `${sameYear ? "" : `${date.getFullYear()}年`}${base}(${WEEKDAYS[date.getDay()]})`;
}
