"use client";

interface DonutCounts {
  gameDay: number;
  support: number;
  engage: number;
}

interface ActivationDonutProps {
  counts: DonutCounts;
  total: number;
}

const SIZE = 203;
const STROKE = 24;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const CENTER = SIZE / 2;

const SEGMENT_COLORS: Record<keyof DonutCounts, string> = {
  gameDay: "#638BFE",
  support: "#65C162",
  engage: "#9D62C1",
};

const SEGMENT_ORDER: (keyof DonutCounts)[] = ["gameDay", "support", "engage"];

export default function ActivationDonut({ counts, total }: ActivationDonutProps) {
  // Build proportional arc segments. When total is 0, only the track shows.
  const segments = SEGMENT_ORDER.reduce<
    { offset: number; items: { key: string; color: string; dashArray: string; dashOffset: number }[] }
  >(
    (acc, key) => {
      const fraction = total > 0 ? counts[key] / total : 0;
      const length = fraction * CIRCUMFERENCE;
      acc.items.push({
        key,
        color: SEGMENT_COLORS[key],
        dashArray: `${length} ${CIRCUMFERENCE - length}`,
        dashOffset: -acc.offset,
      });
      return { offset: acc.offset + length, items: acc.items };
    },
    { offset: 0, items: [] }
  ).items;

  return (
    <div className="relative" style={{ width: SIZE, height: SIZE }}>
      <svg
        width={SIZE}
        height={SIZE}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        // Start segments from the top (12 o'clock)
        style={{ transform: "rotate(-90deg)" }}
      >
        {/* Track */}
        <circle
          cx={CENTER}
          cy={CENTER}
          r={RADIUS}
          fill="none"
          stroke="rgba(0,0,0,0.4)"
          strokeWidth={STROKE}
        />
        {/* Segments */}
        {segments.map((seg) =>
          seg.dashArray.startsWith("0 ") ? null : (
            <circle
              key={seg.key}
              cx={CENTER}
              cy={CENTER}
              r={RADIUS}
              fill="none"
              stroke={seg.color}
              strokeWidth={STROKE}
              strokeDasharray={seg.dashArray}
              strokeDashoffset={seg.dashOffset}
            />
          )
        )}
      </svg>

      {/* Center label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display font-black text-[56px] uppercase text-white leading-none">
          {total}
        </span>
        <span className="text-base text-white leading-none mt-1">Total</span>
      </div>
    </div>
  );
}
