import { useMemo, useState } from "react";
import { useLoaderData } from "react-router-dom";

import { purchaseApi } from "@/api/purchase.api";

import { useAuth } from "@/context/AuthContext";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { StatCard } from "@/components/ui/StatCard";
import { Table } from "@/components/ui/Table";
import { Toast } from "@/components/ui/Toast";

import {
  IconCheckCircle,
  IconCreditCard,
  IconEye,
  IconShoppingCart,
} from "@/assets/icons";

import { PurchaseOrderDetailPanel } from "@/pages/app/SupplyChain/PurchaseOrderDetailPanel";

import type { CreatePurchasePaymentRequest } from "@/interfaces/api/requests/PurchaseModuleRequests.interface";
import type { ToastMode } from "@/interfaces/components/ui/ToastProps.interface";
import type {
  PurchaseAccountPayable,
  PurchaseMatching,
  PurchaseOrderDetail,
} from "@/interfaces/entities/Purchase.interface";
import type { AccountsPayablePageLoaderData } from "@/router/loaders/purchase.loaders";

import {
  formatCurrency,
  formatDate,
  getOrderStatusTone,
  getPayableStatusTone,
} from "@/utils/purchase";

interface PaymentFormState {
  purchase_account_payable_id: string;
  amount_paid: string;
  payment_method_id: string;
  payment_reference: string;
}

const emptyPaymentForm: PaymentFormState = {
  purchase_account_payable_id: "",
  amount_paid: "",
  payment_method_id: "",
  payment_reference: "",
};

