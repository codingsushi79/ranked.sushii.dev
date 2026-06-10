import { useEffect, useState } from "react";
import type { AppView } from "../lib/types";
import { LevelBadge } from "./LevelBadge";

type SearchResult = {
  username: string;
  steamName: string | null;
  level: number;
  elo: number;
};

export function PlayerSearch({ onNavigate }: { onNavigate: (view: AppView) => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(() => {
      void window.ranked
        .fetch(`/api/players/search?q=${encodeURIComponent(trimmed)}`)
        .then((data) => setResults((data.players as SearchResult[]) ?? []))
        .catch(() => setResults([]));
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="player-search">
      <input
        type="search"
        className="ranked-input"
        placeholder="Search players"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {results.length > 0 && (
        <ul className="search-results">
          {results.map((p) => (
            <li key={p.username}>
              <button
                type="button"
                className="search-result"
                onClick={() => {
                  setQuery("");
                  setResults([]);
                  onNavigate({ kind: "player", username: p.username });
                }}
              >
                <div className="search-result-copy">
                  <strong>{p.username}</strong>
                  {p.steamName && <span>{p.steamName}</span>}
                </div>
                <LevelBadge level={p.level} elo={p.elo} className="search-result-badge" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
