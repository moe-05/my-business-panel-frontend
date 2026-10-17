import type { ExchangeRate } from "@/interfaces/entities/ExchangeRate.interface";

/**
 * Conversion de moneda unica del sistema (bimonetario USD/VES).
 *
 * El USD es la moneda de referencia (catalogo, costos, CxP); el bolivar es la
 * moneda que se devalua. Existe UNA sola tasa por tenant, USD -> VES
 * (ver exchangeRateApi.getAll): 1 USD = `rate` VES. Todo monto debe llevar su
 * moneda de origen (`currency_id`) y se convierte con estas funciones; ninguna
 * pantalla debe asumir una moneda base propia.
 */

// IDs de general_schema.currency (seeds/catalog/general/006-insert-currencies.sql)
export const VES_CURRENCY_ID = 1;
export const USD_CURRENCY_ID = 2;

/** Tasa USD -> VES de la lista de tasas. Acepta la directa o su inversa. */
export function getUsdToVesRate(rates: ExchangeRate[]): number | null {
  const direct = rates.find(
    (r) =>
      Number(r.from_currency_id) === USD_CURRENCY_ID &&
      Number(r.to_currency_id) === VES_CURRENCY_ID &&
      Number(r.rate) > 0,
  );
  if (direct) return Number(direct.rate);
  const inverse = rates.find(
    (r) =>
      Number(r.from_currency_id) === VES_CURRENCY_ID &&
      Number(r.to_currency_id) === USD_CURRENCY_ID &&
      Number(r.rate) > 0,
  );
  if (inverse) return 1 / Number(inverse.rate);
  return null;
}

/** true si hay una tasa USD <-> VES utilizable. */
export function hasExchangeRate(rates: ExchangeRate[]): boolean {
  return getUsdToVesRate(rates) !== null;
}

/**
 * Convierte un monto entre USD y VES con la tasa vigente. Misma moneda,
 * monto vacio o monedas fuera del par USD/VES devuelven el monto sin tocar.
 * Si falta la tasa tambien devuelve el monto original (no NaN): quien necesite
 * distinguir ese caso debe consultar `hasExchangeRate` antes.
 */
export function convertCurrency(
  amount: number,
  fromCurrencyId: number,
  toCurrencyId: number,
  rates: ExchangeRate[],
): number {
  if (!amount || !Number.isFinite(amount)) return 0;
  if (fromCurrencyId === toCurrencyId) return amount;
  const rate = getUsdToVesRate(rates);
  if (rate === null) return amount;
  if (fromCurrencyId === USD_CURRENCY_ID && toCurrencyId === VES_CURRENCY_ID) {
    return amount * rate;
  }
  if (fromCurrencyId === VES_CURRENCY_ID && toCurrencyId === USD_CURRENCY_ID) {
    return amount / rate;
  }
  return amount;
}

// Formatea un monto (ya en la moneda destino) con simbolo y locale es-VE.
export function formatMoney(value: number, currencyCode: string, symbol: string): string {
  if (currencyCode === "VES") {
    return new Intl.NumberFormat("es-VE", {
      style: "currency",
      currency: "VES",
      maximumFractionDigits: 2,
    }).format(value);
  }
  return `${symbol} ${value.toLocaleString("es-VE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Monto historico ya convertido por el backend (FNZ-X-02): las respuestas de
 * Finanzas traen cada monto como `<campo>_usd` y `<campo>_ves`, convertidos
 * con la tasa de la fecha de cada movimiento. Aqui solo se elige la columna
 * de la moneda de visualizacion; no se reconvierte con la tasa de hoy.
 */
export function pickAmount(
  row: object,
  field: string,
  targetCurrencyId: number,
): number {
  const suffix = targetCurrencyId === USD_CURRENCY_ID ? "usd" : "ves";
  const value = (row as Record<string, unknown>)[`${field}_${suffix}`];
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
}
