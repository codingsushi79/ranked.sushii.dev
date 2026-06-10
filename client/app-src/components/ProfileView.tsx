import { PlayerProfileBody } from "./PlayerProfileBody";
import type { AppView, ClientProfile } from "../lib/types";

export function ProfileView({
  profile,
  onNavigate,
}: {
  profile: ClientProfile;
  onNavigate: (view: AppView) => void;
}) {
  const seasonLabel = profile.season.label;

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
