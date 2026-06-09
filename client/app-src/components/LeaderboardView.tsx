import { useCallback, useEffect, useState } from "react";
import type { AppView, LeaderboardPlayer } from "../lib/types";
import { initials } from "../lib/types";
import { CsrepTrustBadge } from "./CsrepTrustBadge";

type ViewerInfo = {
  username: string;
  level: number;
  rank: number | null;
  rankAtLevel: number | null;
  inList: boolean;
};

export function LeaderboardView({
  viewerUsername,
  onNavigate,
}: {
  viewerUsername: string | null;
  onNavigate: (view: AppView) => void;
}) {
  const [level, setLevel] = useState<number | null>(null);
  const [season, setSeason] = useState<number | null>(null);
  const [players, setPlayers] = useState<LeaderboardPlayer[]>([]);
  const [viewer, setViewer] = useState<ViewerInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback((filter: number | null) => {
    setLoading(true);
    setError(null);
    const query = filter == null ? "all" : String(filter);
    return window.ranked
      .fetch(`/api/leaderboard?level=${query}`)
      .then((data) => {
        setSeason(data.season as number);
        setPlayers((data.players as LeaderboardPlayer[]) ?? []);
        setViewer((data.viewer as ViewerInfo | null) ?? null);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load leaderboard");
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    void load(level);
  }, [level, load]);

  return (
    <div className="page-stack">
      <header className="page-header">
        <div>
          <h1 className="page-title">Leaderboard</h1>
          <p className="page-subtitle">
            {season != null ? `Season ${season}` : "Loading season…"}
            {viewer && !viewer.inList && viewer.rank != null && (
              <> · Your rank: #{viewer.rank}</>
            )}
          </p>
        </div>
      </header>

      <div className="level-tabs">
        <button
          type="button"
          className={`level-tab ${level == null ? "is-active" : ""}`}
          onClick={() => setLevel(null)}
        >
          Overall
        </button>
        {Array.from({ length: 20 }, (_, i) => i + 1).map((lv) => (
          <button
            key={lv}
            type="button"
            className={`level-tab ${level === lv ? "is-active" : ""}`}
            onClick={() => setLevel(lv)}
          >
            {lv}
          </button>
        ))}
      </div>

      {error && <p className="ranked-msg-err">{error}</p>}

      <div className="card-surface table-card">
        {loading ? (
          <p className="ranked-meta">Loading…</p>
        ) : players.length === 0 ? (
          <p className="ranked-meta">No players on this board yet.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Player</th>
                <th>Trust</th>
                <th>Elo</th>
                <th>W/L</th>
                <th>K/D</th>
              </tr>
            </thead>
            <tbody>
              {players.map((p) => (
                <tr
                  key={p.username}
                  className={p.username === viewerUsername ? "is-viewer" : ""}
                >
                  <td>{p.rank}</td>
                  <td>
                    <button
                      type="button"
                      className="table-link"
                      onClick={() => onNavigate({ kind: "player", username: p.username })}
                    >
                      <span className="table-avatar" aria-hidden>
                        {p.steamAvatar ? (
                          <img src={p.steamAvatar} alt="" />
                        ) : (
                          initials(p.username)
                        )}
                      </span>
                      {p.username}
                    </button>
                  </td>
                  <td>
                    <CsrepTrustBadge trust={p.csrep} />
                  </td>
                  <td>L{p.level} · {p.elo}</td>
                  <td>
                    {p.wins}/{p.losses}
                  </td>
                  <td>{p.kd.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
