import { useEffect, useRef } from "react";

const SCANNER_MAX_CHAR_INTERVAL_MS = 50;
const MIN_BARCODE_LENGTH = 3;

export function useBarcodeScanner(
  onScan: (sku: string) => void,
  enabled = true,
) {
  const bufferRef = useRef("");
  const lastKeyTimeRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onScanRef = useRef(onScan);

  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  useEffect(() => {
    if (!enabled) return;

    const clearBuffer = () => {
      bufferRef.current = "";
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const tag = target.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      const now = Date.now();

      if (e.key === "Enter") {
        const sku = bufferRef.current.trim();
        if (sku.length >= MIN_BARCODE_LENGTH) {
          onScanRef.current(sku);
        }
        clearBuffer();
        return;
      }

      if (e.key.length !== 1) {
        clearBuffer();
        return;
      }

      // Gap too large — not a scanner, reset
      if (
        bufferRef.current.length > 0 &&
        now - lastKeyTimeRef.current > SCANNER_MAX_CHAR_INTERVAL_MS
      ) {
        clearBuffer();
      }

      lastKeyTimeRef.current = now;
      bufferRef.current += e.key;

      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(clearBuffer, SCANNER_MAX_CHAR_INTERVAL_MS + 20);
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [enabled]);
}
