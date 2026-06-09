"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type RecentMatchRow = {
  matchId: string;
  map: string;
  kills: number;
  deaths: number;
  assists: number;
  eloChange: number;
  won: boolean;
  team0Score?: number | null;
  team1Score?: number | null;
  playedAt: Date;
};

export function RecentMatchesTable({ matches }: { matches: RecentMatchRow[] }) {
  const router = useRouter();

  if (matches.length === 0) {
    return <p className="text-sm text-muted-foreground">No matches yet.</p>;
  }

  return (
    <Table className="animate-in fade-in duration-500 fill-mode-both">
      <TableHeader>
        <TableRow>
          <TableHead>Map</TableHead>
          <TableHead>Score</TableHead>
          <TableHead>Result</TableHead>
          <TableHead>K/D/A</TableHead>
          <TableHead>Elo</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {matches.map((m, i) => (
          <TableRow
            key={m.matchId}
            className="cursor-pointer hover:bg-muted/50 animate-in fade-in slide-in-from-bottom-1 duration-300 fill-mode-both"
            style={{ animationDelay: `${Math.min(i, 10) * 40}ms` }}
            onClick={() => router.push(`/matches/${m.matchId}`)}
          >
            <TableCell>
              <Link
                href={`/matches/${m.matchId}`}
                className="hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                {m.map}
              </Link>
            </TableCell>
            <TableCell className="tabular-nums text-muted-foreground">
              {m.team0Score != null && m.team1Score != null
                ? `${m.team0Score} – ${m.team1Score}`
                : "—"}
            </TableCell>
            <TableCell>
              <Badge variant={m.won ? "default" : "secondary"}>
                {m.won ? "Win" : "Loss"}
              </Badge>
            </TableCell>
            <TableCell className="tabular-nums">
              {m.kills}/{m.deaths}/{m.assists}
            </TableCell>
            <TableCell
              className={cn(
                "tabular-nums",
                m.eloChange >= 0 ? "text-emerald-600" : "text-red-500"
              )}
            >
              {m.eloChange >= 0 ? "+" : ""}
              {m.eloChange}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
