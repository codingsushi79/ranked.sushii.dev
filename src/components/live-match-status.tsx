"use client";

import { useEffect, useState } from "react";
import { formatMapName } from "@/lib/demo";
import type { PlayerLiveSnapshot } from "@/lib/player-live";
import { cn } from "@/lib/utils";

function formatMode(mode: string) {
  const key = mode.toLowerCase().trim();
  if (key === "competitive" || key === "comp") return "Competitive";
  if (key === "premier") return "Premier";
  return key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function LiveMatchStatus({
  username,
  initial,
  className,
}: {
  username: string;
  initial?: PlayerLiveSnapshot | null;
  className?: string;
}) {
  const [live, setLive] = useState<PlayerLiveSnapshot | null>(initial ?? null);

  useEffect(() => {
    setLive(initial ?? null);
  }, [initial, username]);

  useEffect(() => {
    let cancelled = false;

    async function refresh() {
      try {
        const res = await fetch(`/api/players/${encodeURIComponent(username)}/live`, {
          cache: "no-store",
        });
        const data = await res.json();
        if (!cancelled && res.ok) {
          setLive((data.live as PlayerLiveSnapshot | null) ?? null);
        }
      } catch {
        /* ignore */
      }
    }

    void refresh();
    const id = setInterval(() => void refresh(), 5000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [username]);

  if (!live?.inMatch) return null;

  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4",
        className
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-semibold text-emerald-400">
          <span className="size-1.5 rounded-full bg-emerald-400 motion-safe:animate-pulse" />
          Live
        </span>
        <span className="text-sm text-muted-foreground">
          {formatMapName(live.map)} · {formatMode(live.mode)}
        </span>
      </div>
      <div className="flex items-center gap-3">
        <span className="font-mono text-3xl font-bold tabular-nums text-foreground">
          {live.playerScore}
        </span>
        <span className="text-xl font-medium text-muted-foreground">–</span>
        <span className="font-mono text-3xl font-bold tabular-nums text-muted-foreground">
          {live.opponentScore}
        </span>
      </div>
    </div>
  );
}
