import { useEffect, useRef, type ReactNode } from "react";
import { Button } from "./Button";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "max-w-xl",
  md: "max-w-3xl",
  lg: "max-w-5xl",
};

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = "md",
}: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      dialog.showModal();
      document.body.style.overflow = "hidden";
    } else {
      dialog.close();
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    if (e.target === dialogRef.current) {
      onClose();
    }
  };

  return (
    <dialog
      ref={dialogRef}
      onClick={handleBackdropClick}
      className={`fixed inset-0 m-auto w-[92vw] ${sizeClasses[size]} max-h-[90vh] overflow-hidden rounded-2xl border border-gray-200 bg-white p-0 shadow-2xl backdrop:bg-black/40`}
    >
      <div className="w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">{title}</h2>
          {/* <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 cursor-pointer transition-colors p-1 hover:bg-gray-100 rounded-lg"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button> */}
          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
            className="rounded-full p-1 text-gray-400 hover:bg-red-600! hover:text-white! active:bg-red-700!"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </Button>
        </div>

        {/* Content */}
        <div className="max-h-[calc(90vh-89px)] overflow-y-auto p-6">
          {children}
        </div>
      </div>
    </dialog>
  );
}
