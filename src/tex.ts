// Copyright 2026 UpBilim
// SPDX-License-Identifier: Apache-2.0
// Textbook-style formulas for the board: a small TeX with fractions, roots, powers and subscripts, systems (cases),
// height-sized brackets, Greek letters and symbols, color, highlighting, strike-through (\cancel for cancelling terms).
// No external libraries or fonts: layout uses boxes (width, height above the baseline, depth below it), drawn with
// Canvas 2D in board units. Plain text works too: "2x + 3 = 11" gets italic letters, upright digits, spaced operators.
export interface TBox { w: number; h: number; d: number; cls?: Cls; draw(g: CanvasRenderingContext2D, x: number, y: number, c: string): void }
type Cls = 'ord' | 'bin' | 'rel' | 'open' | 'close' | 'punct' | 'op' | 'space';

const SERIF = '"Cambria Math", "STIX Two Math", "Times New Roman", "Noto Serif", serif';
const SANS = '"Inter", system-ui, sans-serif';
let mctx: CanvasRenderingContext2D | null = null;
const measure = (s: string, font: string) => {
  mctx ??= document.createElement('canvas').getContext('2d')!;
  mctx.font = font;
  return mctx.measureText(s).width;
};

const SYM: Record<string, [string, Cls]> = {
  cdot: ['·', 'bin'], times: ['×', 'bin'], div: ['÷', 'bin'], pm: ['±', 'bin'], mp: ['∓', 'bin'], cup: ['∪', 'bin'], cap: ['∩', 'bin'], circ: ['°', 'ord'],
  le: ['≤', 'rel'], leq: ['≤', 'rel'], ge: ['≥', 'rel'], geq: ['≥', 'rel'], ne: ['≠', 'rel'], neq: ['≠', 'rel'], approx: ['≈', 'rel'], equiv: ['≡', 'rel'],
  sim: ['∼', 'rel'], to: ['→', 'rel'], rightarrow: ['→', 'rel'], leftarrow: ['←', 'rel'], Rightarrow: ['⇒', 'rel'], Leftarrow: ['⇐', 'rel'],
  Leftrightarrow: ['⇔', 'rel'], iff: ['⇔', 'rel'], perp: ['⊥', 'rel'], parallel: ['∥', 'rel'], in: ['∈', 'rel'], notin: ['∉', 'rel'], subset: ['⊂', 'rel'],
  infty: ['∞', 'ord'], degree: ['°', 'ord'], angle: ['∠', 'ord'], triangle: ['△', 'ord'], emptyset: ['∅', 'ord'], varnothing: ['∅', 'ord'],
  forall: ['∀', 'ord'], exists: ['∃', 'ord'], partial: ['∂', 'ord'], nabla: ['∇', 'ord'], ldots: ['…', 'ord'], dots: ['…', 'ord'], cdots: ['⋯', 'ord'],
  '%': ['%', 'ord'], '{': ['{', 'open'], '}': ['}', 'close'], '#': ['#', 'ord'], '&': ['&', 'ord'], _: ['_', 'ord'], $: ['$', 'ord'],
  alpha: ['α', 'ord'], beta: ['β', 'ord'], gamma: ['γ', 'ord'], delta: ['δ', 'ord'], epsilon: ['ε', 'ord'], varepsilon: ['ε', 'ord'], zeta: ['ζ', 'ord'],
  eta: ['η', 'ord'], theta: ['θ', 'ord'], iota: ['ι', 'ord'], kappa: ['κ', 'ord'], lambda: ['λ', 'ord'], mu: ['μ', 'ord'], nu: ['ν', 'ord'], xi: ['ξ', 'ord'],
  pi: ['π', 'ord'], rho: ['ρ', 'ord'], sigma: ['σ', 'ord'], tau: ['τ', 'ord'], phi: ['φ', 'ord'], varphi: ['φ', 'ord'], chi: ['χ', 'ord'], psi: ['ψ', 'ord'],
  omega: ['ω', 'ord'], Gamma: ['Γ', 'ord'], Delta: ['Δ', 'ord'], Theta: ['Θ', 'ord'], Lambda: ['Λ', 'ord'], Xi: ['Ξ', 'ord'], Pi: ['Π', 'ord'],
  Sigma: ['Σ', 'ord'], Phi: ['Φ', 'ord'], Psi: ['Ψ', 'ord'], Omega: ['Ω', 'ord'],
};
const FUNCS = new Set(['sin', 'cos', 'tg', 'ctg', 'tan', 'cot', 'arcsin', 'arccos', 'arctg', 'arctan', 'log', 'ln', 'lg', 'exp', 'lim', 'max', 'min', 'sgn', 'mod', 'gcd', 'det']);
const BIG: Record<string, string> = { sum: '∑', prod: '∏', int: '∫', oint: '∮' };
const SPACE: Record<string, number> = { ',': 0.17, ':': 0.22, ';': 0.28, ' ': 0.25, quad: 1, qquad: 2, '!': -0.12 };
const BIN = new Set(['+', '−', '·', '×', '÷', '±', '∓']);
const REL = new Set(['=', '<', '>', '≤', '≥', '≠', '≈', '→', '⇒', '⇔', '∈']);

