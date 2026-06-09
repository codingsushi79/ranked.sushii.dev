import { useEffect, useState } from "react";
import type { AppView, PublicPlayer } from "../lib/types";
import { formatMap, initials } from "../lib/types";
import { LevelRingWithElo } from "./LevelRing";
import { CsrepTrustBadge, CsrepTrustPanel } from "./CsrepTrustBadge";

export function PlayerView({
  username,
  onNavigate,
}: {
  username: string;
  onNavigate: (view: AppView) => void;
}) {
  const [player, setPlayer] = useState<PublicPlayer | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setError(null);
    void window.ranked
      .fetch(`/api/players/${encodeURIComponent(username)}`)
      .then((data) => setPlayer(data as PublicPlayer))
      .catch((err) => setError(err instanceof Error ? err.message : "Player not found"))
      .finally(() => setLoading(false));
  }, [username]);

  if (loading) return <p className="ranked-meta page-pad">Loading player…</p>;
  if (error || !player) return <p className="ranked-msg-err page-pad">{error ?? "Not found"}</p>;

  return (
    <div className="page-stack">
      <header className="page-header page-header-row">
        <div className="profile-head">
          <div className="ranked-linked-avatar profile-avatar" aria-hidden>
            {player.steamAvatar ? (
              <img src={player.steamAvatar} alt="" />
            ) : (
              <span>{initials(player.username)}</span>
            )}
          </div>
          <div>
            <h1 className="page-title">{player.username}</h1>
            <p className="page-subtitle">
              {player.steamName ?? "Steam not linked"} · Season {player.season}
            </p>
            {player.csrep && (
              <div className="profile-trust-row">
                <CsrepTrustBadge trust={player.csrep} />
              </div>
            )}
          </div>
        </div>
        <LevelRingWithElo elo={player.stats.elo} level={player.stats.level} size={64} />
      </header>

      <div className="stat-grid stat-grid-compact">
        <div className="card-surface stat-tile">
          <p className="section-label">Record</p>
          <p className="stat-value">
            {player.stats.wins}W · {player.stats.losses}L
          </p>
        </div>
        <div className="card-surface stat-tile">
          <p className="section-label">K/D</p>
          <p className="stat-value">{player.stats.kd.toFixed(2)}</p>
        </div>
        <div className="card-surface stat-tile">
          <p className="section-label">Win rate</p>
          <p className="stat-value">{player.stats.winRate}%</p>
        </div>
      </div>

      {player.csrep && (
        <div className="card-surface">
          <h3 className="section-label">CSRep trust</h3>
          <CsrepTrustPanel trust={player.csrep} />
        </div>
      )}

      <div className="card-surface table-card">
        <h3 className="section-label">Recent matches</h3>
        {player.recentMatches.length === 0 ? (
          <p className="ranked-meta">No matches yet.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Map</th>
                <th>Result</th>
                <th>K/D/A</th>
                <th>Elo</th>
              </tr>
            </thead>
            <tbody>
              {player.recentMatches.map((m, i) => (
                <tr key={`${m.map}-${m.playedAt}-${i}`}>
                  <td>{formatMap(m.map)}</td>
                  <td className={m.won ? "text-win" : "text-loss"}>{m.won ? "Win" : "Loss"}</td>
                  <td>
                    {m.kills}/{m.deaths}/{m.assists}
                  </td>
                  <td className={m.eloChange >= 0 ? "text-win" : "text-loss"}>
                    {m.eloChange >= 0 ? "+" : ""}
                    {m.eloChange}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <button type="button" className="btn btn-secondary" onClick={() => onNavigate({ kind: "leaderboard" })}>
        Back to leaderboard
      </button>
    </div>
  );
}
