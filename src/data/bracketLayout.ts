export const MATCH_W = 160;
export const MATCH_H = 72;
const COL = 224; // col step (card width + gap)
const R = 96;    // row step (card height + gap)

// Center a match between two others (for bracket merges)
const between = (y1: number, y2: number) =>
  (y1 + y2 + MATCH_H) / 2 - MATCH_H / 2;

// ── Section offsets ─────────────────────────────────────────────────────────
const U = 0;          // UPPER top
const M = 392;        // MIDDLE top  (288 + 72 + 32)
const L = 812;        // LOWER top   (M + 4*R + 24)

// ── UPPER ────────────────────────────────────────────────────────────────────
// Col 0: M01-M04
const u0y = [U, U + R, U + 2 * R, U + 3 * R];
// Col 1: M05-M08 (same y as col0 — each gets one input from col0)
const u1y = u0y;
// Col 2: M19, M20
const u19y = between(u1y[0], u1y[1]); // 48
const u20y = between(u1y[2], u1y[3]); // 240
// Col 3: M25
const u25y = between(u19y, u20y); // 144

// ── MIDDLE ───────────────────────────────────────────────────────────────────
const m0y = [M, M + R, M + 2 * R, M + 3 * R];
const m13y = between(m0y[0], m0y[1]); // 440
const m14y = between(m0y[2], m0y[3]); // 632
const m21y = m13y; // aligned with M13
const m22y = m14y;
const m26y = between(m21y, m22y); // 536
const m29y = between(u25y, m26y); // 340 (between M25 upper and M26 middle)

// ── LOWER ────────────────────────────────────────────────────────────────────
const l0y = [L, L + R];
const l17y = l0y[0]; // M17 same y as M15
const l18y = l0y[1];
const l23y = l0y[0];
const l24y = l0y[1];
const l27y = between(l23y, l24y); // 848
const l28y = l27y;
const l30y = between(l28y, m29y); // 598

// ── POSITION MAP ─────────────────────────────────────────────────────────────
export const POSITIONS: Record<string, [number, number]> = {
  // UPPER
  M01: [0, u0y[0]], M02: [0, u0y[1]], M03: [0, u0y[2]], M04: [0, u0y[3]],
  M05: [COL, u1y[0]], M06: [COL, u1y[1]], M07: [COL, u1y[2]], M08: [COL, u1y[3]],
  M19: [2 * COL, u19y], M20: [2 * COL, u20y],
  M25: [3 * COL, u25y],
  // MIDDLE
  M09: [0, m0y[0]], M10: [0, m0y[1]], M11: [0, m0y[2]], M12: [0, m0y[3]],
  M13: [COL, m13y], M14: [COL, m14y],
  M21: [2 * COL, m21y], M22: [2 * COL, m22y],
  M26: [3 * COL, m26y],
  M29: [4 * COL, m29y],
  // LOWER
  M15: [0, l0y[0]], M16: [0, l0y[1]],
  M17: [COL, l17y], M18: [COL, l18y],
  M23: [2 * COL, l23y], M24: [2 * COL, l24y],
  M27: [3 * COL, l27y],
  M28: [4 * COL, l28y],
  M30: [5 * COL, l30y],
};

// ── Next match mapping (winner goes to which match & slot) ────────────────────
export const NEXT_MATCH: Record<string, { id: string; slot: 'team1' | 'team2' } | null> = {
  M01: { id: 'M05', slot: 'team2' },
  M02: { id: 'M06', slot: 'team2' },
  M03: { id: 'M07', slot: 'team2' },
  M04: { id: 'M08', slot: 'team2' },
  M05: { id: 'M19', slot: 'team1' },
  M06: { id: 'M19', slot: 'team2' },
  M07: { id: 'M20', slot: 'team1' },
  M08: { id: 'M20', slot: 'team2' },
  M19: { id: 'M25', slot: 'team1' },
  M20: { id: 'M25', slot: 'team2' },
  M09: { id: 'M13', slot: 'team1' },
  M10: { id: 'M13', slot: 'team2' },
  M11: { id: 'M14', slot: 'team1' },
  M12: { id: 'M14', slot: 'team2' },
  M13: { id: 'M21', slot: 'team1' },
  M14: { id: 'M22', slot: 'team1' },
  M21: { id: 'M26', slot: 'team1' },
  M22: { id: 'M26', slot: 'team2' },
  M26: { id: 'M29', slot: 'team1' },
  M25: { id: 'M30', slot: 'team1' },
  M15: { id: 'M17', slot: 'team1' },
  M16: { id: 'M18', slot: 'team1' },
  M17: { id: 'M23', slot: 'team1' },
  M18: { id: 'M24', slot: 'team1' },
  M23: { id: 'M27', slot: 'team1' },
  M24: { id: 'M27', slot: 'team2' },
  M27: { id: 'M28', slot: 'team1' },
  M28: { id: 'M30', slot: 'team1' },
  M29: { id: 'M30', slot: 'team2' },
  M30: null, // final match, no next
};

