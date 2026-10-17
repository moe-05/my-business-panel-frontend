import { describe, expect, it } from "vitest";
import { buildIvaSummary, ivaPeriodRange } from "./fnzIva";
import { USD_CURRENCY_ID, VES_CURRENCY_ID } from "@/utils/currency";
import type {
  IvaComponent,
  IvaSummaryRaw,
} from "@/interfaces/entities/FnzIva.interface";

// Tasa 50 USD -> VES; cada componente llega en ambas monedas.
const component = (name: IvaComponent, usd: number) => ({
  component: name,
  total_usd: usd,
  total_ves: usd * 50,
});

const RAW: IvaSummaryRaw = {
  components: [
    component("debito", 160),
    component("notas_debito", 8),
    component("notas_credito", 16),
    component("credito", 40),
    component("cxp", 24),
    component("gastos", 6),
    component("retenciones", 30),
  ],
};

describe("buildIvaSummary", () => {
  it("deriva debito ajustado, recuperable y neto", () => {
    const s = buildIvaSummary(RAW, USD_CURRENCY_ID);
    // debito ajustado = 160 + 8 - 16 = 152 ; recuperable = 40 + 24 + 6 = 70
    expect(s.iva_debito_ajustado).toBe(152);
    expect(s.iva_recuperable).toBe(70);
    expect(s.iva_neto).toBe(82);
  });

  it("FNZ-IV-06: las retenciones se informan pero no entran al neto", () => {
    const s = buildIvaSummary(RAW, USD_CURRENCY_ID);
    expect(s.iva_retenido).toBe(30);
    const sinRetenciones = buildIvaSummary(
      { components: RAW.components.filter((c) => c.component !== "retenciones") },
      USD_CURRENCY_ID,
    );
    expect(sinRetenciones.iva_neto).toBe(s.iva_neto);
  });

  it("elige la columna de la moneda sin reconvertir", () => {
    const s = buildIvaSummary(RAW, VES_CURRENCY_ID);
    expect(s.iva_neto).toBe(82 * 50);
    expect(s.iva_retenido).toBe(30 * 50);
  });

  it("saldo a favor: neto negativo cuando el credito supera al debito", () => {
    const s = buildIvaSummary(
      { components: [component("debito", 10), component("credito", 25)] },
      USD_CURRENCY_ID,
    );
    expect(s.iva_neto).toBe(-15);
  });

  it("ignora componentes desconocidos y tolera una respuesta vacia", () => {
    const s = buildIvaSummary(
      { components: [{ component: "otro" as IvaComponent, total_usd: 99, total_ves: 99 }] },
      USD_CURRENCY_ID,
    );
    expect(s.iva_neto).toBe(0);
    expect(buildIvaSummary({ components: [] }, USD_CURRENCY_ID).iva_retenido).toBe(0);
  });
});

describe("ivaPeriodRange (FNZ-IV-04)", () => {
  // Venezuela es UTC-4 todo el año: 00:00 local = 04:00 UTC.
  it("mes completo: del dia 1 a las 00:00 al ultimo dia a las 23:59:59.999 (hora local)", () => {
    expect(ivaPeriodRange("2026-10", "full")).toEqual({
      start: "2026-10-01T04:00:00.000Z",
      end: "2026-11-01T03:59:59.999Z",
    });
  });

  it("primera quincena: 1 al 15", () => {
    expect(ivaPeriodRange("2026-10", "first")).toEqual({
      start: "2026-10-01T04:00:00.000Z",
      end: "2026-10-16T03:59:59.999Z",
    });
  });

  it("segunda quincena: 16 al ultimo dia", () => {
    expect(ivaPeriodRange("2026-10", "second")).toEqual({
      start: "2026-10-16T04:00:00.000Z",
      end: "2026-11-01T03:59:59.999Z",
    });
  });

  it("febrero respeta el ultimo dia (año no bisiesto y bisiesto)", () => {
    expect(ivaPeriodRange("2026-02", "full").end).toBe("2026-03-01T03:59:59.999Z");
    expect(ivaPeriodRange("2028-02", "full").end).toBe("2028-03-01T03:59:59.999Z");
  });

  it("diciembre cruza al año siguiente", () => {
    expect(ivaPeriodRange("2026-12", "full").end).toBe("2027-01-01T03:59:59.999Z");
  });
});
