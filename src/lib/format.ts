/**
 * Deterministic, locale-independent date formatting.
 * The device locale differs between the SSR render and the client, which
 * produces hydration mismatches, so every user-facing date uses these helpers.
 */

const WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const asDate = (value: Date | string | number) =>
  value instanceof Date ? value : new Date(value);

const pad = (n: number) => String(n).padStart(2, "0");

/** Friday, August 14 */
export function formatLongDate(value: Date | string | number) {
  const d = asDate(value);
  return `${WEEKDAYS[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}`;
}

/** 14 Aug 2026 */
export function formatDate(value: Date | string | number) {
  const d = asDate(value);
  return `${d.getDate()} ${MONTHS[d.getMonth()]!.slice(0, 3)} ${d.getFullYear()}`;
}

/** 2026-08-14 */
export function formatISODate(value: Date | string | number) {
  const d = asDate(value);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** 08:05 */
export function formatTime(value: Date | string | number) {
  const d = asDate(value);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** 14 Aug 2026 · 08:05 */
export function formatDateTime(value: Date | string | number) {
  return `${formatDate(value)} · ${formatTime(value)}`;
}

export function daysAgo(value: Date | string | number) {
  return Math.max(0, Math.round((Date.now() - asDate(value).getTime()) / 86400000));
}
