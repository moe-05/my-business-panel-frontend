export type ToastMode = "info" | "success" | "warning" | "error";

export interface ToastProps {
  mode: ToastMode;
  message: string;
  onClose?: () => void;
}
