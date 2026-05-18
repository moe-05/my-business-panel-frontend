import { useCallback } from "react";
import type { DigitalInvoiceInfo } from "@/interfaces/entities/Sale.interface";

export interface PrintInvoiceData {
  saleId?: string | null;
  digitalInvoice: DigitalInvoiceInfo | null;
  pointsRedeemed?: number;
  pointsRate?: number;
}

const fmt = (value: number | null | undefined, symbol: string) =>
  `${symbol} ${Number(value ?? 0).toLocaleString("es-CR", {
    minimumFractionDigits: 2,
  })}`;

const fmtDate = (value?: string | null) =>
  value ? new Date(value).toLocaleString("es-CR") : "—";

const fmtDateOnly = (value?: string | null) =>
  value ? new Date(value).toLocaleDateString("es-CR") : "—";

const esc = (value: string | number | null | undefined): string => {
  if (value === null || value === undefined) return "";
  const str = String(value);
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
};

function buildInvoiceHtml(data: PrintInvoiceData): string {
  const { saleId, digitalInvoice, pointsRedeemed, pointsRate } = data;
  const inv = digitalInvoice;
  const symbol = inv?.currency_symbol ?? "₡";

  const customerName = inv
    ? `${inv.first_name ?? ""} ${inv.last_name ?? ""}`.trim()
    : "";

  const rowStyle = `display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid #f0f0f0;font-size:13px;`;
  const labelStyle = `color:#6b7280;`;
  const valueStyle = `color:#111827;font-weight:500;text-align:right;`;

  const row = (label: string, value: string) =>
    `<div style="${rowStyle}"><span style="${labelStyle}">${esc(label)}</span><span style="${valueStyle}">${value}</span></div>`;

  const sectionTitle = (title: string) =>
    `<p style="font-size:10px;text-transform:uppercase;color:#6b7280;letter-spacing:0.05em;margin-bottom:8px;">${esc(title)}</p>`;

  const card = (innerHtml: string) =>
    `<div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:14px;margin-bottom:16px;">${innerHtml}</div>`;

  const tenantIdLabel =
    inv?.tenant_identification_type_code ||
    inv?.tenant_identification_type_name ||
    "Identificación";
  const customerIdLabel =
    inv?.customer_identification_type_code ||
    inv?.customer_identification_type_name ||
    "Documento";

  const tenantHeader = inv
    ? card(
        `${sectionTitle("Emisor")}` +
          (inv.tenant_name
            ? `<p style="font-size:16px;font-weight:700;color:#111827;margin-bottom:4px;">${esc(inv.tenant_name)}</p>`
            : "") +
          (inv.branch_name
            ? `<p style="font-size:13px;color:#374151;margin-bottom:6px;">${esc(inv.branch_name)}${inv.branch_address ? ` &mdash; ${esc(inv.branch_address)}` : ""}</p>`
            : "") +
          (inv.tenant_identification
            ? row(esc(tenantIdLabel), esc(inv.tenant_identification))
            : "") +
          (inv.tenant_econ_activity
            ? row("Actividad económica", esc(inv.tenant_econ_activity))
            : "") +
          (inv.tenant_contact_email
            ? row("Email", esc(inv.tenant_contact_email))
            : "") +
          (inv.tenant_contact_phone
            ? row("Teléfono", esc(inv.tenant_contact_phone))
            : "") +
          (inv.tenant_sign
            ? `<p style="font-size:12px;color:#4b5563;font-style:italic;margin-top:8px;">${esc(inv.tenant_sign)}</p>`
            : ""),
      )
    : "";

  const hasCustomer = !!(
    inv &&
    (customerName ||
      inv.document_number ||
      inv.customer_econ_activity ||
      inv.email ||
      inv.customer_phone ||
      inv.customer_address ||
      inv.customer_birthdate)
  );

  const customerBlock =
    inv && hasCustomer
      ? card(
          `${sectionTitle("Cliente")}` +
            (customerName ? row("Nombre", esc(customerName)) : "") +
            (inv.document_number
              ? row(esc(customerIdLabel), esc(inv.document_number))
              : "") +
            (inv.customer_econ_activity
              ? row("Actividad económica", esc(inv.customer_econ_activity))
              : "") +
            (inv.email ? row("Email", esc(inv.email)) : "") +
            (inv.customer_phone
              ? row("Teléfono", esc(inv.customer_phone))
              : "") +
            (inv.customer_address
              ? row("Dirección", esc(inv.customer_address))
              : "") +
            (inv.customer_birthdate
              ? row(
                  "Fecha de nacimiento",
                  fmtDateOnly(inv.customer_birthdate),
                )
              : ""),
        )
      : "";

  const saleBlock = inv
    ? card(
        `${sectionTitle("Datos de la venta")}` +
          row(
            "Condición de venta",
            esc(inv.sale_condition_desc ?? inv.sale_condition ?? "—"),
          ) +
          row("Fecha de venta", fmtDate(inv.sale_date)) +
          row("Fecha de factura", fmtDate(inv.invoiced_at)) +
          (inv.due_date
            ? row("Fecha límite pago", fmtDateOnly(inv.due_date))
            : "") +
          row(
            "Moneda",
            esc(
              inv.currency_code
                ? `${inv.currency_code} (${inv.currency_symbol ?? ""})`
                : "—",
            ),
          ) +
          row(
            "Factura electrónica",
            inv.has_electronic_invoice ? "Sí" : "No",
          ) +
          (inv.seller_email
            ? row("Vendedor", esc(inv.seller_email))
            : "") +
          (saleId
            ? `<div style="${rowStyle}"><span style="${labelStyle}">ID de venta</span><span style="font-family:monospace;font-size:11px;color:#374151;text-align:right;">${esc(saleId)}</span></div>`
            : ""),
      )
    : "";

  const items = inv?.items ?? [];
  const itemsBlock =
    items.length > 0
      ? card(
          `${sectionTitle("Productos")}` +
            `<table style="width:100%;border-collapse:collapse;font-size:12px;margin-top:4px;">
            <thead>
              <tr style="background:#f3f4f6;color:#6b7280;text-transform:uppercase;font-size:10px;">
                <th style="text-align:left;padding:6px 4px;">Descripción</th>
                <th style="text-align:left;padding:6px 4px;">SKU</th>
                <th style="text-align:left;padding:6px 4px;">CABYS</th>
                <th style="text-align:right;padding:6px 4px;">Cant.</th>
                <th style="text-align:right;padding:6px 4px;">P. unit.</th>
                <th style="text-align:right;padding:6px 4px;">Subtotal</th>
                <th style="text-align:right;padding:6px 4px;">IVA %</th>
                <th style="text-align:right;padding:6px 4px;">IVA</th>
                <th style="text-align:right;padding:6px 4px;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${items
                .map((it) => {
                  const label = it.description || it.variant_name || "—";
                  return `<tr style="border-top:1px solid #f0f0f0;">
                    <td style="padding:5px 4px;color:#111827;">${esc(label)}</td>
                    <td style="padding:5px 4px;font-family:monospace;color:#6b7280;font-size:11px;">${esc(it.sku ?? "—")}</td>
                    <td style="padding:5px 4px;font-family:monospace;color:#6b7280;font-size:11px;">${esc(it.cabys_code ?? "—")}</td>
                    <td style="padding:5px 4px;text-align:right;color:#374151;">${esc(it.quantity)}</td>
                    <td style="padding:5px 4px;text-align:right;color:#374151;">${fmt(it.unit_price, symbol)}</td>
                    <td style="padding:5px 4px;text-align:right;color:#374151;">${fmt(it.subtotal, symbol)}</td>
                    <td style="padding:5px 4px;text-align:right;color:#6b7280;">${esc(Number(it.tax_rate_percentage ?? 0))}%</td>
                    <td style="padding:5px 4px;text-align:right;color:#374151;">${fmt(it.tax_amount, symbol)}</td>
                    <td style="padding:5px 4px;text-align:right;font-weight:600;color:#111827;">${fmt(it.total_price, symbol)}</td>
                  </tr>`;
                })
                .join("")}
            </tbody>
          </table>`,
        )
      : "";

  const payments = inv?.payments ?? [];
  const paymentsBlock =
    payments.length > 0
      ? card(
          `${sectionTitle("Métodos de pago")}` +
            payments
              .map((p) => {
                const sym = p.currency_symbol ?? symbol;
                const label = p.is_points_redemption
                  ? `${p.payment_method_name ?? "Puntos"} (puntos canjeados: ${p.points_redeemed})`
                  : (p.payment_method_name ?? "Método");
                return `<div style="${rowStyle}"><span style="${labelStyle}">${esc(label)}</span><span style="${valueStyle}">${fmt(p.payment_amount, sym)}</span></div>`;
              })
              .join(""),
        )
      : "";

  const pointsHtml =
    pointsRedeemed && pointsRedeemed > 0 && pointsRate && pointsRate > 0
      ? `<div style="${rowStyle}"><span style="${labelStyle}">Puntos canjeados</span><span style="color:#92400e;font-weight:600;text-align:right;">-${pointsRedeemed.toLocaleString("es-CR")} pts &asymp; ${fmt(Math.floor(pointsRedeemed / pointsRate), "₡")}</span></div>`
      : "";

  const loyaltyHtml =
    inv?.points_accumulated && inv.points_accumulated > 0
      ? `<div style="background:#f5f3ff;border:1px solid #ddd6fe;border-radius:8px;padding:10px;margin-top:8px;display:flex;justify-content:space-between;align-items:center;">
          <span style="font-size:13px;font-weight:600;color:#4c1d95;">Puntos de fidelidad otorgados</span>
          <span style="font-size:16px;font-weight:700;color:#7c3aed;">+${esc(inv.points_accumulated)}</span>
        </div>`
      : "";

  const totalsBlock = inv
    ? card(
        `${sectionTitle("Resumen")}` +
          row("Subtotal", fmt(inv.subtotal_amount, symbol)) +
          (inv.total_discount && inv.total_discount > 0
            ? row("Descuentos", `-${fmt(inv.total_discount, symbol)}`)
            : "") +
          row("Impuestos", fmt(inv.tax_amount, symbol)) +
          `<div style="display:flex;justify-content:space-between;padding:6px 0;font-size:15px;font-weight:700;border-top:2px solid #e5e7eb;margin-top:4px;">
            <span>Total</span><span>${fmt(inv.total_amount, symbol)}</span>
          </div>` +
          (inv.amount_paid && inv.amount_paid > 0
            ? row("Monto pagado", fmt(inv.amount_paid, symbol))
            : "") +
          (inv.change_amount && inv.change_amount > 0
            ? row("Cambio", fmt(inv.change_amount, symbol))
            : "") +
          pointsHtml,
      )
    : "";

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <title>Factura Digital${saleId ? ` &mdash; ${esc(saleId)}` : ""}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #111827; padding: 24px; max-width: 720px; margin: 0 auto; }
    @media print {
      body { padding: 0; }
      button { display: none !important; }
    }
  </style>
</head>
<body>
  <div style="text-align:center;margin-bottom:16px;">
    <p style="font-size:16px;font-weight:700;color:#111827;">Factura Digital</p>
    ${saleId ? `<p style="font-family:monospace;font-size:11px;color:#6b7280;margin-top:2px;">${esc(saleId)}</p>` : ""}
  </div>

  ${tenantHeader}
  ${customerBlock}
  ${saleBlock}
  ${itemsBlock}
  ${paymentsBlock}
  ${totalsBlock}
  ${loyaltyHtml}
  ${inv?.ad_message ? `<div style="border:1px solid #e5e7eb;border-radius:8px;padding:10px;margin-top:12px;font-size:12px;color:#6b7280;font-style:italic;">${esc(inv.ad_message)}</div>` : ""}

  <div style="text-align:center;margin-top:20px;">
    <button onclick="window.print()" style="background:#4f46e5;color:white;border:none;border-radius:8px;padding:10px 24px;font-size:14px;cursor:pointer;">Imprimir</button>
  </div>
</body>
</html>`;
}

export function usePrintInvoice() {
  const printInvoice = useCallback((data: PrintInvoiceData) => {
    const html = buildInvoiceHtml(data);
    const win = window.open("", "_blank", "width=720,height=900");
    if (!win) return;
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => {
      win.print();
    }, 300);
  }, []);

  return { printInvoice };
}
