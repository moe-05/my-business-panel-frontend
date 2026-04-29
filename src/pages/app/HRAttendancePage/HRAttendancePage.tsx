import { useEffect, useMemo, useState } from "react";
import { useLoaderData } from "react-router-dom";

import { clockingApi } from "@/api/clocking.api";
import { foulApi } from "@/api/foul.api";
import { incapacityApi } from "@/api/incapacity.api";
import { suspentionApi } from "@/api/suspention.api";
import { tardinessApi } from "@/api/tardiness.api";
import { turnsApi } from "@/api/turns.api";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { StatCard } from "@/components/ui/StatCard";
import { Table } from "@/components/ui/Table";
import { Toast } from "@/components/ui/Toast";

import {
  IconCalendar,
  IconEdit,
  IconPlus,
  IconTrash,
  IconUsers,
} from "@/assets/icons";

import type { Column } from "@/interfaces/components/ui/TableProps.interface";
import type { ToastMode } from "@/interfaces/components/ui/ToastProps.interface";
import type {
  HrClockingRecord,
  HrFoulRecord,
  HrIncapacity,
  HrSuspention,
  HrTurn,
} from "@/interfaces/entities/Hr.interface";
import type { HrAttendancePageLoaderData } from "@/router/loaders/hr.loaders";

import { TurnEditorModal } from "./TurnEditorModal";

