import { useEffect, useState } from "react";
import type { AppView, BridgeStatus, ClientProfile } from "../lib/types";
import type { UpdateStatusPayload } from "../types";
import { formatUpdateMessage } from "./UpdatePanel";

export function SettingsView({
  profile,
  status,
  appVersion,
  update,
  onCheckForUpdates,
  onLogout,
  onOpenSite,
  onNavigate,
}: {
  profile: ClientProfile;
  status: BridgeStatus | null;
  appVersion: string;
  update: UpdateStatusPayload;
  onCheckForUpdates: () => Promise<UpdateStatusPayload>;
  onLogout: () => void;
  onOpenSite: () => void;
  onNavigate: (view: AppView) => void;
}) {
  const [checking, setChecking] = useState(false);
  const [updateMessage, setUpdateMessage] = useState(() => formatUpdateMessage(update));

  useEffect(() => {
    setUpdateMessage(formatUpdateMessage(update));
  }, [update]);

  async function handleCheckForUpdates() {
    setChecking(true);
    try {
      const next = await onCheckForUpdates();
      setUpdateMessage(formatUpdateMessage(next));
    } finally {
      setChecking(false);
    }
  }

  const integrationReady =
    !!status?.gsiInstalled && !!status?.jsiInstall?.ready;

  return (
    <div className="page-stack">
      <header className="page-header">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Account, updates, and app preferences.</p>
        </div>
      </header>

      <div className="card-surface settings-card">
        <h3 className="section-label">Account</h3>
        <dl className="settings-dl">
          <div>
            <dt>Username</dt>
            <dd>{profile.username}</dd>
          </div>
          <div>
            <dt>Email</dt>
            <dd>{profile.email || "—"}</dd>
          </div>
          <div>
            <dt>Steam</dt>
            <dd>{profile.steamName ?? "Not linked"}</dd>
          </div>
          {status?.clientIdPreview && (
            <div>
              <dt>Client ID</dt>
              <dd className="settings-mono">{status.clientIdPreview}</dd>
            </div>
          )}
        </dl>
        <div className="settings-actions">
          <button type="button" className="btn btn-secondary" onClick={onOpenSite}>
            Open website
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() =>
              void window.ranked
                .getApiUrl()
                .then((url) => window.ranked.openExternal(`${url}/profile`))
            }
          >
            Manage account
          </button>
        </div>
      </div>

      <div className="card-surface settings-card">
        <h3 className="section-label">Updates</h3>
        <p className="ranked-meta">Current version: v{appVersion}</p>
        <p className="ranked-meta">{updateMessage}</p>
        {update.status === "downloading" && (
          <div className="update-progress" aria-hidden>
            <div
              className="update-progress-bar"
              style={{ width: `${update.progress ?? 0}%` }}
            />
          </div>
        )}
        <div className="settings-actions">
          <button
            type="button"
            className="btn btn-secondary"
            disabled={checking || update.status === "downloading"}
            onClick={() => void handleCheckForUpdates()}
          >
            {checking ? "Checking…" : "Check for updates"}
          </button>
        </div>
      </div>

      <div className="card-surface settings-card">
        <h3 className="section-label">Match tracking</h3>
        <p className="ranked-meta">
          {integrationReady
            ? status?.cs2Connected
              ? "CS2 connected · GSI and JSI are installed."
              : "GSI and JSI installed · launch CS2 to start tracking."
            : "Install game integration before rated matches can be recorded."}
        </p>
        <div className="settings-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => onNavigate({ kind: "tracking" })}
          >
            Open tracking setup
          </button>
        </div>
      </div>

      <div className="card-surface settings-card">
        <h3 className="section-label">Help</h3>
        <p className="ranked-meta">
          Questions, bugs, or account issues — email{" "}
          <button
            type="button"
            className="table-link"
            onClick={() => void window.ranked.openExternal("mailto:sashabaranov@sushii.dev")}
          >
            sashabaranov@sushii.dev
          </button>
          .
        </p>
      </div>

      <div className="card-surface settings-card settings-card-danger">
        <h3 className="section-label">Sign out</h3>
        <p className="ranked-meta">
          Disconnect this desktop client from your Ranked CS2 account on this PC.
        </p>
        <div className="settings-actions">
          <button type="button" className="btn btn-secondary settings-signout" onClick={onLogout}>
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
