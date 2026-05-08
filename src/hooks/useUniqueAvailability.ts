import { useEffect, useRef, useState } from "react";

import { useDebounce } from "./useDebounce";

export type UniqueAvailabilityStatus =
  | "idle"
  | "checking"
  | "available"
  | "taken"
  | "error";

export interface UseUniqueAvailabilityOptions {
  /** Debounce window applied to `value` before firing the check. */
  delay?: number;
  /** Skip checking entirely (e.g. while editing a record where the field is locked). */
  skip?: boolean;
  /** Minimum length the trimmed value must reach before a check is dispatched. */
  minLength?: number;
  /**
   * Optional pre-filter: receives the trimmed value and must return `true` for
   * the check to proceed. Useful to bypass network calls until the local format
   * passes (e.g. valid email regex).
   */
  isWellFormed?: (value: string) => boolean;
}

/**
 * Debounced uniqueness probe.
 *
 * Pass the current input `value` and an async `checker` that resolves to
 * `true` when the value is already taken. The hook returns a status flag the
 * UI / Zod schema can react to without triggering a request on every keystroke.
 *
 * Implementation note: `checker` and `isWellFormed` are stashed in refs so
 * callers can pass inline arrow functions safely. If they were in the effect's
 * dependency array, the new identity on every render would re-fire the probe
 * (and after `setStatus` settles, re-render → new identity → re-fire) causing
 * an infinite request loop.
 */
export function useUniqueAvailability(
  value: string,
  checker: (value: string) => Promise<boolean>,
  options: UseUniqueAvailabilityOptions = {},
): UniqueAvailabilityStatus {
  const { delay = 500, skip = false, minLength = 1, isWellFormed } = options;
  const trimmed = value?.trim() ?? "";
  const debounced = useDebounce(trimmed, delay);

  const [status, setStatus] = useState<UniqueAvailabilityStatus>("idle");

  const checkerRef = useRef(checker);
  const isWellFormedRef = useRef(isWellFormed);

  // Keep the refs pointing at the latest closures from the caller so that the
  // probe always uses the most recent `checker`/`isWellFormed` without
  // re-subscribing the effect below.
  useEffect(() => {
    checkerRef.current = checker;
    isWellFormedRef.current = isWellFormed;
  });

  useEffect(() => {
    if (skip) {
      setStatus("idle");
      return;
    }

    if (!debounced || debounced.length < minLength) {
      setStatus("idle");
      return;
    }

    const validator = isWellFormedRef.current;
    if (validator && !validator(debounced)) {
      setStatus("idle");
      return;
    }

    let cancelled = false;
    setStatus("checking");

    checkerRef
      .current(debounced)
      .then((isTaken) => {
        if (cancelled) return;
        setStatus(isTaken ? "taken" : "available");
      })
      .catch(() => {
        if (cancelled) return;
        setStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, [debounced, skip, minLength]);

  // While the user is still typing (raw value hasn't settled into debounced),
  // surface a "checking" hint instead of a stale "available"/"taken".
  if (!skip && trimmed.length >= minLength && trimmed !== debounced) {
    return "checking";
  }

  return status;
}