export function HRAttendancePage() {
  const { currentEmployee, branches, employees, turns: initialTurns } =
    useLoaderData() as HrAttendancePageLoaderData;

  const [selectedBranchId, setSelectedBranchId] = useState(
    currentEmployee?.branch_id ?? branches[0]?.branch_id ?? "",
  );
  const [turns, setTurns] = useState(initialTurns);
  const [clockings, setClockings] = useState<HrClockingRecord[]>([]);
  const [tardiness, setTardiness] = useState<
    { type: string; log: string; registered_at: string }[]
  >([]);
  const [tardinessTotal, setTardinessTotal] = useState(0);
  const [fouls, setFouls] = useState<HrFoulRecord[]>([]);
  const [foulTotal, setFoulTotal] = useState(0);
  const [suspentions, setSuspentions] = useState<HrSuspention[]>([]);
  const [incapacities, setIncapacities] = useState<HrIncapacity[]>([]);
  const [selectedTurn, setSelectedTurn] = useState<HrTurn | null>(null);
  const [turnModalOpen, setTurnModalOpen] = useState(false);
  const [isLoadingRecords, setIsLoadingRecords] = useState(false);
  const [toast, setToast] = useState<{
    mode: ToastMode;
    message: string;
  } | null>(null);

  const [foulEmployeeId, setFoulEmployeeId] = useState("");
  const [foulDate, setFoulDate] = useState(new Date().toISOString().slice(0, 10));
  const [foulHour, setFoulHour] = useState("08:00");
  const [foulDescription, setFoulDescription] = useState("");
  const [isSubmittingFoul, setIsSubmittingFoul] = useState(false);

  const [suspentionEmployeeId, setSuspentionEmployeeId] = useState("");
  const [suspentionStart, setSuspentionStart] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [suspentionEnd, setSuspentionEnd] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [suspentionReason, setSuspentionReason] = useState("");
  const [isSubmittingSuspention, setIsSubmittingSuspention] = useState(false);

  const [incapacityEmployeeId, setIncapacityEmployeeId] = useState("");
  const [incapacityType, setIncapacityType] = useState("general");
  const [incapacityStart, setIncapacityStart] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [incapacityEnd, setIncapacityEnd] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [incapacityDays, setIncapacityDays] = useState("3");
  const [incapacityPercent, setIncapacityPercent] = useState("60");
  const [isSubmittingIncapacity, setIsSubmittingIncapacity] = useState(false);

  const branchName = branches.find(
    (branch) => branch.branch_id === selectedBranchId,
  )?.branch_name;

  const branchEmployees = useMemo(
    () =>
      employees.filter((employee) => employee.branch_id === selectedBranchId),
    [employees, selectedBranchId],
  );

  const branchTurns = useMemo(
    () => turns.filter((turn) => turn.branch_id === selectedBranchId),
    [selectedBranchId, turns],
  );

  const employeeOptions = branchEmployees.map((employee) => ({
    value: employee.employee_id,
    label: `${employee.first_name} ${employee.last_name}`,
  }));

  const refreshTurnsForBranch = async (branchId: string) => {
    const nextTurns = await turnsApi.listByBranch(branchId);
    setTurns((prev) => {
      const otherTurns = prev.filter((turn) => turn.branch_id !== branchId);
      return [...otherTurns, ...nextTurns];
    });
  };

  const loadBranchRecords = async (branchId: string) => {
    if (!branchId) return;

    setIsLoadingRecords(true);

    try {
      const [clockingRows, tardinessSummary, foulSummary, branchSuspentions, branchIncapacities] =
        await Promise.all([
          clockingApi.listByBranch(branchId),
          tardinessApi.getByBranch(branchId),
          foulApi.getByBranch(branchId),
          suspentionApi.getByBranch(branchId),
          incapacityApi.getByBranch(branchId),
        ]);

      setClockings(clockingRows);
      setTardiness(tardinessSummary.tardiness ?? []);
      setTardinessTotal(Number(tardinessSummary.totalCount ?? 0));
      setFouls(foulSummary.fouls ?? []);
      setFoulTotal(Number(foulSummary.totalFouls ?? 0));
      setSuspentions(branchSuspentions);
      setIncapacities(branchIncapacities);
    } catch (error) {
      setToast({
        mode: "error",
        message:
          error instanceof Error
            ? error.message
            : "No se pudieron cargar los registros de asistencia",
      });
    } finally {
      setIsLoadingRecords(false);
    }
  };

  useEffect(() => {
    if (!selectedBranchId) return;

    loadBranchRecords(selectedBranchId);
    refreshTurnsForBranch(selectedBranchId).catch(() => undefined);
  }, [selectedBranchId]);

  useEffect(() => {
    if (!branchEmployees.length) {
      setFoulEmployeeId("");
      setSuspentionEmployeeId("");
      setIncapacityEmployeeId("");
      return;
    }

    if (!branchEmployees.some((employee) => employee.employee_id === foulEmployeeId)) {
      setFoulEmployeeId(branchEmployees[0].employee_id);
    }

    if (
      !branchEmployees.some(
        (employee) => employee.employee_id === suspentionEmployeeId,
      )
    ) {
      setSuspentionEmployeeId(branchEmployees[0].employee_id);
    }

    if (
      !branchEmployees.some(
        (employee) => employee.employee_id === incapacityEmployeeId,
      )
    ) {
      setIncapacityEmployeeId(branchEmployees[0].employee_id);
    }
  }, [
    branchEmployees,
    foulEmployeeId,
    incapacityEmployeeId,
    suspentionEmployeeId,
  ]);

  const handleOpenCreateTurn = () => {
    setSelectedTurn(null);
    setTurnModalOpen(true);
  };

  const handleTurnSubmit = async (payload: { entry: string; out: string }) => {
    if (!selectedBranchId) return;

    try {
      if (selectedTurn) {
        await turnsApi.update(selectedTurn.turn_id, payload);
        setToast({
          mode: "success",
          message: "Turno actualizado correctamente",
        });
      } else {
        await turnsApi.create({
          branchId: selectedBranchId,
          entry: payload.entry,
          out: payload.out,
        });
        setToast({
          mode: "success",
          message: "Turno creado correctamente",
        });
      }

      await refreshTurnsForBranch(selectedBranchId);
    } catch (error) {
      setToast({
        mode: "error",
        message:
          error instanceof Error ? error.message : "No se pudo guardar el turno",
      });
      throw error;
    }
  };

  const handleDeleteTurn = async (turn: HrTurn) => {
    if (!confirm("¿Eliminar este turno?")) return;

    try {
      await turnsApi.delete(turn.turn_id);
      await refreshTurnsForBranch(selectedBranchId);
      setToast({
        mode: "success",
        message: "Turno eliminado correctamente",
      });
    } catch (error) {
      setToast({
        mode: "error",
        message:
          error instanceof Error ? error.message : "No se pudo eliminar el turno",
      });
    }
  };

  const handleRegisterFoul = async () => {
    if (!selectedBranchId || !foulEmployeeId || !foulDescription.trim()) {
      setToast({
        mode: "error",
        message: "Complete empleado, fecha, hora y descripción de la falta",
      });
      return;
    }

    setIsSubmittingFoul(true);

    try {
      await foulApi.create({
        employee_id: foulEmployeeId,
        branch_id: selectedBranchId,
        identificator: `F-${foulEmployeeId.slice(0, 8)}-${Date.now()}`,
        foul_date: foulDate,
        foul_hour: foulHour,
        description: foulDescription.trim(),
      });
      await loadBranchRecords(selectedBranchId);
      setFoulDescription("");
      setToast({
        mode: "success",
        message: "Falta registrada correctamente",
      });
    } catch (error) {
      setToast({
        mode: "error",
        message:
          error instanceof Error ? error.message : "No se pudo registrar la falta",
      });
    } finally {
      setIsSubmittingFoul(false);
    }
  };

  const handleRegisterSuspention = async () => {
    if (
      !selectedBranchId ||
      !suspentionEmployeeId ||
      !suspentionReason.trim() ||
      !suspentionStart ||
      !suspentionEnd
    ) {
      setToast({
        mode: "error",
        message: "Complete los datos de suspensión",
      });
      return;
    }

    setIsSubmittingSuspention(true);

    try {
      await suspentionApi.create({
        employee_id: suspentionEmployeeId,
        branchId: selectedBranchId,
        suspentionStart: suspentionStart,
        suspentionEnd: suspentionEnd,
        reason: suspentionReason.trim(),
      });
      await loadBranchRecords(selectedBranchId);
      setSuspentionReason("");
      setToast({
        mode: "success",
        message: "Suspensión registrada correctamente",
      });
    } catch (error) {
      setToast({
        mode: "error",
        message:
          error instanceof Error
            ? error.message
            : "No se pudo registrar la suspensión",
      });
    } finally {
      setIsSubmittingSuspention(false);
    }
  };

  const handleRegisterIncapacity = async () => {
    if (
      !selectedBranchId ||
      !incapacityEmployeeId ||
      !incapacityType.trim() ||
      !incapacityStart ||
      !incapacityEnd
    ) {
      setToast({
        mode: "error",
        message: "Complete los datos de incapacidad",
      });
      return;
    }

    setIsSubmittingIncapacity(true);

    try {
      await incapacityApi.create({
        employee_id: incapacityEmployeeId,
        branch_id: selectedBranchId,
        type: incapacityType,
        period_start: incapacityStart,
        period_end: incapacityEnd,
        days_paying: Number(incapacityDays),
        percentage_to_pay: Number(incapacityPercent),
      });
      await loadBranchRecords(selectedBranchId);
      setToast({
        mode: "success",
        message: "Incapacidad registrada correctamente",
      });
    } catch (error) {
      setToast({
        mode: "error",
        message:
          error instanceof Error
            ? error.message
            : "No se pudo registrar la incapacidad",
      });
    } finally {
      setIsSubmittingIncapacity(false);
    }
  };

  const handleCloseSuspention = async (suspentionId: number) => {
    try {
      await suspentionApi.close(suspentionId);
      await loadBranchRecords(selectedBranchId);
      setToast({
        mode: "success",
        message: "Suspensión cerrada correctamente",
      });
    } catch (error) {
      setToast({
        mode: "error",
        message:
          error instanceof Error ? error.message : "No se pudo cerrar la suspensión",
      });
    }
  };

  const handleCloseIncapacity = async (incapacityId: number) => {
    try {
      await incapacityApi.close(incapacityId);
      await loadBranchRecords(selectedBranchId);
      setToast({
        mode: "success",
        message: "Incapacidad cerrada correctamente",
      });
    } catch (error) {
      setToast({
        mode: "error",
        message:
          error instanceof Error ? error.message : "No se pudo cerrar la incapacidad",
      });
    }
  };

  const turnColumns: Column[] = [
    { key: "turn_id", label: "ID", width: "12%" },
    {
      key: "entry",
      label: "Entrada",
      width: "22%",
      render: (value: string) => value.slice(0, 5),
    },
    {
      key: "out",
      label: "Salida",
      width: "22%",
      render: (value: string) => value.slice(0, 5),
    },
    {
      key: "actions",
      label: "Acciones",
      width: "24%",
      render: (_value: unknown, row: HrTurn) => (
        <div className="flex gap-2" onClick={(event) => event.stopPropagation()}>
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setSelectedTurn(row);
              setTurnModalOpen(true);
            }}
          >
            <IconEdit />
          </Button>
          <Button
            type="button"
            variant="danger"
            onClick={() => handleDeleteTurn(row)}
          >
            <IconTrash />
          </Button>
        </div>
      ),
    },
  ];

  const clockingColumns: Column[] = [
    {
      key: "employee_id",
      label: "Empleado",
      width: "24%",
      render: (_value: unknown, row: HrClockingRecord) => (
        <div>
          <p className="font-medium text-gray-900">
            {row.first_name} {row.last_name}
          </p>
          <p className="text-xs text-gray-500">{row.branch_name}</p>
        </div>
      ),
    },
    { key: "clock_in", label: "Entrada", width: "24%" },
    {
      key: "clock_out",
      label: "Salida",
      width: "24%",
      render: (value: string | null) => value ?? "Turno abierto",
    },
    {
      key: "turn_hours",
      label: "Horas",
      width: "14%",
      render: (value: number) => Number(value).toFixed(2),
    },
    {
      key: "clock_out_status",
      label: "Estado",
      width: "14%",
      render: (_value: unknown, row: HrClockingRecord) => (
        <Badge variant={row.clock_out ? "secondary" : "green"}>
          {row.clock_out ? "Cerrado" : "Abierto"}
        </Badge>
      ),
    },
  ];

  const tardinessColumns: Column[] = [
    { key: "type", label: "Tipo", width: "14%" },
    { key: "registered_at", label: "Fecha", width: "20%" },
    { key: "log", label: "Registro", width: "66%" },
  ];

  const foulColumns: Column[] = [
    { key: "identificator", label: "ID", width: "18%" },
    { key: "foul_date", label: "Fecha", width: "18%" },
    { key: "foul_hour", label: "Hora", width: "14%" },
    { key: "description", label: "Descripción", width: "50%" },
  ];

  const suspentionColumns: Column[] = [
    { key: "suspention_start", label: "Inicio", width: "18%" },
    { key: "suspention_end", label: "Fin", width: "18%" },
    { key: "reason", label: "Motivo", width: "48%" },
    {
      key: "actions",
      label: "Acciones",
      width: "16%",
      render: (_value: unknown, row: HrSuspention) => (
        <Button
          type="button"
          variant="warning"
          onClick={() => handleCloseSuspention(row.suspention_id)}
        >
          Cerrar
        </Button>
      ),
    },
  ];

  const incapacityColumns: Column[] = [
    { key: "type", label: "Tipo", width: "16%" },
    { key: "period_start", label: "Inicio", width: "16%" },
    { key: "period_end", label: "Fin", width: "16%" },
    { key: "percentage_to_pay", label: "% pago", width: "14%" },
    { key: "days_paying", label: "Días", width: "10%" },
    {
      key: "actions",
      label: "Acciones",
      width: "16%",
      render: (_value: unknown, row: HrIncapacity) => (
        <Button
          type="button"
          variant="warning"
          onClick={() => handleCloseIncapacity(row.incapacity_id)}
        >
          Cerrar
        </Button>
      ),
    },
  ];

  return (
    <div className="p-6 lg:p-8">
      {toast && (
        <Toast
          mode={toast.mode}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}

      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold text-gray-900">Horarios</h1>
        <p className="text-gray-600">
          Clocking automático, turnos, tardanzas y novedades que afectan la
          nómina.
        </p>
      </div>

      <div className="mb-6 rounded-2xl border border-gray-300 bg-white p-6">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Select
            label="Sucursal"
            value={selectedBranchId}
            onChange={(event) => setSelectedBranchId(event.target.value)}
            options={branches.map((branch) => ({
              value: branch.branch_id,
              label: branch.branch_name,
            }))}
          />
          <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600">
            <p className="font-semibold text-gray-900">Clocking automático</p>
            <p>
              El sistema registra `clock in` al iniciar sesión y `clock out` al
              cerrar sesión.
            </p>
          </div>
          {currentEmployee ? (
            <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600">
              <p className="font-semibold text-gray-900">Mi asignación actual</p>
              <p>
                {branchName} · turno {currentEmployee.turn_id} ·{" "}
                {currentEmployee.turn_type} h
              </p>
            </div>
          ) : (
            <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600">
              <p className="font-semibold text-gray-900">Usuario sin ficha HR</p>
              <p>Este usuario no tiene empleado asociado para clocking propio.</p>
            </div>
          )}
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 xl:grid-cols-4">
        <StatCard
          label="Turnos"
          value={branchTurns.length}
          sublabel={branchName}
          icon={<IconCalendar />}
          accent
        />
        <StatCard
          label="Clockings abiertos"
          value={clockings.filter((clocking) => !clocking.clock_out).length}
          sublabel="Sesiones en curso"
          icon={<IconUsers />}
        />
        <StatCard
          label="Tardanzas"
          value={tardinessTotal}
          sublabel="Últimos 30 días"
          icon={<IconCalendar />}
        />
        <StatCard
          label="Faltas"
          value={foulTotal}
          sublabel="Últimos 30 días"
          icon={<IconUsers />}
        />
      </div>

      <div className="mb-6 grid grid-cols-1 gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-2xl border border-gray-300 bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Turnos</h2>
              <p className="text-sm text-gray-500">
                Defina horarios de entrada y salida por sucursal.
              </p>
            </div>
            <Button onClick={handleOpenCreateTurn}>
              <IconPlus />
              Nuevo turno
            </Button>
          </div>

          <Table
            columns={turnColumns}
            data={branchTurns}
            emptyMessage="No hay turnos configurados para esta sucursal"
          />
        </div>

        <div className="rounded-2xl border border-gray-300 bg-white p-6">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Registros de clocking
            </h2>
            <p className="text-sm text-gray-500">
              Historial de entradas y salidas generadas automáticamente.
            </p>
          </div>

          <Table
            columns={clockingColumns}
            data={clockings}
            isLoading={isLoadingRecords}
            emptyMessage="No hay marcajes registrados para esta sucursal"
          />
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="rounded-2xl border border-gray-300 bg-white p-6">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Registrar falta
            </h2>
            <p className="text-sm text-gray-500">
              Estas faltas alimentan deducciones y reportes de conducta.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Select
              label="Empleado"
              value={foulEmployeeId}
              onChange={(event) => setFoulEmployeeId(event.target.value)}
              options={employeeOptions}
            />
            <Input
              label="Fecha"
              type="date"
              value={foulDate}
              onChange={(event) => setFoulDate(event.target.value)}
            />
            <Input
              label="Hora"
              type="time"
              value={foulHour}
              onChange={(event) => setFoulHour(event.target.value)}
            />
            <Input
              label="Descripción"
              value={foulDescription}
              onChange={(event) => setFoulDescription(event.target.value)}
            />
          </div>

          <div className="mt-4 flex justify-end">
            <Button loading={isSubmittingFoul} onClick={handleRegisterFoul}>
              Registrar falta
            </Button>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-300 bg-white p-6">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Tardanzas</h2>
            <p className="text-sm text-gray-500">
              Se generan automáticamente cuando el clocking cae fuera del turno.
            </p>
          </div>

          <Table
            columns={tardinessColumns}
            data={tardiness}
            isLoading={isLoadingRecords}
            emptyMessage="No hay tardanzas registradas"
          />
        </div>
      </div>

      <div className="mb-6 rounded-2xl border border-gray-300 bg-white p-6">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Faltas</h2>
          <p className="text-sm text-gray-500">
            Historial reciente de fouls registrados manualmente.
          </p>
        </div>

        <Table
          columns={foulColumns}
          data={fouls}
          isLoading={isLoadingRecords}
          emptyMessage="No hay faltas registradas"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="rounded-2xl border border-gray-300 bg-white p-6">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Suspensiones
            </h2>
            <p className="text-sm text-gray-500">
              Registre periodos de suspensión que afecten pagos.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Select
              label="Empleado"
              value={suspentionEmployeeId}
              onChange={(event) => setSuspentionEmployeeId(event.target.value)}
              options={employeeOptions}
            />
            <Input
              label="Motivo"
              value={suspentionReason}
              onChange={(event) => setSuspentionReason(event.target.value)}
            />
            <Input
              label="Inicio"
              type="date"
              value={suspentionStart}
              onChange={(event) => setSuspentionStart(event.target.value)}
            />
            <Input
              label="Fin"
              type="date"
              value={suspentionEnd}
              onChange={(event) => setSuspentionEnd(event.target.value)}
            />
          </div>

          <div className="mt-4 flex justify-end">
            <Button
              loading={isSubmittingSuspention}
              onClick={handleRegisterSuspention}
            >
              Registrar suspensión
            </Button>
          </div>

          <div className="mt-6">
            <Table
              columns={suspentionColumns}
              data={suspentions}
              isLoading={isLoadingRecords}
              emptyMessage="No hay suspensiones activas"
            />
          </div>
        </div>

        <div className="rounded-2xl border border-gray-300 bg-white p-6">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Incapacidades
            </h2>
            <p className="text-sm text-gray-500">
              Controle incapacidades vigentes para el cálculo de nómina.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Select
              label="Empleado"
              value={incapacityEmployeeId}
              onChange={(event) => setIncapacityEmployeeId(event.target.value)}
              options={employeeOptions}
            />
            <Input
              label="Tipo"
              value={incapacityType}
              onChange={(event) => setIncapacityType(event.target.value)}
            />
            <Input
              label="Inicio"
              type="date"
              value={incapacityStart}
              onChange={(event) => setIncapacityStart(event.target.value)}
            />
            <Input
              label="Fin"
              type="date"
              value={incapacityEnd}
              onChange={(event) => setIncapacityEnd(event.target.value)}
            />
            <Input
              label="Días a pagar"
              type="number"
              min="0"
              value={incapacityDays}
              onChange={(event) => setIncapacityDays(event.target.value)}
            />
            <Input
              label="% a pagar"
              type="number"
              min="0"
              step="0.01"
              value={incapacityPercent}
              onChange={(event) => setIncapacityPercent(event.target.value)}
            />
          </div>

          <div className="mt-4 flex justify-end">
            <Button
              loading={isSubmittingIncapacity}
              onClick={handleRegisterIncapacity}
            >
              Registrar incapacidad
            </Button>
          </div>

          <div className="mt-6">
            <Table
              columns={incapacityColumns}
              data={incapacities}
              isLoading={isLoadingRecords}
              emptyMessage="No hay incapacidades activas"
            />
          </div>
        </div>
      </div>

      <TurnEditorModal
        isOpen={turnModalOpen}
        turn={selectedTurn}
        branchName={branchName}
        onClose={() => {
          setTurnModalOpen(false);
          setSelectedTurn(null);
        }}
        onSubmit={handleTurnSubmit}
      />
    </div>
  );
}
