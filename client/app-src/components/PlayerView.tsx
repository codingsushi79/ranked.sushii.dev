import { useEffect, useState } from "react";
import type { AppView, PublicPlayer } from "../lib/types";
import { PlayerProfileBody } from "./PlayerProfileBody";

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
    <PlayerProfileBody
      username={player.username}
      steamName={player.steamName}
      steamAvatar={player.steamAvatar}
      steamId={player.steamId}
      seasonLabel={`Season ${player.season}`}
      stats={player.stats}
      csrep={player.csrep ?? null}
      live={player.live}
      recentMatches={player.recentMatches}
      onNavigate={onNavigate}
      footer={
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => onNavigate({ kind: "leaderboard" })}
        >
          Back to leaderboard
        </button>
      }
    />
  );
}
