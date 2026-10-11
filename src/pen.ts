// Copyright 2026 UpBilim
// SPDX-License-Identifier: Apache-2.0
// Board pen: shapes are built from simple parts (polyline stroke, fill, text, formula, image) in 320×180 board units.
// Each part knows its "length", which lets the board draw an object over time: strokes are traced by the marker from
// start to end, fills fade in after the outline, text is written left to right.
import type { TBox } from './tex';

export type Box = { x: number; y: number; w: number; h: number };
interface Base { o: number; a: number; b: number }
export type Prim = Base & (
  | { k: 'line'; pts: number[]; c: string; w: number; dash: boolean; len: number; path?: Path2D }
  | { k: 'fill'; pts: number[]; c: string; path?: Path2D }
  | { k: 'text'; s: string; x: number; y: number; size: number; c: string; w: number; outline: boolean; bold: boolean; align: 'left' | 'center' }
  | { k: 'tex'; bx: TBox; x: number; y: number; c: string }
  | { k: 'img'; img: HTMLImageElement | null; x: number; y: number; w: number; h: number }
);
type Dist<T> = T extends unknown ? Omit<T, 'o' | 'a' | 'b'> : never;
export type PrimIn = Dist<Prim>;

export const SANS = '"Inter", system-ui, sans-serif';
let mctx: CanvasRenderingContext2D | null = null;
export const textW = (s: string, size: number, bold = false) => {
  mctx ??= document.createElement('canvas').getContext('2d')!;
  mctx.font = `${bold ? 700 : 600} ${size}px ${SANS}`;
  return mctx.measureText(s).width;
};

// command line width (1–3) → marker width in board units
export const lwOf = (v: unknown) => { const n = typeof v === 'number' && Number.isFinite(v) ? Math.max(0.5, Math.min(4, v)) : 2; return 0.4 + n * 0.66; };

