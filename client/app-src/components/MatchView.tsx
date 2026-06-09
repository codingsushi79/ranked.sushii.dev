import { useEffect, useState } from "react";
import type { AppView, MatchDetail } from "../lib/types";
import { formatMap } from "../lib/types";

export function MatchView({
  matchId,
  onNavigate,
}: {
  matchId: string;
  onNavigate: (view: AppView) => void;
}) {
  const [match, setMatch] = useState<MatchDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setError(null);
    void window.ranked
      .fetch(`/api/matches/${encodeURIComponent(matchId)}`)
      .then((data) => setMatch((data.match as MatchDetail) ?? null))
      .catch((err) => setError(err instanceof Error ? err.message : "Match not found"))
      .finally(() => setLoading(false));
  }, [matchId]);

  if (loading) return <p className="ranked-meta page-pad">Loading match…</p>;
  if (error || !match) return <p className="ranked-msg-err page-pad">{error ?? "Not found"}</p>;

  function renderTeam(label: string, team: MatchDetail["team0"], score: number | null) {
    return (
      <div className="card-surface table-card">
        <h3 className="section-label">
          {label}
          {score != null ? ` · ${score}` : ""}
        </h3>
        <table className="data-table">
          <thead>
            <tr>
              <th>Player</th>
              <th>K/D/A</th>
              <th>Elo</th>
            </tr>
          </thead>
          <tbody>
            {team.map((p, i) => (
              <tr key={`${p.username ?? p.displayName}-${i}`}>
                <td>
                  {p.username ? (
                    <button
                      type="button"
                      className="table-link"
                      onClick={() => onNavigate({ kind: "player", username: p.username! })}
                    >
                      {p.displayName ?? p.username}
                    </button>
                  ) : (
                    p.displayName ?? "Player"
                  )}
                </td>
                <td>
                  {p.kills}/{p.deaths}/{p.assists}
                </td>
                <td className={(p.eloChange ?? 0) >= 0 ? "text-win" : "text-loss"}>
                  {p.eloChange != null ? `${p.eloChange >= 0 ? "+" : ""}${p.eloChange}` : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="page-stack">
      <header className="page-header">
        <div>
          <h1 className="page-title">{formatMap(match.map)}</h1>
          <p className="page-subtitle">
            {match.mode} · {new Date(match.playedAt).toLocaleString()}
            {match.team0Score != null && match.team1Score != null && (
              <> · {match.team0Score} – {match.team1Score}</>
            )}
          </p>
        </div>
      </header>

      <div className="match-teams">
        {renderTeam("CT", match.team0, match.team0Score)}
        {renderTeam("T", match.team1, match.team1Score)}
      </div>
    </div>
  );
}