// ── Loser next match mapping ──────────────────────────────────────────────────
export const LOSER_NEXT_MATCH: Record<string, { id: string; slot: 'team1' | 'team2' } | null> = {
  M01: { id: 'M09', slot: 'team1' },
  M02: { id: 'M10', slot: 'team1' },
  M03: { id: 'M11', slot: 'team1' },
  M04: { id: 'M12', slot: 'team1' },
  M05: { id: 'M12', slot: 'team2' },
  M06: { id: 'M11', slot: 'team2' },
  M07: { id: 'M10', slot: 'team2' },
  M08: { id: 'M09', slot: 'team2' },
  M09: { id: 'M15', slot: 'team1' },
  M10: { id: 'M16', slot: 'team1' },
  M11: { id: 'M16', slot: 'team2' },
  M12: { id: 'M15', slot: 'team2' },
  M13: { id: 'M18', slot: 'team2' },
  M14: { id: 'M17', slot: 'team2' },
  M15: null,
  M16: null,
  M17: null,
  M18: null,
  M19: { id: 'M21', slot: 'team2' },
  M20: { id: 'M22', slot: 'team2' },
  M21: { id: 'M23', slot: 'team2' },
  M22: { id: 'M24', slot: 'team2' },
  M25: { id: 'M29', slot: 'team2' },
  M26: { id: 'M28', slot: 'team2' },
  M23: null,
  M24: null,
  M27: null,
  M28: null,
  M29: null,
  M30: null,
};

// Round names
export const ROUND_NAMES: Record<string, string> = {
  M01: 'Ronda 1', M02: 'Ronda 1', M03: 'Ronda 1', M04: 'Ronda 1',
  M05: 'Ronda 2', M06: 'Ronda 2', M07: 'Ronda 2', M08: 'Ronda 2',
  M19: 'Semifinal Superior', M20: 'Semifinal Superior',
  M25: 'Final Superior',
  M09: 'Ronda 1 Middle', M10: 'Ronda 1 Middle', M11: 'Ronda 1 Middle', M12: 'Ronda 1 Middle',
  M13: 'Ronda 2 Middle', M14: 'Ronda 2 Middle',
  M21: 'Semifinal Middle', M22: 'Semifinal Middle',
  M26: 'Final Middle',
  M15: 'Ronda 1 Lower', M16: 'Ronda 1 Lower',
  M17: 'Ronda 2 Lower', M18: 'Ronda 2 Lower',
  M23: 'Semifinal Lower', M24: 'Semifinal Lower',
  M27: 'Final Lower R1',
  M28: 'Final Lower R2',
  M29: 'Final Lower',
  M30: 'Gran Final',
};

// Canvas dimensions
export const CANVAS_W = 5 * COL + MATCH_W + 40;
export const CANVAS_H = Math.max(...Object.values(POSITIONS).map(([, y]) => y)) + MATCH_H + 40;

// ── Match format (Bo3 default, Bo5 for Lower Final and Grand Final) ──────────
// "Solo Final Lower y Gran Final" are Bo5 per tournament rules
export const BO5_MATCHES = new Set(['M29', 'M30']);

export function getFormat(matchId: string): 'Bo5' | 'Bo3' {
  return BO5_MATCHES.has(matchId) ? 'Bo5' : 'Bo3';
}

// ── Match special labels ─────────────────────────────────────────────────────
export const MATCH_LABELS: Record<string, string> = {
  M25: 'UPPER FINAL',
  M29: 'LOWER FINAL',
  M30: 'GRAN FINAL',
};

// ── Section label regions ────────────────────────────────────────────────────
export const SECTION_BANDS = [
  { label: 'UPPER',  sublabel: 'Liguilla Superior', y1: U,           y2: M - 16 },
  { label: 'MIDDLE', sublabel: '1ra Oportunidad',   y1: M,           y2: L - 16 },
  { label: 'LOWER',  sublabel: 'Última Oportunidad', y1: L,          y2: CANVAS_H },
];

// ── SVG connector lines ──────────────────────────────────────────────────────
interface Seg { x1: number; y1: number; x2: number; y2: number; dashed?: boolean }

function right(id: string): [number, number] {
  const [x, y] = POSITIONS[id];
  return [x + MATCH_W, y + MATCH_H / 2];
}
function left(id: string): [number, number] {
  const [x, y] = POSITIONS[id];
  return [x, y + MATCH_H / 2];
}
// Straight H connector from one match's right to another's left
function hLine(from: string, to: string): Seg[] {
  const [x1, y1] = right(from);
  const [x2, y2] = left(to);
  return [{ x1, y1, x2, y2 }];
}

