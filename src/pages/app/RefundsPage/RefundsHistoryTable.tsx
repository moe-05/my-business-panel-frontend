import { Badge } from "@/components/ui/Badge";
import { Table } from "@/components/ui/Table";

import { paymentMethods, refundStatuses } from "@/constants/payment-methods";

import type { Column } from "@/interfaces/components/ui/TableProps.interface";
import type { ReturnTransaction } from "@/interfaces/entities/ReturnTransaction.interface";

import { formatCurrency, formatDate } from "./refunds.utils";

interface RefundsHistoryTableProps {
  returns: ReturnTransaction[];
}

export function RefundsHistoryTable({ returns }: RefundsHistoryTableProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-300 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-3">
        Reembolsos recientes
      </h2>
      <Table
        columns={columns}
        data={returns}
        emptyMessage="No hay reembolsos registrados"
      />
    </div>
  );
}

const statusVariant = (statusId: number): "green" | "red" | "yellow" =>
  statusId === 3 ? "green" : statusId === 2 ? "red" : "yellow";

const columns: Column[] = [
  {
    key: "return_date",
    label: "Fecha",
    width: "18%",
    render: (v: string) => formatDate(v),
  },
  {
    key: "return_transaction_id",
    label: "ID transacción",
    width: "22%",
    render: (v: string) => (
      <span className="font-mono text-xs text-gray-600 break-all">{v}</span>
    ),
  },
  {
    key: "digital_sale_invoice_id",
    label: "Factura",
    width: "22%",
    render: (_: unknown, row: ReturnTransaction) => {
      const id = row.digital_sale_invoice_id ?? row.electronic_sale_invoice_id;
      const isElectronic = Boolean(row.electronic_sale_invoice_id);
      return (
        <div className="flex flex-col">
          <Badge variant={isElectronic ? "blue" : "gray"}>
            {isElectronic ? "EI" : "DI"}
          </Badge>
          <span className="font-mono text-xs text-gray-600 break-all mt-1">
            {id ?? "—"}
          </span>
        </div>
      );
    },
  },
  {
    key: "total_refund_amount",
    label: "Monto",
    width: "12%",
    render: (v: number) => (
      <span className="font-semibold">{formatCurrency(Number(v))}</span>
    ),
  },
  {
    key: "refund_method",
    label: "Método",
    width: "13%",
    render: (v: number) =>
      paymentMethods.find((m) => m.value === v)?.label ?? `#${v ?? "—"}`,
  },
  {
    key: "return_status_id",
    label: "Estado",
    width: "13%",
    render: (v: number) => {
      const status = refundStatuses.find((s) => s.value === v);
      return (
        <Badge variant={statusVariant(v)}>
          {status?.label ?? `#${v ?? "—"}`}
        </Badge>
      );
    },
  },
];
