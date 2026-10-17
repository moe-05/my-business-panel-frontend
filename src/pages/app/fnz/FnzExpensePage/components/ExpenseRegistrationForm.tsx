import { useState } from "react";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Toast } from "@/components/ui/Toast";
import { ExpenseCategoryComboBox } from "@/components/ui/ExpenseCategoryComboBox";
import { financesApi } from "@/api/finances.api";
import { businessDate } from "@/utils/businessDate";
import { TAX_RATE } from "@/pages/app/pos/CreateSalePage/create-sale.constants";
import type { Branch } from "@/interfaces/entities/Branch.interface";
import type { Currency } from "@/interfaces/entities/Currency.interface";
import type { ExpenseCategory } from "@/interfaces/entities/FnzExpense.interface";
import type { ToastMode } from "@/interfaces/components/ui/ToastProps.interface";

interface Props {
  tenantId: string;
  branches: Branch[];
  categories: ExpenseCategory[];
  currencies: Currency[];
  userId?: string;
  onSuccess: () => void;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

export function ExpenseRegistrationForm({
  tenantId,
  branches,
  categories: _categories,
  currencies,
  userId,
  onSuccess,
}: Props) {
  const vesCurrency =
    currencies.find((c) => c.currency_code === "VES") ?? currencies[0];

  const [form, setForm] = useState({
    category_id: "",
    category_name: "",
    branch_id: branches[0]?.branch_id ?? "",
    description: "",
    // FNZ-GA-08: el gasto se registra en la moneda en que se pago.
    currency_id: String(vesCurrency?.currency_id ?? 1),
    amount: "",
    // IVA del gasto: credito fiscal (entra al reporte de IVA y al asiento).
    tax_amount: "",
    payment_method: "CASH" as
      | "CASH"
      | "BANK"
      | "CREDIT_CARD"
      | "CHECK"
      | "TRANSFER",
    expense_date: businessDate(),
  });
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{
    mode: ToastMode;
    message: string;
  } | null>(null);

  const branchOptions = branches.map((b) => ({
    value: b.branch_id,
    label: b.branch_name,
  }));

  const currencyOptions = currencies.map((c) => ({
    value: String(c.currency_id),
    label: `${c.currency_code} (${c.symbol})`,
  }));
  const selectedCurrency =
    currencies.find((c) => String(c.currency_id) === form.currency_id) ??
    vesCurrency;
  const symbol = selectedCurrency?.symbol ?? "Bs.";

  const paymentOptions = [
    { value: "CASH", label: "Efectivo" },
    { value: "BANK", label: "Transferencia bancaria" },
    { value: "CREDIT_CARD", label: "Tarjeta de crédito" },
    { value: "CHECK", label: "Cheque" },
    { value: "TRANSFER", label: "Transferencia" },
  ];

  const amount = parseFloat(form.amount);
  const tax = form.tax_amount === "" ? 0 : parseFloat(form.tax_amount);
  const amountValid = !isNaN(amount) && amount > 0;
  const taxValid = !isNaN(tax) && tax >= 0;
  const total = amountValid && taxValid ? round2(amount + tax) : 0;

  const applyStandardIva = () => {
    if (!amountValid) return;
    setForm((f) => ({ ...f, tax_amount: String(round2(amount * TAX_RATE)) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.category_id || !form.branch_id || !amountValid || !taxValid) {
      return;
    }

    setSubmitting(true);
    try {
      // El backend recalcula el total (monto + IVA) y lo valida.
      await financesApi.createExpense({
        tenant_id: tenantId,
        branch_id: form.branch_id,
        category_id: form.category_id,
        description: form.description || undefined,
        amount: round2(amount),
        tax_amount: round2(tax),
        total_amount: total,
        currency_id: Number(form.currency_id),
        expense_date: form.expense_date,
        payment_method: form.payment_method,
        created_by: userId,
      });
      setToast({ mode: "success", message: "Gasto registrado correctamente" });
      setForm((f) => ({
        ...f,
        amount: "",
        tax_amount: "",
        description: "",
        category_id: "",
        category_name: "",
      }));
      onSuccess();
    } catch (err) {
      setToast({
        mode: "error",
        message: err instanceof Error ? err.message : "Error al registrar gasto",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {toast && (
        <Toast
          mode={toast.mode}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <ExpenseCategoryComboBox
          tenantId={tenantId}
          label="Categoria"
          value={form.category_id}
          displayValue={form.category_name}
          onChange={(id, name) =>
            setForm((f) => ({ ...f, category_id: id, category_name: name }))
          }
          required
        />
        <Select
          label="Sucursal"
          value={form.branch_id}
          onChange={(e) => setForm((f) => ({ ...f, branch_id: e.target.value }))}
          options={branchOptions}
          required
        />
        <Input
          label="Descripción (opcional)"
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          placeholder="Detalle del gasto"
        />
        <Select
          label="Moneda"
          value={form.currency_id}
          onChange={(e) => setForm((f) => ({ ...f, currency_id: e.target.value }))}
          options={currencyOptions}
          required
        />
        <Input
          label={`Monto sin IVA (${symbol})`}
          type="number"
          min={0.01}
          step="0.01"
          value={form.amount}
          onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
          placeholder="0.00"
          required
        />
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <Input
              label={`IVA (${symbol}, opcional)`}
              type="number"
              min={0}
              step="0.01"
              value={form.tax_amount}
              onChange={(e) =>
                setForm((f) => ({ ...f, tax_amount: e.target.value }))
              }
              placeholder="0.00"
            />
          </div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={applyStandardIva}
            disabled={!amountValid}
          >
            IVA {Math.round(TAX_RATE * 100)}%
          </Button>
        </div>
        <p className="text-sm text-gray-600">
          Total:{" "}
          <span className="font-semibold text-gray-900">
            {symbol} {total.toLocaleString("es-VE", { minimumFractionDigits: 2 })}
          </span>
        </p>
        <Select
          label="Método de pago"
          value={form.payment_method}
          onChange={(e) =>
            setForm((f) => ({
              ...f,
              payment_method: e.target.value as typeof form.payment_method,
            }))
          }
          options={paymentOptions}
          required
        />
        <Input
          label="Fecha"
          type="date"
          value={form.expense_date}
          onChange={(e) => setForm((f) => ({ ...f, expense_date: e.target.value }))}
          required
        />
        <Button
          type="submit"
          variant="primary"
          fullWidth
          loading={submitting}
          disabled={
            submitting ||
            !form.category_id ||
            !form.branch_id ||
            !amountValid ||
            !taxValid
          }
        >
          Registrar gasto
        </Button>
      </form>
    </>
  );
}
