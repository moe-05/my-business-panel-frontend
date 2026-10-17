import { describe, expect, it } from "vitest";
import { computeProfitability } from "./profitability";
import { USD_CURRENCY_ID, VES_CURRENCY_ID } from "@/utils/currency";
import type { ProfitabilityRawData } from "@/interfaces/entities/Profitability.interface";

const B1 = "branch-1";
const B2 = "branch-2";
const DAY = "2026-10-01T00:00:00";

// Tasa 50: cada monto llega en USD y en VES (FNZ-X-02).
const usdVes = (usd: number) => ({
  usd: String(usd),
  ves: String(usd * 50),
});

function raw(partial: Partial<ProfitabilityRawData>): ProfitabilityRawData {
  return {
    interval: "30d",
    range_start: "2026-09-01T00:00:00Z",
    bucket_unit: "day",
    branches: [
      { branch_id: B1, branch_name: "Principal" },
      { branch_id: B2, branch_name: "Norte" },
    ],
    sales: [],
    returns: [],
    expenses: [],
    expense_categories: [],
    payroll: [],
    notes: [],
    ...partial,
  };
}

function sale(branch: string, net: number, cogs: number, discounts = 0) {
  return {
    branch_id: branch,
    bucket_start: DAY,
    net_sales_usd: usdVes(net).usd,
    net_sales_ves: usdVes(net).ves,
    discounts_usd: usdVes(discounts).usd,
    discounts_ves: usdVes(discounts).ves,
    cogs_usd: usdVes(cogs).usd,
    cogs_ves: usdVes(cogs).ves,
  };
}

