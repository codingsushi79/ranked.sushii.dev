import { useState } from "react";
import type { UpdateStatusPayload } from "../types";

interface UpdatePanelProps {
  appVersion: string;
  update: UpdateStatusPayload;
  onCheck: () => Promise<UpdateStatusPayload>;
}

export function UpdatePanel({ appVersion, update, onCheck }: UpdatePanelProps) {
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
      </div>
    </section>
  );
}

function formatUpdateMessage(update: UpdateStatusPayload) {
  switch (update.status) {
    case "checking":
      return "Checking for updates...";
    case "available":
      return `Update v${update.version} is available. Downloading automatically…`;
    case "downloading":
      return `Downloading update v${update.version}… ${update.progress ?? 0}%`;
    case "ready":
      return `Update v${update.version} is ready. Restarting automatically…`;
    case "error":
      return update.message ?? "Update check failed.";
    case "idle":
      return update.message ?? "You're on the latest version.";
  }
}