/** Color with alpha: #RGB / #RRGGBB → rgba(). */
export function alpha(hex: string, a: number) {
  let h = hex.replace('#', '');
  if (h.length === 3) h = [...h].map((x) => x + x).join('');
  if (h.length < 6) return hex;
  const n = parseInt(h.slice(0, 6), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

export const ellipsePts = (cx: number, cy: number, rx: number, ry: number, a0 = 0, a1 = Math.PI * 2, wob = 0) => {
  const n = Math.max(16, Math.min(120, Math.round(((rx + ry) * Math.abs(a1 - a0)) / 3)));
  const out: number[] = [];
  for (let i = 0; i <= n; i++) {
    const a = a0 + ((a1 - a0) * i) / n, k = 1 + wob * Math.sin(a * 3 + 1);
    out.push(cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k);
  }
  return out;
};

export const rectPts = (x: number, y: number, w: number, h: number, r = 0) => {
  if (r <= 0) return [x, y, x + w, y, x + w, y + h, x, y + h, x, y];
  r = Math.min(r, w / 2, h / 2);
  const out: number[] = [];
  const arc = (cx: number, cy: number, a: number) => { for (let i = 0; i <= 4; i++) { const t = a + (i / 4) * (Math.PI / 2); out.push(cx + Math.cos(t) * r, cy + Math.sin(t) * r); } };
  arc(x + w - r, y + r, -Math.PI / 2); arc(x + w - r, y + h - r, 0); arc(x + r, y + h - r, Math.PI / 2); arc(x + r, y + r, Math.PI);
  out.push(out[0]!, out[1]!);
  return out;
};

export class Pen {
  prims: Prim[] = [];
  private seq = 0;
  // o is the part's position in drawing "time" (on-screen paint order is the array order)
  push(p: PrimIn, o = this.seq++) { this.prims.push({ ...p, o, a: 0, b: 1 } as Prim); }

  line(pts: number[], c: string, w = 1.7, dash = false) {
    if (pts.length < 4) return;
    let len = 0;
    for (let i = 2; i < pts.length; i += 2) len += Math.hypot(pts[i]! - pts[i - 2]!, pts[i + 1]! - pts[i - 1]!);
    this.push({ k: 'line', pts, c, w, dash, len });
  }
  fill(pts: number[], c: string) { if (pts.length >= 6) this.push({ k: 'fill', pts, c }); }
  // closed shape: the outline is traced first, then the fill fades in beneath it
  shape(pts: number[], o: { fill?: string | null; stroke?: string | null; w?: number; dash?: boolean }) {
    if (o.fill && o.stroke) {
      const s = this.seq; this.seq += 2;
      this.push({ k: 'fill', pts, c: o.fill }, s + 1);
      let len = 0;
      for (let i = 2; i < pts.length; i += 2) len += Math.hypot(pts[i]! - pts[i - 2]!, pts[i + 1]! - pts[i - 1]!);
      this.push({ k: 'line', pts, c: o.stroke, w: o.w ?? 1, dash: !!o.dash, len }, s);
    } else if (o.fill) this.fill(pts, o.fill);
    else if (o.stroke) this.line(pts, o.stroke, o.w, o.dash);
  }
  arrowHead(x1: number, y1: number, x2: number, y2: number, c: string, w: number) {
    const a = Math.atan2(y2 - y1, x2 - x1), l = 4 + w * 2.2;
    this.fill([x2 + Math.cos(a) * w * 0.6, y2 + Math.sin(a) * w * 0.6, x2 - l * Math.cos(a - 0.42), y2 - l * Math.sin(a - 0.42), x2 - l * Math.cos(a + 0.42), y2 - l * Math.sin(a + 0.42)], c);
  }
  text(s: string, x: number, y: number, size: number, c: string, o: { outline?: boolean; bold?: boolean; align?: 'left' | 'center' } = {}) {
    const w = textW(s, size, o.bold);
    this.push({ k: 'text', s, x, y, size, c, w, outline: o.outline ?? true, bold: !!o.bold, align: o.align ?? 'left' });
    return w;
  }
  tex(b: TBox, x: number, baseline: number, c: string) { this.push({ k: 'tex', bx: b, x, y: baseline, c }); }
  img(img: HTMLImageElement | null, x: number, y: number, w: number, h: number) { this.push({ k: 'img', img, x, y, w, h }); }
}

// part's weight in time (≈ how long the marker "travels")
const weight = (p: Prim) => p.k === 'line' ? p.len : p.k === 'fill' ? 9 : p.k === 'text' ? p.w * 1.4 + 8 : p.k === 'tex' ? p.bx.w * 1.6 + 10 : 60;

/** Lay out parts in time (a..b is the fraction of the whole object's drawing); return the total "weight". */
export function timeline(prims: Prim[]) {
  const order = [...prims].sort((p, q) => p.o - q.o);
  const total = order.reduce((s, p) => s + weight(p), 0) || 1;
  let acc = 0;
  for (const p of order) { p.a = acc / total; acc += weight(p); p.b = acc / total; }
  return total;
}

/** Bounding box of all parts. */
export function bounds(prims: Prim[]): Box | null {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  const add = (x: number, y: number, m = 0) => { x0 = Math.min(x0, x - m); y0 = Math.min(y0, y - m); x1 = Math.max(x1, x + m); y1 = Math.max(y1, y + m); };
  for (const p of prims) {
    if (p.k === 'line' || p.k === 'fill') for (let i = 0; i < p.pts.length; i += 2) add(p.pts[i]!, p.pts[i + 1]!, p.k === 'line' ? p.w / 2 : 0);
    else if (p.k === 'text') { const x = p.align === 'center' ? p.x - p.w / 2 : p.x; add(x, p.y); add(x + p.w, p.y + p.size * 1.2); }
    else if (p.k === 'tex') { add(p.x, p.y - p.bx.h); add(p.x + p.bx.w, p.y + p.bx.d); }
    else { add(p.x, p.y); add(p.x + p.w, p.y + p.h); }
  }
  return x0 === Infinity ? null : { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
}

const pathOf = (pts: number[], close: boolean) => {
  const p = new Path2D();
  p.moveTo(pts[0]!, pts[1]!);
  for (let i = 2; i < pts.length; i += 2) p.lineTo(pts[i]!, pts[i + 1]!);
  if (close) p.closePath();
  return p;
};

/** Draw the object's parts at progress p (0..1). Returns the "marker tip": where drawing is happening now. */
export function paint(g: CanvasRenderingContext2D, prims: Prim[], p: number): [number, number] | null {
  let head: [number, number] | null = null;
  for (const q of prims) {
    const t = p >= 1 ? 1 : Math.max(0, Math.min(1, (p - q.a) / Math.max(1e-6, q.b - q.a)));
    if (t <= 0) continue;
    if (q.k === 'line') {
      g.strokeStyle = q.c; g.lineWidth = q.w; g.lineCap = 'round'; g.lineJoin = 'round';
      g.setLineDash(q.dash ? [q.w * 2.4, q.w * 2.2] : []);
      if (t >= 1) { q.path ??= pathOf(q.pts, false); g.stroke(q.path); }
      else {
        // partially drawn stroke: trace the polyline up to the required length
        let left = q.len * t;
        g.beginPath(); g.moveTo(q.pts[0]!, q.pts[1]!);
        let hx = q.pts[0]!, hy = q.pts[1]!;
        for (let i = 2; i < q.pts.length && left > 0; i += 2) {
          const x0 = q.pts[i - 2]!, y0 = q.pts[i - 1]!, x1 = q.pts[i]!, y1 = q.pts[i + 1]!;
          const L = Math.hypot(x1 - x0, y1 - y0);
          if (L <= left) { g.lineTo(x1, y1); hx = x1; hy = y1; left -= L; }
          else { const k = left / L; hx = x0 + (x1 - x0) * k; hy = y0 + (y1 - y0) * k; g.lineTo(hx, hy); left = 0; }
        }
        g.stroke();
        head = [hx, hy];
      }
      g.setLineDash([]);
    } else if (q.k === 'fill') {
      q.path ??= pathOf(q.pts, true);
      const a = g.globalAlpha;
      g.globalAlpha = a * (t >= 1 ? 1 : t * t * (3 - 2 * t));
      g.fillStyle = q.c; g.fill(q.path);
      g.globalAlpha = a;
    } else if (q.k === 'text' || q.k === 'tex') {
      const w = q.k === 'text' ? q.w : q.bx.w;
      const x = q.k === 'text' && q.align === 'center' ? q.x - w / 2 : q.x;
      const top = q.k === 'text' ? q.y - 4 : q.y - q.bx.h - 4, hh = q.k === 'text' ? q.size * 1.4 + 8 : q.bx.h + q.bx.d + 8;
      if (t < 1) { g.save(); g.beginPath(); g.rect(x - 3, top, w * t + 3, hh); g.clip(); head = [x + w * t, top + hh * 0.6]; }
      if (q.k === 'text') {
        g.font = `${q.bold ? 700 : 600} ${q.size}px ${SANS}`; g.textBaseline = 'top'; g.textAlign = 'left';
        if (q.outline) { g.lineWidth = Math.max(1.2, q.size * 0.2); g.lineJoin = 'round'; g.strokeStyle = '#10142E'; g.strokeText(q.s, x, q.y); }
        g.fillStyle = q.c; g.fillText(q.s, x, q.y);
      } else q.bx.draw(g, q.x, q.y, q.c);
      if (t < 1) g.restore();
    } else if (q.img) {
      const a = g.globalAlpha;
      g.globalAlpha = a * t;
      g.drawImage(q.img, q.x, q.y, q.w, q.h);
      g.globalAlpha = a;
    }
  }
  return head;
}
