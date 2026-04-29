import { useEffect, useMemo, useState } from "react";
import { z } from "zod";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";

import type { Branch } from "@/interfaces/entities/Branch.interface";
import type { Role } from "@/interfaces/entities/Role.interface";
import type { CreateUserRequest } from "@/interfaces/api/requests/CreateUserRequest.interface";
import type {
  HrEmployeeRecord,
  HrPaymentSchedule,
  HrTurn,
} from "@/interfaces/entities/Hr.interface";
import type {
  UpdateContractPayload,
  UpdateEmployeePayload,
} from "@/interfaces/entities/Employee.interface";

import {
  accountSchema,
  contractSchema,
  employeeSchema,
} from "@/pages/app/UsersPage/newUser.schema";
import { capitalize } from "@/utils/capitalize";

type EmployeeFields = z.infer<typeof employeeSchema>;
type ContractFields = z.infer<typeof contractSchema>;
type AccountFields = z.infer<typeof accountSchema>;

type EmployeeErrors = Partial<Record<keyof EmployeeFields, string>>;
type ContractErrors = Partial<Record<keyof ContractFields, string>>;
type AccountErrors = Partial<Record<keyof AccountFields, string>>;

const EMPTY_EMPLOYEE: EmployeeFields = {
  first_name: "",
  last_name: "",
  doc_number: "",
  phone: "",
  employee_email: "",
  branch_id: "",
  payment_schedule_id: "",
};

const EMPTY_CONTRACT: ContractFields = {
  start_date: new Date().toISOString().slice(0, 10),
  end_date: "",
  hours: "40",
  base_salary: "0",
  duties: "",
  turn_type: "8",
  turn_id: "",
};

