"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LevelBadge } from "@/components/level-badge";
import { AdminBadge } from "@/components/admin-badge";
import { VerifiedBadge } from "@/components/verified-badge";
import { cn } from "@/lib/utils";

type SearchPlayer = {
  username: string;
  steamName: string | null;
  steamAvatar: string | null;
  elo: number;
  level: number;
  isAdmin: boolean;
};

export function PlayerSearch({ className }: { className?: string }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchPlayer[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/players/search?q=${encodeURIComponent(q)}`
        );
        const data = await res.json();
        if (res.ok) {
          setResults(data.players ?? []);
          setOpen(true);
        }
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  function goToPlayer(username: string) {
    setQuery("");
    setOpen(false);
    router.push(`/players/${username}`);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && results.length > 0) {
      e.preventDefault();
      goToPlayer(results[0].username);
    }
    if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search players…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.trim().length >= 2 && setOpen(true)}
          onKeyDown={onKeyDown}
          className="h-8 w-44 pl-8 md:w-52"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
        />
      </div>

      {open && query.trim().length >= 2 && (
        <div className="absolute top-full z-50 mt-1 w-full min-w-[16rem] overflow-hidden rounded-lg border bg-popover shadow-md animate-in fade-in slide-in-from-top-2 duration-200 fill-mode-both">
          {loading && results.length === 0 ? (
            <p className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground animate-pulse">
              <span className="size-3 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
              Searching…
            </p>
          ) : results.length === 0 ? (
            <p className="px-3 py-2 text-sm text-muted-foreground">
              No players found
            </p>
          ) : (
            <ul className="max-h-72 overflow-y-auto py-1">
              {results.map((p, i) => (
                <li
                  key={p.username}
                  className="animate-in fade-in slide-in-from-top-1 duration-200 fill-mode-both"
                  style={{ animationDelay: `${i * 30}ms` }}
                >
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted"
                    onClick={() => goToPlayer(p.username)}
                  >
                    <Avatar className="size-7">
                      {p.steamAvatar && (
                        <AvatarImage src={p.steamAvatar} alt={p.username} />
                      )}
                      <AvatarFallback className="text-[10px]">
                        {p.username.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-1.5 truncate font-medium">
                        {p.username}
                        <VerifiedBadge />
                        {p.isAdmin && <AdminBadge />}
                      </p>
                      {p.steamName && (
                        <p className="truncate text-xs text-muted-foreground">
                          {p.steamName}
                        </p>
                      )}
                    </div>
                    <LevelBadge level={p.level} elo={p.elo} className="shrink-0" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
