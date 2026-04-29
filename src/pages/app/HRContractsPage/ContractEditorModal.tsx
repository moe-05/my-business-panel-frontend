import { useEffect, useMemo, useState } from "react";
import { z } from "zod";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";

import type { HrEmployeeRecord, HrTurn } from "@/interfaces/entities/Hr.interface";
import type { UpdateContractPayload } from "@/interfaces/entities/Employee.interface";

import { contractSchema } from "@/pages/app/UsersPage/newUser.schema";

type ContractFields = z.infer<typeof contractSchema>;
type ContractErrors = Partial<Record<keyof ContractFields, string>>;

const EMPTY_CONTRACT: ContractFields = {
  start_date: "",
  end_date: "",
  hours: "40",
  base_salary: "0",
  duties: "",
  turn_type: "8",
  turn_id: "",
};

const mapZodErrors = <T extends string>(
  issues: z.ZodIssue[],
): Partial<Record<T, string>> =>
  issues.reduce<Partial<Record<T, string>>>((acc, issue) => {
    const field = issue.path[0] as T | undefined;
    if (field && !acc[field]) {
      acc[field] = issue.message;
    }
    return acc;
  }, {});

interface ContractEditorModalProps {
  isOpen: boolean;
  employee: HrEmployeeRecord | null;
  turns: HrTurn[];
  onClose: () => void;
  onSubmit: (
    contractId: string,
    payload: UpdateContractPayload,
  ) => Promise<void>;
}

export function ContractEditorModal({
  isOpen,
  employee,
  turns,
  onClose,
  onSubmit,
}: ContractEditorModalProps) {
  const [contractData, setContractData] = useState<ContractFields>(
    EMPTY_CONTRACT,
  );
  const [errors, setErrors] = useState<ContractErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen || !employee) {
      setContractData(EMPTY_CONTRACT);
      setErrors({});
      setIsSubmitting(false);
      return;
    }

    setContractData({
      start_date: employee.start_date.slice(0, 10),
      end_date: employee.end_date.slice(0, 10),
      hours: String(employee.hours),
      base_salary: String(employee.base_salary),
      duties: employee.duties,
      turn_type: String(employee.turn_type),
      turn_id: String(employee.turn_id),
    });
  }, [employee, isOpen]);

  const branchTurns = useMemo(
    () => turns.filter((turn) => turn.branch_id === employee?.branch_id),
    [employee?.branch_id, turns],
  );

  const handleSubmit = async () => {
    if (!employee) return;

    const result = contractSchema.safeParse(contractData);
    if (!result.success) {
      setErrors(mapZodErrors<keyof ContractFields>(result.error.issues));
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    try {
      await onSubmit(employee.contract_id, {
        start_date: contractData.start_date,
        end_date: contractData.end_date,
        hours: Number(contractData.hours),
        base_salary: Number(contractData.base_salary),
        duties: contractData.duties,
        turn_type: Number(contractData.turn_type),
        turn_id: Number(contractData.turn_id),
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Editar contrato"
      size="md"
    >
      {employee && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
            <p className="text-sm font-semibold text-gray-900">
              {employee.first_name} {employee.last_name}
            </p>
            <p className="text-sm text-gray-500">
              {employee.branch_name} · {employee.email}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Input
              label="Fecha de inicio"
              type="date"
              value={contractData.start_date}
              onChange={(event) =>
                setContractData((prev) => ({
                  ...prev,
                  start_date: event.target.value,
                }))
              }
              error={errors.start_date}
              required
            />
            <Input
              label="Fecha de fin"
              type="date"
              value={contractData.end_date}
              onChange={(event) =>
                setContractData((prev) => ({
                  ...prev,
                  end_date: event.target.value,
                }))
              }
              error={errors.end_date}
              required
            />
            <Input
              label="Horas semanales"
              type="number"
              min="1"
              value={contractData.hours}
              onChange={(event) =>
                setContractData((prev) => ({
                  ...prev,
                  hours: event.target.value,
                }))
              }
              error={errors.hours}
              required
            />
            <Input
              label="Salario base"
              type="number"
              min="0"
              step="0.01"
              value={contractData.base_salary}
              onChange={(event) =>
                setContractData((prev) => ({
                  ...prev,
                  base_salary: event.target.value,
                }))
              }
              error={errors.base_salary}
              required
            />
            <Input
              label="Horas por turno"
              type="number"
              min="1"
              value={contractData.turn_type}
              onChange={(event) =>
                setContractData((prev) => ({
                  ...prev,
                  turn_type: event.target.value,
                }))
              }
              error={errors.turn_type}
              required
            />
            <Select
              label="Turno"
              value={contractData.turn_id}
              onChange={(event) =>
                setContractData((prev) => ({
                  ...prev,
                  turn_id: event.target.value,
                }))
              }
              options={
                branchTurns.length
                  ? branchTurns.map((turn) => ({
                      value: turn.turn_id,
                      label: `${turn.entry.slice(0, 5)} - ${turn.out.slice(0, 5)}`,
                    }))
                  : [{ value: "", label: "No hay turnos para esta sucursal" }]
              }
              error={errors.turn_id}
              required
            />
          </div>

          <Input
            label="Funciones"
            value={contractData.duties}
            onChange={(event) =>
              setContractData((prev) => ({
                ...prev,
                duties: event.target.value,
              }))
            }
            error={errors.duties}
            required
          />

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
              Guardar contrato
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
