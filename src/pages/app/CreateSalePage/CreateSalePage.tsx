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
import { employeeApi } from "@/api/employee.api";
import { exchangeRateApi } from "@/api/exchangeRate.api";
import { productApi } from "@/api/product.api";
import { warehouseApi } from "@/api/warehouse.api";
import { promotionApi } from "@/api/promotion.api";
import { useUniqueAvailability } from "@/hooks/useUniqueAvailability";
import {
  calculatePromotionDiscount,
  isPromotionWithinDate,
  promotionAppliesToItem,
} from "@/utils/promotion";

import { identificationTypes } from "@/constants/identification-types";
import { paymentMethods, currencies } from "@/constants/payment-methods";

import type { Promotion } from "@/interfaces/entities/Promotion.interface";
import type { ExchangeRate } from "@/interfaces/entities/ExchangeRate.interface";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Seeded IDs from general/006-insert-currencies.sql.
const CRC_CURRENCY_ID = 1;

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
import type { Warehouse } from "@/interfaces/entities/Warehouse.interface";

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
  group_ids?: string[];
  quantity: number;
  unit_price: number;
  total_price: number;
}

const TAX_RATE = 0.13;

const formatAmount = (value: number, symbol: string) =>
  `${symbol} ${value.toLocaleString("es-CR", { minimumFractionDigits: 2 })}`;

