import { useState } from "react";
import { useLoaderData } from "react-router-dom";

import { royaltyApi } from "@/api/royalty.api";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Toast } from "@/components/ui/Toast";
import { Badge } from "@/components/ui/Badge";

import type { ToastMode } from "@/interfaces/components/ui/ToastProps.interface";
import type { TenantProductGroup } from "@/interfaces/entities/ProductGroup.interface";
import type {
  GiftableProduct,
  RoyaltyOption,
  RoyaltyRule,
} from "@/interfaces/entities/Royalty.interface";
import type { RoyaltiesPageLoaderData } from "@/router/loaders/royalties.loaders";

const fmt = (v: number) =>
  `₡ ${Number(v).toLocaleString("es-CR", { minimumFractionDigits: 2 })}`;

interface OptionDraft {
  tenant_product_group_id: string;
  quantity: number;
  scope: "any" | "specific";
  selectedProductIds: string[];
}

const emptyDraft = (): OptionDraft => ({
  tenant_product_group_id: "",
  quantity: 1,
  scope: "any",
  selectedProductIds: [],
});

export function RoyaltiesPage() {
  const {
    rules: initialRules,
    productGroups,
    tenantId,
  } = useLoaderData() as RoyaltiesPageLoaderData;

  const [rules, setRules] = useState<RoyaltyRule[]>(initialRules);
  const [selectedRuleId, setSelectedRuleId] = useState<string | null>(
    initialRules[0]?.royalty_rule_id ?? null,
  );
  const [toast, setToast] = useState<{
    mode: ToastMode;
    message: string;
  } | null>(null);

  // New rule form
  const [showNewRule, setShowNewRule] = useState(false);
  const [newRuleAmount, setNewRuleAmount] = useState("");
  const [isSavingRule, setIsSavingRule] = useState(false);

  // Option draft (adding new option to selected rule)
  const [optionDraft, setOptionDraft] = useState<OptionDraft | null>(null);
  const [isSavingOption, setIsSavingOption] = useState(false);
  const [giftableCache, setGiftableCache] = useState<
    Record<string, GiftableProduct[]>
  >({});
  const [loadingGiftable, setLoadingGiftable] = useState<string | null>(null);

  // Inline option editing
  const [editingOptionId, setEditingOptionId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<Pick<
    OptionDraft,
    "quantity" | "scope" | "selectedProductIds"
  > | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const selectedRule =
    rules.find((r) => r.royalty_rule_id === selectedRuleId) ?? null;

  const sortedRules = [...rules].sort((a, b) => a.min_amount - b.min_amount);

  const notify = (mode: ToastMode, message: string) =>
    setToast({ mode, message });

  const reloadRules = async () => {
    const fresh = await royaltyApi.listRules(tenantId);
    setRules(fresh);
    return fresh;
  };

  // ── Load giftable products for a group ─────────────────────────────────────

  const loadGiftable = async (groupId: string): Promise<GiftableProduct[]> => {
    if (giftableCache[groupId]) return giftableCache[groupId];
    setLoadingGiftable(groupId);
    try {
      const products = await royaltyApi.getGiftableProducts(groupId);
      setGiftableCache((prev) => ({ ...prev, [groupId]: products }));
      return products;
    } finally {
      setLoadingGiftable(null);
    }
  };

  // ── Create rule ─────────────────────────────────────────────────────────────

  const handleCreateRule = async () => {
    const amount = parseFloat(newRuleAmount.replace(",", "."));
    if (!Number.isFinite(amount) || amount <= 0) {
      notify("error", "Ingresa un monto válido mayor a 0");
      return;
    }
    setIsSavingRule(true);
    try {
      const created = await royaltyApi.createRule(tenantId, amount);

      // Pre-populate options from the predecessor rule (rule with highest min_amount < new amount)
      const predecessor = [...rules]
        .filter((r) => r.min_amount < amount)
        .sort((a, b) => b.min_amount - a.min_amount)[0];

      if (predecessor && predecessor.options.length > 0) {
        for (const opt of predecessor.options) {
          const newOpt = await royaltyApi.createOption({
            royalty_rule_id: created.royalty_rule_id,
            tenant_product_group_id: opt.tenant_product_group_id,
            quantity: opt.quantity,
            scope: opt.scope,
          });
          if (opt.scope === "specific" && opt.products.length > 0) {
            await royaltyApi.setOptionProducts(
              newOpt.royalty_option_id,
              opt.products.map((p) => p.product_variant_id),
            );
          }
        }
      }

      const fresh = await reloadRules();
      setSelectedRuleId(created.royalty_rule_id);
      setShowNewRule(false);
      setNewRuleAmount("");
      const msg =
        predecessor && predecessor.options.length > 0
          ? `Regla creada con ${predecessor.options.length} opción(es) heredadas del nivel anterior`
          : "Regla de regalía creada";
      notify("success", msg);
      return fresh;
    } catch (e) {
      notify("error", e instanceof Error ? e.message : "Error al crear regla");
    } finally {
      setIsSavingRule(false);
    }
  };

  // ── Delete rule ─────────────────────────────────────────────────────────────

  const handleDeleteRule = async (ruleId: string) => {
    if (
      !confirm(
        "¿Eliminar esta regla de regalía? Esta acción no se puede deshacer.",
      )
    )
      return;
    try {
      await royaltyApi.deleteRule(ruleId);
      const fresh = await reloadRules();
      if (selectedRuleId === ruleId) {
        setSelectedRuleId(fresh[0]?.royalty_rule_id ?? null);
      }
      notify("success", "Regla eliminada");
    } catch (e) {
      notify(
        "error",
        e instanceof Error ? e.message : "Error al eliminar regla",
      );
    }
  };

  // ── Add option ──────────────────────────────────────────────────────────────

  const handleDraftGroupChange = async (groupId: string) => {
    setOptionDraft((prev) =>
      prev
        ? { ...prev, tenant_product_group_id: groupId, selectedProductIds: [] }
        : prev,
    );
    if (groupId) await loadGiftable(groupId);
  };

  const handleSaveOption = async () => {
    if (!selectedRule || !optionDraft) return;
    if (!optionDraft.tenant_product_group_id) {
      notify("error", "Selecciona un departamento");
      return;
    }
    setIsSavingOption(true);
    try {
      const created = await royaltyApi.createOption({
        royalty_rule_id: selectedRule.royalty_rule_id,
        tenant_product_group_id: optionDraft.tenant_product_group_id,
        quantity: optionDraft.quantity,
        scope: optionDraft.scope,
      });
      if (
        optionDraft.scope === "specific" &&
        optionDraft.selectedProductIds.length > 0
      ) {
        await royaltyApi.setOptionProducts(
          created.royalty_option_id,
          optionDraft.selectedProductIds,
        );
      }
      await reloadRules();
      setOptionDraft(null);
      notify("success", "Opción agregada");
    } catch (e) {
      notify(
        "error",
        e instanceof Error ? e.message : "Error al guardar opción",
      );
    } finally {
      setIsSavingOption(false);
    }
  };

  // ── Edit option ─────────────────────────────────────────────────────────────

  const startEditOption = async (opt: RoyaltyOption) => {
    setEditingOptionId(opt.royalty_option_id);
    setEditDraft({
      quantity: opt.quantity,
      scope: opt.scope,
      selectedProductIds: opt.products.map((p) => p.product_variant_id),
    });
    if (opt.scope === "specific" || true) {
      await loadGiftable(opt.tenant_product_group_id);
    }
  };

  const handleSaveEdit = async (opt: RoyaltyOption) => {
    if (!editDraft) return;
    setIsSavingEdit(true);
    try {
      await royaltyApi.updateOption(opt.royalty_option_id, {
        quantity: editDraft.quantity,
        scope: editDraft.scope,
      });
      if (editDraft.scope === "specific") {
        await royaltyApi.setOptionProducts(
          opt.royalty_option_id,
          editDraft.selectedProductIds,
        );
      } else {
        await royaltyApi.setOptionProducts(opt.royalty_option_id, []);
      }
      await reloadRules();
      setEditingOptionId(null);
      setEditDraft(null);
      notify("success", "Opción actualizada");
    } catch (e) {
      notify(
        "error",
        e instanceof Error ? e.message : "Error al actualizar opción",
      );
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDeleteOption = async (optionId: string) => {
    if (!confirm("¿Eliminar esta opción?")) return;
    try {
      await royaltyApi.deleteOption(optionId);
      await reloadRules();
      notify("success", "Opción eliminada");
    } catch (e) {
      notify(
        "error",
        e instanceof Error ? e.message : "Error al eliminar opción",
      );
    }
  };

  // ── Group selector options ──────────────────────────────────────────────────

  const usedGroupIds = new Set(
    selectedRule?.options.map((o) => o.tenant_product_group_id) ?? [],
  );

  const groupOptions = (excludeId?: string) => [
    { value: "", label: "Seleccionar departamento" },
    ...productGroups
      .filter(
        (g) =>
          g.is_active &&
          (!usedGroupIds.has(g.tenant_product_group_id) ||
            g.tenant_product_group_id === excludeId),
      )
      .map((g) => ({
        value: g.tenant_product_group_id,
        label: g.group_name,
      })),
  ];

  const toggleProductId = (list: string[], id: string): string[] =>
    list.includes(id) ? list.filter((x) => x !== id) : [...list, id];

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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Regalías</h1>
        <p className="text-gray-600">
          Configura bonificaciones automáticas para clientes mayoristas según
          monto de compra.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Left: rules list ─────────────────────────────── */}
        <div className="flex flex-col gap-3">
          <div className="bg-white rounded-2xl border border-gray-300 p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                Escalas de monto
              </h2>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  setShowNewRule((v) => !v);
                  setNewRuleAmount("");
                }}
              >
                {showNewRule ? "Cancelar" : "+ Nueva"}
              </Button>
            </div>

            {showNewRule && (
              <div className="mb-4 p-3 bg-gray-50 rounded-xl border border-gray-200 flex flex-col gap-2">
                <Input
                  label="Monto mínimo (₡)"
                  type="number"
                  min={0.01}
                  step="0.01"
                  placeholder="0.00"
                  value={newRuleAmount}
                  onChange={(e) => setNewRuleAmount(e.target.value)}
                />
                <Button
                  variant="primary"
                  size="sm"
                  fullWidth
                  loading={isSavingRule}
                  onClick={handleCreateRule}
                  disabled={!newRuleAmount || isSavingRule}
                >
                  Crear regla
                </Button>
              </div>
            )}

            {sortedRules.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">
                Sin reglas configuradas
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {sortedRules.map((rule) => (
                  <button
                    key={rule.royalty_rule_id}
                    onClick={() => {
                      setSelectedRuleId(rule.royalty_rule_id);
                      setOptionDraft(null);
                      setEditingOptionId(null);
                    }}
                    className={`w-full text-left rounded-xl border px-4 py-3 transition-colors ${
                      selectedRuleId === rule.royalty_rule_id
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 bg-white hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-gray-900 text-sm">
                        {fmt(rule.min_amount)}
                      </span>
                      <Badge variant="secondary">
                        {rule.options.length} opción
                        {rule.options.length !== 1 ? "es" : ""}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Aplica desde este monto
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Right: rule editor ───────────────────────────── */}
        <div className="lg:col-span-2">
          {!selectedRule ? (
            <div className="bg-white rounded-2xl border border-gray-300 p-8 flex items-center justify-center">
              <p className="text-gray-400 text-sm">
                Selecciona una regla para editarla
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-300 p-6 flex flex-col gap-6">
              {/* Rule header */}
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">
                    Regla: {fmt(selectedRule.min_amount)}
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    El cliente aplica{" "}
                    <span className="font-medium">
                      floor(compra ÷ {fmt(selectedRule.min_amount)})
                    </span>{" "}
                    veces a esta regla.
                  </p>
                </div>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() =>
                    void handleDeleteRule(selectedRule.royalty_rule_id)
                  }
                >
                  Eliminar regla
                </Button>
              </div>

              {/* Options list */}
              <div className="flex flex-col gap-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Opciones por departamento
                </p>
                <p className="text-xs text-gray-400 -mt-2">
                  El cliente mayorista elige una opción al aplicar a esta regla.
                </p>

                {selectedRule.options.length === 0 && (
                  <p className="text-sm text-gray-400">
                    Sin opciones configuradas
                  </p>
                )}

                {selectedRule.options.map((opt) => {
                  const isEditing = editingOptionId === opt.royalty_option_id;
                  const giftable =
                    giftableCache[opt.tenant_product_group_id] ?? [];

                  return (
                    <div
                      key={opt.royalty_option_id}
                      className="border border-gray-200 rounded-xl p-4 bg-gray-50"
                    >
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div>
                          <span className="font-semibold text-gray-800 text-sm">
                            {opt.group_name}
                          </span>
                          {!isEditing && (
                            <span className="ml-2 text-xs text-gray-500">
                              {opt.quantity} unidad
                              {opt.quantity !== 1 ? "es" : ""} ·{" "}
                              {opt.scope === "any"
                                ? "Cualquier producto"
                                : "Productos específicos"}
                            </span>
                          )}
                        </div>
                        {!isEditing && (
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => void startEditOption(opt)}
                            >
                              Editar
                            </Button>
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() =>
                                void handleDeleteOption(opt.royalty_option_id)
                              }
                            >
                              ×
                            </Button>
                          </div>
                        )}
                      </div>

                      {/* View mode: product list */}
                      {!isEditing &&
                        opt.scope === "specific" &&
                        opt.products.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {opt.products.map((p) => (
                              <span
                                key={p.product_variant_id}
                                className="text-xs bg-white border border-gray-200 rounded-md px-2 py-0.5 text-gray-700"
                              >
                                {p.variant_name}
                              </span>
                            ))}
                          </div>
                        )}
                      {!isEditing && opt.scope === "any" && (
                        <p className="text-xs text-gray-400 mt-1">
                          Cualquier producto con regalía activa del departamento
                        </p>
                      )}

                      {/* Edit mode */}
                      {isEditing && editDraft && (
                        <div className="flex flex-col gap-3 mt-2">
                          <div className="grid grid-cols-2 gap-3">
                            <Input
                              label="Cantidad"
                              type="number"
                              min={1}
                              step={1}
                              value={editDraft.quantity}
                              onChange={(e) =>
                                setEditDraft((prev) =>
                                  prev
                                    ? {
                                        ...prev,
                                        quantity: parseInt(e.target.value) || 1,
                                      }
                                    : prev,
                                )
                              }
                            />
                            <Select
                              label="Tipo de selección"
                              value={editDraft.scope}
                              onChange={(e) =>
                                setEditDraft((prev) =>
                                  prev
                                    ? {
                                        ...prev,
                                        scope: e.target.value as
                                          | "any"
                                          | "specific",
                                        selectedProductIds:
                                          e.target.value === "any"
                                            ? []
                                            : prev.selectedProductIds,
                                      }
                                    : prev,
                                )
                              }
                              options={[
                                { value: "any", label: "Cualquier producto" },
                                {
                                  value: "specific",
                                  label: "Productos específicos",
                                },
                              ]}
                            />
                          </div>

                          {editDraft.scope === "specific" && (
                            <div>
                              <p className="text-xs font-medium text-gray-600 mb-1">
                                Productos regalables del departamento
                              </p>
                              {loadingGiftable ===
                              opt.tenant_product_group_id ? (
                                <p className="text-xs text-gray-400">
                                  Cargando...
                                </p>
                              ) : giftable.length === 0 ? (
                                <p className="text-xs text-gray-400">
                                  Sin productos regalables en este departamento
                                </p>
                              ) : (
                                <div className="flex flex-wrap gap-1">
                                  {giftable.map((p) => {
                                    const selected =
                                      editDraft.selectedProductIds.includes(
                                        p.product_variant_id,
                                      );
                                    return (
                                      <button
                                        key={p.product_variant_id}
                                        type="button"
                                        onClick={() =>
                                          setEditDraft((prev) =>
                                            prev
                                              ? {
                                                  ...prev,
                                                  selectedProductIds:
                                                    toggleProductId(
                                                      prev.selectedProductIds,
                                                      p.product_variant_id,
                                                    ),
                                                }
                                              : prev,
                                          )
                                        }
                                        className={`text-xs rounded-md px-2 py-1 border transition-colors ${
                                          selected
                                            ? "bg-blue-600 text-white border-blue-600"
                                            : "bg-white text-gray-700 border-gray-200 hover:border-blue-400"
                                        }`}
                                      >
                                        {p.variant_name}
                                      </button>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          )}

                          <div className="flex gap-2">
                            <Button
                              variant="primary"
                              size="sm"
                              loading={isSavingEdit}
                              onClick={() => void handleSaveEdit(opt)}
                            >
                              Guardar
                            </Button>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => {
                                setEditingOptionId(null);
                                setEditDraft(null);
                              }}
                            >
                              Cancelar
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Add option form */}
                {optionDraft ? (
                  <div className="border border-blue-200 rounded-xl p-4 bg-blue-50 flex flex-col gap-3">
                    <p className="text-sm font-semibold text-blue-800">
                      Nueva opción de departamento
                    </p>
                    <Select
                      label="Departamento"
                      value={optionDraft.tenant_product_group_id}
                      onChange={(e) =>
                        void handleDraftGroupChange(e.target.value)
                      }
                      options={groupOptions()}
                      required
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <Input
                        label="Cantidad a regalar"
                        type="number"
                        min={1}
                        step={1}
                        value={optionDraft.quantity}
                        onChange={(e) =>
                          setOptionDraft((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  quantity: parseInt(e.target.value) || 1,
                                }
                              : prev,
                          )
                        }
                      />
                      <Select
                        label="Tipo de selección"
                        value={optionDraft.scope}
                        onChange={(e) =>
                          setOptionDraft((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  scope: e.target.value as "any" | "specific",
                                  selectedProductIds:
                                    e.target.value === "any"
                                      ? []
                                      : prev.selectedProductIds,
                                }
                              : prev,
                          )
                        }
                        options={[
                          { value: "any", label: "Cualquier producto" },
                          { value: "specific", label: "Productos específicos" },
                        ]}
                      />
                    </div>

                    {optionDraft.scope === "specific" &&
                      optionDraft.tenant_product_group_id && (
                        <div>
                          <p className="text-xs font-medium text-gray-700 mb-1">
                            Selecciona productos giftable
                          </p>
                          {loadingGiftable ===
                          optionDraft.tenant_product_group_id ? (
                            <p className="text-xs text-gray-400">Cargando...</p>
                          ) : (
                              giftableCache[
                                optionDraft.tenant_product_group_id
                              ] ?? []
                            ).length === 0 ? (
                            <p className="text-xs text-gray-400">
                              Sin productos giftable en este departamento
                            </p>
                          ) : (
                            <div className="flex flex-wrap gap-1">
                              {(
                                giftableCache[
                                  optionDraft.tenant_product_group_id
                                ] ?? []
                              ).map((p) => {
                                const selected =
                                  optionDraft.selectedProductIds.includes(
                                    p.product_variant_id,
                                  );
                                return (
                                  <button
                                    key={p.product_variant_id}
                                    type="button"
                                    onClick={() =>
                                      setOptionDraft((prev) =>
                                        prev
                                          ? {
                                              ...prev,
                                              selectedProductIds:
                                                toggleProductId(
                                                  prev.selectedProductIds,
                                                  p.product_variant_id,
                                                ),
                                            }
                                          : prev,
                                      )
                                    }
                                    className={`text-xs rounded-md px-2 py-1 border transition-colors ${
                                      selected
                                        ? "bg-blue-600 text-white border-blue-600"
                                        : "bg-white text-gray-700 border-gray-200 hover:border-blue-400"
                                    }`}
                                  >
                                    {p.variant_name}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}

                    <div className="flex gap-2">
                      <Button
                        variant="primary"
                        size="sm"
                        loading={isSavingOption}
                        onClick={() => void handleSaveOption()}
                        disabled={
                          !optionDraft.tenant_product_group_id || isSavingOption
                        }
                      >
                        Agregar opción
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setOptionDraft(null)}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                ) : (
                  productGroups.filter(
                    (g) =>
                      g.is_active &&
                      !usedGroupIds.has(g.tenant_product_group_id),
                  ).length > 0 && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setOptionDraft(emptyDraft())}
                    >
                      + Agregar opción de departamento
                    </Button>
                  )
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
