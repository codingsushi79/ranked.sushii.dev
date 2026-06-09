import { LevelRingWithElo } from "./LevelRing";
import { CsrepTrustBadge } from "./CsrepTrustBadge";
import { MatchTrackingPanel } from "./MatchTrackingPanel";
import type { AppView, BridgeStatus, ClientProfile } from "../lib/types";

export function HomeView({
  profile,
  status,
  onNavigate,
}: {
  profile: ClientProfile;
  status: BridgeStatus | null;
  onNavigate: (view: AppView) => void;
}) {
  return (
    <div className="page-stack">
      <header className="page-header">
        <div>
          <h1 className="page-title">Welcome back, {profile.username}</h1>
          <p className="page-subtitle">
            Season {profile.season.number} · {profile.season.label}
            {profile.stats.isPlacing &&
              ` · ${profile.stats.placementsRemaining} placement games left`}
          </p>
          {profile.csrep && (
            <div className="profile-trust-row">
              <CsrepTrustBadge trust={profile.csrep} />
            </div>
          )}
        </div>
      </header>

      {!profile.canPlay && (
        <div className="card-surface alert-card">
          <h3 className="section-label">Setup required</h3>
          {!profile.emailVerified && (
            <p className="ranked-meta">Verify your email on the website to play ranked.</p>
          )}
          {profile.emailVerified && !profile.steamId && (
            <p className="ranked-meta">Link Steam on the website to report matches.</p>
          )}
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => void window.ranked.openExternal(`${status?.apiUrl ?? ""}/profile`)}
          >
            Finish setup in browser
          </button>
        </div>
      )}

      <div className="home-grid">
        <div className="card-surface home-stat-card">
          <LevelRingWithElo elo={profile.stats.elo} level={profile.stats.level} size={72} />
          <div className="home-stat-copy">
            <p className="home-stat-value">
              {profile.stats.wins}W · {profile.stats.losses}L
            </p>
            <p className="ranked-meta">{profile.stats.winRate}% win rate · K/D {profile.stats.kd.toFixed(2)}</p>
          </div>
        </div>

        <div className="card-surface home-stat-card">
          <p className="section-label">Recent activity</p>
          {profile.recentMatches.length === 0 ? (
            <p className="ranked-meta">No matches yet — play a rated game with tracking on.</p>
          ) : (
            <ul className="home-match-list">
              {profile.recentMatches.slice(0, 3).map((m) => (
                <li key={m.matchId}>
                  <button
                    type="button"
                    className="home-match-row"
                    onClick={() => onNavigate({ kind: "match", id: m.matchId })}
                  >
                    <span>{m.map}</span>
                    <span className={m.won ? "text-win" : "text-loss"}>
                      {m.won ? "Win" : "Loss"} {m.eloChange >= 0 ? "+" : ""}
                      {m.eloChange}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => onNavigate({ kind: "profile" })}
          >
            View profile
          </button>
        </div>
      </div>

      <MatchTrackingPanel status={status} />
    </div>
  );
}
