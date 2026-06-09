import type { CsrepTrustJson } from "../lib/types";

const labelStyles: Record<string, string> = {
  Trusted: "csrep-trusted",
  Normal: "csrep-trusted",
  Caution: "csrep-caution",
  Suspicious: "csrep-suspicious",
  "Highly Suspicious": "csrep-bad",
  Autoflagged: "csrep-bad",
  "Overwatch Convicted": "csrep-bad",
  Unknown: "csrep-unknown",
};

export function CsrepTrustBadge({
  trust,
}: {
  trust: CsrepTrustJson | null | undefined;
}) {
  if (!trust) return null;

  const style = labelStyles[trust.label] ?? "csrep-unknown";

  return (
    <a
      href={trust.profileUrl}
      className={`csrep-badge ${style}`}
      title={
        trust.score != null
          ? `CSRep ${trust.score}% · ${trust.label}`
          : `CSRep · ${trust.label}`
      }
      onClick={(e) => {
        e.preventDefault();
        void window.ranked.openExternal(trust.profileUrl);
      }}
    >
      {trust.score != null ? (
        <>
          {trust.score}% <span>{trust.label}</span>
        </>
      ) : (
        "CSRep"
      )}
    </a>
  );
}

export function CsrepTrustPanel({
  trust,
}: {
  trust: CsrepTrustJson | null | undefined;
}) {
  if (!trust) {
    return <p className="ranked-meta">Link Steam to show a CSRep.gg trust rating.</p>;
  }

  return (
    <div className="csrep-panel">
      <div className="csrep-panel-head">
        <CsrepTrustBadge trust={trust} />
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => void window.ranked.openExternal(trust.profileUrl)}
        >
          View on CSRep.gg
        </button>
      </div>
      <div className="csrep-panel-grid">
        <div className="card-surface csrep-stat">
          <p className="section-label">Trust rating</p>
          <p className="stat-value">{trust.score != null ? `${trust.score}%` : "—"}</p>
        </div>
        <div className="card-surface csrep-stat">
          <p className="section-label">Status</p>
          <p className="ranked-meta">{trust.label}</p>
        </div>
        <div className="card-surface csrep-stat">
          <p className="section-label">Reports</p>
          <p className="ranked-meta">{trust.reportsCount}</p>
        </div>
      </div>
    </div>
  );
}