const empty = (): TBox => ({ w: 0, h: 0, d: 0, draw() {} });
const space = (w: number): TBox => ({ w, h: 0, d: 0, cls: 'space', draw() {} });

function glyph(s: string, size: number, opt: { italic?: boolean; bold?: boolean; sans?: boolean; cls?: Cls; scale?: number } = {}): TBox {
  const px = size * (opt.scale ?? 1);
  const font = `${opt.italic ? 'italic ' : ''}${opt.bold ? '700 ' : ''}${px}px ${opt.sans ? SANS : SERIF}`;
  const w = measure(s, font) + (opt.italic ? px * 0.04 : 0);
  return {
    w, h: px * 0.72, d: px * 0.22, cls: opt.cls ?? 'ord',
    draw(g, x, y, c) { g.font = font; g.fillStyle = c; g.textBaseline = 'alphabetic'; g.textAlign = 'left'; g.fillText(s, x, y); },
  };
}

// a row of boxes on a shared baseline; textbook spacing around operators (less around "+", more around "=")
function hbox(list: TBox[], size: number): TBox {
  const out: Array<{ b: TBox; x: number }> = [];
  let x = 0, prev: Cls | null = null;
  for (let b of list) {
    let cls = b.cls ?? 'ord';
    // a minus at the start or after an operator / opening bracket is unary: no spacing
    if (cls === 'bin' && (prev === null || prev === 'bin' || prev === 'rel' || prev === 'open' || prev === 'punct' || prev === 'op')) { cls = 'ord'; b = { ...b, cls }; }
    const gap = cls === 'rel' || prev === 'rel' ? 0.28 : cls === 'bin' || prev === 'bin' ? 0.22 : prev === 'punct' ? 0.17 : prev === 'op' && cls !== 'open' ? 0.12 : 0;
    if (prev !== null && cls !== 'space' && prev !== 'space') x += gap * size;
    out.push({ b, x }); x += b.w; prev = cls;
  }
  return {
    w: x, h: Math.max(0, ...list.map((b) => b.h)), d: Math.max(0, ...list.map((b) => b.d)),
    draw(g, x0, y, c) { for (const o of out) o.b.draw(g, x0 + o.x, y, c); },
  };
}

const line = (g: CanvasRenderingContext2D, pts: number[], c: string, w: number) => {
  g.beginPath(); g.moveTo(pts[0]!, pts[1]!);
  for (let i = 2; i < pts.length; i += 2) g.lineTo(pts[i]!, pts[i + 1]!);
  g.strokeStyle = c; g.lineWidth = w; g.lineCap = 'round'; g.lineJoin = 'round'; g.stroke();
};

function frac(n: TBox, dn: TBox, size: number): TBox {
  const axis = size * 0.27, gap = size * 0.14, pad = size * 0.12, t = Math.max(0.5, size * 0.06);
  const w = Math.max(n.w, dn.w) + pad * 2;
  return {
    w, h: axis + gap + n.d + n.h, d: Math.max(0, gap + dn.h + dn.d - axis), cls: 'ord',
    draw(g, x, y, c) {
      line(g, [x + pad * 0.4, y - axis, x + w - pad * 0.4, y - axis], c, t);
      n.draw(g, x + (w - n.w) / 2, y - axis - gap - n.d, c);
      dn.draw(g, x + (w - dn.w) / 2, y - axis + gap + dn.h, c);
    },
  };
}

