import { useEffect, useState } from "react";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";

import type {
  CreateHrConceptPayload,
  HrPayrollConcept,
  UpdateHrConceptPayload,
} from "@/interfaces/entities/Hr.interface";

interface ConceptUpsertModalProps {
  isOpen: boolean;
  tenantId: string;
  concept: HrPayrollConcept | null;
  onClose: () => void;
  onCreate: (payload: CreateHrConceptPayload) => Promise<void>;
  onUpdate: (
    conceptId: number,
    payload: UpdateHrConceptPayload,
  ) => Promise<void>;
}

const TYPE_OPTIONS = [
  { value: "earning", label: "Ingreso" },
  { value: "deduction", label: "Deducción" },
];

const METHOD_OPTIONS = [
  { value: "fixed", label: "Fijo" },
  { value: "percentage", label: "Porcentaje" },
  { value: "formula", label: "Fórmula" },
  { value: "manual", label: "Manual" },
];

export function ConceptUpsertModal({
  isOpen,
  tenantId,
  concept,
  onClose,
  onCreate,
  onUpdate,
}: ConceptUpsertModalProps) {
  const [name, setName] = useState("");
  const [type, setType] = useState<"earning" | "deduction">("earning");
  const [calcMethod, setCalcMethod] = useState<
    "fixed" | "percentage" | "formula" | "manual"
  >("fixed");
  const [isTaxable, setIsTaxable] = useState(true);
  const [baseValue, setBaseValue] = useState("0");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setName("");
      setType("earning");
      setCalcMethod("fixed");
      setIsTaxable(true);
      setBaseValue("0");
      setCode("");
      setError("");
      setIsSubmitting(false);
      return;
    }

    if (!concept) return;

    setName(concept.name);
    setType(concept.type);
    setCalcMethod(concept.calculation_method);
    setIsTaxable(concept.is_taxable);
    setBaseValue(String(concept.base_value));
    setCode(concept.code ?? "");
  }, [concept, isOpen]);

  const handleSubmit = async () => {
    setError("");

    if (!name.trim()) {
      setError("El nombre es requerido");
      return;
    }

    if (!Number.isFinite(Number(baseValue))) {
      setError("El valor base debe ser numérico");
      return;
    }

    setIsSubmitting(true);

    try {
      if (concept) {
        await onUpdate(concept.concept_id, {
          tenantId,
          name: name.trim(),
          type,
          calcMethod,
          isTaxable,
          baseValue: Number(baseValue),
          code: code.trim() || undefined,
        });
      } else {
        await onCreate({
          tenantId,
          name: name.trim(),
          type,
          calcMethod,
          isTaxable,
          baseValue: Number(baseValue),
          code: code.trim() || undefined,
        });
      }

      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={concept ? "Editar concepto" : "Nuevo concepto"}
      size="md"
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Input
            label="Nombre"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
          />
          <Input
            label="Código"
            value={code}
            onChange={(event) => setCode(event.target.value)}
            hint="Opcional, útil para reportes"
          />
          <Select
            label="Tipo"
            value={type}
            onChange={(event) =>
              setType(event.target.value as "earning" | "deduction")
            }
            options={TYPE_OPTIONS}
          />
          <Select
            label="Método de cálculo"
            value={calcMethod}
            onChange={(event) =>
              setCalcMethod(
                event.target.value as
                  | "fixed"
                  | "percentage"
                  | "formula"
                  | "manual",
              )
            }
            options={METHOD_OPTIONS}
          />
          <Input
            label="Valor base"
            type="number"
            min="0"
            step="0.01"
            value={baseValue}
            onChange={(event) => setBaseValue(event.target.value)}
          />
          <Select
            label="Aplica impuesto"
            value={isTaxable ? "yes" : "no"}
            onChange={(event) => setIsTaxable(event.target.value === "yes")}
            options={[
              { value: "yes", label: "Sí" },
              { value: "no", label: "No" },
            ]}
          />
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-3 border-t border-gray-200 pt-6">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button type="button" onClick={handleSubmit} loading={isSubmitting}>
            {concept ? "Guardar concepto" : "Crear concepto"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
