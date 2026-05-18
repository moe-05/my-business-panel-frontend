import { useCallback } from "react";
import type { DigitalInvoiceInfo } from "@/interfaces/entities/Sale.interface";

export interface PrintInvoiceItem {
  name: string;
  sku?: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface PrintPaymentSplit {
  methodLabel: string;
  amount: number;
  currencySymbol: string;
}

export interface PrintInvoiceData {
  saleId?: string | null;
  symbol: string;
  digitalInvoice: DigitalInvoiceInfo | null;
  items?: PrintInvoiceItem[];
  paymentSplits?: PrintPaymentSplit[];
  pointsRedeemed?: number;
  pointsRate?: number;
}

const fmt = (value: number | null | undefined, symbol: string) =>
  `${symbol} ${Number(value ?? 0).toLocaleString("es-CR", { minimumFractionDigits: 2 })}`;

const fmtDate = (value?: string | null) =>
  value ? new Date(value).toLocaleString("es-CR") : "—";

function buildInvoiceHtml(data: PrintInvoiceData): string {
  const { saleId, symbol, digitalInvoice, items, paymentSplits, pointsRedeemed, pointsRate } = data;

  const customerName = digitalInvoice
    ? `${digitalInvoice.first_name ?? ""} ${digitalInvoice.last_name ?? ""}`.trim()
    : "";

  const rowStyle = `display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid #f0f0f0;font-size:13px;`;
  const labelStyle = `color:#6b7280;`;
  const valueStyle = `color:#111827;font-weight:500;text-align:right;`;

  const row = (label: string, value: string) =>
    `<div style="${rowStyle}"><span style="${labelStyle}">${label}</span><span style="${valueStyle}">${value}</span></div>`;

  const itemsHtml =
    items && items.length > 0
      ? `<table style="width:100%;border-collapse:collapse;font-size:12px;margin-top:4px;">
          <thead>
            <tr style="background:#f9fafb;color:#6b7280;text-transform:uppercase;font-size:10px;">
              <th style="text-align:left;padding:6px 4px;">Producto</th>
              <th style="text-align:left;padding:6px 4px;">SKU</th>
              <th style="text-align:right;padding:6px 4px;">Cant.</th>
              <th style="text-align:right;padding:6px 4px;">P. unit.</th>
              <th style="text-align:right;padding:6px 4px;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${items
              .map(
                (item) =>
                  `<tr style="border-top:1px solid #f0f0f0;">
                    <td style="padding:5px 4px;color:#111827;">${item.name}${item.sku ? `<br/><span style="font-family:monospace;color:#9ca3af;font-size:10px;">${item.sku}</span>` : ""}</td>
                    <td style="padding:5px 4px;font-family:monospace;color:#6b7280;">${item.sku ?? "—"}</td>
                    <td style="padding:5px 4px;text-align:right;color:#374151;">${item.quantity}</td>
                    <td style="padding:5px 4px;text-align:right;color:#374151;">${fmt(item.unit_price, symbol)}</td>
                    <td style="padding:5px 4px;text-align:right;font-weight:600;color:#111827;">${fmt(item.total_price, symbol)}</td>
                  </tr>`,
              )
              .join("")}
          </tbody>
        </table>`
      : "";

  const paymentHtml =
    paymentSplits && paymentSplits.length > 0
      ? `<div style="margin-top:12px;">
          <p style="font-size:10px;text-transform:uppercase;color:#6b7280;letter-spacing:0.05em;margin-bottom:6px;">Métodos de pago</p>
          ${paymentSplits
            .map(
              (s) =>
                `<div style="${rowStyle}"><span style="${labelStyle}">${s.methodLabel}</span><span style="${valueStyle}">${fmt(s.amount, s.currencySymbol)}</span></div>`,
            )
            .join("")}
        </div>`
      : "";

  const pointsHtml =
    pointsRedeemed && pointsRedeemed > 0 && pointsRate && pointsRate > 0
      ? `<div style="${rowStyle}"><span style="${labelStyle}">Puntos canjeados</span><span style="color:#92400e;font-weight:600;text-align:right;">-${pointsRedeemed.toLocaleString("es-CR")} pts ≈ ${fmt(Math.floor(pointsRedeemed / pointsRate), "₡")}</span></div>`
      : "";

  const loyaltyHtml =
    digitalInvoice?.points_accumulated && digitalInvoice.points_accumulated > 0
      ? `<div style="background:#f5f3ff;border:1px solid #ddd6fe;border-radius:8px;padding:10px;margin-top:8px;display:flex;justify-content:space-between;align-items:center;">
          <span style="font-size:13px;font-weight:600;color:#4c1d95;">Puntos de fidelidad otorgados</span>
          <span style="font-size:16px;font-weight:700;color:#7c3aed;">+${digitalInvoice.points_accumulated}</span>
        </div>`
      : "";

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <title>Factura Digital${saleId ? ` — ${saleId}` : ""}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #111827; padding: 24px; max-width: 640px; margin: 0 auto; }
    @media print {
      body { padding: 0; }
      button { display: none !important; }
    }
  </style>
</head>
<body>
  <div style="text-align:center;margin-bottom:20px;">
    ${digitalInvoice?.tenant_name ? `<p style="font-size:18px;font-weight:700;color:#111827;">${digitalInvoice.tenant_name}</p>` : ""}
    <p style="font-size:15px;font-weight:600;color:#111827;margin-top:4px;">Factura Digital</p>
    ${saleId ? `<p style="font-family:monospace;font-size:11px;color:#6b7280;margin-top:2px;">${saleId}</p>` : ""}
  </div>

  <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:14px;margin-bottom:16px;">
    <p style="font-size:10px;text-transform:uppercase;color:#6b7280;letter-spacing:0.05em;margin-bottom:8px;">Datos del cliente</p>
    ${customerName ? row("Cliente", customerName) : ""}
    ${digitalInvoice?.document_number ? row("Documento", digitalInvoice.document_number) : ""}
    ${digitalInvoice?.email ? row("Email", digitalInvoice.email) : ""}
    ${row("Fecha", fmtDate(digitalInvoice?.invoiced_at))}
    ${digitalInvoice?.due_date ? row("Fecha límite pago", new Date(digitalInvoice.due_date).toLocaleDateString("es-CR")) : ""}
  </div>

  ${items && items.length > 0 ? `<div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:14px;margin-bottom:16px;">
    <p style="font-size:10px;text-transform:uppercase;color:#6b7280;letter-spacing:0.05em;margin-bottom:8px;">Productos</p>
    ${itemsHtml}
  </div>` : ""}

  <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:14px;margin-bottom:16px;">
    <p style="font-size:10px;text-transform:uppercase;color:#6b7280;letter-spacing:0.05em;margin-bottom:8px;">Resumen</p>
    ${row("Subtotal", fmt(digitalInvoice?.subtotal_amount, symbol))}
    ${digitalInvoice?.total_discount && digitalInvoice.total_discount > 0 ? row("Descuentos", `-${fmt(digitalInvoice.total_discount, symbol)}`) : ""}
    ${row("Impuestos", fmt(digitalInvoice?.tax_amount, symbol))}
    <div style="display:flex;justify-content:space-between;padding:6px 0;font-size:15px;font-weight:700;border-top:2px solid #e5e7eb;margin-top:4px;">
      <span>Total</span><span>${fmt(digitalInvoice?.total_amount, symbol)}</span>
    </div>
    ${digitalInvoice?.amount_paid && digitalInvoice.amount_paid > 0 ? row("Monto pagado", fmt(digitalInvoice.amount_paid, symbol)) : ""}
    ${digitalInvoice?.change_amount && digitalInvoice.change_amount > 0 ? row("Cambio", fmt(digitalInvoice.change_amount, symbol)) : ""}
    ${pointsHtml}
    ${paymentHtml}
  </div>

  ${loyaltyHtml}

  ${digitalInvoice?.ad_message ? `<div style="border:1px solid #e5e7eb;border-radius:8px;padding:10px;margin-top:12px;font-size:12px;color:#6b7280;font-style:italic;">${digitalInvoice.ad_message}</div>` : ""}

  <div style="text-align:center;margin-top:20px;">
    <button onclick="window.print()" style="background:#4f46e5;color:white;border:none;border-radius:8px;padding:10px 24px;font-size:14px;cursor:pointer;">Imprimir</button>
  </div>
</body>
</html>`;
}

export function usePrintInvoice() {
  const printInvoice = useCallback((data: PrintInvoiceData) => {
    const html = buildInvoiceHtml(data);
    const win = window.open("", "_blank", "width=680,height=860");
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
