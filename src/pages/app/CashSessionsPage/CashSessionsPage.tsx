import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { useLoaderData } from "react-router-dom";

import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Table } from "@/components/ui/Table";
import { Toast } from "@/components/ui/Toast";

import {
  getCashRegistersByBranches,
  getCashSessions,
  type CashSessionsPageLoaderData,
} from "@/router/loaders/cashRegister.loaders";
import {
  closeCashRegisterSession,
  createCashRegister,
  startCashRegisterSession,
} from "@/router/actions/cashRegister.actions";

import type {
  CashRegister,
  CashRegisterSession,
} from "@/interfaces/entities/CashRegister.interface";
import type { Column } from "@/interfaces/components/ui/TableProps.interface";
import type { ToastMode } from "@/interfaces/components/ui/ToastProps.interface";

import { CashSessionDetailModal } from "./CashSessionDetailModal";

type StatusFilter = "all" | "active" | "inactive";
type SessionAction = "open" | "close";

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "Todas" },
  { value: "active", label: "Activas" },
  { value: "inactive", label: "Cerradas" },
];

const ACTION_OPTIONS: { value: SessionAction; label: string }[] = [
  { value: "open", label: "Abrir sesion" },
  { value: "close", label: "Cerrar sesion" },
];

const formatDate = (value?: string | null) =>
  value ? new Date(value).toLocaleString("es-CR") : "-";

const formatCurrency = (value?: number | null) =>
  value === undefined || value === null
    ? "-"
    : `CRC ${Number(value).toLocaleString("es-CR", {
        minimumFractionDigits: 2,
      })}`;

const sortByOpenedDesc = (data: CashRegisterSession[]) =>
  [...data].sort(
    (a, b) =>
      new Date(b.opened_at ?? 0).getTime() -
      new Date(a.opened_at ?? 0).getTime(),
  );

const parseAmount = (rawAmount: string) => {
  const normalized = rawAmount.trim().replace(",", ".");
  return Number(normalized);
};

const normalizeRegisterName = (name: string) => name.trim();

