interface ConnectionStatusProps {
  compact?: boolean;
  showStatusPills?: boolean;
  overlayScoreboard?: boolean;
  cs2Connected: boolean;
  twitchConnected: boolean;
  gsiInstalled: boolean;
  mapName?: string;
  round?: number;
  scoreCT?: number;
  scoreT?: number;
  playerName?: string;
  team?: string;
}

export function ConnectionStatus({
  compact = false,
  showStatusPills = true,
  overlayScoreboard = false,
  cs2Connected,
  twitchConnected,
  gsiInstalled,
  mapName,
  round,
  scoreCT = 0,
  scoreT = 0,
  playerName,
  team,
}: ConnectionStatusProps) {
  if (overlayScoreboard) {
    const playerTeam = normalizeTeam(team);
    const roundLabel = typeof round === "number" ? round : "—";

    if (!playerTeam) {
      return (
        <section className="connection-panel connection-panel-overlay-score">
          <div className="overlay-scoreboard">
            <strong className="overlay-score overlay-score-ct">{scoreCT}</strong>
            <span className="overlay-round">Round {roundLabel}</span>
            <strong className="overlay-score overlay-score-t">{scoreT}</strong>
          </div>
        </section>
      );
    }

    const ourTeam = playerTeam;
    const theirTeam = ourTeam === "CT" ? "T" : "CT";
    const ourScore = ourTeam === "CT" ? scoreCT : scoreT;
    const theirScore = theirTeam === "CT" ? scoreCT : scoreT;

    return (
      <section className="connection-panel connection-panel-overlay-score">
        <div className="overlay-scoreboard">
          <strong className={`overlay-score overlay-score-${ourTeam.toLowerCase()}`}>
            {ourScore}
          </strong>
          <span className="overlay-round">Round {roundLabel}</span>
          <strong className={`overlay-score overlay-score-${theirTeam.toLowerCase()}`}>
            {theirScore}
          </strong>
        </div>
      </section>
    );
  }

  return (
    <section className={`connection-panel ${compact ? "connection-panel-compact" : ""}`}>
      {showStatusPills && (
        <div className="status-row">
          <StatusPill label="CS2" active={cs2Connected} />
          <StatusPill label="Twitch" active={twitchConnected} />
          <StatusPill label="GSI" active={gsiInstalled} />
        </div>
      )}

      {!compact && (
        <div className="match-banner">
          <div>
            <p className="eyebrow">Live Match</p>
            <h2>{mapName && mapName !== "menu" ? formatMapName(mapName) : "Waiting for match"}</h2>
            {playerName ? (
              <p className="subtle">
                {playerName}
                {team ? ` · ${team}` : ""}
              </p>
            ) : (
              <p className="subtle">Launch CS2 and join a game</p>
            )}
          </div>
          <div className="score-block">
            <div className="score-line">
              <span>CT</span>
              <strong>{scoreCT}</strong>
            </div>
            <div className="score-line score-line-t">
              <span>T</span>
              <strong>{scoreT}</strong>
            </div>
            <p className="round-label">Round {typeof round === "number" ? round : "—"}</p>
          </div>
        </div>
      )}
    </section>
  );
}

function StatusPill({ label, active }: { label: string; active: boolean }) {
  return (
    <div className={`status-pill ${active ? "status-pill-active" : ""}`}>
      <span className="status-dot" />
      {label}
    </div>
  );
}

function normalizeTeam(team?: string): "CT" | "T" | null {
  if (!team) return null;
  const normalized = team.toUpperCase();
  if (normalized === "CT" || normalized.includes("COUNTER")) return "CT";
  if (normalized === "T" || normalized.includes("TERROR")) return "T";
  return null;
}

function formatMapName(name: string) {
  return name
    .replace(/^de_/i, "")
    .replace(/^cs_/i, "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}
