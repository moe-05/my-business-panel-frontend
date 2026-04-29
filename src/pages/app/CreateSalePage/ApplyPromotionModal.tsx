import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { Toast } from "@/components/ui/Toast";

import type {
  Promotion,
  PromotionRule,
  PromotionType,
  PromotionTypeName,
} from "@/interfaces/entities/Promotion.interface";
import type { ToastMode } from "@/interfaces/components/ui/ToastProps.interface";

import {
  calculatePromotionDiscount,
  isPromotionWithinDate,
  promotionTypeLabel,
} from "@/utils/promotion";

import { promotionApi } from "@/api/promotion.api";
import { PromotionRuleFields } from "@/pages/app/PromotionsPage/PromotionRuleFields";

export interface AppliedPromotion {
  promotionId?: string;
  promotionName?: string;
  promotionType: PromotionTypeName;
  rule: PromotionRule;
  totalDiscount: number;
  perItemDiscount: Record<string, number>;
  description: string;
}

export interface CartItemForPromo {
  id: string;
  product_variant_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface Props {
  isOpen: boolean;
  tenantId: string;
  cartItems: CartItemForPromo[];
  cartSubtotal: number;
  currencySymbol: string;
  onClose: () => void;
  onApply: (applied: AppliedPromotion) => void;
}

const formatAmount = (value: number, symbol: string) =>
  `${symbol} ${value.toLocaleString("es-CR", { minimumFractionDigits: 2 })}`;

export function ApplyPromotionModal({
  isOpen,
  tenantId,
  cartItems,
  cartSubtotal,
  currencySymbol,
  onClose,
  onApply,
}: Props) {
  const [types, setTypes] = useState<PromotionType[]>([]);
  const [activePromotions, setActivePromotions] = useState<Promotion[]>([]);
  const [selectedPromotionId, setSelectedPromotionId] = useState<string>("");
  const [selectedTypeId, setSelectedTypeId] = useState<number>(0);
  const [rule, setRule] = useState<PromotionRule>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingRule, setIsLoadingRule] = useState(false);
  const [isExistingPromo, setIsExistingPromo] = useState(false);
  const [toast, setToast] = useState<{
    mode: ToastMode;
    message: string;
  } | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;
    setIsLoading(true);

    Promise.all([
      promotionApi.getTypes().catch(() => []),
      tenantId
        ? promotionApi.getByTenant(tenantId).catch(() => [])
        : Promise.resolve<Promotion[]>([]),
    ])
      .then(([typesRes, promosRes]) => {
        if (cancelled) return;
        setTypes(typesRes);
        setActivePromotions(
          promosRes.filter(
            (p) =>
              p.is_active &&
              isPromotionWithinDate(
                p.promotion_start_date,
                p.promotion_end_date,
              ),
          ),
        );
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, tenantId]);

  useEffect(() => {
    if (!isOpen) {
      setSelectedPromotionId("");
      setSelectedTypeId(0);
      setRule({});
      setIsExistingPromo(false);
    }
  }, [isOpen]);

  const selectedType = types.find(
    (t) => t.promotion_type_id === selectedTypeId,
  );
  const selectedTypeName = (selectedType?.type_name ?? "") as
    | PromotionTypeName
    | "";

  const handleSelectExisting = async (promotionId: string) => {
    setSelectedPromotionId(promotionId);

    if (!promotionId) {
      setIsExistingPromo(false);
      setRule({});
      return;
    }

    const promo = activePromotions.find((p) => p.promotion_id === promotionId);
    if (!promo) return;

    const matchedType = types.find((t) => t.type_name === promo.type_name);
    if (matchedType) setSelectedTypeId(matchedType.promotion_type_id);

    setIsExistingPromo(true);

    if (promo.rule) {
      setRule(promo.rule);
      return;
    }

    try {
      setIsLoadingRule(true);
      const detail = await promotionApi.getInfo(promotionId);
      setRule(detail?.rule ?? {});
      if (!detail?.rule) {
        setToast({
          mode: "error",
          message: "La promoción no tiene una regla configurada",
        });
      }
    } catch (error) {
      setToast({
        mode: "error",
        message:
          error instanceof Error
            ? error.message
            : "Error al obtener la regla de la promoción",
      });
    } finally {
      setIsLoadingRule(false);
    }
  };

