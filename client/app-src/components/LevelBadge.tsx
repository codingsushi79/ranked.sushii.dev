import { levelLabel } from "../../shared/elo";
import { LevelRing } from "./LevelRing";

export function LevelBadge({
  level,
  elo,
  className,
  size,
  compact,
}: {
  level: number;
  elo?: number;
  className?: string;
  size?: number;
  compact?: boolean;
}) {
  if (elo !== undefined) {
    return (
      <LevelRing
        level={level}
        elo={elo}
        className={className}
        size={size}
        compact={compact}
      />
    );
  }

  return (
    <span className={["level-badge-label", className].filter(Boolean).join(" ")}>
      {levelLabel(level)}
    </span>
  );
}
