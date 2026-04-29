export interface PaymentMethodOption {
  value: number;
  label: string;
  code:
    | "cash"
    | "debit_card"
    | "credit_card"
    | "loyalty_points"
    | "credit";
}

export const paymentMethods: PaymentMethodOption[] = [
  { value: 1, label: "Efectivo", code: "cash" },
  { value: 2, label: "Tarjeta de débito", code: "debit_card" },
  { value: 3, label: "Tarjeta de crédito", code: "credit_card" },
  { value: 4, label: "Puntos de fidelidad", code: "loyalty_points" },
  { value: 5, label: "Crédito", code: "credit" },
];

export const refundStatuses = [
  { value: 1, label: "Pendiente" },
  { value: 2, label: "Rechazado" },
  { value: 3, label: "Procesado" },
];

export const currencies = [
  { value: 1, label: "Colón Costarricense (CRC)", code: "CRC", symbol: "₡" },
  { value: 2, label: "Dólar Estadounidense (USD)", code: "USD", symbol: "$" },
];