// Classic bracket: two matches feed into one (top and bottom inputs)
function bracketMerge(top: string, bot: string, next: string): Seg[] {
  const [rx1, ry1] = right(top);
  const [rx2, ry2] = right(bot);
  const [lx] = left(next);
  const jx = lx - 30;
  const jy1 = ry1, jy2 = ry2, jym = (jy1 + jy2) / 2;
  return [
    { x1: rx1, y1: jy1, x2: jx, y2: jy1 },
    { x1: rx2, y1: jy2, x2: jx, y2: jy2 },
    { x1: jx,  y1: jy1, x2: jx, y2: jy2 },
    { x1: jx,  y1: jym, x2: lx, y2: jym },
  ];
}

// Cross-section drop: from right of source down/up to a target team slot
function crossLine(from: string, toX: number, toY: number, dashed = true): Seg[] {
  const [x1, y1] = right(from);
  const midX = (x1 + toX) / 2;
  return [
    { x1, y1, x2: midX, y2: y1, dashed },
    { x1: midX, y1, x2: midX, y2: toY, dashed },
    { x1: midX, y1: toY, x2: toX, y2: toY, dashed },
  ];
}

export function buildConnectors(): Seg[] {
  const segs: Seg[] = [];

  // ── UPPER internal ──────────────────────────────────────────────────────
  // Col0→Col1 (direct horizontal feeds)
  segs.push(...hLine('M01', 'M05'));
  segs.push(...hLine('M02', 'M06'));
  segs.push(...hLine('M03', 'M07'));
  segs.push(...hLine('M04', 'M08'));

  // Col1 pairs → Col2
  segs.push(...bracketMerge('M05', 'M06', 'M19'));
  segs.push(...bracketMerge('M07', 'M08', 'M20'));

  // Col2 pair → M25
  segs.push(...bracketMerge('M19', 'M20', 'M25'));

  // ── MIDDLE internal ──────────────────────────────────────────────────────
  segs.push(...bracketMerge('M09', 'M10', 'M13'));
  segs.push(...bracketMerge('M11', 'M12', 'M14'));

  // M13→M21 (direct horizontal, team1 slot)
  segs.push(...hLine('M13', 'M21'));
  segs.push(...hLine('M14', 'M22'));

  segs.push(...bracketMerge('M21', 'M22', 'M26'));

  // M26→M29 (team1 slot, horizontal)
  segs.push(...hLine('M26', 'M29'));

  // ── LOWER internal ──────────────────────────────────────────────────────
  segs.push(...hLine('M15', 'M17'));
  segs.push(...hLine('M16', 'M18'));
  segs.push(...hLine('M17', 'M23'));
  segs.push(...hLine('M18', 'M24'));

  segs.push(...bracketMerge('M23', 'M24', 'M27'));

  segs.push(...hLine('M27', 'M28'));
  segs.push(...hLine('M28', 'M30'));

  // ── Cross-section drops (loser feeds) ───────────────────────────────────
  // Loser M01/M08 → M09/M10 etc: shown via labels, no SVG (too complex)
  // Loser M19 → M21 team2 slot
  const [m21x, m21y] = POSITIONS['M21'];
  segs.push(...crossLine('M19', m21x, m21y + MATCH_H * 0.75, true));

  // Loser M20 → M22 team2 slot
  const [m22x, m22y] = POSITIONS['M22'];
  segs.push(...crossLine('M20', m22x, m22y + MATCH_H * 0.75, true));

  // Loser M25 → M29 team2 slot (loser of Upper Final drops to Lower Final)
  const [m29x, m29y] = POSITIONS['M29'];
  segs.push(...crossLine('M25', m29x, m29y + MATCH_H * 0.75, true));

  // Winner M25 → M30 team1 slot (winner of Upper Final goes to Gran Final)
  const [m30xUpper, m30yUpper] = POSITIONS['M30'];
  segs.push(...crossLine('M25', m30xUpper, m30yUpper + MATCH_H * 0.25, false));

  // Loser M26 → M28 team2 slot (cross-section)
  const [m28x, m28y] = POSITIONS['M28'];
  segs.push(...crossLine('M26', m28x, m28y + MATCH_H * 0.75, true));

  // Loser M29 → M30 team2 slot (cross-section)
  const [m30x, m30y] = POSITIONS['M30'];
  segs.push(...crossLine('M29', m30x, m30y + MATCH_H * 0.75, true));

  // Loser M14 → M17 team2 slot
  const [m17x, m17y] = POSITIONS['M17'];
  segs.push(...crossLine('M14', m17x, m17y + MATCH_H * 0.75, true));

  // Loser M13 → M18 team2 slot
  const [m18x, m18y] = POSITIONS['M18'];
  segs.push(...crossLine('M13', m18x, m18y + MATCH_H * 0.75, true));

  // Loser M21 → M23 team2 slot
  const [m23x, m23y] = POSITIONS['M23'];
  segs.push(...crossLine('M21', m23x, m23y + MATCH_H * 0.75, true));

  // Loser M22 → M24 team2 slot
  const [m24x, m24y] = POSITIONS['M24'];
  segs.push(...crossLine('M22', m24x, m24y + MATCH_H * 0.75, true));

  return segs;
}
