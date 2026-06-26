// 8-team double elimination bracket
// Upper: M1(1v8), M2(4v5), M3(2v7), M4(3v6) → M5, M6 → M7 (Upper Final) → M16 (Gran Final)
// Lower: M8(losM1+losM2), M9(losM3+losM4)
//        → M10(winM8 vs losM5), M11(winM9 vs losM6)
//        → M12(winM10 vs winM11)
//        → M13(winM12 vs losM7)  [Lower Final]
//        → M16 Gran Final (Bo5)

export const MATCH_W8 = 160;
export const MATCH_H8 = 72;
const COL = 224;
const R   = 96;

const between = (y1: number, y2: number) =>
  (y1 + y2 + MATCH_H8) / 2 - MATCH_H8 / 2;

// ── Upper section ─────────────────────────────────────────────────────────────
const U = 0;
const u0y = [U, U + R, U + 2 * R, U + 3 * R];
const u5y  = between(u0y[0], u0y[1]);   // M5 center between M1 and M2
const u6y  = between(u0y[2], u0y[3]);   // M6 center between M3 and M4
const u7y  = between(u5y, u6y);         // M7 (Upper Final) center

// ── Lower section ─────────────────────────────────────────────────────────────
const L = 408;   // gap below upper section
const lM8y  = L;
const lM9y  = L + R;
const lM10y = lM8y;
const lM11y = lM9y;
const lM12y = between(lM10y, lM11y);
const lM13y = lM12y;

// Gran Final centered between upper final and lower final
const m16y = between(u7y, lM13y);

// ── Position map ─────────────────────────────────────────────────────────────
export const POSITIONS8: Record<string, [number, number]> = {
  // Upper
  M1:  [0,       u0y[0]],
  M2:  [0,       u0y[1]],
  M3:  [0,       u0y[2]],
  M4:  [0,       u0y[3]],
  M5:  [COL,     u5y],
  M6:  [COL,     u6y],
  M7:  [2 * COL, u7y],
  // Lower
  M8:  [0,       lM8y],
  M9:  [0,       lM9y],
  M10: [COL,     lM10y],
  M11: [COL,     lM11y],
  M12: [2 * COL, lM12y],
  M13: [3 * COL, lM13y],
  // Gran Final
  M16: [4 * COL, m16y],
};

// ── Winner next match ─────────────────────────────────────────────────────────
export const NEXT_MATCH8: Record<string, { id: string; slot: 'team1' | 'team2' } | null> = {
  M1:  { id: 'M5',  slot: 'team1' },
  M2:  { id: 'M5',  slot: 'team2' },
  M3:  { id: 'M6',  slot: 'team1' },
  M4:  { id: 'M6',  slot: 'team2' },
  M5:  { id: 'M7',  slot: 'team1' },
  M6:  { id: 'M7',  slot: 'team2' },
  M7:  { id: 'M16', slot: 'team1' },
  M8:  { id: 'M10', slot: 'team1' },
  M9:  { id: 'M11', slot: 'team1' },
  M10: { id: 'M12', slot: 'team1' },
  M11: { id: 'M12', slot: 'team2' },
  M12: { id: 'M13', slot: 'team1' },
  M13: { id: 'M16', slot: 'team2' },
  M16: null,
};

// ── Loser next match ──────────────────────────────────────────────────────────
export const LOSER_NEXT_MATCH8: Record<string, { id: string; slot: 'team1' | 'team2' } | null> = {
  M1:  { id: 'M8',  slot: 'team1' },
  M2:  { id: 'M8',  slot: 'team2' },
  M3:  { id: 'M9',  slot: 'team1' },
  M4:  { id: 'M9',  slot: 'team2' },
  M5:  { id: 'M10', slot: 'team2' },
  M6:  { id: 'M11', slot: 'team2' },
  M7:  { id: 'M13', slot: 'team2' },
  // Lower losers eliminated
  M8:  null,
  M9:  null,
  M10: null,
  M11: null,
  M12: null,
  M13: null,
  M16: null,
};

// ── Round names ───────────────────────────────────────────────────────────────
export const ROUND_NAMES8: Record<string, string> = {
  M1:  'Ronda 1',
  M2:  'Ronda 1',
  M3:  'Ronda 1',
  M4:  'Ronda 1',
  M5:  'Semifinal Upper',
  M6:  'Semifinal Upper',
  M7:  'Final Upper',
  M8:  'Ronda 1 LB',
  M9:  'Ronda 1 LB',
  M10: 'Ronda 2 LB',
  M11: 'Ronda 2 LB',
  M12: 'Ronda 3 LB',
  M13: 'Final Lower',
  M16: 'Gran Final',
};

