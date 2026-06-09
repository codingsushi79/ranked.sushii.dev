import { notFound } from "next/navigation";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { ensureCurrentSeason, getOrCreatePlayerSeason, kdRatio } from "@/lib/player";
import { eloToLevel, PLACEMENT_GAMES } from "@/lib/elo";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LevelBadge } from "@/components/level-badge";
import { KillsIcon, DeathsIcon } from "@/components/stat-icons";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AdminBadge } from "@/components/admin-badge";
import { VerifiedBadge } from "@/components/verified-badge";
import { RecentMatchesTable } from "@/components/recent-matches-table";
import { listRecentMatchesForUser } from "@/lib/matches";
import { getCsrepTrust } from "@/lib/csrep";
import { CsrepTrustBadge, CsrepTrustPanel } from "@/components/csrep-trust-badge";

export default async function PlayerProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;

  const user = await db.query.users.findFirst({
    where: eq(users.username, username),
  });
  if (!user) notFound();

  const season = await ensureCurrentSeason();
  const ps = await getOrCreatePlayerSeason(user.id, season.id);

  const recentMatches = await listRecentMatchesForUser(user.id, 10);
  const csrep = user.steamId ? await getCsrepTrust(user.steamId) : null;

  const kd = kdRatio(ps.kills, ps.deaths);
  const winRate =
    ps.wins + ps.losses > 0
      ? Math.round((ps.wins / (ps.wins + ps.losses)) * 100)
      : 0;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-4 animate-in fade-in slide-in-from-bottom-3 duration-500 fill-mode-both">
          <Avatar className="size-20">
            {user.steamAvatar && (
              <AvatarImage src={user.steamAvatar} alt={user.username} />
            )}
            <AvatarFallback className="text-xl">
              {user.username.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="flex items-center gap-2 text-3xl font-bold">
              {user.username}
              {user.emailVerified && <VerifiedBadge />}
              {user.isAdmin && <AdminBadge />}
            </h1>
            {user.steamName && (
              <p className="text-muted-foreground">{user.steamName}</p>
            )}
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <LevelBadge level={eloToLevel(ps.elo)} elo={ps.elo} />
              {csrep && <CsrepTrustBadge trust={csrep} />}
              {ps.placementGames < PLACEMENT_GAMES && (
                <Badge variant="outline">Placements</Badge>
              )}
              <span className="text-sm text-muted-foreground">
                Season {season.number}
              </span>
            </div>
          </div>
        </div>

        {user.steamId && (
          <Card className="animate-in fade-in slide-in-from-bottom-3 duration-500 fill-mode-both delay-100">
            <CardHeader>
              <CardTitle>CSRep trust</CardTitle>
              <CardDescription>
                Community reputation from CSRep.gg for this Steam account.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CsrepTrustPanel trust={csrep} />
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Win rate", value: `${winRate}%` },
            { label: "Kills", value: ps.kills, icon: <KillsIcon /> },
            { label: "Deaths", value: ps.deaths, icon: <DeathsIcon /> },
            { label: "K/D", value: kd.toFixed(2) },
          ].map((stat, i) => (
            <Card
              key={stat.label}
              className="animate-in fade-in slide-in-from-bottom-3 duration-500 fill-mode-both"
              style={{ animationDelay: `${150 + i * 60}ms` }}
            >
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-1.5">
                  {stat.icon}
                  {stat.label}
                </CardDescription>
                <CardTitle>{stat.value}</CardTitle>
              </CardHeader>
            </Card>
          ))}
        </div>

        <Card className="animate-in fade-in slide-in-from-bottom-3 duration-500 fill-mode-both delay-300">
          <CardHeader>
            <CardTitle>Recent matches</CardTitle>
            <CardDescription>Last 10 rated games this season</CardDescription>
          </CardHeader>
          <CardContent>
            <RecentMatchesTable matches={recentMatches} />
          </CardContent>
        </Card>

        {user.steamId && (
          <p className="text-sm text-muted-foreground">
            <Link
              href={`https://steamcommunity.com/profiles/${user.steamId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="underline-offset-4 hover:underline"
            >
              View on Steam
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
