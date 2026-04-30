import { useState } from "react";
import { useLoaderData } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

import {
  createProduct,
  updateProduct,
  deleteProduct,
} from "@/router/actions/product.actions";

import type { ProductsPageLoaderData } from "@/router/loaders/product.loaders";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Table, Pagination } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { Toast } from "@/components/ui/Toast";
import { IconEdit, IconEye, IconPlus, IconTrash } from "@/assets/icons";

import type { Product } from "@/interfaces/entities/Product.interface";
import type { CreateProductRequest } from "@/interfaces/api/requests/CreateProductRequest.interface";
import type { UpdateProductRequest } from "@/interfaces/api/requests/UpdateProductRequest.interface";
import type { ToastMode } from "@/interfaces/components/ui/ToastProps.interface";

import { ProductDetailModal } from "./ProductDetailModal";
import { ProductUpsertModal } from "./ProductUpsertModal";
import { BulkPackageModal } from "./BulkPackageModal";

const LIMIT = 100;

type ProductWithVariant = Product & {
  variant_name?: string;
  unit_price?: number;
  product_variant_id?: string;
  tenant_name?: string;
};

interface UpsertModalState {
  open: boolean;
  mode: "create" | "edit";
  product?: ProductWithVariant;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function ProductsPage() {
  const { initialProducts, tenants } =
    useLoaderData() as ProductsPageLoaderData;
  const { user: currentUser } = useAuth();

  const isSuperAdmin = currentUser?.role.role_id === 1;
  const canManageProducts = isSuperAdmin || currentUser?.role.role_id === 2;

  const [products, setProducts] = useState<ProductWithVariant[]>(
    (initialProducts?.products ?? []) as ProductWithVariant[],
  );
  const [page, setPage] = useState(initialProducts?.page ?? 1);
  const [totalPages] = useState(
    Math.ceil(
      (initialProducts?.total ?? 0) / (initialProducts?.limit ?? LIMIT),
    ),
  );
  const [total, setTotal] = useState(initialProducts?.total ?? 0);

  const [selectedProduct, setSelectedProduct] =
    useState<ProductWithVariant | null>(null);
  const [upsertModal, setUpsertModal] = useState<UpsertModalState>({
    open: false,
    mode: "create",
  });
  const [isBulkPackageOpen, setIsBulkPackageOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [toast, setToast] = useState<{
    mode: ToastMode;
    message: string;
  } | null>(null);

  const getProductId = (p: ProductWithVariant) =>
    p.product_variant_id ?? p.product_id;

  const getProductName = (p: ProductWithVariant) =>
    p.variant_name ?? p.product_name ?? "—";

  const getProductPrice = (p: ProductWithVariant) =>
    Number(p.unit_price ?? p.price ?? 0);

  // ─── Handlers ───────────────────────────────────────────────────────────────

  const handleCreateProduct = async (
    data: CreateProductRequest,
  ): Promise<string | null> => {
    const tempId = `temp-${Date.now()}`;
    const tempProduct: ProductWithVariant = {
      product_id: tempId,
      sku: data.sku,
      product_name: data.product_name,
      description: data.description,
      category_id: data.category_id,
      price: data.price,
      cabys_code: data.cabys_code,
      tenant_id: data.tenant_id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setProducts((prev) => [tempProduct, ...prev]);
    setTotal((prev) => prev + 1);

    try {
      const result = await createProduct(data);
      setProducts((prev) =>
        prev.map((p) =>
          p.product_id === tempId
            ? {
                ...tempProduct,
                product_id: result.product_variant_id,
                product_variant_id: result.product_variant_id,
              }
            : p,
        ),
      );
      setToast({ mode: "success", message: "Producto creado exitosamente" });
      return result.product_variant_id;
    } catch (error) {
      setProducts((prev) => prev.filter((p) => p.product_id !== tempId));
      setTotal((prev) => prev - 1);
      const message =
        error instanceof Error ? error.message : "Error al crear producto";
      setToast({ mode: "error", message });
      throw error;
    }
  };

  const handleUpdateProduct = async (
    productId: string,
    data: UpdateProductRequest,
  ): Promise<void> => {
    try {
      const updated = await updateProduct(productId, data);
      setProducts((prev) =>
        prev.map((p) =>
          getProductId(p) === productId ? { ...p, ...updated } : p,
        ),
      );
      setToast({
        mode: "success",
        message: "Producto actualizado exitosamente",
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Error al actualizar producto";
      setToast({ mode: "error", message });
      throw error;
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm("¿Está seguro de que desea eliminar este producto?")) return;
    const productToDelete = products.find((p) => getProductId(p) === productId);
    setProducts((prev) => prev.filter((p) => getProductId(p) !== productId));
    setTotal((prev) => prev - 1);
    try {
      await deleteProduct(productId);
      setToast({ mode: "success", message: "Producto eliminado exitosamente" });
    } catch (error) {
      if (productToDelete) {
        setProducts((prev) => [...prev, productToDelete]);
        setTotal((prev) => prev + 1);
      }
      const message =
        error instanceof Error ? error.message : "Error al eliminar producto";
      setToast({ mode: "error", message });
    }
  };

  const openCreate = () => setUpsertModal({ open: true, mode: "create" });

  const openEdit = (p: ProductWithVariant) =>
    setUpsertModal({ open: true, mode: "edit", product: p });

  const closeModal = () => setUpsertModal({ open: false, mode: "create" });

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="p-6 lg:p-8">
      {toast && (
        <Toast
          mode={toast.mode}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Gestión de Productos
        </h1>
        <p className="text-gray-600">
          {isSuperAdmin
            ? "Catálogo de productos de todos los tenants"
            : `Catálogo de productos y servicios de ${currentUser?.tenant.tenant_name}`}
        </p>
      </div>

      {/* Search & Actions */}
      <div className="bg-white rounded-2xl border border-gray-300 p-6 mb-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex-1 min-w-0">
            <Input
              label="Buscar producto"
              placeholder="Buscar por nombre o SKU"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full lg:max-w-sm"
            />
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">
              {total} producto{total !== 1 ? "s" : ""}
            </span>
            {canManageProducts && (
              <>
                <Button
                  variant="secondary"
                  size="md"
                  onClick={() => setIsBulkPackageOpen(true)}
                  className="w-full lg:w-auto"
                  title="Crear un lote y todas sus unidades en una sola operación"
                >
                  <IconPlus />
                  Crear lote
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  onClick={openCreate}
                  className="w-full lg:w-auto"
                >
                  <IconPlus />
                  Nuevo Producto
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-300 p-6">
        <Table
          columns={[
            { key: "sku", label: "SKU", width: "12%" },
            {
              key: "product_name" as keyof Product,
              label: "Nombre",
              width: "28%",
              render: (_: unknown, row: Product) =>
                getProductName(row as ProductWithVariant),
            },
            {
              key: "cabys_code" as keyof Product,
              label: "CABYS",
              width: "14%",
              render: (code: unknown) =>
                code ? (
                  <Badge variant="secondary" className="text-xs font-mono">
                    {String(code).substring(0, 12)}
                    {String(code).length > 12 ? "…" : ""}
                  </Badge>
                ) : (
                  <span className="text-gray-400 text-xs">—</span>
                ),
            },
            {
              key: "price" as keyof Product,
              label: "Precio",
              width: "14%",
              render: (_: unknown, row: Product) =>
                `₡${getProductPrice(row as ProductWithVariant).toLocaleString("es-CR")}`,
            },
            ...(isSuperAdmin
              ? [
                  {
                    key: "tenant_id" as keyof Product,
                    label: "Tenant",
                    width: "14%",
                    render: (_: unknown, row: Product) =>
                      (row as ProductWithVariant).tenant_name ?? "—",
                  },
                ]
              : []),
            {
              key: "created_at" as keyof Product,
              label: "Creado",
              width: "10%",
              render: (date: unknown) =>
                date ? new Date(String(date)).toLocaleDateString("es-CR") : "—",
            },
            ...(canManageProducts
              ? [
                  {
                    key: "actions" as keyof Product,
                    label: "Acciones",
                    width: "8%",
                    render: (_: unknown, row: Product) => (
                      <div
                        className="flex gap-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Button
                          onClick={() =>
                            setSelectedProduct(row as ProductWithVariant)
                          }
                          title="Ver detalles"
                          variant="ghost"
                          className="hover:bg-gray-50 rounded-lg transition-colors"
                        >
                          <IconEye />
                        </Button>
                        <Button
                          onClick={() => openEdit(row as ProductWithVariant)}
                          title="Editar producto"
                          variant="ghost"
                          className="hover:bg-gray-50 rounded-lg transition-colors"
                        >
                          <IconEdit />
                        </Button>
                        <Button
                          onClick={() =>
                            handleDeleteProduct(
                              getProductId(row as ProductWithVariant),
                            )
                          }
                          title="Eliminar producto"
                          variant="danger"
                          className="hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <IconTrash />
                        </Button>
                      </div>
                    ),
                  },
                ]
              : []),
          ]}
          data={products}
          emptyMessage="No hay productos para mostrar"
          onRowClick={(row) => setSelectedProduct(row as ProductWithVariant)}
        />
        {totalPages > 1 && (
          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={(p) => setPage(p)}
          />
        )}
      </div>

      {/* Detail Modal */}
      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}

      <ProductUpsertModal
        isOpen={upsertModal.open}
        mode={upsertModal.mode}
        product={upsertModal.product}
        isSuperAdmin={isSuperAdmin}
        currentTenantId={currentUser?.tenant.tenant_id ?? ""}
        tenants={tenants}
        onClose={closeModal}
        onCreate={handleCreateProduct}
        onUpdate={handleUpdateProduct}
      />

      <BulkPackageModal
        isOpen={isBulkPackageOpen}
        tenantId={currentUser?.tenant.tenant_id ?? ""}
        onClose={() => setIsBulkPackageOpen(false)}
        onCreated={() => {
          setIsBulkPackageOpen(false);
          setToast({
            mode: "success",
            message: "Lote creado. Recarga la página para verlo en la lista.",
          });
        }}
      />
    </div>
  );
}
