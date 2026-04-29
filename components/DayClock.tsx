type Feed = {
  start_at: string;
  end_at: string | null;
  feed_type: string | null;
};

const SIZE = 320;
const CX = SIZE / 2;
const CY = SIZE / 2;
const R_OUTER = 132;
const R_INNER = 96;
const R_TICK_OUT = 137;
const R_TICK_IN = 128;
const R_LABEL = 156;

const COLOR: Record<string, string> = {
  formula: "#60a5fa",
  breast_pumped: "#c4b5fd",
  breast_direct: "#f9a8d4",
};
const FALLBACK = "#9ca3af";

function kstMinOfDay(iso: string): number {
  const d = new Date(new Date(iso).getTime() + 9 * 60 * 60 * 1000);
  return d.getUTCHours() * 60 + d.getUTCMinutes();
}

function angleFor(minOfDay: number): number {
  return (minOfDay / 1440) * 360 - 90;
}

function polar(angleDeg: number, r: number): [number, number] {
  const rad = (angleDeg * Math.PI) / 180;
  return [CX + r * Math.cos(rad), CY + r * Math.sin(rad)];
}

function ringArcPath(startAngle: number, endAngle: number, rOuter: number, rInner: number): string {
  let sweep = endAngle - startAngle;
  if (sweep < 1.4) sweep = 1.4;
  const a1 = startAngle;
  const a2 = startAngle + sweep;
  const [x1, y1] = polar(a1, rOuter);
  const [x2, y2] = polar(a2, rOuter);
  const [x3, y3] = polar(a2, rInner);
  const [x4, y4] = polar(a1, rInner);
  const large = sweep > 180 ? 1 : 0;
  return `M ${x1} ${y1} A ${rOuter} ${rOuter} 0 ${large} 1 ${x2} ${y2} L ${x3} ${y3} A ${rInner} ${rInner} 0 ${large} 0 ${x4} ${y4} Z`;
}

export function DayClock({ feeds, dPlus }: { feeds: Feed[]; dPlus: number | null }) {
  const hourLabels = [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22];
  const tickHours = Array.from({ length: 24 }, (_, i) => i);

  return (
    <div className="flex justify-center">
      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        width={SIZE}
        height={SIZE}
        className="max-w-full"
      >
        <circle
          cx={CX}
          cy={CY}
          r={R_OUTER}
          className="fill-gray-100 dark:fill-neutral-800"
        />
        <circle
          cx={CX}
          cy={CY}
          r={R_INNER}
          className="fill-white dark:fill-neutral-900"
        />

        {tickHours.map((h) => {
          const a = angleFor(h * 60);
          const [x1, y1] = polar(a, R_TICK_IN);
          const [x2, y2] = polar(a, R_TICK_OUT);
          return (
            <line
              key={`t${h}`}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              strokeWidth={1}
              className="stroke-gray-300 dark:stroke-neutral-700"
            />
          );
        })}

        {feeds.map((f, i) => {
          const start = kstMinOfDay(f.start_at);
          const end = f.end_at ? kstMinOfDay(f.end_at) : start + 8;
          const a1 = angleFor(start);
          const a2 = angleFor(Math.max(end, start + 8));
          const color = COLOR[f.feed_type ?? ""] ?? FALLBACK;
          return (
            <path key={i} d={ringArcPath(a1, a2, R_OUTER, R_INNER)} fill={color} />
          );
        })}

        {hourLabels.map((h) => {
          const [x, y] = polar(angleFor(h * 60), R_LABEL);
          return (
            <text
              key={`l${h}`}
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={14}
              className="fill-gray-400 tabular-nums dark:fill-neutral-500"
            >
              {h}
            </text>
          );
        })}

        {dPlus != null ? (
          <text
            x={CX}
            y={CY}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={22}
            fontWeight={500}
            className="fill-gray-500 dark:fill-neutral-400"
          >
            D+{dPlus}
          </text>
        ) : null}
      </svg>
    </div>
  );
}