  const preview = useMemo(() => {
    if (!selectedTypeName) return null;
    let total = 0;
    const perItem: Record<string, number> = {};

    for (const item of cartItems) {
      const result = calculatePromotionDiscount({
        type: selectedTypeName,
        rule,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_purchase_amount: cartSubtotal,
      });
      if (result.success && result.discount_amount > 0) {
        const capped = Math.min(result.discount_amount, item.total_price);
        perItem[item.id] = Number(capped.toFixed(2));
        total += capped;
      }
    }

    return {
      total: Number(total.toFixed(2)),
      perItem,
    };
  }, [cartItems, cartSubtotal, rule, selectedTypeName]);

  const handleApply = () => {
    if (!selectedTypeName) {
      setToast({ mode: "error", message: "Seleccione un tipo de promoción" });
      return;
    }
    if (!preview || preview.total <= 0) {
      setToast({
        mode: "error",
        message:
          "La promoción no genera descuento sobre el carrito actual. Verifique los campos.",
      });
      return;
    }

    const promo = activePromotions.find(
      (p) => p.promotion_id === selectedPromotionId,
    );

    onApply({
      promotionId: selectedPromotionId || undefined,
      promotionName: promo?.promotion_name,
      promotionType: selectedTypeName,
      rule,
      totalDiscount: preview.total,
      perItemDiscount: preview.perItem,
      description: promo?.promotion_name
        ? `${promo.promotion_name} (${promotionTypeLabel(selectedTypeName)})`
        : promotionTypeLabel(selectedTypeName),
    });

    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Aplicar promoción"
      size="lg"
    >
      {toast && (
        <Toast
          mode={toast.mode}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <span className="w-6 h-6 border-2 border-gray-300 border-t-gray-700 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-5">
          {activePromotions.length > 0 && (
            <div>
              <Select
                label="Promoción existente (opcional)"
                value={selectedPromotionId}
                onChange={(e) => handleSelectExisting(e.target.value)}
                options={[
                  { value: "", label: "Aplicar promoción ad-hoc" },
                  ...activePromotions.map((p) => ({
                    value: p.promotion_id,
                    label: `${p.promotion_name} — ${promotionTypeLabel(p.type_name)}`,
                  })),
                ]}
                placeholder="Aplicar promoción ad-hoc"
              />
              <p className="mt-1 text-xs text-gray-500">
                Seleccione una promoción registrada o configure una manual al
                vuelo.
              </p>
            </div>
          )}

          <Select
            label="Tipo de promoción"
            value={String(selectedTypeId || "")}
            onChange={(e) => {
              const id = Number(e.target.value);
              setSelectedTypeId(id);
              setRule({});
              setSelectedPromotionId("");
              setIsExistingPromo(false);
            }}
            options={types.map((t) => ({
              value: t.promotion_type_id,
              label: promotionTypeLabel(t.type_name),
            }))}
            placeholder="Seleccionar tipo"
            disabled={isExistingPromo}
            required
          />

          <div className="border-t border-gray-100 pt-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
                {isExistingPromo
                  ? "Regla de la promoción seleccionada"
                  : "Campos de la promoción"}
              </p>
              {isLoadingRule && (
                <span className="w-4 h-4 border-2 border-gray-300 border-t-gray-700 rounded-full animate-spin" />
              )}
            </div>
            <PromotionRuleFields
              type={selectedTypeName}
              rule={rule}
              onChange={setRule}
              disabled={isExistingPromo}
            />
          </div>

          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
            <p className="text-xs uppercase tracking-wider text-emerald-700">
              Descuento estimado sobre el carrito
            </p>
            <p className="text-2xl font-bold text-emerald-900 mt-1">
              {formatAmount(preview?.total ?? 0, currencySymbol)}
            </p>
            {preview && preview.total === 0 && selectedTypeName && (
              <p className="text-xs text-emerald-700 mt-1">
                Ningún producto cumple los requisitos para esta promoción.
              </p>
            )}
          </div>

          <div className="flex gap-3 pt-2 border-t border-gray-100">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancelar
            </Button>
            <div className="flex-1" />
            <Button
              type="button"
              variant="primary"
              onClick={handleApply}
              disabled={!preview || preview.total <= 0}
            >
              Aplicar promoción
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
