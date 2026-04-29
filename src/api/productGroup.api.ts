import { url } from ".";

import type {
  ProductVariantGroupAssignment,
  TenantProductGroup,
  TenantProductGroupType,
} from "@/interfaces/entities/ProductGroup.interface";

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

export const productGroupTypeApi = {
  async listByTenant(tenantId: string): Promise<TenantProductGroupType[]> {
    const response = await fetch(
      `${url}/tenant-product-group-type/${tenantId}`,
      {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      },
    );
    return safeJson<TenantProductGroupType[]>(
      response,
      "Error al listar dimensiones",
    );
  },

  async create(
    tenantId: string,
    typeName: string,
    description?: string,
  ): Promise<TenantProductGroupType> {
    const response = await fetch(`${url}/tenant-product-group-type`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        tenant_id: tenantId,
        type_name: typeName,
        description: description ?? null,
      }),
    });
    return safeJson<TenantProductGroupType>(
      response,
      "Error al crear dimensión",
    );
  },

  async update(
    tenantId: string,
    id: string,
    payload: { type_name?: string; description?: string; is_active?: boolean },
  ): Promise<TenantProductGroupType> {
    const response = await fetch(
      `${url}/tenant-product-group-type/${tenantId}/${id}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      },
    );
    return safeJson<TenantProductGroupType>(
      response,
      "Error al actualizar dimensión",
    );
  },

  async remove(
    tenantId: string,
    id: string,
  ): Promise<{ deleted: string }> {
    const response = await fetch(
      `${url}/tenant-product-group-type/${tenantId}/${id}`,
      {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      },
    );
    return safeJson<{ deleted: string }>(
      response,
      "Error al eliminar dimensión",
    );
  },
};

export const productGroupApi = {
  async listByTenant(tenantId: string): Promise<TenantProductGroup[]> {
    const response = await fetch(`${url}/tenant-product-group/${tenantId}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });
    return safeJson<TenantProductGroup[]>(response, "Error al listar grupos");
  },

  async tree(
    tenantId: string,
    typeId: string,
  ): Promise<TenantProductGroup[]> {
    const response = await fetch(
      `${url}/tenant-product-group/${tenantId}/tree?typeId=${typeId}`,
      {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      },
    );
    return safeJson<TenantProductGroup[]>(
      response,
      "Error al obtener árbol de grupos",
    );
  },

  async descendants(tenantId: string, groupId: string): Promise<string[]> {
    const response = await fetch(
      `${url}/tenant-product-group/${tenantId}/${groupId}/descendants`,
      {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      },
    );
    return safeJson<string[]>(response, "Error al obtener descendientes");
  },

  async create(payload: {
    tenant_id: string;
    tenant_product_group_type_id: string;
    parent_group_id?: string | null;
    group_name: string;
    is_active?: boolean;
  }): Promise<TenantProductGroup> {
    const response = await fetch(`${url}/tenant-product-group`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    });
    return safeJson<TenantProductGroup>(response, "Error al crear grupo");
  },

  async update(
    tenantId: string,
    id: string,
    payload: {
      group_name?: string;
      parent_group_id?: string | null;
      is_active?: boolean;
    },
  ): Promise<TenantProductGroup> {
    const response = await fetch(
      `${url}/tenant-product-group/${tenantId}/${id}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      },
    );
    return safeJson<TenantProductGroup>(response, "Error al actualizar grupo");
  },

  async remove(
    tenantId: string,
    id: string,
  ): Promise<{ deleted: string }> {
    const response = await fetch(
      `${url}/tenant-product-group/${tenantId}/${id}`,
      {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      },
    );
    return safeJson<{ deleted: string }>(response, "Error al eliminar grupo");
  },
};

export const productVariantGroupApi = {
  async byVariant(
    tenantId: string,
    variantId: string,
  ): Promise<ProductVariantGroupAssignment[]> {
    const response = await fetch(
      `${url}/product-variant-group/${tenantId}/variant/${variantId}`,
      {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      },
    );
    return safeJson<ProductVariantGroupAssignment[]>(
      response,
      "Error al listar grupos de la variante",
    );
  },

  async replace(
    tenantId: string,
    variantId: string,
    groupIds: string[],
  ): Promise<{ message: string; count: number }> {
    const response = await fetch(`${url}/product-variant-group`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        tenant_id: tenantId,
        product_variant_id: variantId,
        group_ids: groupIds,
      }),
    });
    return safeJson<{ message: string; count: number }>(
      response,
      "Error al asignar grupos",
    );
  },
};
