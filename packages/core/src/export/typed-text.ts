import type { Rect } from '@/core/rect';

export interface TypedLine {
  x0: number;
  x1: number;
  y0: number;
  y1: number;
  gaps?: number[];
}

export interface TypedText {
  background: string;
  ink: string;
  lines: TypedLine[];
}

const INK_DISTANCE = 90;
const CLEAN_DISTANCE = 24;
const MIN_LINE_HEIGHT = 3;
const MARK_RATIO = 0.45;
const WORD_GAP_RATIO = 3;
const MIN_INSET = 3;
const INSET_RATIO = 0.14;

function colorKey(data: Uint8ClampedArray, i: number): number {
  return ((data[i]! >> 4) << 8) | ((data[i + 1]! >> 4) << 4) | (data[i + 2]! >> 4);
}

function hex(r: number, g: number, b: number): string {
  return `#${[r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')}`;
}

export function typedTextInset(field: Rect): number {
  return Math.max(MIN_INSET, Math.round(Math.min(field.width, field.height) * INSET_RATIO));
}

export function analyzeTypedText(data: Uint8ClampedArray, width: number, height: number): TypedText | null {
  if (width <= 0 || height <= 0) return null;

  const counts = new Map<number, number>();
  for (let i = 0; i < data.length; i += 4) {
    const key = colorKey(data, i);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  let bgKey = 0;
  let best = -1;
  for (const [key, count] of counts) {
    if (count > best) {
      best = count;
      bgKey = key;
    }
  }

  let br = 0;
  let bg = 0;
  let bb = 0;
  let bn = 0;
  for (let i = 0; i < data.length; i += 4) {
    if (colorKey(data, i) !== bgKey) continue;
    br += data[i]!;
    bg += data[i + 1]!;
    bb += data[i + 2]!;
    bn++;
  }
  br /= bn;
  bg /= bn;
  bb /= bn;

  const inkRows: Array<[number, number] | null> = [];
  let ir = 0;
  let ig = 0;
  let ib = 0;
  let inkCount = 0;
  for (let y = 0; y < height; y++) {
    let x0 = -1;
    let x1 = -1;
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const distance = Math.abs(data[i]! - br) + Math.abs(data[i + 1]! - bg) + Math.abs(data[i + 2]! - bb);
      if (distance < INK_DISTANCE) continue;
      if (x0 < 0) x0 = x;
      x1 = x;
      ir += data[i]!;
      ig += data[i + 1]!;
      ib += data[i + 2]!;
      inkCount++;
    }
    inkRows.push(x0 < 0 ? null : [x0, x1]);
  }
  if (inkCount === 0) return null;

  const lines = mergeMarks(splitRows(inkRows));

  const kept = lines
    .filter((line) => line.y1 - line.y0 + 1 >= MIN_LINE_HEIGHT)
    .map((line) => trimTrailing(line, data, width, [br, bg, bb]));
  if (kept.length === 0) return null;

  return { background: hex(br, bg, bb), ink: hex(ir / inkCount, ig / inkCount, ib / inkCount), lines: kept };
}

function splitRows(rows: Array<[number, number] | null>): TypedLine[] {
  const lines: TypedLine[] = [];
  let open: TypedLine | null = null;
  rows.forEach((row, y) => {
    if (!row) {
      if (open) lines.push(open);
      open = null;
      return;
    }
    if (open) {
      open.x0 = Math.min(open.x0, row[0]);
      open.x1 = Math.max(open.x1, row[1]);
      open.y1 = y;
    } else {
      open = { x0: row[0], x1: row[1], y0: y, y1: y };
    }
  });
  if (open) lines.push(open);
  return lines;
}

function mergeMarks(segments: TypedLine[]): TypedLine[] {
  const lines = segments.map((line) => ({ ...line }));
  const tallest = Math.max(0, ...lines.map((line) => line.y1 - line.y0 + 1));
  let index = lines.findIndex((line) => line.y1 - line.y0 + 1 < tallest * MARK_RATIO);
  while (index >= 0 && lines.length > 1) {
    const mark = lines[index]!;
    const above = lines[index - 1];
    const below = lines[index + 1];
    const gapAbove = above ? mark.y0 - above.y1 : Number.POSITIVE_INFINITY;
    const gapBelow = below ? below.y0 - mark.y1 : Number.POSITIVE_INFINITY;
    const into = gapBelow <= gapAbove ? index + 1 : index - 1;
    const host = lines[into]!;
    lines[into] = {
      x0: Math.min(host.x0, mark.x0),
      x1: Math.max(host.x1, mark.x1),
      y0: Math.min(host.y0, mark.y0),
      y1: Math.max(host.y1, mark.y1),
    };
    lines.splice(index, 1);
    index = lines.findIndex((line) => line.y1 - line.y0 + 1 < tallest * MARK_RATIO);
  }
  return lines;
}

function trimTrailing(
  line: TypedLine,
  data: Uint8ClampedArray,
  width: number,
  bg: [number, number, number],
): TypedLine {
  const height = line.y1 - line.y0 + 1;
  const maxGap = Math.max(4, height * WORD_GAP_RATIO);
  const gaps: number[] = [];
  let end = line.x0;
  let empty = 0;
  for (let x = line.x0; x <= line.x1; x++) {
    let strongest = 0;
    for (let y = line.y0; y <= line.y1; y++) {
      const i = (y * width + x) * 4;
      const distance = Math.abs(data[i]! - bg[0]) + Math.abs(data[i + 1]! - bg[1]) + Math.abs(data[i + 2]! - bg[2]);
      strongest = Math.max(strongest, distance);
    }
    if (strongest < CLEAN_DISTANCE) gaps.push(x);
    if (strongest >= INK_DISTANCE) {
      end = x;
      empty = 0;
    } else if (++empty > maxGap) {
      break;
    }
  }
  return { ...line, x1: end, gaps: gaps.filter((x) => x < end) };
}

export function typingReveal(lines: TypedLine[], characters: number, progress: number): number[] {
  const widths = lines.map((line) => line.x1 - line.x0 + 1);
  const total = widths.reduce((sum, w) => sum + w, 0);
  const steps = Math.max(1, characters);
  const typed = Math.min(steps, Math.floor(Math.max(0, Math.min(1, progress)) * steps + 1e-9));
  let remaining = (typed / steps) * total;
  return lines.map((line, index) => {
    const shown = Math.min(widths[index]!, remaining);
    remaining -= shown;
    const at = line.x0 + shown;
    if (shown <= 0 || shown >= widths[index]!) return at;
    const snapped = line.gaps?.filter((x) => x <= at).pop();
    return snapped === undefined ? at : snapped;
  });
}
