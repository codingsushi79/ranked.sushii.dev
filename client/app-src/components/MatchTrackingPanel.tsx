import { useState } from "react";
import type { BridgeStatus } from "../lib/types";
import { formatMap } from "../lib/types";

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

function integrationReady(status: BridgeStatus | null) {
  return !!status?.gsiInstalled && !!status?.jsiInstall?.ready;
}

export function MatchTrackingPanel({ status }: { status: BridgeStatus | null }) {
  const updateRequired = !!status?.updateRequired;
  const tracking = status?.tracking && status.activeMatch && !updateRequired;
  const inUnsupportedGame =
    !!status?.inMatch && !status?.inRatedMatch && !tracking && !updateRequired;
  const ready = integrationReady(status);

  function trackingLabel() {
    if (updateRequired) return "Update required";
    if (tracking) return "Tracking match";
    if (!ready) return "Waiting for CS2 — launch the game";
    if (!status?.cs2Connected) return "Waiting for CS2 — launch the game";
    if (inUnsupportedGame) {
      return `${formatGameMode(status?.matchMode)} — not tracked`;
    }
    if (status?.inRatedMatch) return "In rated match";
    if (status?.lastError) return "Last report failed";
    return "Ready";
  }

  const pillClass = updateRequired
    ? "ranked-pill ranked-pill-warn"
    : tracking || status?.inRatedMatch
      ? "ranked-pill ranked-pill-live"
      : inUnsupportedGame
        ? "ranked-pill ranked-pill-warn"
        : status?.lastError
          ? "ranked-pill ranked-pill-error"
          : !status?.cs2Connected
            ? "ranked-pill ranked-pill-idle"
            : "ranked-pill ranked-pill-idle";

  return (
    <div className="card-surface">
      <h3 className="section-label">Match tracking</h3>
      <div className={pillClass}>
        <span className="ranked-dot" />
        <span>{trackingLabel()}</span>
      </div>
      <p className="ranked-meta">
        {updateRequired
          ? "Install the latest app update before rated matches can be recorded."
          : ready
            ? status?.cs2Connected
              ? "CS2 connected · matches report automatically after rated games"
              : "Integration installed · open Counter-Strike 2 to start tracking"
            : "Install Counter-Strike 2 from Steam if you have not already, then launch the game once"}
      </p>
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
  );
}
