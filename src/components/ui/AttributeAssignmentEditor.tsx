import { useEffect, useState } from "react";
import { AttributeComboBox } from "./AttributeComboBox";
import { attributeValueApi } from "@/api/attribute.api";
import type { AttributeValue } from "@/interfaces/entities/Attribute.interface";

export interface AttributeAssignmentRow {
  /** Always a tenant_attribute_id once selected. */
  tenant_attribute_id: string;
  attribute_name: string;
  /** Selected attribute_value_ids for this attribute (multi-select). */
  selected_value_ids: string[];
}

interface AttributeAssignmentEditorProps {
  tenantId: string;
  rows: AttributeAssignmentRow[];
  onChange: (rows: AttributeAssignmentRow[]) => void;
  disabled?: boolean;
}

/**
 * Edits a list of (attribute, [values]) rows for a product variant.
 * - The attribute selector uses the unified search (global+tenant).
 * - For each row, the values are loaded on demand for the picked attribute,
 *   with an inline-create option when none of the existing values fit.
 */
export function AttributeAssignmentEditor({
  tenantId,
  rows,
  onChange,
  disabled,
}: AttributeAssignmentEditorProps) {
  const handleAddRow = () => {
    onChange([
      ...rows,
      {
        tenant_attribute_id: "",
        attribute_name: "",
        selected_value_ids: [],
      },
    ]);
  };

  const handleAttributeChange = (
    index: number,
    tenantAttributeId: string,
    attributeName: string,
  ) => {
    const next = rows.slice();
    next[index] = {
      tenant_attribute_id: tenantAttributeId,
      attribute_name: attributeName,
      selected_value_ids: [],
    };
    onChange(next);
  };

  const handleValuesChange = (index: number, valueIds: string[]) => {
    const next = rows.slice();
    next[index] = { ...next[index], selected_value_ids: valueIds };
    onChange(next);
  };

  const handleRemoveRow = (index: number) => {
    onChange(rows.filter((_, i) => i !== index));
  };

  const usedAttributeIds = rows
    .map((r) => r.tenant_attribute_id)
    .filter(Boolean);

  return (
    <div className="space-y-3">
      {rows.length === 0 && (
        <p className="text-xs text-gray-500">
          Aún no hay atributos asignados.
        </p>
      )}

      {rows.map((row, index) => (
        <div
          key={`${row.tenant_attribute_id || "new"}-${index}`}
          className="grid grid-cols-12 gap-2 items-start p-3 border border-gray-200 rounded-lg bg-gray-50"
        >
          <div className="col-span-12 sm:col-span-5">
            <AttributeComboBox
              tenantId={tenantId}
              value={row.tenant_attribute_id}
              displayValue={row.attribute_name}
              label={index === 0 ? "Atributo" : undefined}
              onChange={(id, name) => handleAttributeChange(index, id, name)}
              disabled={disabled}
              excludeIds={usedAttributeIds.filter(
                (id) => id !== row.tenant_attribute_id,
              )}
            />
          </div>

          <div className="col-span-11 sm:col-span-6">
            <AttributeValuePicker
              tenantId={tenantId}
              tenantAttributeId={row.tenant_attribute_id}
              label={index === 0 ? "Valores" : undefined}
              selectedValueIds={row.selected_value_ids}
              onChange={(ids) => handleValuesChange(index, ids)}
              disabled={disabled || !row.tenant_attribute_id}
            />
          </div>

          <div className="col-span-1 flex justify-end pt-6 sm:pt-7">
            <button
              type="button"
              onClick={() => handleRemoveRow(index)}
              disabled={disabled}
              aria-label="Quitar atributo"
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
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={handleAddRow}
        disabled={disabled}
        className="text-sm text-accent-600 hover:text-accent-700 font-medium"
      >
        + Agregar atributo
      </button>
    </div>
  );
}

interface AttributeValuePickerProps {
  tenantId: string;
  tenantAttributeId: string;
  selectedValueIds: string[];
  onChange: (valueIds: string[]) => void;
  label?: string;
  disabled?: boolean;
}

function AttributeValuePicker({
  tenantId,
  tenantAttributeId,
  selectedValueIds,
  onChange,
  label,
  disabled,
}: AttributeValuePickerProps) {
  const [values, setValues] = useState<AttributeValue[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newValue, setNewValue] = useState("");

  useEffect(() => {
    let cancelled = false;
    if (!tenantAttributeId) {
      setValues([]);
      return;
    }
    setIsLoading(true);
    attributeValueApi
      .listByAttribute(tenantId, tenantAttributeId)
      .then((data) => {
        if (!cancelled) setValues(data);
      })
      .catch(() => {
        if (!cancelled) setValues([]);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [tenantId, tenantAttributeId]);

  const toggleValue = (valueId: string) => {
    if (selectedValueIds.includes(valueId)) {
      onChange(selectedValueIds.filter((id) => id !== valueId));
    } else {
      onChange([...selectedValueIds, valueId]);
    }
  };

  const handleCreate = async () => {
    const term = newValue.trim();
    if (!term || !tenantAttributeId) return;
    setIsCreating(true);
    try {
      const created = await attributeValueApi.create(
        tenantId,
        tenantAttributeId,
        term,
      );
      setValues((prev) => [...prev, created]);
      onChange([...selectedValueIds, created.attribute_value_id]);
      setNewValue("");
    } catch (err) {
      console.error(err);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <div
        className={[
          "min-h-[42px] flex flex-wrap gap-1 px-2 py-1.5 border rounded-lg bg-white",
          disabled ? "opacity-50 bg-gray-50" : "border-gray-300",
        ].join(" ")}
      >
        {isLoading ? (
          <span className="text-xs text-gray-400 px-1 py-1">
            Cargando valores...
          </span>
        ) : values.length === 0 ? (
          <span className="text-xs text-gray-400 px-1 py-1">
            {tenantAttributeId
              ? "Sin valores. Crea uno abajo."
              : "Selecciona un atributo primero."}
          </span>
        ) : (
          values.map((v) => {
            const isSelected = selectedValueIds.includes(v.attribute_value_id);
            return (
              <button
                key={v.attribute_value_id}
                type="button"
                onClick={() => toggleValue(v.attribute_value_id)}
                disabled={disabled}
                className={[
                  "px-2 py-1 text-xs rounded-md border transition-colors",
                  isSelected
                    ? "bg-accent-100 border-accent-500 text-accent-700 font-medium"
                    : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50",
                ].join(" ")}
              >
                {v.value}
              </button>
            );
          })
        )}
      </div>

      {tenantAttributeId && !disabled && (
        <div className="flex gap-1 mt-1">
          <input
            type="text"
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleCreate();
              }
            }}
            placeholder="Crear valor..."
            className="flex-1 px-2 py-1 text-xs border border-gray-200 rounded-md focus:outline-none focus:border-accent-500"
          />
          <button
            type="button"
            onClick={handleCreate}
            disabled={isCreating || !newValue.trim()}
            className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 disabled:opacity-50 rounded-md"
          >
            {isCreating ? "..." : "+"}
          </button>
        </div>
      )}
    </div>
  );
}
