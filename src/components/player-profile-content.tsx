import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AdminBadge } from "@/components/admin-badge";
import { VerifiedBadge } from "@/components/verified-badge";
import { LevelBadge } from "@/components/level-badge";
import { KillsIcon, DeathsIcon } from "@/components/stat-icons";
import {
  CsrepTrustBadge,
  CsrepTrustPanel,
} from "@/components/csrep-trust-badge";
import { LiveMatchStatus } from "@/components/live-match-status";
import {
  RecentMatchesTable,
  type RecentMatchRow,
} from "@/components/recent-matches-table";
import type { PlayerProfileData } from "@/lib/player-profile";
import type { ReactNode } from "react";
import { Target } from "lucide-react";

export function PlayerProfileContent({
  profile,
  showSeasonDates = false,
  headerActions,
}: {
  profile: PlayerProfileData;
  showSeasonDates?: boolean;
  headerActions?: ReactNode;
}) {
  const seasonMeta = showSeasonDates
    ? `${profile.season.label}${
        profile.stats.isPlacing
          ? ` · ${profile.stats.placementsRemaining} placement games left`
          : ""
      }`
    : `Season ${profile.season.number}`;

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between animate-in fade-in slide-in-from-bottom-3 duration-500 fill-mode-both">
        <div className="flex items-center gap-4">
          <Avatar className="size-20">
            {profile.steamAvatar && (
              <AvatarImage src={profile.steamAvatar} alt={profile.username} />
            )}
            <AvatarFallback className="text-xl">
              {profile.username.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="flex items-center gap-2 text-3xl font-bold">
              {profile.username}
              {profile.steamId && <VerifiedBadge />}
              {profile.isAdmin && <AdminBadge />}
            </h1>
            <p className="text-muted-foreground">
              {profile.steamName ?? "Steam not linked"}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <LevelBadge level={profile.stats.level} elo={profile.stats.elo} />
              {profile.steamId && (
                <CsrepTrustBadge trust={profile.csrep ?? undefined} linked />
              )}
              {profile.stats.isPlacing && (
                <Badge variant="outline">Placements</Badge>
              )}
              <span className="text-sm text-muted-foreground">{seasonMeta}</span>
            </div>
          </div>
        </div>
        {headerActions}
      </div>

      <LiveMatchStatus username={profile.username} initial={profile.live} />

      {profile.steamId && (
        <Card className="animate-in fade-in slide-in-from-bottom-3 duration-500 fill-mode-both delay-100">
          <CardHeader>
            <CardTitle>CSRep trust</CardTitle>
            <CardDescription>
              Community reputation from CSRep.gg for this Steam account.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CsrepTrustPanel trust={profile.csrep} />
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: "W / L",
            value: `${profile.stats.wins} / ${profile.stats.losses}`,
          },
          { label: "Win rate", value: `${profile.stats.winRate}%` },
          { label: "Kills", value: profile.stats.kills, icon: <KillsIcon /> },
          { label: "Deaths", value: profile.stats.deaths, icon: <DeathsIcon /> },
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
              <CardTitle className="text-2xl tabular-nums">{stat.value}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "K/D", value: profile.stats.kd.toFixed(2), icon: <Target /> },
          { label: "Assists", value: profile.stats.assists },
          { label: "Headshots", value: profile.stats.headshots },
          { label: "MVPs", value: profile.stats.mvps },
        ].map((stat, i) => (
          <Card
            key={stat.label}
            className="animate-in fade-in slide-in-from-bottom-3 duration-500 fill-mode-both"
            style={{ animationDelay: `${400 + i * 60}ms` }}
          >
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-1.5">
                {stat.icon}
                {stat.label}
              </CardDescription>
              <CardTitle className="tabular-nums">{stat.value}</CardTitle>
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
          <RecentMatchesTable
            matches={profile.recentMatches as RecentMatchRow[]}
          />
        </CardContent>
      </Card>

      {profile.steamId && (
        <p className="text-sm text-muted-foreground">
          <Link
            href={`https://steamcommunity.com/profiles/${profile.steamId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline-offset-4 hover:underline"
          >
            View on Steam
          </Link>
        </p>
      )}
    </>
  );
}
