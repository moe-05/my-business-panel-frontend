import { useState } from "react";
import { useLoaderData } from "react-router-dom";

import { warehouseApi } from "@/api/warehouse.api";
import { createInventoryTransfer } from "@/router/actions/inventoryTransfer.actions";

import { Button } from "@/components/ui/Button";
import { Table } from "@/components/ui/Table";
import { Toast } from "@/components/ui/Toast";
import { IconPlus } from "@/assets/icons";

import type { ToastMode } from "@/interfaces/components/ui/ToastProps.interface";
import type { InventoryTransfer } from "@/interfaces/entities/InventoryTransfer.interface";
import type { InventoryTransferProductInput } from "@/interfaces/api/requests/CreateInventoryTransferRequest.interface";
import type { MovementsPageLoaderData } from "@/router/loaders/inventoryTransfer.loaders";

import { TransferModal } from "./TransferModal";

export function MovementsPage() {
  const { transfers: initialTransfers, warehouses, tenantId } =
    useLoaderData() as MovementsPageLoaderData;

  const [transfers, setTransfers] =
    useState<InventoryTransfer[]>(initialTransfers);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{
    mode: ToastMode;
    message: string;
  } | null>(null);

  const handleCreateTransfer = async (payload: {
    origin_warehouse_id: string;
    destination_warehouse_id: string;
    departure_date: string | null;
    arrival_date: string | null;
    products: InventoryTransferProductInput[];
  }) => {
    if (!tenantId) {
      setToast({ mode: "error", message: "Tenant no disponible" });
      return;
    }
    setIsSubmitting(true);
    try {
      await createInventoryTransfer({
        ...payload,
        tenant_id: tenantId,
      });
      const refreshed = await warehouseApi.listTransfers();
      setTransfers(refreshed);
      setToast({ mode: "success", message: "Transferencia creada" });
      setIsModalOpen(false);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Error al crear transferencia";
      setToast({ mode: "error", message });
    } finally {
      setIsSubmitting(false);
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Movimientos de inventario
        </h1>
        <p className="text-gray-600">
          Transferencias entre almacenes y pisos de venta
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-300 p-6 mb-6">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">
            {transfers.length} transferencia{transfers.length === 1 ? "" : "s"}
          </span>
          <Button
            variant="primary"
            onClick={() => setIsModalOpen(true)}
            disabled={warehouses.length < 2}
          >
            <IconPlus />
            Nueva transferencia
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-300 p-6">
        <Table
          columns={[
            {
              key: "transfer_date",
              label: "Fecha",
              width: "18%",
              render: (value: unknown) =>
                new Date(value as string).toLocaleString("es-CR"),
            },
            { key: "from_warehouse_name", label: "Origen", width: "22%" },
            { key: "to_warehouse_name", label: "Destino", width: "22%" },
            {
              key: "total_lines",
              label: "Líneas",
              width: "12%",
              render: (value: unknown) => (
                <span className="font-mono">{value as number}</span>
              ),
            },
            {
              key: "total_units",
              label: "Unidades",
              width: "12%",
              render: (value: unknown) => (
                <span className="font-mono">{value as number}</span>
              ),
            },
            {
              key: "inventory_transfer_id",
              label: "ID",
              width: "14%",
              render: (value: unknown) => (
                <span className="font-mono text-[11px]">
                  {(value as string).slice(0, 8)}
                </span>
              ),
            },
          ]}
          data={transfers}
          emptyMessage="No hay transferencias registradas"
        />
      </div>

      <TransferModal
        isOpen={isModalOpen}
        warehouses={warehouses}
        isSubmitting={isSubmitting}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateTransfer}
      />
    </div>
  );
}