const EMPTY_ACCOUNT: AccountFields = {
  email: "",
  password: "",
  confirmPassword: "",
  role_id: 2,
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

interface EmployeeUpsertModalProps {
  isOpen: boolean;
  mode: "create" | "edit";
  employee?: HrEmployeeRecord | null;
  tenantId: string;
  branches: Branch[];
  roles: Role[];
  paymentSchedules: HrPaymentSchedule[];
  turns: HrTurn[];
  onClose: () => void;
  onCreate: (payload: CreateUserRequest) => Promise<void>;
  onUpdate: (
    employeeId: string,
    contractId: string,
    payload: {
      employee: UpdateEmployeePayload;
      contract: UpdateContractPayload;
    },
  ) => Promise<void>;
}

export function EmployeeUpsertModal({
  isOpen,
  mode,
  employee,
  tenantId,
  branches,
  roles,
  paymentSchedules,
  turns,
  onClose,
  onCreate,
  onUpdate,
}: EmployeeUpsertModalProps) {
  const [employeeData, setEmployeeData] = useState<EmployeeFields>(
    EMPTY_EMPLOYEE,
  );
  const [contractData, setContractData] = useState<ContractFields>(
    EMPTY_CONTRACT,
  );
  const [accountData, setAccountData] = useState<AccountFields>(EMPTY_ACCOUNT);
  const [employeeErrors, setEmployeeErrors] = useState<EmployeeErrors>({});
  const [contractErrors, setContractErrors] = useState<ContractErrors>({});
  const [accountErrors, setAccountErrors] = useState<AccountErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isCreate = mode === "create";

  useEffect(() => {
    if (!isOpen) {
      setEmployeeData(EMPTY_EMPLOYEE);
      setContractData(EMPTY_CONTRACT);
      setAccountData(EMPTY_ACCOUNT);
      setEmployeeErrors({});
      setContractErrors({});
      setAccountErrors({});
      setIsSubmitting(false);
      return;
    }

    if (!employee || isCreate) {
      setEmployeeData({
        ...EMPTY_EMPLOYEE,
        branch_id: branches[0]?.branch_id ?? "",
        payment_schedule_id: String(
          paymentSchedules[0]?.payment_schedule_id ?? "",
        ),
      });
      setContractData({
        ...EMPTY_CONTRACT,
        turn_id: String(
          turns.find((turn) => turn.branch_id === branches[0]?.branch_id)
            ?.turn_id ?? "",
        ),
      });
      setAccountData(EMPTY_ACCOUNT);
      return;
    }

    setEmployeeData({
      first_name: employee.first_name,
      last_name: employee.last_name,
      doc_number: employee.doc_number,
      phone: employee.phone,
      employee_email: employee.email,
      branch_id: employee.branch_id,
      payment_schedule_id: String(employee.payment_schedule_id),
    });
    setContractData({
      start_date: employee.start_date.slice(0, 10),
      end_date: employee.end_date.slice(0, 10),
      hours: String(employee.hours),
      base_salary: String(employee.base_salary),
      duties: employee.duties,
      turn_type: String(employee.turn_type),
      turn_id: String(employee.turn_id),
    });
  }, [branches, employee, isCreate, isOpen, paymentSchedules, turns]);

  const branchTurns = useMemo(
    () => turns.filter((turn) => turn.branch_id === employeeData.branch_id),
    [employeeData.branch_id, turns],
  );

  useEffect(() => {
    if (!branchTurns.length) {
      setContractData((prev) => ({ ...prev, turn_id: "" }));
      return;
    }

    if (!branchTurns.some((turn) => String(turn.turn_id) === contractData.turn_id)) {
      setContractData((prev) => ({
        ...prev,
        turn_id: String(branchTurns[0].turn_id),
      }));
    }
  }, [branchTurns, contractData.turn_id]);

  const availableRoles = roles.filter((role) => role.role_id !== 1);

  const validateEmployee = () => {
    const result = employeeSchema.safeParse(employeeData);
    if (result.success) {
      setEmployeeErrors({});
      return true;
    }

    setEmployeeErrors(mapZodErrors<keyof EmployeeFields>(result.error.issues));
    return false;
  };

  const validateContract = () => {
    const result = contractSchema.safeParse(contractData);
    if (result.success) {
      setContractErrors({});
      return true;
    }

    setContractErrors(mapZodErrors<keyof ContractFields>(result.error.issues));
    return false;
  };

  const validateAccount = () => {
    if (!isCreate) return true;

    const result = accountSchema.safeParse(accountData);
    if (result.success) {
      setAccountErrors({});
      return true;
    }

    setAccountErrors(mapZodErrors<keyof AccountFields>(result.error.issues));
    return false;
  };

  const handleSubmit = async () => {
    const isEmployeeValid = validateEmployee();
    const isContractValid = validateContract();
    const isAccountValid = validateAccount();

    if (!isEmployeeValid || !isContractValid || !isAccountValid) {
      return;
    }

    setIsSubmitting(true);

    try {
      if (isCreate) {
        await onCreate({
          tenant_id: tenantId,
          email: accountData.email,
          password: accountData.password,
          role_id: accountData.role_id,
          employeeInfo: {
            tenant_id: tenantId,
            branch_id: employeeData.branch_id,
            first_name: employeeData.first_name,
            last_name: employeeData.last_name,
            doc_number: employeeData.doc_number,
            phone: employeeData.phone,
            email: employeeData.employee_email,
            payment_schedule_id: Number(employeeData.payment_schedule_id),
            contractData: {
              start_date: contractData.start_date,
              end_date: contractData.end_date,
              hours: Number(contractData.hours),
              base_salary: Number(contractData.base_salary),
              duties: contractData.duties,
              turn_type: Number(contractData.turn_type),
              turn_id: Number(contractData.turn_id),
            },
          },
        });
      } else if (employee) {
        await onUpdate(employee.employee_id, employee.contract_id, {
          employee: {
            first_name: employeeData.first_name,
            last_name: employeeData.last_name,
            doc_number: employeeData.doc_number,
            phone: employeeData.phone,
            email: employeeData.employee_email,
            payment_schedule_id: Number(employeeData.payment_schedule_id),
            branch_id: employeeData.branch_id,
          },
          contract: {
            start_date: contractData.start_date,
            end_date: contractData.end_date,
            hours: Number(contractData.hours),
            base_salary: Number(contractData.base_salary),
            duties: contractData.duties,
            turn_type: Number(contractData.turn_type),
            turn_id: Number(contractData.turn_id),
          },
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
      title={isCreate ? "Nuevo empleado" : "Editar empleado"}
      size="lg"
    >
      <div className="space-y-8">
        <section className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Empleado</h3>
            <p className="text-sm text-gray-500">
              Datos básicos y asignación operativa dentro del tenant.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Input
              label="Nombre"
              value={employeeData.first_name}
              onChange={(event) =>
                setEmployeeData((prev) => ({
                  ...prev,
                  first_name: event.target.value,
                }))
              }
              error={employeeErrors.first_name}
              required
            />
            <Input
              label="Apellidos"
              value={employeeData.last_name}
              onChange={(event) =>
                setEmployeeData((prev) => ({
                  ...prev,
                  last_name: event.target.value,
                }))
              }
              error={employeeErrors.last_name}
              required
            />
            <Input
              label="Documento"
              value={employeeData.doc_number}
              onChange={(event) =>
                setEmployeeData((prev) => ({
                  ...prev,
                  doc_number: event.target.value,
                }))
              }
              error={employeeErrors.doc_number}
              required
            />
            <Input
              label="Teléfono"
              value={employeeData.phone}
              onChange={(event) =>
                setEmployeeData((prev) => ({
                  ...prev,
                  phone: event.target.value,
                }))
              }
              error={employeeErrors.phone}
              required
            />
            <Input
              label="Email del empleado"
              type="email"
              value={employeeData.employee_email}
              onChange={(event) => {
                const nextEmail = event.target.value;
                setEmployeeData((prev) => ({
                  ...prev,
                  employee_email: nextEmail,
                }));

                if (isCreate && !accountData.email) {
                  setAccountData((prev) => ({ ...prev, email: nextEmail }));
                }
              }}
              error={employeeErrors.employee_email}
              required
            />
            <Select
              label="Sucursal"
              value={employeeData.branch_id}
              onChange={(event) =>
                setEmployeeData((prev) => ({
                  ...prev,
                  branch_id: event.target.value,
                }))
              }
              options={branches.map((branch) => ({
                value: branch.branch_id,
                label: branch.branch_name,
              }))}
              error={employeeErrors.branch_id}
              required
            />
            <Select
              label="Jornada de pago"
              value={employeeData.payment_schedule_id}
              onChange={(event) =>
                setEmployeeData((prev) => ({
                  ...prev,
                  payment_schedule_id: event.target.value,
                }))
              }
              options={paymentSchedules.map((schedule) => ({
                value: schedule.payment_schedule_id,
                label: `${schedule.description} · ${schedule.daycount} días`,
              }))}
              error={employeeErrors.payment_schedule_id}
              required
            />
          </div>
        </section>

        <section className="space-y-4 border-t border-gray-200 pt-6">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Contrato</h3>
            <p className="text-sm text-gray-500">
              Condiciones salariales, vigencia y turno asignado.
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
              error={contractErrors.start_date}
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
              error={contractErrors.end_date}
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
              error={contractErrors.hours}
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
              error={contractErrors.base_salary}
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
              error={contractErrors.turn_type}
              hint="Este valor se usa en los cálculos de nómina."
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
              error={contractErrors.turn_id}
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
            error={contractErrors.duties}
            required
          />
        </section>

        {isCreate && (
          <section className="space-y-4 border-t border-gray-200 pt-6">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">
                Cuenta de acceso
              </h3>
              <p className="text-sm text-gray-500">
                El empleado se crea junto con su usuario del sistema.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Input
                label="Email de acceso"
                type="email"
                value={accountData.email}
                onChange={(event) =>
                  setAccountData((prev) => ({
                    ...prev,
                    email: event.target.value,
                  }))
                }
                error={accountErrors.email}
                required
              />
              <Select
                label="Rol"
                value={accountData.role_id}
                onChange={(event) =>
                  setAccountData((prev) => ({
                    ...prev,
                    role_id: Number(event.target.value),
                  }))
                }
                options={availableRoles.map((role) => ({
                  value: role.role_id,
                  label: capitalize(role.role_name.replace(/_/g, " ")),
                }))}
                error={accountErrors.role_id}
                required
              />
              <Input
                label="Contraseña"
                type="password"
                value={accountData.password}
                onChange={(event) =>
                  setAccountData((prev) => ({
                    ...prev,
                    password: event.target.value,
                  }))
                }
                error={accountErrors.password}
                required
              />
              <Input
                label="Confirmar contraseña"
                type="password"
                value={accountData.confirmPassword}
                onChange={(event) =>
                  setAccountData((prev) => ({
                    ...prev,
                    confirmPassword: event.target.value,
                  }))
                }
                error={accountErrors.confirmPassword}
                required
              />
            </div>
          </section>
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
            {isCreate ? "Crear empleado" : "Guardar cambios"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
