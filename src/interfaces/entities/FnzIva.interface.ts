export type IvaComponent =
  | "debito"
  | "notas_debito"
  | "notas_credito"
  | "credito"
  | "cxp"
  | "gastos"
  | "retenciones";

/** Un componente del IVA en USD y VES, con la tasa de la fecha de cada documento (FNZ-X-02). */
export interface IvaComponentRow {
  component: IvaComponent;
  total_usd: number;
  total_ves: number;
}

/** Respuesta cruda del backend: componentes sin totalizar. */
export interface IvaSummaryRaw {
  components: IvaComponentRow[];
}

/** Resumen ya convertido a una sola moneda (ver helpers/fnzIva.ts). */
export interface IvaSummary {
  iva_debito: number;
  iva_credito: number;
  iva_cxp: number;
  iva_recuperable: number;
  iva_notas_credito: number;
  iva_notas_debito: number;
  /** IVA de gastos registrados (credito fiscal). */
  iva_gastos: number;
  /**
   * IVA retenido a proveedores en el periodo (FNZ-IV-06). Se entera al
   * SENIAT aparte: no entra al neto de la declaracion propia.
   */
  iva_retenido: number;
  iva_debito_ajustado: number;
  /** Positivo = deuda con el SENIAT. Negativo = saldo a favor. */
  iva_neto: number;
}

// ─── Retenciones de IVA (FNZ-IV-06) ─────────────────────────────────────────

export interface WithholdingSupplierConfig {
  supplier_id: string;
  supplier_name: string;
  /** Porcentaje del IVA que se retiene al proveedor (0 = no se retiene). */
  iva_retention_percentage: number;
}

export interface WithholdingConfig {
  is_agent: boolean;
  suppliers: WithholdingSupplierConfig[];
}

/** Factura de proveedor con retencion pendiente de emitir (montos en USD). */
export interface WithholdingCandidate {
  supplier_invoice_id: string;
  invoice_number: string;
  invoice_date: string;
  supplier_id: string;
  supplier_name: string;
  taxable_base: number;
  iva_amount: number;
  retention_percentage: number;
  retained_amount: number;
}

export interface Withholding {
  withholding_id: string;
  voucher_number: number;
  issued_at: string;
  supplier_id: string;
  supplier_name: string;
  invoice_number: string;
  taxable_base: number;
  iva_amount: number;
  retention_percentage: number;
  retained_amount_usd: number;
  retained_amount_ves: number | null;
  is_voided: boolean;
}
