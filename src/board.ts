// Copyright 2026 UpBilim
// SPDX-License-Identifier: Apache-2.0
// UpBilim Board: a vector whiteboard for AI tutors. An LLM draws with short JSON commands on a 320×180 grid
// (small numbers mean fewer tokens), and the board renders them as smooth high-resolution lines.
// Live drawing: every object appears over time like a marker: the outline is traced, the fill fades in beneath it,
// text is written left to right, and a pointer marker follows the line tip. Objects stay live: they move, highlight, erase.
// For STEM: textbook formulas (formula; step: step-by-step solutions aligned on "="), axes and function graphs
// (axes, plot, dot), number lines and intervals, geometry (angle, vertex labels, tick marks), auto-layout diagrams
// (schema) and marker highlighting (mark).
// Board memory: scene() reports what is drawn and where (names, positions, free space); it is sent to the model with each turn.
import { tex, splitEq, type TBox } from './tex';
import { compile, niceStep, fmtNum } from './expr';
import { icon } from './icons';
import { layoutSchema } from './schema';
import { Pen, alpha, bounds, ellipsePts, lwOf, paint, rectPts, textW, timeline, type Box, type Prim } from './pen';

export { ICONS } from './icons';
export const W = 320, H = 180;
export type Cmd = Record<string, unknown> & { op: string };
const K = 6;                       // real pixels per board unit (1920×1080)
const BG = '#1D2B53';
const num = (v: unknown, d = 0) => (typeof v === 'number' && Number.isFinite(v) ? v : typeof v === 'string' && v.trim() && Number.isFinite(+v) ? +v : d);
const col = (v: unknown, d = '#FFF1E8') => (typeof v === 'string' && /^#[0-9a-f]{3,8}$/i.test(v) ? v : d);
const str = (v: unknown, n: number) => String(v ?? '').slice(0, n);
const overlaps = (a: Box, b: Box) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
const union = (bs: Box[]): Box | null => {
  if (!bs.length) return null;
  const x0 = Math.min(...bs.map((b) => b.x)), y0 = Math.min(...bs.map((b) => b.y));
  return { x: x0, y: y0, w: Math.max(...bs.map((b) => b.x + b.w)) - x0, h: Math.max(...bs.map((b) => b.y + b.h)) - y0 };
};
const TEXT_SIZE: Record<number, number> = { 0: 8, 1: 12, 2: 22, 3: 34 };
const TEX_SIZE: Record<number, number> = { 1: 14, 2: 20, 3: 30 };
const isTex = (s: string) => /\\[a-zA-Z]|\^\{|_\{/.test(s);

interface Anim { type: string; period: number; dx: number; dy: number; cx: number; cy: number; r: number; angle: number; scale: number; loop: string; a0: number }
interface Item { id: string | null; auto?: string; op: string; prims: Prim[]; box: Box; anim: Anim | null; t0: number; at: number; dur: number; clip?: Box; kind: string; text: string }
interface Sys { kind: 'axes' | 'line'; X: (v: number) => number; Y: (v: number) => number; box: Box; xmin: number; xmax: number; ymin: number; ymax: number }
interface StepLine { s: string; note: string; full: TBox; l: TBox | null; r: TBox | null; n: TBox | null }
interface Steps { x: number; y: number; size: number; c: string; lines: StepLine[]; box: Box | null }

export class Board {
  private out: CanvasRenderingContext2D;
  private bg = BG;
  private items: Item[] = [];
  private labels: Box[] = [];                          // areas taken by labels, so new ones don't overlap
  private highlights: Array<{ box: Box; until: number; t0: number }> = [];
  private pointer = { x: W / 2, y: H / 2, tx: W / 2, ty: H / 2, until: 0, on: 0, c: '#FFEC27' };
  private sys = new Map<string, Sys>();                // coordinate systems (axes, number lines), by name
  private lastSys = '';
  private groups = new Map<string, { kind: string; parts: Array<[string, string]> }>();
  private steps = new Map<string, Steps>();
  private pics: Array<{ it: Item; img: HTMLImageElement | null; cap: string }> = [];
  private title = '';
  private instant = false;
  private raf = 0;
  private idle = 0;
  private seq = 0;
  private after: Array<(delay: number) => void> = [];                                     // auto-names for unnamed objects ("o7") so the AI can point at them

  // onTitle: the diagram title is shown ABOVE the board (never gets in the way of the drawing)
  constructor(private canvas: HTMLCanvasElement, private onTitle: (s: string) => void = () => {}) {
    canvas.width = W * K; canvas.height = H * K;
    this.out = canvas.getContext('2d')!;
    this.clear(BG);
    this.loop();
  }

  destroy() { cancelAnimationFrame(this.raf); }

  /** Draw instantly, without the appear animation (e.g. when joining a lesson whose board is already drawn). */
  drawAll(cmds: Cmd[]) { this.instant = true; try { for (const c of cmds) this.draw(c); } finally { this.instant = false; } }

  /* ------------------------------ frame assembly ------------------------------ */

  private loop = () => {
    const now = performance.now();
    // nothing is moving or drawing, so skip rebuilding the frame (saves phone battery)
    const busy = this.idle < 2 || this.pointer.on > 0.01 || this.highlights.length || this.items.some((i) => i.anim || now - i.t0 < i.dur + 50);
    if (busy) { this.compose(now); this.idle++; }
    this.raf = requestAnimationFrame(this.loop);
  };
  private wake() { this.idle = 0; }

  private compose(now: number) {
    const g = this.out;
    g.setTransform(K, 0, 0, K, 0, 0); g.globalAlpha = 1;
    g.fillStyle = this.bg; g.fillRect(0, 0, W, H);
    // subtle "chalkboard" look: the center is slightly lighter than the edges
    const v = g.createRadialGradient(W / 2, H / 2, 20, W / 2, H / 2, W * 0.62);
    v.addColorStop(0, 'rgba(255,255,255,0.045)'); v.addColorStop(1, 'rgba(0,0,0,0.18)');
    g.fillStyle = v; g.fillRect(0, 0, W, H);
    let head: [number, number] | null = null, headC = '';
    for (const it of this.items) {
      const p = (now - it.t0) / it.dur;
      if (p <= 0) continue;
      g.save();
      if (it.clip) { g.beginPath(); g.rect(it.clip.x, it.clip.y, it.clip.w, it.clip.h); g.clip(); }
      const cx = it.box.x + it.box.w / 2, cy = it.box.y + it.box.h / 2;
      // repeating motion runs on a shared clock (parts of one object stay in sync); "once" runs from appearance
      if (it.anim) this.transform(g, it.anim, (it.anim.loop === 'once' ? now - it.at : now) / 1000, cx, cy);
      const h = paint(g, it.prims, Math.min(1, p));
      g.restore();
      if (p < 1) { head = h ?? head ?? [cx, cy]; const first = it.prims[0]; headC = first && 'c' in first ? first.c : headC; }
    }
    // highlight what the teacher is talking about: a softly pulsing frame
    this.highlights = this.highlights.filter((h) => h.until > now);
    for (const h of this.highlights) {
      const k = 0.55 + 0.45 * Math.sin((now - h.t0) / 180), b = h.box, pad = 3 + k;
      g.strokeStyle = alpha('#FFEC27', 0.5 + 0.5 * k); g.lineWidth = 1.4; g.setLineDash([4, 3]); g.lineDashOffset = -now / 60;
      g.beginPath(); g.roundRect(b.x - pad, b.y - pad, b.w + pad * 2, b.h + pad * 2, 4); g.stroke();
      g.setLineDash([]); g.lineDashOffset = 0;
    }
    // pointer marker: follows the line tip while drawing; moves to the object being pointed at
    const pt = this.pointer;
    if (head) { pt.tx = head[0]; pt.ty = head[1]; pt.until = Math.max(pt.until, now + 350); if (/^#/.test(headC)) pt.c = headC; }
    const show = pt.until > now;
    pt.on += ((show ? 1 : 0) - pt.on) * 0.18;
    const k = head ? 0.45 : 0.16;
    pt.x += (pt.tx - pt.x) * k; pt.y += (pt.ty - pt.y) * k;
    if (pt.on > 0.01) this.marker(g, pt.x, pt.y + (head ? 0 : Math.sin(now / 200) * 0.8), pt.c, pt.on);
  }

  // marker: tip at (x, y), body extending up and to the right
  private marker(g: CanvasRenderingContext2D, x: number, y: number, c: string, a: number) {
    g.save();
    g.globalAlpha = a; g.translate(x, y); g.rotate(-0.85);
    g.fillStyle = 'rgba(0,0,0,0.25)'; g.beginPath(); g.roundRect(7, -1.2, 22, 5, 1.5); g.fill();   // shadow
    g.fillStyle = c; g.beginPath(); g.moveTo(0, 0); g.lineTo(4.5, -1.4); g.lineTo(4.5, 1.4); g.closePath(); g.fill();   // tip
    g.fillStyle = '#3A3F55'; g.fillRect(4.5, -1.9, 3, 3.8);
    g.fillStyle = '#F2F2F7'; g.beginPath(); g.roundRect(7.5, -2.4, 18, 4.8, 1); g.fill();
    g.fillStyle = '#C9CAD6'; g.fillRect(7.5, 0.9, 18, 1.5);
    g.fillStyle = c; g.beginPath(); g.roundRect(25.5, -2.6, 4, 5.2, 1.2); g.fill();   // cap in the marker's color
    g.restore();
  }

  private transform(g: CanvasRenderingContext2D, a: Anim, t: number, cx: number, cy: number) {
    const ph = (t % a.period) / a.period;
    const wave = 0.5 - 0.5 * Math.cos(ph * Math.PI * 2);
    const prog = a.loop === 'once' ? Math.min(1, t / a.period) : a.loop === 'pingpong' ? wave : ph;
    switch (a.type) {
      case 'move': case 'fall': case 'rise':
        g.translate(a.dx * prog, a.dy * prog);
        if (a.type !== 'move' && a.loop !== 'once') g.globalAlpha = Math.min(1, (1 - ph) * 4, ph * 10);
        return;
      case 'orbit': { const ang = a.a0 + ph * Math.PI * 2; g.translate(a.cx + Math.cos(ang) * a.r - cx, a.cy + Math.sin(ang) * a.r - cy); return; }
      case 'spin': g.translate(cx, cy); g.rotate(ph * Math.PI * 2); g.translate(-cx, -cy); return;
      case 'swing': g.translate(a.cx, a.cy); g.rotate(((a.angle * Math.PI) / 180) * Math.sin(ph * Math.PI * 2)); g.translate(-a.cx, -a.cy); return;
      case 'pulse': { const s = 1 + (a.scale - 1) * wave; g.translate(cx, cy); g.scale(s, s); g.translate(-cx, -cy); return; }
      case 'blink': g.globalAlpha = ph < 0.5 ? 1 : 0.15; return;
      case 'shake': g.translate(Math.sin(t * 40) * 1.5, 0); return;
    }
  }

  private parseAnim(v: unknown, box: Box): Anim | null {
    if (!v || typeof v !== 'object') return null;
    const a = v as Record<string, unknown>;
    const type = String(a.type ?? '');
    if (!['move', 'fall', 'rise', 'orbit', 'spin', 'swing', 'pulse', 'blink', 'shake'].includes(type)) return null;
    const icx = box.x + box.w / 2, icy = box.y + box.h / 2, cx = num(a.cx, icx), cy = num(a.cy, icy);
    return {
      type, period: Math.max(0.3, Math.min(20, num(a.period, 2))),
      dx: num(a.dx, 0), dy: num(a.dy, type === 'fall' ? 40 : type === 'rise' ? -40 : 0),
      cx, cy, r: num(a.r, Math.hypot(icx - cx, icy - cy) || 30),
      angle: num(a.angle, 30), scale: Math.max(1, Math.min(2, num(a.scale, 1.2))),
      loop: a.loop === 'once' || a.loop === 'pingpong' ? String(a.loop) : type === 'move' ? 'pingpong' : 'repeat',
      a0: Math.atan2(icy - cy, icx - cx),
    };
  }

  /* ------------------------------- commands ------------------------------- */

  clear(bg = BG) {
    this.bg = bg;
    this.items = []; this.labels = []; this.highlights = []; this.pics = [];
    this.sys.clear(); this.groups.clear(); this.steps.clear(); this.lastSys = '';
    this.title = ''; this.onTitle(''); this.seq = 0;
    this.wake();
  }

  // by name: the object itself or all of its parts ("s" → "s.1", "s.a1"…)
  private find(id: unknown) { return typeof id === 'string' && id ? this.items.filter((i) => i.id === id || i.auto === id || !!i.id?.startsWith(`${id}.`)) : []; }

  /** A teacher command. */
  draw(c: Cmd) { this.exec(c, 0); this.wake(); }

  private exec(c: Cmd, delay: number) {
    const now = performance.now();
    switch (c.op) {
      case 'clear': return this.clear(col(c.bg, BG));
      case 'erase': {
        const gone = this.find(c.id);
        this.items = this.items.filter((i) => !gone.includes(i));
        const id = String(c.id ?? '');
        this.sys.delete(id); this.groups.delete(id); this.steps.delete(id);
        if (this.pics.some((p) => gone.includes(p.it))) { this.pics = this.pics.filter((p) => !gone.includes(p.it)); this.layoutPics(); }
        return;
      }
      case 'anim': { for (const i of this.find(c.id)) { i.anim = c.type === 'stop' ? null : this.parseAnim(c, i.box); i.at = now; } return; }
      case 'title': this.title = str(c.s, 60); return this.onTitle(this.title);
      case 'point': {
        const box = union(this.find(c.id).map((i) => i.box)) ?? (() => { const m = this.mapPt(c, num(c.x, W / 2), num(c.y, H / 2)); return { x: m[0] - 6, y: m[1] - 6, w: 12, h: 12 }; })();
        this.highlights.push({ box, until: now + delay + Math.max(800, Math.min(8000, num(c.ms, 2500))), t0: now });
        Object.assign(this.pointer, { tx: Math.min(W - 10, box.x + box.w * 0.75), ty: box.y + box.h * 0.5, until: now + delay + 2600, c: '#FFEC27' });
        return;
      }
      case 'pendulum': case 'atom': case 'wave': case 'road': case 'crosswalk': case 'trafficlight': return this.composite(c, delay);
      case 'pic': return this.addPic(c, now);
      case 'step': return this.step(c, delay);
      case 'schema': return this.schema(c, delay);
      case 'mark': return this.mark(c, delay);
    }
    const m = this.mapCmd(c);
    const pen = new Pen();
    const info = this.paint(m, pen);
    if (!info) return;
    this.add(m, pen, delay, info);
    for (const f of this.after.splice(0)) f(delay);
  }

  // new object from pen parts; the same name replaces the object (appears quickly: it is a state change)
  private add(c: Cmd, pen: Pen, delay: number, info: { kind: string; text?: string; min?: number; id?: string | null; clip?: Box }) {
    if (!pen.prims.length) return null;
    const box = bounds(pen.prims);
    if (!box) return null;
    const total = timeline(pen.prims);
    const id = info.id !== undefined ? info.id : typeof c.id === 'string' && c.id ? c.id : null;
    const replaced = !!id && this.items.some((i) => i.id === id);
    if (id) this.items = this.items.filter((i) => i.id !== id);
    const now = performance.now();
    const it: Item = {
      id, op: c.op, prims: pen.prims, box, anim: this.parseAnim(c.anim, box), clip: info.clip ?? (c.clip && typeof c.clip === 'object' ? c.clip as Box : undefined),
      t0: this.instant ? -1e9 : now + delay, at: now + delay, dur: replaced ? 180 : Math.max(info.min ?? 220, Math.min(1800, total * 3.2)),
      kind: info.kind, text: info.text ?? '', auto: id ? undefined : `o${++this.seq}`,
    };
    this.items.push(it);
    return it;
  }

  /* ----------------------------- coordinates ----------------------------- */

  // command "in axis coordinates" ("axes":"ax" / "on":"nl"): numbers are mathematical, the board maps them to board points
  private sysOf(c: Cmd) { const id = typeof c.axes === 'string' ? c.axes : typeof c.on === 'string' ? c.on : ''; return id ? this.sys.get(id) ?? null : null; }
  private mapPt(c: Cmd, x: number, y: number): [number, number] { const s = this.sysOf(c); return s ? [s.X(x), s.Y(y)] : [x, y]; }
  private mapCmd(c: Cmd): Cmd {
    const s = this.sysOf(c);
    if (!s || ['plot', 'interval', 'axes', 'numberline'].includes(c.op)) return c;
    const m: Cmd = { ...c };
    const P = (v: unknown) => (Array.isArray(v) ? [s.X(num(v[0])), s.Y(num(v[1]))] : v);
    if (typeof c.x === 'number') m.x = s.X(c.x);
    if (typeof c.y === 'number' || s.kind === 'line') m.y = s.Y(num(c.y));
    for (const [a, b] of [['x1', 'y1'], ['x2', 'y2']] as const) if (typeof c[a] === 'number') { m[a] = s.X(c[a] as number); m[b] = s.Y(num(c[b])); }
    if (Array.isArray(c.pts)) m.pts = (c.pts as unknown[]).map(P);
    if (c.a) m.a = P(c.a);
    if (c.b) m.b = P(c.b);
    if (c.to && typeof c.to === 'object') { const t = c.to as Record<string, unknown>; m.to = { x: s.X(num(t.x)), y: s.Y(num(t.y)) }; }
    return m;
  }

  /* ------------------------------- labels ------------------------------- */

  // label placement: not off the board edge and not on another label (search the nearest free spot: below, above, right, left)
  private place(x: number, y: number, w: number, h: number, pad: number, place = true): [number, number] {
    const clamp = (cx: number, cy: number) => [Math.max(2 + pad, Math.min(cx, W - w - 2 - pad)), Math.max(2 + pad, Math.min(cy, H - h - 2 - pad))] as const;
    [x, y] = clamp(x, y);
    const at = (cx: number, cy: number) => ({ x: cx - pad, y: cy - pad, w: w + pad * 2, h: h + pad * 2 });
    // overlaps a label: find the nearest spot free of labels and other objects (the background doesn't count);
    // if none is found, stay where requested
    const solid = this.items.filter((i) => i.box.w * i.box.h < W * H * 0.35 && i.kind !== 'grid').map((i) => i.box);
    const free = (b: Box) => !this.labels.some((l) => overlaps(l, b)) && !solid.some((o) => overlaps(o, b));
    if (place && this.labels.some((b) => overlaps(b, at(x, y)))) {
      const sy = h + pad * 2 + 2, sx = Math.min(60, w + pad * 2 + 4);
      search: for (let k = 1; k <= 5; k++) {
        for (const [dx, dy] of [[0, sy], [0, -sy], [sx, 0], [-sx, 0], [sx, sy], [-sx, -sy]] as const) {
          const [cx, cy] = clamp(x + dx * k, y + dy * k);
          if (free(at(cx, cy))) { x = cx; y = cy; break search; }
        }
      }
    }
    if (place) this.labels.push(at(x, y));
    return [x, y];
  }

  // text in a box: pick the size and line breaks so it fits
  private fit(s: string, w: number, h: number, max: number, bold: boolean) {
    for (let size = max; size >= 5.5; size -= 0.5) {
      const lines: string[] = [];
      for (const para of s.split('\n')) {
        let cur = '';
        for (const word of para.split(/\s+/).filter(Boolean)) {
          const t = cur ? `${cur} ${word}` : word;
          if (textW(t, size, bold) <= w || !cur) cur = t; else { lines.push(cur); cur = word; }
        }
        lines.push(cur);
      }
      if (lines.length * size * 1.18 <= h && lines.every((l) => textW(l, size, bold) <= w)) return { size, lines };
      if (size <= 6) {
        // smallest size and a long word still doesn't fit: hyphenate by syllables
        const out: string[] = [];
        for (const l of lines) {
          let rest = l;
          while (textW(rest, size, bold) > w && rest.length > 4) {
            let k = rest.length - 1;
            while (k > 2 && textW(`${rest.slice(0, k)}-`, size, bold) > w) k--;
            // by syllables: split after a vowel before a consonant, e.g. «Испаре-ние», if such a spot is nearby
            const V = /[аеёиоуыэюяaeiouўАЕЁИОУЫЭЮЯ]/;
            for (let j = k; j > Math.max(2, k - 4); j--) if (V.test(rest[j - 1]!) && !V.test(rest[j]!)) { k = j; break; }
            out.push(`${rest.slice(0, k)}-`); rest = rest.slice(k);
          }
          out.push(rest);
        }
        return { size, lines: out };
      }
    }
    return { size: 6, lines: [s] };
  }

  /* ------------------------------ drawing ------------------------------ */

  private paint(c: Cmd, pen: Pen): { kind: string; text?: string; min?: number; clip?: Box } | null {
    const w = lwOf(c.lw), dash = c.dash === true, cc = col(c.c);
    const fillC = (d: string) => (typeof c.alpha === 'number' ? alpha(col(c.c, d), Math.max(0.05, Math.min(1, c.alpha))) : col(c.c, d));
    switch (c.op) {
      case 'rect': {
        const x = num(c.x), y = num(c.y), ww = Math.max(1, num(c.w, 1)), hh = Math.max(1, num(c.h, 1)), pts = rectPts(x, y, ww, hh, num(c.r, 0));
        if (c.fill === false) pen.line(pts, cc, w, dash);
        else pen.shape(pts, { fill: fillC('#FFF1E8'), stroke: typeof c.stroke === 'string' ? col(c.stroke) : null, w: 1 });
        return { kind: 'rect' };
      }
      case 'circle': case 'ellipse': {
        const x = num(c.x), y = num(c.y), rx = Math.max(0.5, num(c.op === 'circle' ? c.r : c.rx, 1)), ry = Math.max(0.5, num(c.op === 'circle' ? c.r : c.ry, 1));
        const pts = ellipsePts(x, y, rx, ry, -Math.PI / 2, Math.PI * 1.5);
        if (c.fill === true) pen.shape(pts, { fill: fillC('#FFF1E8'), stroke: typeof c.stroke === 'string' ? col(c.stroke) : null, w: 1 });
        else pen.line(pts, cc, w, dash);
        return { kind: c.op };
      }
      case 'pie': {
        const x = num(c.x), y = num(c.y), r = Math.max(1, num(c.r, 1)), from = num(c.from), to = num(c.to, 360);
        const a0 = ((from - 90) * Math.PI) / 180, a1 = ((to - 90 + (to < from ? 360 : 0)) * Math.PI) / 180;
        const arc = ellipsePts(x, y, r, r, a0, a1);
        pen.shape(to - from >= 360 ? arc : [x, y, ...arc, x, y], { fill: fillC('#FF004D'), stroke: typeof c.stroke === 'string' ? col(c.stroke) : null, w: 1 });
        return { kind: 'pie' };
      }
      case 'poly': {
        const pts = this.pts(c.pts, 40);
        if (pts.length < 4) return null;
        const closed = [...pts, pts[0]!, pts[1]!];
        if (c.fill === false) pen.line(closed, cc, w, dash);
        else pen.shape(closed, { fill: fillC('#008751'), stroke: typeof c.stroke === 'string' ? col(c.stroke) : null, w: 1 });
        // vertex labels (A, B, C) go outside the shape
        const names = Array.isArray(c.names) ? (c.names as unknown[]).map((n) => str(n, 3)) : [];
        if (names.length) {
          const n = pts.length / 2, mx = pts.filter((_, i) => i % 2 === 0).reduce((a, b) => a + b, 0) / n, my = pts.filter((_, i) => i % 2).reduce((a, b) => a + b, 0) / n;
          names.forEach((nm, i) => {
            if (!nm || i >= n) return;
            const px = pts[i * 2]!, py = pts[i * 2 + 1]!, d = Math.hypot(px - mx, py - my) || 1;
            const tx = px + ((px - mx) / d) * 8, ty = py + ((py - my) / d) * 8;
            pen.tex(tex(nm, 13), tx - tex(nm, 13).w / 2, ty + 4.5, col(c.tc, '#FFF1E8'));
          });
        }
        return { kind: 'poly', text: names.join('') };
      }
      case 'path': {
        const pts = this.pts(c.pts, 800);
        if (pts.length < 4) return null;
        pen.line(pts, cc, w, dash);
        if (c.arrow === true) { const n = pts.length; pen.arrowHead(pts[n - 4]!, pts[n - 3]!, pts[n - 2]!, pts[n - 1]!, cc, w); }
        return { kind: 'path' };
      }
      case 'line': case 'arrow': {
        const x1 = num(c.x1), y1 = num(c.y1), x2 = num(c.x2), y2 = num(c.y2);
        const L = Math.hypot(x2 - x1, y2 - y1) || 1, ux = (x2 - x1) / L, uy = (y2 - y1) / L;
        pen.line([x1, y1, x2 - (c.op === 'arrow' ? ux * w : 0), y2 - (c.op === 'arrow' ? uy * w : 0)], cc, w, dash);
        if (c.op === 'arrow') pen.arrowHead(x1, y1, x2, y2, cc, w);
        if (c.both === true) pen.arrowHead(x2, y2, x1, y1, cc, w);
        // tick marks for equal segments and a length label
        const ticks = Math.max(0, Math.min(3, Math.round(num(c.ticks, 0)))), mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
        for (let i = 0; i < ticks; i++) { const o = (i - (ticks - 1) / 2) * 2.5; pen.line([mx + ux * o - uy * 3.5, my + uy * o + ux * 3.5, mx + ux * o + uy * 3.5, my + uy * o - ux * 3.5], cc, 1); }
        const s = str(c.s, 24);
        if (s) {
          const nx = uy > 0 || (uy === 0 && ux < 0) ? uy : -uy, ny = uy > 0 || (uy === 0 && ux < 0) ? -ux : ux;   // normal points up/outward
          const b = isTex(s) ? tex(s, 13) : null, tw = b ? b.w : textW(s, 11);
          const tx = mx + nx * 9 - tw / 2, ty = my + ny * 9;
          if (b) pen.tex(b, tx, ty + 4.5, col(c.tc, cc)); else pen.text(s, tx, ty - 6.5, 11, col(c.tc, cc));
        }
        return { kind: c.op, text: s };
      }
      case 'text': case 'label': {
        const s = str(c.s, 60);
        const label = c.op === 'label' || typeof c.bg === 'string';
        if (isTex(s)) {
          const b = tex(s, TEX_SIZE[num(c.size, 1)] ?? 14), pad = label ? 3 : 0;
          let x = num(c.x), y = num(c.y);
          if (c.align === 'center') x -= b.w / 2;
          [x, y] = this.place(x, y, b.w, b.h + b.d, pad, c.place !== false);
          if (label) pen.fill(rectPts(x - pad, y - pad, b.w + pad * 2, b.h + b.d + pad * 2, 3), alpha(col(c.bg, '#000000'), 0.8));
          pen.tex(b, x, y + b.h, cc);
          this.pointerLine(c, pen, { x, y, w: b.w, h: b.h + b.d });
          return { kind: 'formula', text: s };
        }
        const size = TEXT_SIZE[num(c.size, 1)] ?? 12, bold = c.bold === true || size >= 22, tw = textW(s, size, bold), th = size * 1.2, pad = label ? 3 : 0;
        let x = num(c.x), y = num(c.y);
        if (c.align === 'center') x -= tw / 2;
        [x, y] = this.place(x, y, tw, th, pad, c.place !== false);
        if (label) pen.fill(rectPts(x - pad, y - pad, tw + pad * 2, th + pad * 2, 3), alpha(col(c.bg, '#000000'), 0.8));
        pen.text(s, x, y + size * 0.08, size, cc, { outline: !label, bold });
        this.pointerLine(c, pen, { x, y, w: tw, h: th });
        return { kind: c.op, text: s, min: 260 };
      }
      case 'formula': {
        const s = str(c.s, 300), b = tex(s, TEX_SIZE[num(c.size, 2)] ?? 20);
        let x = num(c.x, 160), y = num(c.y, 20);
        if (c.align === 'center') x -= b.w / 2;
        [x, y] = this.place(x, y, b.w, b.h + b.d, 0, c.place !== false);
        pen.tex(b, x, y + b.h, cc);
        return { kind: 'formula', text: s, min: 400 };
      }
      case 'box': {
        // text block: the text picks its own size and line breaks to fit
        const x = num(c.x), y = num(c.y), ww = Math.max(8, num(c.w, 80)), hh = Math.max(8, num(c.h, 28)), r = num(c.r, 4);
        const frame = c.frame !== false, edge = col(c.c, '#FFF1E8');
        const bg = typeof c.bg === 'string' || typeof c.alpha === 'number' ? alpha(col(c.bg, edge), num(c.alpha, 0.16)) : frame ? alpha(edge, 0.14) : null;
        pen.shape(rectPts(x, y, ww, hh, r), { fill: bg, stroke: frame ? edge : null, w: 1.1 });
        const s = str(c.s, 160), bold = c.bold === true;
        if (s) {
          const left = c.align === 'left';
          const f = this.fit(left ? `• ${s}` : s, ww - 8, hh - 4, typeof c.fs === 'number' ? Math.max(6, Math.min(24, c.fs)) : [0, 11, 15, 20][num(c.size, 1)] ?? 11, bold);
          const lh = f.size * 1.18, top = y + (hh - f.lines.length * lh) / 2;
          f.lines.forEach((l, i) => pen.text(l, left ? x + 4 : x + ww / 2, top + i * lh + f.size * 0.06, f.size, col(c.tc, '#FFF1E8'), { outline: !frame && !bg, bold, align: left ? 'left' : 'center' }));
        }
        return { kind: 'box', text: s, min: 350 };
      }
      case 'icon': {
        const s = Math.max(8, Math.min(140, num(c.s, 32)));
        icon(pen, String(c.name), num(c.x), num(c.y), s, typeof c.c === 'string' ? col(c.c) : null);
        return { kind: `icon:${String(c.name).slice(0, 12)}`, min: 420 };
      }
      case 'pixels': {
        const rows = Array.isArray(c.rows) ? (c.rows as unknown[]).map(String).slice(0, 32) : [];
        const pal = (c.pal && typeof c.pal === 'object' ? c.pal : {}) as Record<string, unknown>;
        const x = num(c.x), y = num(c.y), k = Math.max(1, Math.min(4, num(c.scale, 2)));
        rows.forEach((row, ry) => [...row.slice(0, 32)].forEach((ch, rx) => { if (ch !== '.' && ch !== ' ') pen.fill(rectPts(x + rx * k, y + ry * k, k + 0.05, k + 0.05), col(pal[ch])); }));
        return { kind: 'pixels', min: 400 };
      }
      case 'axes': return this.axes(c, pen);
      case 'numberline': return this.numberline(c, pen);
      case 'plot': return this.plot(c, pen);
      case 'interval': return this.interval(c, pen);
      case 'dot': {
        const x = num(c.x), y = num(c.y), r = Math.max(1, Math.min(8, num(c.r, 2.6))), s = this.sysOf(c);
        // projections onto the axes (dashed) to show the point's coordinates
        if (c.proj === true && s && s.kind === 'axes') {
          const ax = Math.max(s.box.y, Math.min(s.box.y + s.box.h, s.Y(0))), ay = Math.max(s.box.x, Math.min(s.box.x + s.box.w, s.X(0)));
          pen.line([x, y, x, ax], alpha(cc === '#FFF1E8' ? '#FFEC27' : cc, 0.7), 0.8, true);
          pen.line([x, y, ay, y], alpha(cc === '#FFF1E8' ? '#FFEC27' : cc, 0.7), 0.8, true);
        }
        pen.shape(ellipsePts(x, y, r, r), { fill: col(c.c, '#FFEC27'), stroke: '#10142E', w: 0.6 });
        const lb = str(c.s ?? c.label, 24);
        if (lb) {
          const b = isTex(lb) || /[A-Za-z]\(|\^|_/.test(lb) ? tex(lb, 12) : null, tw = b ? b.w : textW(lb, 11), th = b ? b.h + b.d : 13;
          const [tx, ty] = this.place(x + r + 2, y - r - th, tw, th, 0);
          if (b) pen.tex(b, tx, ty + b.h, col(c.tc, '#FFF1E8')); else pen.text(lb, tx, ty, 11, col(c.tc, '#FFF1E8'));
        }
        return { kind: c.proj === true ? 'dot with projections' : 'dot', text: lb, min: 260 };
      }
      case 'angle': {
        // angle at vertex (x, y) between rays to points a and b: an arc (or a small square for a right angle) and a label
        const x = num(c.x), y = num(c.y), A = Array.isArray(c.a) ? c.a as number[] : [x + 20, y], B = Array.isArray(c.b) ? c.b as number[] : [x, y - 20];
        const t1 = Math.atan2(num(A[1]) - y, num(A[0]) - x), t2 = Math.atan2(num(B[1]) - y, num(B[0]) - x);
        let d = t2 - t1; while (d > Math.PI) d -= Math.PI * 2; while (d <= -Math.PI) d += Math.PI * 2;
        const r = Math.max(5, Math.min(40, num(c.r, 12))), color = col(c.c, '#FFEC27');
        if (c.right === true) {
          const s = r * 0.7, u1 = [Math.cos(t1), Math.sin(t1)], u2 = [Math.cos(t2), Math.sin(t2)];
          pen.line([x + u1[0]! * s, y + u1[1]! * s, x + (u1[0]! + u2[0]!) * s, y + (u1[1]! + u2[1]!) * s, x + u2[0]! * s, y + u2[1]! * s], color, 1.1);
        } else {
          pen.line(ellipsePts(x, y, r, r, t1, t1 + d), color, 1.2);
          if (c.double === true) pen.line(ellipsePts(x, y, r + 2.5, r + 2.5, t1, t1 + d), color, 1.2);
        }
        const s = str(c.s, 16);
        if (s) {
          const tb = t1 + d / 2, b = tex(s, 12), rr = r + 4 + b.w * 0.35;
          pen.tex(b, x + Math.cos(tb) * rr - b.w / 2, y + Math.sin(tb) * rr + b.h * 0.45, color);
        }
        return { kind: 'angle', text: s, min: 300 };
      }
      case 'grid': {
        // grid paper: thin lines every step units
        const x = num(c.x, 0), y = num(c.y, 0), ww = num(c.w, W), hh = num(c.h, H), st = Math.max(4, num(c.step, 10)), gc = alpha(col(c.c, '#C2C3C7'), 0.16);
        for (let gx = x; gx <= x + ww + 0.01; gx += st) pen.line([gx, y, gx, y + hh], gc, 0.35);
        for (let gy = y; gy <= y + hh + 0.01; gy += st) pen.line([x, gy, x + ww, gy], gc, 0.35);
        return { kind: 'grid', min: 300 };
      }
    }
    return null;
  }

  private pts(v: unknown, max: number) {
    const raw = Array.isArray(v) ? (v as unknown[]).slice(0, max) : [];
    return raw.flatMap((p) => (Array.isArray(p) ? [num(p[0]), num(p[1])] : []));
  }

  // callout label: a line from the label to the object with a dot at the end
  private pointerLine(c: Cmd, pen: Pen, box: Box) {
    if (!c.to || typeof c.to !== 'object') return;
    const t = c.to as Record<string, unknown>, tx = num(t.x), ty = num(t.y);
    const sx = Math.max(box.x, Math.min(tx, box.x + box.w)), sy = ty < box.y ? box.y - 3 : ty > box.y + box.h ? box.y + box.h + 3 : box.y + box.h / 2;
    const lc = col(c.lc, col(c.c));
    pen.line([sx, sy, tx, ty], lc, 0.9);
    pen.fill(ellipsePts(tx, ty, 1.5, 1.5), lc);
  }

  /* ----------------------------- axes and graphs ----------------------------- */

  private axes(c: Cmd, pen: Pen) {
    const id = typeof c.id === 'string' && c.id ? c.id : 'ax';
    const x = num(c.x, 20), y = num(c.y, 10), w = Math.max(30, num(c.w, 180)), h = Math.max(30, num(c.h, 160));
    let xmin = num(c.xmin, -5), xmax = num(c.xmax, 5), ymin = num(c.ymin, -5), ymax = num(c.ymax, 5);
    if (xmax <= xmin) xmax = xmin + 1;
    if (ymax <= ymin) ymax = ymin + 1;
    const X = (v: number) => x + ((v - xmin) / (xmax - xmin)) * w, Y = (v: number) => y + h - ((v - ymin) / (ymax - ymin)) * h;
    const xs = num(c.xstep, num(c.step, niceStep(xmax - xmin, w / 22))), ys = num(c.ystep, num(c.step, niceStep(ymax - ymin, h / 18)));
    const gridC = alpha('#C2C3C7', 0.17), axisC = col(c.c, '#C2C3C7');
    if (c.grid !== false) {
      for (let v = Math.ceil(xmin / xs) * xs; v <= xmax + 1e-9; v += xs) pen.line([X(v), y, X(v), y + h], gridC, 0.35);
      for (let v = Math.ceil(ymin / ys) * ys; v <= ymax + 1e-9; v += ys) pen.line([x, Y(v), x + w, Y(v)], gridC, 0.35);
    }
    const ox = Math.max(x, Math.min(x + w, X(0))), oy = Math.max(y, Math.min(y + h, Y(0)));
    pen.line([x, oy, x + w + 6, oy], axisC, 1); pen.arrowHead(x, oy, x + w + 7, oy, axisC, 0.9);
    pen.line([ox, y + h, ox, y - 6], axisC, 1); pen.arrowHead(ox, y + h, ox, y - 7, axisC, 0.9);
    const lx = str(c.xl ?? 'x', 8), ly = str(c.yl ?? 'y', 8);
    pen.tex(tex(lx, 12), x + w + 2, oy + 12, axisC);
    pen.tex(tex(ly, 12), ox + 5, y - 1, axisC);
    if (c.labels !== false) {
      const every = (v: number) => Math.abs(v) > 1e-9;
      const lc = alpha('#FFF1E8', 0.75);
      for (let v = Math.ceil(xmin / xs) * xs; v <= xmax + 1e-9; v += xs) if (every(v) && X(v) < x + w - 2) {
        pen.line([X(v), oy - 1.5, X(v), oy + 1.5], axisC, 0.8);
        const s = fmtNum(v); pen.text(s, X(v) - textW(s, 7) / 2, oy + 3, 7, lc, { outline: true });
      }
      for (let v = Math.ceil(ymin / ys) * ys; v <= ymax + 1e-9; v += ys) if (every(v) && Y(v) > y + 2) {
        pen.line([ox - 1.5, Y(v), ox + 1.5, Y(v)], axisC, 0.8);
        const s = fmtNum(v); pen.text(s, ox - 3 - textW(s, 7), Y(v) - 4.5, 7, lc, { outline: true });
      }
      if (X(0) >= x && X(0) <= x + w && Y(0) >= y && Y(0) <= y + h) pen.text('0', ox - 7, oy + 2, 7, lc);
    }
    this.sys.set(id, { kind: 'axes', X, Y, box: { x, y, w, h }, xmin, xmax, ymin, ymax });
    this.lastSys = id;
    return { kind: `axes x∈[${fmtNum(xmin)};${fmtNum(xmax)}] y∈[${fmtNum(ymin)};${fmtNum(ymax)}]`, min: 700 };
  }

  private numberline(c: Cmd, pen: Pen) {
    const id = typeof c.id === 'string' && c.id ? c.id : 'nl';
    const x1 = num(c.x1, 20), x2 = num(c.x2, 300), y = num(c.y, 100);
    let from = num(c.from, -5), to = num(c.to, 5);
    if (to <= from) to = from + 1;
    const X = (v: number) => x1 + ((v - from) / (to - from)) * (x2 - x1);
    const st = num(c.step, niceStep(to - from, (x2 - x1) / 24)), cc = col(c.c, '#C2C3C7');
    pen.line([x1 - 6, y, x2 + 8, y], cc, 1.1); pen.arrowHead(x1, y, x2 + 9, y, cc, 1);
    pen.tex(tex(str(c.xl ?? 'x', 6), 12), x2 + 6, y + 13, cc);
    if (c.labels !== false) for (let v = Math.ceil(from / st) * st; v <= to + 1e-9; v += st) {
      pen.line([X(v), y - 2.5, X(v), y + 2.5], cc, 0.9);
      const s = fmtNum(v); pen.text(s, X(v) - textW(s, 8) / 2, y + 5, 8, alpha('#FFF1E8', 0.8));
    }
    this.sys.set(id, { kind: 'line', X, Y: () => y, box: { x: x1, y: y - 8, w: x2 - x1, h: 16 }, xmin: from, xmax: to, ymin: 0, ymax: 0 });
    this.lastSys = id;
    return { kind: `numberline ${fmtNum(from)}…${fmtNum(to)}`, min: 600 };
  }

  private plot(c: Cmd, pen: Pen) {
    const s = this.sys.get(typeof c.axes === 'string' ? c.axes : this.lastSys);
    const f = compile(str(c.fn, 120));
    if (!s || s.kind !== 'axes' || !f) return null;
    const a = num(c.from, s.xmin), b = num(c.to, s.xmax), cc = col(c.c, '#29ADFF'), w = lwOf(c.lw ?? 2);
    const span = s.ymax - s.ymin, lo = s.ymin - span * 0.6, hi = s.ymax + span * 0.6;
    let seg: number[] = [], last: [number, number] | null = null, prevY: number | null = null;
    const N = 360;
    for (let i = 0; i <= N; i++) {
      const xv = a + ((b - a) * i) / N, yv = f(xv);
      // discontinuity (division by zero, out of bounds, a jump as in tan) starts a new line
      if (!Number.isFinite(yv) || yv < lo || yv > hi || (prevY !== null && Math.abs(yv - prevY) > span * 0.9)) { if (seg.length >= 4) pen.line(seg, cc, w, c.dash === true); seg = []; prevY = Number.isFinite(yv) ? yv : null; continue; }
      seg.push(s.X(xv), s.Y(yv)); prevY = yv;
      if (yv >= s.ymin && yv <= s.ymax) last = [s.X(xv), s.Y(yv)];
    }
    if (seg.length >= 4) pen.line(seg, cc, w, c.dash === true);
    if (!pen.prims.length) return null;
    const lb = str(c.s, 40);
    // graph label is a separate object "id.label" (the graph is clipped to the axes frame, the label is not)
    if (lb && last) {
      const lp = new Pen(), bx = tex(lb, 12), [tx, ty] = this.place(Math.min(last[0] + 3, s.box.x + s.box.w - bx.w), last[1] - bx.h - bx.d - 3, bx.w, bx.h + bx.d, 2);
      lp.fill(rectPts(tx - 2, ty - 2, bx.w + 4, bx.h + bx.d + 4, 2), alpha('#000000', 0.55));
      lp.tex(bx, tx, ty + bx.h, cc);
      const pid = typeof c.id === 'string' && c.id ? `${c.id}.label` : null;
      this.after.push((d) => this.add({ op: 'plot' }, lp, d + 900, { kind: 'plot label', text: lb, min: 400, id: pid }));
    }
    return { kind: `plot y=${str(c.fn, 40)}`, text: lb, min: 900, clip: { x: s.box.x - 1, y: s.box.y - 1, w: s.box.w + 2, h: s.box.h + 2 } };
  }

  private interval(c: Cmd, pen: Pen) {
    const s = this.sys.get(typeof c.on === 'string' ? c.on : typeof c.axes === 'string' ? c.axes : this.lastSys);
    if (!s || s.kind !== 'line') return null;
    const y = s.Y(0), cc = col(c.c, '#FF004D');
    const from = c.from === null || c.from === undefined || c.from === '-inf' ? null : num(c.from), to = c.to === null || c.to === undefined || c.to === 'inf' ? null : num(c.to);
    const xa = from === null ? s.box.x - 4 : s.X(from), xb = to === null ? s.box.x + s.box.w + 4 : s.X(to);
    const lift = num(c.lift, 0), yy = y - lift;
    // hatching over an interval, textbook style
    pen.line([xa, yy, xb, yy], alpha(cc, 0.9), 2.4);
    for (let hx = xa + 3; hx < xb - 1; hx += 4) pen.line([hx, yy - 1, hx + 4, yy - 6], alpha(cc, 0.55), 0.7);
    const closed = Array.isArray(c.closed) ? c.closed as unknown[] : [true, true];
    const end = (v: number | null, cl: unknown) => { if (v === null) return; pen.shape(ellipsePts(s.X(v), yy, 2.6, 2.6), { fill: cl === false ? this.bg : cc, stroke: cc, w: 1 }); };
    end(from, closed[0]); end(to, closed[1]);
    return { kind: `interval ${from ?? '−∞'}…${to ?? '+∞'}`, min: 500 };
  }

  /* ----------------------------- step-by-step solutions ----------------------------- */

  // solution line: lines of one solution stack vertically with "=" signs aligned in a column; a note goes on the right
  private step(c: Cmd, delay: number) {
    const id = typeof c.id === 'string' && c.id ? c.id : 'sol';
    let blk = this.steps.get(id);
    if (!blk) {
      blk = { x: num(c.x, 170), y: num(c.y, 14), size: TEX_SIZE[num(c.size, 2)] ?? 20, c: col(c.c, '#FFF1E8'), lines: [], box: null };
      this.steps.set(id, blk);
      this.groups.set(id, { kind: 'steps', parts: [] });
    }
    const s = str(c.s, 200), sp = splitEq(s), z = blk.size;
    blk.lines.push({ s, note: str(c.note, 30), full: tex(s, z), l: sp ? tex(sp[0], z) : null, r: sp ? tex(sp[1], z) : null, n: c.note ? tex(`|\\;{${str(c.note, 30)}}`, z * 0.72) : null });
    const eq = tex('=', z), gap = z * 0.28;
    const maxL = Math.max(0, ...blk.lines.map((l) => l.l?.w ?? 0));
    const eqX = blk.x + maxL + gap;
    const right = Math.max(...blk.lines.map((l) => (l.l ? eqX + eq.w + gap + l.r!.w : blk!.x + l.full.w)));
    let yy = blk.y;
    const color = col(c.c, blk.c);
    blk.lines.forEach((l, k) => {
      const h = Math.max(l.full.h, z * 0.75), d = Math.max(l.full.d, z * 0.25);
      const base = yy + h;
      const pen = new Pen();
      if (l.l) { pen.tex(l.l, eqX - gap - l.l.w, base, color); pen.tex(eq, eqX, base, color); pen.tex(l.r!, eqX + eq.w + gap, base, color); }
      else pen.tex(l.full, blk!.x, base, color);
      if (l.n) pen.tex(l.n, Math.min(right + z * 0.6, W - 3 - l.n.w), base, '#83769C');
      const pid = `${id}.${k + 1}`, old = this.items.find((i) => i.id === pid);
      if (old) { old.prims = pen.prims; timeline(old.prims); old.box = bounds(old.prims) ?? old.box; }
      else this.add({ op: 'step' }, pen, delay, { kind: 'step', text: l.s, min: 500, id: pid });
      yy = base + d + z * 0.45;
    });
    this.groups.get(id)!.parts = blk.lines.map((l, k) => [`${id}.${k + 1}`, l.s + (l.note ? ` | ${l.note}` : '')]);
    const box = { x: blk.x, y: blk.y, w: right - blk.x, h: yy - blk.y };
    if (blk.box) this.labels = this.labels.filter((b) => b !== blk!.box);
    blk.box = box; this.labels.push(box);
  }

  /* ------------------------------ diagrams, highlighting ------------------------------ */

  private schema(c: Cmd, delay: number) {
    const id = typeof c.id === 'string' && c.id ? c.id : 's';
    const laid = layoutSchema(c, id);
    if (!laid) return;
    for (const old of this.find(id)) this.items = this.items.filter((i) => i !== old);
    for (const { c: cmd, d } of laid.cmds) this.exec(cmd, delay + d);
    this.groups.set(id, { kind: `schema:${String(c.type)}`, parts: laid.parts });
  }

  // marker highlighting: circle, underline, box, strike through, check mark
  private mark(c: Cmd, delay: number) {
    const target = typeof c.id === 'string' ? c.id : '';
    const box = union(this.find(target).filter((i) => !i.id?.endsWith('.mark')).map((i) => i.box))
      ?? (typeof c.x === 'number' ? (() => { const [x, y] = this.mapPt(c, num(c.x), num(c.y)); return { x: x - num(c.w, 16) / 2, y: y - num(c.h, 16) / 2, w: num(c.w, 16), h: num(c.h, 16) }; })() : null);
    if (!box) return;
    const pen = new Pen(), cc = col(c.c, '#FF004D'), w = lwOf(c.lw ?? 1.6), style = String(c.style ?? 'circle');
    const cx = box.x + box.w / 2, cy = box.y + box.h / 2;
    if (style === 'underline') {
      const pts: number[] = [];
      for (let i = 0; i <= 20; i++) { const x = box.x - 2 + ((box.w + 4) * i) / 20; pts.push(x, box.y + box.h + 2 + Math.sin(i * 1.3) * 0.7); }
      pen.line(pts, cc, w);
    } else if (style === 'box') pen.line(rectPts(box.x - 3, box.y - 3, box.w + 6, box.h + 6, 3), cc, w);
    else if (style === 'cross') { pen.line([box.x, box.y, box.x + box.w, box.y + box.h], cc, w); pen.line([box.x + box.w, box.y, box.x, box.y + box.h], cc, w); }
    else if (style === 'check') { const s = Math.min(14, Math.max(8, box.h)); const x = box.x + box.w + 4, y = cy; pen.line([x, y, x + s * 0.35, y + s * 0.4, x + s, y - s * 0.55], col(c.c, '#00E436'), w * 1.2); }
    else pen.line(ellipsePts(cx, cy, box.w / 2 + 5, box.h / 2 + 4, -2.5, -2.5 + Math.PI * 2 + 0.55, 0.03), cc, w);
    this.add({ op: 'mark' }, pen, delay, { kind: `mark:${style}`, min: 450, id: typeof c.mid === 'string' ? c.mid : `${target || 'xy'}.mark` });
  }

  /* -------------------------- ready-made objects, images -------------------------- */

  private composite(c: Cmd, delay: number) {
    const id = typeof c.id === 'string' && c.id ? c.id : c.op;
    const x = num(c.x, W / 2), y = num(c.y, H / 2), cc = col(c.c, '#FF004D'), period = num(c.period, 2);
    let d = delay;
    const sub = (cmd: Cmd, gap = 140) => { this.exec(cmd, d); d += gap; };
    this.groups.set(id, { kind: c.op, parts: [] });
    if (c.op === 'road') {
      const v = c.dir === 'v', h = Math.max(24, Math.min(80, num(c.h, 44)));
      const a = v ? num(c.x, 140) : num(c.y, 120), from = num(v ? c.y1 : c.x1, 0), to = num(v ? c.y2 : c.x2, v ? H : W), asphalt = col(c.c, '#5F574F');
      if (v) {
        sub({ op: 'rect', id: `${id}.asphalt`, x: a, y: from, w: h, h: to - from, c: asphalt, fill: true });
        sub({ op: 'line', id: `${id}.mid`, x1: a + h / 2, y1: from + 2, x2: a + h / 2, y2: to - 2, c: '#FFF1E8', lw: 1, dash: true });
      } else {
        sub({ op: 'rect', id: `${id}.asphalt`, x: from, y: a, w: to - from, h, c: asphalt, fill: true });
        sub({ op: 'line', id: `${id}.mid`, x1: from + 2, y1: a + h / 2, x2: to - 2, y2: a + h / 2, c: '#FFF1E8', lw: 1, dash: true });
      }
      return;
    }
    if (c.op === 'crosswalk') {
      // zebra crossing: stripes run PARALLEL to traffic and follow one another across the roadway
      const v = c.dir === 'v', h = Math.max(24, Math.min(80, num(c.h, 44))), w = Math.max(14, Math.min(50, num(c.w, 26)));
      const road0 = v ? num(c.x, 140) : num(c.y, 120), mid = v ? num(c.y, H / 2) : num(c.x, W / 2);
      const n = Math.max(3, Math.floor((h - 4) / 8));
      for (let i = 0; i < n; i++) {
        const o = road0 + 3 + i * ((h - 6) / n), t = Math.max(2, (h - 6) / n / 2);
        sub(v ? { op: 'rect', id: `${id}.s${i}`, x: o, y: mid - w / 2, w: t, h: w, c: '#FFF1E8', fill: true } : { op: 'rect', id: `${id}.s${i}`, x: mid - w / 2, y: o, w, h: t, c: '#FFF1E8', fill: true }, 60);
      }
      return;
    }
    if (c.op === 'trafficlight') {
      const on = c.on === 'green' ? 2 : c.on === 'yellow' ? 1 : 0, pole = Math.max(0, Math.min(120, num(c.pole, 40)));
      const lamps = [['#FF004D', '#5A1E2E'], ['#FFEC27', '#5B5530'], ['#00E436', '#1E4B32']];
      if (pole) sub({ op: 'rect', id: `${id}.pole`, x: x - 1.5, y: y + 44, w: 3, h: pole, c: '#83769C', fill: true });
      sub({ op: 'rect', id: `${id}.box`, x: x - 9, y, w: 18, h: 45, r: 3, c: '#000000', fill: true, stroke: '#C2C3C7' });
      lamps.forEach(([bright, dim], i) => sub({ op: 'circle', id: `${id}.l${i}`, x, y: y + 8 + i * 14.5, r: 5, c: i === on ? bright : dim, fill: true, ...(i === on && c.blink === true ? { anim: { type: 'blink', period: 1 } } : {}) }, 80));
      return;
    }
    if (c.op === 'pendulum') {
      const len = Math.max(30, Math.min(160, num(c.len, 110))), angle = Math.max(5, Math.min(60, num(c.angle, 25)));
      const swing = { type: 'swing', cx: x, cy: y, angle, period };
      sub({ op: 'rect', id: `${id}.bar`, x: x - 22, y: y - 4, w: 44, h: 4, r: 1, c: '#C2C3C7', fill: true });
      sub({ op: 'line', id: `${id}.string`, x1: x, y1: y, x2: x, y2: y + len, c: '#FFF1E8', lw: 1, anim: swing });
      sub({ op: 'icon', id: `${id}.bob`, name: 'ball', x, y: y + len, s: Math.max(14, num(c.s, 22)), c: cc, anim: swing });
      return;
    }
    if (c.op === 'atom') {
      const shells = (Array.isArray(c.shells) ? (c.shells as unknown[]).map((n) => Math.max(1, Math.min(8, Math.round(num(n, 2))))) : [2]).slice(0, 3);
      const n = Math.max(2, Math.min(10, Math.round(num(c.protons, shells.reduce((a, b) => a + b, 0)))));
      for (let i = 0; i < n * 2 && i < 16; i++) {
        const a = i * 2.4, rr = 2.2 * Math.sqrt(i);
        sub({ op: 'circle', id: `${id}.n${i}`, x: x + Math.cos(a) * rr * 2, y: y + Math.sin(a) * rr * 2, r: 4, c: i % 2 ? '#C2C3C7' : '#FF004D', fill: true, stroke: '#1D2B53' }, 40);
      }
      shells.forEach((k, s) => {
        const r = 34 + s * 24;
        sub({ op: 'circle', id: `${id}.shell${s}`, x, y, r, c: '#83769C', fill: false, lw: 1, dash: true }, 200);
        for (let e = 0; e < k; e++) {
          const a = (e / k) * Math.PI * 2 - Math.PI / 2;
          sub({ op: 'circle', id: `${id}.e${s}_${e}`, x: x + Math.cos(a) * r, y: y + Math.sin(a) * r, r: 3.5, c: '#29ADFF', fill: true, anim: { type: 'orbit', cx: x, cy: y, period: 3 + s * 1.6 } }, 60);
        }
      });
      return;
    }
    // wave: a traveling sine wave from x1 to x2 at height y
    const x1 = num(c.x1, 20), x2 = num(c.x2, W - 20), amp = Math.max(4, Math.min(70, num(c.amp, 25))), len = Math.max(20, Math.min(200, num(c.len, 80)));
    const pts: number[][] = [];
    for (let px = x1 - len; px <= x2; px += 1.5) pts.push([px, y - Math.sin(((px - x1) / len) * Math.PI * 2) * amp]);
    sub({ op: 'path', id, pts, c: col(c.c, '#29ADFF'), lw: num(c.lw, 2), clip: { x: x1, y: 0, w: x2 - x1, h: H }, anim: { type: 'move', dx: len, dy: 0, period, loop: 'repeat' } });
  }

  // Image from lesson materials (a sign, a situation): the board picks the spot: a centered row, a caption under each.
  private addPic(c: Cmd, now: number) {
    const id = typeof c.id === 'string' ? c.id : null;
    if (id) { this.items = this.items.filter((i) => i.id !== id); this.pics = this.pics.filter((p) => p.it.id !== id); }
    const it: Item = { id, op: 'pic', prims: [], box: { x: 0, y: 0, w: 1, h: 1 }, anim: null, t0: this.instant ? -1e9 : now, at: now, dur: 500, kind: 'picture', text: str(c.cap, 24) };
    const p = { it, img: null as HTMLImageElement | null, cap: str(c.cap, 24) };
    if (this.pics.length >= 5) { const old = this.pics.shift()!; this.items = this.items.filter((i) => i !== old.it); }
    this.items.push(it); this.pics.push(p);
    if (typeof c.src === 'string' && /^https?:\/\//.test(c.src)) {
      const img = new Image();
      img.onload = () => { if (!this.pics.includes(p)) return; p.img = img; this.layoutPics(); this.wake(); };
      img.src = c.src;
    }
    this.layoutPics();
  }

  private layoutPics() {
    const n = this.pics.length;
    if (!n) return;
    const s = [0, 96, 84, 72, 60, 50][n]!, gap = n <= 3 ? 28 : 12, cy = 76;
    this.pics.forEach((p, i) => {
      const cx = W / 2 + (i - (n - 1) / 2) * (s + gap), x0 = cx - s / 2, y0 = cy - s / 2;
      const pen = new Pen();
      pen.fill(rectPts(x0 - 2, y0 - 2, s + 4, s + 4, 3), '#FFF1E8');
      if (p.img) {
        const k = Math.min(s / (p.img.naturalWidth || s), s / (p.img.naturalHeight || s));
        const w = (p.img.naturalWidth || s) * k, h = (p.img.naturalHeight || s) * k;
        pen.img(p.img, x0 + (s - w) / 2, y0 + (s - h) / 2, w, h);
      }
      if (p.cap) {
        const f = this.fit(p.cap, s + gap - 4, 22, 8, true);
        f.lines.slice(0, 2).forEach((l, k) => pen.text(l, cx, y0 + s + 5 + k * 10, f.size, '#FFF1E8', { bold: true, align: 'center' }));
      }
      p.it.prims = pen.prims; timeline(p.it.prims);
      p.it.box = bounds(p.it.prims) ?? p.it.box;
    });
  }

  /* -------------------------------- memory -------------------------------- */

  /** What is on the board now, in brief for the AI: names, what each is, where (x,y w×h), labels; coordinate systems; free space. */
  scene(): string {
    if (!this.items.length) return '';
    const R = (b: Box) => `@${Math.round(b.x)},${Math.round(b.y)} ${Math.round(b.w)}×${Math.round(b.h)}`;
    const out: string[] = [];
    if (this.title) out.push(`title: "${this.title}"`);
    const seen = new Set<string>();
    let unnamed = 0;
    for (const it of this.items) {
      if (!it.id) {
        if (unnamed++ < 16) out.push(`${it.auto}: ${it.kind} ${R(it.box)}${it.text ? ` "${it.text.slice(0, 40)}"` : ''}`);
        continue;
      }
      const key = this.groups.has(it.id.split('.')[0]!) ? it.id.split('.')[0]! : it.id;
      if (seen.has(key)) continue;
      seen.add(key);
      const g = this.groups.get(key);
      if (g) {
        const box = union(this.find(key).map((i) => i.box));
        const parts = g.parts.slice(0, 12).map(([pid, s]) => `${pid} "${s.slice(0, 36)}"`).join(', ');
        out.push(`${key}: ${g.kind}${box ? ` ${R(box)}` : ''}${parts ? ` — parts: ${parts}` : ''}`);
      } else out.push(`${it.id}: ${it.kind} ${R(it.box)}${it.text ? ` "${it.text.slice(0, 40)}"` : ''}${it.anim ? ` (anim ${it.anim.type})` : ''}`);
      if (out.length > 40) break;
    }
    const free = this.free();
    if (free.length) out.push(`free areas: ${free.map((b) => `x ${Math.round(b.x)}–${Math.round(b.x + b.w)}, y ${Math.round(b.y)}–${Math.round(b.y + b.h)}`).join('; ')}`);
    return out.join('\n').slice(0, 3000);
  }

  // free space: a 10×10 grid with cells under objects marked as taken; pick the largest empty rectangles
  private free(): Box[] {
    const C = 10, nx = W / C, ny = H / C;
    const busy = Array.from({ length: ny }, () => new Array<boolean>(nx).fill(false));
    for (const it of this.items) {
      const b = it.box;
      if (b.w * b.h > W * H * 0.6 || it.kind === 'grid') continue;   // background and grid paper don't take up space
      for (let y = Math.max(0, Math.floor(b.y / C)); y < Math.min(ny, Math.ceil((b.y + b.h) / C)); y++)
        for (let x = Math.max(0, Math.floor(b.x / C)); x < Math.min(nx, Math.ceil((b.x + b.w) / C)); x++) busy[y]![x] = true;
    }
    const res: Box[] = [];
    for (let n = 0; n < 3; n++) {
      // largest empty rectangle (row-by-row histograms)
      let best = { a: 0, x: 0, y: 0, w: 0, h: 0 };
      const hgt = new Array<number>(nx).fill(0);
      for (let y = 0; y < ny; y++) {
        for (let x = 0; x < nx; x++) hgt[x] = busy[y]![x] ? 0 : hgt[x]! + 1;
        for (let x = 0; x < nx; x++) {
          let mh = Infinity;
          for (let x2 = x; x2 < nx && hgt[x2]! > 0; x2++) {
            mh = Math.min(mh, hgt[x2]!);
            const a = mh * (x2 - x + 1);
            if (a > best.a) best = { a, x, y: y - mh + 1, w: x2 - x + 1, h: mh };
          }
        }
      }
      if (best.w < 4 || best.h < 3) break;
      res.push({ x: best.x * C, y: best.y * C, w: best.w * C, h: best.h * C });
      for (let y = best.y; y < best.y + best.h; y++) for (let x = best.x; x < best.x + best.w; x++) busy[y]![x] = true;
    }
    return res;
  }
}
