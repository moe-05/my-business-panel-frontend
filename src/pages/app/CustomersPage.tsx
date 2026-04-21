import { useEffect, useState, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import { customerApi } from "../../api/customer.api";
import { segmentApi } from "../../api/segment.api";
import { tenantApi } from "../../api/tenant.api";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { Modal } from "../../components/ui/Modal";
import { Table, Pagination } from "../../components/ui/Table";
import { Badge } from "../../components/ui/Badge";
import type { Customer, DocTypeCode } from "../../interfaces/entities/Customer.interface";
import type { Segment } from "../../interfaces/entities/Segment.interface";
import type { CustomersListResponse } from "../../interfaces/api/responses/CustomersListResponse.interface";
import type { Tenant } from "../../interfaces/entities/Tenant.interface";

const LIMIT = 100;

const DOCUMENT_TYPES: { value: DocTypeCode; label: string }[] = [
  { value: "cedula", label: "Cédula" },
  { value: "passport", label: "Pasaporte" },
  { value: "dimex", label: "DIMEX" },
  { value: "nite", label: "NITE" },
  { value: "other", label: "Otro" },
];

// ─── Detail Modal ─────────────────────────────────────────────────────────────

function CustomerDetailModal({
  customer,
  segments,
  onClose,
}: {
  customer: Customer;
  segments: Segment[];
  onClose: () => void;
}) {
  const segmentName = segments.find(
    (s) => s.segment_id === customer.segment_id,
  )?.segment_name;
  const docTypeLabel =
    DOCUMENT_TYPES.find((d) => d.value === customer.doc_type)?.label ||
    customer.doc_type;

  const field = (label: string, value?: string | number | null) => (
    <div key={label}>
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-0.5">
        {label}
      </p>
      <p className="text-sm text-gray-900">{value ?? "—"}</p>
    </div>
  );

  return (
    <Modal isOpen onClose={onClose} title="Detalle de Cliente" size="md">
      <div className="space-y-5">
        {/* Identity */}
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
            Identificación
          </p>
          <div className="grid grid-cols-2 gap-4">
            {field("Nombre", `${customer.first_name} ${customer.last_name}`)}
            {field("Tipo Doc.", docTypeLabel)}
            {field("Documento", customer.doc_number)}
            {field(
              "Segmento",
              segmentName ??
                (customer.segment_id
                  ? `Segmento ${customer.segment_id}`
                  : null),
            )}
          </div>
        </div>

        {/* Contact */}
        {(customer.email || customer.phone) && (
          <div className="border-t border-gray-100 pt-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
              Contacto
            </p>
            <div className="grid grid-cols-2 gap-4">
              {field("Email", customer.email)}
              {field("Teléfono", customer.phone)}
            </div>
          </div>
        )}

        {/* Address */}
        {(customer.address || customer.city || customer.province) && (
          <div className="border-t border-gray-100 pt-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
              Dirección
            </p>
            <div className="grid grid-cols-2 gap-4">
              {field("Dirección", customer.address)}
              {field("Ciudad", customer.city)}
              {field("Provincia", customer.province)}
              {field("Código Postal", customer.postal_code)}
            </div>
          </div>
        )}

        {/* Tenant (superuser view) */}
        {(customer as any).tenant_name && (
          <div className="border-t border-gray-100 pt-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
              Empresa
            </p>
            {field("Tenant", (customer as any).tenant_name)}
          </div>
        )}

        {/* Timestamps */}
        <div className="border-t border-gray-100 pt-4">
          <div className="grid grid-cols-2 gap-4">
            {field(
              "Creado",
              new Date(customer.created_at).toLocaleString("es-CR"),
            )}
            {field(
              "Actualizado",
              new Date(customer.updated_at).toLocaleString("es-CR"),
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

interface CustomerFormState {
  first_name: string;
  last_name: string;
  doc_type: DocTypeCode;
  doc_number: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  province: string;
  postal_code: string;
  segment_id: string;
  tenant_id?: string;
}

interface CustomerFormErrors {
  first_name?: string;
  last_name?: string;
  doc_type?: string;
  doc_number?: string;
  email?: string;
  tenant_id?: string;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function CustomersPage() {
  const { user: currentUser } = useAuth();

  const isSuperAdmin = currentUser?.role.role_hierarchy === 1;
  const canCreate = isSuperAdmin || currentUser?.role.role_hierarchy === 2;

  // Customers state
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSegment, setSelectedSegment] = useState<string>("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Segments state
  const [segments, setSegments] = useState<Segment[]>([]);
  const [isLoadingSegments, setIsLoadingSegments] = useState(true);

  // Tenants (for superuser form)
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [isLoadingTenants, setIsLoadingTenants] = useState(false);

  // Modal state
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null,
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(
    null,
  );
  const [formErrors, setFormErrors] = useState<CustomerFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const initialFormState: CustomerFormState = {
    first_name: "",
    last_name: "",
    doc_type: "cedula",
    doc_number: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    province: "",
    postal_code: "",
    segment_id: "",
    tenant_id: undefined,
  };
  const [formData, setFormData] = useState<CustomerFormState>(initialFormState);

  // Load segments
  useEffect(() => {
    segmentApi
      .getAll()
      .then(setSegments)
      .catch(console.error)
      .finally(() => setIsLoadingSegments(false));
  }, []);

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

  // Load customers
  const loadCustomers = async (pageNum = 1, query = "", segmentId = "") => {
    setIsLoading(true);
    try {
      let result: CustomersListResponse;
      if (isSuperAdmin) {
        result = await customerApi.listAll(pageNum, LIMIT);
      } else {
        const tenantId = currentUser?.tenant.tenant_id || "";
        if (query.trim()) {
          result = await customerApi.search(
            tenantId,
            query,
            pageNum,
            LIMIT,
          );
        } else if (segmentId) {
          result = await customerApi.filterBySegment(
            tenantId,
            segmentId,
            pageNum,
            LIMIT,
          );
        } else {
          result = await customerApi.listByTenant(tenantId, pageNum, LIMIT);
        }
      }
      setCustomers(result.customers);
      setTotal(result.total);
      setTotalPages(Math.ceil(result.total / result.limit));
      setPage(result.page);
    } catch (error) {
      console.error("Error loading customers:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadCustomers(1, "", "");
  }, [isSuperAdmin, currentUser?.tenant.tenant_id]);

  // Search + segment filter debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      loadCustomers(1, searchQuery, selectedSegment);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedSegment]);

  // Validate form
  const validateForm = (): boolean => {
    const errors: CustomerFormErrors = {};
    if (!formData.first_name.trim()) errors.first_name = "Nombre es requerido";
    if (!formData.last_name.trim()) errors.last_name = "Apellido es requerido";
    if (!formData.doc_type) errors.doc_type = "Tipo de documento es requerido";
    if (!formData.doc_number.trim())
      errors.doc_number = "Número de documento es requerido";
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      errors.email = "Email inválido";
    if (isSuperAdmin && !editingCustomer && !formData.tenant_id)
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
      if (editingCustomer) {
        await customerApi.update(editingCustomer.customer_id, {
          first_name: formData.first_name,
          last_name: formData.last_name,
          email: formData.email || undefined,
          phone: formData.phone || undefined,
          address: formData.address || undefined,
          city: formData.city || undefined,
          province: formData.province || undefined,
          postal_code: formData.postal_code || undefined,
          segment_id: formData.segment_id || undefined,
        });
      } else {
        const tenantId = isSuperAdmin
          ? formData.tenant_id || ""
          : currentUser.tenant.tenant_id;
        await customerApi.create({
          tenant_id: tenantId,
          first_name: formData.first_name,
          last_name: formData.last_name,
          doc_type: formData.doc_type,
          doc_number: formData.doc_number,
          email: formData.email || undefined,
          phone: formData.phone || undefined,
          address: formData.address || undefined,
          city: formData.city || undefined,
          province: formData.province || undefined,
          postal_code: formData.postal_code || undefined,
          segment_id: formData.segment_id || undefined,
        });
      }
      await loadCustomers(page, searchQuery, selectedSegment);
      closeModal();
    } catch (error) {
      console.error("Error saving customer:", error);
      setFormErrors({
        doc_number:
          error instanceof Error ? error.message : "Error guardando cliente",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditCustomer = (c: Customer) => {
    setEditingCustomer(c);
    setFormData({
      first_name: c.first_name,
      last_name: c.last_name,
      doc_type: c.doc_type,
      doc_number: c.doc_number,
      email: c.email || "",
      phone: c.phone || "",
      address: c.address || "",
      city: c.city || "",
      province: c.province || "",
      postal_code: c.postal_code || "",
      segment_id: c.segment_id || "",
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleDeleteCustomer = async (customerId: string) => {
    if (!confirm("¿Está seguro de que desea eliminar este cliente?")) return;
    try {
      await customerApi.delete(customerId);
      await loadCustomers(page, searchQuery, selectedSegment);
    } catch (error) {
      alert(
        error instanceof Error ? error.message : "Error al eliminar cliente",
      );
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCustomer(null);
    setFormData(initialFormState);
    setFormErrors({});
  };

  const getSegmentName = (segmentId?: string) =>
    segments.find((s) => s.segment_id === segmentId)?.segment_name || "—";

  const getDocTypeLabel = (docType: DocTypeCode) =>
    DOCUMENT_TYPES.find((d) => d.value === docType)?.label || docType;

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Gestión de Clientes
        </h1>
        <p className="text-gray-600">
          {isSuperAdmin
            ? "Clientes de todos los tenants"
            : `Directorio de clientes de ${currentUser?.tenant.tenant_name}`}
        </p>
      </div>

      {/* Search & Actions */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:gap-3">
          <div className="flex-1 min-w-0">
            <Input
              label="Buscar cliente"
              placeholder="Nombre, email o documento..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />
          </div>
          {!isSuperAdmin &&
            (isLoadingSegments ? (
              <div className="flex items-center justify-center py-2">
                <div className="w-4 h-4 border-2 border-accent-200 border-t-accent-500 rounded-full animate-spin" />
              </div>
            ) : (
              <div className="flex-1 min-w-0">
                <Select
                  label="Segmento"
                  value={selectedSegment}
                  onChange={(e) => setSelectedSegment(e.target.value)}
                  options={[
                    { value: "", label: "Todos los segmentos" },
                    ...segments.map((s) => ({
                      value: s.segment_id,
                      label: s.segment_name,
                    })),
                  ]}
                />
              </div>
            ))}
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-sm text-gray-500">
              {total} cliente{total !== 1 ? "s" : ""}
            </span>
            {canCreate && (
              <Button
                variant="primary"
                size="md"
                onClick={() => {
                  setEditingCustomer(null);
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
                Nuevo Cliente
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <p className="text-xs text-gray-400 mb-4">
          Haz clic en una fila para ver el detalle del cliente
        </p>
        <Table
          columns={
            [
              {
                key: "first_name",
                label: "Nombre Completo",
                width: "22%",
                render: (_, row) => `${row.first_name} ${row.last_name}`,
              },
              {
                key: "doc_type",
                label: "Doc.",
                width: "8%",
                render: (type) => getDocTypeLabel(type),
              },
              { key: "doc_number", label: "Documento", width: "14%" },
              {
                key: "email",
                label: "Email",
                width: "18%",
                render: (email) => email || "—",
              },
              {
                key: "phone",
                label: "Teléfono",
                width: "12%",
                render: (phone) => phone || "—",
              },
              {
                key: "segment_id",
                label: "Segmento",
                width: "12%",
                render: (segmentId) =>
                  segmentId ? (
                    <Badge variant="secondary">
                      {getSegmentName(segmentId)}
                    </Badge>
                  ) : (
                    <span className="text-gray-400 text-xs">—</span>
                  ),
              },
              ...(isSuperAdmin
                ? [
                    {
                      key: "tenant_name" as keyof Customer,
                      label: "Tenant",
                      width: "10%",
                      render: (_: unknown, row: Customer) =>
                        (row as any).tenant_name || "—",
                    },
                  ]
                : []),
              ...(canCreate
                ? [
                    {
                      key: "actions" as keyof Customer,
                      label: "Acciones",
                      width: "8%",
                      render: (_: unknown, row: Customer) => (
                        <div
                          className="flex gap-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            onClick={() => handleEditCustomer(row)}
                            className="px-2 py-1 text-xs font-medium text-accent-600 hover:bg-accent-50 rounded-lg transition-colors"
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              handleDeleteCustomer(row.customer_id)
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
          data={customers}
          isLoading={isLoading}
          emptyMessage="No hay clientes registrados"
          onRowClick={(row) => setSelectedCustomer(row)}
        />
        {totalPages > 1 && (
          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={(p) => {
              setPage(p);
              loadCustomers(p, searchQuery, selectedSegment);
            }}
            loading={isLoading}
          />
        )}
      </div>

      {/* Detail Modal */}
      {selectedCustomer && (
        <CustomerDetailModal
          customer={selectedCustomer}
          segments={segments}
          onClose={() => setSelectedCustomer(null)}
        />
      )}

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingCustomer ? "Editar Cliente" : "Nuevo Cliente"}
        size="md"
      >
        <form
          ref={formRef}
          onSubmit={handleSubmit}
          className="space-y-4 max-h-[80vh] overflow-y-auto pr-1"
        >
          {/* Tenant selector (superuser only, create mode) */}
          {isSuperAdmin &&
            !editingCustomer &&
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

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Nombre"
              placeholder="Ej: Juan"
              value={formData.first_name}
              onChange={(e) =>
                setFormData((p) => ({ ...p, first_name: e.target.value }))
              }
              error={formErrors.first_name}
              required
            />
            <Input
              label="Apellido"
              placeholder="Ej: Pérez"
              value={formData.last_name}
              onChange={(e) =>
                setFormData((p) => ({ ...p, last_name: e.target.value }))
              }
              error={formErrors.last_name}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Tipo de Documento"
              value={formData.doc_type}
              onChange={(e) =>
                setFormData((p) => ({
                  ...p,
                  doc_type: e.target.value as DocTypeCode,
                }))
              }
              options={DOCUMENT_TYPES}
              error={formErrors.doc_type}
              disabled={!!editingCustomer}
              required
            />
            <Input
              label="Número de Documento"
              placeholder="Ej: 123456789"
              value={formData.doc_number}
              onChange={(e) =>
                setFormData((p) => ({ ...p, doc_number: e.target.value }))
              }
              error={formErrors.doc_number}
              disabled={!!editingCustomer}
              required
            />
          </div>

          <Input
            label="Email"
            type="email"
            placeholder="cliente@ejemplo.com"
            value={formData.email}
            onChange={(e) =>
              setFormData((p) => ({ ...p, email: e.target.value }))
            }
            error={formErrors.email}
          />

          <Input
            label="Teléfono"
            placeholder="+506 2234 5678"
            value={formData.phone}
            onChange={(e) =>
              setFormData((p) => ({ ...p, phone: e.target.value }))
            }
          />

          <Input
            label="Dirección"
            placeholder="Calle principal, número 123"
            value={formData.address}
            onChange={(e) =>
              setFormData((p) => ({ ...p, address: e.target.value }))
            }
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Ciudad"
              placeholder="Ej: San José"
              value={formData.city}
              onChange={(e) =>
                setFormData((p) => ({ ...p, city: e.target.value }))
              }
            />
            <Input
              label="Provincia"
              placeholder="Ej: San José"
              value={formData.province}
              onChange={(e) =>
                setFormData((p) => ({ ...p, province: e.target.value }))
              }
            />
          </div>

          <Input
            label="Código Postal"
            placeholder="Ej: 10101"
            value={formData.postal_code}
            onChange={(e) =>
              setFormData((p) => ({ ...p, postal_code: e.target.value }))
            }
          />

          {isLoadingSegments ? (
            <div className="flex items-center justify-center py-2">
              <div className="w-4 h-4 border-2 border-accent-200 border-t-accent-500 rounded-full animate-spin" />
            </div>
          ) : (
            <Select
              label="Segmento (Opcional)"
              value={formData.segment_id}
              onChange={(e) =>
                setFormData((p) => ({ ...p, segment_id: e.target.value }))
              }
              options={[
                { value: "", label: "Sin segmento" },
                ...segments.map((s) => ({
                  value: s.segment_id,
                  label: s.segment_name,
                })),
              ]}
            />
          )}

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
              {editingCustomer ? "Guardar Cambios" : "Crear Cliente"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
