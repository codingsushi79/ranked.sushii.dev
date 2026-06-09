import { useEffect, useState } from "react";
import type { AppView } from "../lib/types";

type SearchResult = { username: string; steamName: string | null };

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
                <strong>{p.username}</strong>
                {p.steamName && <span>{p.steamName}</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
