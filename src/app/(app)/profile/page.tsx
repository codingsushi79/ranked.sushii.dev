import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LevelBadge } from "@/components/level-badge";
import { KillsIcon, DeathsIcon } from "@/components/stat-icons";
import { getCurrentUser } from "@/lib/session";
import { formatSeasonRange } from "@/lib/dates";
import { getCsrepTrust } from "@/lib/csrep";
import { ProfileActions } from "@/components/profile-actions";
import { AdminBadge } from "@/components/admin-badge";
import { VerifiedBadge } from "@/components/verified-badge";
import { VerifyEmailPrompt } from "@/components/verify-email-prompt";
import { CsrepTrustPanel } from "@/components/csrep-trust-badge";
import { RecentMatchesTable } from "@/components/recent-matches-table";
import { listRecentMatchesForUser } from "@/lib/matches";
import { Target, TrendingUp } from "lucide-react";

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ steam?: string; verify?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const recentMatches = await listRecentMatchesForUser(user.id, 10);
  const canPlay = user.emailVerified;
  const csrep = user.steamId ? await getCsrepTrust(user.steamId) : null;

  const params = await searchParams;
  const steamMessage =
    params.steam === "linked"
      ? "Steam account linked successfully."
      : params.steam === "taken"
        ? "That Steam account is already linked to another user."
        : params.steam === "failed"
          ? "Steam linking failed. Please try again."
          : null;

  const verifyRequired = params.verify === "required" && !canPlay;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="flex flex-col gap-6">
        {steamMessage && (
          <Alert className="animate-in fade-in slide-in-from-top-2 duration-500 fill-mode-both">
            <AlertDescription>{steamMessage}</AlertDescription>
          </Alert>
        )}

        {verifyRequired && (
          <Alert className="animate-in fade-in slide-in-from-top-2 duration-500 fill-mode-both">
            <AlertDescription>
              Verify your email before linking Steam or playing ranked.
            </AlertDescription>
          </Alert>
        )}

        {!canPlay && <VerifyEmailPrompt email={user.email} />}

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between animate-in fade-in slide-in-from-bottom-3 duration-500 fill-mode-both">
          <div className="flex items-center gap-4">
            <Avatar className="size-16">
              {user.steamAvatar && (
                <AvatarImage src={user.steamAvatar} alt={user.username} />
              )}
              <AvatarFallback className="text-lg">
                {user.username.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="flex items-center gap-2 text-2xl font-bold">
                {user.username}
                {user.emailVerified && <VerifiedBadge />}
                {user.isAdmin && <AdminBadge />}
              </h1>
              <p className="text-muted-foreground">
                {user.steamName ?? "Steam not linked"}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <LevelBadge level={user.stats.level} elo={user.stats.elo} />
              </div>
            </div>
          </div>
          <ProfileActions
            canPlay={canPlay}
            hasSteam={!!user.steamId}
            clientId={user.id}
          />
        </div>

        <p className="text-sm text-muted-foreground animate-in fade-in duration-500 fill-mode-both delay-75">
          Season {user.season.number} ·{" "}
          {formatSeasonRange(user.season.startsAt, user.season.endsAt)}
          {user.stats.isPlacing &&
            ` · ${user.stats.placementsRemaining} placement games left`}
        </p>

        {user.steamId && (
          <Card className="animate-in fade-in slide-in-from-bottom-3 duration-500 fill-mode-both delay-100">
            <CardHeader>
              <CardTitle>CSRep trust</CardTitle>
              <CardDescription>
                Your CSRep.gg reputation — visible on your public profile and the
                leaderboard.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CsrepTrustPanel trust={csrep} />
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "W / L", value: `${user.stats.wins} / ${user.stats.losses}` },
            { label: "Kills", value: user.stats.kills, icon: <KillsIcon /> },
            { label: "Deaths", value: user.stats.deaths, icon: <DeathsIcon /> },
            { label: "K/D", value: user.stats.kd.toFixed(2), icon: <Target /> },
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

        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { label: "Assists", value: user.stats.assists },
            { label: "Headshots", value: user.stats.headshots },
            { label: "MVPs", value: user.stats.mvps },
          ].map((stat, i) => (
            <Card
              key={stat.label}
              className="animate-in fade-in slide-in-from-bottom-3 duration-500 fill-mode-both"
              style={{ animationDelay: `${400 + i * 60}ms` }}
            >
              <CardHeader className="pb-2">
                <CardDescription>{stat.label}</CardDescription>
                <CardTitle>{stat.value}</CardTitle>
              </CardHeader>
            </Card>
          ))}
        </div>

        <Card className="animate-in fade-in slide-in-from-bottom-3 duration-500 fill-mode-both delay-300">
          <CardHeader>
            <CardTitle>Recent matches</CardTitle>
            <CardDescription>
              Click a match for full scoreboard and demo link.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RecentMatchesTable matches={recentMatches} />
          </CardContent>
        </Card>

        <Card className="animate-in fade-in slide-in-from-bottom-3 duration-500 fill-mode-both delay-400">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp />
              Public profile
            </CardTitle>
            <CardDescription>
              Share your stats page with others once Steam is linked.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" asChild>
              <Link href={`/players/${user.username}`}>View public profile</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
