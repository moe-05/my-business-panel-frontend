import { useMemo, useState } from "react";
import { useLoaderData } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

import {
  createWarehouse,
  updateWarehouse,
  deleteWarehouse,
  createBranchWithSalesFloor,
} from "@/router/actions/warehouse.actions";
import { warehouseApi } from "@/api/warehouse.api";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Table } from "@/components/ui/Table";
import { Toast } from "@/components/ui/Toast";
import { IconEdit, IconPlus, IconTrash } from "@/assets/icons";

import type { Warehouse } from "@/interfaces/entities/Warehouse.interface";
import type { Branch } from "@/interfaces/entities/Branch.interface";
import type { ToastMode } from "@/interfaces/components/ui/ToastProps.interface";
import type { WarehousesPageLoaderData } from "@/router/loaders/warehouse.loaders";

import {
  WarehouseUpsertModal,
  type WarehouseFormErrors,
  type WarehouseFormState,
} from "./WarehouseUpsertModal";

const initialFormState: WarehouseFormState = {
  branch_id: "",
  warehouse_name: "",
  warehouse_address: "",
  is_branch: false,
  branch_name: "",
  branch_number: "",
  branch_address: "",
  branch_is_main: false,
};

export function WarehousesPage() {
  const loaderData = useLoaderData() as WarehousesPageLoaderData;
  const { user: currentUser } = useAuth();
  const tenantId =
    loaderData.tenantId ?? currentUser?.tenant?.tenant_id ?? null;

  const [warehouses, setWarehouses] = useState<Warehouse[]>(
    loaderData.warehouses,
  );
  const [branches, setBranches] = useState<Branch[]>(loaderData.branches);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<Warehouse | null>(null);
  const [formData, setFormData] = useState<WarehouseFormState>(initialFormState);
  const [formErrors, setFormErrors] = useState<WarehouseFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [toast, setToast] = useState<{
    mode: ToastMode;
    message: string;
  } | null>(null);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return warehouses;
    return warehouses.filter(
      (w) =>
        w.warehouse_id.toLowerCase().includes(q) ||
        w.warehouse_name.toLowerCase().includes(q) ||
        (w.branch_name ?? "").toLowerCase().includes(q),
    );
  }, [warehouses, searchQuery]);

  const closeModal = () => {
    setIsModalOpen(false);
    setEditing(null);
    setFormData(initialFormState);
    setFormErrors({});
  };

  const handleEdit = (w: Warehouse) => {
    setEditing(w);
    setFormData({
      ...initialFormState,
      branch_id: w.branch_id,
      warehouse_name: w.warehouse_name,
      warehouse_address: w.warehouse_address,
      is_branch: w.is_branch,
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const validate = (): boolean => {
    const errors: WarehouseFormErrors = {};
    if (formData.is_branch && !editing) {
      if (!formData.branch_name.trim())
        errors.branch_name = "El nombre de la sucursal es requerido";
      if (!formData.branch_number.trim())
        errors.branch_number = "El número de sucursal es requerido";
    } else {
      if (!editing && !formData.branch_id)
        errors.branch_id = "Selecciona una sucursal";
      if (!formData.warehouse_name.trim())
        errors.warehouse_name = "El nombre del almacén es requerido";
      if (!formData.warehouse_address.trim())
        errors.warehouse_address = "La dirección del almacén es requerida";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);

    try {
      if (editing) {
        const updated = await updateWarehouse(editing.warehouse_id, {
          warehouse_name: formData.warehouse_name,
          warehouse_address: formData.warehouse_address,
          is_branch: formData.is_branch,
        });
        setWarehouses((prev) =>
          prev.map((w) =>
            w.warehouse_id === editing.warehouse_id ? { ...w, ...updated } : w,
          ),
        );
        setToast({ mode: "success", message: "Almacén actualizado" });
      } else if (formData.is_branch) {
        if (!tenantId) throw new Error("Tenant no disponible para esta sesión");

        const { warehouse } = await createBranchWithSalesFloor({
          branch: {
            tenant_id: tenantId,
            branch_name: formData.branch_name,
            branch_number: formData.branch_number,
            branch_address: formData.branch_address,
            is_main_branch: formData.branch_is_main,
          },
          warehouse: { warehouse_address: formData.branch_address },
        });

        const refreshed = await warehouseApi.listByTenant();
        setWarehouses(refreshed);
        setToast({
          mode: "success",
          message: warehouse
            ? "Sucursal y piso de venta creados"
            : "Sucursal creada (verifica el almacén asociado)",
        });
      } else {
        const created = await createWarehouse({
          branch_id: formData.branch_id,
          warehouse_name: formData.warehouse_name,
          warehouse_address: formData.warehouse_address,
          is_branch: false,
        });
        const branch = branches.find((b) => b.branch_id === created.branch_id);
        setWarehouses((prev) => [
          { ...created, branch_name: branch?.branch_name },
          ...prev,
        ]);
        setToast({ mode: "success", message: "Almacén creado" });
      }
      closeModal();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Error al guardar almacén";
      setToast({ mode: "error", message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (warehouse: Warehouse) => {
    if (
      !confirm(
        `¿Eliminar el almacén "${warehouse.warehouse_name}"? Esta acción es irreversible.`,
      )
    )
      return;

    const snapshot = warehouses;
    setWarehouses((prev) =>
      prev.filter((w) => w.warehouse_id !== warehouse.warehouse_id),
    );

    try {
      await deleteWarehouse(warehouse.warehouse_id);
      setToast({ mode: "success", message: "Almacén eliminado" });
    } catch (error) {
      setWarehouses(snapshot);
      const message =
        error instanceof Error ? error.message : "Error al eliminar almacén";
      setToast({ mode: "error", message });
    }
  };

  const handleOpenCreate = async () => {
    setIsModalOpen(true);
    if (tenantId && branches.length === 0) {
      try {
        const { branchApi } = await import("@/api/branch.api");
        const result = await branchApi.listByTenant(tenantId, 1, 200);
        setBranches(result.branches ?? []);
      } catch {
        // silent: el formulario seguirá pidiendo branch
      }
    }
  };

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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Almacenes</h1>
        <p className="text-gray-600">
          Gestiona bodegas y pisos de venta del tenant
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-300 p-6 mb-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex-1 min-w-0">
            <Input
              label="Buscar almacén"
              placeholder="Buscar por nombre, ID o sucursal"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full lg:max-w-sm"
            />
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">
              {warehouses.length} almace
              {warehouses.length === 1 ? "n" : "nes"}
            </span>
            <Button variant="primary" size="md" onClick={handleOpenCreate}>
              <IconPlus />
              Nuevo Almacén
            </Button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-300 p-6">
        <Table
          columns={[
            { key: "warehouse_name", label: "Nombre", width: "25%" },
            {
              key: "branch_name",
              label: "Sucursal",
              width: "20%",
              render: (_: unknown, row: Warehouse) =>
                row.branch_name ?? row.branch_id.slice(0, 8),
            },
            { key: "warehouse_address", label: "Dirección", width: "30%" },
            {
              key: "is_branch",
              label: "Tipo",
              width: "12%",
              render: (value: unknown) => (
                <Badge variant={(value as boolean) ? "success" : "secondary"}>
                  {(value as boolean) ? "Piso de venta" : "Bodega"}
                </Badge>
              ),
            },
            {
              key: "actions",
              label: "Acciones",
              width: "13%",
              render: (_: unknown, row: Warehouse) => (
                <div
                  className="flex gap-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Button
                    onClick={() => handleEdit(row)}
                    title="Editar"
                    variant="ghost"
                  >
                    <IconEdit />
                  </Button>
                  <Button
                    onClick={() => handleDelete(row)}
                    title="Eliminar"
                    variant="danger"
                  >
                    <IconTrash />
                  </Button>
                </div>
              ),
            },
          ]}
          data={filtered}
          emptyMessage="No hay almacenes registrados"
        />
      </div>

      <WarehouseUpsertModal
        isOpen={isModalOpen}
        isEditing={!!editing}
        formData={formData}
        formErrors={formErrors}
        branches={branches}
        isSubmitting={isSubmitting}
        onClose={closeModal}
        onSubmit={handleSubmit}
        onChange={setFormData}
      />
    </div>
  );
}
