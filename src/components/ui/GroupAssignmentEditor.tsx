import { useEffect, useState } from "react";
import {
  productGroupApi,
  productGroupTypeApi,
} from "@/api/productGroup.api";
import type {
  TenantProductGroup,
  TenantProductGroupType,
} from "@/interfaces/entities/ProductGroup.interface";

interface GroupAssignmentEditorProps {
  tenantId: string;
  /** Currently selected tenant_product_group_ids (across all dimensions). */
  value: string[];
  onChange: (groupIds: string[]) => void;
  disabled?: boolean;
}

/**
 * Renders one tree picker per group type (Departamento, Familia, Marca, ...)
 * and merges the selections into a single list of group IDs. Lets the user
 * pick zero, one, or many groups per dimension.
 */
export function GroupAssignmentEditor({
  tenantId,
  value,
  onChange,
  disabled,
}: GroupAssignmentEditorProps) {
  const [types, setTypes] = useState<TenantProductGroupType[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    if (!tenantId) {
      setTypes([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    productGroupTypeApi
      .listByTenant(tenantId)
      .then((data) => {
        if (!cancelled) setTypes(data);
      })
      .catch(() => {
        if (!cancelled) setTypes([]);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [tenantId]);

  if (isLoading) {
    return (
      <p className="text-xs text-gray-400">Cargando dimensiones...</p>
    );
  }

  if (types.length === 0) {
    return (
      <p className="text-xs text-gray-500">
        Aún no hay dimensiones configuradas. Crea dimensiones (Departamento,
        Familia, Marca, ...) en la sección de Atributos para asociar productos.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {types.map((type) => (
        <GroupTypePicker
          key={type.tenant_product_group_type_id}
          tenantId={tenantId}
          type={type}
          value={value}
          onChange={onChange}
          disabled={disabled}
        />
      ))}
    </div>
  );
}

interface GroupTypePickerProps {
  tenantId: string;
  type: TenantProductGroupType;
  value: string[];
  onChange: (groupIds: string[]) => void;
  disabled?: boolean;
}

function GroupTypePicker({
  tenantId,
  type,
  value,
  onChange,
  disabled,
}: GroupTypePickerProps) {
  const [tree, setTree] = useState<TenantProductGroup[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    productGroupApi
      .tree(tenantId, type.tenant_product_group_type_id)
      .then((data) => {
        if (!cancelled) setTree(data);
      })
      .catch(() => {
        if (!cancelled) setTree([]);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [tenantId, type.tenant_product_group_type_id]);

  const idsInThisType = new Set(
    tree.map((g) => g.tenant_product_group_id),
  );
  const selectedInThisType = value.filter((id) => idsInThisType.has(id));

  // Quick lookup: groupId -> parent_group_id (within this type).
  const parentByChild = new Map<string, string | null>();
  for (const g of tree) {
    parentByChild.set(g.tenant_product_group_id, g.parent_group_id);
  }

  const collectAncestors = (groupId: string): string[] => {
    const ancestors: string[] = [];
    let current: string | null | undefined = parentByChild.get(groupId);
    const guard = new Set<string>();
    while (current && !guard.has(current)) {
      guard.add(current);
      ancestors.push(current);
      current = parentByChild.get(current);
    }
    return ancestors;
  };

  const toggle = (groupId: string) => {
    if (disabled) return;
    if (value.includes(groupId)) {
      // Uncheck only this node; do not auto-uncheck ancestors (they may still
      // apply on their own or via siblings).
      onChange(value.filter((id) => id !== groupId));
    } else {
      // Check this node + all of its ancestors not already selected.
      const ancestors = collectAncestors(groupId);
      const additions = [groupId, ...ancestors].filter(
        (id) => !value.includes(id),
      );
      onChange([...value, ...additions]);
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg bg-white">
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="w-full flex items-center justify-between px-3 py-2 text-sm"
      >
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-700">{type.type_name}</span>
          {selectedInThisType.length > 0 && (
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-accent-100 text-accent-700">
              {selectedInThisType.length} seleccionado
              {selectedInThisType.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>
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
      </button>

      {isOpen && (
        <div className="border-t border-gray-100 max-h-56 overflow-y-auto p-2">
          {isLoading ? (
            <p className="text-xs text-gray-400">Cargando árbol...</p>
          ) : tree.length === 0 ? (
            <p className="text-xs text-gray-500">
              No hay grupos en esta dimensión.
            </p>
          ) : (
            <ul className="space-y-0.5">
              {tree.map((g) => {
                const checked = value.includes(g.tenant_product_group_id);
                return (
                  <li key={g.tenant_product_group_id}>
                    <label
                      className={[
                        "flex items-center gap-2 px-2 py-1 rounded text-sm cursor-pointer transition-colors",
                        checked
                          ? "bg-accent-50 text-accent-700"
                          : "hover:bg-gray-50 text-gray-700",
                      ].join(" ")}
                      style={{
                        paddingLeft: `${0.5 + (g.hierarchy_level ?? 0) * 1.25}rem`,
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={disabled}
                        onChange={() => toggle(g.tenant_product_group_id)}
                        className="accent-accent-500"
                      />
                      <span className="truncate">{g.group_name}</span>
                    </label>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
