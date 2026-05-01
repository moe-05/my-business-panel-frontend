import { useState, useEffect, useRef, useCallback } from "react";
import { productApi } from "@/api/product.api";
import { warehouseApi } from "@/api/warehouse.api";
import type { Product } from "@/interfaces/entities/Product.interface";

type ProductVariantRow = Product & {
  variant_name?: string;
  product_variant_id?: string;
  unit_price?: number;
};

export interface ProductVariantSelection {
  product_variant_id: string;
  variant_name: string;
  sku?: string;
  unit_price: number;
  group_ids?: string[];
}

interface ProductVariantComboBoxProps {
  tenantId: string;
  value: string;
  warehouseId?: string;
  manualSkuEnabled?: boolean;
  displayValue?: string;
  onChange: (selection: ProductVariantSelection) => void;
  onClear?: () => void;
  error?: string;
  required?: boolean;
  label?: string;
  disabled?: boolean;
  hint?: string;
  placeholder?: string;
}

const getVariantId = (p: ProductVariantRow) =>
  p.product_variant_id ?? p.product_id;
const getVariantName = (p: ProductVariantRow) =>
  p.variant_name ?? p.product_name ?? "—";
const getVariantPrice = (p: ProductVariantRow) =>
  Number(p.unit_price ?? p.price ?? 0);

