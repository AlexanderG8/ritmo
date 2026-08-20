import { es } from "date-fns/locale";
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";

export const TIMEZONE = "America/Lima";

/**
 * Las columnas `@db.Date` se representan como Date a medianoche UTC.
 * Construirlas con `new Date(y, m, d)` (hora local) produce corrimientos de un
 * día según la zona del servidor. Siempre UTC.
 */
function utcDate(year: number, month: number, day: number): Date {
  return new Date(Date.UTC(year, month - 1, day));
}

/** El "hoy" de Lima, no el del servidor (que en Vercel es UTC). */
export function todayInLima(now: Date = new Date()): Date {
  const [y, m, d] = formatInTimeZone(now, TIMEZONE, "yyyy-MM-dd")
    .split("-")
    .map(Number);
  return utcDate(y, m, d);
}

/** Lunes y viernes de la semana a la que pertenece `date`. */
export function weekBounds(date: Date): { weekStart: Date; weekEnd: Date } {
  const day = date.getUTCDay(); // 0 domingo … 6 sábado
  const offsetToMonday = day === 0 ? -6 : 1 - day;

  const weekStart = new Date(date);
  weekStart.setUTCDate(weekStart.getUTCDate() + offsetToMonday);

  const weekEnd = new Date(weekStart);
  weekEnd.setUTCDate(weekEnd.getUTCDate() + 4); // lunes + 4 = viernes

  return { weekStart, weekEnd };
}

export function formatDate(date: Date, pattern = "d 'de' MMMM"): string {
  return formatInTimeZone(date, "UTC", pattern, { locale: es });
}

export function formatMinutes(total: number): string {
  const hours = Math.floor(total / 60);
  const minutes = total % 60;
  if (hours === 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}

/** "yyyy-MM-dd" del día de Lima al que pertenece un Date `@db.Date`. */
export function isoDay(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**
 * Convierte una hora de pared de Lima ("14:30") en el instante UTC real de
 * ese día. Sin esto, un bloque planificado a las 14:30 se guardaría como
 * 14:30 UTC, o sea 09:30 en Lima.
 */
export function limaTimeToInstant(day: Date, hhmm: string): Date {
  return fromZonedTime(`${isoDay(day)} ${hhmm}:00`, TIMEZONE);
}

/** Hora de pared en Lima de un instante. */
export function formatTime(instant: Date): string {
  return formatInTimeZone(instant, TIMEZONE, "HH:mm");
}
