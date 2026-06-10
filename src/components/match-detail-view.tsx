import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AdminBadge } from "@/components/admin-badge";
import type { MatchDetail } from "@/lib/matches";
import { cn } from "@/lib/utils";

type PlayerRow = MatchDetail["team0"][number];

function ScoreboardTable({
  players,
}: {
  players: PlayerRow[];
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Player</TableHead>
          <TableHead className="text-right">K</TableHead>
          <TableHead className="text-right">D</TableHead>
          <TableHead className="text-right">A</TableHead>
          <TableHead className="text-right">HS</TableHead>
          <TableHead className="text-right">MVP</TableHead>
          <TableHead className="text-right">DMG</TableHead>
          <TableHead className="text-right">ADR</TableHead>
          <TableHead className="text-right">K/D</TableHead>
          <TableHead className="text-right">Elo</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {players.map((p, i) => (
          <TableRow
            key={`${p.username ?? p.displayName}-${i}`}
            className={cn(
              p.isRanked
                ? "border-l-2 border-l-primary bg-primary/5"
                : "text-muted-foreground"
            )}
          >
            <TableCell>
              <div className="flex items-center gap-2">
                <Avatar className={cn("size-6", !p.isRanked && "opacity-70")}>
                  {p.steamAvatar && (
                    <AvatarImage src={p.steamAvatar} alt={p.displayName} />
                  )}
                  <AvatarFallback className="text-[10px]">
                    {(p.displayName ?? "?").slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {p.username ? (
                      <Link
                        href={`/players/${p.username}`}
                        className={cn(
                          "flex items-center gap-1.5 truncate font-medium hover:underline",
                          p.isRanked && "text-foreground"
                        )}
                      >
                        {p.displayName}
                        {p.isAdmin && <AdminBadge />}
                      </Link>
                    ) : (
                      <span
                        className={cn(
                          "truncate font-medium",
                          p.isRanked && "text-foreground"
                        )}
                      >
                        {p.displayName}
                      </span>
                    )}
                    {p.isRanked && (
                      <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
                        Ranked
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </TableCell>
            <TableCell className="text-right tabular-nums">{p.kills}</TableCell>
            <TableCell className="text-right tabular-nums">{p.deaths}</TableCell>
            <TableCell className="text-right tabular-nums">{p.assists}</TableCell>
            <TableCell className="text-right tabular-nums">
              {p.headshots ?? 0}
            </TableCell>
            <TableCell className="text-right tabular-nums">{p.mvps ?? 0}</TableCell>
            <TableCell className="text-right tabular-nums">
              {p.damage ?? 0}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {(p.adr ?? 0).toFixed(0)}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {p.kd.toFixed(2)}
            </TableCell>
            <TableCell
              className={cn(
                "text-right tabular-nums",
                p.isRanked &&
                  p.eloChange != null &&
                  (p.eloChange >= 0 ? "font-medium text-emerald-600" : "font-medium text-red-500")
              )}
            >
              {p.isRanked && p.eloChange != null ? (
                <>
                  {p.eloChange >= 0 ? "+" : ""}
                  {p.eloChange}
                </>
              ) : (
                "—"
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export function MatchDetailView({ match }: { match: MatchDetail }) {
  const team0Won = match.winnerTeam === 0;
  const team1Won = match.winnerTeam === 1;
  const scoreLabel =
    match.team0Score != null && match.team1Score != null
      ? `${match.team0Score} – ${match.team1Score}`
      : null;

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-3 duration-500 fill-mode-both">
      <div className="animate-in fade-in duration-500 fill-mode-both">
        <p className="text-sm text-muted-foreground">
          {match.playedAt.toLocaleString()}
          {match.season != null && ` · Season ${match.season}`}
        </p>
        <h1 className="mt-1 text-3xl font-bold capitalize">
          {match.map.replace(/^de_/i, "").replace(/_/g, " ")}
        </h1>
        <p className="text-muted-foreground">
          {match.mode}
          {scoreLabel && ` · ${scoreLabel}`}
        </p>
      </div>

      {(match.demo || match.demoUrl) ? (
        <div className="flex flex-wrap gap-2 animate-in fade-in duration-500 fill-mode-both delay-100">
          {match.demo && (
            <>
              <a
                href={match.demo.steamUrl}
                className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                Watch demo in CS2
              </a>
              <a
                href={match.demo.webUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-9 items-center justify-center rounded-md border px-4 text-sm font-medium hover:bg-muted"
              >
                Open in browser
              </a>
            </>
          )}
          {match.demoUrl && (
            <a
              href={match.demoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-9 items-center justify-center rounded-md border px-4 text-sm font-medium hover:bg-muted"
            >
              Demo link
            </a>
          )}
          {match.demo?.shareCode && (
            <code className="flex items-center rounded-md bg-muted px-3 py-1.5 text-xs">
              {match.demo.shareCode}
            </code>
          )}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground animate-in fade-in duration-500 fill-mode-both delay-100">
          Demo link unavailable for this match.
        </p>
      )}

      <div className="space-y-3 animate-in fade-in slide-in-from-bottom-3 duration-500 fill-mode-both delay-150">
        <h2
          className={cn(
            "text-lg font-semibold",
            team0Won ? "text-emerald-600" : "text-muted-foreground"
          )}
        >
          Team 1 {team0Won && "(Winner)"}
          {match.team0Score != null && (
            <span className="ml-2 tabular-nums">{match.team0Score}</span>
          )}
        </h2>
        <ScoreboardTable players={match.team0} />
      </div>

      <div className="space-y-3 animate-in fade-in slide-in-from-bottom-3 duration-500 fill-mode-both delay-200">
        <h2
          className={cn(
            "text-lg font-semibold",
            team1Won ? "text-emerald-600" : "text-muted-foreground"
          )}
        >
          Team 2 {team1Won && "(Winner)"}
          {match.team1Score != null && (
            <span className="ml-2 tabular-nums">{match.team1Score}</span>
          )}
        </h2>
        <ScoreboardTable players={match.team1} />
      </div>
    </div>
  );
}
