import type { PollState } from "../types";

interface PollPanelProps {
  poll: PollState | null;
  pollPhase: "idle" | "active" | "closing" | "closed";
}

export function PollPanel({ poll, pollPhase }: PollPanelProps) {
  const showStandings = poll && (pollPhase === "active" || pollPhase === "closing" || pollPhase === "closed");
  const totalVotes = poll?.totalVotes ?? 0;

  return (
    <section className="poll-panel">
      <div className="section-heading poll-heading">
        <div>
          <p className="eyebrow">Twitch Poll</p>
          <h3>{poll?.title ?? "Match Win Poll"}</h3>
        </div>
        <span className={`poll-badge poll-badge-${pollPhase}`}>{formatPhase(pollPhase)}</span>
      </div>

      {!showStandings && (
        <div className="poll-empty">
          <p>
            A match-win poll opens when the game goes live. Viewers vote on the whole game,
            but submissions close when round 1 ends.
          </p>
        </div>
      )}

      {showStandings && poll && (
        <div className="poll-choices">
          {poll.choices.map((choice) => {
            const percentage =
              totalVotes > 0 ? Math.round((choice.votes / totalVotes) * 100) : 0;

            return (
              <div key={choice.id} className="poll-choice">
                <div className="poll-choice-header">
                  <span>{choice.title}</span>
                  <strong>{percentage}%</strong>
                </div>
                <div className="poll-bar-track">
                  <div
                    className="poll-bar-fill"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <p className="poll-votes">{choice.votes.toLocaleString()} votes</p>
              </div>
            );
          })}
          <p className="poll-total">{totalVotes.toLocaleString()} total votes</p>
        </div>
      )}

      {pollPhase === "active" && (
        <button className="ghost-button" onClick={() => window.cs2sync.forceClosePoll()}>
          Close Poll Early
        </button>
      )}
    </section>
  );
}

function formatPhase(phase: PollPanelProps["pollPhase"]) {
  switch (phase) {
    case "active":
      return "Live";
    case "closing":
      return "Closing";
    case "closed":
      return "Closed";
    default:
      return "Idle";
  }
}
