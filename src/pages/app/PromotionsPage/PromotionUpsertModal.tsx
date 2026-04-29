import { useEffect, useState } from "react";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";

import type { CreatePromotionRequest } from "@/interfaces/api/requests/CreatePromotionRequest.interface";
import type {
  Promotion,
  PromotionRule,
  PromotionType,
  PromotionTypeName,
} from "@/interfaces/entities/Promotion.interface";
import type { Segment } from "@/interfaces/entities/Segment.interface";

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

const initialFormState = () => ({
  promotion_name: "",
  promotion_code: "",
  promotion_description: "",
  promotion_type_id: 0,
  customer_segment_id: 0,
  promotion_start_date: new Date().toISOString().split("T")[0],
  promotion_end_date: "",
  is_active: true,
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
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    if (isEditing && promotion) {
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
        rules: promotion.rule ?? {},
      });
    } else {
      setForm(initialFormState());
    }
    setErrors({});
  }, [isOpen, isEditing, promotion]);

  const selectedType = promotionTypes.find(
    (t) => t.promotion_type_id === form.promotion_type_id,
  );
  const selectedTypeName = (selectedType?.type_name ?? "") as
    | PromotionTypeName
    | "";

  const validate = (): boolean => {
    const result = promotionFormSchema.safeParse(form);
    if (result.success) {
      setErrors({});
      return true;
    }
    const next: Record<string, string> = {};
    for (const issue of result.error.issues) {
      const key = issue.path.join(".");
      if (!next[key]) next[key] = issue.message;
    }
    setErrors(next);
    return false;
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
      rules: form.rules,
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

        <label className="flex items-center gap-3 cursor-pointer w-fit">
          <input
            type="checkbox"
            checked={form.is_active}
            onChange={(e) =>
              setForm((p) => ({ ...p, is_active: e.target.checked }))
            }
            className="w-5 h-5 rounded border-gray-300 text-accent-600 focus:ring-accent-400"
          />
          <span className="text-sm font-medium text-gray-700">
            Promoción activa
          </span>
        </label>

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
