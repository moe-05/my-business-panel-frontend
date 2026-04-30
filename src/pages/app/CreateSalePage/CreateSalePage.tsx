import { useCallback, useEffect, useMemo, useState } from "react";
import { useLoaderData } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { useAuth } from "@/context/AuthContext";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Toast } from "@/components/ui/Toast";
import { Badge } from "@/components/ui/Badge";
import { Table } from "@/components/ui/Table";
import {
  ProductVariantComboBox,
  type ProductVariantSelection,
} from "@/components/ui/ProductVariantComboBox";
import {
  IconPlus,
  IconShoppingCart,
  IconTrash,
  IconTrendingUp,
  IconUser,
  IconX,
} from "@/assets/icons";

import { createCustomer } from "@/router/actions/customer.actions";
import { createFullSale } from "@/router/actions/sale.actions";
import {
  getCashRegistersByBranch,
  getOpenCashSessionsByBranch,
} from "@/router/actions/cashRegister.actions";

import { customerApi } from "@/api/customer.api";
import { useUniqueAvailability } from "@/hooks/useUniqueAvailability";

import { identificationTypes } from "@/constants/identification-types";
import { paymentMethods, currencies } from "@/constants/payment-methods";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

import type { CreateSalePageLoaderData } from "@/router/loaders/sale.loaders";
import type { Customer } from "@/interfaces/entities/Customer.interface";
import type { CashRegister } from "@/interfaces/entities/CashRegister.interface";
import type { CreateSaleRequest } from "@/interfaces/api/requests/CreateSaleRequest.interface";
import type {
  SaleItemPayload,
  CreateSaleResult,
} from "@/interfaces/entities/Sale.interface";
import type { Column } from "@/interfaces/components/ui/TableProps.interface";
import type { ToastMode } from "@/interfaces/components/ui/ToastProps.interface";

import {
  customerLookupSchema,
  type CustomerLookupForm,
  inlineCustomerSchema,
  type InlineCustomerForm,
  saleItemSchema,
  type SaleItemForm,
} from "./create-sale.schema";

import { SaleResultModal } from "./SaleResultModal";
import { getCustomerByDocNumber } from "@/router/loaders/customer.loaders";
import {
  ApplyPromotionModal,
  type AppliedPromotion,
} from "./ApplyPromotionModal";
import { QuickCashRegisterModal } from "./QuickCashRegisterModal";

