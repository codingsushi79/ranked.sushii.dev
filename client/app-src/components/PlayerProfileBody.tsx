import type { ReactNode } from "react";
import type { AppView, CsrepTrustJson, PlayerLiveSnapshot } from "../lib/types";
import { formatMap, initials } from "../lib/types";
import { LevelBadge } from "./LevelBadge";
import { CsrepTrustBadge, CsrepTrustPanel } from "./CsrepTrustBadge";
import { LiveMatchStatus } from "./LiveMatchStatus";

type ProfileStats = {
  level: number;
  elo: number;
  isPlacing: boolean;
  wins: number;
  losses: number;
  winRate: number;
  kills: number;
  deaths: number;
  kd: number;
  assists: number;
  headshots: number;
  mvps: number;
};

type ProfileMatch = {
  matchId?: string;
  map: string;
  kills: number;
  deaths: number;
  assists: number;
  eloChange: number;
  won: boolean;
  team0Score?: number | null;
  team1Score?: number | null;
  demoShareCode?: string | null;
  demoUrl?: string | null;
  playedAt?: string;
};

function demoLinks(shareCode?: string | null) {
  if (!shareCode?.trim()) return null;
  const encoded = encodeURIComponent(shareCode.trim());
  return {
    steamUrl: `steam://rungame/730/76561202255233023/+csgo_download_match%20${encoded}`,
    webUrl: `https://replay.esplay.se/?sharecode=${encoded}`,
  };
}

export function PlayerProfileBody({
  username,
  steamName,
  steamAvatar,
  steamId,
  seasonLabel,
  stats,
  csrep,
  live,
  recentMatches,
  onNavigate,
  setupActions,
  footer,
}: {
  username: string;
  steamName: string | null;
  steamAvatar: string | null;
  steamId?: string | null;
  seasonLabel: string;
  stats: ProfileStats;
  csrep: CsrepTrustJson | null;
  live?: PlayerLiveSnapshot | null;
  recentMatches: ProfileMatch[];
  onNavigate: (view: AppView) => void;
  setupActions?: ReactNode;
  footer?: ReactNode;
}) {
  const primaryStats = [
    { label: "Record", value: `${stats.wins}W · ${stats.losses}L` },
    { label: "Win rate", value: `${stats.winRate}%` },
    { label: "Kills", value: stats.kills },
    { label: "Deaths", value: stats.deaths },
  ];

  const secondaryStats = [
    { label: "K/D", value: stats.kd.toFixed(2) },
    { label: "Assists", value: stats.assists },
    { label: "Headshots", value: stats.headshots },
    { label: "MVPs", value: stats.mvps },
  ];

  return (
    <div className="page-stack">
      <header className="page-header page-header-row">
        <div className="profile-head">
          <div className="ranked-linked-avatar profile-avatar" aria-hidden>
            {steamAvatar ? (
              <img src={steamAvatar} alt="" />
            ) : (
              <span>{initials(username)}</span>
            )}
          </div>
          <div>
            <h1 className="page-title">{username}</h1>
            <p className="page-subtitle">
              {steamName ?? "Steam not linked"} · {seasonLabel}
            </p>
            <div className="profile-trust-row">
              <LevelBadge level={stats.level} elo={stats.elo} />
              {csrep && <CsrepTrustBadge trust={csrep} />}
              {stats.isPlacing && <span className="ranked-meta">Placements</span>}
            </div>
          </div>
        </div>
      </header>

      {setupActions}

      <LiveMatchStatus username={username} initial={live} />

      {steamId && (
        <div className="card-surface">
          <h3 className="section-label">CSRep trust</h3>
          <CsrepTrustPanel trust={csrep} />
        </div>
      )}

      <div className="stat-grid">
        {primaryStats.map((stat) => (
          <div key={stat.label} className="card-surface stat-tile">
            <p className="section-label">{stat.label}</p>
            <p className="stat-value">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="stat-grid">
        {secondaryStats.map((stat) => (
          <div key={stat.label} className="card-surface stat-tile">
            <p className="section-label">{stat.label}</p>
            <p className="stat-value">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="card-surface table-card">
        <h3 className="section-label">Recent matches</h3>
        {recentMatches.length === 0 ? (
          <p className="ranked-meta">No matches yet.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Map</th>
                <th>Score</th>
              <th>Result</th>
              <th>K/D/A</th>
              <th>Elo</th>
              <th>Demo</th>
            </tr>
            </thead>
            <tbody>
              {recentMatches.map((m, i) => (
                <tr key={m.matchId ?? `${m.map}-${m.playedAt ?? i}`}>
                  <td>
                    {m.matchId ? (
                      <button
                        type="button"
                        className="table-link"
                        onClick={() => onNavigate({ kind: "match", id: m.matchId! })}
                      >
                        {formatMap(m.map)}
                      </button>
                    ) : (
                      formatMap(m.map)
                    )}
                  </td>
                  <td>
                    {m.team0Score != null && m.team1Score != null
                      ? `${m.team0Score} – ${m.team1Score}`
                      : "—"}
                  </td>
                  <td className={m.won ? "text-win" : "text-loss"}>{m.won ? "Win" : "Loss"}</td>
                  <td>
                    {m.kills}/{m.deaths}/{m.assists}
                  </td>
                  <td className={m.eloChange >= 0 ? "text-win" : "text-loss"}>
                    {m.eloChange >= 0 ? "+" : ""}
                    {m.eloChange}
                  </td>
                  <td>
                    {(() => {
                      const links = demoLinks(m.demoShareCode);
                      if (links) {
                        return (
                          <span className="match-demo-links">
                            <button
                              type="button"
                              className="table-link"
                              onClick={() => void window.ranked.openExternal(links.steamUrl)}
                            >
                              Demo
                            </button>
                          </span>
                        );
                      }
                      if (m.demoUrl) {
                        return (
                          <button
                            type="button"
                            className="table-link"
                            onClick={() => void window.ranked.openExternal(m.demoUrl!)}
                          >
                            Demo
                          </button>
                        );
                      }
                      return "—";
                    })()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {footer}
    </div>
  );
}