function sqrt(inner: TBox, size: number, index: TBox | null): TBox {
  const sw = size * 0.55, pad = size * 0.1, t = Math.max(0.5, size * 0.06);
  const h = inner.h + size * 0.22, d = inner.d + size * 0.04;
  const off = index ? Math.max(0, index.w - sw * 0.45) : 0;
  return {
    w: off + sw + inner.w + pad, h: index ? Math.max(h, h * 0.55 + index.h + index.d) : h, d, cls: 'ord',
    draw(g, x, y, c) {
      const x0 = x + off;
      line(g, [x0, y - h * 0.38, x0 + sw * 0.25, y - h * 0.46, x0 + sw * 0.55, y + d, x0 + sw, y - h + t, x0 + sw + inner.w + pad, y - h + t], c, t);
      inner.draw(g, x0 + sw + pad * 0.3, y, c);
      if (index) index.draw(g, x0 + sw * 0.45 - index.w, y - h * 0.55, c);
    },
  };
}

function scripts(base: TBox, sup: TBox | null, sub: TBox | null, size: number): TBox {
  const up = sup ? Math.max(size * 0.4, base.h - sup.h * 0.45) : 0;
  const dn = sub ? Math.max(size * 0.2, base.d + sub.h * 0.35 - size * 0.05) : 0;
  const sw = Math.max(sup?.w ?? 0, sub?.w ?? 0);
  return {
    w: base.w + sw + size * 0.04, h: Math.max(base.h, sup ? up + sup.h : 0), d: Math.max(base.d, sub ? dn + sub.d : 0), cls: base.cls,
    draw(g, x, y, c) {
      base.draw(g, x, y, c);
      sup?.draw(g, x + base.w + size * 0.02, y - up, c);
      sub?.draw(g, x + base.w + size * 0.02, y + dn, c);
    },
  };
}

// bracket sized to its content: short content uses the regular glyph, tall content a drawn line
function delim(ch: string, h: number, d: number, size: number, right: boolean): TBox {
  if (ch === '.' || !ch) return space(size * 0.05);
  const total = h + d;
  if (total < size * 1.25) { const gl = glyph(ch === '\\{' ? '{' : ch === '\\}' ? '}' : ch, size, { cls: right ? 'close' : 'open' }); return gl; }
  const w = size * (ch === '|' ? 0.25 : 0.42), t = Math.max(0.5, size * 0.065), top = -h - size * 0.05, bot = d + size * 0.05;
  return {
    w, h: h + size * 0.05, d: d + size * 0.05, cls: right ? 'close' : 'open',
    draw(g, x, y, c) {
      const a = y + top, b = y + bot, m = (a + b) / 2, l = x + w * 0.2, r = x + w * 0.8;
      g.beginPath(); g.strokeStyle = c; g.lineWidth = t; g.lineCap = 'round'; g.lineJoin = 'round';
      const k = ch.replace('\\', '');
      if (k === '(' || k === ')') { const fl = k === ')'; const X = (v: number) => (fl ? x + w - (v - x) : v); g.moveTo(X(r), a); g.quadraticCurveTo(X(l - w * 0.25), m, X(r), b); }
      else if (k === '[' || k === ']') { const fl = k === ']'; const X = (v: number) => (fl ? x + w - (v - x) : v); g.moveTo(X(r), a); g.lineTo(X(l), a); g.lineTo(X(l), b); g.lineTo(X(r), b); }
      else if (k === '|') { g.moveTo(x + w / 2, a); g.lineTo(x + w / 2, b); }
      else { // curly
        const fl = k === '}' || (right && k !== '{'); const X = (v: number) => (fl ? x + w - (v - x) : v);
        const mx = x + w * 0.5;
        g.moveTo(X(r), a); g.quadraticCurveTo(X(mx), a, X(mx), a + (m - a) * 0.3); g.lineTo(X(mx), m - (m - a) * 0.25);
        g.quadraticCurveTo(X(mx), m, X(l), m); g.quadraticCurveTo(X(mx), m, X(mx), m + (b - m) * 0.25); g.lineTo(X(mx), b - (b - m) * 0.3);
        g.quadraticCurveTo(X(mx), b, X(r), b);
      }
      g.stroke();
    },
  };
}

