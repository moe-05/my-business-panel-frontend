import { useEffect, useState } from "react";

import { customerApi } from "@/api/customer.api";
import type { CustomerDetail } from "@/interfaces/entities/CustomerDetail.interface";

export interface UseCustomerLoyaltyResult {
  customerDetail: CustomerDetail | null;
  availablePoints: number;
  pointsRate: number;
  loyaltyActive: boolean;
}

// El programa de fidelidad se define en USD (FNZ-FI-01): la tasa de canje del
// programa son puntos por cada USD. El POS calcula los montos en bolivares
// (moneda base del carrito), asi que la tasa se expresa por bolivar dividiendo
// entre la tasa USD -> VES vigente; el resto del flujo (puntos = monto * tasa,
// monto = puntos / tasa) no cambia. Sin tasa vigente no se puede canjear.
export function useCustomerLoyalty(
  customerId: string | undefined,
  usdToVesRate: number,
): UseCustomerLoyaltyResult {
  const [customerDetail, setCustomerDetail] = useState<CustomerDetail | null>(
    null,
  );

  useEffect(() => {
    if (!customerId) {
      setCustomerDetail(null);
      return;
    }
    let cancelled = false;
    customerApi
      .getDetail(customerId)
      .then((detail) => {
        if (!cancelled) setCustomerDetail(detail);
      })
      .catch(() => {
        if (!cancelled) setCustomerDetail(null);
      });
    return () => {
      cancelled = true;
    };
  }, [customerId]);

  const availablePoints = customerDetail?.loyalty_score ?? 0;
  const pointsPerUsd = customerDetail?.points_redeemed_per_currency_unit ?? 0;
  const pointsRate =
    pointsPerUsd > 0 && usdToVesRate > 0 ? pointsPerUsd / usdToVesRate : 0;
  const loyaltyActive = !!(
    customerDetail?.loyalty_program_active &&
    pointsRate > 0 &&
    availablePoints > 0
  );

  return { customerDetail, availablePoints, pointsRate, loyaltyActive };
}
