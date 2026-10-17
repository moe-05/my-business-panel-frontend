/**
 * El dolar es la moneda de referencia del sistema (spec Venezuela): el
 * bolivar es la moneda que se devalua. El catalogo (precios y costos), las
 * compras y las cuentas por pagar se guardan en USD; las ventas y sus cuentas
 * por cobrar se guardan en la moneda de la venta (hoy bolivares). Cada monto
 * se muestra segun el toggle de moneda del header, con la otra moneda como
 * conversion en paralelo segun la tasa vigente del tenant.
 *
 * Para convertir montos que traen su propio currency_id (Finanzas) usar
 * utils/currency.ts (convertCurrency).
 */

export const formatUsd = (value: number): string =>
  `$ ${value.toLocaleString("es-VE", { minimumFractionDigits: 2 })}`;

export const formatBs = (value: number): string =>
  `Bs. ${value.toLocaleString("es-VE", { minimumFractionDigits: 2 })}`;

/** Convierte un monto en bolivares (moneda base persistida) a su
 *  equivalente en dolares usando la tasa vigente. Null si no hay tasa. */
export const bsToUsd = (
  amountBs: number,
  rate: number | null | undefined,
): number | null => {
  if (!rate || rate <= 0) return null;
  return Math.round((amountBs / rate) * 100) / 100;
};

/** Convierte un monto en dolares (moneda base de Compras/CxP, ver
 *  utils/purchase.ts BASE_CURRENCY) a su equivalente en bolivares usando la
 *  tasa vigente. Null si no hay tasa. */
export const usdToBs = (
  amountUsd: number,
  rate: number | null | undefined,
): number | null => {
  if (!rate || rate <= 0) return null;
  return Math.round(amountUsd * rate * 100) / 100;
};
