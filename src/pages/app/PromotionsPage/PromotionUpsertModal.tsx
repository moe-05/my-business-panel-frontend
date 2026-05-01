import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";

import { productGroupApi, productGroupTypeApi } from "@/api/productGroup.api";

import type { CreatePromotionRequest } from "@/interfaces/api/requests/CreatePromotionRequest.interface";
import type {
  Promotion,
  PromotionRule,
  PromotionType,
  PromotionTypeName,
} from "@/interfaces/entities/Promotion.interface";
import type { Segment } from "@/interfaces/entities/Segment.interface";
import type {
  TenantProductGroup,
  TenantProductGroupType,
} from "@/interfaces/entities/ProductGroup.interface";

import { promotionTypeLabel } from "@/utils/promotion";
import { promotionFormSchema } from "./promotion.schema";
import { PromotionRuleFields } from "./PromotionRuleFields";

interface Props {
  isOpen: boolean;
  isEditing: boolean;
  promotion: Promotion | null;
  tenantId: string;
  promotionTypes: PromotionType[];
  segments: Segment[];
  onClose: () => void;
  onSubmit: (data: CreatePromotionRequest) => Promise<void> | void;
}

type Scope = "ALL" | "FAMILY";

const toNumberOrUndefined = (value: unknown): number | undefined => {
  if (value === null || value === undefined || value === "") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const normalizeRule = (rule?: PromotionRule | null): PromotionRule => ({
  promotion_rule_id: rule?.promotion_rule_id,
  promotion_id: rule?.promotion_id,
  discount_percentage: toNumberOrUndefined(rule?.discount_percentage),
  discount_amount: toNumberOrUndefined(rule?.discount_amount),
  buy_quantity: toNumberOrUndefined(rule?.buy_quantity),
  get_quantity: toNumberOrUndefined(rule?.get_quantity),
  get_discount_percentage: toNumberOrUndefined(rule?.get_discount_percentage),
  min_quantity: toNumberOrUndefined(rule?.min_quantity),
  max_quantity: toNumberOrUndefined(rule?.max_quantity),
  tier_level: toNumberOrUndefined(rule?.tier_level),
  tier_min_quantity: toNumberOrUndefined(rule?.tier_min_quantity),
  tier_max_quantity: toNumberOrUndefined(rule?.tier_max_quantity),
  tier_price: toNumberOrUndefined(rule?.tier_price),
  tier_discount_percentage: toNumberOrUndefined(rule?.tier_discount_percentage),
  min_purchase_amount: toNumberOrUndefined(rule?.min_purchase_amount),
});

const initialFormState = () => ({
  promotion_name: "",
  promotion_code: "",
  promotion_description: "",
  promotion_type_id: 0,
  customer_segment_id: 0,
  promotion_start_date: new Date().toISOString().split("T")[0],
  promotion_end_date: "",
  is_active: true,
  is_default: false,
  is_stackable: true,
  target_group_ids: [] as string[],
  rules: {} as PromotionRule,
});

const segmentNumericId = (
  segment: Segment & { customer_segment_id?: string | number },
): number | null => {
  const value = Number(segment.customer_segment_id ?? segment.segment_id);
  return Number.isFinite(value) ? value : null;
};

export function PromotionUpsertModal({
  isOpen,
  isEditing,
  promotion,
  tenantId,
  promotionTypes,
  segments,
  onClose,
  onSubmit,
}: Props) {
  const [form, setForm] = useState(initialFormState());
  const [scope, setScope] = useState<Scope>("ALL");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [groupTypes, setGroupTypes] = useState<TenantProductGroupType[]>([]);
  const [groups, setGroups] = useState<TenantProductGroup[]>([]);

  // Load tenant-specific groups when the modal opens.
  useEffect(() => {
    if (!isOpen || !tenantId) return;
    let cancelled = false;
    Promise.all([
      productGroupTypeApi.listByTenant(tenantId),
      productGroupApi.listByTenant(tenantId),
    ])
      .then(([types, all]) => {
        if (cancelled) return;
        setGroupTypes(types ?? []);
        setGroups(all ?? []);
      })
      .catch(() => {
        if (cancelled) return;
        setGroupTypes([]);
        setGroups([]);
      });
    return () => {
      cancelled = true;
    };
  }, [isOpen, tenantId]);

  useEffect(() => {
    if (!isOpen) return;
    if (isEditing && promotion) {
      const existingGroupIds = (promotion.targets ?? [])
        .filter((t) => t.target_type === "GROUP" && t.target_group_id)
        .map((t) => t.target_group_id as string);

      setForm({
        promotion_name: promotion.promotion_name ?? "",
        promotion_code: promotion.promotion_code ?? "",
        promotion_description: promotion.promotion_description ?? "",
        promotion_type_id: promotion.promotion_type_id ?? 0,
        customer_segment_id: promotion.customer_segment_id ?? 0,
        promotion_start_date:
          promotion.promotion_start_date?.slice(0, 10) ?? "",
        promotion_end_date: promotion.promotion_end_date?.slice(0, 10) ?? "",
        is_active: !!promotion.is_active,
        is_default: !!promotion.is_default,
        is_stackable: promotion.is_stackable !== false,
        target_group_ids: existingGroupIds,
        rules: normalizeRule(promotion.rule),
      });
      setScope(existingGroupIds.length > 0 ? "FAMILY" : "ALL");
    } else {
      setForm(initialFormState());
      setScope("ALL");
    }
    setErrors({});
  }, [isOpen, isEditing, promotion]);

  const selectedType = promotionTypes.find(
    (t) => t.promotion_type_id === form.promotion_type_id,
  );
  const selectedTypeName = (selectedType?.type_name ?? "") as
    | PromotionTypeName
    | "";

  const groupOptions = useMemo(() => {
    const typeNameById = new Map(
      groupTypes.map((t) => [t.tenant_product_group_type_id, t.type_name]),
    );
    return groups.map((g) => ({
      value: g.tenant_product_group_id,
      label: `${typeNameById.get(g.tenant_product_group_type_id) ?? "—"} · ${g.group_name}`,
    }));
  }, [groups, groupTypes]);

  const validate = (): boolean => {
    const candidate = {
      ...form,
      target_group_ids: scope === "FAMILY" ? form.target_group_ids : [],
    };
    const result = promotionFormSchema.safeParse(candidate);
    const next: Record<string, string> = {};

    if (!result.success) {
      for (const issue of result.error.issues) {
        const key = issue.path.join(".");
        if (!next[key]) next[key] = issue.message;
      }
    }

    if (scope === "FAMILY" && form.target_group_ids.length === 0) {
      next.target_group_ids =
        "Selecciona al menos una familia o cambia a 'Todos los productos'.";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const toggleGroup = (groupId: string) => {
    setForm((p) => ({
      ...p,
      target_group_ids: p.target_group_ids.includes(groupId)
        ? p.target_group_ids.filter((id) => id !== groupId)
        : [...p.target_group_ids, groupId],
    }));
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    if (!tenantId) {
      setErrors((p) => ({ ...p, _root: "No se identificó el tenant" }));
      return;
    }

    const payload: CreatePromotionRequest = {
      tenant_id: tenantId,
      promotion_name: form.promotion_name,
      promotion_code: form.promotion_code,
      promotion_description: form.promotion_description || undefined,
      promotion_type_id: form.promotion_type_id,
      customer_segment_id: form.customer_segment_id,
      promotion_start_date: form.promotion_start_date,
      promotion_end_date: form.promotion_end_date,
      is_active: form.is_active,
      is_default: form.is_default,
      is_stackable: form.is_stackable,
      rules: normalizeRule(form.rules),
      targets:
        scope === "FAMILY"
          ? form.target_group_ids.map((id) => ({
              target_type: "GROUP" as const,
              target_id: id,
            }))
          : [],
    };

    try {
      setSubmitting(true);
      await onSubmit(payload);
      onClose();
    } catch {
      // Parent component shows the toast; keep modal open for correction.
    } finally {
      setSubmitting(false);
    }
  };

  const typeOptions = promotionTypes.map((t) => ({
    value: t.promotion_type_id,
    label: promotionTypeLabel(t.type_name),
  }));

  const segmentOptions = segments
    .map((s) => {
      const id = segmentNumericId(s);
      return id == null
        ? null
        : { value: id, label: s.segment_name ?? `Segmento ${id}` };
    })
    .filter((o): o is { value: number; label: string } => o !== null);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? "Editar promoción" : "Nueva promoción"}
      size="lg"
    >
      <div className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Nombre de la promoción"
            placeholder="Ej: 20% OFF Black Friday"
            value={form.promotion_name}
            onChange={(e) =>
              setForm((p) => ({ ...p, promotion_name: e.target.value }))
            }
            error={errors.promotion_name}
            required
          />
          <Input
            label="Código"
            placeholder="Ej: BF20"
            value={form.promotion_code}
            onChange={(e) =>
              setForm((p) => ({ ...p, promotion_code: e.target.value }))
            }
            error={errors.promotion_code}
            required
          />
        </div>

        <Input
          label="Descripción"
          placeholder="Detalles internos de la promoción"
          value={form.promotion_description}
          onChange={(e) =>
            setForm((p) => ({ ...p, promotion_description: e.target.value }))
          }
          error={errors.promotion_description}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Tipo de promoción"
            value={String(form.promotion_type_id || "")}
            onChange={(e) =>
              setForm((p) => ({
                ...p,
                promotion_type_id: Number(e.target.value),
                rules: {},
              }))
            }
            options={typeOptions}
            placeholder="Seleccionar tipo"
            error={errors.promotion_type_id}
            required
          />
          <Select
            label="Segmento de cliente"
            value={String(form.customer_segment_id || "")}
            onChange={(e) =>
              setForm((p) => ({
                ...p,
                customer_segment_id: Number(e.target.value),
              }))
            }
            options={segmentOptions}
            placeholder="Seleccionar segmento"
            error={errors.customer_segment_id}
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Fecha de inicio"
            type="date"
            value={form.promotion_start_date}
            onChange={(e) =>
              setForm((p) => ({ ...p, promotion_start_date: e.target.value }))
            }
            error={errors.promotion_start_date}
            required
          />
          <Input
            label="Fecha de fin"
            type="date"
            value={form.promotion_end_date}
            onChange={(e) =>
              setForm((p) => ({ ...p, promotion_end_date: e.target.value }))
            }
            error={errors.promotion_end_date}
            required
          />
        </div>

        {/* Toggles */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 rounded-xl border border-gray-200 p-4 bg-gray-50/40">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) =>
                setForm((p) => ({ ...p, is_active: e.target.checked }))
              }
              className="mt-0.5 w-5 h-5 rounded border-gray-300 text-accent-600 focus:ring-accent-400"
            />
            <span>
              <span className="block text-sm font-medium text-gray-700">
                Activa
              </span>
              <span className="block text-xs text-gray-500">
                Disponible para aplicarse a ventas en curso.
              </span>
            </span>
          </label>

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.is_default}
              onChange={(e) =>
                setForm((p) => ({ ...p, is_default: e.target.checked }))
              }
              className="mt-0.5 w-5 h-5 rounded border-gray-300 text-accent-600 focus:ring-accent-400"
            />
            <span>
              <span className="block text-sm font-medium text-gray-700">
                Default
              </span>
              <span className="block text-xs text-gray-500">
                Se aplica automáticamente en cada venta nueva mientras esté
                activa.
              </span>
            </span>
          </label>

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.is_stackable}
              onChange={(e) =>
                setForm((p) => ({ ...p, is_stackable: e.target.checked }))
              }
              className="mt-0.5 w-5 h-5 rounded border-gray-300 text-accent-600 focus:ring-accent-400"
            />
            <span>
              <span className="block text-sm font-medium text-gray-700">
                Acumulable
              </span>
              <span className="block text-xs text-gray-500">
                Si está desactivado, no permite aplicar otras promociones
                encima.
              </span>
            </span>
          </label>
        </div>

        {/* Scope */}
        <div className="rounded-xl border border-gray-200 p-4 space-y-3">
          <p className="text-sm font-semibold text-gray-700">
            Aplicable a
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="scope"
                value="ALL"
                checked={scope === "ALL"}
                onChange={() => setScope("ALL")}
                className="text-accent-600 focus:ring-accent-400"
              />
              <span className="text-sm text-gray-700">
                Todos los productos
              </span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="scope"
                value="FAMILY"
                checked={scope === "FAMILY"}
                onChange={() => setScope("FAMILY")}
                className="text-accent-600 focus:ring-accent-400"
              />
              <span className="text-sm text-gray-700">
                Familias específicas
              </span>
            </label>
          </div>

          {scope === "FAMILY" && (
            <div className="space-y-2">
              {groupOptions.length === 0 ? (
                <p className="text-xs text-gray-500">
                  No hay familias / dimensiones registradas para este tenant.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {groupOptions.map((opt) => {
                    const selected = form.target_group_ids.includes(opt.value);
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => toggleGroup(opt.value)}
                        className={[
                          "px-3 py-1.5 text-xs rounded-full border transition-colors",
                          selected
                            ? "bg-accent-100 border-accent-500 text-accent-700 font-medium"
                            : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50",
                        ].join(" ")}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              )}
              {errors.target_group_ids && (
                <p className="text-xs text-red-500">
                  {errors.target_group_ids}
                </p>
              )}
            </div>
          )}
        </div>

        <div className="border-t border-gray-100 pt-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
            Regla del tipo {promotionTypeLabel(selectedTypeName || undefined)}
          </p>
          <PromotionRuleFields
            type={selectedTypeName}
            rule={form.rules}
            onChange={(rules) => setForm((p) => ({ ...p, rules }))}
          />
        </div>

        {errors._root && <p className="text-sm text-red-500">{errors._root}</p>}

        <div className="flex gap-3 pt-2 border-t border-gray-100">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <div className="flex-1" />
          <Button
            type="button"
            variant="primary"
            onClick={handleSubmit}
            loading={submitting}
          >
            {isEditing ? "Guardar cambios" : "Crear promoción"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
