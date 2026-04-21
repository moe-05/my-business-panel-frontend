import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { segmentApi } from "../../api/segment.api";
import { marginApi } from "../../api/margin.api";
import { loyaltyApi } from "../../api/loyalty.api";
import { haciendaApi } from "../../api/hacienda.api";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { Modal } from "../../components/ui/Modal";
import { Badge } from "../../components/ui/Badge";
import type { Segment } from "../../interfaces/entities/Segment.interface";
import type { Margin } from "../../interfaces/entities/Margin.interface";
import type { LoyaltyProgram } from "../../interfaces/entities/LoyaltyProgram.interface";
import type { HaciendaConfigStatus } from "../../interfaces/api/responses/HaciendaConfigStatus.interface";

type Tab = "segments" | "loyalty" | "hacienda";

// ─── Segment + Margin Tab ────────────────────────────────────────────────────

function SegmentsTab({ tenantId }: { tenantId: string }) {
  const [segments, setSegments] = useState<Segment[]>([]);
  const [margins, setMargins] = useState<Margin[]>([]);
  const [isLoadingSegments, setIsLoadingSegments] = useState(true);
  const [isLoadingMargins, setIsLoadingMargins] = useState(true);

  // Segment modal
  const [segmentModal, setSegmentModal] = useState<{
    open: boolean;
    editing: Segment | null;
  }>({
    open: false,
    editing: null,
  });
  const [segmentForm, setSegmentForm] = useState({
    segment_name: "",
    hierarchy: "",
  });
  const [segmentErrors, setSegmentErrors] = useState<Record<string, string>>(
    {},
  );
  const [isSubmittingSegment, setIsSubmittingSegment] = useState(false);

  // Margin modal
  const [marginModal, setMarginModal] = useState<{
    open: boolean;
    editing: Margin | null;
  }>({
    open: false,
    editing: null,
  });
  const [marginForm, setMarginForm] = useState({
    segment_id: "",
    margin_percentage: "",
  });
  const [marginErrors, setMarginErrors] = useState<Record<string, string>>({});
  const [isSubmittingMargin, setIsSubmittingMargin] = useState(false);

  const loadSegments = async () => {
    setIsLoadingSegments(true);
    segmentApi
      .getAll()
      .then(setSegments)
      .catch(console.error)
      .finally(() => setIsLoadingSegments(false));
  };

  const loadMargins = async () => {
    setIsLoadingMargins(true);
    marginApi
      .listByTenant(tenantId)
      .then(setMargins)
      .catch(console.error)
      .finally(() => setIsLoadingMargins(false));
  };

  useEffect(() => {
    loadSegments();
    loadMargins();
  }, [tenantId]);

  // Segment handlers
  const handleSubmitSegment = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!segmentForm.segment_name.trim())
      errs.segment_name = "Nombre es requerido";
    setSegmentErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setIsSubmittingSegment(true);
    try {
      if (segmentModal.editing) {
        await segmentApi.update(segmentModal.editing.segment_id, {
          segment_name: segmentForm.segment_name,
          hierarchy: segmentForm.hierarchy
            ? parseInt(segmentForm.hierarchy)
            : undefined,
        });
      } else {
        await segmentApi.create({
          segment_name: segmentForm.segment_name,
          hierarchy: segmentForm.hierarchy
            ? parseInt(segmentForm.hierarchy)
            : undefined,
          tenant_id: tenantId,
        });
      }
      await loadSegments();
      setSegmentModal({ open: false, editing: null });
      setSegmentForm({ segment_name: "", hierarchy: "" });
    } catch (error) {
      setSegmentErrors({
        segment_name: error instanceof Error ? error.message : "Error",
      });
    } finally {
      setIsSubmittingSegment(false);
    }
  };

  const handleDeleteSegment = async (id: string) => {
    if (!confirm("¿Eliminar este segmento?")) return;
    try {
      await segmentApi.delete(id);
      await loadSegments();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Error al eliminar");
    }
  };

  // Margin handlers
  const handleSubmitMargin = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!marginForm.segment_id) errs.segment_id = "Segmento es requerido";
    if (
      !marginForm.margin_percentage ||
      isNaN(parseFloat(marginForm.margin_percentage))
    )
      errs.margin_percentage = "Porcentaje inválido";
    setMarginErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setIsSubmittingMargin(true);
    try {
      if (marginModal.editing) {
        await marginApi.update(
          marginModal.editing.margin_id,
          parseFloat(marginForm.margin_percentage),
        );
      } else {
        await marginApi.create({
          tenant_id: tenantId,
          segment_id: marginForm.segment_id,
          margin_percentage: parseFloat(marginForm.margin_percentage),
        });
      }
      await loadMargins();
      setMarginModal({ open: false, editing: null });
      setMarginForm({ segment_id: "", margin_percentage: "" });
    } catch (error) {
      setMarginErrors({
        margin_percentage: error instanceof Error ? error.message : "Error",
      });
    } finally {
      setIsSubmittingMargin(false);
    }
  };

  const handleDeleteMargin = async (id: string) => {
    if (!confirm("¿Eliminar este margen?")) return;
    try {
      await marginApi.delete(id);
      await loadMargins();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Error al eliminar");
    }
  };

  const getSegmentName = (segmentId: string) =>
    segments.find((s) => s.segment_id === segmentId)?.segment_name || "N/A";

  return (
    <div className="space-y-8">
      {/* Description */}
      <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl text-sm text-blue-800">
        <p className="font-semibold mb-1">¿Qué son los segmentos y márgenes?</p>
        <p>
          Los <strong>segmentos</strong> permiten clasificar clientes (ej:
          Mayorista, Minorista, VIP). Los <strong>márgenes</strong> definen el
          porcentaje de descuento o margen de ganancia aplicable a cada
          segmento. Puedes configurar ambos según las necesidades de tu negocio.
        </p>
      </div>

      {/* Segments */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-gray-900">
            Segmentos de Cliente
          </h2>
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setSegmentModal({ open: true, editing: null });
              setSegmentForm({ segment_name: "", hierarchy: "" });
              setSegmentErrors({});
            }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Nuevo Segmento
          </Button>
        </div>

        {isLoadingSegments ? (
          <div className="flex justify-center py-6">
            <div className="w-6 h-6 border-2 border-accent-200 border-t-accent-500 rounded-full animate-spin" />
          </div>
        ) : segments.length === 0 ? (
          <div className="text-center py-6 text-gray-500 text-sm">
            No hay segmentos registrados
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {segments.map((seg) => (
              <div
                key={seg.segment_id}
                className="border border-gray-200 rounded-xl p-4 hover:shadow-sm transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-semibold text-gray-900">
                      {seg.segment_name}
                    </p>
                    {seg.hierarchy && (
                      <p className="text-xs text-gray-500 mt-0.5">
                        Nivel: {seg.hierarchy}
                      </p>
                    )}
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {
                      margins.filter((m) => m.segment_id === seg.segment_id)
                        .length
                    }{" "}
                    márgenes
                  </Badge>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSegmentModal({ open: true, editing: seg });
                      setSegmentForm({
                        segment_name: seg.segment_name,
                        hierarchy: seg.hierarchy?.toString() || "",
                      });
                      setSegmentErrors({});
                    }}
                    className="flex-1 px-2 py-1.5 text-xs font-medium text-accent-600 hover:bg-accent-50 rounded-lg transition-colors"
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteSegment(seg.segment_id)}
                    className="flex-1 px-2 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Margins */}
      <div className="border-t border-gray-100 pt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-gray-900">
            Márgenes por Segmento
          </h2>
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setMarginModal({ open: true, editing: null });
              setMarginForm({ segment_id: "", margin_percentage: "" });
              setMarginErrors({});
            }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Nuevo Margen
          </Button>
        </div>

        {isLoadingMargins ? (
          <div className="flex justify-center py-6">
            <div className="w-6 h-6 border-2 border-accent-200 border-t-accent-500 rounded-full animate-spin" />
          </div>
        ) : margins.length === 0 ? (
          <div className="text-center py-6 text-gray-500 text-sm">
            No hay márgenes configurados
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left px-4 py-3 font-medium text-gray-700">
                    Segmento
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-700">
                    Porcentaje
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-700">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {margins.map((margin) => (
                  <tr
                    key={margin.margin_id}
                    className="border-b border-gray-100 hover:bg-gray-50"
                  >
                    <td className="px-4 py-3">
                      <Badge variant="secondary">
                        {getSegmentName(margin.segment_id)}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 font-semibold">
                      {margin.margin_percentage.toFixed(2)}%
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setMarginModal({ open: true, editing: margin });
                            setMarginForm({
                              segment_id: margin.segment_id,
                              margin_percentage:
                                margin.margin_percentage.toString(),
                            });
                            setMarginErrors({});
                          }}
                          className="px-2 py-1 text-xs font-medium text-accent-600 hover:bg-accent-50 rounded-lg transition-colors"
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteMargin(margin.margin_id)}
                          className="px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Segment Modal */}
      <Modal
        isOpen={segmentModal.open}
        onClose={() => setSegmentModal({ open: false, editing: null })}
        title={segmentModal.editing ? "Editar Segmento" : "Nuevo Segmento"}
        size="sm"
      >
        <form onSubmit={handleSubmitSegment} className="space-y-4">
          <Input
            label="Nombre del Segmento"
            placeholder="Ej: Premium, Standard, Basic"
            value={segmentForm.segment_name}
            onChange={(e) =>
              setSegmentForm((p) => ({ ...p, segment_name: e.target.value }))
            }
            error={segmentErrors.segment_name}
            required
          />
          <Input
            label="Nivel Jerárquico (opcional)"
            type="number"
            placeholder="Ej: 1, 2, 3"
            value={segmentForm.hierarchy}
            onChange={(e) =>
              setSegmentForm((p) => ({ ...p, hierarchy: e.target.value }))
            }
          />
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <Button
              type="button"
              variant="ghost"
              fullWidth
              onClick={() => setSegmentModal({ open: false, editing: null })}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              fullWidth
              loading={isSubmittingSegment}
            >
              {segmentModal.editing ? "Guardar" : "Crear"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Margin Modal */}
      <Modal
        isOpen={marginModal.open}
        onClose={() => setMarginModal({ open: false, editing: null })}
        title={marginModal.editing ? "Editar Margen" : "Nuevo Margen"}
        size="sm"
      >
        <form onSubmit={handleSubmitMargin} className="space-y-4">
          <Select
            label="Segmento"
            value={marginForm.segment_id}
            onChange={(e) =>
              setMarginForm((p) => ({ ...p, segment_id: e.target.value }))
            }
            options={segments.map((s) => ({
              value: s.segment_id,
              label: s.segment_name,
            }))}
            error={marginErrors.segment_id}
            disabled={!!marginModal.editing}
            required
          />
          <Input
            label="Porcentaje de Margen"
            type="number"
            placeholder="Ej: 15.5"
            step="0.01"
            min="0"
            max="100"
            value={marginForm.margin_percentage}
            onChange={(e) =>
              setMarginForm((p) => ({
                ...p,
                margin_percentage: e.target.value,
              }))
            }
            error={marginErrors.margin_percentage}
            required
          />
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <Button
              type="button"
              variant="ghost"
              fullWidth
              onClick={() => setMarginModal({ open: false, editing: null })}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              fullWidth
              loading={isSubmittingMargin}
            >
              {marginModal.editing ? "Guardar" : "Crear"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

// ─── Loyalty Program Tab ─────────────────────────────────────────────────────

function LoyaltyTab({ tenantId }: { tenantId: string }) {
  const [programs, setPrograms] = useState<LoyaltyProgram[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    points_earned_per_currency_unit: "",
    points_redeemed_per_currency_unit: "",
    minimum_purchase_for_points: "",
  });

  const loadPrograms = async () => {
    setIsLoading(true);
    loyaltyApi
      .getByTenant(tenantId)
      .then(setPrograms)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadPrograms();
  }, [tenantId]);

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    const earned = parseFloat(form.points_earned_per_currency_unit);
    const redeemed = parseFloat(form.points_redeemed_per_currency_unit);
    if (!form.points_earned_per_currency_unit || isNaN(earned) || earned <= 0)
      errs.points_earned_per_currency_unit = "Debe ser mayor a 0";
    if (
      !form.points_redeemed_per_currency_unit ||
      isNaN(redeemed) ||
      redeemed <= 0
    )
      errs.points_redeemed_per_currency_unit = "Debe ser mayor a 0";
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setIsSubmitting(true);
    try {
      await loyaltyApi.create({
        tenant_id: tenantId,
        points_earned_per_currency_unit: earned,
        points_redeemed_per_currency_unit: redeemed,
        minimum_purchase_for_points: form.minimum_purchase_for_points
          ? parseFloat(form.minimum_purchase_for_points)
          : undefined,
      });
      await loadPrograms();
      setForm({
        points_earned_per_currency_unit: "",
        points_redeemed_per_currency_unit: "",
        minimum_purchase_for_points: "",
      });
    } catch (error) {
      setErrors({
        points_earned_per_currency_unit:
          error instanceof Error ? error.message : "Error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggle = async (program: LoyaltyProgram) => {
    if (
      !confirm(
        `¿${program.is_active ? "Desactivar" : "Activar"} este programa de lealtad?`,
      )
    )
      return;
    try {
      await loyaltyApi.update(program.loyalty_program_id, {
        minimum_purchase_for_points: program.minimum_purchase_for_points,
      });
      await loadPrograms();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Error");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar este programa de lealtad?")) return;
    try {
      await loyaltyApi.delete(id);
      await loadPrograms();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Error");
    }
  };

  const activeProgram = programs.find((p) => p.is_active);

  return (
    <div className="space-y-6">
      {/* Description */}
      <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl text-sm text-amber-800">
        <p className="font-semibold mb-1">¿Qué es el programa de lealtad?</p>
        <p>
          El programa de lealtad permite a tus clientes acumular{" "}
          <strong>puntos</strong> por cada compra y canjearlos en futuras
          transacciones. Puedes configurar cuántos puntos se otorgan por unidad
          de moneda gastada y cuántos puntos equivalen a una unidad de moneda al
          canjear. También puedes establecer un monto mínimo de compra para
          acumular puntos.
        </p>
      </div>

      {/* Active program status */}
      {isLoading ? (
        <div className="flex justify-center py-6">
          <div className="w-6 h-6 border-2 border-accent-200 border-t-accent-500 rounded-full animate-spin" />
        </div>
      ) : activeProgram ? (
        <div className="border border-green-200 rounded-xl p-5 bg-green-50">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="font-semibold text-green-900">Programa Activo</p>
              <p className="text-xs text-green-700 mt-0.5">
                Activado:{" "}
                {new Date(activeProgram.created_at).toLocaleDateString("es-CR")}
              </p>
            </div>
            <Badge variant="success">Activo</Badge>
          </div>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="bg-white rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-gray-900">
                {activeProgram.points_earned_per_currency_unit}
              </p>
              <p className="text-xs text-gray-600 mt-1">
                Puntos por ₡1 gastado
              </p>
            </div>
            <div className="bg-white rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-gray-900">
                {activeProgram.points_redeemed_per_currency_unit}
              </p>
              <p className="text-xs text-gray-600 mt-1">Puntos = ₡1 de canje</p>
            </div>
            <div className="bg-white rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-gray-900">
                {activeProgram.minimum_purchase_for_points
                  ? `₡${Number(activeProgram.minimum_purchase_for_points).toLocaleString("es-CR")}`
                  : "Sin mínimo"}
              </p>
              <p className="text-xs text-gray-600 mt-1">Compra mínima</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => handleDelete(activeProgram.loyalty_program_id)}
            className="w-full px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-red-200"
          >
            Desactivar y eliminar programa
          </button>
        </div>
      ) : (
        <div>
          <p className="text-sm text-gray-600 mb-4 font-medium">
            Configurar nuevo programa de lealtad
          </p>
          <form onSubmit={handleActivate} className="space-y-4 max-w-lg">
            <Input
              label="Puntos otorgados por ₡1 gastado"
              type="number"
              placeholder="Ej: 1"
              step="0.01"
              min="0.01"
              value={form.points_earned_per_currency_unit}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  points_earned_per_currency_unit: e.target.value,
                }))
              }
              error={errors.points_earned_per_currency_unit}
              hint="Cantidad de puntos que gana el cliente por cada colón gastado"
              required
            />
            <Input
              label="Puntos necesarios para canjear ₡1"
              type="number"
              placeholder="Ej: 100"
              step="1"
              min="1"
              value={form.points_redeemed_per_currency_unit}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  points_redeemed_per_currency_unit: e.target.value,
                }))
              }
              error={errors.points_redeemed_per_currency_unit}
              hint="Cuántos puntos acumulados equivalen a ₡1 de descuento"
              required
            />
            <Input
              label="Monto mínimo de compra para acumular puntos (opcional)"
              type="number"
              placeholder="Ej: 5000"
              step="1"
              min="0"
              value={form.minimum_purchase_for_points}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  minimum_purchase_for_points: e.target.value,
                }))
              }
              hint="Dejar vacío para acumular puntos en cualquier compra"
            />
            <Button type="submit" variant="primary" loading={isSubmitting}>
              Activar Programa de Lealtad
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}