export const MATCH_LABELS8: Record<string, string> = {
  M7:  'UPPER FINAL',
  M13: 'LOWER FINAL',
  M16: 'GRAN FINAL',
};

export const BO5_MATCHES8 = new Set(['M16']);

export function getFormat8(matchId: string): 'Bo5' | 'Bo3' {
  return BO5_MATCHES8.has(matchId) ? 'Bo5' : 'Bo3';
}

const UPPER_BOTTOM = L - 24;
export const SECTION_BANDS8 = [
  { label: 'UPPER BRACKET', sublabel: 'Bracket Superior', y1: U,            y2: UPPER_BOTTOM },
  { label: 'LOWER BRACKET', sublabel: 'Bracket Inferior', y1: UPPER_BOTTOM, y2: lM9y + MATCH_H8 + 20 },
];

export const CANVAS_W8 = 4 * COL + MATCH_W8 + 40;
const allY = Object.values(POSITIONS8).map(([, y]) => y);
export const CANVAS_H8 = Math.max(...allY) + MATCH_H8 + 40;

// ── SVG connector helpers ─────────────────────────────────────────────────────
interface Seg { x1: number; y1: number; x2: number; y2: number; dashed?: boolean }

function right8(id: string): [number, number] {
  const [x, y] = POSITIONS8[id];
  return [x + MATCH_W8, y + MATCH_H8 / 2];
}
function left8(id: string): [number, number] {
  const [x, y] = POSITIONS8[id];
  return [x, y + MATCH_H8 / 2];
}
function hLine8(from: string, to: string): Seg[] {
  const [x1, y1] = right8(from);
  const [x2, y2] = left8(to);
  return [{ x1, y1, x2, y2 }];
}
function bracketMerge8(top: string, bot: string, next: string): Seg[] {
  const [rx1, ry1] = right8(top);
  const [rx2, ry2] = right8(bot);
  const [lx] = left8(next);
  const jx  = lx - 28;
  const jym = (ry1 + ry2) / 2;
  return [
    { x1: rx1, y1: ry1, x2: jx,  y2: ry1 },
    { x1: rx2, y1: ry2, x2: jx,  y2: ry2 },
    { x1: jx,  y1: ry1, x2: jx,  y2: ry2 },
    { x1: jx,  y1: jym, x2: lx,  y2: jym },
  ];
}
function crossLine8(from: string, toX: number, toY: number, dashed = true): Seg[] {
  const [x1, y1] = right8(from);
  const midX = x1 + 28;
  return [
    { x1,       y1,   x2: midX, y2: y1,   dashed },
    { x1: midX, y1,   x2: midX, y2: toY,  dashed },
    { x1: midX, y1: toY, x2: toX, y2: toY, dashed },
  ];
}

export function buildConnectors8(): Seg[] {
  const segs: Seg[] = [];

  // ── Upper internal ──────────────────────────────────────────────────────
  segs.push(...bracketMerge8('M1', 'M2', 'M5'));
  segs.push(...bracketMerge8('M3', 'M4', 'M6'));
  segs.push(...bracketMerge8('M5', 'M6', 'M7'));

  // Winner M7 → M16
  segs.push(...hLine8('M7', 'M16'));

  // ── Lower internal ──────────────────────────────────────────────────────
  // M8 win → M10 team1 (horizontal)
  segs.push(...hLine8('M8', 'M10'));
  // M9 win → M11 team1 (horizontal)
  segs.push(...hLine8('M9', 'M11'));
  // M10/M11 → M12 (bracket merge)
  segs.push(...bracketMerge8('M10', 'M11', 'M12'));
  // M12 → M13
  segs.push(...hLine8('M12', 'M13'));
  // M13 → M16
  segs.push(...hLine8('M13', 'M16'));

  // ── Cross-section loser drops ───────────────────────────────────────────
  // LosM5 → M10 team2
  const [m10x, m10y] = POSITIONS8['M10'];
  segs.push(...crossLine8('M5', m10x, m10y + MATCH_H8 * 0.75, true));

  // LosM6 → M11 team2
  const [m11x, m11y] = POSITIONS8['M11'];
  segs.push(...crossLine8('M6', m11x, m11y + MATCH_H8 * 0.75, true));

  // LosM7 → M13 team2
  const [m13x, m13y] = POSITIONS8['M13'];
  segs.push(...crossLine8('M7', m13x, m13y + MATCH_H8 * 0.75, true));

  return segs;
}
