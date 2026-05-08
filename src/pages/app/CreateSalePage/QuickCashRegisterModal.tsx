import { useEffect, useState } from "react";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Toast } from "@/components/ui/Toast";
import { Badge } from "@/components/ui/Badge";

import { useAuth } from "@/context/AuthContext";

import {
  closeCashRegisterSession,
  getCashRegistersByBranch,
  getOpenCashSessionsByBranch,
  startCashRegisterSession,
} from "@/router/actions/cashRegister.actions";
import { cashRegisterApi } from "@/api/cashRegister.api";

import type {
  CashRegister,
  CashRegisterSession,
} from "@/interfaces/entities/CashRegister.interface";
import type { ToastMode } from "@/interfaces/components/ui/ToastProps.interface";

interface Props {
  isOpen: boolean;
  branchId: string;
  branchName?: string;
  onClose: () => void;
  onSessionsChanged: () => void | Promise<void>;
}

interface RegisterRow {
  register: CashRegister;
  session: CashRegisterSession | null;
}

const formatAmount = (n: number) =>
  n.toLocaleString("es-CR", { minimumFractionDigits: 2 });

export function QuickCashRegisterModal({
  isOpen,
  branchId,
  branchName,
  onClose,
  onSessionsChanged,
}: Props) {
  const { user } = useAuth();
  const roleName = user?.role.role_name ?? "";
  // Admin and superuser bypass the key check both client-side and server-side.
  const requiresKey = roleName !== "admin" && roleName !== "superuser";
  const canDelete = roleName === "admin" || roleName === "superuser";

  const [rows, setRows] = useState<RegisterRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [busyRegisterId, setBusyRegisterId] = useState<string | null>(null);
  const [amountByRegister, setAmountByRegister] = useState<
    Record<string, string>
  >({});
  const [keyByRegister, setKeyByRegister] = useState<Record<string, string>>(
    {},
  );
  const [toast, setToast] = useState<{
    mode: ToastMode;
    message: string;
  } | null>(null);

  const refresh = async () => {
    if (!branchId) return;
    setIsLoading(true);
    try {
      const [registers, openSessions] = await Promise.all([
        getCashRegistersByBranch(branchId),
        getOpenCashSessionsByBranch(branchId),
      ]);
      const sessionByRegister = new Map(
        openSessions.map((s) => [s.cash_register_id, s] as const),
      );
      setRows(
        registers.map((register) => ({
          register,
          session: sessionByRegister.get(register.cash_register_id) ?? null,
        })),
      );
    } catch (error) {
      setToast({
        mode: "error",
        message:
          error instanceof Error
            ? error.message
            : "Error al cargar las cajas registradoras",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    setAmountByRegister({});
    setKeyByRegister({});
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, branchId]);

  const setAmount = (registerId: string, value: string) =>
    setAmountByRegister((prev) => ({ ...prev, [registerId]: value }));

  const setKey = (registerId: string, value: string) =>
    setKeyByRegister((prev) => ({ ...prev, [registerId]: value }));

  const parseAmount = (raw: string | undefined): number | null => {
    if (raw === undefined || raw === "") return null;
    const value = Number(raw.replace(",", "."));
    if (!Number.isFinite(value) || value < 0) return null;
    return value;
  };

  const handleOpen = async (row: RegisterRow) => {
    const amount = parseAmount(amountByRegister[row.register.cash_register_id]);
    if (amount === null) {
      setToast({
        mode: "error",
        message: "Ingrese un monto de apertura válido",
      });
      return;
    }
    const key = (keyByRegister[row.register.cash_register_id] ?? "").trim();
    if (requiresKey && !key) {
      setToast({
        mode: "error",
        message: "Ingrese la clave de la caja para abrir la sesión",
      });
      return;
    }
    setBusyRegisterId(row.register.cash_register_id);
    try {
      await startCashRegisterSession(
        row.register.cash_register_id,
        amount,
        undefined,
        requiresKey ? key : undefined,
      );
      setToast({
        mode: "success",
        message: `Sesión abierta en ${row.register.register_name}`,
      });
      setKey(row.register.cash_register_id, "");
      await refresh();
      await onSessionsChanged();
    } catch (error) {
      setToast({
        mode: "error",
        message:
          error instanceof Error ? error.message : "Error al abrir la sesión",
      });
    } finally {
      setBusyRegisterId(null);
    }
  };

  const handleClose = async (row: RegisterRow) => {
    if (!row.session) return;
    const amount = parseAmount(amountByRegister[row.register.cash_register_id]);
    if (amount === null) {
      setToast({
        mode: "error",
        message: "Ingrese un monto de cierre válido",
      });
      return;
    }
    const key = (keyByRegister[row.register.cash_register_id] ?? "").trim();
    if (requiresKey && !key) {
      setToast({
        mode: "error",
        message: "Ingrese la clave de la caja para cerrar la sesión",
      });
      return;
    }
    if (!confirm(`¿Cerrar la sesión activa de ${row.register.register_name}?`))
      return;

    setBusyRegisterId(row.register.cash_register_id);
    try {
      await closeCashRegisterSession(
        row.session.cash_register_session_id,
        amount,
        undefined,
        requiresKey ? key : undefined,
      );
      setToast({
        mode: "success",
        message: `Sesión cerrada en ${row.register.register_name}`,
      });
      setKey(row.register.cash_register_id, "");
      await refresh();
      await onSessionsChanged();
    } catch (error) {
      setToast({
        mode: "error",
        message:
          error instanceof Error ? error.message : "Error al cerrar la sesión",
      });
    } finally {
      setBusyRegisterId(null);
    }
  };

  const handleDelete = async (row: RegisterRow) => {
    if (row.session) {
      setToast({
        mode: "error",
        message: "No se puede eliminar una caja con sesión activa.",
      });
      return;
    }
    if (!confirm(`¿Eliminar la caja "${row.register.register_name}"? Esta acción no se puede deshacer.`))
      return;
    setBusyRegisterId(row.register.cash_register_id);
    try {
      await cashRegisterApi.remove(row.register.cash_register_id);
      setToast({ mode: "success", message: "Caja eliminada" });
      await refresh();
      await onSessionsChanged();
    } catch (error) {
      setToast({
        mode: "error",
        message: error instanceof Error ? error.message : "Error al eliminar la caja",
      });
    } finally {
      setBusyRegisterId(null);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Cajas${branchName ? ` · ${branchName}` : ""}`}
      size="md"
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
      ) : rows.length === 0 ? (
        <p className="py-6 text-center text-sm text-gray-500">
          La sucursal no tiene cajas registradoras configuradas.
        </p>
      ) : (
        <div className="space-y-3">
          {rows.map((row) => {
            const isBusy =
              busyRegisterId === row.register.cash_register_id;
            const isActive = !!row.session;
            const amountValue =
              amountByRegister[row.register.cash_register_id] ?? "";

            return (
              <div
                key={row.register.cash_register_id}
                className="rounded-xl border border-gray-200 bg-white p-4"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {row.register.register_name ||
                        row.register.cash_register_id}
                    </p>
                    {isActive && row.session && (
                      <p className="text-xs text-gray-500 mt-0.5">
                        Apertura: ₡{formatAmount(row.session.opening_amount)} ·{" "}
                        {new Date(row.session.opened_at).toLocaleString(
                          "es-CR",
                        )}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {isActive ? (
                      <Badge variant="green">Abierta</Badge>
                    ) : (
                      <Badge variant="gray">Cerrada</Badge>
                    )}
                    {canDelete && !isActive && (
                      <button
                        type="button"
                        onClick={() => handleDelete(row)}
                        disabled={isBusy}
                        className="text-xs font-medium text-red-500 hover:text-red-700 disabled:opacity-40"
                        title="Eliminar caja"
                      >
                        Eliminar
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-end gap-3">
                    <div className="flex-1">
                      <Input
                        label={
                          isActive ? "Monto de cierre" : "Monto de apertura"
                        }
                        type="number"
                        min={0}
                        step="0.01"
                        placeholder="0.00"
                        value={amountValue}
                        onChange={(e) =>
                          setAmount(
                            row.register.cash_register_id,
                            e.target.value,
                          )
                        }
                        disabled={isBusy}
                        required
                      />
                    </div>
                    {isActive ? (
                      <Button
                        type="button"
                        variant="danger"
                        onClick={() => handleClose(row)}
                        loading={isBusy}
                      >
                        Cerrar
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        variant="primary"
                        onClick={() => handleOpen(row)}
                        loading={isBusy}
                      >
                        Abrir
                      </Button>
                    )}
                  </div>
                  {requiresKey && (
                    <Input
                      label="Clave de la caja"
                      type="password"
                      placeholder="Solicítala al administrador"
                      value={keyByRegister[row.register.cash_register_id] ?? ""}
                      onChange={(e) =>
                        setKey(row.register.cash_register_id, e.target.value)
                      }
                      disabled={isBusy}
                      required
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="flex justify-end pt-4 mt-4 border-t border-gray-100">
        <Button type="button" variant="ghost" onClick={onClose}>
          Cerrar
        </Button>
      </div>
    </Modal>
  );
}