export function CashSessionsPage() {
  const { branches, initialSessions, initialRegisters } =
    useLoaderData() as CashSessionsPageLoaderData;

  const [branchId, setBranchId] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [actionType, setActionType] = useState<SessionAction>("open");
  const [selectedRegisterId, setSelectedRegisterId] = useState("");
  const [amount, setAmount] = useState("");

  const [registers, setRegisters] = useState<CashRegister[]>(initialRegisters);
  const [newRegisterBranchId, setNewRegisterBranchId] = useState(
    branches[0]?.branch_id ?? "",
  );
  const [newRegisterName, setNewRegisterName] = useState("");
  const [newRegisterIsActive, setNewRegisterIsActive] = useState(true);

  const [sessions, setSessions] = useState<CashRegisterSession[]>(
    sortByOpenedDesc(initialSessions),
  );
  const [sessionsForActions, setSessionsForActions] = useState<
    CashRegisterSession[]
  >(sortByOpenedDesc(initialSessions));

  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCreatingRegister, setIsCreatingRegister] = useState(false);

  const [selected, setSelected] = useState<CashRegisterSession | null>(null);
  const [toast, setToast] = useState<{
    mode: ToastMode;
    message: string;
  } | null>(null);

  const isFirstTableRender = useRef(true);
  const isFirstActionRender = useRef(true);

  useEffect(() => {
    if (isFirstTableRender.current) {
      isFirstTableRender.current = false;
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    const isActive =
      status === "all" ? null : status === "active" ? true : false;

    getCashSessions({
      branchId: branchId || undefined,
      isActive,
    })
      .then((res) => {
        if (cancelled) return;
        setSessions(sortByOpenedDesc(res));
      })
      .catch((err) => {
        setToast({
          mode: "error",
          message:
            err instanceof Error ? err.message : "Error al cargar sesiones",
        });
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [branchId, status]);

  useEffect(() => {
    if (isFirstActionRender.current) {
      isFirstActionRender.current = false;
      return;
    }

    let cancelled = false;

    getCashSessions({
      branchId: branchId || undefined,
    })
      .then((res) => {
        if (cancelled) return;
        setSessionsForActions(sortByOpenedDesc(res));
      })
      .catch((err) => {
        setToast({
          mode: "error",
          message:
            err instanceof Error
              ? err.message
              : "Error al cargar sesiones de caja",
        });
      });

    return () => {
      cancelled = true;
    };
  }, [branchId]);

  useEffect(() => {
    if (!newRegisterBranchId && branchId) {
      setNewRegisterBranchId(branchId);
    }
  }, [branchId, newRegisterBranchId]);

  const branchNameById = useMemo(
    () =>
      new Map(branches.map((branch) => [branch.branch_id, branch.branch_name])),
    [branches],
  );

  const availableRegisters = useMemo(() => {
    const source = branchId
      ? registers.filter((register) => register.branch_id === branchId)
      : registers;

    return [...source].sort((a, b) => {
      const branchA = branchNameById.get(a.branch_id) ?? "";
      const branchB = branchNameById.get(b.branch_id) ?? "";
      const byBranch = branchA.localeCompare(branchB, "es");
      if (byBranch !== 0) return byBranch;
      return a.register_name.localeCompare(b.register_name, "es");
    });
  }, [branchId, branchNameById, registers]);

  useEffect(() => {
    if (
      selectedRegisterId &&
      !availableRegisters.some(
        (register) => register.cash_register_id === selectedRegisterId,
      )
    ) {
      setSelectedRegisterId("");
    }
  }, [availableRegisters, selectedRegisterId]);

  const registerOptions = [
    {
      value: "",
      label: availableRegisters.length
        ? "Seleccione una caja"
        : "No hay cajas disponibles",
    },
    ...availableRegisters.map((register) => ({
      value: register.cash_register_id,
      label: `${register.register_name} - ${branchNameById.get(register.branch_id) ?? "Sucursal"}`,
    })),
  ];

  const activeSessionByRegister = useMemo(() => {
    const map = new Map<string, CashRegisterSession>();
    for (const session of sessionsForActions) {
      if (session.is_active && !map.has(session.cash_register_id)) {
        map.set(session.cash_register_id, session);
      }
    }
    return map;
  }, [sessionsForActions]);

  const latestSessionByRegister = useMemo(() => {
    const map = new Map<string, CashRegisterSession>();
    for (const session of sessionsForActions) {
      if (!map.has(session.cash_register_id)) {
        map.set(session.cash_register_id, session);
      }
    }
    return map;
  }, [sessionsForActions]);

  const selectedRegister =
    availableRegisters.find(
      (register) => register.cash_register_id === selectedRegisterId,
    ) ?? null;

  const selectedActiveSession = selectedRegisterId
    ? (activeSessionByRegister.get(selectedRegisterId) ?? null)
    : null;

  const latestSelectedSession = selectedRegisterId
    ? (latestSessionByRegister.get(selectedRegisterId) ?? null)
    : null;

  const canOpen = !!selectedRegisterId && !selectedActiveSession;
  const canClose = !!selectedRegisterId && !!selectedActiveSession;

  const amountValue = parseAmount(amount);
  const isAmountValid = Number.isFinite(amountValue) && amountValue > 0;

  const actionIsBlocked = actionType === "open" ? !canOpen : !canClose;

  const formBlockedMessage = !selectedRegisterId
    ? "Seleccione una caja para operar."
    : actionType === "open" && selectedActiveSession
      ? "No se puede abrir la sesion porque la caja ya esta abierta."
      : actionType === "close" && !selectedActiveSession
        ? "No se puede cerrar la sesion porque la caja ya esta cerrada."
        : null;

  const selectedRegisterStateMessage = !selectedRegister
    ? "Seleccione una caja para consultar su estado actual."
    : selectedActiveSession
      ? `La caja ${selectedRegister.register_name} esta abierta desde ${formatDate(selectedActiveSession.opened_at)}.`
      : latestSelectedSession
        ? `La caja ${selectedRegister.register_name} esta cerrada. Ultimo cierre: ${formatDate(latestSelectedSession.closed_at)}.`
        : `La caja ${selectedRegister.register_name} no tiene sesiones registradas.`;

  const refreshSessions = async () => {
    const isActive =
      status === "all" ? null : status === "active" ? true : false;

    const [tableSessions, allSessions] = await Promise.all([
      getCashSessions({
        branchId: branchId || undefined,
        isActive,
      }),
      getCashSessions({
        branchId: branchId || undefined,
      }),
    ]);

    setSessions(sortByOpenedDesc(tableSessions));
    setSessionsForActions(sortByOpenedDesc(allSessions));
  };

  const refreshRegisters = async () => {
    const refreshed = await getCashRegistersByBranches(branches);
    setRegisters(refreshed);
  };

  const handleCreateRegister = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const safeRegisterName = normalizeRegisterName(newRegisterName);

    if (!newRegisterBranchId) {
      setToast({
        mode: "error",
        message: "Seleccione una sucursal para crear la caja",
      });
      return;
    }

    if (!safeRegisterName) {
      setToast({
        mode: "error",
        message: "Ingrese un nombre para la caja registradora",
      });
      return;
    }

    setIsCreatingRegister(true);

    try {
      await createCashRegister({
        branchId: newRegisterBranchId,
        registerName: safeRegisterName,
        isActive: newRegisterIsActive,
      });

      await refreshRegisters();
      setNewRegisterName("");
      setNewRegisterIsActive(true);

      setToast({
        mode: "success",
        message: "Caja registradora creada correctamente",
      });
    } catch (err) {
      setToast({
        mode: "error",
        message:
          err instanceof Error
            ? err.message
            : "No se pudo crear la caja registradora",
      });
    } finally {
      setIsCreatingRegister(false);
    }
  };

  const handleSessionSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedRegisterId) {
      setToast({
        mode: "error",
        message: "Seleccione una caja antes de continuar",
      });
      return;
    }

    if (!isAmountValid) {
      setToast({
        mode: "error",
        message: "Ingrese un monto valido mayor que cero",
      });
      return;
    }

    if (actionType === "open" && selectedActiveSession) {
      setToast({
        mode: "error",
        message: "La caja seleccionada ya tiene una sesion abierta",
      });
      return;
    }

    if (actionType === "close" && !selectedActiveSession) {
      setToast({
        mode: "error",
        message: "La caja seleccionada no tiene sesion activa para cerrar",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      if (actionType === "open") {
        await startCashRegisterSession(selectedRegisterId, amountValue);
      } else {
        await closeCashRegisterSession(
          selectedActiveSession!.cash_register_session_id,
          amountValue,
        );
      }

      setIsLoading(true);
      await refreshSessions();
      setAmount("");

      setToast({
        mode: "success",
        message:
          actionType === "open"
            ? "Sesion de caja abierta correctamente"
            : "Sesion de caja cerrada correctamente",
      });
    } catch (err) {
      setToast({
        mode: "error",
        message:
          err instanceof Error ? err.message : "No se pudo procesar la sesion",
      });
    } finally {
      setIsSubmitting(false);
      setIsLoading(false);
    }
  };

  const branchFilterOptions = [
    { value: "", label: "Todas las sucursales" },
    ...branches.map((b) => ({ value: b.branch_id, label: b.branch_name })),
  ];

  const branchCreateOptions = branches.map((branch) => ({
    value: branch.branch_id,
    label: branch.branch_name,
  }));

  const columns: Column[] = [
    {
      key: "opened_at",
      label: "Apertura",
      width: "16%",
      render: (v: string) => formatDate(v),
    },
    {
      key: "closed_at",
      label: "Cierre",
      width: "16%",
      render: (v: string) => formatDate(v),
    },
    { key: "register_name", label: "Caja", width: "14%" },
    { key: "branch_name", label: "Sucursal", width: "14%" },
    {
      key: "opening_amount",
      label: "Monto inicial",
      width: "12%",
      render: (v: number) => formatCurrency(v),
    },
    {
      key: "closing_amount",
      label: "Monto final",
      width: "12%",
      render: (v: number) => formatCurrency(v),
    },
    {
      key: "is_active",
      label: "Estado",
      width: "10%",
      render: (v: boolean) => (
        <Badge variant={v ? "green" : "gray"}>{v ? "Activa" : "Cerrada"}</Badge>
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Sesiones de caja
        </h1>
        <p className="text-gray-600">
          Administre cajas registradoras y sus sesiones por sucursal.
        </p>
      </div>

      <form
        onSubmit={handleCreateRegister}
        className="bg-white rounded-2xl border border-gray-300 p-6 mb-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Crear caja</h2>
          <span className="text-sm text-gray-500">
            {registers.length} caja{registers.length !== 1 ? "s" : ""} en total
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Select
            label="Sucursal"
            value={newRegisterBranchId}
            onChange={(e) => setNewRegisterBranchId(e.target.value)}
            options={branchCreateOptions}
            required
          />
          <Input
            label="Nombre de caja"
            placeholder="Ej: Caja principal"
            value={newRegisterName}
            onChange={(e) => setNewRegisterName(e.target.value)}
            required
          />
          <div className="flex items-end justify-end">
            <Button type="submit" loading={isCreatingRegister}>
              Crear caja
            </Button>
          </div>
        </div>
      </form>

      <form
        onSubmit={handleSessionSubmit}
        className="bg-white rounded-2xl border border-gray-300 p-6 mb-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Select
            label="Sucursal"
            value={branchId}
            onChange={(e) => setBranchId(e.target.value)}
            options={branchFilterOptions}
          />
          <Select
            label="Caja"
            value={selectedRegisterId}
            onChange={(e) => setSelectedRegisterId(e.target.value)}
            options={registerOptions}
            required
          />
          <Select
            label="Accion"
            value={actionType}
            onChange={(e) => setActionType(e.target.value as SessionAction)}
            options={ACTION_OPTIONS.map((option) => ({
              value: option.value,
              label: option.label,
            }))}
          />
          <Input
            label={
              actionType === "open" ? "Monto de apertura" : "Monto de cierre"
            }
            type="number"
            inputMode="decimal"
            min="0.01"
            step="0.01"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
        </div>

        <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm text-gray-600">
              {selectedRegisterStateMessage}
            </p>
            {formBlockedMessage && (
              <p className="text-sm text-red-600 mt-1">{formBlockedMessage}</p>
            )}
          </div>
          <Button
            type="submit"
            size="md"
            loading={isSubmitting}
            disabled={actionIsBlocked || !isAmountValid}
          >
            {actionType === "open" ? "Abrir sesion" : "Cerrar sesion"}
          </Button>
        </div>
      </form>

      <div className="bg-white rounded-2xl border border-gray-300 p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Select
            label="Estado"
            value={status}
            onChange={(e) => setStatus(e.target.value as StatusFilter)}
            options={STATUS_OPTIONS.map((option) => ({
              value: option.value,
              label: option.label,
            }))}
          />
          <div className="flex items-end justify-end text-sm text-gray-500 md:col-span-2">
            {sessions.length} sesion{sessions.length !== 1 ? "es" : ""}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-300 p-6">
        <Table
          columns={columns}
          data={sessions}
          isLoading={isLoading}
          emptyMessage="No hay sesiones de caja registradas"
          onRowClick={(row) => setSelected(row)}
        />
      </div>

      <CashSessionDetailModal
        isOpen={selected !== null}
        session={selected}
        onClose={() => setSelected(null)}
      />
    </div>
  );
}
