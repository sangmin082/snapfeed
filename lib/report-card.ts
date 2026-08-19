/**
 * Canvas renderer for the shareable weekly report card (1080×1350, 4:5 —
 * the aspect ratio KakaoTalk/Instagram previews crop least). Pure function
 * so the layout can be exercised outside React.
 */

export type WeeklyReportData = {
  babyName: string;
  rangeLabel: string;
  ageLabel: string;
  totalMl: number;
  totalCount: number;
  avgIntervalText: string | null;
  peeCount: number;
  poopCount: number;
  /** Exactly 7 entries, oldest first. */
  days: { label: string; ml: number }[];
};

export const CARD_W = 1080;
export const CARD_H = 1350;

export function drawWeeklyReportCard(
  canvas: HTMLCanvasElement,
  data: WeeklyReportData,
  fontFamily: string,
): void {
  canvas.width = CARD_W;
  canvas.height = CARD_H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const fam = fontFamily || "sans-serif";
  const font = (weight: number, size: number) => `${weight} ${size}px ${fam}`;

  // ── background ──
  ctx.fillStyle = "#fdfbf5";
  ctx.fillRect(0, 0, CARD_W, CARD_H);
  const grad = ctx.createLinearGradient(0, 0, 0, 360);
  grad.addColorStop(0, "#faf3e3");
  grad.addColorStop(1, "#fdfbf5");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, CARD_W, 360);

  const PAD = 84;

  // ── header ──
  ctx.fillStyle = "#1c1917";
  ctx.font = font(800, 76);
  ctx.textBaseline = "top";
  ctx.fillText(`${data.babyName}의 일주일 🍼`, PAD, 96);
  ctx.fillStyle = "#a8a29e";
  ctx.font = font(500, 34);
  ctx.fillText(`${data.rangeLabel} · ${data.ageLabel}`, PAD, 200);

  // ── stat tiles ──
  const tiles = [
    { label: "총 수유량", value: data.totalMl > 0 ? `${data.totalMl.toLocaleString()}ml` : "—" },
    { label: "수유 횟수", value: `${data.totalCount}회` },
    { label: "평균 간격", value: data.avgIntervalText ?? "—" },
  ];
  const tileW = (CARD_W - PAD * 2 - 48) / 3;
  tiles.forEach((t, i) => {
    const x = PAD + i * (tileW + 24);
    const y = 300;
    ctx.fillStyle = "#ffffff";
    roundRect(ctx, x, y, tileW, 190, 32);
    ctx.fill();
    ctx.strokeStyle = "#f5f0e6";
    ctx.lineWidth = 2;
    roundRect(ctx, x, y, tileW, 190, 32);
    ctx.stroke();
    ctx.fillStyle = "#b45309";
    ctx.font = font(800, t.value.length > 7 ? 44 : 54);
    ctx.textAlign = "center";
    ctx.fillText(t.value, x + tileW / 2, y + 52);
    ctx.fillStyle = "#a8a29e";
    ctx.font = font(600, 30);
    ctx.fillText(t.label, x + tileW / 2, y + 126);
    ctx.textAlign = "left";
  });

  // ── diaper pills ──
  const pills = [`소변 ${data.peeCount}회`, `대변 ${data.poopCount}회`];
  let px = PAD;
  const py = 540;
  ctx.font = font(700, 32);
  for (const p of pills) {
    const w = ctx.measureText(p).width + 72;
    ctx.fillStyle = "#fef3c7";
    roundRect(ctx, px, py, w, 72, 36);
    ctx.fill();
    ctx.fillStyle = "#92400e";
    ctx.fillText(p, px + 36, py + 20);
    px += w + 20;
  }

  // ── bar chart ──
  const chartTop = 700;
  const chartBottom = 1080;
  const chartH = chartBottom - chartTop;
  const maxMl = Math.max(1, ...data.days.map((d) => d.ml));
  const slotW = (CARD_W - PAD * 2) / 7;
  const barW = slotW * 0.52;

  ctx.fillStyle = "#78716c";
  ctx.font = font(700, 34);
  ctx.fillText("일별 수유량", PAD, chartTop - 76);

  data.days.forEach((d, i) => {
    const cx = PAD + i * slotW + slotW / 2;
    const h = d.ml > 0 ? Math.max(14, (d.ml / maxMl) * (chartH - 60)) : 8;
    const y = chartBottom - h;
    ctx.fillStyle = d.ml > 0 ? "#fbbf24" : "#ece7db";
    roundRect(ctx, cx - barW / 2, y, barW, h, 14);
    ctx.fill();
    ctx.textAlign = "center";
    if (d.ml > 0) {
      ctx.fillStyle = "#a16207";
      ctx.font = font(600, 26);
      ctx.fillText(String(d.ml), cx, y - 38);
    }
    ctx.fillStyle = "#a8a29e";
    ctx.font = font(500, 26);
    ctx.fillText(d.label, cx, chartBottom + 18);
    ctx.textAlign = "left";
  });

  // ── footer ──
  ctx.strokeStyle = "#ece7db";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(PAD, 1188);
  ctx.lineTo(CARD_W - PAD, 1188);
  ctx.stroke();
  ctx.fillStyle = "#1c1917";
  ctx.font = font(800, 36);
  ctx.fillText("snapfeed", PAD, 1222);
  ctx.fillStyle = "#a8a29e";
  ctx.font = font(500, 27);
  ctx.fillText("수첩 사진 한 장으로 육아 기록 끝", PAD, 1276);
  ctx.textAlign = "right";
  ctx.fillText("snapfeed.sangmin082.workers.dev", CARD_W - PAD, 1230);
  ctx.textAlign = "left";
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}
