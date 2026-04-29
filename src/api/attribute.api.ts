import { url } from ".";

import type {
  AttributeValue,
  GlobalAttribute,
  TenantAttribute,
  UnifiedAttribute,
} from "@/interfaces/entities/Attribute.interface";

interface UnifiedSearchResponse {
  attributes: UnifiedAttribute[];
  total: number;
  page: number;
  limit: number;
}

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

export const globalAttributeApi = {
  async list(): Promise<GlobalAttribute[]> {
    const response = await fetch(`${url}/global-attribute`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });
    return safeJson<GlobalAttribute[]>(response, "Error al listar atributos globales");
  },
};

export const tenantAttributeApi = {
  async listByTenant(tenantId: string): Promise<TenantAttribute[]> {
    const response = await fetch(`${url}/tenant-attribute/${tenantId}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });
    return safeJson<TenantAttribute[]>(response, "Error al listar atributos del tenant");
  },

  /**
   * Unified paginated search across global (not yet linked) + tenant
   * attributes. Backed by GET /tenant-attribute/:tenantId/search.
   */
  async searchUnified(
    tenantId: string,
    query: string,
    page = 1,
    limit = 100,
  ): Promise<UnifiedSearchResponse> {
    const response = await fetch(
      `${url}/tenant-attribute/${tenantId}/search?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`,
      {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      },
    );
    return safeJson<UnifiedSearchResponse>(response, "Error al buscar atributos");
  },

  async createCustom(
    tenantId: string,
    attributeName: string,
  ): Promise<TenantAttribute> {
    const response = await fetch(`${url}/tenant-attribute`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ tenant_id: tenantId, attribute_name: attributeName }),
    });
    return safeJson<TenantAttribute>(response, "Error al crear atributo");
  },

  async createFromGlobal(
    tenantId: string,
    globalAttributeId: string,
  ): Promise<TenantAttribute> {
    const response = await fetch(`${url}/tenant-attribute`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        tenant_id: tenantId,
        global_attribute_id: globalAttributeId,
      }),
    });
    return safeJson<TenantAttribute>(response, "Error al crear atributo");
  },

  async update(
    tenantId: string,
    id: string,
    attributeName: string,
  ): Promise<TenantAttribute> {
    const response = await fetch(
      `${url}/tenant-attribute/${tenantId}/${id}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ attribute_name: attributeName }),
      },
    );
    return safeJson<TenantAttribute>(response, "Error al actualizar atributo");
  },

  async remove(tenantId: string, id: string): Promise<{ deleted: string }> {
    const response = await fetch(
      `${url}/tenant-attribute/${tenantId}/${id}`,
      {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      },
    );
    return safeJson<{ deleted: string }>(response, "Error al eliminar atributo");
  },
};

export const attributeValueApi = {
  async listByAttribute(
    tenantId: string,
    tenantAttributeId: string,
  ): Promise<AttributeValue[]> {
    const response = await fetch(
      `${url}/attribute-value/${tenantId}/by-attribute/${tenantAttributeId}`,
      {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      },
    );
    return safeJson<AttributeValue[]>(response, "Error al listar valores");
  },

  async create(
    tenantId: string,
    tenantAttributeId: string,
    value: string,
  ): Promise<AttributeValue> {
    const response = await fetch(`${url}/attribute-value`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        tenant_id: tenantId,
        tenant_attribute_id: tenantAttributeId,
        value,
      }),
    });
    return safeJson<AttributeValue>(response, "Error al crear valor");
  },

  async update(
    tenantId: string,
    id: string,
    value: string,
  ): Promise<AttributeValue> {
    const response = await fetch(`${url}/attribute-value/${tenantId}/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ value }),
    });
    return safeJson<AttributeValue>(response, "Error al actualizar valor");
  },

  async remove(
    tenantId: string,
    id: string,
  ): Promise<{ deleted: string }> {
    const response = await fetch(`${url}/attribute-value/${tenantId}/${id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });
    return safeJson<{ deleted: string }>(response, "Error al eliminar valor");
  },
};
