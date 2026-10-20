import { useEffect, useState } from "react";

const HEALTH_URL = "http://localhost:9100/health";

export function useDrawerAgentStatus(): "connected" | "disconnected" {
  const [status, setStatus] = useState<"connected" | "disconnected">(
    "disconnected",
  );

  useEffect(() => {
    let cancelled = false;
    fetch(HEALTH_URL)
      .then(() => {
        if (!cancelled) setStatus("connected");
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  return status;
}
