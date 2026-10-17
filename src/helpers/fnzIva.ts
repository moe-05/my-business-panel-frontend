import { pickAmount } from "@/utils/currency";
import type {
  IvaComponent,
  IvaSummary,
  IvaSummaryRaw,
} from "@/interfaces/entities/FnzIva.interface";

/**
 * Totaliza los componentes del IVA en la moneda destino y deriva:
 *   debito ajustado = debito + notas de debito - notas de credito/devoluciones
 *   recuperable     = compras pagadas + CxP pendiente + IVA de gastos
 *   neto            = debito ajustado - recuperable
 * El backend entrega cada componente en USD y VES, convertido con la tasa de
 * la fecha de cada documento (FNZ-X-02): aqui solo se elige la columna.
 */
export function buildIvaSummary(
  raw: IvaSummaryRaw,
  targetCurrencyId: number,
): IvaSummary {
  const totals: Record<IvaComponent, number> = {
    debito: 0,
    notas_debito: 0,
    notas_credito: 0,
    credito: 0,
    cxp: 0,
    gastos: 0,
    retenciones: 0,
  };
  for (const row of raw.components) {
    if (row.component in totals) {
      totals[row.component] += pickAmount(row, "total", targetCurrencyId);
    }
  }

  const recuperable = totals.credito + totals.cxp + totals.gastos;
  const debitoAjustado =
    totals.debito + totals.notas_debito - totals.notas_credito;
  return {
    iva_debito: totals.debito,
    iva_credito: totals.credito,
    iva_cxp: totals.cxp,
    iva_recuperable: recuperable,
    iva_notas_credito: totals.notas_credito,
    iva_notas_debito: totals.notas_debito,
    iva_gastos: totals.gastos,
    iva_retenido: totals.retenciones,
    iva_debito_ajustado: debitoAjustado,
    iva_neto: debitoAjustado - recuperable,
  };
}

export type IvaPeriodHalf = "full" | "first" | "second";

/**
 * Rango de un periodo declarable de IVA (FNZ-IV-04): mes calendario o
 * quincena (1-15 / 16-fin, contribuyentes especiales), en hora de Venezuela
 * (UTC-4, sin horario de verano). Devuelve instantes ISO para el backend.
 */
export function ivaPeriodRange(
  month: string,
  half: IvaPeriodHalf,
): { start: string; end: string } {
  const [y, m] = month.split("-").map(Number);
  const lastDay = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const pad = (n: number) => String(n).padStart(2, "0");
  const firstDay = half === "second" ? 16 : 1;
  const endDay = half === "first" ? 15 : lastDay;
  const at = (day: number, time: string) =>
    new Date(`${y}-${pad(m)}-${pad(day)}T${time}-04:00`).toISOString();
  return { start: at(firstDay, "00:00:00.000"), end: at(endDay, "23:59:59.999") };
}
