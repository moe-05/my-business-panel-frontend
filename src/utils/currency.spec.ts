import { describe, expect, it } from "vitest";
import {
  USD_CURRENCY_ID,
  VES_CURRENCY_ID,
  convertCurrency,
  getUsdToVesRate,
  hasExchangeRate,
  pickAmount,
} from "./currency";
import type { ExchangeRate } from "@/interfaces/entities/ExchangeRate.interface";

const rate = (from: number, to: number, value: string): ExchangeRate => ({
  from_currency_id: from,
  to_currency_id: to,
  rate: value,
  effective_at: "2026-10-17T00:00:00Z",
});

const USD_VES_50 = [rate(USD_CURRENCY_ID, VES_CURRENCY_ID, "50")];

describe("getUsdToVesRate", () => {
  it("usa la tasa directa USD -> VES", () => {
    expect(getUsdToVesRate(USD_VES_50)).toBe(50);
  });

  it("deriva la tasa de su inversa VES -> USD", () => {
    expect(
      getUsdToVesRate([rate(VES_CURRENCY_ID, USD_CURRENCY_ID, "0.02")]),
    ).toBeCloseTo(50, 10);
  });

  it("prefiere la directa si estan las dos", () => {
    expect(
      getUsdToVesRate([
        rate(VES_CURRENCY_ID, USD_CURRENCY_ID, "0.5"),
        ...USD_VES_50,
      ]),
    ).toBe(50);
  });

  it("ignora tasas no positivas y devuelve null sin tasa", () => {
    expect(getUsdToVesRate([])).toBeNull();
    expect(
      getUsdToVesRate([rate(USD_CURRENCY_ID, VES_CURRENCY_ID, "0")]),
    ).toBeNull();
  });

  it("acepta ids numericos como string (llegan asi de la API)", () => {
    expect(
      getUsdToVesRate([
        {
          ...USD_VES_50[0],
          from_currency_id: "2" as unknown as number,
          to_currency_id: "1" as unknown as number,
        },
      ]),
    ).toBe(50);
  });
});

describe("hasExchangeRate", () => {
  it("distingue 'sin tasa' de una conversion identica", () => {
    expect(hasExchangeRate([])).toBe(false);
    expect(hasExchangeRate(USD_VES_50)).toBe(true);
  });
});

describe("convertCurrency (FNZ-X-01: conversion en ambos sentidos)", () => {
  it("USD a VES multiplica por la tasa", () => {
    expect(
      convertCurrency(10, USD_CURRENCY_ID, VES_CURRENCY_ID, USD_VES_50),
    ).toBe(500);
  });

  it("VES a USD divide por la tasa (antes devolvia el monto intacto)", () => {
    expect(
      convertCurrency(500, VES_CURRENCY_ID, USD_CURRENCY_ID, USD_VES_50),
    ).toBe(10);
  });

  it("ida y vuelta devuelve el monto original", () => {
    const ves = convertCurrency(37.5, USD_CURRENCY_ID, VES_CURRENCY_ID, USD_VES_50);
    expect(convertCurrency(ves, VES_CURRENCY_ID, USD_CURRENCY_ID, USD_VES_50)).toBeCloseTo(37.5, 10);
  });

  it("misma moneda no se toca", () => {
    expect(
      convertCurrency(123.45, USD_CURRENCY_ID, USD_CURRENCY_ID, USD_VES_50),
    ).toBe(123.45);
  });

  it("sin tasa devuelve el monto original, no NaN", () => {
    expect(convertCurrency(10, USD_CURRENCY_ID, VES_CURRENCY_ID, [])).toBe(10);
  });

  it("montos vacios o no finitos dan 0", () => {
    expect(convertCurrency(0, USD_CURRENCY_ID, VES_CURRENCY_ID, USD_VES_50)).toBe(0);
    expect(
      convertCurrency(Number.NaN, USD_CURRENCY_ID, VES_CURRENCY_ID, USD_VES_50),
    ).toBe(0);
    expect(
      convertCurrency(Infinity, USD_CURRENCY_ID, VES_CURRENCY_ID, USD_VES_50),
    ).toBe(0);
  });

  it("monedas fuera del par USD/VES no se convierten", () => {
    expect(convertCurrency(10, 3, VES_CURRENCY_ID, USD_VES_50)).toBe(10);
  });
});

describe("pickAmount (FNZ-X-02: el backend convierte con la tasa de la fecha)", () => {
  const row = { total_usd: "10.5", total_ves: "525" };

  it("elige la columna de la moneda destino", () => {
    expect(pickAmount(row, "total", USD_CURRENCY_ID)).toBe(10.5);
    expect(pickAmount(row, "total", VES_CURRENCY_ID)).toBe(525);
  });

  it("campo ausente, null o no numerico da 0", () => {
    expect(pickAmount({}, "total", USD_CURRENCY_ID)).toBe(0);
    expect(pickAmount({ total_usd: null }, "total", USD_CURRENCY_ID)).toBe(0);
    expect(pickAmount({ total_usd: "abc" }, "total", USD_CURRENCY_ID)).toBe(0);
  });
});