// rows and columns (systems, multi-line formulas): columns aligned, rows spaced apart
function grid(rows: TBox[][], size: number, align: 'left' | 'center'): TBox {
  const cols = Math.max(1, ...rows.map((r) => r.length));
  const cw = Array.from({ length: cols }, (_, j) => Math.max(0, ...rows.map((r) => r[j]?.w ?? 0)));
  const gapX = size * 0.9, gapY = size * 0.3;
  const W = cw.reduce((a, b) => a + b, 0) + gapX * (cols - 1);
  const heights = rows.map((r) => ({ h: Math.max(size * 0.72, ...r.map((b) => b.h)), d: Math.max(size * 0.22, ...r.map((b) => b.d)) }));
  const total = heights.reduce((a, r) => a + r.h + r.d, 0) + gapY * (rows.length - 1);
  const axis = size * 0.27;
  const top = total / 2 + axis;   // centered on the formula axis (like a fraction)
  return {
    w: W, h: top, d: Math.max(0, total - top), cls: 'ord',
    draw(g, x, y, c) {
      let yy = y - top;
      rows.forEach((r, i) => {
        const hh = heights[i]!;
        yy += hh.h;
        const rw = r.reduce((a, b, j) => a + (j < r.length - 1 ? cw[j]! + gapX : b.w), 0);
        let xx = x + (align === 'center' && cols === 1 ? (W - rw) / 2 : 0);
        r.forEach((b, j) => { b.draw(g, xx, yy, c); xx += cw[j]! + gapX; });
        yy += hh.d + gapY;
      });
    },
  };
}

function wrapDecor(inner: TBox, size: number, kind: string, color?: string): TBox {
  const t = Math.max(0.5, size * 0.06);
  if (kind === 'color') return { ...inner, draw: (g, x, y) => inner.draw(g, x, y, color!) };
  if (kind === 'hl') return { ...inner, draw(g, x, y, c) { g.fillStyle = 'rgba(255,236,39,0.28)'; g.fillRect(x - size * 0.08, y - inner.h - size * 0.06, inner.w + size * 0.16, inner.h + inner.d + size * 0.12); inner.draw(g, x, y, c); } };
  if (kind === 'boxed') {
    const p = size * 0.18;
    return { w: inner.w + p * 2, h: inner.h + p, d: inner.d + p, cls: 'ord', draw(g, x, y, c) { g.strokeStyle = c; g.lineWidth = t; g.strokeRect(x + t, y - inner.h - p + t, inner.w + p * 2 - t * 2, inner.h + inner.d + p * 2 - t * 2); inner.draw(g, x + p, y, c); } };
  }
  if (kind === 'cancel') return { ...inner, draw(g, x, y, c) { inner.draw(g, x, y, c); line(g, [x, y + inner.d, x + inner.w, y - inner.h], '#FF004D', t * 1.3); } };
  // over a letter: bar, arrow (vector), "hat"
  const lift = size * 0.14;
  return {
    w: inner.w, h: inner.h + lift + size * 0.12, d: inner.d, cls: inner.cls,
    draw(g, x, y, c) {
      inner.draw(g, x, y, c);
      const yy = y - inner.h - lift;
      if (kind === 'vec') { line(g, [x + 1, yy, x + inner.w, yy], c, t); line(g, [x + inner.w - size * 0.18, yy - size * 0.1, x + inner.w, yy, x + inner.w - size * 0.18, yy + size * 0.1], c, t); }
      else if (kind === 'hat') line(g, [x + inner.w * 0.2, yy + size * 0.06, x + inner.w / 2, yy - size * 0.08, x + inner.w * 0.8, yy + size * 0.06], c, t);
      else line(g, [x, yy, x + inner.w, yy], c, t);
    },
  };
}

/* --------------------------------- parsing --------------------------------- */

class Parser {
  i = 0;
  constructor(private s: string) {}
  peek() { return this.s[this.i] ?? ''; }
  eof() { return this.i >= this.s.length; }
  skipWs() { while (/\s/.test(this.peek())) this.i++; }
  cmdName() {
    // after "\": letters form a command name; otherwise a single character
    const m = /^[a-zA-Z]+/.exec(this.s.slice(this.i));
    if (m) { this.i += m[0].length; return m[0]; }
    return this.s[this.i++] ?? '';
  }
  raw(): string {
    // {text} taken raw, unparsed (for \text, \color)
    this.skipWs();
    if (this.peek() !== '{') return '';
    let depth = 0, out = '';
    while (!this.eof()) {
      const ch = this.s[this.i++]!;
      if (ch === '{') { if (depth++ > 0) out += ch; continue; }
      if (ch === '}') { if (--depth === 0) break; out += ch; continue; }
      out += ch;
    }
    return out;
  }
  optional(): string | null {
    this.skipWs();
    if (this.peek() !== '[') return null;
    const j = this.s.indexOf(']', this.i);
    if (j < 0) return null;
    const v = this.s.slice(this.i + 1, j); this.i = j + 1; return v;
  }

