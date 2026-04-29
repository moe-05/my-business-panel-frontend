import type {
  PromotionRule,
  PromotionTypeName,
} from "@/interfaces/entities/Promotion.interface";

export const PROMOTION_TYPE_LABEL: Record<PromotionTypeName, string> = {
  percentage_discount: "Descuento porcentual",
  fixed_amount_discount: "Descuento fijo",
  buy_x_get_y: "Lleva X paga Y",
  volume_discount: "Descuento por volumen",
  tiered_pricing: "Precio por niveles",
  combo: "Combo",
  free_shipping: "Envío gratis",
};

export const promotionTypeLabel = (name?: string | null): string => {
  if (!name) return "—";
  return PROMOTION_TYPE_LABEL[name as PromotionTypeName] ?? name;
};

export interface PromotionDiscountInput {
  type: PromotionTypeName;
  rule: PromotionRule;
  quantity: number;
  unit_price: number;
  total_purchase_amount: number;
}

export interface PromotionDiscountResult {
  discount_amount: number;
  discount_percentage: number;
  description: string;
  success: boolean;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

export function calculatePromotionDiscount({
  type,
  rule,
  quantity,
  unit_price,
  total_purchase_amount,
}: PromotionDiscountInput): PromotionDiscountResult {
  const lineTotal = quantity * unit_price;
  const fail: PromotionDiscountResult = {
    discount_amount: 0,
    discount_percentage: 0,
    description: "Promoción no aplicable",
    success: false,
  };

  switch (type) {
    case "percentage_discount": {
      const pct = Number(rule.discount_percentage ?? 0);
      const minPurchase = Number(rule.min_purchase_amount ?? 0);
      if (pct <= 0) return fail;
      if (minPurchase > 0 && total_purchase_amount < minPurchase) return fail;
      const amount = round2(lineTotal * (pct / 100));
      return {
        discount_amount: amount,
        discount_percentage: pct,
        description: `${pct}% de descuento`,
        success: true,
      };
    }

    case "fixed_amount_discount": {
      const fixed = Number(rule.discount_amount ?? 0);
      const minPurchase = Number(rule.min_purchase_amount ?? 0);
      if (fixed <= 0) return fail;
      if (minPurchase > 0 && total_purchase_amount < minPurchase) return fail;
      const amount = Math.min(round2(fixed), round2(lineTotal));
      return {
        discount_amount: amount,
        discount_percentage: lineTotal > 0 ? round2((amount / lineTotal) * 100) : 0,
        description: `Descuento fijo de ${fixed}`,
        success: true,
      };
    }

    case "buy_x_get_y": {
      const buy = Number(rule.buy_quantity ?? 0);
      const get = Number(rule.get_quantity ?? 0);
      const getPct = Number(rule.get_discount_percentage ?? 100);
      if (buy <= 0 || get <= 0) return fail;
      const groupSize = buy + get;
      if (quantity < groupSize) return fail;
      const groups = Math.floor(quantity / groupSize);
      const freeUnits = groups * get;
      const amount = round2(freeUnits * unit_price * (getPct / 100));
      return {
        discount_amount: amount,
        discount_percentage: lineTotal > 0 ? round2((amount / lineTotal) * 100) : 0,
        description: `Lleva ${buy} paga ${get} (${getPct}%)`,
        success: amount > 0,
      };
    }

    case "volume_discount": {
      const minQty = Number(rule.min_quantity ?? 0);
      const maxQty = rule.max_quantity != null ? Number(rule.max_quantity) : null;
      const pct = Number(rule.discount_percentage ?? 0);
      if (pct <= 0 || minQty <= 0) return fail;
      if (quantity < minQty) return fail;
      if (maxQty != null && quantity > maxQty) return fail;
      const amount = round2(lineTotal * (pct / 100));
      return {
        discount_amount: amount,
        discount_percentage: pct,
        description: `${pct}% por volumen (≥ ${minQty} uds.)`,
        success: true,
      };
    }

    case "tiered_pricing": {
      const minQty = Number(rule.tier_min_quantity ?? 0);
      const maxQty =
        rule.tier_max_quantity != null ? Number(rule.tier_max_quantity) : null;
      const pct = Number(rule.tier_discount_percentage ?? 0);
      const tierPrice =
        rule.tier_price != null ? Number(rule.tier_price) : null;
      if (quantity < minQty) return fail;
      if (maxQty != null && quantity > maxQty) return fail;

      if (pct > 0) {
        const amount = round2(lineTotal * (pct / 100));
        return {
          discount_amount: amount,
          discount_percentage: pct,
          description: `Nivel ${rule.tier_level ?? ""}: ${pct}% off`,
          success: true,
        };
      }

      if (tierPrice != null && tierPrice >= 0 && tierPrice < unit_price) {
        const amount = round2((unit_price - tierPrice) * quantity);
        return {
          discount_amount: amount,
          discount_percentage:
            lineTotal > 0 ? round2((amount / lineTotal) * 100) : 0,
          description: `Nivel ${rule.tier_level ?? ""}: precio ${tierPrice}`,
          success: amount > 0,
        };
      }

      return fail;
    }

    case "combo": {
      const fixed = Number(rule.discount_amount ?? 0);
      const pct = Number(rule.discount_percentage ?? 0);
      if (pct > 0) {
        const amount = round2(total_purchase_amount * (pct / 100));
        return {
          discount_amount: amount,
          discount_percentage: pct,
          description: `Combo: ${pct}% sobre el total`,
          success: amount > 0,
        };
      }
      if (fixed > 0) {
        return {
          discount_amount: round2(fixed),
          discount_percentage: 0,
          description: `Combo: descuento fijo ${fixed}`,
          success: true,
        };
      }
      return fail;
    }

    case "free_shipping":
      return {
        discount_amount: 0,
        discount_percentage: 0,
        description: "Envío gratis (no aplica a productos)",
        success: false,
      };
  }
}

export function isPromotionWithinDate(
  startDate: string,
  endDate: string,
  reference: Date = new Date(),
): boolean {
  const start = new Date(startDate);
  const end = new Date(endDate);
  return reference >= start && reference <= end;
}
