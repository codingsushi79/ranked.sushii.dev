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

  return (
    <section className="settings-section">
      <h3>Updates</h3>
      <p className="subtle">Current version: v{appVersion}</p>
      <p className="update-message">{formatUpdateMessage(update)}</p>

      <div className="settings-actions">
        <button className="ghost-button" disabled={busy} onClick={handleCheck}>
          {busy ? "Checking..." : "Check for updates"}
        </button>
        {update.status === "ready" && (
          <button className="primary-button" onClick={onInstall}>
            Restart to update
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
      return `Update v${update.version} found. Downloading...`;
    case "downloading":
      return `Downloading update... ${update.progress ?? 0}%`;
    case "ready":
      return `Update v${update.version} will install automatically when the download finishes.`;
    case "error":
      return update.message ?? "Update check failed.";
    case "idle":
      return update.message ?? "You're on the latest version.";
  }
}
