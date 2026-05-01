import { useState, useEffect, useRef, useCallback } from "react";
import { categoryApi } from "../../api/category.api";
import type { Category } from "../../interfaces/entities/Category.interface";

type SearchMode = "name" | "cabys";

interface CategoryComboBoxProps {
  value: string; // product_category_id (UUID)
  displayValue?: string; // category_name for display
  onChange: (categoryId: string, categoryName: string) => void;
  error?: string;
  required?: boolean;
  label?: string;
  disabled?: boolean;
  hint?: string;
}

export function CategoryComboBox({
  value,
  displayValue,
  onChange,
  error,
  required,
  label,
  disabled,
  hint,
}: CategoryComboBoxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchMode, setSearchMode] = useState<SearchMode>("name");
  const [search, setSearch] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedName, setSelectedName] = useState(displayValue || "");
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (displayValue) setSelectedName(displayValue);
  }, [displayValue]);

  useEffect(() => {
    if (!value || displayValue) return;

    let cancelled = false;

    (async () => {
      try {
        const rows = await categoryApi.searchByCabys(value, 20, 0);
        if (cancelled) return;
        const exactMatch = rows.find((row) => row.category_id === value);
        if (exactMatch) {
          setSelectedName(exactMatch.category_name);
        }
      } catch {
        if (!cancelled) setSelectedName("");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [value, displayValue]);

  const fetchCategories = useCallback(async (searchTerm: string, mode: SearchMode) => {
    setIsLoading(true);
    try {
      const data =
        mode === "cabys"
          ? await categoryApi.searchByCabys(searchTerm, 100, 0)
          : await categoryApi.search(searchTerm, 100, 0);
      setCategories(data);
    } catch {
      setCategories([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchCategories(search, searchMode);
    }, 500);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [search, searchMode, isOpen, fetchCategories]);

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
    fetchCategories("", searchMode);
    setTimeout(() => searchInputRef.current?.focus(), 50);
  };

  const handleModeChange = (mode: SearchMode) => {
    setSearchMode(mode);
    setSearch("");
    setCategories([]);
    fetchCategories("", mode);
    setTimeout(() => searchInputRef.current?.focus(), 50);
  };

  const handleSelect = (cat: Category) => {
    onChange(cat.category_id, cat.category_name);
    setSelectedName(cat.category_name);
    setIsOpen(false);
    setSearch("");
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("", "");
    setSelectedName("");
  };

  return (
    <div ref={containerRef} className="relative">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {/* Trigger button */}
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
            ? `${selectedName} (${value})`
            : "Buscar y seleccionar producto CABYS..."}
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

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
          {/* Mode toggle tabs */}
          <div className="flex border-b border-gray-100">
            <button
              type="button"
              onClick={() => handleModeChange("name")}
              className={[
                "flex-1 px-3 py-2 text-xs font-medium transition-colors",
                searchMode === "name"
                  ? "bg-accent-50 text-accent-700 border-b-2 border-accent-500"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-50",
              ].join(" ")}
            >
              Por nombre
            </button>
            <button
              type="button"
              onClick={() => handleModeChange("cabys")}
              className={[
                "flex-1 px-3 py-2 text-xs font-medium transition-colors",
                searchMode === "cabys"
                  ? "bg-accent-50 text-accent-700 border-b-2 border-accent-500"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-50",
              ].join(" ")}
            >
              Por código CABYS
            </button>
          </div>

          {/* Search input */}
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
                type={searchMode === "cabys" ? "text" : "text"}
                inputMode={searchMode === "cabys" ? "numeric" : "text"}
                placeholder={
                  searchMode === "cabys"
                    ? "Ingrese el código CABYS..."
                    : "Buscar por nombre..."
                }
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-accent-500"
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">
              {isLoading
                ? "Cargando..."
                : `${categories.length} resultado${categories.length !== 1 ? "s" : ""}${categories.length === 100 ? " (máx. mostrados)" : ""}`}
            </p>
          </div>

          {/* Results list */}
          <ul className="max-h-60 overflow-y-auto">
            {isLoading ? (
              <li className="flex items-center justify-center py-6">
                <div className="w-5 h-5 border-2 border-accent-200 border-t-accent-500 rounded-full animate-spin" />
              </li>
            ) : categories.length === 0 ? (
              <li className="px-4 py-4 text-sm text-gray-500 text-center">
                Sin resultados para &ldquo;{search}&rdquo;
              </li>
            ) : (
              categories.map((cat) => (
                <li key={cat.category_id}>
                  <button
                    type="button"
                    onClick={() => handleSelect(cat)}
                    className={[
                      "w-full text-left px-4 py-2 text-sm transition-colors",
                      value === cat.category_id
                        ? "bg-accent-50 text-accent-700 font-medium"
                        : "text-gray-700 hover:bg-gray-50",
                    ].join(" ")}
                  >
                    <div className="flex justify-between items-center gap-2">
                      <span className="block truncate">{cat.category_name}</span>
                      <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded whitespace-nowrap ${(cat.category_id?.length ?? 0) === 13 ? 'bg-green-100 text-green-700 font-bold' : 'bg-gray-100 text-gray-500'}`}>
                        {cat.category_id ?? 'N/A'}
                      </span>
                    </div>
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      )}

      {hint && !error && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
      {error && <p className="mt-1 text-xs text-red-600 font-medium">{error}</p>}
    </div>
  );
}
