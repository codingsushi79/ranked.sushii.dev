import { useCallback, useEffect, useState } from "react";
import type { UpdateStatusPayload } from "../types";

export function useUpdateStatus() {
  const [update, setUpdate] = useState<UpdateStatusPayload>({ status: "idle" });
  const [appVersion, setAppVersion] = useState("…");

  useEffect(() => {
    void window.ranked.getAppVersion().then(setAppVersion);
    void window.ranked.checkForUpdates().then(setUpdate);
    return window.ranked.onUpdate(setUpdate);
  }, []);

  const checkForUpdates = useCallback(async () => {
    const next = await window.ranked.checkForUpdates();
    setUpdate(next);
    return next;
  }, []);

  const updateRequired =
    update.status === "available" ||
    update.status === "downloading" ||
    update.status === "ready";

  return {
    appVersion,
    update,
    updateRequired,
    checkForUpdates,
  };
}
