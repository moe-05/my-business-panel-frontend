/**
 * Fechas de negocio (Venezuela, UTC-4).
 *
 * `toISOString()` devuelve la fecha en UTC: despues de las 20:00 en Caracas ya
 * es el dia siguiente, asi que un rango "hasta hoy" o una fecha por defecto
 * quedaban corridos un dia. Estas funciones calculan el dia en la zona del
 * negocio, independiente de la zona del navegador.
 */

export const BUSINESS_TZ = "America/Caracas";

const DAY_MS = 24 * 60 * 60 * 1000;

const dateFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: BUSINESS_TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** Dia (YYYY-MM-DD) de un instante en la zona del negocio. Default: hoy. */
export function businessDate(instant: Date = new Date()): string {
  return dateFormatter.format(instant);
}

/** Dia (YYYY-MM-DD) de hace `days` dias en la zona del negocio. */
export function businessDaysAgo(days: number, now: Date = new Date()): string {
  return businessDate(new Date(now.getTime() - days * DAY_MS));
}

/**
 * Parte de fecha (YYYY-MM-DD) de una columna `date` serializada por el
 * backend (puede llegar como "2026-10-15" o "2026-10-15T00:00:00.000Z").
 */
export function dateOnly(value: string): string {
  return value.slice(0, 10);
}

/** Dias enteros desde `from` hasta `to` (ambos YYYY-MM-DD); negativo si `to` ya paso. */
export function daysBetween(from: string, to: string): number {
  const a = Date.UTC(
    +from.slice(0, 4),
    +from.slice(5, 7) - 1,
    +from.slice(8, 10),
  );
  const b = Date.UTC(+to.slice(0, 4), +to.slice(5, 7) - 1, +to.slice(8, 10));
  return Math.round((b - a) / DAY_MS);
}

/** Formatea una fecha sin hora (columna `date`) sin que la zona la corra un dia. */
export function formatDateOnly(value?: string | null): string {
  if (!value) return "—";
  const d = dateOnly(value);
  return new Date(`${d}T00:00:00`).toLocaleDateString("es-VE");
}
