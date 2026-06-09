import { LeaderboardView } from "@/components/leaderboard-view";
import { getCurrentUser } from "@/lib/session";

export default async function LeaderboardPage() {
  const user = await getCurrentUser();

  return (
    <LeaderboardView
      defaultLevel={user && !user.stats.isPlacing ? user.stats.level : null}
      viewerUsername={user?.username ?? null}
    />
  );
}
