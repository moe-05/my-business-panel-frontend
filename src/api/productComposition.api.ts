import { url } from ".";

import type {
  CompositionAvailability,
  CompositionComponent,
  CompositionParent,
} from "@/interfaces/entities/ProductComposition.interface";

async function safeJson<T>(response: Response, fallback: string): Promise<T> {
  const json = await response.json();
  if (!response.ok) {
    const msg = Array.isArray(json.message)
      ? json.message[0]
      : (json.message ?? `Error ${response.status}`);
    throw new Error(msg || fallback);
  }
  return (json.data ?? json) as T;
}

export interface ReplaceCompositionPayload {
  tenant_id: string;
  parent_product_variant_id: string;
  components: Array<{
    child_product_variant_id: string;
    quantity: number;
  }>;
}

export const productCompositionApi = {
  async byParent(
    tenantId: string,
    parentId: string,
  ): Promise<CompositionComponent[]> {
    const response = await fetch(
      `${url}/product-composition/${tenantId}/parent/${parentId}`,
      {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      },
    );
    return safeJson<CompositionComponent[]>(
      response,
      "Error al listar componentes",
    );
  },

  async byChild(
    tenantId: string,
    childId: string,
  ): Promise<CompositionParent[]> {
    const response = await fetch(
      `${url}/product-composition/${tenantId}/child/${childId}`,
      {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      },
    );
    return safeJson<CompositionParent[]>(
      response,
      "Error al listar padres composicionales",
    );
  },

  async availability(
    tenantId: string,
    parentId: string,
    warehouseId: string,
  ): Promise<CompositionAvailability> {
    const response = await fetch(
      `${url}/product-composition/${tenantId}/availability/${parentId}/${warehouseId}`,
      {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      },
    );
    return safeJson<CompositionAvailability>(
      response,
      "Error al consultar disponibilidad",
    );
  },

  async replace(
    payload: ReplaceCompositionPayload,
  ): Promise<{ message: string; count: number }> {
    const response = await fetch(`${url}/product-composition`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    });
    return safeJson<{ message: string; count: number }>(
      response,
      "Error al guardar composición",
    );
  },

  async updateQuantity(
    tenantId: string,
    parentId: string,
    childId: string,
    quantity: number,
  ): Promise<CompositionComponent> {
    const response = await fetch(
      `${url}/product-composition/${tenantId}/parent/${parentId}/component/${childId}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ quantity }),
      },
    );
    return safeJson<CompositionComponent>(
      response,
      "Error al actualizar cantidad",
    );
  },

  async clear(
    tenantId: string,
    parentId: string,
  ): Promise<{ message: string }> {
    const response = await fetch(
      `${url}/product-composition/${tenantId}/parent/${parentId}`,
      {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      },
    );
    return safeJson<{ message: string }>(
      response,
      "Error al limpiar composición",
    );
  },
};
