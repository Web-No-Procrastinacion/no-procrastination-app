// Utilidades de fechas basadas en "días locales" con formato YYYY-MM-DD.

export function localDayOf(date: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

function dayToUTCDate(day: string): Date {
  return new Date(`${day}T12:00:00Z`);
}

export function addDays(day: string, n: number): string {
  const d = dayToUTCDate(day);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** Lunes = 0 … Domingo = 6 */
export function weekdayIndex(day: string): number {
  return (dayToUTCDate(day).getUTCDay() + 6) % 7;
}

export function weekStart(day: string): string {
  return addDays(day, -weekdayIndex(day));
}

export function formatDayLong(day: string): string {
  return new Intl.DateTimeFormat("es-CO", {
    timeZone: "UTC",
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(dayToUTCDate(day));
}

export function formatDayShort(day: string): string {
  return new Intl.DateTimeFormat("es-CO", {
    timeZone: "UTC",
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(dayToUTCDate(day));
}

export function formatDayMedium(day: string): string {
  return new Intl.DateTimeFormat("es-CO", {
    timeZone: "UTC",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(dayToUTCDate(day));
}

export const weekdayLetters = ["L", "M", "X", "J", "V", "S", "D"] as const;
export const weekdayNames = [
  "lunes",
  "martes",
  "miércoles",
  "jueves",
  "viernes",
  "sábado",
  "domingo",
] as const;
