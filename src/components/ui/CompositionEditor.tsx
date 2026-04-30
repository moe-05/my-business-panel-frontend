import { ProductVariantComboBox } from "./ProductVariantComboBox";

export interface CompositionEditorRow {
  child_product_variant_id: string;
  child_display_name: string;
  quantity: number;
}

interface CompositionEditorProps {
  tenantId: string;
  /** Variant ID of the parent (so it cannot be picked as a component). */
  parentVariantId?: string;
  rows: CompositionEditorRow[];
  onChange: (rows: CompositionEditorRow[]) => void;
  disabled?: boolean;
  error?: string;
}

/**
 * Editor for the composition of a parent variant. Each row pairs a child
 * variant with the quantity of children produced per parent unit (e.g., 6
 * bottles per six-pack).
 */
export function CompositionEditor({
  tenantId,
  parentVariantId,
  rows,
  onChange,
  disabled,
  error,
}: CompositionEditorProps) {
  const addRow = () => {
    onChange([
      ...rows,
      { child_product_variant_id: "", child_display_name: "", quantity: 1 },
    ]);
  };

  const updateRow = (index: number, patch: Partial<CompositionEditorRow>) => {
    const next = rows.slice();
    next[index] = { ...next[index], ...patch };
    onChange(next);
  };

  const removeRow = (index: number) => {
    onChange(rows.filter((_, i) => i !== index));
  };

  const usedIds = new Set(
    rows.map((r) => r.child_product_variant_id).filter(Boolean),
  );

  return (
    <div className="space-y-5 rounded-2xl border border-gray-200 bg-white p-6">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">
        Componentes del lote
      </p>
      {rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-8 text-center text-sm text-gray-500">
          Aún no hay componentes. Un compuesto necesita al menos un componente
          para guardarse.
        </div>
      ) : (
        <div className="space-y-4">
          {rows.map((row, index) => {
            const blocksParent =
              parentVariantId &&
              row.child_product_variant_id === parentVariantId;
            return (
              <div
                key={`${row.child_product_variant_id || "new"}-${index}`}
                className="rounded-xl border border-gray-200 bg-gray-50/60 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]"
              >
                <div className="grid gap-5 md:grid-cols-[minmax(280px,1fr)_160px_auto] md:items-end">
                  <div className="min-w-0">
                    <ProductVariantComboBox
                      label={`Componente ${index + 1}`}
                      tenantId={tenantId}
                      value={row.child_product_variant_id}
                      displayValue={row.child_display_name}
                      disabled={disabled}
                      onChange={(sel) => {
                        if (sel.product_variant_id === parentVariantId) {
                          return;
                        }
                        if (
                          usedIds.has(sel.product_variant_id) &&
                          sel.product_variant_id !==
                            row.child_product_variant_id
                        ) {
                          return;
                        }
                        updateRow(index, {
                          child_product_variant_id: sel.product_variant_id,
                          child_display_name:
                            sel.variant_name +
                            (sel.sku ? ` (${sel.sku})` : ""),
                        });
                      }}
                    />
                    {blocksParent && (
                      <p className="mt-1 text-xs text-red-600">
                        El compuesto no puede contenerse a sí mismo.
                      </p>
                    )}
                  </div>
                  <div className="md:w-[160px]">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Cantidad
                    </label>
                    <input
                      type="number"
                      step="0.001"
                      min={0.001}
                      value={row.quantity}
                      disabled={disabled}
                      onChange={(e) =>
                        updateRow(index, {
                          quantity: Number(e.target.value),
                        })
                      }
                      className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
                    />
                  </div>
                  <div className="flex md:items-center md:justify-center md:pb-1">
                    <button
                      type="button"
                      onClick={() => removeRow(index)}
                      disabled={disabled}
                      aria-label="Quitar componente"
                      title="Quitar componente"
                      className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-transparent text-gray-400 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
                    >
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="flex items-center justify-between gap-3 pt-1">
        <button
          type="button"
          onClick={addRow}
          disabled={disabled}
          className="inline-flex items-center gap-1.5 rounded-lg border border-accent-200 bg-white px-3 py-1.5 text-sm font-medium text-accent-700 transition-colors hover:border-accent-300 hover:bg-accent-50 disabled:opacity-50"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Agregar componente
        </button>

        {error && (
          <p className="text-xs text-red-600 font-medium">{error}</p>
        )}
      </div>
    </div>
  );
}
