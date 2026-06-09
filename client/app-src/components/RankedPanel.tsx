import { useCallback, useEffect, useState } from "react";
import { LevelRingWithElo } from "./LevelRing";

type BridgeStatus = {
  hasClientId: boolean;
  clientIdPreview?: string;
  tracking?: boolean;
  cs2Connected?: boolean;
  inMatch?: boolean;
  inRatedMatch?: boolean;
  matchMode?: string | null;
  gsiInstalled?: boolean;
  activeMatch?: { map: string; mode: string; playerCount: number; externalId?: string };
  lastReport?: { ok: boolean; at: string; message?: string; externalId?: string };
  lastError?: string;
  jsiInstall?: {
    ready?: boolean;
    inCatalog?: boolean;
    inInstalled?: boolean;
    locations?: Array<{
      root: string;
      hasScript: boolean;
      inCatalog: boolean;
      inInstalled: boolean;
      scriptPath?: string;
    }>;
    errors?: string[];
  };
  apiUrl?: string;
};

type Profile = {
  username: string;
  steamName: string | null;
  steamAvatar: string | null;
  elo: number;
  level: number;
  wins: number;
  losses: number;
  season: number;
};

function formatGameMode(mode: string | null | undefined) {
  if (!mode) return "This mode";
  const key = mode.toLowerCase().trim();
  const labels: Record<string, string> = {
    casual: "Casual",
    competitive: "Competitive",
    comp: "Competitive",
    premier: "Premier",
    deathmatch: "Deathmatch",
    wingman: "Wingman",
  };
  if (labels[key]) return labels[key];
  return key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatMap(map: string) {
  return String(map || "unknown")
    .replace(/^de_/i, "")
    .replace(/_/g, " ");
}

function initials(name: string) {
  return name.slice(0, 2).toUpperCase();
}

export function RankedPanel() {
  const [status, setStatus] = useState<BridgeStatus | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [clientId, setClientId] = useState("");
  const [clientIdMsg, setClientIdMsg] = useState("");
  const [jsiMsg, setJsiMsg] = useState("");
  const [gsiMsg, setGsiMsg] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const s = (await window.ranked.getStatus()) as BridgeStatus;
    setStatus(s);
    if (s.hasClientId) {
      try {
        const p = await window.ranked.getProfile();
        setProfile(p as Profile);
        setLinkError(null);
      } catch (e) {
        setProfile(null);
        setLinkError(e instanceof Error ? e.message : "Could not verify account");
      }
    } else {
      setProfile(null);
      setLinkError(null);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const id = setInterval(() => void refresh(), 1500);
    return () => clearInterval(id);
  }, [refresh]);

  async function saveClientId() {
    const value = clientId.trim();
    if (!value) {
      setClientIdMsg("Enter a Client ID first");
      return;
    }
    setBusy("clientId");
    setClientIdMsg("");
    try {
      await window.ranked.saveClientId(value);
      setClientId("");
      setClientIdMsg("Client ID saved.");
      await refresh();
    } catch (e) {
      setClientIdMsg(e instanceof Error ? e.message : "Save failed");
    } finally {
      setBusy(null);
    }
  }

  async function clearClientId() {
    setBusy("clear");
    setClientIdMsg("");
    try {
      await window.ranked.clearClientId();
      setClientId("");
      setClientIdMsg("Client ID cleared.");
      await refresh();
    } catch (e) {
      setClientIdMsg(e instanceof Error ? e.message : "Clear failed");
    } finally {
      setBusy(null);
    }
  }

  async function reinstallJsi() {
    setBusy("jsi");
    setJsiMsg("");
    try {
      await window.ranked.reinstallJsi();
      setJsiMsg("JSI script reinstalled.");
      await refresh();
    } catch (e) {
      setJsiMsg(e instanceof Error ? e.message : "Reinstall failed");
    } finally {
      setBusy(null);
    }
  }

  async function reinstallGsi() {
    setBusy("gsi");
    setGsiMsg("");
    try {
      await window.ranked.reinstallGsi();
      setGsiMsg("GSI config reinstalled. Restart CS2 if it is already running.");
      await refresh();
    } catch (e) {
      setGsiMsg(e instanceof Error ? e.message : "Reinstall failed");
    } finally {
      setBusy(null);
    }
  }

  const tracking = status?.tracking && status.activeMatch;
  const isLinked = !!profile;
  const hasSavedId = !!status?.hasClientId;
  const inUnsupportedGame =
    !!status?.inMatch && !status?.inRatedMatch && !tracking;

  function trackingLabel() {
    if (tracking) return "Tracking match";
    if (!hasSavedId) return "No Client ID — save one below";
    if (linkError) {
      const unauth =
        /unauthorized|verify email|not verified|invalid client/i.test(linkError);
      return unauth
        ? "Client ID saved — account not verified"
        : "Client ID saved — could not verify";
    }
    if (!status?.gsiInstalled) return "GSI not installed — use Reinstall below";
    if (!status?.cs2Connected) return "Waiting for CS2 — launch the game";
    if (inUnsupportedGame) {
      return `${formatGameMode(status?.matchMode)} — not tracked`;
    }
    if (status?.inRatedMatch) return "In rated match";
    if (status?.lastError) return "Last report failed";
    return "Ready";
  }

  const pillClass = tracking || status?.inRatedMatch
    ? "ranked-pill ranked-pill-live"
    : inUnsupportedGame
      ? "ranked-pill ranked-pill-warn"
      : !hasSavedId || linkError || status?.lastError
        ? "ranked-pill ranked-pill-error"
        : !status?.cs2Connected
          ? "ranked-pill ranked-pill-idle"
          : "ranked-pill ranked-pill-idle";

  return (
    <div className="ranked-panel">
      <div className="card-surface ranked-linked">
        <h3 className="section-label">Linked account</h3>
        {!hasSavedId ? (
          <p className="ranked-meta">Not linked — paste your Client ID from ranked.sushii.dev → Profile.</p>
        ) : isLinked && profile ? (
          <div className="ranked-linked-row">
            <div className="ranked-linked-avatar" aria-hidden>
              {profile.steamAvatar ? (
                <img src={profile.steamAvatar} alt="" />
              ) : (
                <span>{initials(profile.username)}</span>
              )}
            </div>
            <div className="ranked-linked-info">
              <p className="ranked-linked-name">{profile.username}</p>
              <p className="ranked-meta">
                {profile.steamName ? profile.steamName : "Steam not linked on site"}
              </p>
            </div>
            <span className="ranked-linked-badge ranked-linked-badge-ok">Linked</span>
          </div>
        ) : (
          <div className="ranked-linked-row ranked-linked-row-error">
            <div className="ranked-linked-info">
              <p className="ranked-linked-name">Could not verify</p>
              <p className="ranked-meta">{linkError ?? "Check your Client ID on the website."}</p>
              {status?.clientIdPreview && (
                <p className="ranked-meta">Saved ID: {status.clientIdPreview}</p>
              )}
            </div>
            <span className="ranked-linked-badge ranked-linked-badge-err">Error</span>
          </div>
        )}
      </div>

      {isLinked && profile && (
        <div className="ranked-profile card-surface">
          <div className="ranked-profile-head">
            <span className="ranked-username">{profile.username}</span>
            <span className="ranked-season">Season {profile.season}</span>
          </div>
          <LevelRingWithElo elo={profile.elo} level={profile.level} size={52} />
          <p className="ranked-wl">
            {profile.wins}W · {profile.losses}L
          </p>
        </div>
      )}

      <div className="card-surface">
        <h3 className="section-label">Match tracking</h3>
        <div className={pillClass}>
          <span className="ranked-dot" />
          <span>{trackingLabel()}</span>
        </div>
        {inUnsupportedGame && (
          <p className="ranked-meta ranked-meta-warn">
            Only <strong>Competitive</strong> and <strong>Premier</strong> matches are rated.{" "}
            {formatGameMode(status?.matchMode)} does not affect your ranked rating.
          </p>
        )}
        {tracking && status?.activeMatch && (
          <p className="ranked-meta">
            <strong>{formatMap(status.activeMatch.map)}</strong> · {status.activeMatch.mode}
            <br />
            Players: {status.activeMatch.playerCount}
          </p>
        )}
        {status?.lastReport && (
          <p className={`ranked-meta ${status.lastReport.ok ? "" : "ranked-msg-err"}`}>
            Last report {status.lastReport.ok ? "OK" : "failed"}
            {status.lastReport.message ? ` — ${status.lastReport.message}` : ""} ·{" "}
            {new Date(status.lastReport.at).toLocaleString()}
          </p>
        )}
      </div>

      <div className="card-surface">
        <h3 className="section-label">Game State Integration</h3>
        <p className="ranked-meta">
          {status?.gsiInstalled
            ? status.cs2Connected
              ? "GSI installed · CS2 connected"
              : "GSI installed · waiting for CS2"
            : "Not installed — use Reinstall"}
        </p>
        <button
          type="button"
          className="btn btn-secondary"
          disabled={busy === "gsi"}
          onClick={() => void reinstallGsi()}
        >
          {busy === "gsi" ? "Installing…" : "Reinstall GSI config"}
        </button>
        {gsiMsg && <p className="ranked-msg-ok">{gsiMsg}</p>}
      </div>

      <div className="card-surface">
        <h3 className="section-label">JSI script</h3>
        <p className="ranked-meta">
          {status?.jsiInstall?.ready
            ? "Ready · catalog ✓ · installed ✓"
            : status?.jsiInstall
              ? "Incomplete — use Reinstall"
              : "Checking…"}
        </p>
        <button
          type="button"
          className="btn btn-secondary"
          disabled={busy === "jsi"}
          onClick={() => void reinstallJsi()}
        >
          {busy === "jsi" ? "Installing…" : "Reinstall JSI script"}
        </button>
        {jsiMsg && <p className="ranked-msg-ok">{jsiMsg}</p>}
      </div>

      <div className="card-surface">
        <h3 className="section-label">Client ID</h3>
        <p className="ranked-meta">
          {isLinked && profile
            ? `Linked to ${profile.username}`
            : hasSavedId
              ? `Saved: ${status?.clientIdPreview}`
              : "Copy from ranked.sushii.dev → Profile"}
        </p>
        <input
          type="text"
          className="ranked-input"
          placeholder="Paste Client ID"
          value={clientId}
          onChange={(e) => setClientId(e.target.value)}
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
        />
        <button
          type="button"
          className="btn btn-primary"
          disabled={busy === "clientId"}
          onClick={() => void saveClientId()}
        >
          {busy === "clientId" ? "Saving…" : "Save Client ID"}
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          disabled={busy === "clear"}
          onClick={() => void clearClientId()}
        >
          {busy === "clear" ? "Clearing…" : "Clear Client ID"}
        </button>
        {clientIdMsg && (
          <p
            className={
              clientIdMsg.includes("failed") || clientIdMsg.includes("Enter")
                ? "ranked-msg-err"
                : "ranked-msg-ok"
            }
          >
            {clientIdMsg}
          </p>
        )}
      </div>
    </div>
  );
}
