import type {
  ToastMode,
  ToastProps,
} from "@/interfaces/components/ui/ToastProps.interface";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type JSX,
} from "react";

const EXIT_ANIMATION_MS = 280;

const TOAST_CONFIG: Record<
  ToastMode,
  {
    label: string;
    durationMs: number;
    containerClassName: string;
    icon: JSX.Element;
  }
> = {
  info: {
    label: "Informacion",
    durationMs: 9000,
    containerClassName:
      "border-blue-200 bg-blue-50 text-blue-900 shadow-blue-200/50",
    icon: (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
    ),
  },
  success: {
    label: "Exito",
    durationMs: 5000,
    containerClassName:
      "border-green-200 bg-green-50 text-green-900 shadow-green-200/50",
    icon: (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <polyline points="20 6 9 17 4 12" />
      </svg>
    ),
  },
  warning: {
    label: "Aviso",
    durationMs: 7000,
    containerClassName:
      "border-yellow-300 bg-yellow-50 text-yellow-900 shadow-yellow-200/50",
    icon: (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
  },
  error: {
    label: "Error",
    durationMs: 9000,
    containerClassName:
      "border-red-200 bg-red-50 text-red-900 shadow-red-200/50",
    icon: (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="15" y1="9" x2="9" y2="15" />
        <line x1="9" y1="9" x2="15" y2="15" />
      </svg>
    ),
  },
};

export function Toast({ mode, message, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isActive, setIsActive] = useState(false);
  const exitTimerRef = useRef<number | null>(null);
  const config = useMemo(() => TOAST_CONFIG[mode], [mode]);

  const clearExitTimer = () => {
    if (exitTimerRef.current) {
      window.clearTimeout(exitTimerRef.current);
      exitTimerRef.current = null;
    }
  };

  const startClose = useCallback(() => {
    setIsActive(false);
    clearExitTimer();
    exitTimerRef.current = window.setTimeout(() => {
      setIsVisible(false);
      onClose?.();
    }, EXIT_ANIMATION_MS);
  }, [onClose]);

  useEffect(() => {
    setIsVisible(true);
    setIsActive(false);

    const frame = window.requestAnimationFrame(() => {
      setIsActive(true);
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [mode, message]);

  useEffect(() => {
    if (!isVisible) return;

    const timer = window.setTimeout(() => {
      startClose();
    }, config.durationMs);

    return () => window.clearTimeout(timer);
  }, [config.durationMs, isVisible, startClose]);

  useEffect(() => {
    return () => {
      clearExitTimer();
    };
  }, []);

  const handleDismiss = () => {
    startClose();
  };

  if (!isVisible) return null;

  return (
    <div
      role="alert"
      className="fixed left-1/2 top-4 z-100 w-[calc(100%-1.5rem)] max-w-md -translate-x-1/2 md:left-auto md:right-6 md:top-auto md:bottom-6 md:w-full md:translate-x-0"
    >
      <div
        className={[
          "flex items-start gap-3 rounded-xl border px-4 py-3 shadow-lg backdrop-blur-sm",
          "transform-gpu transition-all duration-300 ease-out",
          isActive ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0",
          config.containerClassName,
        ].join(" ")}
      >
        <span className="mt-0.5 shrink-0">{config.icon}</span>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold leading-5">{config.label}</p>
          <p className="mt-0.5 wrap-break-word text-sm leading-5">{message}</p>
        </div>

        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Cerrar notificacion"
          className="rounded-md p-1 opacity-70 transition hover:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
    </div>
  );
}
