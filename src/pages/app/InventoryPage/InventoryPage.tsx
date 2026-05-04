import { useEffect, useMemo, useState } from "react";
import { useLoaderData } from "react-router-dom";

import { warehouseApi } from "@/api/warehouse.api";
import {
  bulkInsertInventory,
  createDiscrepancyReport,
} from "@/router/actions/inventory.actions";
import { useDebounce } from "@/hooks/useDebounce";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Table } from "@/components/ui/Table";
import { Toast } from "@/components/ui/Toast";
import { IconPlus } from "@/assets/icons";

import type { ToastMode } from "@/interfaces/components/ui/ToastProps.interface";
import type { AggregatedInventoryItem } from "@/interfaces/entities/InventoryItem.interface";
import type { InventoryPageLoaderData } from "@/router/loaders/inventory.loaders";

import { AddInventoryModal, type AddInventoryItem } from "./AddInventoryModal";
import { DiscrepancyReportModal } from "./DiscrepancyReportModal";

import { DisaggregateModal } from "./DisaggregateModal";

type StockFilter = "all" | "zero" | "low" | "ok";

export function InventoryPage() {
  const { warehouses, tenantId } = useLoaderData() as InventoryPageLoaderData;

  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>(
    warehouses[0]?.warehouse_id ?? "",
  );
  const [inventory, setInventory] = useState<AggregatedInventoryItem[]>([]);
  const [isLoadingInventory, setIsLoadingInventory] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [stockFilter, setStockFilter] = useState<StockFilter>("all");
  const debouncedSearch = useDebounce(searchQuery, 400);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isDiscrepancyOpen, setIsDiscrepancyOpen] = useState(false);
  const [disaggregatingItem, setDisaggregatingItem] =
    useState<AggregatedInventoryItem | null>(null);
  const [isSubmittingDisaggregate, setIsSubmittingDisaggregate] =
    useState(false);
  const [isSubmittingAdd, setIsSubmittingAdd] = useState(false);
  const [isSubmittingDiscrepancy, setIsSubmittingDiscrepancy] = useState(false);

  const [toast, setToast] = useState<{
    mode: ToastMode;
    message: string;
  } | null>(null);

  const selectedWarehouse = warehouses.find(
    (w) => w.warehouse_id === selectedWarehouseId,
  );

  useEffect(() => {
    if (!selectedWarehouseId) {
      setInventory([]);
      return;
    }
    let cancelled = false;
    setIsLoadingInventory(true);
    warehouseApi
      .listInventoryAggregated(selectedWarehouseId, debouncedSearch || undefined)
      .then((data) => {
        if (!cancelled) setInventory(data);
      })
      .catch((error) => {
        if (cancelled) return;
        const message =
          error instanceof Error ? error.message : "Error al cargar inventario";
        setToast({ mode: "error", message });
        setInventory([]);
      })
      .finally(() => {
        if (!cancelled) setIsLoadingInventory(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedWarehouseId, debouncedSearch]);

  const filtered = useMemo(() => {
    if (stockFilter === "all") return inventory;
    if (stockFilter === "zero") return inventory.filter((i) => i.stock === 0);
    if (stockFilter === "low")
      return inventory.filter((i) => i.stock > 0 && i.stock <= 10);
    return inventory.filter((i) => i.stock > 10);
  }, [inventory, stockFilter]);

  const reloadInventory = async () => {
    if (!selectedWarehouseId) return;
    const fresh = await warehouseApi.listInventoryAggregated(
      selectedWarehouseId,
      debouncedSearch || undefined,
    );
    setInventory(fresh);
  };

  const handleBulkAdd = async (items: AddInventoryItem[]) => {
    if (!selectedWarehouseId) return;
    setIsSubmittingAdd(true);
    try {
      await bulkInsertInventory({
        warehouse_id: selectedWarehouseId,
        items: items.map((i) => ({
          product_variant_id: i.product_variant_id,
          stock: i.stock,
          expiration_date: i.expiration_date,
        })),
      });
      await reloadInventory();
      setToast({
        mode: "success",
        message: `Se agregaron ${items.length} producto${items.length === 1 ? "" : "s"} al inventario`,
      });
      setIsAddOpen(false);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Error al agregar inventario";
      setToast({ mode: "error", message });
    } finally {
      setIsSubmittingAdd(false);
    }
  };

  const handleDisaggregate = async (quantity: number) => {
    if (!disaggregatingItem) return;
    setIsSubmittingDisaggregate(true);
    try {
      await warehouseApi.disaggregateLote(
        disaggregatingItem.warehouse_id,
        disaggregatingItem.product_variant_id,
        quantity,
      );
      setToast({
        mode: "success",
        message: "Lote desagrupado correctamente",
      });
      window.location.reload();
    } catch (error) {
      setToast({
        mode: "error",
        message: error instanceof Error ? error.message : "Error al desagrupar",
      });
    } finally {
      setIsSubmittingDisaggregate(false);
      setDisaggregatingItem(null);
    }
  };

  const handleDiscrepancySubmit = async (data: {
    inventory_id: string;
    product_variant_id: string;
    stored_quantity: number;
    physical_quantity: number;
    discrepancy_reason?: string;
  }) => {
    if (!selectedWarehouseId) return;
    setIsSubmittingDiscrepancy(true);
    try {
      await createDiscrepancyReport({
        product_id: data.product_variant_id,
        warehouse_id: selectedWarehouseId,
        stored_quantity: data.stored_quantity,
        physical_quantity: data.physical_quantity,
        discrepancy_reason: data.discrepancy_reason,
      });
      setToast({
        mode: "success",
        message: "Reporte de discrepancia registrado",
      });
      setIsDiscrepancyOpen(false);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Error al registrar discrepancia";
      setToast({ mode: "error", message });
    } finally {
      setIsSubmittingDiscrepancy(false);
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
          Gestión de Inventario
        </h1>
        <p className="text-gray-600">
          Visualiza y administra el stock por almacén
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-300 p-6 mb-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-end">
          <div className="lg:col-span-3">
            <Select
              label="Almacén"
              value={selectedWarehouseId}
              onChange={(e) => setSelectedWarehouseId(e.target.value)}
              options={warehouses.map((w) => ({
                value: w.warehouse_id,
                label: `${w.warehouse_name}${w.is_branch ? " (piso de venta)" : ""}`,
              }))}
              placeholder="Seleccionar almacén"
              required
            />
          </div>
          <div className="lg:col-span-3">
            <Input
              label="Buscar inventario"
              placeholder="Nombre, SKU o ID"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="lg:col-span-2">
            <Select
              label="Filtrar por stock"
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value as StockFilter)}
              options={[
                { value: "all", label: "Todos" },
                { value: "zero", label: "Sin stock (0)" },
                { value: "low", label: "Stock bajo (1â€“10)" },
                { value: "ok", label: "En stock (>10)" },
              ]}
            />
          </div>
          <div className="lg:col-span-4 flex flex-col sm:flex-row gap-2">
            <Button
              variant="secondary"
              onClick={() => setIsDiscrepancyOpen(true)}
              disabled={!selectedWarehouseId || inventory.length === 0}
              fullWidth
            >
              Reportar discrepancia
            </Button>
            <Button
              variant="primary"
              onClick={() => setIsAddOpen(true)}
              disabled={!selectedWarehouseId || !tenantId}
              fullWidth
            >
              <IconPlus />
              Agregar
            </Button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-300 p-6">
        <Table
          isLoading={isLoadingInventory}
          columns={[
            {
              key: "product_name",
              label: "Producto",
              width: "25%",
              render: (value: unknown, row: AggregatedInventoryItem) => (
                <div className="flex items-center gap-2">
                  <span className="truncate">{value as string}</span>
                  {row.is_composite && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-purple-100 text-purple-800 border border-purple-200">
                      Lote
                    </span>
                  )}
                </div>
              ),
            },
            { key: "variant_name", label: "Variante", width: "20%" },
            {
              key: "sku",
              label: "SKU",
              width: "13%",
              render: (value: unknown) => (value as string | null) ?? "-",
            },
            {
              key: "stock",
              label: "Stock total",
              width: "12%",
              render: (value: unknown) => {
                const n = value as number;
                const color =
                  n === 0 ? "text-red-600" : n <= 10 ? "text-amber-600" : "text-gray-900";
                return <span className={`font-mono font-semibold ${color}`}>{n}</span>;
              },
            },
            {
              key: "lot_count",
              label: "Lotes",
              width: "8%",
              render: (value: unknown) => (
                <span className="font-mono text-gray-500">{value as number}</span>
              ),
            },
            {
              key: "expiration_date",
              label: "Próx. vence",
              width: "13%",
              render: (value: unknown) =>
                value ? new Date(value as string).toLocaleDateString("es-CR") : "-",
            },
            {
              key: "actions",
              label: "",
              width: "9%",
              render: (_: unknown, row: AggregatedInventoryItem) =>
                row.is_composite ? (
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => setDisaggregatingItem(row)}
                    title="Desagrupar Lote"
                  >
                    Desagrupar
                  </Button>
                ) : null,
            },
          ]}
          data={filtered}
          emptyMessage={
            selectedWarehouseId
              ? "Este almacén no tiene productos registrados"
              : "Selecciona un almacén para ver su inventario"
          }
        />
      </div>

      {tenantId && (
        <AddInventoryModal
          isOpen={isAddOpen}
          tenantId={tenantId}
          warehouseName={selectedWarehouse?.warehouse_name ?? ""}
          isSubmitting={isSubmittingAdd}
          onClose={() => setIsAddOpen(false)}
          onSubmit={handleBulkAdd}
        />
      )}

      <DiscrepancyReportModal
        isOpen={isDiscrepancyOpen}
        inventory={inventory}
        warehouseName={selectedWarehouse?.warehouse_name ?? ""}
        isSubmitting={isSubmittingDiscrepancy}
        onClose={() => setIsDiscrepancyOpen(false)}
        onSubmit={handleDiscrepancySubmit}
      />


      {disaggregatingItem && (
        <DisaggregateModal
          isOpen={true}
          item={disaggregatingItem}
          isSubmitting={isSubmittingDisaggregate}
          onClose={() => setDisaggregatingItem(null)}
          onSubmit={handleDisaggregate}
        />
      )}
    </div>
  );
}