const round2 = (value: number) => Number(value.toFixed(2));

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

  const [, setWarehouses] = useState<Warehouse[]>([]);
  const [branchWarehouseId, setBranchWarehouseId] = useState<string>("");

  // Default promotions: pre-applied to every new sale while active. Loaded once
  // for the current tenant and re-evaluated against the cart.
  const [defaultPromotions, setDefaultPromotions] = useState<Promotion[]>([]);

  // Exchange rate (CRC <-> USD): fetched from the server on mount, then
  // overridable locally for the current cash-session lifetime. Per spec, the
  // override does not persist to the database — closing the session loses it.
  const [serverExchangeRate, setServerExchangeRate] =
    useState<ExchangeRate | null>(null);
  const [exchangeRateOverride, setExchangeRateOverride] = useState<string>("");

  // Seller display: full name from the employee record falls back to email.
  const [sellerDisplayName, setSellerDisplayName] = useState<string>("");

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

  // Re-evaluate active default promos against the current cart. Each item gets
  // the maximum discount from any matching default promo (one per item, not
  // cumulative — additive cumulation across multiple defaults is not supported
  // by the rule engine).
  const defaultPromoDiscount = useMemo(() => {
    if (defaultPromotions.length === 0 || items.length === 0) {
      return {
        total: 0,
        perItem: {} as Record<string, number>,
        source: null as Promotion | null,
      };
    }
    const grossForRule = items.reduce((acc, i) => acc + i.total_price, 0);
    const perItem: Record<string, number> = {};
    let total = 0;
    let appliedSource: Promotion | null = null;

    for (const item of items) {
      let bestDiscount = 0;
      for (const promo of defaultPromotions) {
        if (!promotionAppliesToItem(promo, item)) continue;
        if (!promo.rule || !promo.type_name) continue;
        const result = calculatePromotionDiscount({
          type: promo.type_name,
          rule: promo.rule,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_purchase_amount: grossForRule,
        });
        if (result.success && result.discount_amount > bestDiscount) {
          bestDiscount = Math.min(result.discount_amount, item.total_price);
          if (!appliedSource) appliedSource = promo;
        }
      }
      if (bestDiscount > 0) {
        perItem[item.id] = Number(bestDiscount.toFixed(2));
        total += bestDiscount;
      }
    }

    return {
      total: Number(total.toFixed(2)),
      perItem,
      source: appliedSource,
    };
  }, [defaultPromotions, items]);

  // Any active default that disallows stacking blocks the cashier from adding
  // a manual promotion on top.
  const hasNonStackableDefault = useMemo(
    () => defaultPromotions.some((p) => p.is_stackable === false),
    [defaultPromotions],
  );

  const grossSubtotal = useMemo(
    () => items.reduce((acc, item) => acc + item.total_price, 0),
    [items],
  );
  const manualDiscount = useMemo(
    () => Number((appliedPromotion?.totalDiscount ?? 0).toFixed(2)),
    [appliedPromotion],
  );
  const discountAmount = useMemo(
    () => Number((manualDiscount + defaultPromoDiscount.total).toFixed(2)),
    [manualDiscount, defaultPromoDiscount.total],
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

  // Effective rate: cashier override wins if it parses to a positive number;
  // otherwise the server rate is used.
  const effectiveExchangeRate = useMemo(() => {
    const parsed = parseFloat(exchangeRateOverride);
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
    const serverRate = Number(serverExchangeRate?.rate ?? 0);
    return Number.isFinite(serverRate) && serverRate > 0 ? serverRate : 0;
  }, [exchangeRateOverride, serverExchangeRate]);

  const convertCrcToSaleCurrency = useCallback(
    (amount: number) => {
      if (currencyId === CRC_CURRENCY_ID) return round2(amount);
      if (effectiveExchangeRate <= 0) return round2(amount);
      return round2(amount / effectiveExchangeRate);
    },
    [currencyId, effectiveExchangeRate],
  );

  const convertSaleCurrencyToCrc = useCallback(
    (amount: number) => {
      if (currencyId === CRC_CURRENCY_ID) return round2(amount);
      if (effectiveExchangeRate <= 0) return null;
      return round2(amount * effectiveExchangeRate);
    },
    [currencyId, effectiveExchangeRate],
  );

  const grossSubtotalDisplay = useMemo(
    () => convertCrcToSaleCurrency(grossSubtotal),
    [convertCrcToSaleCurrency, grossSubtotal],
  );
  const discountAmountDisplay = useMemo(
    () => convertCrcToSaleCurrency(discountAmount),
    [convertCrcToSaleCurrency, discountAmount],
  );
  const subtotalDisplay = useMemo(
    () => convertCrcToSaleCurrency(subtotal),
    [convertCrcToSaleCurrency, subtotal],
  );
  const taxAmountDisplay = useMemo(
    () => convertCrcToSaleCurrency(taxAmount),
    [convertCrcToSaleCurrency, taxAmount],
  );
  const totalAmountDisplay = useMemo(
    () => convertCrcToSaleCurrency(totalAmount),
    [convertCrcToSaleCurrency, totalAmount],
  );
  const totalInDollars = useMemo(() => {
    if (effectiveExchangeRate <= 0) return null;
    return round2(totalAmount / effectiveExchangeRate);
  }, [effectiveExchangeRate, totalAmount]);

  // Total expressed in CRC. Only meaningful when the sale currency is USD —
  // for CRC sales this just equals the total. For other currencies we leave
  // it null since we don't have a rate.
  const totalInColones = useMemo(() => {
    if (currencyId === CRC_CURRENCY_ID) return totalAmount;
    return convertSaleCurrencyToCrc(totalAmountDisplay);
  }, [convertSaleCurrencyToCrc, currencyId, totalAmount, totalAmountDisplay]);

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

  useEffect(() => {
    let cancelled = false;
    if (!tenantId) return;
    warehouseApi
      .listByTenant()
      .then((rows) => {
        if (cancelled) return;
        setWarehouses(rows);
        const w = rows.find((r) => r.branch_id === branchId && r.is_branch);
        setBranchWarehouseId(w?.warehouse_id ?? "");
      })
      .catch(() => {
        if (!cancelled) setWarehouses([]);
      });
    return () => {
      cancelled = true;
    };
  }, [tenantId, branchId]);

  // Load active default promotions for this tenant. Filtered client-side by
  // date as a defence in depth — the backend already filters by date too.
  useEffect(() => {
    if (!tenantId) return;
    let cancelled = false;
    promotionApi
      .getActiveDefaults(tenantId)
      .then((rows) => {
        if (cancelled) return;
        setDefaultPromotions(
          rows.filter(
            (p) =>
              p.is_active &&
              isPromotionWithinDate(
                p.promotion_start_date,
                p.promotion_end_date,
              ),
          ),
        );
      })
      .catch(() => {
        if (!cancelled) setDefaultPromotions([]);
      });
    return () => {
      cancelled = true;
    };
  }, [tenantId]);

  // Load latest exchange rate (USD -> CRC). Failing silently is fine — the
  // panel just shows "no hay tasa registrada" and the cashier can type one.
  useEffect(() => {
    if (currencyId === CRC_CURRENCY_ID) {
      setServerExchangeRate(null);
      return;
    }

    let cancelled = false;
    exchangeRateApi
      .getLatest(currencyId, CRC_CURRENCY_ID)
      .then((rate) => {
        if (!cancelled) setServerExchangeRate(rate ?? null);
      })
      .catch(() => {
        if (!cancelled) setServerExchangeRate(null);
      });
    return () => {
      cancelled = true;
    };
  }, [currencyId]);

  useEffect(() => {
    setExchangeRateOverride("");
  }, [currencyId]);

  // Resolve seller name. Try the employee record first; fall back to email.
  useEffect(() => {
    const userId = user?.user_id;
    const fallback = user?.email ?? "";
    if (!userId) {
      setSellerDisplayName(fallback);
      return;
    }
    let cancelled = false;
    employeeApi
      .getByUserId(userId)
      .then((emp) => {
        if (cancelled) return;
        const fullName =
          emp?.first_name || emp?.last_name
            ? `${emp.first_name ?? ""} ${emp.last_name ?? ""}`.trim()
            : fallback;
        setSellerDisplayName(fullName);
      })
      .catch(() => {
        if (!cancelled) setSellerDisplayName(fallback);
      });
    return () => {
      cancelled = true;
    };
  }, [user?.user_id, user?.email]);

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
      group_ids: selectedVariant.group_ids ?? [],
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

  const handleVariantSelect = async (selection: ProductVariantSelection) => {
    let groupIds: string[] = [];

    try {
      const detail = await productApi.getByIdWithAttributes(
        tenantId,
        selection.product_variant_id,
      );
      groupIds = (detail.groups ?? []).map(
        (group) => group.tenant_product_group_id,
      );
    } catch {
      groupIds = [];
    }

    setSelectedVariant({ ...selection, group_ids: groupIds });
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
    if (
      !hasCustomerOrWalkIn ||
      !branchId ||
      !cashRegisterId ||
      items.length === 0
    ) {
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
      const manualPart = appliedPromotion?.perItemDiscount[item.id] ?? 0;
      const defaultPart = defaultPromoDiscount.perItem[item.id] ?? 0;
      const itemDiscount = Number((manualPart + defaultPart).toFixed(2));
      const hasDiscount = itemDiscount > 0;
      const netUnitPriceCrc = hasDiscount
        ? round2(Math.max((item.total_price - itemDiscount) / item.quantity, 0))
        : item.unit_price;
      const netTotalCrc = hasDiscount
        ? round2(Math.max(item.total_price - itemDiscount, 0))
        : item.total_price;
      // Manual promo wins for the recorded promotion_id; fall back to the
      // first default promo that contributed if no manual was applied.
      const promotionId =
        manualPart > 0
          ? appliedPromotion?.promotionId
          : defaultPart > 0
            ? defaultPromoDiscount.source?.promotion_id
            : undefined;
      return {
        tenant_id: tenantId,
        product_variant_id: item.product_variant_id,
        quantity: item.quantity,
        unit_price: convertCrcToSaleCurrency(netUnitPriceCrc),
        total_price: convertCrcToSaleCurrency(netTotalCrc),
        sale_price_type: hasDiscount ? "PROMO" : "NORMAL",
        promotion_id: promotionId,
        original_price: hasDiscount
          ? convertCrcToSaleCurrency(item.unit_price)
          : undefined,
        discount_applied: hasDiscount
          ? convertCrcToSaleCurrency(itemDiscount)
          : 0,
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
      subtotal_amount: subtotalDisplay,
      tax_amount: taxAmountDisplay,
      total_amount: totalAmountDisplay,
      is_completed: true,
      has_electronic_invoice: hasElectronicInvoice,
      seller_user_id: user?.user_id,
      items: itemsPayload,
      payments: [
        {
          tenant_customer_id: customerId ?? null,
          payment_method_id: paymentMethodId,
          is_points_redemption: false,
          points_redeemed: 0,
          points_to_currency_rate: 0,
          payment_amount: totalAmountDisplay,
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
        total: totalAmountDisplay,
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
      render: (_: number, row: CartItem) =>
        formatAmount(convertCrcToSaleCurrency(row.unit_price), currencySymbol),
    },
    {
      key: "total_price",
      label: "Subtotal",
      width: "15%",
      render: (_: number, row: CartItem) => (
        <span className="font-medium">
          {formatAmount(
            convertCrcToSaleCurrency(row.total_price),
            currencySymbol,
          )}
        </span>
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

      <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Crear nueva venta
          </h1>
          <p className="text-gray-600">
            Procese pagos de productos y servicios para clientes en tienda.
          </p>
        </div>
        {sellerDisplayName && (
          <div className="inline-flex items-center gap-2 self-start rounded-full border border-gray-200 bg-white px-3 py-1.5 text-sm shadow-sm">
            <IconUser />
            <span className="text-gray-500">Vendedor:</span>
            <span className="font-semibold text-gray-900">
              {sellerDisplayName}
            </span>
          </div>
        )}
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
              <Button type="button" variant="ghost" onClick={startWalkInSale}>
                Continuar sin cliente
              </Button>
            </div>
          </>
        )}

        {isWalkInSale && !customer && (
          <div className="mt-2 flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
            <IconUser />
            <div className="flex-1">
              <p className="font-semibold text-amber-900">Venta de mostrador</p>
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
              warehouseId={branchWarehouseId}
              manualSkuEnabled
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
                  {formatAmount(
                    convertCrcToSaleCurrency(lastItemAmount),
                    currencySymbol,
                  )}
                </span>
              </span>
            )}
          </div>
          <Button
            type="button"
            variant="secondary"
            onClick={() => setIsPromotionModalOpen(true)}
            disabled={items.length === 0 || hasNonStackableDefault}
            title={
              hasNonStackableDefault
                ? "Hay una promoción default activa que no permite acumular más promociones"
                : undefined
            }
          >
            <IconTrendingUp />
            Agregar promoción
          </Button>
        </div>

        {hasNonStackableDefault && (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            Una promoción default activa no permite acumular promociones
            adicionales. No es posible agregar otra encima.
          </div>
        )}

        {defaultPromoDiscount.total > 0 && defaultPromoDiscount.source && (
          <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-700">
              Promoción default aplicada
            </p>
            <p className="mt-1 text-sm font-medium text-blue-900">
              {defaultPromoDiscount.source.promotion_name}
              <span className="ml-2 text-xs font-normal text-blue-700">
                Descuento: -
                {formatAmount(defaultPromoDiscount.total, currencySymbol)}
              </span>
            </p>
          </div>
        )}

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
                  -{formatAmount(discountAmountDisplay, currencySymbol)}
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

        {/* Exchange rate panel — local override only, lost on session close. */}
        <div className="mt-6 rounded-xl border border-gray-200 bg-white p-4 flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Tasa de cambio USD → CRC
            </p>
            <p className="text-sm text-gray-600 mt-1">
              {serverExchangeRate
                ? `Tasa actual del sistema: ₡${Number(serverExchangeRate.rate).toLocaleString("es-CR", { minimumFractionDigits: 2, maximumFractionDigits: 6 })} (efectiva ${String(serverExchangeRate.effective_date).slice(0, 10)})`
                : "No hay tasa registrada en el sistema."}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              El cajero puede sobrescribirla solo durante esta sesión de caja —
              no se guarda en la base de datos.
            </p>
          </div>
          <div className="w-full md:w-56">
            <Input
              label="Tasa local (override)"
              type="number"
              min="0"
              step="0.000001"
              placeholder={
                serverExchangeRate
                  ? String(serverExchangeRate.rate)
                  : "Ej: 510.00"
              }
              value={exchangeRateOverride}
              onChange={(e) => setExchangeRateOverride(e.target.value)}
            />
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
            <p className="text-xs uppercase tracking-wider text-gray-500">
              Subtotal bruto
            </p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {formatAmount(grossSubtotalDisplay, currencySymbol)}
            </p>
            {currencyId === CRC_CURRENCY_ID && totalInDollars !== null && (
              <p className="text-xs text-gray-500 mt-1">
                ≈{" "}
                {formatAmount(
                  round2(grossSubtotal / effectiveExchangeRate),
                  "$",
                )}
              </p>
            )}
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
              -{formatAmount(discountAmountDisplay, currencySymbol)}
            </p>
            {currencyId === CRC_CURRENCY_ID && totalInDollars !== null && (
              <p className="text-xs text-amber-700 mt-1">
                ≈ -
                {formatAmount(
                  round2(discountAmount / effectiveExchangeRate),
                  "$",
                )}
              </p>
            )}
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
            <p className="text-xs uppercase tracking-wider text-gray-500">
              Subtotal con descuento
            </p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {formatAmount(subtotalDisplay, currencySymbol)}
            </p>
            {currencyId === CRC_CURRENCY_ID && totalInDollars !== null && (
              <p className="text-xs text-gray-500 mt-1">
                ≈ {formatAmount(round2(subtotal / effectiveExchangeRate), "$")}
              </p>
            )}
          </div>
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
            <p className="text-xs uppercase tracking-wider text-emerald-700">
              Total con IVA ({(TAX_RATE * 100).toFixed(0)}%)
            </p>
            <p className="text-2xl font-bold text-emerald-900 mt-1">
              {formatAmount(totalAmountDisplay, currencySymbol)}
            </p>
            {currencyId === CRC_CURRENCY_ID && totalInDollars !== null && (
              <p className="text-xs text-emerald-700 mt-1">
                ≈ {formatAmount(totalInDollars, "$")}
              </p>
            )}
            {currencyId !== CRC_CURRENCY_ID && totalInColones !== null && (
              <p className="text-xs text-emerald-700 mt-1">
                ≈ {formatAmount(totalInColones, "₡")} ·
                <span className="ml-1 text-emerald-600">
                  tasa{" "}
                  {effectiveExchangeRate.toLocaleString("es-CR", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 6,
                  })}
                </span>
              </p>
            )}
            {currencyId !== CRC_CURRENCY_ID &&
              totalInColones === null &&
              effectiveExchangeRate === 0 && (
                <p className="text-xs text-amber-700 mt-1">
                  Configure una tasa para ver el equivalente en colones.
                </p>
              )}
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
            {formatAmount(totalAmountDisplay, currencySymbol)}
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
        branchName={branches.find((b) => b.branch_id === branchId)?.branch_name}
        onClose={() => setIsCashRegisterModalOpen(false)}
        onSessionsChanged={refreshOpenCashRegisters}
      />
    </div>
  );
}
