import type { ReactNode } from "react";

export interface Column {
  key: string;
  label: string;
  width?: string;
  render?: (value: any, row: any) => ReactNode;
}

export interface TableProps {
  columns: Column[];
  data: any[];
  isLoading?: boolean;
  emptyMessage?: string;
  rowClassName?: string;
  onRowClick?: (row: any) => void;
}