// ─── Hacienda Config Tab ─────────────────────────────────────────────────────

function HaciendaTab({ tenantId }: { tenantId: string }) {
  const [status, setStatus] = useState<HaciendaConfigStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    hacienda_username: "",
    hacienda_password: "",
    hacienda_client_id: "",
    p12_base64: "",
    p12_password: "",
  });

  const loadStatus = async () => {
    setIsLoading(true);
    try {
      const data = await haciendaApi.getStatus(tenantId);
      setStatus(data);
      if (data.hacienda_username)
        setForm((p) => ({
          ...p,
          hacienda_username: data.hacienda_username || "",
        }));
      if (data.hacienda_client_id)
        setForm((p) => ({
          ...p,
          hacienda_client_id: data.hacienda_client_id || "",
        }));
    } catch {
      setStatus(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();
  }, [tenantId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!form.hacienda_username.trim())
      errs.hacienda_username = "Usuario es requerido";
    if (!form.hacienda_password.trim())
      errs.hacienda_password = "Contraseña es requerida";
    if (!form.hacienda_client_id.trim())
      errs.hacienda_client_id = "Client ID es requerido";
    if (!form.p12_base64.trim())
      errs.p12_base64 = "Certificado P12 (Base64) es requerido";
    if (!form.p12_password.trim())
      errs.p12_password = "Contraseña del certificado es requerida";
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setIsSubmitting(true);
    try {
      await haciendaApi.save({ tenant_id: tenantId, ...form });
      await loadStatus();
      setForm((p) => ({
        ...p,
        hacienda_password: "",
        p12_base64: "",
        p12_password: "",
      }));
      alert("Configuración de Hacienda guardada correctamente.");
    } catch (error) {
      setErrors({
        hacienda_username:
          error instanceof Error
            ? error.message
            : "Error guardando configuración",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeactivate = async () => {
    if (
      !confirm(
        "¿Desactivar la configuración de Hacienda? Esto impedirá la emisión de facturas electrónicas.",
      )
    )
      return;
    try {
      await haciendaApi.deactivate(tenantId);
      await loadStatus();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Error");
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-6 h-6 border-2 border-accent-200 border-t-accent-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Description */}
      <div className="p-4 bg-purple-50 border border-purple-100 rounded-xl text-sm text-purple-800">
        <p className="font-semibold mb-1">
          ¿Para qué sirve la configuración de Hacienda?
        </p>
        <p>
          Esta sección permite configurar las credenciales de acceso al sistema
          de <strong>Hacienda de Costa Rica</strong> para la emisión de facturas
          electrónicas (Comprobante Electrónico). Requiere el usuario y
          contraseña del ATV (Administración Tributaria Virtual), el Client ID y
          el certificado P12 de firma digital.
        </p>
      </div>

      {/* Status banner */}
      {status?.configured ? (
        <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl">
          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#16a34a"
              strokeWidth="2.5"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-green-900">
              Hacienda configurada
            </p>
            <p className="text-xs text-green-700">
              Usuario: {status.hacienda_username} · Certificado P12:{" "}
              {status.has_p12 ? "Cargado" : "No cargado"}
            </p>
          </div>
          <button
            type="button"
            onClick={handleDeactivate}
            className="text-xs font-medium text-red-600 hover:text-red-800 transition-colors"
          >
            Desactivar
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#d97706"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <p className="text-sm text-amber-800">
            <span className="font-semibold">No configurado.</span> Sin estas
            credenciales no podrás emitir facturas electrónicas.
          </p>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
        <p className="text-sm font-medium text-gray-700">
          {status?.configured
            ? "Actualizar credenciales"
            : "Configurar credenciales"}
        </p>

        <Input
          label="Usuario ATV (Hacienda)"
          placeholder="Ej: cpf-04-1234-5678"
          value={form.hacienda_username}
          onChange={(e) =>
            setForm((p) => ({ ...p, hacienda_username: e.target.value }))
          }
          error={errors.hacienda_username}
          required
        />

        <Input
          label="Contraseña ATV"
          type="password"
          placeholder="Contraseña del portal ATV"
          value={form.hacienda_password}
          onChange={(e) =>
            setForm((p) => ({ ...p, hacienda_password: e.target.value }))
          }
          error={errors.hacienda_password}
          hint={
            status?.configured
              ? "Dejar vacío si no deseas cambiarla"
              : undefined
          }
          required={!status?.configured}
        />

        <Input
          label="Client ID"
          placeholder="Client ID de la API de Hacienda"
          value={form.hacienda_client_id}
          onChange={(e) =>
            setForm((p) => ({ ...p, hacienda_client_id: e.target.value }))
          }
          error={errors.hacienda_client_id}
          required
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Certificado P12 (Base64)
            {!status?.configured && (
              <span className="text-red-500 ml-1">*</span>
            )}
          </label>
          <textarea
            rows={3}
            placeholder="Pegue aquí el contenido del certificado P12 en Base64..."
            value={form.p12_base64}
            onChange={(e) =>
              setForm((p) => ({ ...p, p12_base64: e.target.value }))
            }
            className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500 font-mono resize-none ${
              errors.p12_base64 ? "border-red-300 bg-red-50" : "border-gray-300"
            }`}
          />
          {errors.p12_base64 && (
            <p className="mt-1 text-xs text-red-600">{errors.p12_base64}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            Codifique el archivo .p12 a Base64 antes de pegarlo aquí
          </p>
        </div>

        <Input
          label="Contraseña del Certificado P12"
          type="password"
          placeholder="Contraseña del certificado .p12"
          value={form.p12_password}
          onChange={(e) =>
            setForm((p) => ({ ...p, p12_password: e.target.value }))
          }
          error={errors.p12_password}
          required={!status?.configured}
        />

        <Button type="submit" variant="primary" loading={isSubmitting}>
          {status?.configured
            ? "Actualizar Configuración"
            : "Guardar Configuración"}
        </Button>
      </form>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function SettingsPage() {
  const { user: currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("segments");

  const tenantId = currentUser?.tenant.tenant_id || "";

  const tabs: { key: Tab; label: string }[] = [
    { key: "segments", label: "Segmentos y Márgenes" },
    { key: "loyalty", label: "Programa de Lealtad" },
    { key: "hacienda", label: "Configuración Hacienda" },
  ];

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Configuración</h1>
        <p className="text-gray-600">
          Configura segmentos de clientes, programa de lealtad y datos de
          Hacienda
        </p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="flex border-b border-gray-100 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              type="button"
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 min-w-max px-6 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.key
                  ? "border-b-2 border-accent-600 text-accent-600 bg-accent-50/30"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {activeTab === "segments" && <SegmentsTab tenantId={tenantId} />}
          {activeTab === "loyalty" && <LoyaltyTab tenantId={tenantId} />}
          {activeTab === "hacienda" && <HaciendaTab tenantId={tenantId} />}
        </div>
      </div>
    </div>
  );
}
