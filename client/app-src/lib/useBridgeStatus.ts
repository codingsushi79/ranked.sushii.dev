import { useCallback, useEffect, useState } from "react";
import type { BridgeStatus } from "../lib/types";

export function useBridgeStatus(intervalMs = 1500) {
  const [status, setStatus] = useState<BridgeStatus | null>(null);

  const refresh = useCallback(async () => {
    const next = (await window.ranked.getStatus()) as BridgeStatus;
    setStatus(next);
  }, []);

  useEffect(() => {
    void refresh();
    const id = setInterval(() => void refresh(), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs, refresh]);

  return { status, refresh };
}
