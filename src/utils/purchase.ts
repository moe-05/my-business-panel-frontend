import type { NumericLike } from "@/interfaces/entities/Purchase.interface";

type BadgeTone =
  | "green"
  | "yellow"
  | "red"
  | "blue"
  | "secondary"
  | "accent";

const currencyFormatter = new Intl.NumberFormat("es-CR", {
  style: "currency",
  currency: "CRC",
  maximumFractionDigits: 2,
});

export const formatCurrency = (value?: NumericLike | null) =>
  currencyFormatter.format(Number(value ?? 0));

export const formatDate = (value?: string | null) =>
  value ? new Date(value).toLocaleDateString("es-CR") : "—";

export const formatDateTime = (value?: string | null) =>
  value
    ? new Date(value).toLocaleString("es-CR", {
        dateStyle: "short",
        timeStyle: "short",
      })
    : "—";

export const formatPaymentMethodName = (value?: string | null) =>
  value
    ? value
        .split("_")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ")
    : "—";

export const getOrderStatusTone = (status?: string | null): BadgeTone => {
  switch ((status ?? "").toLowerCase()) {
    case "pending":
      return "yellow";
    case "shipped":
      return "blue";
    case "delivered":
      return "green";
    case "cancelled":
      return "red";
    default:
      return "secondary";
  }
};

export const getPayableStatusTone = (status?: string | null): BadgeTone => {
  switch ((status ?? "").toLowerCase()) {
    case "pending":
      return "yellow";
    case "partial paid":
      return "blue";
    case "paid":
      return "green";
    case "overdue":
      return "red";
    default:
      return "secondary";
  }
};

export const getAlertTone = (alertType?: string | null): BadgeTone => {
  switch ((alertType ?? "").toLowerCase()) {
    case "overdue payment":
      return "red";
    case "urgent payment":
      return "yellow";
    case "upcoming due date":
      return "blue";
    default:
      return "secondary";
  }
};

export const getNextOrderStatuses = (statusId: number) => {
  switch (statusId) {
    case 1:
      return [2, 4];
    case 2:
      return [3, 4];
    default:
      return [];
  }
};

export const getStatusLabelById = (statusId: number) => {
  switch (statusId) {
    case 2:
      return "Marcar como enviada";
    case 3:
      return "Marcar como entregada";
    case 4:
      return "Cancelar orden";
    default:
      return "Actualizar estado";
  }
};
