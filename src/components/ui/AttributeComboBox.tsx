import { useState, useEffect, useRef, useCallback } from "react";
import { tenantAttributeApi } from "@/api/attribute.api";
import type { UnifiedAttribute } from "@/interfaces/entities/Attribute.interface";

interface AttributeComboBoxProps {
  tenantId: string;
  /**
   * Selected attribute identifier. For TENANT rows, this is the
   * `tenant_attribute_id`. For GLOBAL rows it is the `global_attribute_id`
   * (the row will be promoted to tenant scope when the user picks a value).
   */
  value: string;
  /** Cached display name of the selected row, to render the trigger. */
  displayValue?: string;
  /**
   * Called when an existing attribute is picked (already promoted to TENANT)
   * or when a new tenant_attribute is just created (custom or from global).
   */
  onChange: (tenantAttributeId: string, attributeName: string) => void;
  error?: string;
  required?: boolean;
  label?: string;
  disabled?: boolean;
  hint?: string;
  /** When true, hide attribute IDs that are already used in the parent form. */
  excludeIds?: string[];
}

const PAGE_SIZE = 100;

export function AttributeComboBox({
  tenantId,
  value,
  displayValue,
  onChange,
  error,
  required,
  label,
  disabled,
  hint,
  excludeIds = [],
}: AttributeComboBoxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<UnifiedAttribute[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedName, setSelectedName] = useState(displayValue ?? "");

  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (displayValue !== undefined) setSelectedName(displayValue);
  }, [displayValue]);

  const fetchAttributes = useCallback(
    async (term: string, pageNum: number) => {
      if (!tenantId) return;
      setIsLoading(true);
      try {
        const res = await tenantAttributeApi.searchUnified(
          tenantId,
          term,
          pageNum,
          PAGE_SIZE,
        );
        setResults(res.attributes);
        setTotal(res.total);
        setPage(res.page);
      } catch {
        setResults([]);
        setTotal(0);
      } finally {
        setIsLoading(false);
      }
    },
    [tenantId],
  );

  useEffect(() => {
    if (!isOpen) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchAttributes(search, 1);
    }, 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [search, isOpen, fetchAttributes]);

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
    fetchAttributes("", 1);
    setTimeout(() => searchInputRef.current?.focus(), 50);
  };

  const handleSelect = async (row: UnifiedAttribute) => {
    if (row.source === "TENANT") {
      onChange(row.id, row.name);
      setSelectedName(row.name);
      setIsOpen(false);
      setSearch("");
      return;
    }
    // GLOBAL row → promote to tenant scope by creating a tenant_attribute
    setIsCreating(true);
    try {
      const created = await tenantAttributeApi.createFromGlobal(
        tenantId,
        row.global_attribute_id ?? row.id,
      );
      onChange(created.tenant_attribute_id, created.attribute_name);
      setSelectedName(created.attribute_name);
      setIsOpen(false);
      setSearch("");
    } catch (err) {
      console.error(err);
    } finally {
      setIsCreating(false);
    }
  };

  const handleInlineCreate = async () => {
    const term = search.trim();
    if (!term) return;
    setIsCreating(true);
    try {
      const created = await tenantAttributeApi.createCustom(tenantId, term);
      onChange(created.tenant_attribute_id, created.attribute_name);
      setSelectedName(created.attribute_name);
      setIsOpen(false);
      setSearch("");
    } catch (err) {
      console.error(err);
    } finally {
      setIsCreating(false);
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("", "");
    setSelectedName("");
  };

  const goToPage = (target: number) => {
    if (target < 1) return;
    fetchAttributes(search, target);
  };

  const filtered = excludeIds.length
    ? results.filter((r) => !excludeIds.includes(r.id))
    : results;

  const exactMatch = results.some(
    (r) => r.name.trim().toLowerCase() === search.trim().toLowerCase(),
  );

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div ref={containerRef} className="relative">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

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
        <span className="block truncate pr-8">
          {value && selectedName
            ? selectedName
            : "Buscar o crear atributo..."}
        </span>
        <span className="absolute inset-y-0 right-0 flex items-center pr-3 gap-1">
          {value && !disabled && (
            <button
              aria-label="limpiar selección"
              type="button"
              onClick={handleClear}
              className="text-gray-400 hover:text-gray-600 transition-colors"
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
                placeholder="Buscar por nombre..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-accent-500"
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">
              {isLoading
                ? "Cargando..."
                : `${total} resultado${total !== 1 ? "s" : ""} · página ${page}/${totalPages}`}
            </p>
          </div>

          <ul className="max-h-60 overflow-y-auto">
            {isLoading ? (
              <li className="flex items-center justify-center py-6">
                <div className="w-5 h-5 border-2 border-accent-200 border-t-accent-500 rounded-full animate-spin" />
              </li>
            ) : filtered.length === 0 ? (
              <li className="px-4 py-4 text-sm text-gray-500 text-center">
                Sin resultados para &ldquo;{search}&rdquo;
              </li>
            ) : (
              filtered.map((row) => (
                <li key={`${row.source}-${row.id}`}>
                  <button
                    type="button"
                    onClick={() => handleSelect(row)}
                    disabled={isCreating}
                    className={[
                      "w-full text-left px-4 py-2 text-sm transition-colors",
                      value === row.id
                        ? "bg-accent-50 text-accent-700 font-medium"
                        : "text-gray-700 hover:bg-gray-50",
                    ].join(" ")}
                  >
                    <div className="flex justify-between items-center gap-2">
                      <span className="block truncate">{row.name}</span>
                      <span
                        className={[
                          "text-[10px] font-mono px-1.5 py-0.5 rounded whitespace-nowrap",
                          row.source === "GLOBAL"
                            ? "bg-blue-100 text-blue-700"
                            : row.is_custom
                              ? "bg-amber-100 text-amber-700"
                              : "bg-green-100 text-green-700",
                        ].join(" ")}
                      >
                        {row.source === "GLOBAL"
                          ? "Global"
                          : row.is_custom
                            ? "Custom"
                            : "Linkeado"}
                      </span>
                    </div>
                  </button>
                </li>
              ))
            )}
          </ul>

          {/* Inline create CTA */}
          {!isLoading && search.trim() && !exactMatch && (
            <div className="border-t border-gray-100 p-2">
              <button
                type="button"
                disabled={isCreating}
                onClick={handleInlineCreate}
                className="w-full px-3 py-2 text-sm bg-accent-500 hover:bg-accent-600 disabled:opacity-50 text-white rounded-lg transition-colors"
              >
                {isCreating
                  ? "Creando..."
                  : `Crear atributo "${search.trim()}"`}
              </button>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-3 py-2 border-t border-gray-100 text-xs text-gray-500">
              <button
                type="button"
                onClick={() => goToPage(page - 1)}
                disabled={page <= 1 || isLoading}
                className="px-2 py-1 rounded hover:bg-gray-100 disabled:opacity-40"
              >
                Anterior
              </button>
              <span>
                {page} / {totalPages}
              </span>
              <button
                type="button"
                onClick={() => goToPage(page + 1)}
                disabled={page >= totalPages || isLoading}
                className="px-2 py-1 rounded hover:bg-gray-100 disabled:opacity-40"
              >
                Siguiente
              </button>
            </div>
          )}
        </div>
      )}

      {hint && !error && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
      {error && <p className="mt-1 text-xs text-red-600 font-medium">{error}</p>}
    </div>
  );
}
