import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Table } from "@/components/ui/Table";
import {
  ProductVariantComboBox,
  type ProductVariantSelection,
} from "@/components/ui/ProductVariantComboBox";
import { IconPlus, IconTrash } from "@/assets/icons";

export interface AddInventoryItem {
  product_variant_id: string;
  variant_name: string;
  sku?: string;
  stock: number;
  expiration_date?: string;
}

interface AddInventoryModalProps {
  isOpen: boolean;
  tenantId: string;
  warehouseName: string;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (items: AddInventoryItem[]) => Promise<void>;
}

export function AddInventoryModal({
  isOpen,
  tenantId,
  warehouseName,
  isSubmitting,
  onClose,
  onSubmit,
}: AddInventoryModalProps) {
  const [selection, setSelection] = useState<ProductVariantSelection | null>(
    null,
  );
  const [stock, setStock] = useState("");
  const [expiration, setExpiration] = useState("");
  const [items, setItems] = useState<AddInventoryItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setSelection(null);
    setStock("");
    setExpiration("");
    setItems([]);
    setError(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleAddRow = () => {
    setError(null);
    if (!selection) {
      setError("Selecciona un producto");
      return;
    }
    const stockNum = Number(stock);
    if (!Number.isFinite(stockNum) || stockNum <= 0) {
      setError("El stock debe ser un número mayor a 0");
      return;
    }
    if (
      items.some((i) => i.product_variant_id === selection.product_variant_id)
    ) {
      setError("Ese producto ya está en la lista");
      return;
    }
    setItems((prev) => [
      ...prev,
      {
        product_variant_id: selection.product_variant_id,
        variant_name: selection.variant_name,
        sku: selection.sku,
        stock: stockNum,
        expiration_date: expiration || undefined,
      },
    ]);
    setSelection(null);
    setStock("");
    setExpiration("");
  };

  const handleRemoveRow = (productVariantId: string) => {
    setItems((prev) =>
      prev.filter((i) => i.product_variant_id !== productVariantId),
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (items.length === 0) {
      setError("Agrega al menos un producto a la lista");
      return;
    }
    await onSubmit(items);
    reset();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={`Agregar inventario — ${warehouseName}`}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-end">
          <div className="lg:col-span-6">
            <ProductVariantComboBox
              tenantId={tenantId}
              value={selection?.product_variant_id ?? ""}
              displayValue={
                selection
                  ? selection.sku
                    ? `${selection.variant_name} (${selection.sku})`
                    : selection.variant_name
                  : ""
              }
              onChange={setSelection}
              onClear={() => setSelection(null)}
              label="Producto"
              required
            />
          </div>
          <div className="lg:col-span-2">
            <Input
              label="Stock"
              type="number"
              min={1}
              value={stock}
              onChange={(e) => setStock(e.target.value)}
            />
          </div>
          <div className="lg:col-span-3">
            <Input
              label="Vencimiento"
              type="date"
              value={expiration}
              onChange={(e) => setExpiration(e.target.value)}
            />
          </div>
          <div className="lg:col-span-1">
            <Button
              type="button"
              variant="secondary"
              onClick={handleAddRow}
              fullWidth
            >
              <IconPlus />
            </Button>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
            {error}
          </div>
        )}

        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Productos a agregar ({items.length})
          </p>
          <Table
            columns={[
              { key: "variant_name", label: "Producto", width: "40%" },
              {
                key: "sku",
                label: "SKU",
                width: "20%",
                render: (value: unknown) => (value as string | undefined) ?? "—",
              },
              { key: "stock", label: "Stock", width: "15%" },
              {
                key: "expiration_date",
                label: "Vence",
                width: "15%",
                render: (value: unknown) =>
                  value
                    ? new Date(value as string).toLocaleDateString("es-CR")
                    : "—",
              },
              {
                key: "actions",
                label: "",
                width: "10%",
                render: (_: unknown, row: AddInventoryItem) => (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => handleRemoveRow(row.product_variant_id)}
                    title="Quitar"
                  >
                    <IconTrash />
                  </Button>
                ),
              },
            ]}
            data={items}
            emptyMessage="Aún no hay productos en la lista"
          />
        </div>

        <div className="flex gap-3 pt-4 border-t border-gray-200">
          <Button type="button" variant="ghost" fullWidth onClick={handleClose}>
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            fullWidth
            loading={isSubmitting}
            disabled={items.length === 0}
          >
            Guardar {items.length > 0 ? `(${items.length})` : ""}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
