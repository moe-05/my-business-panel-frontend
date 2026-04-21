import { useEffect, useState, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import { productApi } from "../../api/product.api";
import { tenantApi } from "../../api/tenant.api";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { Modal } from "../../components/ui/Modal";
import { Table, Pagination } from "../../components/ui/Table";
import { Badge } from "../../components/ui/Badge";
import { CategoryComboBox } from "../../components/ui/CategoryComboBox";
import type { Product } from "../../interfaces/entities/Product.interface";
import type { ProductsListResponse } from "../../interfaces/api/responses/ProductsListResponse.interface";
import type { Tenant } from "../../interfaces/entities/Tenant.interface";

const LIMIT = 100;

// ─── Detail Modal ─────────────────────────────────────────────────────────────

function ProductDetailModal({
  product,
  onClose,
}: {
  product: Product;
  onClose: () => void;
}) {
  const field = (label: string, value?: string | number | boolean | null) => {
    const display =
      typeof value === "boolean"
        ? value
          ? "Activo"
          : "Inactivo"
        : value != null
          ? String(value)
          : "—";
    return (
      <div key={label}>
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-0.5">
          {label}
        </p>
        <p className="text-sm text-gray-900">{display}</p>
      </div>
    );
  };

  const pv = product as Product & {
    variant_name?: string;
    unit_price?: number;
    product_variant_id?: string;
    is_active?: boolean;
    tenant_name?: string;
  };

  return (
    <Modal isOpen onClose={onClose} title="Detalle de Producto" size="md">
      <div className="space-y-5">
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
            Variante de Producto
          </p>
          <div className="grid grid-cols-2 gap-4">
            {field("SKU", pv.sku)}
            {field("Nombre", pv.variant_name || pv.product_name)}
            {field(
              "Precio Unitario",
              pv.unit_price != null
                ? `₡${Number(pv.unit_price).toLocaleString("es-CR")}`
                : pv.price != null
                  ? `₡${Number(pv.price).toLocaleString("es-CR")}`
                  : null,
            )}
            {field("Código CABYS", pv.cabys_code)}
            {field("Estado", pv.is_active)}
            {field("ID", pv.product_variant_id || pv.product_id)}
          </div>
        </div>

        {pv.description && (
          <div className="border-t border-gray-100 pt-4">
            {field("Descripción", pv.description)}
          </div>
        )}

        {pv.tenant_name && (
          <div className="border-t border-gray-100 pt-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
              Empresa
            </p>
            {field("Tenant", pv.tenant_name)}
          </div>
        )}

        <div className="border-t border-gray-100 pt-4">
          <div className="grid grid-cols-2 gap-4">
            {field("Creado", new Date(pv.created_at).toLocaleString("es-CR"))}
            {field(
              "Actualizado",
              new Date(pv.updated_at).toLocaleString("es-CR"),
            )}
          </div>
        </div>

        <div className="pt-2">
          <Button type="button" variant="ghost" fullWidth onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Form state ───────────────────────────────────────────────────────────────

interface ProductFormState {
  sku: string;
  product_name: string;
  description: string;
  category_id: string;
  category_name: string;
  price: string;
  tenant_id?: string;
}

interface ProductFormErrors {
  sku?: string;
  product_name?: string;
  category_id?: string;
  price?: string;
  tenant_id?: string;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function ProductsPage() {
  const { user: currentUser } = useAuth();

  const isSuperAdmin = currentUser?.role.role_hierarchy === 1;
  const canCreate = isSuperAdmin || currentUser?.role.role_hierarchy === 2;

  // Products state
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Tenants (superuser)
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [isLoadingTenants, setIsLoadingTenants] = useState(false);

  // Modal state
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formErrors, setFormErrors] = useState<ProductFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const initialFormState: ProductFormState = {
    sku: "",
    product_name: "",
    description: "",
    category_id: "",
    category_name: "",
    price: "",
    tenant_id: undefined,
  };
  const [formData, setFormData] = useState<ProductFormState>(initialFormState);

  // Load tenants (superuser only)
  useEffect(() => {
    if (!isSuperAdmin) return;
    setIsLoadingTenants(true);
    tenantApi
      .getAll()
      .then((res) => setTenants(res.tenants))
      .catch(console.error)
      .finally(() => setIsLoadingTenants(false));
  }, [isSuperAdmin]);

  // Load products
  const loadProducts = async (pageNum = 1, query = "") => {
    setIsLoading(true);
    try {
      let result: ProductsListResponse;
      if (isSuperAdmin) {
        result = await productApi.listAll(pageNum, LIMIT);
      } else {
        const tenantId = currentUser?.tenant.tenant_id || "";
        if (query.trim()) {
          result = await productApi.search(tenantId, query, pageNum, LIMIT);
        } else {
          result = await productApi.listByTenant(tenantId, pageNum, LIMIT);
        }
      }
      setProducts(result.products);
      setTotal(result.total);
      setTotalPages(Math.ceil(result.total / result.limit));
      setPage(result.page);
    } catch (error) {
      console.error("Error loading products:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadProducts(1, "");
  }, [isSuperAdmin, currentUser?.tenant.tenant_id]);

  // Search debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      loadProducts(1, searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Validate form
  const validateForm = (): boolean => {
    const errors: ProductFormErrors = {};
    if (!formData.sku.trim()) errors.sku = "SKU es requerido";
    if (!formData.product_name.trim())
      errors.product_name = "Nombre del producto es requerido";
    if (!formData.category_id)
      errors.category_id = "Categoría CABYS es requerida";
    if (!formData.price || isNaN(parseFloat(formData.price)))
      errors.price = "Precio debe ser un número válido";
    else if (parseFloat(formData.price) < 0)
      errors.price = "El precio no puede ser negativo";
    if (isSuperAdmin && !editingProduct && !formData.tenant_id)
      errors.tenant_id = "Empresa (Tenant) es requerida";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm() || !currentUser) return;
    setIsSubmitting(true);
    try {
      if (editingProduct) {
        await productApi.update(
          editingProduct.product_id ||
            (editingProduct as any).product_variant_id,
          {
            product_name: formData.product_name,
            description: formData.description,
            category_id: formData.category_id,
            price: parseFloat(formData.price),
          },
        );
      } else {
        const tenantId = isSuperAdmin
          ? formData.tenant_id || ""
          : currentUser.tenant.tenant_id;
        await productApi.create({
          tenant_id: tenantId,
          sku: formData.sku.toUpperCase().trim(),
          product_name: formData.product_name,
          description: formData.description,
          category_id: formData.category_id,
          price: parseFloat(formData.price),
          cabys_code: formData.category_id, // Use selected category_id as cabys_code reference
        });
      }
      await loadProducts(page, searchQuery);
      closeModal();
    } catch (error) {
      console.error("Error saving product:", error);
      setFormErrors({
        sku:
          error instanceof Error ? error.message : "Error guardando producto",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditProduct = (p: Product) => {
    setEditingProduct(p);
    setFormData({
      sku: p.sku,
      product_name: (p as any).variant_name || p.product_name || "",
      description: p.description || "",
      category_id: p.category_id || (p as any).cabys_code || "",
      category_name: p.category?.category_name || "",
      price: String((p as any).unit_price ?? p.price ?? ""),
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm("¿Está seguro de que desea eliminar este producto?")) return;
    try {
      await productApi.delete(productId);
      await loadProducts(page, searchQuery);
    } catch (error) {
      alert(
        error instanceof Error ? error.message : "Error al eliminar producto",
      );
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
    setFormData(initialFormState);
    setFormErrors({});
  };

  // Helper to get the display name for a product
  const getProductName = (p: Product) =>
    (p as any).variant_name || p.product_name || "—";

  const getProductPrice = (p: Product) =>
    Number((p as any).unit_price ?? p.price ?? 0);

  const getProductId = (p: Product) =>
    (p as any).product_variant_id || p.product_id;

  return (
    <div className="p-6 lg:p-8">
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
      <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:gap-3">
          <div className="flex-1 min-w-0">
            <Input
              label="Buscar por nombre o SKU"
              placeholder="Buscar..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-sm text-gray-500">
              {total} producto{total !== 1 ? "s" : ""}
            </span>
            {canCreate && (
              <Button
                variant="primary"
                size="md"
                onClick={() => {
                  setEditingProduct(null);
                  setFormData(initialFormState);
                  setFormErrors({});
                  setIsModalOpen(true);
                }}
                className="w-full lg:w-auto"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Nuevo Producto
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <p className="text-xs text-gray-400 mb-4">
          Haz clic en una fila para ver el detalle del producto
        </p>
        <Table
          columns={
            [
              { key: "sku", label: "SKU", width: "12%" },
              {
                key: "product_name" as keyof Product,
                label: "Nombre",
                width: "28%",
                render: (_: unknown, row: Product) => getProductName(row),
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
                  `₡${getProductPrice(row).toLocaleString("es-CR")}`,
              },
              ...(isSuperAdmin
                ? [
                    {
                      key: "tenant_id" as keyof Product,
                      label: "Tenant",
                      width: "14%",
                      render: (_: unknown, row: Product) =>
                        (row as any).tenant_name || "—",
                    },
                  ]
                : []),
              {
                key: "created_at" as keyof Product,
                label: "Creado",
                width: "10%",
                render: (date: unknown) =>
                  new Date(String(date)).toLocaleDateString("es-CR"),
              },
              ...(canCreate
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
                          <button
                            type="button"
                            onClick={() => handleEditProduct(row)}
                            className="px-2 py-1 text-xs font-medium text-accent-600 hover:bg-accent-50 rounded-lg transition-colors"
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              handleDeleteProduct(getProductId(row))
                            }
                            className="px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            Eliminar
                          </button>
                        </div>
                      ),
                    },
                  ]
                : []),
            ] as any
          }
          data={products}
          isLoading={isLoading}
          emptyMessage="No hay productos para mostrar"
          onRowClick={(row) => setSelectedProduct(row)}
        />
        {totalPages > 1 && (
          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={(p) => {
              setPage(p);
              loadProducts(p, searchQuery);
            }}
            loading={isLoading}
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

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingProduct ? "Editar Producto" : "Nuevo Producto"}
        size="md"
      >
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
          {/* Tenant selector (superuser only, create mode) */}
          {isSuperAdmin &&
            !editingProduct &&
            (isLoadingTenants ? (
              <div className="flex items-center justify-center py-2">
                <div className="w-4 h-4 border-2 border-accent-200 border-t-accent-500 rounded-full animate-spin" />
              </div>
            ) : (
              <Select
                label="Empresa (Tenant)"
                value={formData.tenant_id || ""}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, tenant_id: e.target.value }))
                }
                options={tenants.map((t) => ({
                  value: t.tenant_id,
                  label: t.tenant_name,
                }))}
                error={formErrors.tenant_id}
                required
              />
            ))}

          <Input
            label="SKU"
            placeholder="Ej: PROD-001, ABC123"
            value={formData.sku}
            onChange={(e) =>
              setFormData((p) => ({ ...p, sku: e.target.value.toUpperCase() }))
            }
            error={formErrors.sku}
            disabled={!!editingProduct}
            hint={
              editingProduct
                ? "No se puede cambiar el SKU de un producto existente"
                : undefined
            }
            required
          />

          <Input
            label="Nombre del Producto"
            placeholder="Ej: Laptop Dell XPS 13"
            value={formData.product_name}
            onChange={(e) =>
              setFormData((p) => ({ ...p, product_name: e.target.value }))
            }
            error={formErrors.product_name}
            required
          />

          <Input
            label="Descripción"
            placeholder="Descripción del producto (opcional)"
            value={formData.description}
            onChange={(e) =>
              setFormData((p) => ({ ...p, description: e.target.value }))
            }
          />

          {/* Category CABYS ComboBox — paginated, 500ms debounce, 100/batch */}
          <CategoryComboBox
            label="Categoría CABYS"
            value={formData.category_id}
            displayValue={formData.category_name}
            onChange={(id, name) =>
              setFormData((p) => ({
                ...p,
                category_id: id,
                category_name: name,
              }))
            }
            error={formErrors.category_id}
            required
          />

          <Input
            label="Precio Unitario"
            type="number"
            placeholder="Ej: 25000.00"
            step="0.01"
            min="0"
            value={formData.price}
            onChange={(e) =>
              setFormData((p) => ({ ...p, price: e.target.value }))
            }
            error={formErrors.price}
            required
          />

          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <Button
              type="button"
              variant="ghost"
              fullWidth
              onClick={closeModal}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              fullWidth
              loading={isSubmitting}
            >
              {editingProduct ? "Guardar Cambios" : "Crear Producto"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
