import {
  MAX_LEVEL,
  eloToLevel,
  levelProgress,
  levelRingColor,
  levelRingGeometry,
} from "../../shared/elo";

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
  const levelFontSize = Math.max(10, Math.round(size * 0.32));
  const eloFontSize = Math.max(11, Math.round(size * 0.32));

  return (
    <div className={["level-badge", className].filter(Boolean).join(" ")}>
      <div
        className="level-badge-ring"
        style={{ width: size, height: size }}
        aria-hidden
      >
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="level-badge-svg"
          style={{
            transform: `rotate(${ring.rotation}deg)`,
            transformOrigin: "center",
          }}
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
            className="level-badge-track"
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
              className="level-badge-progress"
            />
          )}
        </svg>
        <span
          className="level-badge-level"
          style={{
            color: lvl >= MAX_LEVEL ? color : undefined,
            fontSize: levelFontSize,
          }}
        >
          {lvl}
        </span>
      </div>
      <span className="level-badge-elo" style={{ fontSize: eloFontSize }}>
        {elo}
      </span>
    </div>
  );
}