export function AccountsPayablePage() {
  const {
    payables: initialPayables,
    catalogs,
    currentTenantName,
    isSuperuser,
    tenants,
  } = useLoaderData() as AccountsPayablePageLoaderData;
  const { user } = useAuth();

  const canManage = user?.role.role_id === 1 || user?.role.role_id === 2;

  const [payables, setPayables] = useState<PurchaseAccountPayable[]>(
    initialPayables,
  );
  const [search, setSearch] = useState("");
  const [tenantFilter, setTenantFilter] = useState("all");
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedPayable, setSelectedPayable] =
    useState<PurchaseAccountPayable | null>(null);
  const [paymentForm, setPaymentForm] =
    useState<PaymentFormState>(emptyPaymentForm);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrderDetail | null>(
    null,
  );
  const [selectedMatching, setSelectedMatching] = useState<PurchaseMatching | null>(
    null,
  );
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [toast, setToast] = useState<{
    mode: ToastMode;
    message: string;
  } | null>(null);

  const filteredPayables = useMemo(() => {
    const query = search.trim().toLowerCase();

    return payables.filter((payable) => {
      const matchesTenant =
        !isSuperuser ||
        tenantFilter === "all" ||
        payable.tenant_id === tenantFilter;

      if (!matchesTenant) return false;
      if (!query) return true;

      return (
        payable.purchase_order_id.toLowerCase().includes(query) ||
        payable.supplier_name.toLowerCase().includes(query) ||
        (payable.invoice_number ?? "").toLowerCase().includes(query) ||
        (payable.tenant_name ?? "").toLowerCase().includes(query)
      );
    });
  }, [isSuperuser, payables, search, tenantFilter]);

  const stats = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return {
      total: filteredPayables.length,
      open: filteredPayables.filter((item) => !item.is_paid).length,
      overdue: filteredPayables.filter(
        (item) => !item.is_paid && item.due_date < today,
      ).length,
      balance: filteredPayables.reduce(
        (acc, item) => acc + Number(item.balance_due ?? 0),
        0,
      ),
    };
  }, [filteredPayables]);

  const openDetail = async (purchaseOrderId: string) => {
    setIsDetailOpen(true);
    setIsDetailLoading(true);
    try {
      const [order, matching] = await Promise.all([
        purchaseApi.getOrderById(purchaseOrderId),
        purchaseApi.getMatching(purchaseOrderId).catch(
          () =>
            ({
              purchase_order_id: purchaseOrderId,
              matching_found: false,
            }) as PurchaseMatching,
        ),
      ]);

      setSelectedOrder(order);
      setSelectedMatching(matching);
    } catch (error) {
      setToast({
        mode: "error",
        message:
          error instanceof Error
            ? error.message
            : "No se pudo cargar el detalle de la cuenta",
      });
      setIsDetailOpen(false);
    } finally {
      setIsDetailLoading(false);
    }
  };

  const openPaymentModal = (payable: PurchaseAccountPayable) => {
    setSelectedPayable(payable);
    setPaymentForm({
      purchase_account_payable_id: payable.purchase_account_payable_id,
      amount_paid: String(Number(payable.balance_due ?? 0)),
      payment_method_id: String(
        catalogs.payment_methods[0]?.payment_method_id ?? "",
      ),
      payment_reference: "",
    });
    setPaymentError(null);
    setIsPaymentModalOpen(true);
  };

  const handleRegisterPayment = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (!selectedPayable) return;

    const amount = Number(paymentForm.amount_paid);
    const paymentMethodId = Number(paymentForm.payment_method_id);
    const maxAmount = Number(selectedPayable.balance_due ?? 0);

    if (!amount || amount <= 0) {
      setPaymentError("Ingrese un monto válido para el abono");
      return;
    }

    if (!paymentMethodId) {
      setPaymentError("Seleccione un método de pago");
      return;
    }

    if (amount > maxAmount) {
      setPaymentError("El abono no puede superar el saldo pendiente");
      return;
    }

    setPaymentError(null);
    setIsSubmittingPayment(true);

    try {
      const payload: CreatePurchasePaymentRequest = {
        purchase_account_payable_id: selectedPayable.purchase_account_payable_id,
        amount_paid: amount,
        payment_method_id: paymentMethodId,
        payment_reference: paymentForm.payment_reference || undefined,
      };

      const response = await purchaseApi.registerPayment(payload);

      setPayables((prev) =>
        prev.map((item) =>
          item.purchase_account_payable_id ===
          selectedPayable.purchase_account_payable_id
            ? {
                ...item,
                ...response.purchase_account_payable,
                amount_paid: response.purchase_account_payable.amount_paid,
                balance_due: response.purchase_account_payable.balance_due,
                total_amount: response.purchase_account_payable.total_amount,
                due_date: response.purchase_account_payable.due_date,
              }
            : item,
        ),
      );

      if (selectedOrder?.purchase_order_id === response.order.purchase_order_id) {
        setSelectedOrder(response.order);
        const matching = await purchaseApi.getMatching(
          response.order.purchase_order_id,
        );
        setSelectedMatching(matching);
      }

      setToast({ mode: "success", message: "Abono registrado correctamente" });
      setIsPaymentModalOpen(false);
      setSelectedPayable(null);
      setPaymentForm(emptyPaymentForm);
    } catch (error) {
      setToast({
        mode: "error",
        message:
          error instanceof Error ? error.message : "No se pudo registrar el abono",
      });
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  return (
    <div className="p-6 lg:p-8">
      {toast && (
        <Toast
          mode={toast.mode}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}

      <section className="mb-6 rounded-[2rem] border border-amber-200 bg-[radial-gradient(circle_at_top_left,rgba(251,191,36,0.16),transparent_36%),linear-gradient(135deg,rgba(255,251,235,1),rgba(255,255,255,1)_58%,rgba(255,247,237,1))] p-6 shadow-[0_18px_40px_-24px_rgba(146,64,14,0.32)]">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-700">
              Supply Chain
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-gray-950">
              Cuentas por pagar
            </h1>
            <p className="mt-2 text-sm leading-6 text-gray-600">
              Monitoree el saldo vivo de las compras y registre abonos conforme
              se insertan pagos en el backend.
            </p>
          </div>

          <div className="rounded-2xl border border-white/80 bg-white/85 px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500">
              Contexto principal
            </p>
            <p className="mt-1 text-sm font-medium text-gray-900">
              {currentTenantName}
            </p>
          </div>
        </div>
      </section>

      <section className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Registros visibles"
          value={String(stats.total)}
          icon={<IconShoppingCart />}
          sublabel="Cuentas por pagar según filtros"
          accent
        />
        <StatCard
          label="Abiertas"
          value={String(stats.open)}
          icon={<IconCreditCard />}
          sublabel="Con saldo pendiente"
        />
        <StatCard
          label="Vencidas"
          value={String(stats.overdue)}
          icon={<IconCheckCircle />}
          sublabel="Requieren atención inmediata"
        />
        <StatCard
          label="Saldo pendiente"
          value={formatCurrency(stats.balance)}
          icon={<IconCreditCard />}
          sublabel="Monto total todavía por cubrir"
        />
      </section>

      <section className="mb-6 rounded-3xl border border-gray-200 bg-white p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex flex-1 flex-col gap-4 lg:flex-row">
            <Input
              label="Buscar cuenta"
              placeholder="Buscar por orden, proveedor, factura o tenant"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="w-full lg:max-w-md"
            />

            {isSuperuser && (
              <Select
                label="Filtrar tenant"
                value={tenantFilter}
                onChange={(event) => setTenantFilter(event.target.value)}
                options={[
                  { value: "all", label: "Todos los tenants" },
                  ...tenants.map((tenant) => ({
                    value: tenant.tenant_id,
                    label: tenant.tenant_name,
                  })),
                ]}
                className="w-full lg:max-w-xs"
              />
            )}
          </div>

          <span className="text-sm text-gray-500">
            {filteredPayables.length} cuenta
            {filteredPayables.length === 1 ? "" : "s"} visible
            {filteredPayables.length === 1 ? "" : "s"}
          </span>
        </div>
      </section>

      <section className="rounded-3xl border border-gray-200 bg-white p-6">
        <Table
          columns={[
            { key: "supplier_name", label: "Proveedor", width: "17%" },
            {
              key: "purchase_order_id",
              label: "Orden",
              width: "12%",
              render: (value) => (
                <span className="font-mono text-xs text-gray-500">
                  {String(value).slice(0, 8)}…
                </span>
              ),
            },
            {
              key: "account_payable_status_name",
              label: "Estado CxP",
              width: "12%",
              render: (value) => (
                <Badge variant={getPayableStatusTone(String(value))}>
                  {String(value)}
                </Badge>
              ),
            },
            {
              key: "purchase_order_status_name",
              label: "Estado orden",
              width: "12%",
              render: (value) => (
                <Badge variant={getOrderStatusTone(String(value))}>
                  {String(value)}
                </Badge>
              ),
            },
            {
              key: "due_date",
              label: "Vence",
              width: "10%",
              render: (value) => formatDate(String(value)),
            },
            {
              key: "total_amount",
              label: "Total",
              width: "11%",
              render: (value) => formatCurrency(value as number | string),
            },
            {
              key: "amount_paid",
              label: "Abonado",
              width: "11%",
              render: (value) => formatCurrency(value as number | string),
            },
            {
              key: "balance_due",
              label: "Pendiente",
              width: "11%",
              render: (value) => formatCurrency(value as number | string),
            },
            ...(isSuperuser
              ? [
                  {
                    key: "tenant_name",
                    label: "Tenant",
                    width: "12%",
                  },
                ]
              : []),
            {
              key: "actions",
              label: "Acciones",
              width: isSuperuser ? "16%" : "18%",
              render: (_value, payable: PurchaseAccountPayable) => (
                <div className="flex flex-wrap gap-2" onClick={(e) => e.stopPropagation()}>
                  <Button
                    variant="ghost"
                    title="Ver detalle"
                    onClick={() => openDetail(payable.purchase_order_id)}
                  >
                    <IconEye />
                  </Button>
                  {canManage && !payable.is_paid && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => openPaymentModal(payable)}
                    >
                      Registrar abono
                    </Button>
                  )}
                </div>
              ),
            },
          ]}
          data={filteredPayables}
          emptyMessage="No hay cuentas por pagar para mostrar"
          onRowClick={(row) =>
            openDetail((row as PurchaseAccountPayable).purchase_order_id)
          }
        />
      </section>

      <Modal
        isOpen={isPaymentModalOpen}
        onClose={() => {
          setIsPaymentModalOpen(false);
          setSelectedPayable(null);
          setPaymentForm(emptyPaymentForm);
          setPaymentError(null);
        }}
        title="Registrar abono"
      >
        <form className="space-y-4" onSubmit={handleRegisterPayment}>
          {selectedPayable && (
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <p className="text-sm font-semibold text-gray-900">
                {selectedPayable.supplier_name}
              </p>
              <p className="mt-1 text-xs text-gray-500">
                Orden {selectedPayable.purchase_order_id}
              </p>
              <p className="mt-3 text-sm text-gray-600">
                Saldo pendiente actual:
                {" "}
                <span className="font-semibold text-gray-900">
                  {formatCurrency(selectedPayable.balance_due)}
                </span>
              </p>
            </div>
          )}

          <Input
            label="Monto del abono"
            type="number"
            min="0.01"
            step="0.001"
            value={paymentForm.amount_paid}
            onChange={(event) =>
              setPaymentForm((prev) => ({
                ...prev,
                amount_paid: event.target.value,
              }))
            }
            required
          />

          <Select
            label="Método de pago"
            value={paymentForm.payment_method_id}
            onChange={(event) =>
              setPaymentForm((prev) => ({
                ...prev,
                payment_method_id: event.target.value,
              }))
            }
            options={catalogs.payment_methods.map((method) => ({
              value: method.payment_method_id,
              label: method.name
                .split("_")
                .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
                .join(" "),
            }))}
            placeholder="Seleccionar método"
            required
          />

          <Input
            label="Referencia"
            value={paymentForm.payment_reference}
            onChange={(event) =>
              setPaymentForm((prev) => ({
                ...prev,
                payment_reference: event.target.value,
              }))
            }
            hint="Número de transferencia, voucher o comentario breve."
          />

          {paymentError && <p className="text-xs text-red-500">{paymentError}</p>}

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="ghost"
              disabled={isSubmittingPayment}
              onClick={() => {
                setIsPaymentModalOpen(false);
                setSelectedPayable(null);
                setPaymentForm(emptyPaymentForm);
                setPaymentError(null);
              }}
            >
              Cancelar
            </Button>
            <Button type="submit" loading={isSubmittingPayment}>
              Registrar pago
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedOrder(null);
          setSelectedMatching(null);
        }}
        title="Detalle de la cuenta"
        size="lg"
      >
        {isDetailLoading || !selectedOrder ? (
          <div className="space-y-4">
            <div className="h-24 animate-pulse rounded-3xl bg-gray-100" />
            <div className="h-56 animate-pulse rounded-3xl bg-gray-100" />
          </div>
        ) : (
          <PurchaseOrderDetailPanel
            order={selectedOrder}
            matching={selectedMatching}
            showTenant={isSuperuser}
          />
        )}
      </Modal>
    </div>
  );
}
