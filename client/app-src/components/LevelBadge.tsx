import { levelLabel } from "../../shared/elo";
import { LevelRing } from "./LevelRing";

export function LevelBadge({
  level,
  elo,
  className,
  size,
}: {
  level: number;
  elo?: number;
  className?: string;
  size?: number;
}) {
  if (elo !== undefined) {
    return (
      <LevelRing level={level} elo={elo} className={className} size={size} />
    );
  }

  return (
    <span className={["level-badge-label", className].filter(Boolean).join(" ")}>
      {levelLabel(level)}
    </span>
  );
}
