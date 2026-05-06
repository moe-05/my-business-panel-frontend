import { useMemo, useState } from "react";
import { useLoaderData } from "react-router-dom";

import { contractApi } from "@/api/contract.api";
import { employeeApi } from "@/api/employee.api";
import { userApi } from "@/api/user.api";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { StatCard } from "@/components/ui/StatCard";
import { Table } from "@/components/ui/Table";
import { Toast } from "@/components/ui/Toast";

import { IconEdit, IconPlus, IconTrash, IconUsers } from "@/assets/icons";

import type { Column } from "@/interfaces/components/ui/TableProps.interface";
import type { CreateUserRequest } from "@/interfaces/api/requests/CreateUserRequest.interface";
import type { ToastMode } from "@/interfaces/components/ui/ToastProps.interface";
import type { HrEmployeeRecord } from "@/interfaces/entities/Hr.interface";
import type {
  UpdateContractPayload,
  UpdateEmployeePayload,
} from "@/interfaces/entities/Employee.interface";
import type { HrEmployeesPageLoaderData } from "@/router/loaders/hr.loaders";

import { EmployeeUpsertModal } from "./EmployeeUpsertModal";

const formatCurrency = (value: number) =>
  `CRC ${Number(value).toLocaleString("es-CR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

type StatusFilter = "all" | "active" | "inactive";

export function HREmployeesPage() {
  const {
    currentUser,
    branches,
    employees: initialEmployees,
    paymentSchedules,
    turns,
    roles,
  } = useLoaderData() as HrEmployeesPageLoaderData;

  const [employees, setEmployees] = useState(initialEmployees);
  const [search, setSearch] = useState("");
  const [branchFilter, setBranchFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [selectedEmployee, setSelectedEmployee] =
    useState<HrEmployeeRecord | null>(null);
  const [toast, setToast] = useState<{
    mode: ToastMode;
    message: string;
  } | null>(null);

  const paymentScheduleMap = useMemo(
    () =>
      new Map(
        paymentSchedules.map((schedule) => [
          schedule.payment_schedule_id,
          schedule.description,
        ]),
      ),
    [paymentSchedules],
  );

  const turnMap = useMemo(
    () =>
      new Map(
        turns.map((turn) => [
          turn.turn_id,
          `${turn.entry.slice(0, 5)} - ${turn.out.slice(0, 5)}`,
        ]),
      ),
    [turns],
  );

  const filteredEmployees = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return employees.filter((employee) => {
      const matchesBranch =
        !branchFilter || employee.branch_id === branchFilter;
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && employee.is_active) ||
        (statusFilter === "inactive" && !employee.is_active);
      const matchesSearch =
        !normalizedSearch ||
        `${employee.first_name || ""} ${employee.last_name || ""}`
          .toLowerCase()
          .includes(normalizedSearch) ||
        (employee.document_number?.toLowerCase().includes(normalizedSearch) ??
          false) ||
        (employee.email?.toLowerCase().includes(normalizedSearch) ?? false);

      return matchesBranch && matchesStatus && matchesSearch;
    });
  }, [branchFilter, employees, search, statusFilter]);

  const refreshEmployees = async () => {
    const tenantId = currentUser.tenant.tenant_id;
    const updatedEmployees = await employeeApi.listByTenant(tenantId);
    setEmployees(updatedEmployees);
  };

  const handleCreate = async (payload: CreateUserRequest) => {
    try {
      await userApi.create(payload);
      await refreshEmployees();
      setToast({
        mode: "success",
        message: "Empleado creado correctamente",
      });
    } catch (error) {
      setToast({
        mode: "error",
        message:
          error instanceof Error
            ? error.message
            : "No se pudo crear el empleado",
      });
      throw error;
    }
  };

  const handleUpdate = async (
    employeeId: string,
    contractId: string,
    payload: {
      employee: UpdateEmployeePayload;
      contract: UpdateContractPayload;
    },
  ) => {
    try {
      await Promise.all([
        employeeApi.update(employeeId, payload.employee),
        contractApi.update(contractId, payload.contract),
      ]);
      await refreshEmployees();
      setToast({
        mode: "success",
        message: "Empleado actualizado correctamente",
      });
    } catch (error) {
      setToast({
        mode: "error",
        message:
          error instanceof Error
            ? error.message
            : "No se pudo actualizar el empleado",
      });
      throw error;
    }
  };

  const handleDeactivate = async (employee: HrEmployeeRecord) => {
    if (
      !confirm(
        `¿Desea desactivar a ${employee.first_name} ${employee.last_name}?`,
      )
    ) {
      return;
    }

    try {
      await employeeApi.deactivate(employee.employee_id);
      setEmployees((prev) =>
        prev.map((item) =>
          item.employee_id === employee.employee_id
            ? { ...item, is_active: false }
            : item,
        ),
      );
      setToast({
        mode: "success",
        message: "Empleado desactivado correctamente",
      });
    } catch (error) {
      setToast({
        mode: "error",
        message:
          error instanceof Error
            ? error.message
            : "No se pudo desactivar el empleado",
      });
    }
  };

  const handleDelete = async (employee: HrEmployeeRecord) => {
    if (
      !confirm(
        `¿Eliminar al empleado ${employee.first_name} ${employee.last_name}? Esta acción también eliminará su usuario.`,
      )
    ) {
      return;
    }

    const previous = employees;
    setEmployees((prev) =>
      prev.filter((item) => item.employee_id !== employee.employee_id),
    );

    try {
      await userApi.delete(employee.user_id);
      setToast({
        mode: "success",
        message: "Empleado eliminado correctamente",
      });
    } catch (error) {
      setEmployees(previous);
      setToast({
        mode: "error",
        message:
          error instanceof Error
            ? error.message
            : "No se pudo eliminar el empleado",
      });
    }
  };

  const openCreate = () => {
    setModalMode("create");
    setSelectedEmployee(null);
    setIsModalOpen(true);
  };

  const openEdit = (employee: HrEmployeeRecord) => {
    setModalMode("edit");
    setSelectedEmployee(employee);
    setIsModalOpen(true);
  };

  const columns: Column[] = [
    {
      key: "first_name",
      label: "Empleado",
      width: "22%",
      render: (_value: unknown, row: HrEmployeeRecord) => (
        <div>
          <p className="font-medium text-gray-900">
            {row.first_name} {row.last_name}
          </p>
          <p className="text-xs text-gray-500">{row.email}</p>
        </div>
      ),
    },
    { key: "document_number", label: "Documento", width: "12%" },
    { key: "branch_name", label: "Sucursal", width: "14%" },
    {
      key: "payment_schedule_id",
      label: "Pago",
      width: "12%",
      render: (value: number) => paymentScheduleMap.get(value) ?? `#${value}`,
    },
    {
      key: "base_salary",
      label: "Salario",
      width: "12%",
      render: (value: number) => formatCurrency(value),
    },
    {
      key: "turn_id",
      label: "Turno",
      width: "12%",
      render: (value: number, row: HrEmployeeRecord) => (
        <div>
          <p className="text-gray-900">
            {turnMap.get(value) ?? `Turno ${value}`}
          </p>
          <p className="text-xs text-gray-500">{row.turn_type} h por turno</p>
        </div>
      ),
    },
    {
      key: "is_active",
      label: "Estado",
      width: "8%",
      render: (value: boolean) => (
        <Badge variant={value ? "green" : "gray"}>
          {value ? "Activo" : "Inactivo"}
        </Badge>
      ),
    },
    {
      key: "actions",
      label: "Acciones",
      width: "8%",
      render: (_value: unknown, row: HrEmployeeRecord) => (
        <div
          className="flex gap-2"
          onClick={(event) => event.stopPropagation()}
        >
          <Button
            type="button"
            variant="ghost"
            title="Editar empleado"
            onClick={() => openEdit(row)}
          >
            <IconEdit />
          </Button>
          {row.is_active && (
            <Button
              type="button"
              variant="ghost"
              title="Desactivar empleado"
              onClick={() => handleDeactivate(row)}
            >
              <IconUsers />
            </Button>
          )}
          <Button
            type="button"
            variant="danger"
            title="Eliminar empleado"
            onClick={() => handleDelete(row)}
          >
            <IconTrash />
          </Button>
        </div>
      ),
    },
  ];

  const branchOptions = [
    { value: "", label: "Todas las sucursales" },
    ...branches.map((branch) => ({
      value: branch.branch_id,
      label: branch.branch_name,
    })),
  ];

  const statusOptions = [
    { value: "all", label: "Todos" },
    { value: "active", label: "Activos" },
    { value: "inactive", label: "Inactivos" },
  ];

  const activeCount = employees.filter((employee) => employee.is_active).length;
  const totalPayrollBase = employees.reduce(
    (total, employee) => total + Number(employee.base_salary),
    0,
  );

  return (
    <div className="p-6 lg:p-8">
      {toast && (
        <Toast
          mode={toast.mode}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}

      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="mb-2 text-3xl font-bold text-gray-900">
            Gestión de empleados
          </h1>
          <p className="text-gray-600">
            Controle altas, cambios y estado operativo de la plantilla de{" "}
            {currentUser.tenant.tenant_name}.
          </p>
        </div>
        <Button onClick={openCreate}>
          <IconPlus />
          Nuevo empleado
        </Button>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 xl:grid-cols-[1.4fr_1fr_1fr]">
        <StatCard
          label="Empleados registrados"
          value={employees.length}
          sublabel={`${activeCount} activos`}
          icon={<IconUsers />}
          accent
        />
        <StatCard
          label="Sucursales con personal"
          value={new Set(employees.map((employee) => employee.branch_id)).size}
          sublabel="Distribución del tenant"
          icon={<IconUsers />}
        />
        <StatCard
          label="Base salarial mensual"
          value={formatCurrency(totalPayrollBase)}
          sublabel="Suma de salarios base"
          icon={<IconUsers />}
        />
      </div>

      <div className="mb-6 rounded-2xl border border-gray-300 bg-white p-6">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
          <Input
            label="Buscar"
            placeholder="Nombre, documento o email"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <Select
            label="Sucursal"
            value={branchFilter}
            onChange={(event) => setBranchFilter(event.target.value)}
            options={branchOptions}
          />
          <Select
            label="Estado"
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value as StatusFilter)
            }
            options={statusOptions}
          />
          <div className="flex items-end justify-end text-sm text-gray-500">
            {filteredEmployees.length} resultado
            {filteredEmployees.length === 1 ? "" : "s"}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-300 bg-white p-6">
        <Table
          columns={columns}
          data={filteredEmployees}
          emptyMessage="No hay empleados registrados con esos filtros"
        />
      </div>

      <EmployeeUpsertModal
        isOpen={isModalOpen}
        mode={modalMode}
        employee={selectedEmployee}
        tenantId={currentUser.tenant.tenant_id}
        branches={branches}
        roles={roles}
        paymentSchedules={paymentSchedules}
        turns={turns}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedEmployee(null);
          setModalMode("create");
        }}
        onCreate={handleCreate}
        onUpdate={handleUpdate}
      />
    </div>
  );
}
