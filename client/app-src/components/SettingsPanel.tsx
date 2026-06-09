import { useState } from "react";
import type { AppSettings, UpdateStatusPayload } from "../types";
import { TwitchConnectPrompt } from "./TwitchConnectPrompt";
import { UpdatePanel } from "./UpdatePanel";
import { ThemeSettings } from "./ThemeSettings";

interface SettingsPanelProps {
  settings: AppSettings;
  twitchConnected: boolean;
  twitchLogin: string | null;
  twitchConfigured: boolean;
  gsiInstalled: boolean;
  appVersion: string;
  updateStatus: UpdateStatusPayload;
  onSave: (settings: AppSettings) => void;
  onClose: () => void;
  onTwitchLogin: () => Promise<void>;
  onTwitchLogout: () => Promise<void>;
  onInstallGsi: () => Promise<void>;
  onCheckForUpdates: () => Promise<UpdateStatusPayload>;
  onInstallUpdate: () => Promise<void>;
}

export function SettingsPanel({
  settings,
  twitchConnected,
  twitchLogin,
  twitchConfigured,
  gsiInstalled,
  appVersion,
  updateStatus,
  onSave,
  onClose,
  onTwitchLogin,
  onTwitchLogout,
  onInstallGsi,
  onCheckForUpdates,
  onInstallUpdate,
}: SettingsPanelProps) {
  const [draft, setDraft] = useState(settings);
  const [busy, setBusy] = useState(false);

  const update = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setDraft((current) => ({ ...current, [key]: value }));
  };

  const handleTwitchAction = async () => {
    setBusy(true);
    try {
      if (twitchConnected) {
        await onTwitchLogout();
      } else {
        await onTwitchLogin();
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="settings-panel">
      <div className="settings-header">
        <div>
          <p className="eyebrow">Setup</p>
          <h2>Settings</h2>
        </div>
        <button className="ghost-button" onClick={onClose}>
          Back
        </button>
      </div>

      <section className="settings-section">
        <h3>Twitch Account</h3>
        {twitchConnected ? (
          <div className="account-card">
            <div>
              <p className="eyebrow">Signed in</p>
              <p className="account-name">{twitchLogin ? `@${twitchLogin}` : "Connected"}</p>
              <p className="subtle">Match-win polls are managed for this channel.</p>
            </div>
            <button className="ghost-button" disabled={busy} onClick={handleTwitchAction}>
              {busy ? "Working..." : "Sign out"}
            </button>
          </div>
        ) : (
          <TwitchConnectPrompt configured={twitchConfigured} error={null} onSignIn={onTwitchLogin} />
        )}
      </section>

      <ThemeSettings
        theme={draft.theme}
        onChange={(theme) => setDraft((current) => ({ ...current, theme, overlayOpacity: theme.overlayOpacity }))}
      />

      {twitchConnected && (
        <section className="settings-section">
          <h3>Match Win Poll</h3>
          <label>
            Poll Title
            <input
              value={draft.pollTitle}
              onChange={(event) => update("pollTitle", event.target.value)}
            />
          </label>
          <div className="settings-grid">
            <label>
              Choice A
              <input
                value={draft.pollChoiceA}
                onChange={(event) => update("pollChoiceA", event.target.value)}
              />
            </label>
            <label>
              Choice B
              <input
                value={draft.pollChoiceB}
                onChange={(event) => update("pollChoiceB", event.target.value)}
              />
            </label>
          </div>
          <label>
            Max Duration (seconds)
            <input
              type="number"
              min={15}
              max={1800}
              value={draft.pollDurationSeconds}
              onChange={(event) =>
                update("pollDurationSeconds", Number(event.target.value))
              }
            />
          </label>
        </section>
      )}

      <section className="settings-section">
        <h3>CS2 Integration</h3>
        <label>
          GSI Port
          <input
            type="number"
            value={draft.gsiPort}
            onChange={(event) => update("gsiPort", Number(event.target.value))}
          />
        </label>
        <div className="settings-actions">
          <button className="ghost-button" onClick={onInstallGsi}>
            {gsiInstalled ? "Reinstall GSI Config" : "Install GSI Config"}
          </button>
        </div>
      </section>

      <UpdatePanel
        appVersion={appVersion}
        update={updateStatus}
        onCheck={onCheckForUpdates}
        onInstall={onInstallUpdate}
      />

      <div className="settings-footer">
        <button className="primary-button" onClick={() => onSave(draft)}>
          Save Settings
        </button>
      </div>
    </div>
  );
}
