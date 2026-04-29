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
    <div className="space-y-2">
      {rows.length === 0 ? (
        <p className="text-xs text-gray-500">
          Aún no hay componentes. Un compuesto necesita al menos un componente
          para guardarse.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-xs font-medium text-gray-600">
                <th className="px-2 py-1">Componente</th>
                <th className="px-2 py-1 w-32">Cantidad</th>
                <th className="px-2 py-1 w-12" />
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => {
                const blocksParent =
                  parentVariantId &&
                  row.child_product_variant_id === parentVariantId;
                return (
                  <tr
                    key={`${row.child_product_variant_id || "new"}-${index}`}
                    className="border-b border-gray-100 align-top"
                  >
                    <td className="px-2 py-2">
                      <ProductVariantComboBox
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
                    </td>
                    <td className="px-2 py-2">
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
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-accent-500"
                      />
                    </td>
                    <td className="px-2 py-2">
                      <button
                        type="button"
                        onClick={() => removeRow(index)}
                        disabled={disabled}
                        aria-label="Quitar componente"
                        className="text-gray-400 hover:text-red-600 transition-colors"
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <button
        type="button"
        onClick={addRow}
        disabled={disabled}
        className="text-sm text-accent-600 hover:text-accent-700 font-medium"
      >
        + Agregar componente
      </button>

      {error && (
        <p className="text-xs text-red-600 font-medium">{error}</p>
      )}
    </div>
  );
}