interface CartItem {
  id: string;
  product_variant_id: string;
  variant_name: string;
  sku?: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

const TAX_RATE = 0.13;

const formatAmount = (value: number, symbol: string) =>
  `${symbol} ${value.toLocaleString("es-CR", { minimumFractionDigits: 2 })}`;

const blankCustomer = (): InlineCustomerForm => ({
  first_name: "",
  last_name: "",
  document_type_id: 1,
  document_number: "",
  email: "",
  phone: "",
});

const buildVariantLabel = (selection: ProductVariantSelection) =>
  selection.sku
    ? `${selection.variant_name} (${selection.sku})`
    : selection.variant_name;

export function CreateSalePage() {
  const { branches, saleConditions } =
    useLoaderData() as CreateSalePageLoaderData;
  const { user } = useAuth();

  const tenantId = user?.tenant?.tenant_id ?? "";

  const defaultBranchId = branches[0]?.branch_id ?? "";
  const defaultCondition = saleConditions[0]?.condition_code ?? "01";
  const defaultCurrency = currencies[0];
  const defaultPaymentMethod = paymentMethods[0];

  const [branchId, setBranchId] = useState(defaultBranchId);
  const [saleCondition, setSaleCondition] = useState(defaultCondition);
  const [currencyId, setCurrencyId] = useState<number>(defaultCurrency.value);
  const [paymentMethodId, setPaymentMethodId] = useState<number>(
    defaultPaymentMethod.value,
  );
  const [hasElectronicInvoice, setHasElectronicInvoice] = useState(false);
  const [cashRegisters, setCashRegisters] = useState<CashRegister[]>([]);
  const [cashRegisterId, setCashRegisterId] = useState("");
  const [isLoadingCashRegisters, setIsLoadingCashRegisters] = useState(false);

  const [step, setStep] = useState<"lookup" | "items">("lookup");
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [showInlineCreate, setShowInlineCreate] = useState(false);
  // Walk-in / counter sale: no customer attached. The DB columns
  // (sale.tenant_customer_id and customer_payment.tenant_customer_id) are
  // nullable, so we send null for those rows.
  const [isWalkInSale, setIsWalkInSale] = useState(false);

  const [items, setItems] = useState<CartItem[]>([]);
  const [lastItemAmount, setLastItemAmount] = useState(0);
  const [selectedVariant, setSelectedVariant] =
    useState<ProductVariantSelection | null>(null);
  const [isPromotionModalOpen, setIsPromotionModalOpen] = useState(false);
  const [appliedPromotion, setAppliedPromotion] =
    useState<AppliedPromotion | null>(null);
  const [isCashRegisterModalOpen, setIsCashRegisterModalOpen] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{
    mode: ToastMode;
    message: string;
  } | null>(null);

  const [resultModal, setResultModal] = useState<{
    open: boolean;
    saleId: string | null;
    total: number;
    eInvoiceWarning?: string;
    hadElectronicInvoice: boolean;
  }>({
    open: false,
    saleId: null,
    total: 0,
    hadElectronicInvoice: false,
  });

  const lookupForm = useForm<CustomerLookupForm>({
    resolver: zodResolver(customerLookupSchema),
    defaultValues: { document_number: "" },
  });

  const inlineCustomerForm = useForm<InlineCustomerForm>({
    resolver: zodResolver(inlineCustomerSchema),
    defaultValues: blankCustomer(),
  });

  // Live uniqueness probes for the inline-creation flow. We only fire them
  // while the inline section is open and a tenant is known.
  const inlineDoc = inlineCustomerForm.watch("document_number") ?? "";
  const inlineEmail = inlineCustomerForm.watch("email") ?? "";
  const inlinePhone = inlineCustomerForm.watch("phone") ?? "";

  const checkInlineDoc = useCallback(
    async (value: string) => {
      if (!tenantId) return false;
      const { exists } = await customerApi.checkAvailability({
        tenantId,
        field: "document_number",
        value,
      });
      return exists;
    },
    [tenantId],
  );

  const checkInlineEmail = useCallback(
    async (value: string) => {
      if (!tenantId) return false;
      const { exists } = await customerApi.checkAvailability({
        tenantId,
        field: "email",
        value,
      });
      return exists;
    },
    [tenantId],
  );

  const checkInlinePhone = useCallback(
    async (value: string) => {
      if (!tenantId) return false;
      const { exists } = await customerApi.checkAvailability({
        tenantId,
        field: "phone",
        value,
      });
      return exists;
    },
    [tenantId],
  );

  const inlineDocStatus = useUniqueAvailability(inlineDoc, checkInlineDoc, {
    skip: !showInlineCreate || !tenantId,
    minLength: 3,
  });

  const inlineEmailStatus = useUniqueAvailability(
    inlineEmail,
    checkInlineEmail,
    {
      skip: !showInlineCreate || !tenantId || !inlineEmail,
      minLength: 5,
      isWellFormed: (value) => EMAIL_REGEX.test(value),
    },
  );

  const inlinePhoneStatus = useUniqueAvailability(
    inlinePhone,
    checkInlinePhone,
    {
      skip: !showInlineCreate || !tenantId || !inlinePhone,
      minLength: 5,
    },
  );

  const inlineUniquenessBlocked =
    inlineDocStatus === "taken" ||
    inlineEmailStatus === "taken" ||
    inlinePhoneStatus === "taken";

  const inlineUniquenessProbing =
    inlineDocStatus === "checking" ||
    inlineEmailStatus === "checking" ||
    inlinePhoneStatus === "checking";

  const itemForm = useForm<SaleItemForm>({
    resolver: zodResolver(saleItemSchema),
    defaultValues: {
      product_variant_id: "",
      quantity: 1,
      unit_price: 0,
    },
  });

  const grossSubtotal = useMemo(
    () => items.reduce((acc, item) => acc + item.total_price, 0),
    [items],
  );
  const discountAmount = useMemo(
    () => Number((appliedPromotion?.totalDiscount ?? 0).toFixed(2)),
    [appliedPromotion],
  );
  const subtotal = useMemo(
    () => Number(Math.max(grossSubtotal - discountAmount, 0).toFixed(2)),
    [grossSubtotal, discountAmount],
  );
  const taxAmount = useMemo(
    () => Number((subtotal * TAX_RATE).toFixed(2)),
    [subtotal],
  );
  const totalAmount = useMemo(
    () => subtotal + taxAmount,
    [subtotal, taxAmount],
  );

  const currencySymbol =
    currencies.find((c) => c.value === currencyId)?.symbol ?? "₡";

  const refreshOpenCashRegisters = useCallback(async () => {
    if (!branchId) {
      setCashRegisters([]);
      setCashRegisterId("");
      return;
    }

    setIsLoadingCashRegisters(true);
    try {
      const [rows, openSessions] = await Promise.all([
        getCashRegistersByBranch(branchId),
        getOpenCashSessionsByBranch(branchId),
      ]);
      const openRegisterIds = new Set(
        openSessions.map((session) => session.cash_register_id),
      );
      const openRegisters = rows.filter((register) =>
        openRegisterIds.has(register.cash_register_id),
      );

      setCashRegisters(openRegisters);
      setCashRegisterId((prev) =>
        openRegisters.some((register) => register.cash_register_id === prev)
          ? prev
          : (openRegisters[0]?.cash_register_id ?? ""),
      );
    } catch (err) {
      setCashRegisters([]);
      setCashRegisterId("");
      setToast({
        mode: "error",
        message:
          err instanceof Error
            ? err.message
            : "Error al cargar cajas registradoras",
      });
    } finally {
      setIsLoadingCashRegisters(false);
    }
  }, [branchId]);

  useEffect(() => {
    refreshOpenCashRegisters();
  }, [refreshOpenCashRegisters]);

  const handleLookup = async (data: CustomerLookupForm) => {
    try {
      const found = await getCustomerByDocNumber(data.document_number.trim());
      if (found && (found as Customer).document_number) {
        setCustomer(found);
        setShowInlineCreate(false);
        setStep("items");
        setToast({
          mode: "success",
          message: `Cliente encontrado: ${found.first_name} ${found.last_name}`,
        });
        return;
      }
      throw new Error("not found");
    } catch {
      inlineCustomerForm.reset({
        ...blankCustomer(),
        document_number: data.document_number.trim(),
      });
      setShowInlineCreate(true);
      setToast({
        mode: "info",
        message: "Cliente no encontrado. Complete los datos para crearlo.",
      });
    }
  };

  const handleInlineCreate = async (data: InlineCustomerForm) => {
    if (!tenantId) {
      setToast({ mode: "error", message: "No se identificó el tenant" });
      return;
    }
    if (inlineUniquenessBlocked) {
      setToast({
        mode: "error",
        message: "Hay datos del cliente que ya están registrados",
      });
      return;
    }
    if (inlineUniquenessProbing) {
      setToast({
        mode: "info",
        message: "Verificando disponibilidad… intenta de nuevo en un momento",
      });
      return;
    }
    try {
      const created = await createCustomer({
        tenant_id: tenantId,
        first_name: data.first_name,
        last_name: data.last_name,
        document_type_id: Number(data.document_type_id),
        document_number: data.document_number,
        email: data.email || undefined,
        phone: data.phone || undefined,
      });
      setCustomer(created);
      setShowInlineCreate(false);
      setStep("items");
      setToast({ mode: "success", message: "Cliente creado correctamente" });
    } catch (err) {
      setToast({
        mode: "error",
        message: err instanceof Error ? err.message : "Error al crear cliente",
      });
    }
  };

  const handleAddItem = (data: SaleItemForm) => {
    if (!selectedVariant || !data.product_variant_id) {
      setToast({ mode: "error", message: "Producto inválido" });
      return;
    }
    const total = Number((data.quantity * data.unit_price).toFixed(2));
    const newItem: CartItem = {
      id: `${selectedVariant.product_variant_id}-${Date.now()}`,
      product_variant_id: selectedVariant.product_variant_id,
      variant_name: selectedVariant.variant_name,
      sku: selectedVariant.sku,
      quantity: data.quantity,
      unit_price: data.unit_price,
      total_price: total,
    };
    setItems((prev) => [...prev, newItem]);
    setLastItemAmount(total);
    setAppliedPromotion(null);

    setSelectedVariant(null);
    itemForm.reset({
      product_variant_id: "",
      quantity: 1,
      unit_price: 0,
    });
  };

  const handleRemoveItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    setAppliedPromotion(null);
  };

