import type { AppView, ClientProfile } from "../lib/types";
import { initials } from "../lib/types";
import { LevelBadge } from "./LevelBadge";

const NAV: { kind: AppView["kind"]; label: string }[] = [
  { kind: "home", label: "Home" },
  { kind: "leaderboard", label: "Leaderboard" },
  { kind: "profile", label: "Profile" },
  { kind: "tracking", label: "Tracking" },
];

export function AppNav({
  view,
  profile,
  onNavigate,
  onLogout,
  onOpenSite,
}: {
  view: AppView;
  profile: ClientProfile;
  onNavigate: (view: AppView) => void;
  onLogout: () => void;
  onOpenSite: () => void;
}) {
  return (
    <aside className="app-nav">
      <div className="app-nav-brand">
        <span className="app-nav-logo">RC</span>
        <div>
          <p className="app-nav-title">Ranked CS2</p>
          <p className="app-nav-sub">Season {profile.season.number}</p>
        </div>
      </div>

      <div className="app-nav-user">
        <div className="ranked-linked-avatar" aria-hidden>
          {profile.steamAvatar ? (
            <img src={profile.steamAvatar} alt="" />
          ) : (
            <span>{initials(profile.username)}</span>
          )}
        </div>
        <div>
          <p className="app-nav-username">{profile.username}</p>
          <div className="app-nav-meta">
            <LevelBadge
              level={profile.stats.level}
              elo={profile.stats.elo}
              compact
            />
          </div>
        </div>
      </div>

      <nav className="app-nav-links">
        {NAV.map((item) => (
          <button
            key={item.kind}
            type="button"
            className={`app-nav-link ${view.kind === item.kind ? "is-active" : ""}`}
            onClick={() => onNavigate({ kind: item.kind })}
          >
            {item.label}
          </button>
        ))}
      </nav>

      <div className="app-nav-footer">
        <button type="button" className="btn btn-secondary app-nav-action" onClick={onOpenSite}>
          Open website
        </button>
        <button type="button" className="btn btn-secondary app-nav-action" onClick={onLogout}>
          Sign out
        </button>
      </div>
    </aside>
  );
}
