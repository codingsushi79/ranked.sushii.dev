"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { LoadingButton } from "@/components/motion/loading-button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { AdminBadge } from "@/components/admin-badge";
import { SeasonCountdown } from "@/components/season-countdown";
import { formatFinaleMap } from "@/lib/finale-maps";
import { cn } from "@/lib/utils";

type FinalePlayer = {
  userId: string;
  username: string;
  steamName: string | null;
  steamAvatar: string | null;
  rank: number;
  elo: number;
};

type FinaleData = {
  id: string;
  phase: string;
  seasonPhase: string;
  team0Name: string | null;
  team1Name: string | null;
  map: string | null;
  joinLink: string | null;
  gameTime: string | null;
  team0Score: number;
  team1Score: number;
  pickBan: {
    mapPool: string[];
    bannedMaps: string[];
    selectedMap: string | null;
    nextBanBy: 0 | 1 | null;
  };
  team0: FinalePlayer[];
  team1: FinalePlayer[];
  captain0: FinalePlayer | null;
  captain1: FinalePlayer | null;
};

type Access = {
  canView: boolean;
  isTopTen: boolean;
  isAdmin: boolean;
  isCaptain0: boolean;
  isCaptain1: boolean;
};

function TeamRoster({
  name,
  players,
  score,
  isWinner,
  staggerIndex = 0,
}: {
  name: string;
  players: FinaleData["team0"];
  score?: number;
  isWinner?: boolean;
  staggerIndex?: number;
}) {
  return (
    <Card
      className="animate-in fade-in slide-in-from-bottom-3 duration-500 fill-mode-both"
      style={{ animationDelay: `${100 + staggerIndex * 80}ms` }}
    >
      <CardHeader className="pb-3">
        <CardTitle className={cn("text-lg", isWinner && "text-emerald-600")}>
          {name}
          {score != null && (
            <span className="ml-2 font-mono tabular-nums">{score}</span>
          )}
          {isWinner && (
            <Badge className="ml-2" variant="default">
              Winner
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {players.map((p) => (
          <div key={p.userId} className="flex items-center gap-2 text-sm">
            <span className="w-6 font-mono text-muted-foreground">#{p.rank}</span>
            <Avatar className="size-7">
              {p.steamAvatar && (
                <AvatarImage src={p.steamAvatar} alt={p.username} />
              )}
              <AvatarFallback className="text-[10px]">
                {p.username.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <Link href={`/players/${p.username}`} className="hover:underline">
              {p.username}
            </Link>
            <span className="ml-auto tabular-nums text-muted-foreground">
              {p.elo} Elo
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function FinaleServerView({
  initialFinale,
  initialAccess,
}: {
  initialFinale: FinaleData;
  initialAccess: Access;
}) {
  const [finale, setFinale] = useState(initialFinale);
  const [access] = useState(initialAccess);
  const [team0Name, setTeam0Name] = useState(initialFinale.team0Name ?? "");
  const [team1Name, setTeam1Name] = useState(initialFinale.team1Name ?? "");
  const [joinLink, setJoinLink] = useState(initialFinale.joinLink ?? "");
  const [gameTime, setGameTime] = useState(
    initialFinale.gameTime
      ? new Date(initialFinale.gameTime).toISOString().slice(0, 16)
      : ""
  );
  const [team0Score, setTeam0Score] = useState(String(initialFinale.team0Score));
  const [team1Score, setTeam1Score] = useState(String(initialFinale.team1Score));
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    const res = await fetch("/api/finale");
    const data = await res.json();
    if (res.ok && data.finale) {
      setFinale(data.finale);
      setTeam0Score(String(data.finale.team0Score));
      setTeam1Score(String(data.finale.team1Score));
    }
  }, []);

  useEffect(() => {
    if (finale.phase === "live") {
      const id = setInterval(refresh, 5000);
      return () => clearInterval(id);
    }
  }, [finale.phase, refresh]);

  async function banMap(map: string) {
    setLoading(true);
    try {
      const res = await fetch("/api/finale/ban", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ map }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Ban failed");
      await refresh();
      toast.success(`Banned ${formatFinaleMap(map)}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Ban failed");
    } finally {
      setLoading(false);
    }
  }

  async function saveTeamNames() {
    setLoading(true);
    try {
      const res = await fetch("/api/finale/teams", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ team0Name, team1Name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      await refresh();
      toast.success("Team names saved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setLoading(false);
    }
  }

  async function saveAdminSettings() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/finale", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          joinLink: joinLink || null,
          gameTime: gameTime ? new Date(gameTime).toISOString() : null,
          team0Score: Number(team0Score),
          team1Score: Number(team1Score),
          phase: finale.phase,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      await refresh();
      toast.success("Finale updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setLoading(false);
    }
  }

  const mapSelected = !!(finale.map ?? finale.pickBan.selectedMap);
  const remainingMaps = finale.pickBan.mapPool.filter(
    (m) => !finale.pickBan.bannedMaps.includes(m)
  );
  const canBan =
    !mapSelected &&
    (access.isAdmin ||
      (finale.pickBan.nextBanBy === 0 && access.isCaptain0) ||
      (finale.pickBan.nextBanBy === 1 && access.isCaptain1));

  const showJoinInfo =
    mapSelected &&
    (finale.phase === "scheduled" ||
      finale.phase === "live" ||
      finale.phase === "completed");

  return (
    <div className="flex flex-col gap-6">
      <SeasonCountdown />

      <div className="animate-in fade-in slide-in-from-bottom-3 duration-500 fill-mode-both">
        <h1 className="text-3xl font-bold">Season finale server</h1>
        <p className="text-muted-foreground">
          Top 10 showdown · 1, 3, 5, 7, 9 vs 2, 4, 6, 8, 10 · xplay.gg
        </p>
      </div>

      {(finale.phase === "live" || finale.phase === "completed") && (
        <Card className="border-primary/30 animate-in fade-in zoom-in-95 duration-500 fill-mode-both">
          <CardHeader>
            <CardTitle
              className={cn(
                "text-center text-4xl font-bold tabular-nums",
                finale.phase === "live" && "motion-safe:animate-pulse"
              )}
            >
              {finale.team0Name ?? "Team Odds"}{" "}
              <span className="mx-2">{finale.team0Score}</span>
              <span className="text-muted-foreground">–</span>
              <span className="mx-2">{finale.team1Score}</span>{" "}
              {finale.team1Name ?? "Team Evens"}
            </CardTitle>
            {finale.map && (
              <CardDescription className="text-center capitalize">
                {formatFinaleMap(finale.map)}
              </CardDescription>
            )}
          </CardHeader>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <TeamRoster
          name={finale.team0Name ?? "Team Odds"}
          players={finale.team0}
          staggerIndex={0}
          score={
            finale.phase === "live" || finale.phase === "completed"
              ? finale.team0Score
              : undefined
          }
          isWinner={
            finale.phase === "completed" &&
            finale.team0Score > finale.team1Score
          }
        />
        <TeamRoster
          name={finale.team1Name ?? "Team Evens"}
          players={finale.team1}
          staggerIndex={1}
          score={
            finale.phase === "live" || finale.phase === "completed"
              ? finale.team1Score
              : undefined
          }
          isWinner={
            finale.phase === "completed" &&
            finale.team1Score > finale.team0Score
          }
        />
      </div>

      {finale.seasonPhase === "lock_day1" && !mapSelected && (
        <Card className="animate-in fade-in slide-in-from-bottom-3 duration-500 fill-mode-both delay-150">
          <CardHeader>
            <CardTitle>Map veto</CardTitle>
            <CardDescription>
              Captains #{finale.captain0?.username} and #
              {finale.captain1?.username} ban until one map remains (Premier
              style).
              {finale.pickBan.nextBanBy != null && (
                <span className="mt-1 block">
                  Next ban:{" "}
                  <strong>
                    {finale.pickBan.nextBanBy === 0
                      ? finale.captain0?.username
                      : finale.captain1?.username}
                  </strong>
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {remainingMaps.map((map) => (
                <LoadingButton
                  key={map}
                  variant="outline"
                  size="sm"
                  loading={loading}
                  loadingLabel="Banning…"
                  disabled={!canBan}
                  onClick={() => banMap(map)}
                  className="capitalize"
                >
                  Ban {formatFinaleMap(map)}
                </LoadingButton>
              ))}
            </div>
            {finale.pickBan.bannedMaps.length > 0 && (
              <p className="mt-3 text-sm text-muted-foreground">
                Banned:{" "}
                {finale.pickBan.bannedMaps
                  .map((m) => formatFinaleMap(m))
                  .join(", ")}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {mapSelected && (
        <Card className="animate-in fade-in zoom-in-95 duration-500 fill-mode-both">
          <CardHeader>
            <CardTitle className="capitalize">
              Map: {formatFinaleMap(finale.map ?? finale.pickBan.selectedMap!)}
            </CardTitle>
          </CardHeader>
        </Card>
      )}

      {(access.isCaptain0 || access.isCaptain1 || access.isAdmin) &&
        finale.seasonPhase === "lock_day1" && (
          <Card className="animate-in fade-in slide-in-from-bottom-3 duration-500 fill-mode-both delay-200">
            <CardHeader>
              <CardTitle>Team names</CardTitle>
              <CardDescription>
                Captains name their teams before the match is scheduled.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm">
                  {finale.captain0?.username}&apos;s team
                </label>
                <Input
                  value={team0Name}
                  onChange={(e) => setTeam0Name(e.target.value)}
                  disabled={!access.isCaptain0 && !access.isAdmin}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm">
                  {finale.captain1?.username}&apos;s team
                </label>
                <Input
                  value={team1Name}
                  onChange={(e) => setTeam1Name(e.target.value)}
                  disabled={!access.isCaptain1 && !access.isAdmin}
                />
              </div>
              <LoadingButton
                className="sm:col-span-2"
                onClick={saveTeamNames}
                loading={loading}
                loadingLabel="Saving…"
              >
                Save team names
              </LoadingButton>
            </CardContent>
          </Card>
        )}

      {showJoinInfo && finale.joinLink && (
        <Card className="animate-in fade-in slide-in-from-bottom-3 duration-500 fill-mode-both border-emerald-500/25">
          <CardHeader>
            <CardTitle>Join info</CardTitle>
            {finale.gameTime && (
              <CardDescription>
                Game time:{" "}
                {new Date(finale.gameTime).toLocaleString(undefined, {
                  dateStyle: "full",
                  timeStyle: "short",
                })}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent>
            <Button asChild size="lg">
              <a href={finale.joinLink} target="_blank" rel="noopener noreferrer">
                Join on xplay.gg
              </a>
            </Button>
          </CardContent>
        </Card>
      )}

      {access.isAdmin && (
        <Card className="animate-in fade-in slide-in-from-bottom-3 duration-500 fill-mode-both delay-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Admin controls <AdminBadge />
            </CardTitle>
            <CardDescription>
              Set xplay.gg join link and game time after map veto. Update live
              score on match day.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            <div>
              <label className="mb-1 block text-sm">Join link</label>
              <Input
                value={joinLink}
                onChange={(e) => setJoinLink(e.target.value)}
                placeholder="https://xplay.gg/..."
              />
            </div>
            <div>
              <label className="mb-1 block text-sm">Game time</label>
              <Input
                type="datetime-local"
                value={gameTime}
                onChange={(e) => setGameTime(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm">Odds score</label>
                <Input
                  type="number"
                  min={0}
                  value={team0Score}
                  onChange={(e) => setTeam0Score(e.target.value)}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm">Evens score</label>
                <Input
                  type="number"
                  min={0}
                  value={team1Score}
                  onChange={(e) => setTeam1Score(e.target.value)}
                />
              </div>
            </div>
            <LoadingButton
              onClick={saveAdminSettings}
              loading={loading}
              loadingLabel="Saving…"
            >
              Save finale settings
            </LoadingButton>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
