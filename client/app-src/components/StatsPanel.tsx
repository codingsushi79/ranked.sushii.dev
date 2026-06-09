import type { PlayerMatchStats } from "../types";

interface StatsPanelProps {
  stats: PlayerMatchStats;
  kdRatio: string;
}

const statItems = [
  { key: "kills", label: "Kills" },
  { key: "deaths", label: "Deaths" },
  { key: "kd", label: "K/D" },
  { key: "assists", label: "Assists" },
  { key: "adr", label: "ADR" },
] as const;

export function StatsPanel({ stats, kdRatio }: StatsPanelProps) {
  const values: Record<(typeof statItems)[number]["key"], string | number> = {
    kills: stats.kills,
    deaths: stats.deaths,
    kd: kdRatio,
    assists: stats.assists,
    adr: stats.adr.toFixed(1),
  };

  return (
    <section className="stats-panel">
      <div className="section-heading">
        <p className="eyebrow">Scoreboard</p>
        <h3>Match Stats</h3>
      </div>
      <div className="stats-grid stats-grid-compact">
        {statItems.map((item) => (
          <div key={item.key} className="stat-card">
            <span className="stat-label">{item.label}</span>
            <strong className="stat-value">{values[item.key]}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}
