import { eloToLevel, levelProgress, levelRingColor, levelRingGeometry } from "../../shared/elo";

const DEFAULT_SIZE = 44;

export function LevelRing({
  level,
  elo,
  size = DEFAULT_SIZE,
}: {
  level?: number;
  elo: number;
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
    <div className="level-ring" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="level-ring-svg"
        style={{ transform: `rotate(${ring.rotation}deg)` }}
      >
        <circle
          cx={cx}
          cy={cx}
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.12)"
          strokeWidth={ring.stroke * scale}
          strokeLinecap="round"
          strokeDasharray={`${arc} ${gap}`}
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
          />
        )}
      </svg>
      <span className="level-ring-num" style={{ color: lvl >= 12 ? color : undefined }}>
        {lvl}
      </span>
    </div>
  );
}

export function LevelRingWithElo({
  level,
  elo,
  size,
}: {
  level?: number;
  elo: number;
  size?: number;
}) {
  return (
    <div className="level-ring-row">
      <LevelRing level={level} elo={elo} size={size} />
      <span className="level-ring-elo">{elo}</span>
    </div>
  );
}
