"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { LevelBadge } from "@/components/level-badge";
import { KillsIcon, DeathsIcon } from "@/components/stat-icons";
import { AdminBadge } from "@/components/admin-badge";
import { VerifiedBadge } from "@/components/verified-badge";
import { SeasonCountdown } from "@/components/season-countdown";
import { cn } from "@/lib/utils";
import { Crosshair } from "lucide-react";

type LeaderboardPlayer = {
  rank: number;
  username: string;
  steamName: string | null;
  steamAvatar: string | null;
  steamId: string | null;
  isAdmin: boolean;
  emailVerified: boolean;
  elo: number;
  level: number;
  wins: number;
  losses: number;
  kills: number;
  deaths: number;
  kd: number;
};

type ViewerInfo = {
  username: string;
  level: number;
  rank: number | null;
  rankAtLevel: number | null;
  inList: boolean;
};

type LevelFilter = number | null;

export function LeaderboardView({
  defaultLevel,
  viewerUsername,
}: {
  defaultLevel: LevelFilter;
  viewerUsername: string | null;
}) {
  const [level, setLevel] = useState<LevelFilter>(defaultLevel);
  const [season, setSeason] = useState<number | null>(null);
  const [players, setPlayers] = useState<LeaderboardPlayer[]>([]);
  const [viewer, setViewer] = useState<ViewerInfo | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const rowRefs = useRef<Map<string, HTMLTableRowElement>>(new Map());
  const [loading, setLoading] = useState(true);
  const scrollAfterLoad = useRef(false);

  const load = useCallback((filter: LevelFilter) => {
    setLoading(true);
    const query = filter == null ? "all" : String(filter);
    return fetch(`/api/leaderboard?level=${query}`)
      .then((r) => r.json())
      .then((data) => {
        setSeason(data.season);
        setIsLocked(!!data.isLocked);
        setPlayers(data.players ?? []);
        setViewer(data.viewer ?? null);
        return data as { viewer?: ViewerInfo | null };
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load(level).then((data) => {
      if (!scrollAfterLoad.current || !viewerUsername) return;
      scrollAfterLoad.current = false;
      requestAnimationFrame(() => {
        const row = rowRefs.current.get(viewerUsername);
        if (row) {
          row.scrollIntoView({ behavior: "smooth", block: "center" });
        } else {
          const v = data?.viewer;
          const rank = level == null ? v?.rank : v?.rankAtLevel;
          if (rank) {
            toast.message(`You're #${rank} on this board (outside top 100)`);
          }
        }
      });
    });
  }, [level, load, viewerUsername]);

  function attemptScrollToViewer(targetLevel: number) {
    const v = viewer;
    if (!viewerUsername) {
      toast.error("Sign in to find your rank");
      return;
    }
    if (!v && !loading) {
      toast.error("Complete 5 placement games to appear on the leaderboard");
      return;
    }

    if (level !== targetLevel) {
      scrollAfterLoad.current = true;
      setLevel(targetLevel);
      return;
    }

    const row = rowRefs.current.get(viewerUsername);
    if (row) {
      row.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    const rank = level == null ? v?.rank : v?.rankAtLevel;
    if (rank) {
      toast.message(`You're #${rank} on this board (outside top 100)`);
    } else {
      toast.error("Complete 5 placement games to appear on the leaderboard");
    }
  }

  function scrollToViewer() {
    attemptScrollToViewer(viewer?.level ?? level ?? 1);
  }

  const filterLabel =
    level == null ? "Overall" : `Level ${level}`;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <SeasonCountdown className="mb-6" />

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between animate-in fade-in slide-in-from-bottom-3 duration-500 fill-mode-both">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Leaderboard</h1>
          <p className="text-muted-foreground">
            Global rankings{season ? ` · Season ${season}` : ""}. Filter by level
            on the right — defaults to your level when signed in.
          </p>
        </div>
        {viewerUsername && (
          <Button variant="outline" size="sm" onClick={scrollToViewer}>
            <Crosshair data-icon="inline-start" />
            My rank
          </Button>
        )}
      </div>

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <Card className="min-w-0 flex-1 animate-in fade-in slide-in-from-bottom-3 duration-500 fill-mode-both delay-75">
          <CardHeader>
            <CardTitle>{filterLabel}</CardTitle>
            <CardDescription>
              {level == null
                ? "Top players by Elo across all levels."
                : `Players ranked within the Level ${level} Elo bracket.`}
              {isLocked && (
                <span className="mt-1 block text-amber-600 dark:text-amber-400">
                  Rankings locked for season finale — no new rated matches count.
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex flex-col gap-2 animate-in fade-in duration-300">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton
                    key={i}
                    className="h-10 w-full animate-ranked-shimmer"
                    style={{ animationDelay: `${i * 75}ms` }}
                  />
                ))}
              </div>
            ) : players.length === 0 ? (
              <p className="py-8 text-center text-muted-foreground">
                No ranked players yet{level != null ? " at this level" : ""}.
              </p>
            ) : (
              <Table className="animate-in fade-in duration-500 fill-mode-both">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Player</TableHead>
                    <TableHead>Level</TableHead>
                    <TableHead>Elo</TableHead>
                    <TableHead>W/L</TableHead>
                    <TableHead>
                      <span className="flex items-center gap-1">
                        <KillsIcon />/<DeathsIcon /> K/D
                      </span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {players.map((p) => {
                    const isYou = p.username === viewerUsername;
                    return (
                      <TableRow
                        key={p.username}
                        ref={(el) => {
                          if (el) rowRefs.current.set(p.username, el);
                          else rowRefs.current.delete(p.username);
                        }}
                        className={cn(
                          isYou && "bg-primary/5",
                          "animate-in fade-in slide-in-from-bottom-1 duration-300 fill-mode-both"
                        )}
                        style={{ animationDelay: `${Math.min(p.rank - 1, 15) * 30}ms` }}
                      >
                        <TableCell className="font-mono text-muted-foreground">
                          {p.rank}
                        </TableCell>
                        <TableCell>
                          <Link
                            href={`/players/${p.username}`}
                            className="flex items-center gap-2 hover:underline"
                          >
                            <Avatar className="size-7">
                              {p.steamAvatar && (
                                <AvatarImage
                                  src={p.steamAvatar}
                                  alt={p.username}
                                />
                              )}
                              <AvatarFallback>
                                {p.username.slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className="flex items-center gap-1.5 font-medium">
                              {p.username}
                              {p.emailVerified && (
                                <VerifiedBadge className="align-middle" />
                              )}
                              {p.isAdmin && <AdminBadge className="align-middle" />}
                              {isYou && (
                                <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                                  (you)
                                </span>
                              )}
                            </span>
                          </Link>
                        </TableCell>
                        <TableCell>
                          <LevelBadge level={p.level} elo={p.elo} />
                        </TableCell>
                        <TableCell className="tabular-nums font-medium">
                          {p.elo}
                        </TableCell>
                        <TableCell className="tabular-nums">
                          {p.wins}/{p.losses}
                        </TableCell>
                        <TableCell className="tabular-nums">
                          {p.kd.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <aside className="w-full shrink-0 lg:w-44 animate-in fade-in slide-in-from-right-3 duration-500 fill-mode-both delay-150">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Filter by level</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-1 p-2 pt-0">
              <Button
                variant={level == null ? "default" : "ghost"}
                size="sm"
                className="w-full justify-start"
                onClick={() => setLevel(null)}
              >
                Overall
              </Button>
              <div className="flex max-h-[min(24rem,50vh)] flex-col gap-0.5 overflow-y-auto">
                {Array.from({ length: 20 }, (_, i) => i + 1).map((l) => (
                  <Button
                    key={l}
                    variant={level === l ? "default" : "ghost"}
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => setLevel(l)}
                  >
                    Level {l}
                    {viewer?.level === l && viewerUsername && (
                      <span className="ml-auto text-xs opacity-70">you</span>
                    )}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