export function ProductVariantComboBox({
  tenantId,
  value,
  warehouseId,
  manualSkuEnabled = false,
  displayValue,
  onChange,
  onClear,
  error,
  required,
  label,
  disabled,
  hint,
  placeholder = "Buscar producto por SKU o nombre...",
}: ProductVariantComboBoxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [variants, setVariants] = useState<ProductVariantRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState(displayValue || "");
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setSelectedLabel(displayValue || "");
  }, [displayValue]);

  const fetchVariants = useCallback(
    async (term: string) => {
      if (!tenantId) {
        setVariants([]);
        return;
      }
      setIsLoading(true);
      try {
        if (warehouseId) {
          const inventory = await warehouseApi.listInventory(warehouseId, term);
          // Aggregate available simple units: expand composite inventory into child units
          const map = new Map<
            string,
            { stock: number; sku?: string; variant_name?: string; unit_price?: number }
          >();

          for (const it of inventory ?? []) {
            // 1. Add the product itself (composite or simple)
            const id = it.product_variant_id;
            const entry = map.get(id) ?? {
              stock: 0,
              sku: it.sku ?? undefined,
              variant_name: it.variant_name ?? it.product_name,
              unit_price: it.unit_price,
            };
            entry.stock += Number(it.stock ?? 0);
            if (it.unit_price !== undefined) entry.unit_price = it.unit_price;
            map.set(id, entry);

            // 2. If composite, also expand into children for virtual stock
            if (it.is_composite) {
              try {
                const comps = await productApi.getComposition(
                  tenantId,
                  it.product_variant_id,
                );
                for (const c of comps) {
                  const childId = c.child_product_variant_id;
                  const qtyPerParent = Number(c.quantity ?? 0);
                  const add = Number(it.stock ?? 0) * qtyPerParent;
                  const existing = map.get(childId) ?? {
                    stock: 0,
                    sku: c.child_sku ?? undefined,
                    variant_name: c.child_variant_name ?? undefined,
                    unit_price: 0, // Will be enriched
                  };
                  existing.stock += add;
                  if (!existing.sku && c.child_sku) existing.sku = c.child_sku;
                  if (!existing.variant_name && c.child_variant_name)
                    existing.variant_name = c.child_variant_name;
                  map.set(childId, existing);
                }
              } catch (err) {
                // ignore composition lookup errors
              }
            }
          }

          // Enrich with unit_price for those missing it (mostly expanded children not explicitly in inventory)
          const result: ProductVariantRow[] = [];
          const enrichPromises: Array<Promise<void>> = [];
          
          for (const [id, val] of map.entries()) {
            const r: ProductVariantRow = {
              product_id: id,
              product_name: val.variant_name ?? "",
              category_id: "",
              tenant_id: tenantId,
              created_at: "",
              updated_at: "",
              product_variant_id: id,
              variant_name: val.variant_name,
              sku: val.sku ?? "",
              unit_price: val.unit_price ?? 0,
              price: val.unit_price ?? 0,
            };
            result.push(r);

            if (!r.unit_price || r.unit_price === 0) {
              enrichPromises.push(
                (async () => {
                  try {
                    const pd = await productApi.getByIdWithAttributes(tenantId, id);
                    if (pd) {
                      r.variant_name = r.variant_name ?? pd.variant_name ?? pd.product_name;
                      r.sku = r.sku ?? pd.sku ?? undefined;
                      r.unit_price = Number(pd.unit_price ?? pd.price ?? 0);
                    }
                  } catch (e) {
                    // ignore
                  }
                })(),
              );
            }
          }

          await Promise.all(enrichPromises);

          // attach aggregated stock into unit_price carrying objects by mapping again
          const final = result.map((r) => ({
            product_variant_id: r.product_variant_id,
            variant_name: r.variant_name,
            sku: r.sku,
            unit_price: r.unit_price,
            // expose stock via unit_price placeholder (selection uses nothing else), but we attach stock in variant_name hint via hint prop is not available; instead we attach stock in product_name by suffixing label when selected
          })) as ProductVariantRow[];

          // store stocks in an internal map for label building on select
          (fetchVariants as any)._inventoryStock = map; // attach for use in handleSelect

          setVariants(final);
        } else {
          const data = await productApi.search(tenantId, term, 1, 50);
          setVariants((data?.products ?? []) as ProductVariantRow[]);
        }
      } catch {
        setVariants([]);
      } finally {
        setIsLoading(false);
      }
    },
    [tenantId, warehouseId],
  );

  useEffect(() => {
    if (!isOpen) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchVariants(search.trim());
    }, 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [search, isOpen, fetchVariants]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleOpen = () => {
    if (disabled) return;
    setIsOpen(true);
    setSearch("");
    fetchVariants("");
    setTimeout(() => searchInputRef.current?.focus(), 50);
  };

  const handleSelect = (variant: ProductVariantRow) => {
    const id = getVariantId(variant);
    if (!id) return;
    const name = getVariantName(variant);
    // If inventory stock map is available, show available quantity in label
    let label = variant.sku ? `${name} (${variant.sku})` : name;
    const stockMap: Map<string, any> | undefined = (fetchVariants as any)
      ._inventoryStock;
    const stock = stockMap ? (stockMap.get(id)?.stock ?? 0) : undefined;
    if (stock !== undefined) {
      label = `${label} — disponible ${stock}`;
    }
    onChange({
      product_variant_id: id,
      variant_name: name,
      sku: variant.sku,
      unit_price: getVariantPrice(variant),
    });
    setSelectedLabel(label);
    setIsOpen(false);
    setSearch("");
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClear?.();
    setSelectedLabel("");
  };

  return (
    <div ref={containerRef} className="relative">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <div className="relative">
        <button
          type="button"
          onClick={handleOpen}
          disabled={disabled}
          className={[
            "w-full px-3 py-2 text-left border rounded-lg text-sm bg-white transition-colors",
            "focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-500",
            error ? "border-red-300 bg-red-50" : "border-gray-300",
            disabled
              ? "opacity-50 cursor-not-allowed bg-gray-50"
              : "cursor-pointer hover:border-gray-400",
            value ? "text-gray-900" : "text-gray-400",
          ].join(" ")}
        >
          <span className="block truncate pr-14">
            {value && selectedLabel ? selectedLabel : placeholder}
          </span>
          <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className={`text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </span>
        </button>

        {value && !disabled && onClear && (
          <button
            aria-label="limpiar selección"
            type="button"
            onClick={handleClear}
            className="absolute inset-y-0 right-7 flex items-center px-1 text-gray-400 hover:text-gray-600 transition-colors"
            tabIndex={-1}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
          <div className="p-2 border-b border-gray-100">
            <div className="relative">
              <svg
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Ingrese SKU o nombre..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={async (e) => {
                  if (e.key === "Enter" && manualSkuEnabled && search.trim()) {
                    e.preventDefault();
                    const sku = search.trim();
                    const found = await productApi.getBySku(sku);
                    if (found && found.product_variant_id) {
                      // convert to ProductVariantRow shape
                      const v: ProductVariantRow = {
                        ...found,
                        product_variant_id: found.product_variant_id,
                        variant_name: found.variant_name ?? found.product_name,
                        unit_price: found.unit_price ?? found.price ?? 0,
                      };
                      handleSelect(v);
                    }
                  }
                }}
                className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-accent-500"
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">
              {isLoading
                ? "Buscando..."
                : `${variants.length} resultado${variants.length !== 1 ? "s" : ""}${variants.length === 50 ? " (máx. mostrados)" : ""}`}
            </p>
          </div>

          <ul className="max-h-80 overflow-y-auto">
            {isLoading ? (
              <li className="flex items-center justify-center py-6">
                <div className="w-5 h-5 border-2 border-accent-200 border-t-accent-500 rounded-full animate-spin" />
              </li>
            ) : variants.length === 0 ? (
              <li className="px-4 py-4 text-sm text-gray-500 text-center">
                {search.trim()
                  ? `Sin resultados para "${search.trim()}"`
                  : "No hay productos para mostrar"}
              </li>
            ) : (
              variants.map((v) => {
                const id = getVariantId(v);
                const isSelected = !!id && id === value;
                return (
                  <li key={id ?? `${v.sku}-${v.product_name}`}>
                    <button
                      type="button"
                      onClick={() => handleSelect(v)}
                      className={[
                        "w-full text-left px-4 py-2 text-sm transition-colors",
                        isSelected
                          ? "bg-accent-50 text-accent-700 font-medium"
                          : "text-gray-700 hover:bg-gray-50",
                      ].join(" ")}
                    >
                      <div className="flex justify-between items-center gap-2">
                        <span className="block truncate">
                          {getVariantName(v)}
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded whitespace-nowrap bg-gray-100 text-gray-600">
                          {v.sku ?? "—"}
                        </span>
                      </div>
                      <div className="text-[11px] text-gray-500 mt-0.5">
                        Precio:{" "}
                        <span className="font-mono">
                          {getVariantPrice(v).toLocaleString("es-CR", {
                            minimumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}

      {hint && !error && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
      {error && (
        <p className="mt-1 text-xs text-red-600 font-medium">{error}</p>
      )}
    </div>
  );
}
