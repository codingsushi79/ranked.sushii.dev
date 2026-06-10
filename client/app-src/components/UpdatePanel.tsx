import { useState } from "react";
import type { UpdateStatusPayload } from "../types";

interface UpdatePanelProps {
  appVersion: string;
  update: UpdateStatusPayload;
  onCheck: () => Promise<UpdateStatusPayload>;
  onInstall: () => Promise<void>;
}

export function UpdatePanel({ appVersion, update, onCheck, onInstall }: UpdatePanelProps) {
  const [busy, setBusy] = useState(false);

  const handleCheck = async () => {
    setBusy(true);
    try {
      return await onCheck();
    } finally {
      setBusy(false);
    }
  };

  const canApply =
    update.status === "available" ||
    update.status === "ready" ||
    update.status === "downloading";

  return (
    <section className="settings-section">
      <h3>Updates</h3>
      <p className="subtle">Current version: v{appVersion}</p>
      <p className="update-message">{formatUpdateMessage(update)}</p>

      <div className="settings-actions">
        <button className="ghost-button" disabled={busy} onClick={handleCheck}>
          {busy ? "Checking..." : "Check for updates"}
        </button>
        {canApply && (
          <button
            className="primary-button"
            disabled={update.status === "downloading"}
            onClick={() => void onInstall()}
          >
            {update.status === "ready"
              ? "Restart to update"
              : update.status === "downloading"
                ? "Downloading…"
                : "Update now"}
          </button>
        )}
      </div>
    </section>
  );
}

function formatUpdateMessage(update: UpdateStatusPayload) {
  switch (update.status) {
    case "checking":
      return "Checking for updates...";
    case "available":
      return `Update v${update.version} is available. Match recording stays paused until you install it.`;
    case "downloading":
      return `Downloading update v${update.version}… ${update.progress ?? 0}%`;
    case "ready":
      return `Update v${update.version} is ready. Restart to finish installing.`;
    case "error":
      return update.message ?? "Update check failed.";
    case "idle":
      return update.message ?? "You're on the latest version.";
  }
}
