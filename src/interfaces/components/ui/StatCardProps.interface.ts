import type { ReactNode } from "react";

export interface StatCardProps {
  label: string;
  value: string | number;
  icon: ReactNode;
  sublabel?: string;
  accent?: boolean;
}