  const handleApplyPromotion = (applied: AppliedPromotion) => {
    setAppliedPromotion(applied);
    setToast({
      mode: "success",
      message: `Promoción aplicada: ${applied.description}`,
    });
  };

  const handleRemovePromotion = () => {
    setAppliedPromotion(null);
    setToast({ mode: "info", message: "Promoción removida" });
  };

  const handleVariantSelect = (selection: ProductVariantSelection) => {
    setSelectedVariant(selection);
    itemForm.setValue("product_variant_id", selection.product_variant_id, {
      shouldValidate: true,
    });
    itemForm.setValue("unit_price", selection.unit_price, {
      shouldValidate: true,
    });
  };

  const handleVariantClear = () => {
    setSelectedVariant(null);
    itemForm.setValue("product_variant_id", "");
    itemForm.setValue("unit_price", 0);
  };

  // ─── Submit ─────────────────────────────────────────────────────────────────

  const handleSubmitSale = async () => {
    const hasCustomerOrWalkIn = Boolean(customer) || isWalkInSale;
    if (!hasCustomerOrWalkIn || !branchId || !cashRegisterId || items.length === 0) {
      setToast({
        mode: "error",
        message: "Complete los datos antes de procesar la venta",
      });
      return;
    }

    setIsSubmitting(true);

    const customerId = customer?.customer_id ?? null;
    const now = new Date().toISOString();

    const itemsPayload: SaleItemPayload[] = items.map((item) => {
      const itemDiscount = appliedPromotion?.perItemDiscount[item.id] ?? 0;
      const hasDiscount = itemDiscount > 0;
      const netUnitPrice = hasDiscount
        ? Number(
            Math.max(
              (item.total_price - itemDiscount) / item.quantity,
              0,
            ).toFixed(2),
          )
        : item.unit_price;
      const netTotal = hasDiscount
        ? Number(Math.max(item.total_price - itemDiscount, 0).toFixed(2))
        : item.total_price;
      return {
        tenant_id: tenantId,
        product_variant_id: item.product_variant_id,
        quantity: item.quantity,
        unit_price: netUnitPrice,
        total_price: netTotal,
        sale_price_type: hasDiscount ? "PROMO" : "NORMAL",
        promotion_id: hasDiscount ? appliedPromotion?.promotionId : undefined,
        original_price: hasDiscount ? item.unit_price : undefined,
        discount_applied: hasDiscount ? Number(itemDiscount.toFixed(2)) : 0,
      };
    });

    const payload: CreateSaleRequest = {
      tenant_id: tenantId,
      branch_id: branchId,
      cash_register_id: cashRegisterId,
      currency_id: currencyId,
      tenant_customer_id: customerId,
      sale_condition: saleCondition,
      sale_date: now,
      subtotal_amount: Number(subtotal.toFixed(2)),
      tax_amount: Number(taxAmount.toFixed(2)),
      total_amount: Number(totalAmount.toFixed(2)),
      is_completed: true,
      has_electronic_invoice: hasElectronicInvoice,
      items: itemsPayload,
      payments: [
        {
          tenant_customer_id: customerId ?? null,
          payment_method_id: paymentMethodId,
          is_points_redemption: false,
          points_redeemed: 0,
          points_to_currency_rate: 0,
          payment_amount: Number(totalAmount.toFixed(2)),
          payment_date: now,
          currency_id: currencyId,
          verified: true,
        },
      ],
    };

    try {
      console.log("Payload: ", payload);
      const result: CreateSaleResult = await createFullSale(payload);
      setResultModal({
        open: true,
        saleId: result.saleId ?? null,
        total: totalAmount,
        eInvoiceWarning: result.eInvoiceWarning,
        hadElectronicInvoice: hasElectronicInvoice,
      });
    } catch (err) {
      setToast({
        mode: "error",
        message: err instanceof Error ? err.message : "Error al procesar venta",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForNewSale = () => {
    setResultModal((prev) => ({ ...prev, open: false }));
    setStep("lookup");
    setCustomer(null);
    setShowInlineCreate(false);
    setIsWalkInSale(false);
    setItems([]);
    setLastItemAmount(0);
    setHasElectronicInvoice(false);
    setAppliedPromotion(null);
    lookupForm.reset({ document_number: "" });
    inlineCustomerForm.reset(blankCustomer());
    setSelectedVariant(null);
    itemForm.reset({
      product_variant_id: "",
      quantity: 1,
      unit_price: 0,
    });
  };

  const startWalkInSale = () => {
    setIsWalkInSale(true);
    setShowInlineCreate(false);
    setStep("items");
    setToast({
      mode: "info",
      message:
        "Venta de mostrador (sin cliente). Los puntos de fidelidad no aplican.",
    });
  };

  const branchOptions = branches.map((b) => ({
    value: b.branch_id,
    label: b.branch_name,
  }));
  const conditionOptions = saleConditions.map((c) => ({
    value: c.condition_code,
    label: `${c.condition_code} — ${c.condition_desc}`,
  }));
  const paymentOptions = paymentMethods.map((m) => ({
    value: String(m.value),
    label: m.label,
  }));
  const currencyOptions = currencies.map((c) => ({
    value: String(c.value),
    label: c.label,
  }));
  const cashRegisterOptions = cashRegisters.map((register) => ({
    value: register.cash_register_id,
    label: register.register_name || register.cash_register_id,
  }));

  const itemColumns: Column[] = [
    { key: "variant_name", label: "Producto", width: "40%" },
    { key: "sku", label: "SKU", width: "15%", render: (v) => v ?? "—" },
    {
      key: "quantity",
      label: "Cant.",
      width: "10%",
      render: (v) => <span className="font-mono">{v}</span>,
    },
    {
      key: "unit_price",
      label: "Precio",
      width: "15%",
      render: (v: number) => formatAmount(v, currencySymbol),
    },
    {
      key: "total_price",
      label: "Subtotal",
      width: "15%",
      render: (v: number) => (
        <span className="font-medium">{formatAmount(v, currencySymbol)}</span>
      ),
    },
    {
      key: "actions",
      label: "",
      width: "5%",
      render: (_: unknown, row: CartItem) => (
        <Button
          variant="danger"
          size="sm"
          onClick={() => handleRemoveItem(row.id)}
          title="Quitar"
        >
          <IconTrash />
        </Button>
      ),
    },
  ];

  // ─── UI ─────────────────────────────────────────────────────────────────────

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
          Crear nueva venta
        </h1>
        <p className="text-gray-600">
          Procese pagos de productos y servicios para clientes en tienda.
        </p>
      </div>

      {/* ── Sale config row ───────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-300 p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Select
            label="Sucursal"
            value={branchId}
            onChange={(e) => setBranchId(e.target.value)}
            options={branchOptions}
            placeholder="Seleccionar sucursal"
            required
          />
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">
                Caja<span className="ml-0.5 text-accent-500">*</span>
              </label>
              <button
                type="button"
                onClick={() => setIsCashRegisterModalOpen(true)}
                disabled={!branchId}
                className="text-xs font-medium text-accent-700 hover:text-accent-800 disabled:text-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                Abrir / cerrar cajas
              </button>
            </div>
            <Select
              value={cashRegisterId}
              onChange={(e) => setCashRegisterId(e.target.value)}
              options={
                cashRegisterOptions.length
                  ? cashRegisterOptions
                  : [
                      {
                        value: "",
                        label: isLoadingCashRegisters
                          ? "Cargando cajas..."
                          : "No hay cajas con sesion abierta en esta sucursal",
                      },
                    ]
              }
              disabled={
                isLoadingCashRegisters || cashRegisterOptions.length === 0
              }
              required
            />
          </div>
          <Select
            label="Condición de venta"
            value={saleCondition}
            onChange={(e) => setSaleCondition(e.target.value)}
            options={conditionOptions}
            required
          />
          <Select
            label="Moneda"
            value={String(currencyId)}
            onChange={(e) => setCurrencyId(Number(e.target.value))}
            options={currencyOptions}
            required
          />
          <Select
            label="Método de pago"
            value={String(paymentMethodId)}
            onChange={(e) => setPaymentMethodId(Number(e.target.value))}
            options={paymentOptions}
            required
          />
        </div>
      </div>

      {/* ── Step 1: customer lookup ───────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-300 p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="w-8 h-8 rounded-full bg-accent-100 text-accent-700 flex items-center justify-center font-semibold">
            1
          </span>
          <h2 className="text-lg font-semibold text-gray-900">
            Datos del cliente
          </h2>
          {customer && step === "items" && (
            <Badge variant="green" className="ml-2">
              Listo
            </Badge>
          )}
          {isWalkInSale && step === "items" && (
            <Badge variant="yellow" className="ml-2">
              Venta de mostrador
            </Badge>
          )}
        </div>

        {!customer && !isWalkInSale && (
          <>
            <form
              onSubmit={lookupForm.handleSubmit(handleLookup)}
              className="flex flex-col md:flex-row md:items-end gap-3"
            >
              <div className="flex-1">
                <Input
                  label="Número de documento"
                  placeholder="Ej: 105550987"
                  {...lookupForm.register("document_number")}
                  error={lookupForm.formState.errors.document_number?.message}
                  required
                />
              </div>
              <Button type="submit" variant="primary">
                Buscar cliente
              </Button>
            </form>
            <div className="mt-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between text-sm">
              <p className="text-gray-500">
                ¿Cliente ocasional o no identificado? Puedes registrar la venta
                sin asociarla a un cliente.
              </p>
              <Button
                type="button"
                variant="ghost"
                onClick={startWalkInSale}
              >
                Continuar sin cliente
              </Button>
            </div>
          </>
        )}

        {isWalkInSale && !customer && (
          <div className="mt-2 flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
            <IconUser />
            <div className="flex-1">
              <p className="font-semibold text-amber-900">
                Venta de mostrador
              </p>
              <p className="text-xs text-amber-700">
                No se asociará ningún cliente a esta venta.
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setIsWalkInSale(false);
                setStep("lookup");
              }}
            >
              Cambiar
            </Button>
          </div>
        )}

        {showInlineCreate && !customer && (
          <form
            onSubmit={inlineCustomerForm.handleSubmit(handleInlineCreate)}
            className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-gray-100 pt-6"
          >
            <Input
              label="Nombre"
              {...inlineCustomerForm.register("first_name")}
              error={inlineCustomerForm.formState.errors.first_name?.message}
              required
            />
            <Input
              label="Apellido"
              {...inlineCustomerForm.register("last_name")}
              error={inlineCustomerForm.formState.errors.last_name?.message}
              required
            />
            <Select
              label="Tipo de documento"
              value={String(inlineCustomerForm.watch("document_type_id") ?? 1)}
              onChange={(e) =>
                inlineCustomerForm.setValue(
                  "document_type_id",
                  Number(e.target.value),
                )
              }
              options={identificationTypes.map((t) => ({
                value: String(t.value),
                label: t.label,
              }))}
              required
            />
            <Input
              label="Número de documento"
              {...inlineCustomerForm.register("document_number")}
              error={
                inlineCustomerForm.formState.errors.document_number?.message ??
                (inlineDocStatus === "taken"
                  ? "Ya existe un cliente con este documento"
                  : undefined)
              }
              hint={
                inlineDocStatus === "checking"
                  ? "Verificando disponibilidad…"
                  : inlineDocStatus === "available"
                    ? "Documento disponible"
                    : undefined
              }
              required
            />
            <Input
              label="Email"
              type="email"
              {...inlineCustomerForm.register("email")}
              error={
                inlineCustomerForm.formState.errors.email?.message ??
                (inlineEmailStatus === "taken"
                  ? "Ya existe un cliente con este email"
                  : undefined)
              }
              hint={
                inlineEmailStatus === "checking"
                  ? "Verificando disponibilidad…"
                  : inlineEmailStatus === "available"
                    ? "Email disponible"
                    : undefined
              }
            />
            <Input
              label="Teléfono"
              {...inlineCustomerForm.register("phone")}
              error={
                inlinePhoneStatus === "taken"
                  ? "Ya existe un cliente con este teléfono"
                  : undefined
              }
              hint={
                inlinePhoneStatus === "checking"
                  ? "Verificando disponibilidad…"
                  : inlinePhoneStatus === "available"
                    ? "Teléfono disponible"
                    : undefined
              }
            />
            <div className="md:col-span-2 flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowInlineCreate(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={inlineUniquenessBlocked || inlineUniquenessProbing}
                title={
                  inlineUniquenessBlocked
                    ? "Hay datos duplicados que deben corregirse"
                    : inlineUniquenessProbing
                      ? "Verificando disponibilidad…"
                      : undefined
                }
              >
                <IconPlus />
                Crear cliente y continuar
              </Button>
            </div>
          </form>
        )}

        {customer && (
          <div className="mt-2 flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl p-4">
            <IconUser />
            <div className="flex-1">
              <p className="font-semibold text-emerald-900">
                {customer.first_name} {customer.last_name}
              </p>
              <p className="text-xs text-emerald-700">
                Doc. {customer.document_number}{" "}
                {customer.email ? `· ${customer.email}` : ""}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setCustomer(null);
                setStep("lookup");
                setShowInlineCreate(false);
                lookupForm.reset({ document_number: "" });
              }}
            >
              Cambiar
            </Button>
          </div>
        )}
      </div>

      {/* ── Step 2: items ─────────────────────────────────────────────────── */}
      <div
        className={`bg-white rounded-2xl border border-gray-300 p-6 mb-6 ${
          step === "items" ? "" : "opacity-60 pointer-events-none"
        }`}
      >
        <div className="flex items-center gap-2 mb-4">
          <span className="w-8 h-8 rounded-full bg-accent-100 text-accent-700 flex items-center justify-center font-semibold">
            2
          </span>
          <h2 className="text-lg font-semibold text-gray-900">
            Productos y servicios
          </h2>
        </div>

        <form
          onSubmit={itemForm.handleSubmit(handleAddItem)}
          className="grid grid-cols-1 md:grid-cols-12 gap-3"
        >
          <div className="md:col-span-6">
            <ProductVariantComboBox
              tenantId={tenantId}
              label="Producto"
              value={itemForm.watch("product_variant_id")}
              displayValue={
                selectedVariant ? buildVariantLabel(selectedVariant) : ""
              }
              onChange={handleVariantSelect}
              onClear={handleVariantClear}
              error={itemForm.formState.errors.product_variant_id?.message}
              required
            />
          </div>
          <div className="md:col-span-2">
            <Input
              label="Cantidad"
              type="number"
              min={1}
              {...itemForm.register("quantity", { valueAsNumber: true })}
              error={itemForm.formState.errors.quantity?.message}
              required
            />
          </div>
          <div className="md:col-span-1 flex items-end">
            <Button type="submit" variant="primary" fullWidth>
              <IconPlus />
            </Button>
          </div>
        </form>

        <div className="mt-6 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="text-sm text-gray-600">
            {items.length > 0 && (
              <span>
                Último producto agregado:{" "}
                <span className="font-semibold text-gray-900">
                  {formatAmount(lastItemAmount, currencySymbol)}
                </span>
              </span>
            )}
          </div>
          <Button
            type="button"
            variant="secondary"
            onClick={() => setIsPromotionModalOpen(true)}
            disabled={items.length === 0}
          >
            <IconTrendingUp />
            Agregar promoción
          </Button>
        </div>

        {appliedPromotion && (
          <div className="mt-4 flex items-center justify-between gap-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
                Promoción aplicada
              </p>
              <p className="mt-1 text-sm font-medium text-emerald-900 truncate">
                {appliedPromotion.description}
              </p>
              <p className="text-xs text-emerald-700 mt-0.5">
                Descuento total:{" "}
                <span className="font-semibold">
                  -{formatAmount(discountAmount, currencySymbol)}
                </span>
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleRemovePromotion}
              title="Quitar promoción"
            >
              <IconX />
            </Button>
          </div>
        )}

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
            <p className="text-xs uppercase tracking-wider text-gray-500">
              Subtotal bruto
            </p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {formatAmount(grossSubtotal, currencySymbol)}
            </p>
          </div>
          <div
            className={`border rounded-xl p-4 ${
              discountAmount > 0
                ? "bg-amber-50 border-amber-200"
                : "bg-gray-50 border-gray-200"
            }`}
          >
            <p
              className={`text-xs uppercase tracking-wider ${
                discountAmount > 0 ? "text-amber-700" : "text-gray-500"
              }`}
            >
              Descuento
            </p>
            <p
              className={`text-2xl font-bold mt-1 ${
                discountAmount > 0 ? "text-amber-900" : "text-gray-900"
              }`}
            >
              -{formatAmount(discountAmount, currencySymbol)}
            </p>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
            <p className="text-xs uppercase tracking-wider text-gray-500">
              Subtotal con descuento
            </p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {formatAmount(subtotal, currencySymbol)}
            </p>
          </div>
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
            <p className="text-xs uppercase tracking-wider text-emerald-700">
              Total con IVA ({(TAX_RATE * 100).toFixed(0)}%)
            </p>
            <p className="text-2xl font-bold text-emerald-900 mt-1">
              {formatAmount(totalAmount, currencySymbol)}
            </p>
          </div>
        </div>

        <div className="mt-6">
          <Table
            columns={itemColumns}
            data={items}
            emptyMessage="Aún no hay productos en la venta"
          />
        </div>
      </div>

      {/* ── Submit row ────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-300 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={hasElectronicInvoice}
            onChange={(e) => setHasElectronicInvoice(e.target.checked)}
            className="w-5 h-5 rounded border-gray-300 text-accent-600 focus:ring-accent-400"
          />
          <span className="text-sm font-medium text-gray-700">
            Generar factura electrónica
          </span>
        </label>

        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">
            {items.length} producto{items.length !== 1 ? "s" : ""} ·{" "}
            {formatAmount(totalAmount, currencySymbol)}
          </span>
          <Button
            variant="primary"
            size="lg"
            onClick={handleSubmitSale}
            loading={isSubmitting}
            disabled={
              (!customer && !isWalkInSale) ||
              items.length === 0 ||
              !branchId ||
              !cashRegisterId ||
              isSubmitting
            }
          >
            <IconShoppingCart />
            Procesar venta
          </Button>
        </div>
      </div>

      <SaleResultModal
        isOpen={resultModal.open}
        saleId={resultModal.saleId}
        totalAmount={resultModal.total}
        currencySymbol={currencySymbol}
        hasElectronicInvoice={resultModal.hadElectronicInvoice}
        eInvoiceWarning={resultModal.eInvoiceWarning}
        onClose={() => setResultModal((prev) => ({ ...prev, open: false }))}
        onNewSale={resetForNewSale}
      />

      <ApplyPromotionModal
        isOpen={isPromotionModalOpen}
        tenantId={tenantId}
        cartItems={items.map((i) => ({
          id: i.id,
          product_variant_id: i.product_variant_id,
          quantity: i.quantity,
          unit_price: i.unit_price,
          total_price: i.total_price,
        }))}
        cartSubtotal={grossSubtotal}
        currencySymbol={currencySymbol}
        onClose={() => setIsPromotionModalOpen(false)}
        onApply={handleApplyPromotion}
      />

      <QuickCashRegisterModal
        isOpen={isCashRegisterModalOpen}
        branchId={branchId}
        branchName={
          branches.find((b) => b.branch_id === branchId)?.branch_name
        }
        onClose={() => setIsCashRegisterModalOpen(false)}
        onSessionsChanged={refreshOpenCashRegisters}
      />
    </div>
  );
}
