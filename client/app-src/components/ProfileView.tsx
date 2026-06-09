import { LevelRingWithElo } from "./LevelRing";
import { CsrepTrustBadge, CsrepTrustPanel } from "./CsrepTrustBadge";
import type { AppView, ClientProfile } from "../lib/types";
import { formatMap } from "../lib/types";

export function ProfileView({
  profile,
  onNavigate,
  onRefresh,
}: {
  profile: ClientProfile;
  onNavigate: (view: AppView) => void;
  onRefresh: () => Promise<void>;
}) {
  const stats = [
    { label: "Kills", value: profile.stats.kills },
    { label: "Deaths", value: profile.stats.deaths },
    { label: "Assists", value: profile.stats.assists },
    { label: "Headshots", value: profile.stats.headshots },
    { label: "MVPs", value: profile.stats.mvps },
    { label: "Matches", value: profile.stats.matchesPlayed },
  ];

  return (
    <div className="page-stack">
      <header className="page-header page-header-row">
        <div className="profile-head">
          <div className="ranked-linked-avatar profile-avatar" aria-hidden>
            {profile.steamAvatar ? (
              <img src={profile.steamAvatar} alt="" />
            ) : (
              <span>{profile.username.slice(0, 2).toUpperCase()}</span>
            )}
          </div>
          <div>
            <h1 className="page-title">{profile.username}</h1>
            <p className="page-subtitle">
              {profile.steamName ?? "Steam not linked"} · Season {profile.season.number}
            </p>
            {profile.csrep && (
              <div className="profile-trust-row">
                <CsrepTrustBadge trust={profile.csrep} />
              </div>
            )}
          </div>
        </div>
        <LevelRingWithElo elo={profile.stats.elo} level={profile.stats.level} size={64} />
      </header>

      {!profile.canPlay && (
        <div className="card-surface alert-card">
          <h3 className="section-label">Account setup</h3>
          <div className="profile-actions">
            {!profile.emailVerified && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() =>
                  void window.ranked
                    .getApiUrl()
                    .then((url) =>
                      window.ranked.openExternal(
                        `${url}/verify?email=${encodeURIComponent(profile.email)}`
                      )
                    )
                }
              >
                Verify email
              </button>
            )}
            {profile.emailVerified && !profile.steamId && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => void window.ranked.getApiUrl().then((url) => window.ranked.openExternal(`${url}/api/steam/link`))}
              >
                Link Steam
              </button>
            )}
            <button type="button" className="btn btn-secondary" onClick={() => void onRefresh()}>
              Refresh account
            </button>
          </div>
        </div>
      )}

      {profile.steamId && (
        <div className="card-surface">
          <h3 className="section-label">CSRep trust</h3>
          <CsrepTrustPanel trust={profile.csrep} />
        </div>
      )}

      <div className="stat-grid">
        {stats.map((stat) => (
          <div key={stat.label} className="card-surface stat-tile">
            <p className="section-label">{stat.label}</p>
            <p className="stat-value">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="card-surface table-card">
        <h3 className="section-label">Recent matches</h3>
        {profile.recentMatches.length === 0 ? (
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
              </tr>
            </thead>
            <tbody>
              {profile.recentMatches.map((m) => (
                <tr key={m.matchId}>
                  <td>
                    <button
                      type="button"
                      className="table-link"
                      onClick={() => onNavigate({ kind: "match", id: m.matchId })}
                    >
                      {formatMap(m.map)}
                    </button>
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
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <button
        type="button"
        className="btn btn-secondary"
        onClick={() => onNavigate({ kind: "player", username: profile.username })}
      >
        View public profile
      </button>
    </div>
  );
}
