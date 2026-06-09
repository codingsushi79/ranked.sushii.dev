"use client";

import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

function formatDuration(ms: number) {
  if (ms <= 0) return "0s";
  const totalSec = Math.floor(ms / 1000);
  const days = Math.floor(totalSec / 86400);
  const hours = Math.floor((totalSec % 86400) / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;

  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0 || days > 0) parts.push(`${hours}h`);
  if (minutes > 0 || hours > 0 || days > 0) parts.push(`${minutes}m`);
  parts.push(`${seconds}s`);
  return parts.join(" ");
}

type SeasonStatus = {
  season: number;
  phase: string;
  isLocked: boolean;
  lockStartsAt: string;
  seasonEndsAt: string;
  msUntilLock: number;
  msUntilSeasonEnd: number;
};

export function SeasonCountdown({ className }: { className?: string }) {
  const [status, setStatus] = useState<SeasonStatus | null>(null);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    fetch("/api/season")
      .then((r) => r.json())
      .then(setStatus)
      .catch(() => {});
  }, []);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!status) {
    return (
      <Skeleton
        className={cn("h-[4.25rem] w-full animate-ranked-shimmer rounded-lg", className)}
      />
    );
  }

  const lockAt = new Date(status.lockStartsAt).getTime();
  const endAt = new Date(status.seasonEndsAt).getTime();
  const msUntilLock = Math.max(0, lockAt - now);
  const msUntilEnd = Math.max(0, endAt - now);

  let label: string;
  let target: number;

  if (status.phase === "regular") {
    label = "Rankings lock in";
    target = msUntilLock;
  } else if (status.phase === "lock_day1") {
    label = "Finale pick/ban day · game in";
    target = Math.max(0, endAt - 2 * 86400000 - now);
  } else if (status.phase === "lock_day2") {
    label = "Finale match day · results shown for";
    target = Math.max(0, endAt - 86400000 - now);
  } else if (status.phase === "lock_day3") {
    label = "Season ends in";
    target = msUntilEnd;
  } else {
    return null;
  }

  return (
    <div
      className={cn(
        "rounded-lg border bg-muted/40 px-4 py-3 text-sm animate-in fade-in slide-in-from-top-2 duration-500 fill-mode-both",
        status.isLocked && "border-amber-500/30 bg-amber-500/5",
        className
      )}
    >
      <p className="text-muted-foreground">
        Season {status.season}
        {status.isLocked && (
          <span className="ml-2 font-medium text-amber-600 dark:text-amber-400">
            · Rankings locked
          </span>
        )}
      </p>
      <p className="mt-0.5 font-medium tabular-nums">
        {label}{" "}
        <span className="font-mono text-base">{formatDuration(target)}</span>
      </p>
    </div>
  );
}
