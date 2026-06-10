import { eloToLevel, levelProgress, levelRingColor, levelRingGeometry, MAX_LEVEL } from "@/lib/elo";
import { cn } from "@/lib/utils";

const DEFAULT_SIZE = 44;

export function LevelRing({
  level,
  elo,
  className,
  size = DEFAULT_SIZE,
}: {
  level?: number;
  elo: number;
  className?: string;
  size?: number;
}) {
  const lvl = level ?? eloToLevel(elo);
  const progress = levelProgress(elo, lvl);
  const color = levelRingColor(lvl);
  const ring = levelRingGeometry(size);
  const scale = size / ring.size;
  const r = ring.r * scale;
  const c = ring.c * scale;
  const gap = ring.gap * scale;
  const arc = ring.arc * scale;
  const progressArc = Math.max(0, arc * progress);
  const cx = size / 2;

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <div
        className="relative shrink-0"
        style={{ width: size, height: size }}
        aria-hidden
      >
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          style={{ transform: `rotate(${ring.rotation}deg)`, transformOrigin: "center" }}
        >
          <circle
            cx={cx}
            cy={cx}
            r={r}
            fill="none"
            stroke="currentColor"
            strokeWidth={ring.stroke * scale}
            strokeLinecap="round"
            strokeDasharray={`${arc} ${gap}`}
            className="text-muted/40"
          />
          {progressArc > 0 && (
            <circle
              cx={cx}
              cy={cx}
              r={r}
              fill="none"
              stroke={color}
              strokeWidth={ring.stroke * scale}
              strokeLinecap="round"
              strokeDasharray={`${progressArc} ${c}`}
              className="transition-[stroke-dasharray] duration-500 ease-out"
            />
          )}
        </svg>
        <span
          className="absolute inset-0 flex items-center justify-center font-mono text-sm font-bold tabular-nums"
          style={{ color: lvl >= MAX_LEVEL ? color : undefined }}
        >
          {lvl}
        </span>
      </div>
      <span className="font-mono text-sm font-semibold tabular-nums">{elo}</span>
    </div>
  );
}
