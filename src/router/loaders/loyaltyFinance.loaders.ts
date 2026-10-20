import { DEFAULT_LOYALTY_INTERVAL } from "@/constants/loyaltyFinance";

import type { LoyaltyOverview } from "@/interfaces/entities/LoyaltyFinance.interface";

/** Resumen vacio: valor de respaldo si el backend falla (pestana Punto de fidelidad). */
export const emptyOverview: LoyaltyOverview = {
  interval: DEFAULT_LOYALTY_INTERVAL,
  range_start: new Date().toISOString(),
  bucket_unit: "day",
  config: null,
  usd_ves_rate: null,
  totals: {
    active_points: 0,
    redeemed_points: 0,
    lifetime_points: 0,
    expired_points: 0,
    customers_with_points: 0,
    active_value_usd: 0,
    active_value_ves: 0,
    redeemed_value_usd: 0,
    redeemed_value_ves: 0,
    lifetime_value_usd: 0,
    lifetime_value_ves: 0,
    expired_value_usd: 0,
    expired_value_ves: 0,
  },
  growth: [],
  top_customers: [],
};
