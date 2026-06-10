import { useEffect, useState } from "react";
import { formatMap } from "../lib/types";

export type PlayerLiveSnapshot = {
  inMatch: boolean;
  map: string;
  mode: string;
  phase: string;
  playerTeam: number;
  team0Score: number;
  team1Score: number;
  playerScore: number;
  opponentScore: number;
  updatedAt: string;
};

function formatMode(mode: string) {
  const key = mode.toLowerCase().trim();
  if (key === "competitive" || key === "comp") return "Competitive";
  if (key === "premier") return "Premier";
  return key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function LiveMatchStatus({
  username,
  initial,
}: {
  username: string;
  initial?: PlayerLiveSnapshot | null;
}) {
  const [live, setLive] = useState<PlayerLiveSnapshot | null>(initial ?? null);

  useEffect(() => {
    setLive(initial ?? null);
  }, [initial, username]);

  useEffect(() => {
    let cancelled = false;

    async function refresh() {
      try {
        const data = await window.ranked.fetch(
          `/api/players/${encodeURIComponent(username)}/live`
        );
        if (!cancelled) {
          setLive((data.live as PlayerLiveSnapshot | null) ?? null);
        }
      } catch {
        /* ignore */
      }
    }

    void refresh();
    const id = setInterval(() => void refresh(), 5000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [username]);

  if (!live?.inMatch) return null;

  return (
    <div className="card-surface live-match-card">
      <div className="live-match-head">
        <span className="ranked-pill ranked-pill-live">
          <span className="ranked-dot" />
          Live
        </span>
        <span className="ranked-meta">
          {formatMap(live.map)} · {formatMode(live.mode)}
        </span>
      </div>
      <div className="live-score-row">
        <span className="live-score live-score-player">{live.playerScore}</span>
        <span className="live-score-sep">–</span>
        <span className="live-score live-score-opponent">{live.opponentScore}</span>
      </div>
    </div>
  );
}
