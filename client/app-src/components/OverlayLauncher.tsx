import { useEffect, useState } from "react";
import type { OverlayStatus } from "../types";

interface OverlayLauncherProps {
  overlayStatus: OverlayStatus;
  twitchConnected: boolean;
  onApply: (options: { stats: boolean; poll: boolean }) => Promise<void>;
  onCloseAll: () => Promise<void>;
}

export function OverlayLauncher({
  overlayStatus,
  twitchConnected,
  onApply,
  onCloseAll,
}: OverlayLauncherProps) {
  const [stats, setStats] = useState(overlayStatus.stats);
  const [poll, setPoll] = useState(overlayStatus.poll);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setStats(overlayStatus.stats);
    setPoll(overlayStatus.poll);
  }, [overlayStatus.stats, overlayStatus.poll]);

  useEffect(() => {
    if (!twitchConnected) {
      setPoll(false);
    }
  }, [twitchConnected]);

  const handleApply = async () => {
    setBusy(true);
    try {
      await onApply({ stats, poll: twitchConnected ? poll : false });
    } finally {
      setBusy(false);
    }
  };

  const handleCloseAll = async () => {
    setBusy(true);
    try {
      await onCloseAll();
      setStats(false);
      setPoll(false);
    } finally {
      setBusy(false);
    }
  };

  const anyOpen = overlayStatus.stats || overlayStatus.poll;

  return (
    <section className="overlay-launcher">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Stream Overlays</p>
          <h3>Overlay windows</h3>
        </div>
      </div>

      <p className="subtle launcher-copy">
        Choose which overlays to show, then capture each window in OBS. Close overlays from
        here — the overlay windows themselves have no chrome.
      </p>

      <div className="launcher-options">
        <label className="launcher-option">
          <input
            type="checkbox"
            checked={stats}
            onChange={(event) => setStats(event.target.checked)}
          />
          <span>
            <strong>Game stats</strong>
            <small>Match banner and scoreboard stats</small>
          </span>
        </label>

        {twitchConnected && (
          <label className="launcher-option">
            <input
              type="checkbox"
              checked={poll}
              onChange={(event) => setPoll(event.target.checked)}
            />
            <span>
              <strong>Twitch poll</strong>
              <small>Live match-win poll standings</small>
            </span>
          </label>
        )}
      </div>

      <div className="launcher-actions">
        <button className="primary-button" disabled={busy} onClick={handleApply}>
          {busy ? "Applying..." : "Apply overlay windows"}
        </button>
        {anyOpen && (
          <button className="ghost-button" disabled={busy} onClick={handleCloseAll}>
            Close all overlays
          </button>
        )}
      </div>

      <div className="launcher-status">
        <StatusChip label="Stats" active={overlayStatus.stats} />
        {twitchConnected && <StatusChip label="Poll" active={overlayStatus.poll} />}
      </div>
    </section>
  );
}

function StatusChip({ label, active }: { label: string; active: boolean }) {
  return (
    <span className={`launcher-chip ${active ? "launcher-chip-active" : ""}`}>
      <span className="status-dot" />
      {label}
      {active ? " · open" : " · closed"}
    </span>
  );
}
