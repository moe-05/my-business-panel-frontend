import { describe, expect, it } from "vitest";
import {
  businessDate,
  businessDaysAgo,
  dateOnly,
  daysBetween,
  formatDateOnly,
} from "./businessDate";

describe("businessDate (FNZ-X-05: hora de Caracas, UTC-4)", () => {
  it("despues de las 20:00 locales sigue siendo el mismo dia (toISOString daria el siguiente)", () => {
    // 2026-10-15 23:30 en Caracas = 2026-10-16 03:30 UTC
    const instant = new Date("2026-10-16T03:30:00Z");
    expect(instant.toISOString().slice(0, 10)).toBe("2026-10-16");
    expect(businessDate(instant)).toBe("2026-10-15");
  });

  it("a las 00:00 locales ya es el dia nuevo", () => {
    expect(businessDate(new Date("2026-10-16T04:00:00Z"))).toBe("2026-10-16");
    expect(businessDate(new Date("2026-10-16T03:59:59Z"))).toBe("2026-10-15");
  });

  it("businessDaysAgo resta dias de calendario locales", () => {
    const now = new Date("2026-10-16T03:30:00Z"); // 15 de octubre, 23:30 local
    expect(businessDaysAgo(0, now)).toBe("2026-10-15");
    expect(businessDaysAgo(30, now)).toBe("2026-09-15");
  });
});

describe("fechas sin hora (columnas date)", () => {
  it("dateOnly acepta 'YYYY-MM-DD' y timestamps ISO", () => {
    expect(dateOnly("2026-10-15")).toBe("2026-10-15");
    expect(dateOnly("2026-10-15T00:00:00.000Z")).toBe("2026-10-15");
  });

  it("daysBetween cuenta dias enteros y es negativo si ya paso", () => {
    expect(daysBetween("2026-10-15", "2026-10-15")).toBe(0);
    expect(daysBetween("2026-10-15", "2026-10-20")).toBe(5);
    expect(daysBetween("2026-10-15", "2026-10-10")).toBe(-5);
    // cruza fin de mes y año
    expect(daysBetween("2026-12-30", "2027-01-02")).toBe(3);
  });

  it("formatDateOnly no corre el dia por la zona horaria y maneja vacios", () => {
    expect(formatDateOnly("2026-10-15T00:00:00.000Z")).toBe(
      new Date("2026-10-15T00:00:00").toLocaleDateString("es-VE"),
    );
    expect(formatDateOnly(null)).toBe("—");
    expect(formatDateOnly(undefined)).toBe("—");
  });
});