  // command argument: a {group} or a single symbol
  arg(size: number): TBox {
    this.skipWs();
    if (this.peek() === '{') { this.i++; const b = this.rows(size, '}'); return b; }
    const list = this.atom(size);
    return list ? hbox(list, size) : empty();
  }

  // rows/columns up to the closing token: one row is a plain row, several (\\) make a grid
  rows(size: number, close: string, align: 'left' | 'center' = 'center'): TBox {
    const rows: TBox[][] = [[]];
    let cur: TBox[] = [];
    for (;;) {
      if (this.eof()) break;
      const ch = this.peek();
      if (close && this.s.startsWith(close, this.i)) { this.i += close.length; break; }
      if (ch === '&') { this.i++; rows.at(-1)!.push(hbox(cur, size)); cur = []; continue; }
      if (ch === '\\' && this.s[this.i + 1] === '\\') { this.i += 2; rows.at(-1)!.push(hbox(cur, size)); cur = []; rows.push([]); continue; }
      const a = this.atom(size);
      if (a === null) break;
      cur.push(...a);
    }
    rows.at(-1)!.push(hbox(cur, size));
    if (rows.length === 1 && rows[0]!.length === 1) return rows[0]![0]!;
    return grid(rows.filter((r) => r.some((b) => b.w > 0)), size, align);
  }

  // one formula "atom" (with its superscript and subscript); null means end of group
  atom(size: number): TBox[] | null {
    const s = this.s;
    let base: TBox | null = null;
    const ch = this.peek();
    if (ch === '}') return null;
    if (/\s/.test(ch)) {
      // spaces in a formula are ignored, except next to text words (Cyrillic), e.g. «x = 4 см» ("4 cm")
      const st = this.i; this.skipWs();
      const before = s[st - 1] ?? '', after = this.peek();
      return /[а-яёўқғҳА-ЯЁЎҚҒҲ]/.test(before) || /[а-яёўқғҳА-ЯЁЎҚҒҲ]/.test(after) ? [space(size * 0.25)] : [];
    }
    if (ch === '{') { this.i++; base = this.rows(size, '}'); }
    else if (ch === '\\') {
      this.i++;
      const name = this.cmdName();
      base = this.command(name, size);
      if (base === null) return null;
    } else if (/[0-9]/.test(ch)) {
      const m = /^[0-9]+(?:[.,][0-9]+)?/.exec(s.slice(this.i))!;
      this.i += m[0].length; base = glyph(m[0], size);
    } else if (/[a-zA-Z]/.test(ch)) {
      const m = /^[a-zA-Z]+/.exec(s.slice(this.i))!;
      const fn = [...FUNCS].sort((a, b) => b.length - a.length).find((f) => m[0].startsWith(f));
      if (fn) { this.i += fn.length; base = glyph(fn, size, { cls: 'op' }); }
      else { this.i++; base = glyph(ch, size, { italic: true }); }
    } else if (/[а-яёўқғҳА-ЯЁЎҚҒҲ]/.test(ch)) {
      const m = /^[а-яёўқғҳА-ЯЁЎҚҒҲ]+\.?/.exec(s.slice(this.i))!;
      this.i += m[0].length; base = glyph(m[0], size, { sans: true, scale: 0.92 });
    } else {
      this.i++;
      const map: Record<string, string> = { '-': '−', '*': '·', "'": '′' };
      const g = map[ch] ?? ch;
      const cls: Cls = BIN.has(g) ? 'bin' : REL.has(g) ? 'rel' : '([{'.includes(g) ? 'open' : ')]}'.includes(g) ? 'close' : ',;'.includes(g) ? 'punct' : 'ord';
      if (ch === '^' || ch === '_') { this.i--; base = empty(); }
      else base = glyph(g, size, { cls });
    }
    // superscript / subscript
    let sup: TBox | null = null, sub: TBox | null = null;
    for (;;) {
      const p = this.peek();
      if (p === '^' && !sup) { this.i++; sup = this.arg(Math.max(5, size * 0.7)); continue; }
      if (p === '_' && !sub) { this.i++; sub = this.arg(Math.max(5, size * 0.7)); continue; }
      break;
    }
    return [sup || sub ? scripts(base!, sup, sub, size) : base!];
  }

