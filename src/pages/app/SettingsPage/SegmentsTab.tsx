import { useEffect, useState } from "react";

import { marginApi } from "@/api/margin.api";

import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Toast } from "@/components/ui/Toast";

import type { Segment } from "@/interfaces/entities/Segment.interface";
import type { Margin } from "@/interfaces/entities/Margin.interface";
import { capitalize } from "@/utils/capitalize";

import { MarginUpsertModal } from "./MarginUpsertModal";
import { MARGIN_TYPES } from "./margin.schema";
import type { ToastMode } from "@/interfaces/components/ui/ToastProps.interface";

function getThresholdDisplay(margin: Margin): string {
  const type = MARGIN_TYPES.find((t) => t.name === margin.type_name);
  if (!type) return "—";
  switch (type.id) {
    case 1:
    case 4:
      return `₡${margin.spending_threshold.toLocaleString("es-CR", { minimumFractionDigits: 2 })}`;
    case 2:
      return `${margin.seniority_months} mes${margin.seniority_months !== 1 ? "es" : ""}`;
    case 3:
      return `${margin.frequency_per_month} compra${margin.frequency_per_month !== 1 ? "s" : ""}/mes`;
    default:
      return "—";
  }
}

export function SegmentsTab({
  tenantId,
  segments,
  margins: initialMargins,
}: {
  tenantId: string;
  segments: Segment[];
  margins: Margin[];
}) {
  const [margins, setMargins] = useState<Margin[]>(initialMargins);
  const [toast, setToast] = useState<{
    mode: ToastMode;
    message: string;
  } | null>(null);

  useEffect(() => {
    setMargins(initialMargins);
  }, [initialMargins]);

  const [marginModal, setMarginModal] = useState<{
    open: boolean;
    editing: Margin | null;
  }>({
    open: false,
    editing: null,
  });

  const handleDeleteMargin = async (id: string) => {
    if (!confirm("¿Eliminar este margen?")) return;
    try {
      await marginApi.delete(id);
      setMargins((prev) =>
        prev.filter((m) => m.customer_segment_margin_id !== id),
      );
      setToast({ mode: "success", message: "Margen eliminado" });
    } catch (error) {
      setToast({
        mode: "error",
        message:
          "Error al eliminar el margen: " +
          (error instanceof Error ? error.message : "Error desconocido"),
      });
    }
  };

  return (
    <div className="space-y-8">
      {/* Description */}
      <div className="p-4 bg-blue-100 border border-blue-300 rounded-xl text-sm text-blue-800">
        <p className="font-semibold mb-1">¿Qué son los segmentos y márgenes?</p>
        <p>
          Los <strong>segmentos</strong> permiten clasificar clientes (ej:
          Mayorista, Minorista, VIP). Los <strong>márgenes</strong> definen los
          criterios de clasificación de cada segmento según el tipo: gasto
          acumulado, antigüedad, frecuencia de compra, etc. Cada segmento puede
          tener un margen por tipo.
        </p>
      </div>

      {/* Segments */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-gray-900">
            Segmentos de Cliente
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {segments.map((seg) => (
            <div
              key={seg.segment_id}
              className="border border-gray-200 rounded-xl p-4 hover:shadow-sm transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-semibold text-gray-900">
                    {capitalize(seg.segment_name)}
                  </p>
                  {seg.hierarchy && (
                    <p className="text-xs text-gray-500 mt-0.5">
                      Nivel: {seg.hierarchy}
                    </p>
                  )}
                </div>
                <Badge variant="secondary" className="text-xs">
                  {
                    margins.filter((m) => m.segment_name === seg.segment_name)
                      .length
                  }{" "}
                  márgenes
                </Badge>
              </div>
            </div>
          ))}
        </div>
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

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left px-4 py-3 font-medium text-gray-700">
                  Segmento
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-700">
                  Tipo de Margen
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-700">
                  Umbral
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-700">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {margins.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-6 text-center text-gray-400 text-sm"
                  >
                    No hay márgenes configurados.
                  </td>
                </tr>
              )}
              {margins.map((margin) => (
                <tr
                  key={margin.customer_segment_margin_id}
                  className="border-b border-gray-100 hover:bg-gray-50"
                >
                  <td className="px-4 py-3">
                    <Badge variant="secondary">
                      {capitalize(margin.segment_name)}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {MARGIN_TYPES.find((t) => t.name === margin.type_name)
                      ?.label ?? margin.type_name}
                  </td>
                  <td className="px-4 py-3 font-semibold text-gray-900">
                    {getThresholdDisplay(margin)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setMarginModal({ open: true, editing: margin });
                        }}
                        className="px-2 py-1 text-xs font-medium text-accent-600 hover:bg-accent-50 rounded-lg transition-colors"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          handleDeleteMargin(margin.customer_segment_margin_id)
                        }
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
      </div>

      <MarginUpsertModal
        isOpen={marginModal.open}
        mode={marginModal.editing ? "edit" : "create"}
        tenantId={tenantId}
        segments={segments}
        editingMargin={marginModal.editing}
        onClose={() => setMarginModal({ open: false, editing: null })}
        onSaved={async (message) => {
          const refreshedMargins = await marginApi.listByTenant(tenantId);
          setMargins(refreshedMargins);
          setToast({ mode: "success", message });
        }}
        onError={(message) => {
          setToast({ mode: "error", message });
        }}
      />

      {toast && (
        <Toast
          mode={toast.mode}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
