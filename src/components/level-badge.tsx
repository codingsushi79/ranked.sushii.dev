import { LevelRing } from "@/components/level-ring";
import { levelLabel } from "@/lib/elo";
import { cn } from "@/lib/utils";

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
    <span className={cn("text-sm font-medium text-muted-foreground", className)}>
      {levelLabel(level)}
    </span>
  );
}
