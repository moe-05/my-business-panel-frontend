import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Modal } from "@/components/ui/Modal";

import type { Branch } from "@/interfaces/entities/Branch.interface";

export interface WarehouseFormState {
  branch_id: string;
  warehouse_name: string;
  warehouse_address: string;
  is_branch: boolean;
  branch_name: string;
  branch_number: string;
  branch_address: string;
  branch_is_main: boolean;
}

export interface WarehouseFormErrors {
  branch_id?: string;
  warehouse_name?: string;
  warehouse_address?: string;
  branch_name?: string;
  branch_number?: string;
}

interface WarehouseUpsertModalProps {
  isOpen: boolean;
  isEditing: boolean;
  formData: WarehouseFormState;
  formErrors: WarehouseFormErrors;
  branches: Branch[];
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  onChange: (
    updater: (prev: WarehouseFormState) => WarehouseFormState,
  ) => void;
}

export function WarehouseUpsertModal({
  isOpen,
  isEditing,
  formData,
  formErrors,
  branches,
  isSubmitting,
  onClose,
  onSubmit,
  onChange,
}: WarehouseUpsertModalProps) {
  const showBranchInputs = formData.is_branch && !isEditing;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? "Editar Almacén" : "Nuevo Almacén"}
      size="md"
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="flex items-center gap-3 p-4 bg-purple-50 border border-purple-200 rounded-lg">
          <input
            type="checkbox"
            id="is_branch"
            checked={formData.is_branch}
            onChange={(e) =>
              onChange((p) => ({ ...p, is_branch: e.target.checked }))
            }
            disabled={isEditing}
            className="rounded border-purple-300 text-purple-600"
          />
          <label
            htmlFor="is_branch"
            className="text-sm font-medium text-purple-900 cursor-pointer flex-1"
          >
            Es piso de venta (sucursal)
          </label>
        </div>

        {formData.is_branch && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
            {isEditing
              ? "Este almacén funciona como piso de venta de su sucursal."
              : "Crear un piso de venta requiere registrar una nueva sucursal. El almacén se creará automáticamente con los datos de la sucursal."}
          </div>
        )}

        {!showBranchInputs && (
          <Select
            label="Sucursal"
            value={formData.branch_id || ""}
            onChange={(e) =>
              onChange((p) => ({ ...p, branch_id: e.target.value }))
            }
            options={branches.map((b) => ({
              value: b.branch_id,
              label: `${b.branch_name} (${b.branch_number})`,
            }))}
            placeholder="Seleccionar sucursal"
            error={formErrors.branch_id}
            disabled={isEditing}
            required={!isEditing}
            hint={
              isEditing
                ? "No se puede cambiar la sucursal de un almacén existente"
                : undefined
            }
          />
        )}

        {!showBranchInputs && (
          <>
            <Input
              label="Nombre del almacén"
              placeholder="Ej: Bodega central"
              value={formData.warehouse_name}
              onChange={(e) =>
                onChange((p) => ({ ...p, warehouse_name: e.target.value }))
              }
              error={formErrors.warehouse_name}
              required
            />
            <Input
              label="Dirección del almacén"
              placeholder="Dirección completa"
              value={formData.warehouse_address}
              onChange={(e) =>
                onChange((p) => ({ ...p, warehouse_address: e.target.value }))
              }
              error={formErrors.warehouse_address}
              required
            />
          </>
        )}

        {showBranchInputs && (
          <div className="border-t border-gray-200 pt-4 space-y-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Datos de la nueva sucursal
            </p>
            <Input
              label="Nombre de sucursal"
              placeholder="Ej: Sucursal Norte"
              value={formData.branch_name}
              onChange={(e) =>
                onChange((p) => ({ ...p, branch_name: e.target.value }))
              }
              error={formErrors.branch_name}
              required
            />
            <Input
              label="Número de sucursal"
              placeholder="Ej: 001"
              value={formData.branch_number}
              onChange={(e) =>
                onChange((p) => ({ ...p, branch_number: e.target.value }))
              }
              error={formErrors.branch_number}
              required
              maxLength={4}
            />
            <Input
              label="Dirección"
              placeholder="Dirección completa de la sucursal"
              value={formData.branch_address}
              onChange={(e) =>
                onChange((p) => ({ ...p, branch_address: e.target.value }))
              }
            />
            <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <input
                type="checkbox"
                id="branch_is_main"
                checked={formData.branch_is_main}
                onChange={(e) =>
                  onChange((p) => ({
                    ...p,
                    branch_is_main: e.target.checked,
                  }))
                }
                className="rounded border-blue-300 text-blue-600"
              />
              <label
                htmlFor="branch_is_main"
                className="text-sm font-medium text-blue-900 cursor-pointer flex-1"
              >
                Marcar como sucursal principal
              </label>
            </div>
          </div>
        )}

        <div className="flex gap-3 pt-4 border-t border-gray-200">
          <Button type="button" variant="ghost" fullWidth onClick={onClose}>
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            fullWidth
            loading={isSubmitting}
          >
            {isEditing ? "Guardar Cambios" : "Crear Almacén"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