describe("computeProfitability", () => {
  it("VN = ventas - devoluciones + notas; UB descuenta costo neto de lo devuelto", () => {
    const result = computeProfitability(
      raw({
        sales: [sale(B1, 1000, 600)],
        returns: [
          {
            branch_id: B1,
            bucket_start: DAY,
            returns_usd: "100",
            returns_ves: "5000",
            returns_cogs_usd: "60",
            returns_cogs_ves: "3000",
          },
        ],
        // Una nota de credito (-50) y una de debito (+20).
        notes: [
          { branch_id: B1, bucket_start: DAY, notes_usd: "-30", notes_ves: "-1500" },
        ],
      }),
      USD_CURRENCY_ID,
    );
    const g = result.general;
    expect(g.total_vn).toBe(1000 - 100 - 30);
    // UB = (1000 - 600) - (100 - 60) + (-30) = 330
    expect(g.total_ub).toBe(330);
  });

  it("gastos y nomina bajan la utilidad neta; la nomina se informa aparte", () => {
    const result = computeProfitability(
      raw({
        sales: [sale(B1, 1000, 400)],
        expenses: [
          { branch_id: B1, bucket_start: DAY, amount_usd: "100", amount_ves: "5000" },
        ],
        payroll: [
          { branch_id: B1, bucket_start: DAY, amount_usd: "150", amount_ves: "7500" },
        ],
      }),
      USD_CURRENCY_ID,
    );
    expect(result.general.total_ub).toBe(600);
    expect(result.general.total_payroll).toBe(150);
    expect(result.general.total_un).toBe(600 - 100 - 150);
  });

  it("elige la columna de la moneda destino (no reconvierte)", () => {
    const data = raw({ sales: [sale(B1, 10, 4)] });
    expect(computeProfitability(data, USD_CURRENCY_ID).general.total_vn).toBe(10);
    expect(computeProfitability(data, VES_CURRENCY_ID).general.total_vn).toBe(500);
  });

  it("margenes: porcentaje sobre VN y 0 si no hay ventas netas", () => {
    const withSales = computeProfitability(
      raw({ sales: [sale(B1, 200, 50)] }),
      USD_CURRENCY_ID,
    );
    expect(withSales.general.points[0].mb_pct).toBe(75);
    expect(withSales.general.points[0].mn_pct).toBe(75);

    const onlyExpense = computeProfitability(
      raw({
        expenses: [
          { branch_id: B1, bucket_start: DAY, amount_usd: "40", amount_ves: "2000" },
        ],
      }),
      USD_CURRENCY_ID,
    );
    expect(onlyExpense.general.points[0].mn_pct).toBe(0);
    expect(onlyExpense.general.total_un).toBe(-40);
  });

  it("una venta sin costo no puede dar margen mayor a 100", () => {
    const r = computeProfitability(raw({ sales: [sale(B1, 100, 0)] }), USD_CURRENCY_ID);
    expect(r.general.points[0].mb_pct).toBe(100);
  });

  it("incluye sucursales sin movimiento con serie vacia", () => {
    const r = computeProfitability(raw({ sales: [sale(B1, 100, 40)] }), USD_CURRENCY_ID);
    const norte = r.branches.find((b) => b.branch_id === B2)!;
    expect(norte.points).toEqual([]);
    expect(norte.total_un).toBe(0);
  });

  it("el aporte de cada sucursal suma 100 % con utilidad positiva", () => {
    const r = computeProfitability(
      raw({ sales: [sale(B1, 300, 100), sale(B2, 100, 0)] }),
      USD_CURRENCY_ID,
    );
    const total = r.branches.reduce((s, b) => s + b.contribution_pct, 0);
    expect(total).toBeCloseTo(100, 10);
    expect(r.branches.find((b) => b.branch_id === B1)!.contribution_pct).toBeCloseTo(
      (200 / 300) * 100,
      10,
    );
  });

  it("FNZ-RT-06: con utilidad consolidada negativa una sucursal con ganancia no aporta negativo", () => {
    // B1 gana 100; el gasto de B2 (-300) deja la consolidada en -200.
    const r = computeProfitability(
      raw({
        sales: [sale(B1, 100, 0)],
        expenses: [
          { branch_id: B2, bucket_start: DAY, amount_usd: "300", amount_ves: "15000" },
        ],
      }),
      USD_CURRENCY_ID,
    );
    expect(r.general.total_un).toBe(-200);
    expect(r.branches.find((b) => b.branch_id === B1)!.contribution_pct).toBe(50);
    expect(r.branches.find((b) => b.branch_id === B2)!.contribution_pct).toBe(-150);
  });

  it("desglose de gastos por categoria, mayor primero, 'Sin categoria' para null", () => {
    const r = computeProfitability(
      raw({
        expense_categories: [
          { branch_id: B1, bucket_start: DAY, category_id: "c1", category_name: "Alquiler", amount_usd: "300", amount_ves: "15000" },
          { branch_id: B1, bucket_start: DAY, category_id: null, category_name: null, amount_usd: "500", amount_ves: "25000" },
          { branch_id: B1, bucket_start: "2026-10-02T00:00:00", category_id: "c1", category_name: "Alquiler", amount_usd: "50", amount_ves: "2500" },
        ],
      }),
      USD_CURRENCY_ID,
    );
    expect(r.general.expense_breakdown).toEqual([
      { category_id: null, category_name: "Sin categoria", amount: 500 },
      { category_id: "c1", category_name: "Alquiler", amount: 350 },
    ]);
  });

  it("acumula varios movimientos del mismo dia y ordena los puntos por fecha", () => {
    const r = computeProfitability(
      raw({
        sales: [
          { ...sale(B1, 100, 0), bucket_start: "2026-10-02T00:00:00" },
          sale(B1, 40, 0),
          sale(B1, 60, 0),
        ],
      }),
      USD_CURRENCY_ID,
    );
    expect(r.general.points.map((p) => p.vn)).toEqual([100, 100]);
    expect(r.general.points[0].bucket_start < r.general.points[1].bucket_start).toBe(true);
  });

  it("tolera respuestas sin nomina ni notas (backends anteriores)", () => {
    const data = raw({ sales: [sale(B1, 100, 20)] }) as Partial<ProfitabilityRawData>;
    delete data.payroll;
    delete data.notes;
    const r = computeProfitability(data as ProfitabilityRawData, USD_CURRENCY_ID);
    expect(r.general.total_un).toBe(80);
  });
});
