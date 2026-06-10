import { PlayerProfileBody } from "./PlayerProfileBody";
import type { AppView, ClientProfile } from "../lib/types";

export function ProfileView({
  profile,
  onNavigate,
  onRefresh,
}: {
  profile: ClientProfile;
  onNavigate: (view: AppView) => void;
  onRefresh: () => Promise<void>;
}) {
  const seasonLabel = profile.season.label;

  const setupActions = !profile.canPlay ? (
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
            onClick={() =>
              void window.ranked
                .getApiUrl()
                .then((url) => window.ranked.openExternal(`${url}/api/steam/link`))
            }
          >
            Link Steam
          </button>
        )}
        <button type="button" className="btn btn-secondary" onClick={() => void onRefresh()}>
          Refresh account
        </button>
      </div>
    </div>
  ) : null;

  return (
    <PlayerProfileBody
      username={profile.username}
      steamName={profile.steamName}
      steamAvatar={profile.steamAvatar}
      steamId={profile.steamId}
      seasonLabel={seasonLabel}
      stats={profile.stats}
      csrep={profile.csrep}
      live={profile.live}
      recentMatches={profile.recentMatches}
      onNavigate={onNavigate}
      setupActions={setupActions}
      footer={
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => onNavigate({ kind: "player", username: profile.username })}
        >
          View public profile
        </button>
      }
    />
  );
}
