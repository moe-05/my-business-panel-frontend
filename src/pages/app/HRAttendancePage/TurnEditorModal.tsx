import { useEffect, useState } from "react";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";

import type { HrTurn } from "@/interfaces/entities/Hr.interface";

interface TurnEditorModalProps {
  isOpen: boolean;
  turn: HrTurn | null;
  branchName?: string;
  onClose: () => void;
  onSubmit: (payload: { entry: string; out: string }) => Promise<void>;
}

export function TurnEditorModal({
  isOpen,
  turn,
  branchName,
  onClose,
  onSubmit,
}: TurnEditorModalProps) {
  const [entry, setEntry] = useState("");
  const [out, setOut] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setEntry("");
      setOut("");
      setError("");
      setIsSubmitting(false);
      return;
    }

    setEntry(turn?.entry?.slice(0, 5) ?? "");
    setOut(turn?.out?.slice(0, 5) ?? "");
  }, [isOpen, turn]);

  const handleSubmit = async () => {
    setError("");

    if (!entry || !out) {
      setError("Debe completar hora de entrada y salida");
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit({ entry, out });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={turn ? "Editar turno" : "Nuevo turno"}
      size="sm"
    >
      <div className="space-y-4">
        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
          {branchName ? `Sucursal: ${branchName}` : "Seleccione una sucursal"}
        </div>

        <Input
          label="Hora de entrada"
          type="time"
          value={entry}
          onChange={(event) => setEntry(event.target.value)}
          required
        />
        <Input
          label="Hora de salida"
          type="time"
          value={out}
          onChange={(event) => setOut(event.target.value)}
          required
        />

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-3 border-t border-gray-200 pt-6">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button type="button" onClick={handleSubmit} loading={isSubmitting}>
            {turn ? "Guardar turno" : "Crear turno"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