  command(name: string, size: number): TBox | null {
    if (name in SPACE) return space(SPACE[name]! * size);
    if (name === '\\') return space(0);
    switch (name) {
      case 'frac': case 'dfrac': case 'tfrac': { const k = Math.max(6, size * 0.86); const n = this.arg(k), d = this.arg(k); return frac(n, d, size); }
      case 'sqrt': { const idx = this.optional(); const inner = this.arg(size); return sqrt(inner, size, idx ? new Parser(idx).rows(Math.max(5, size * 0.55), '') : null); }
      case 'text': case 'mathrm': case 'textrm': case 'operatorname': case 'mbox': { const t = this.raw(); return glyph(t, size, { sans: /[а-яёА-ЯЁ]/.test(t), scale: /[а-яёА-ЯЁ]/.test(t) ? 0.92 : 1 }); }
      case 'mathbf': case 'textbf': case 'bm': { const t = this.raw(); return glyph(t, size, { bold: true }); }
      case 'color': case 'textcolor': { const c = this.raw().trim(); const inner = this.arg(size); return wrapDecor(inner, size, 'color', /^#[0-9a-f]{3,8}$/i.test(c) ? c : '#FFEC27'); }
      case 'hl': case 'colorbox': return wrapDecor(this.arg(size), size, 'hl');
      case 'boxed': case 'fbox': return wrapDecor(this.arg(size), size, 'boxed');
      case 'cancel': case 'xcancel': case 'bcancel': return wrapDecor(this.arg(size), size, 'cancel');
      case 'vec': case 'overrightarrow': return wrapDecor(this.arg(size), size, 'vec');
      case 'overline': case 'bar': return wrapDecor(this.arg(size), size, 'bar');
      case 'hat': case 'widehat': return wrapDecor(this.arg(size), size, 'hat');
      case 'left': {
        this.skipWs();
        const open = this.peek() === '\\' ? (this.i++, `\\${this.cmdName()}`) : this.s[this.i++] ?? '(';
        const inner = this.rows(size, '\\right');
        this.skipWs();
        const close = this.peek() === '\\' ? (this.i++, `\\${this.cmdName()}`) : this.s[this.i++] ?? ')';
        const o = delim(open.replace('\\lbrace', '{').replace('\\{', '{').replace('\\lvert', '|'), inner.h, inner.d, size, false);
        const c = delim(close.replace('\\rbrace', '}').replace('\\}', '}').replace('\\rvert', '|'), inner.h, inner.d, size, true);
        return hbox([o, space(size * 0.05), inner, space(size * 0.05), c], size);
      }
      case 'right': return null;
      case 'begin': {
        const env = this.raw();
        const body = this.rows(size, `\\end{${env}}`, 'left');
        if (env === 'cases') { const br = delim('{', body.h, body.d, size, false); return hbox([br, space(size * 0.2), body], size); }
        if (env === 'pmatrix') return hbox([delim('(', body.h, body.d, size, false), body, delim(')', body.h, body.d, size, true)], size);
        if (env === 'bmatrix') return hbox([delim('[', body.h, body.d, size, false), body, delim(']', body.h, body.d, size, true)], size);
        return body;
      }
      case 'end': this.raw(); return null;
    }
    if (FUNCS.has(name)) return glyph(name, size, { cls: 'op' });
    if (BIG[name]) return glyph(BIG[name]!, size, { cls: 'op', scale: 1.35 });
    const sym = SYM[name];
    if (sym) return glyph(sym[0], size, { cls: sym[1] });
    return glyph(name, size, { sans: true });
  }
}

const cache = new Map<string, TBox>();
/** Formula → box (size is the font height in board units). */
export function tex(s: string, size: number): TBox {
  const key = `${size}|${s}`;
  let b = cache.get(key);
  if (!b) {
    try { b = new Parser(s.slice(0, 300)).rows(size, ''); } catch { b = glyph(s, size); }
    if (cache.size > 300) cache.clear();
    cache.set(key, b);
  }
  return b;
}

/** Split "left = right" at the first "=" outside brackets (for aligning solution steps). */
export function splitEq(s: string): [string, string] | null {
  let depth = 0;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (ch === '{') depth++; else if (ch === '}') depth--;
    else if (ch === '=' && depth === 0 && s[i - 1] !== '\\' && s[i - 1] !== '<' && s[i - 1] !== '>' && s[i - 1] !== '!') return [s.slice(0, i).trim(), s.slice(i + 1).trim()];
  }
  return null;
}
