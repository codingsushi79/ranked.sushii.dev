import Link from "next/link";
import { Shield, ShieldAlert, ShieldCheck, ShieldQuestion } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CsrepTrust, CsrepTrustJson, CsrepTrustLabel } from "@/lib/csrep-types";

const labelStyles: Record<CsrepTrustLabel, string> = {
  Trusted: "text-emerald-400 bg-emerald-500/10 border-emerald-500/25",
  Normal: "text-emerald-400 bg-emerald-500/10 border-emerald-500/25",
  Caution: "text-amber-400 bg-amber-500/10 border-amber-500/25",
  Suspicious: "text-orange-400 bg-orange-500/10 border-orange-500/25",
  "Highly Suspicious": "text-red-400 bg-red-500/10 border-red-500/25",
  Autoflagged: "text-red-400 bg-red-500/10 border-red-500/30",
  "Overwatch Convicted": "text-red-500 bg-red-500/15 border-red-500/30",
  Unknown: "text-muted-foreground bg-muted/40 border-border/60",
};

function TrustIcon({ label }: { label: CsrepTrustLabel }) {
  const className = "size-3 shrink-0";
  if (label === "Trusted" || label === "Normal") {
    return <ShieldCheck className={className} />;
  }
  if (
    label === "Suspicious" ||
    label === "Highly Suspicious" ||
    label === "Autoflagged" ||
    label === "Overwatch Convicted"
  ) {
    return <ShieldAlert className={className} />;
  }
  if (label === "Caution") {
    return <Shield className={className} />;
  }
  return <ShieldQuestion className={className} />;
}

export function CsrepTrustBadge({
  trust,
  className,
  linked = true,
}: {
  trust: CsrepTrust | CsrepTrustJson | null | undefined;
  className?: string;
  linked?: boolean;
}) {
  if (!trust) return null;

  const colors = labelStyles[trust.label] ?? labelStyles.Unknown;
  const content = (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold tabular-nums",
        colors,
        linked && "transition-opacity hover:opacity-90",
        className
      )}
      title={
        trust.score != null
          ? `CSRep ${trust.score}% · ${trust.label}`
          : `CSRep profile · ${trust.label}`
      }
    >
      <TrustIcon label={trust.label} />
      {trust.score != null ? (
        <>
          {trust.score}%
          <span className="font-normal opacity-80">{trust.label}</span>
        </>
      ) : (
        <span>CSRep</span>
      )}
    </span>
  );

  if (!linked) return content;

  return (
    <Link
      href={trust.profileUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex"
    >
      {content}
    </Link>
  );
}

export function CsrepTrustPanel({ trust }: { trust: CsrepTrust | CsrepTrustJson | null }) {
  if (!trust) {
    return (
      <p className="text-sm text-muted-foreground">
        Link Steam to show a CSRep.gg trust rating.
      </p>
    );
  }

  const colors = labelStyles[trust.label] ?? labelStyles.Unknown;
  const ratingHint =
    trust.score == null && trust.configured
      ? "CSRep connected — this player has no public trust score yet."
      : trust.score == null && !trust.configured
        ? "Set CSREP_API_KEY on the server to load CSRep trust ratings."
        : null;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <CsrepTrustBadge trust={trust} linked={false} />
        <Link
          href={trust.profileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          View on CSRep.gg
        </Link>
      </div>
      {ratingHint && (
        <p className="text-sm text-muted-foreground">{ratingHint}</p>
      )}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className={cn("rounded-lg border px-3 py-2", colors)}>
          <p className="text-xs opacity-80">Trust rating</p>
          <p className="text-lg font-semibold tabular-nums">
            {trust.score != null ? `${trust.score}%` : "—"}
          </p>
        </div>
        <div className="rounded-lg border border-border/60 bg-muted/20 px-3 py-2">
          <p className="text-xs text-muted-foreground">Status</p>
          <p className="text-sm font-medium">{trust.label}</p>
        </div>
        <div className="rounded-lg border border-border/60 bg-muted/20 px-3 py-2">
          <p className="text-xs text-muted-foreground">Community reports</p>
          <p className="text-sm font-medium tabular-nums">{trust.reportsCount}</p>
        </div>
      </div>
      {(trust.autoflagged || trust.overwatchConvicted) && (
        <p className="text-xs text-red-400">
          {trust.overwatchConvicted
            ? "Overwatch conviction on CSRep record."
            : "AI autoflag on CSRep record."}
        </p>
      )}
    </div>
  );
}
