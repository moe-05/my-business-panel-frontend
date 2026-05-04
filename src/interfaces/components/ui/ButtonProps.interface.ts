import type { ButtonHTMLAttributes, ReactNode } from "react";

export type Variant =
  | "primary"
  | "secondary"
  | "ghost"
  | "danger"
  | "dangerOutline"
  | "warning";
export type Size = "xs" | "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
  children: ReactNode;
}
