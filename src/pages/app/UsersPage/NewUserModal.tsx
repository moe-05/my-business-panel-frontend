import { useEffect, useState } from "react";
import { z } from "zod";

import { branchApi } from "@/api/branch.api";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Modal } from "@/components/ui/Modal";

import type { Branch } from "@/interfaces/entities/Branch.interface";
import type { NewUserModalProps } from "@/interfaces/components/ui/NewUserModalProps.interface";
import type { CreateUserRequest } from "@/interfaces/api/requests/CreateUserRequest.interface";

import { capitalize } from "@/utils/capitalize";
import {
  accountSchema,
  contractSchema,
  employeeSchema,
} from "./newUser.schema";
import { StepIndicator } from "../../../components/ui/StepIndicator";

// ─── Form state ───────────────────────────────────────────────────────────────

type EmployeeFields = z.infer<typeof employeeSchema>;
type ContractFields = z.infer<typeof contractSchema>;
type AccountFields = z.infer<typeof accountSchema>;

type EmployeeErrors = Partial<Record<keyof EmployeeFields, string>>;
type ContractErrors = Partial<Record<keyof ContractFields, string>>;
type AccountErrors = Partial<Record<keyof AccountFields, string>>;

const INITIAL_EMPLOYEE: EmployeeFields = {
  first_name: "",
  last_name: "",
  doc_number: "",
  phone: "",
  employee_email: "",
  branch_id: "",
  payment_schedule_id: "1",
};

const INITIAL_CONTRACT: ContractFields = {
  start_date: new Date().toISOString().split("T")[0],
  end_date: "",
  hours: "40",
  base_salary: "0",
  duties: "",
  turn_type: "1",
  turn_id: "1",
};

const INITIAL_ACCOUNT: AccountFields = {
  email: "",
  password: "",
  confirmPassword: "",
  role_id: 2,
};

const mapZodErrors = <T extends string>(
  issues: z.ZodIssue[],
): Partial<Record<T, string>> => {
  return issues.reduce<Partial<Record<T, string>>>((acc, issue) => {
    const field = issue.path[0] as T | undefined;
    if (field && !acc[field]) {
      acc[field] = issue.message;
    }
    return acc;
  }, {});
};

// ─── Main component ───────────────────────────────────────────────────────────

export function NewUserModal({
  isOpen,
  onClose,
  tenantId,
  roles,
  isLoadingRoles,
  onSubmit,
}: NewUserModalProps) {
  // Mode & step
  const [isSystemUser, setIsSystemUser] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Section state
  const [employee, setEmployee] = useState<EmployeeFields>(INITIAL_EMPLOYEE);
  const [contract, setContract] = useState<ContractFields>(INITIAL_CONTRACT);
  const [account, setAccount] = useState<AccountFields>(INITIAL_ACCOUNT);

  // Errors
  const [empErrors, setEmpErrors] = useState<EmployeeErrors>({});
  const [ctrErrors, setCtrErrors] = useState<ContractErrors>({});
  const [accErrors, setAccErrors] = useState<AccountErrors>({});

  // Branches
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isLoadingBranches, setIsLoadingBranches] = useState(false);

  const availableRoles = roles.filter((r) => r.role_id !== 1);

  // Load branches when modal opens
  useEffect(() => {
    if (!isOpen || !tenantId) return;
    setIsLoadingBranches(true);
    branchApi
      .listByTenant(tenantId)
      .then((res) => setBranches(res.branches))
      .catch(console.error)
      .finally(() => setIsLoadingBranches(false));
  }, [isOpen, tenantId]);

  // Reset on close
  useEffect(() => {
    if (!isOpen) {
      setIsSystemUser(false);
      setStep(1);
      setEmployee(INITIAL_EMPLOYEE);
      setContract(INITIAL_CONTRACT);
      setAccount(INITIAL_ACCOUNT);
      setEmpErrors({});
      setCtrErrors({});
      setAccErrors({});
    }
  }, [isOpen]);

  const handleModeToggle = (checked: boolean) => {
    setIsSystemUser(checked);
    setStep(1);
    setEmpErrors({});
    setCtrErrors({});
    setAccErrors({});
  };

  // Sync employee email with account email when field is still empty
  const handleAccountEmailChange = (value: string) => {
    setAccount((p) => ({ ...p, email: value }));
    if (!employee.employee_email) {
      setEmployee((p) => ({ ...p, employee_email: value }));
    }
  };

  // ── Validations ───────────────────────────────────────────────────────────────

  const validateEmployee = (): boolean => {
    const result = employeeSchema.safeParse(employee);
    if (result.success) {
      setEmpErrors({});
      return true;
    }
    setEmpErrors(mapZodErrors<keyof EmployeeFields>(result.error.issues));
    return false;
  };

  const validateContract = (): boolean => {
    const result = contractSchema.safeParse(contract);
    if (result.success) {
      setCtrErrors({});
      return true;
    }
    setCtrErrors(mapZodErrors<keyof ContractFields>(result.error.issues));
    return false;
  };

  const validateAccount = (): boolean => {
    const result = accountSchema.safeParse(account);
    if (result.success) {
      setAccErrors({});
      return true;
    }
    setAccErrors(mapZodErrors<keyof AccountFields>(result.error.issues));
    return false;
  };

  // ── Navigation ────────────────────────────────────────────────────────────────

  const totalSteps = isSystemUser ? 1 : 3;

  const handleNext = () => {
    if (step === 1 && !isSystemUser && !validateEmployee()) return;
    if (step === 2 && !validateContract()) return;
    setStep((s) => Math.min(s + 1, totalSteps) as 1 | 2 | 3);
  };

  const handleBack = () => {
    setStep((s) => Math.max(s - 1, 1) as 1 | 2 | 3);
  };

  const handleSubmit = () => {
    if (!validateAccount()) return;

    const payload: CreateUserRequest = {
      tenant_id: tenantId,
      email: account.email,
      password: account.password,
      role_id: account.role_id,
    };

    if (!isSystemUser) {
      payload.employeeInfo = {
        tenant_id: tenantId,
        branch_id: employee.branch_id,
        first_name: employee.first_name,
        last_name: employee.last_name,
        doc_number: employee.doc_number,
        phone: employee.phone,
        email: employee.employee_email,
        payment_schedule_id: Number(employee.payment_schedule_id),
        contractData: {
          start_date: contract.start_date,
          end_date: contract.end_date,
          hours: Number(contract.hours),
          base_salary: Number(contract.base_salary),
          duties: contract.duties,
          turn_type: Number(contract.turn_type),
          turn_id: Number(contract.turn_id),
        },
      };
    }

    onSubmit(payload);
    onClose();
  };

  // ── Section renders ───────────────────────────────────────────────────────────

  const stepLabels = isSystemUser
    ? ["Cuenta"]
    : ["Empleado", "Contrato", "Cuenta"];

  const renderSection = () => {
    if (!isSystemUser && step === 1) return renderEmployeeSection();
    if (!isSystemUser && step === 2) return renderContractSection();
    return renderAccountSection();
  };

  const renderEmployeeSection = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Nombre"
          placeholder="Juan"
          value={employee.first_name}
          onChange={(e) =>
            setEmployee((p) => ({ ...p, first_name: e.target.value }))
          }
          error={empErrors.first_name}
          required
          autoComplete="given-name"
        />
        <Input
          label="Apellidos"
          placeholder="Pérez González"
          value={employee.last_name}
          onChange={(e) =>
            setEmployee((p) => ({ ...p, last_name: e.target.value }))
          }
          error={empErrors.last_name}
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Número de documento"
          placeholder="123456789"
          value={employee.doc_number}
          onChange={(e) =>
            setEmployee((p) => ({ ...p, doc_number: e.target.value }))
          }
          error={empErrors.doc_number}
          required
        />
        <Input
          label="Teléfono"
          placeholder="+506 8888-0000"
          value={employee.phone}
          onChange={(e) =>
            setEmployee((p) => ({ ...p, phone: e.target.value }))
          }
          error={empErrors.phone}
          required
        />
      </div>
      <Input
        label="Email del empleado"
        type="email"
        placeholder="empleado@empresa.com"
        value={employee.employee_email}
        onChange={(e) =>
          setEmployee((p) => ({ ...p, employee_email: e.target.value }))
        }
        error={empErrors.employee_email}
        required
        autoComplete="email"
      />
      {isLoadingBranches ? (
        <div className="flex items-center gap-2 py-2 text-sm text-gray-500">
          <span className="w-4 h-4 border-2 border-gray-300 border-t-gray-700 rounded-full animate-spin" />
          Cargando sucursales…
        </div>
      ) : (
        <Select
          label="Sucursal"
          value={employee.branch_id}
          onChange={(e) =>
            setEmployee((p) => ({ ...p, branch_id: e.target.value }))
          }
          options={branches.map((b) => ({
            value: b.branch_id,
            label: b.branch_name,
          }))}
          error={empErrors.branch_id}
          required
        />
      )}
      <Input
        label="ID jornada de pago"
        type="number"
        placeholder="1"
        value={employee.payment_schedule_id}
        onChange={(e) =>
          setEmployee((p) => ({ ...p, payment_schedule_id: e.target.value }))
        }
        error={empErrors.payment_schedule_id}
        required
      />
    </div>
  );

  const renderContractSection = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Fecha de inicio"
          type="date"
          value={contract.start_date}
          onChange={(e) =>
            setContract((p) => ({ ...p, start_date: e.target.value }))
          }
          error={ctrErrors.start_date}
          required
        />
        <Input
          label="Fecha de fin"
          type="date"
          value={contract.end_date}
          onChange={(e) =>
            setContract((p) => ({ ...p, end_date: e.target.value }))
          }
          error={ctrErrors.end_date}
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Horas semanales"
          type="number"
          placeholder="40"
          value={contract.hours}
          onChange={(e) =>
            setContract((p) => ({ ...p, hours: e.target.value }))
          }
          error={ctrErrors.hours}
          required
        />
        <Input
          label="Salario base"
          type="number"
          placeholder="0"
          value={contract.base_salary}
          onChange={(e) =>
            setContract((p) => ({ ...p, base_salary: e.target.value }))
          }
          error={ctrErrors.base_salary}
          required
        />
      </div>
      <Input
        label="Cargo / Funciones"
        placeholder="Desarrollador de Software"
        value={contract.duties}
        onChange={(e) => setContract((p) => ({ ...p, duties: e.target.value }))}
        error={ctrErrors.duties}
        required
      />
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Tipo de turno"
          type="number"
          placeholder="1"
          value={contract.turn_type}
          onChange={(e) =>
            setContract((p) => ({ ...p, turn_type: e.target.value }))
          }
          error={ctrErrors.turn_type}
          required
        />
        <Input
          label="ID de turno"
          type="number"
          placeholder="1"
          value={contract.turn_id}
          onChange={(e) =>
            setContract((p) => ({ ...p, turn_id: e.target.value }))
          }
          error={ctrErrors.turn_id}
          required
        />
      </div>
    </div>
  );

  const renderAccountSection = () => (
    <div className="space-y-4">
      <Input
        label="Email de acceso"
        type="email"
        placeholder="usuario@empresa.com"
        value={account.email}
        onChange={(e) => handleAccountEmailChange(e.target.value)}
        error={accErrors.email}
        required
      />
      {isLoadingRoles ? (
        <div className="flex items-center gap-2 py-2 text-sm text-gray-500">
          <span className="w-4 h-4 border-2 border-gray-300 border-t-gray-700 rounded-full animate-spin" />
          Cargando roles…
        </div>
      ) : (
        <Select
          label="Rol"
          value={account.role_id}
          onChange={(e) =>
            setAccount((p) => ({ ...p, role_id: parseInt(e.target.value) }))
          }
          options={availableRoles.map((r) => ({
            value: r.role_id,
            label: capitalize(r.role_name.replace(/_/g, " ")),
          }))}
          error={accErrors.role_id}
          required
        />
      )}
      <Input
        label="Contraseña"
        type="password"
        placeholder="Mínimo 6 caracteres"
        value={account.password}
        onChange={(e) =>
          setAccount((p) => ({ ...p, password: e.target.value }))
        }
        error={accErrors.password}
        required
      />
      <Input
        label="Confirmar contraseña"
        type="password"
        placeholder="Repite la contraseña"
        value={account.confirmPassword}
        onChange={(e) =>
          setAccount((p) => ({ ...p, confirmPassword: e.target.value }))
        }
        error={accErrors.confirmPassword}
        required
      />
    </div>
  );

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nuevo Usuario" size="md">
      {/* Mode toggle */}
      <div className="flex items-center justify-between mb-5 p-3 rounded-xl bg-gray-50 border border-gray-200">
        <div>
          <p className="text-sm font-semibold text-gray-800">
            Usuario de sistema
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            Sin registro de empleado ni contrato
          </p>
        </div>
        <button
          type="button"
          aria-label="Activar o desactivar usuario de sistema"
          title="Activar o desactivar usuario de sistema"
          onClick={() => handleModeToggle(!isSystemUser)}
          className={[
            "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors",
            isSystemUser ? "bg-gray-800" : "bg-gray-200",
          ].join(" ")}
        >
          <span className="sr-only">Usuario de sistema</span>
          <span
            className={[
              "pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-sm ring-0 transition-transform",
              isSystemUser ? "translate-x-5" : "translate-x-0",
            ].join(" ")}
          />
        </button>
      </div>

      {/* Step indicator */}
      <StepIndicator currentStep={step} labels={stepLabels} />

      {/* Section label */}
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">
        {stepLabels[step - 1]}
      </p>

      {/* Section content */}
      {renderSection()}

      {/* Navigation */}
      <div className="flex gap-3 pt-5 mt-5 border-t border-gray-200">
        {step > 1 && !isSystemUser ? (
          <Button type="button" variant="ghost" onClick={handleBack}>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            Anterior
          </Button>
        ) : (
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
        )}

        <div className="flex-1" />

        {step < totalSteps ? (
          <Button type="button" variant="primary" onClick={handleNext}>
            Siguiente
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </Button>
        ) : (
          <Button type="button" variant="primary" onClick={handleSubmit}>
            Crear Usuario
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </Button>
        )}
      </div>
    </Modal>
  );
}
