/*! UpBilim Board v0.1.0 | Copyright 2026 UpBilim (https://upbilim.com) | Apache-2.0 | https://github.com/UpBilim/board */

// src/tex.ts
var SERIF = '"Cambria Math", "STIX Two Math", "Times New Roman", "Noto Serif", serif';
var SANS = '"Inter", system-ui, sans-serif';
var mctx = null;
var measure = (s, font) => {
  mctx ??= document.createElement("canvas").getContext("2d");
  mctx.font = font;
  return mctx.measureText(s).width;
};
var SYM = {
  cdot: ["\xB7", "bin"],
  times: ["\xD7", "bin"],
  div: ["\xF7", "bin"],
  pm: ["\xB1", "bin"],
  mp: ["\u2213", "bin"],
  cup: ["\u222A", "bin"],
  cap: ["\u2229", "bin"],
  circ: ["\xB0", "ord"],
  le: ["\u2264", "rel"],
  leq: ["\u2264", "rel"],
  ge: ["\u2265", "rel"],
  geq: ["\u2265", "rel"],
  ne: ["\u2260", "rel"],
  neq: ["\u2260", "rel"],
  approx: ["\u2248", "rel"],
  equiv: ["\u2261", "rel"],
  sim: ["\u223C", "rel"],
  to: ["\u2192", "rel"],
  rightarrow: ["\u2192", "rel"],
  leftarrow: ["\u2190", "rel"],
  Rightarrow: ["\u21D2", "rel"],
  Leftarrow: ["\u21D0", "rel"],
  Leftrightarrow: ["\u21D4", "rel"],
  iff: ["\u21D4", "rel"],
  perp: ["\u22A5", "rel"],
  parallel: ["\u2225", "rel"],
  in: ["\u2208", "rel"],
  notin: ["\u2209", "rel"],
  subset: ["\u2282", "rel"],
  infty: ["\u221E", "ord"],
  degree: ["\xB0", "ord"],
  angle: ["\u2220", "ord"],
  triangle: ["\u25B3", "ord"],
  emptyset: ["\u2205", "ord"],
  varnothing: ["\u2205", "ord"],
  forall: ["\u2200", "ord"],
  exists: ["\u2203", "ord"],
  partial: ["\u2202", "ord"],
  nabla: ["\u2207", "ord"],
  ldots: ["\u2026", "ord"],
  dots: ["\u2026", "ord"],
  cdots: ["\u22EF", "ord"],
  "%": ["%", "ord"],
  "{": ["{", "open"],
  "}": ["}", "close"],
  "#": ["#", "ord"],
  "&": ["&", "ord"],
  _: ["_", "ord"],
  $: ["$", "ord"],
  alpha: ["\u03B1", "ord"],
  beta: ["\u03B2", "ord"],
  gamma: ["\u03B3", "ord"],
  delta: ["\u03B4", "ord"],
  epsilon: ["\u03B5", "ord"],
  varepsilon: ["\u03B5", "ord"],
  zeta: ["\u03B6", "ord"],
  eta: ["\u03B7", "ord"],
  theta: ["\u03B8", "ord"],
  iota: ["\u03B9", "ord"],
  kappa: ["\u03BA", "ord"],
  lambda: ["\u03BB", "ord"],
  mu: ["\u03BC", "ord"],
  nu: ["\u03BD", "ord"],
  xi: ["\u03BE", "ord"],
  pi: ["\u03C0", "ord"],
  rho: ["\u03C1", "ord"],
  sigma: ["\u03C3", "ord"],
  tau: ["\u03C4", "ord"],
  phi: ["\u03C6", "ord"],
  varphi: ["\u03C6", "ord"],
  chi: ["\u03C7", "ord"],
  psi: ["\u03C8", "ord"],
  omega: ["\u03C9", "ord"],
  Gamma: ["\u0393", "ord"],
  Delta: ["\u0394", "ord"],
  Theta: ["\u0398", "ord"],
  Lambda: ["\u039B", "ord"],
  Xi: ["\u039E", "ord"],
  Pi: ["\u03A0", "ord"],
  Sigma: ["\u03A3", "ord"],
  Phi: ["\u03A6", "ord"],
  Psi: ["\u03A8", "ord"],
  Omega: ["\u03A9", "ord"]
};
var FUNCS = /* @__PURE__ */ new Set(["sin", "cos", "tg", "ctg", "tan", "cot", "arcsin", "arccos", "arctg", "arctan", "log", "ln", "lg", "exp", "lim", "max", "min", "sgn", "mod", "gcd", "det"]);
var BIG = { sum: "\u2211", prod: "\u220F", int: "\u222B", oint: "\u222E" };
var SPACE = { ",": 0.17, ":": 0.22, ";": 0.28, " ": 0.25, quad: 1, qquad: 2, "!": -0.12 };
var BIN = /* @__PURE__ */ new Set(["+", "\u2212", "\xB7", "\xD7", "\xF7", "\xB1", "\u2213"]);
var REL = /* @__PURE__ */ new Set(["=", "<", ">", "\u2264", "\u2265", "\u2260", "\u2248", "\u2192", "\u21D2", "\u21D4", "\u2208"]);
var empty = () => ({ w: 0, h: 0, d: 0, draw() {
} });
var space = (w) => ({ w, h: 0, d: 0, cls: "space", draw() {
} });
function glyph(s, size, opt = {}) {
  const px = size * (opt.scale ?? 1);
  const font = `${opt.italic ? "italic " : ""}${opt.bold ? "700 " : ""}${px}px ${opt.sans ? SANS : SERIF}`;
  const w = measure(s, font) + (opt.italic ? px * 0.04 : 0);
  return {
    w,
    h: px * 0.72,
    d: px * 0.22,
    cls: opt.cls ?? "ord",
    draw(g, x, y, c) {
      g.font = font;
      g.fillStyle = c;
      g.textBaseline = "alphabetic";
      g.textAlign = "left";
      g.fillText(s, x, y);
    }
  };
}
function hbox(list2, size) {
  const out = [];
  let x = 0, prev = null;
  for (let b of list2) {
    let cls = b.cls ?? "ord";
    if (cls === "bin" && (prev === null || prev === "bin" || prev === "rel" || prev === "open" || prev === "punct" || prev === "op")) {
      cls = "ord";
      b = { ...b, cls };
    }
    const gap = cls === "rel" || prev === "rel" ? 0.28 : cls === "bin" || prev === "bin" ? 0.22 : prev === "punct" ? 0.17 : prev === "op" && cls !== "open" ? 0.12 : 0;
    if (prev !== null && cls !== "space" && prev !== "space") x += gap * size;
    out.push({ b, x });
    x += b.w;
    prev = cls;
  }
  return {
    w: x,
    h: Math.max(0, ...list2.map((b) => b.h)),
    d: Math.max(0, ...list2.map((b) => b.d)),
    draw(g, x0, y, c) {
      for (const o of out) o.b.draw(g, x0 + o.x, y, c);
    }
  };
}
var line = (g, pts, c, w) => {
  g.beginPath();
  g.moveTo(pts[0], pts[1]);
  for (let i = 2; i < pts.length; i += 2) g.lineTo(pts[i], pts[i + 1]);
  g.strokeStyle = c;
  g.lineWidth = w;
  g.lineCap = "round";
  g.lineJoin = "round";
  g.stroke();
};
function frac(n, dn, size) {
  const axis = size * 0.27, gap = size * 0.14, pad = size * 0.12, t = Math.max(0.5, size * 0.06);
  const w = Math.max(n.w, dn.w) + pad * 2;
  return {
    w,
    h: axis + gap + n.d + n.h,
    d: Math.max(0, gap + dn.h + dn.d - axis),
    cls: "ord",
    draw(g, x, y, c) {
      line(g, [x + pad * 0.4, y - axis, x + w - pad * 0.4, y - axis], c, t);
      n.draw(g, x + (w - n.w) / 2, y - axis - gap - n.d, c);
      dn.draw(g, x + (w - dn.w) / 2, y - axis + gap + dn.h, c);
    }
  };
}
function sqrt(inner, size, index) {
  const sw = size * 0.55, pad = size * 0.1, t = Math.max(0.5, size * 0.06);
  const h = inner.h + size * 0.22, d = inner.d + size * 0.04;
  const off = index ? Math.max(0, index.w - sw * 0.45) : 0;
  return {
    w: off + sw + inner.w + pad,
    h: index ? Math.max(h, h * 0.55 + index.h + index.d) : h,
    d,
    cls: "ord",
    draw(g, x, y, c) {
      const x0 = x + off;
      line(g, [x0, y - h * 0.38, x0 + sw * 0.25, y - h * 0.46, x0 + sw * 0.55, y + d, x0 + sw, y - h + t, x0 + sw + inner.w + pad, y - h + t], c, t);
      inner.draw(g, x0 + sw + pad * 0.3, y, c);
      if (index) index.draw(g, x0 + sw * 0.45 - index.w, y - h * 0.55, c);
    }
  };
}
function scripts(base, sup, sub, size) {
  const up = sup ? Math.max(size * 0.4, base.h - sup.h * 0.45) : 0;
  const dn = sub ? Math.max(size * 0.2, base.d + sub.h * 0.35 - size * 0.05) : 0;
  const sw = Math.max(sup?.w ?? 0, sub?.w ?? 0);
  return {
    w: base.w + sw + size * 0.04,
    h: Math.max(base.h, sup ? up + sup.h : 0),
    d: Math.max(base.d, sub ? dn + sub.d : 0),
    cls: base.cls,
    draw(g, x, y, c) {
      base.draw(g, x, y, c);
      sup?.draw(g, x + base.w + size * 0.02, y - up, c);
      sub?.draw(g, x + base.w + size * 0.02, y + dn, c);
    }
  };
}
function delim(ch, h, d, size, right) {
  if (ch === "." || !ch) return space(size * 0.05);
  const total = h + d;
  if (total < size * 1.25) {
    const gl = glyph(ch === "\\{" ? "{" : ch === "\\}" ? "}" : ch, size, { cls: right ? "close" : "open" });
    return gl;
  }
  const w = size * (ch === "|" ? 0.25 : 0.42), t = Math.max(0.5, size * 0.065), top = -h - size * 0.05, bot = d + size * 0.05;
  return {
    w,
    h: h + size * 0.05,
    d: d + size * 0.05,
    cls: right ? "close" : "open",
    draw(g, x, y, c) {
      const a = y + top, b = y + bot, m = (a + b) / 2, l = x + w * 0.2, r = x + w * 0.8;
      g.beginPath();
      g.strokeStyle = c;
      g.lineWidth = t;
      g.lineCap = "round";
      g.lineJoin = "round";
      const k = ch.replace("\\", "");
      if (k === "(" || k === ")") {
        const fl = k === ")";
        const X = (v) => fl ? x + w - (v - x) : v;
        g.moveTo(X(r), a);
        g.quadraticCurveTo(X(l - w * 0.25), m, X(r), b);
      } else if (k === "[" || k === "]") {
        const fl = k === "]";
        const X = (v) => fl ? x + w - (v - x) : v;
        g.moveTo(X(r), a);
        g.lineTo(X(l), a);
        g.lineTo(X(l), b);
        g.lineTo(X(r), b);
      } else if (k === "|") {
        g.moveTo(x + w / 2, a);
        g.lineTo(x + w / 2, b);
      } else {
        const fl = k === "}" || right && k !== "{";
        const X = (v) => fl ? x + w - (v - x) : v;
        const mx = x + w * 0.5;
        g.moveTo(X(r), a);
        g.quadraticCurveTo(X(mx), a, X(mx), a + (m - a) * 0.3);
        g.lineTo(X(mx), m - (m - a) * 0.25);
        g.quadraticCurveTo(X(mx), m, X(l), m);
        g.quadraticCurveTo(X(mx), m, X(mx), m + (b - m) * 0.25);
        g.lineTo(X(mx), b - (b - m) * 0.3);
        g.quadraticCurveTo(X(mx), b, X(r), b);
      }
      g.stroke();
    }
  };
}
function grid(rows, size, align) {
  const cols = Math.max(1, ...rows.map((r) => r.length));
  const cw = Array.from({ length: cols }, (_, j) => Math.max(0, ...rows.map((r) => r[j]?.w ?? 0)));
  const gapX = size * 0.9, gapY = size * 0.3;
  const W2 = cw.reduce((a, b) => a + b, 0) + gapX * (cols - 1);
  const heights = rows.map((r) => ({ h: Math.max(size * 0.72, ...r.map((b) => b.h)), d: Math.max(size * 0.22, ...r.map((b) => b.d)) }));
  const total = heights.reduce((a, r) => a + r.h + r.d, 0) + gapY * (rows.length - 1);
  const axis = size * 0.27;
  const top = total / 2 + axis;
  return {
    w: W2,
    h: top,
    d: Math.max(0, total - top),
    cls: "ord",
    draw(g, x, y, c) {
      let yy = y - top;
      rows.forEach((r, i) => {
        const hh = heights[i];
        yy += hh.h;
        const rw = r.reduce((a, b, j) => a + (j < r.length - 1 ? cw[j] + gapX : b.w), 0);
        let xx = x + (align === "center" && cols === 1 ? (W2 - rw) / 2 : 0);
        r.forEach((b, j) => {
          b.draw(g, xx, yy, c);
          xx += cw[j] + gapX;
        });
        yy += hh.d + gapY;
      });
    }
  };
}
function wrapDecor(inner, size, kind, color) {
  const t = Math.max(0.5, size * 0.06);
  if (kind === "color") return { ...inner, draw: (g, x, y) => inner.draw(g, x, y, color) };
  if (kind === "hl") return { ...inner, draw(g, x, y, c) {
    g.fillStyle = "rgba(255,236,39,0.28)";
    g.fillRect(x - size * 0.08, y - inner.h - size * 0.06, inner.w + size * 0.16, inner.h + inner.d + size * 0.12);
    inner.draw(g, x, y, c);
  } };
  if (kind === "boxed") {
    const p = size * 0.18;
    return { w: inner.w + p * 2, h: inner.h + p, d: inner.d + p, cls: "ord", draw(g, x, y, c) {
      g.strokeStyle = c;
      g.lineWidth = t;
      g.strokeRect(x + t, y - inner.h - p + t, inner.w + p * 2 - t * 2, inner.h + inner.d + p * 2 - t * 2);
      inner.draw(g, x + p, y, c);
    } };
  }
  if (kind === "cancel") return { ...inner, draw(g, x, y, c) {
    inner.draw(g, x, y, c);
    line(g, [x, y + inner.d, x + inner.w, y - inner.h], "#FF004D", t * 1.3);
  } };
  const lift = size * 0.14;
  return {
    w: inner.w,
    h: inner.h + lift + size * 0.12,
    d: inner.d,
    cls: inner.cls,
    draw(g, x, y, c) {
      inner.draw(g, x, y, c);
      const yy = y - inner.h - lift;
      if (kind === "vec") {
        line(g, [x + 1, yy, x + inner.w, yy], c, t);
        line(g, [x + inner.w - size * 0.18, yy - size * 0.1, x + inner.w, yy, x + inner.w - size * 0.18, yy + size * 0.1], c, t);
      } else if (kind === "hat") line(g, [x + inner.w * 0.2, yy + size * 0.06, x + inner.w / 2, yy - size * 0.08, x + inner.w * 0.8, yy + size * 0.06], c, t);
      else line(g, [x, yy, x + inner.w, yy], c, t);
    }
  };
}
var Parser = class _Parser {
  constructor(s) {
    this.s = s;
  }
  i = 0;
  peek() {
    return this.s[this.i] ?? "";
  }
  eof() {
    return this.i >= this.s.length;
  }
  skipWs() {
    while (/\s/.test(this.peek())) this.i++;
  }
  cmdName() {
    const m = /^[a-zA-Z]+/.exec(this.s.slice(this.i));
    if (m) {
      this.i += m[0].length;
      return m[0];
    }
    return this.s[this.i++] ?? "";
  }
  raw() {
    this.skipWs();
    if (this.peek() !== "{") return "";
    let depth = 0, out = "";
    while (!this.eof()) {
      const ch = this.s[this.i++];
      if (ch === "{") {
        if (depth++ > 0) out += ch;
        continue;
      }
      if (ch === "}") {
        if (--depth === 0) break;
        out += ch;
        continue;
      }
      out += ch;
    }
    return out;
  }
  optional() {
    this.skipWs();
    if (this.peek() !== "[") return null;
    const j = this.s.indexOf("]", this.i);
    if (j < 0) return null;
    const v = this.s.slice(this.i + 1, j);
    this.i = j + 1;
    return v;
  }
  // command argument: a {group} or a single symbol
  arg(size) {
    this.skipWs();
    if (this.peek() === "{") {
      this.i++;
      const b = this.rows(size, "}");
      return b;
    }
    const list2 = this.atom(size);
    return list2 ? hbox(list2, size) : empty();
  }
  // rows/columns up to the closing token: one row is a plain row, several (\\) make a grid
  rows(size, close, align = "center") {
    const rows = [[]];
    let cur = [];
    for (; ; ) {
      if (this.eof()) break;
      const ch = this.peek();
      if (close && this.s.startsWith(close, this.i)) {
        this.i += close.length;
        break;
      }
      if (ch === "&") {
        this.i++;
        rows.at(-1).push(hbox(cur, size));
        cur = [];
        continue;
      }
      if (ch === "\\" && this.s[this.i + 1] === "\\") {
        this.i += 2;
        rows.at(-1).push(hbox(cur, size));
        cur = [];
        rows.push([]);
        continue;
      }
      const a = this.atom(size);
      if (a === null) break;
      cur.push(...a);
    }
    rows.at(-1).push(hbox(cur, size));
    if (rows.length === 1 && rows[0].length === 1) return rows[0][0];
    return grid(rows.filter((r) => r.some((b) => b.w > 0)), size, align);
  }
  // one formula "atom" (with its superscript and subscript); null means end of group
  atom(size) {
    const s = this.s;
    let base = null;
    const ch = this.peek();
    if (ch === "}") return null;
    if (/\s/.test(ch)) {
      const st = this.i;
      this.skipWs();
      const before = s[st - 1] ?? "", after = this.peek();
      return /[а-яёўқғҳА-ЯЁЎҚҒҲ]/.test(before) || /[а-яёўқғҳА-ЯЁЎҚҒҲ]/.test(after) ? [space(size * 0.25)] : [];
    }
    if (ch === "{") {
      this.i++;
      base = this.rows(size, "}");
    } else if (ch === "\\") {
      this.i++;
      const name = this.cmdName();
      base = this.command(name, size);
      if (base === null) return null;
    } else if (/[0-9]/.test(ch)) {
      const m = /^[0-9]+(?:[.,][0-9]+)?/.exec(s.slice(this.i));
      this.i += m[0].length;
      base = glyph(m[0], size);
    } else if (/[a-zA-Z]/.test(ch)) {
      const m = /^[a-zA-Z]+/.exec(s.slice(this.i));
      const fn = [...FUNCS].sort((a, b) => b.length - a.length).find((f) => m[0].startsWith(f));
      if (fn) {
        this.i += fn.length;
        base = glyph(fn, size, { cls: "op" });
      } else {
        this.i++;
        base = glyph(ch, size, { italic: true });
      }
    } else if (/[а-яёўқғҳА-ЯЁЎҚҒҲ]/.test(ch)) {
      const m = /^[а-яёўқғҳА-ЯЁЎҚҒҲ]+\.?/.exec(s.slice(this.i));
      this.i += m[0].length;
      base = glyph(m[0], size, { sans: true, scale: 0.92 });
    } else {
      this.i++;
      const map = { "-": "\u2212", "*": "\xB7", "'": "\u2032" };
      const g = map[ch] ?? ch;
      const cls = BIN.has(g) ? "bin" : REL.has(g) ? "rel" : "([{".includes(g) ? "open" : ")]}".includes(g) ? "close" : ",;".includes(g) ? "punct" : "ord";
      if (ch === "^" || ch === "_") {
        this.i--;
        base = empty();
      } else base = glyph(g, size, { cls });
    }
    let sup = null, sub = null;
    for (; ; ) {
      const p = this.peek();
      if (p === "^" && !sup) {
        this.i++;
        sup = this.arg(Math.max(5, size * 0.7));
        continue;
      }
      if (p === "_" && !sub) {
        this.i++;
        sub = this.arg(Math.max(5, size * 0.7));
        continue;
      }
      break;
    }
    return [sup || sub ? scripts(base, sup, sub, size) : base];
  }
  command(name, size) {
    if (name in SPACE) return space(SPACE[name] * size);
    if (name === "\\") return space(0);
    switch (name) {
      case "frac":
      case "dfrac":
      case "tfrac": {
        const k = Math.max(6, size * 0.86);
        const n = this.arg(k), d = this.arg(k);
        return frac(n, d, size);
      }
      case "sqrt": {
        const idx = this.optional();
        const inner = this.arg(size);
        return sqrt(inner, size, idx ? new _Parser(idx).rows(Math.max(5, size * 0.55), "") : null);
      }
      case "text":
      case "mathrm":
      case "textrm":
      case "operatorname":
      case "mbox": {
        const t = this.raw();
        return glyph(t, size, { sans: /[а-яёА-ЯЁ]/.test(t), scale: /[а-яёА-ЯЁ]/.test(t) ? 0.92 : 1 });
      }
      case "mathbf":
      case "textbf":
      case "bm": {
        const t = this.raw();
        return glyph(t, size, { bold: true });
      }
      case "color":
      case "textcolor": {
        const c = this.raw().trim();
        const inner = this.arg(size);
        return wrapDecor(inner, size, "color", /^#[0-9a-f]{3,8}$/i.test(c) ? c : "#FFEC27");
      }
      case "hl":
      case "colorbox":
        return wrapDecor(this.arg(size), size, "hl");
      case "boxed":
      case "fbox":
        return wrapDecor(this.arg(size), size, "boxed");
      case "cancel":
      case "xcancel":
      case "bcancel":
        return wrapDecor(this.arg(size), size, "cancel");
      case "vec":
      case "overrightarrow":
        return wrapDecor(this.arg(size), size, "vec");
      case "overline":
      case "bar":
        return wrapDecor(this.arg(size), size, "bar");
      case "hat":
      case "widehat":
        return wrapDecor(this.arg(size), size, "hat");
      case "left": {
        this.skipWs();
        const open = this.peek() === "\\" ? (this.i++, `\\${this.cmdName()}`) : this.s[this.i++] ?? "(";
        const inner = this.rows(size, "\\right");
        this.skipWs();
        const close = this.peek() === "\\" ? (this.i++, `\\${this.cmdName()}`) : this.s[this.i++] ?? ")";
        const o = delim(open.replace("\\lbrace", "{").replace("\\{", "{").replace("\\lvert", "|"), inner.h, inner.d, size, false);
        const c = delim(close.replace("\\rbrace", "}").replace("\\}", "}").replace("\\rvert", "|"), inner.h, inner.d, size, true);
        return hbox([o, space(size * 0.05), inner, space(size * 0.05), c], size);
      }
      case "right":
        return null;
      case "begin": {
        const env = this.raw();
        const body = this.rows(size, `\\end{${env}}`, "left");
        if (env === "cases") {
          const br = delim("{", body.h, body.d, size, false);
          return hbox([br, space(size * 0.2), body], size);
        }
        if (env === "pmatrix") return hbox([delim("(", body.h, body.d, size, false), body, delim(")", body.h, body.d, size, true)], size);
        if (env === "bmatrix") return hbox([delim("[", body.h, body.d, size, false), body, delim("]", body.h, body.d, size, true)], size);
        return body;
      }
      case "end":
        this.raw();
        return null;
    }
    if (FUNCS.has(name)) return glyph(name, size, { cls: "op" });
    if (BIG[name]) return glyph(BIG[name], size, { cls: "op", scale: 1.35 });
    const sym = SYM[name];
    if (sym) return glyph(sym[0], size, { cls: sym[1] });
    return glyph(name, size, { sans: true });
  }
};
var cache = /* @__PURE__ */ new Map();
function tex(s, size) {
  const key = `${size}|${s}`;
  let b = cache.get(key);
  if (!b) {
    try {
      b = new Parser(s.slice(0, 300)).rows(size, "");
    } catch {
      b = glyph(s, size);
    }
    if (cache.size > 300) cache.clear();
    cache.set(key, b);
  }
  return b;
}
function splitEq(s) {
  let depth = 0;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (ch === "{") depth++;
    else if (ch === "}") depth--;
    else if (ch === "=" && depth === 0 && s[i - 1] !== "\\" && s[i - 1] !== "<" && s[i - 1] !== ">" && s[i - 1] !== "!") return [s.slice(0, i).trim(), s.slice(i + 1).trim()];
  }
  return null;
}

// src/expr.ts
var F = {
  sin: Math.sin,
  cos: Math.cos,
  tan: Math.tan,
  tg: Math.tan,
  cot: (v) => 1 / Math.tan(v),
  ctg: (v) => 1 / Math.tan(v),
  asin: Math.asin,
  acos: Math.acos,
  atan: Math.atan,
  arcsin: Math.asin,
  arccos: Math.acos,
  arctg: Math.atan,
  arctan: Math.atan,
  sqrt: Math.sqrt,
  abs: Math.abs,
  ln: Math.log,
  log: Math.log10,
  lg: Math.log10,
  exp: Math.exp,
  floor: Math.floor,
  ceil: Math.ceil,
  round: Math.round,
  sign: Math.sign
};
function compile(src) {
  const s = src.toLowerCase().replace(/^\s*(y|f\(x\))\s*=/, "").replace(/[−–]/g, "-").replace(/[·×]/g, "*").replace(/²/g, "^2").replace(/³/g, "^3").replace(/π/g, "pi").replace(/√/g, "sqrt").replace(/,/g, ".");
  let i = 0;
  const ws = () => {
    while (s[i] === " ") i++;
  };
  const peek = () => {
    ws();
    return s[i] ?? "";
  };
  const expr = () => {
    let a = term();
    for (; ; ) {
      const c = peek();
      if (c === "+") {
        i++;
        const l = a, r = term();
        a = (x) => l(x) + r(x);
      } else if (c === "-") {
        i++;
        const l = a, r = term();
        a = (x) => l(x) - r(x);
      } else return a;
    }
  };
  const term = () => {
    let a = unary();
    for (; ; ) {
      const c = peek();
      if (c === "*") {
        i++;
        const l = a, r = unary();
        a = (x) => l(x) * r(x);
      } else if (c === "/") {
        i++;
        const l = a, r = unary();
        a = (x) => l(x) / r(x);
      } else if (c && /[0-9a-z(|.]/.test(c) && !(c === "|" && absDepth > 0)) {
        const l = a, r = power();
        a = (x) => l(x) * r(x);
      } else return a;
    }
  };
  const unary = () => {
    const c = peek();
    if (c === "-") {
      i++;
      const r = unary();
      return (x) => -r(x);
    }
    if (c === "+") {
      i++;
      return unary();
    }
    return power();
  };
  const power = () => {
    const b = atom();
    if (peek() === "^") {
      i++;
      const e = unary();
      return (x) => Math.pow(b(x), e(x));
    }
    return b;
  };
  let absDepth = 0;
  const atom = () => {
    const c = peek();
    if (c === "(") {
      i++;
      const e = expr();
      if (peek() === ")") i++;
      return e;
    }
    if (c === "|") {
      i++;
      absDepth++;
      const e = expr();
      absDepth--;
      if (peek() === "|") i++;
      return (x) => Math.abs(e(x));
    }
    const num3 = /^[0-9]*\.?[0-9]+/.exec(s.slice(i));
    if (num3) {
      i += num3[0].length;
      const v = parseFloat(num3[0]);
      return () => v;
    }
    const id = /^[a-z]+/.exec(s.slice(i));
    if (id) {
      const w = id[0];
      const fn = Object.keys(F).sort((a, b) => b.length - a.length).find((k) => w.startsWith(k));
      if (fn) {
        i += fn.length;
        const f = F[fn];
        const arg = peek() === "(" ? atom() : power();
        return (x) => f(arg(x));
      }
      if (w.startsWith("pi")) {
        i += 2;
        return () => Math.PI;
      }
      if (w[0] === "x") {
        i += 1;
        return (x) => x;
      }
      if (w[0] === "e") {
        i += 1;
        return () => Math.E;
      }
    }
    throw new Error("bad");
  };
  try {
    const f = expr();
    if (i < s.length && s.slice(i).trim()) return null;
    f(1.234);
    return f;
  } catch {
    return null;
  }
}
function niceStep(range, ticks = 8) {
  const raw = Math.abs(range) / ticks || 1;
  const p = Math.pow(10, Math.floor(Math.log10(raw)));
  const k = raw / p;
  return (k <= 1 ? 1 : k <= 2 ? 2 : k <= 5 ? 5 : 10) * p;
}
var fmtNum = (v) => {
  const r = Math.round(v * 1e3) / 1e3;
  return (Object.is(r, -0) ? "0" : String(r)).replace("-", "\u2212").replace(".", ",");
};

// src/pen.ts
var SANS2 = '"Inter", system-ui, sans-serif';
var mctx2 = null;
var textW = (s, size, bold = false) => {
  mctx2 ??= document.createElement("canvas").getContext("2d");
  mctx2.font = `${bold ? 700 : 600} ${size}px ${SANS2}`;
  return mctx2.measureText(s).width;
};
var lwOf = (v) => {
  const n = typeof v === "number" && Number.isFinite(v) ? Math.max(0.5, Math.min(4, v)) : 2;
  return 0.4 + n * 0.66;
};
function alpha(hex, a) {
  let h = hex.replace("#", "");
  if (h.length === 3) h = [...h].map((x) => x + x).join("");
  if (h.length < 6) return hex;
  const n = parseInt(h.slice(0, 6), 16);
  return `rgba(${n >> 16 & 255},${n >> 8 & 255},${n & 255},${a})`;
}
var ellipsePts = (cx, cy, rx, ry, a0 = 0, a1 = Math.PI * 2, wob = 0) => {
  const n = Math.max(16, Math.min(120, Math.round((rx + ry) * Math.abs(a1 - a0) / 3)));
  const out = [];
  for (let i = 0; i <= n; i++) {
    const a = a0 + (a1 - a0) * i / n, k = 1 + wob * Math.sin(a * 3 + 1);
    out.push(cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k);
  }
  return out;
};
var rectPts = (x, y, w, h, r = 0) => {
  if (r <= 0) return [x, y, x + w, y, x + w, y + h, x, y + h, x, y];
  r = Math.min(r, w / 2, h / 2);
  const out = [];
  const arc = (cx, cy, a) => {
    for (let i = 0; i <= 4; i++) {
      const t = a + i / 4 * (Math.PI / 2);
      out.push(cx + Math.cos(t) * r, cy + Math.sin(t) * r);
    }
  };
  arc(x + w - r, y + r, -Math.PI / 2);
  arc(x + w - r, y + h - r, 0);
  arc(x + r, y + h - r, Math.PI / 2);
  arc(x + r, y + r, Math.PI);
  out.push(out[0], out[1]);
  return out;
};
var Pen = class {
  prims = [];
  seq = 0;
  // o is the part's position in drawing "time" (on-screen paint order is the array order)
  push(p, o = this.seq++) {
    this.prims.push({ ...p, o, a: 0, b: 1 });
  }
  line(pts, c, w = 1.7, dash = false) {
    if (pts.length < 4) return;
    let len = 0;
    for (let i = 2; i < pts.length; i += 2) len += Math.hypot(pts[i] - pts[i - 2], pts[i + 1] - pts[i - 1]);
    this.push({ k: "line", pts, c, w, dash, len });
  }
  fill(pts, c) {
    if (pts.length >= 6) this.push({ k: "fill", pts, c });
  }
  // closed shape: the outline is traced first, then the fill fades in beneath it
  shape(pts, o) {
    if (o.fill && o.stroke) {
      const s = this.seq;
      this.seq += 2;
      this.push({ k: "fill", pts, c: o.fill }, s + 1);
      let len = 0;
      for (let i = 2; i < pts.length; i += 2) len += Math.hypot(pts[i] - pts[i - 2], pts[i + 1] - pts[i - 1]);
      this.push({ k: "line", pts, c: o.stroke, w: o.w ?? 1, dash: !!o.dash, len }, s);
    } else if (o.fill) this.fill(pts, o.fill);
    else if (o.stroke) this.line(pts, o.stroke, o.w, o.dash);
  }
  arrowHead(x1, y1, x2, y2, c, w) {
    const a = Math.atan2(y2 - y1, x2 - x1), l = 4 + w * 2.2;
    this.fill([x2 + Math.cos(a) * w * 0.6, y2 + Math.sin(a) * w * 0.6, x2 - l * Math.cos(a - 0.42), y2 - l * Math.sin(a - 0.42), x2 - l * Math.cos(a + 0.42), y2 - l * Math.sin(a + 0.42)], c);
  }
  text(s, x, y, size, c, o = {}) {
    const w = textW(s, size, o.bold);
    this.push({ k: "text", s, x, y, size, c, w, outline: o.outline ?? true, bold: !!o.bold, align: o.align ?? "left" });
    return w;
  }
  tex(b, x, baseline, c) {
    this.push({ k: "tex", bx: b, x, y: baseline, c });
  }
  img(img, x, y, w, h) {
    this.push({ k: "img", img, x, y, w, h });
  }
};
var weight = (p) => p.k === "line" ? p.len : p.k === "fill" ? 9 : p.k === "text" ? p.w * 1.4 + 8 : p.k === "tex" ? p.bx.w * 1.6 + 10 : 60;
function timeline(prims) {
  const order = [...prims].sort((p, q) => p.o - q.o);
  const total = order.reduce((s, p) => s + weight(p), 0) || 1;
  let acc = 0;
  for (const p of order) {
    p.a = acc / total;
    acc += weight(p);
    p.b = acc / total;
  }
  return total;
}
function bounds(prims) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  const add = (x, y, m = 0) => {
    x0 = Math.min(x0, x - m);
    y0 = Math.min(y0, y - m);
    x1 = Math.max(x1, x + m);
    y1 = Math.max(y1, y + m);
  };
  for (const p of prims) {
    if (p.k === "line" || p.k === "fill") for (let i = 0; i < p.pts.length; i += 2) add(p.pts[i], p.pts[i + 1], p.k === "line" ? p.w / 2 : 0);
    else if (p.k === "text") {
      const x = p.align === "center" ? p.x - p.w / 2 : p.x;
      add(x, p.y);
      add(x + p.w, p.y + p.size * 1.2);
    } else if (p.k === "tex") {
      add(p.x, p.y - p.bx.h);
      add(p.x + p.bx.w, p.y + p.bx.d);
    } else {
      add(p.x, p.y);
      add(p.x + p.w, p.y + p.h);
    }
  }
  return x0 === Infinity ? null : { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
}
var pathOf = (pts, close) => {
  const p = new Path2D();
  p.moveTo(pts[0], pts[1]);
  for (let i = 2; i < pts.length; i += 2) p.lineTo(pts[i], pts[i + 1]);
  if (close) p.closePath();
  return p;
};
function paint(g, prims, p) {
  let head = null;
  for (const q of prims) {
    const t = p >= 1 ? 1 : Math.max(0, Math.min(1, (p - q.a) / Math.max(1e-6, q.b - q.a)));
    if (t <= 0) continue;
    if (q.k === "line") {
      g.strokeStyle = q.c;
      g.lineWidth = q.w;
      g.lineCap = "round";
      g.lineJoin = "round";
      g.setLineDash(q.dash ? [q.w * 2.4, q.w * 2.2] : []);
      if (t >= 1) {
        q.path ??= pathOf(q.pts, false);
        g.stroke(q.path);
      } else {
        let left = q.len * t;
        g.beginPath();
        g.moveTo(q.pts[0], q.pts[1]);
        let hx = q.pts[0], hy = q.pts[1];
        for (let i = 2; i < q.pts.length && left > 0; i += 2) {
          const x0 = q.pts[i - 2], y0 = q.pts[i - 1], x1 = q.pts[i], y1 = q.pts[i + 1];
          const L = Math.hypot(x1 - x0, y1 - y0);
          if (L <= left) {
            g.lineTo(x1, y1);
            hx = x1;
            hy = y1;
            left -= L;
          } else {
            const k = left / L;
            hx = x0 + (x1 - x0) * k;
            hy = y0 + (y1 - y0) * k;
            g.lineTo(hx, hy);
            left = 0;
          }
        }
        g.stroke();
        head = [hx, hy];
      }
      g.setLineDash([]);
    } else if (q.k === "fill") {
      q.path ??= pathOf(q.pts, true);
      const a = g.globalAlpha;
      g.globalAlpha = a * (t >= 1 ? 1 : t * t * (3 - 2 * t));
      g.fillStyle = q.c;
      g.fill(q.path);
      g.globalAlpha = a;
    } else if (q.k === "text" || q.k === "tex") {
      const w = q.k === "text" ? q.w : q.bx.w;
      const x = q.k === "text" && q.align === "center" ? q.x - w / 2 : q.x;
      const top = q.k === "text" ? q.y - 4 : q.y - q.bx.h - 4, hh = q.k === "text" ? q.size * 1.4 + 8 : q.bx.h + q.bx.d + 8;
      if (t < 1) {
        g.save();
        g.beginPath();
        g.rect(x - 3, top, w * t + 3, hh);
        g.clip();
        head = [x + w * t, top + hh * 0.6];
      }
      if (q.k === "text") {
        g.font = `${q.bold ? 700 : 600} ${q.size}px ${SANS2}`;
        g.textBaseline = "top";
        g.textAlign = "left";
        if (q.outline) {
          g.lineWidth = Math.max(1.2, q.size * 0.2);
          g.lineJoin = "round";
          g.strokeStyle = "#10142E";
          g.strokeText(q.s, x, q.y);
        }
        g.fillStyle = q.c;
        g.fillText(q.s, x, q.y);
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

// src/icons.ts
var K = "#000000";
var WH = "#FFF1E8";
var Y = "#FFEC27";
var O = "#FFA300";
var R = "#FF004D";
var PK = "#FF77A8";
var GN = "#008751";
var LM = "#00E436";
var SK = "#29ADFF";
var NV = "#1D2B53";
var LG = "#C2C3C7";
var GR = "#5F574F";
var BR = "#AB5236";
var PE = "#FFCCAA";
var LV = "#83769C";
var PL = "#7E2553";
var ICONS = ["ball", "sun", "cloud", "drop", "tree", "house", "star", "heart", "apple", "planet", "moon", "person", "book", "bulb", "flask", "mountain", "fish", "flower", "battery", "car", "bus"];
function icon(pen, name, x, y, s, c) {
  const u = s / 16;
  const X = (px) => x - s / 2 + px * u, Yy = (py) => y - s / 2 + py * u;
  const E = (px, py, rx, ry, cc, fill = true) => fill ? pen.fill(ellipsePts(X(px), Yy(py), rx * u, ry * u), cc) : pen.line(ellipsePts(X(px), Yy(py), rx * u, ry * u), cc, Math.max(0.8, u));
  const B = (px, py, w, h, cc, r = 0) => pen.fill(rectPts(X(px), Yy(py), w * u, h * u, r * u), cc);
  const G = (pts, cc) => pen.fill(pts.flatMap(([a, b]) => [X(a), Yy(b)]), cc);
  const L = (a, b, cc, w = 1) => pen.line([X(a[0]), Yy(a[1]), X(b[0]), Yy(b[1])], cc, Math.max(0.8, w * u));
  switch (name) {
    case "ball":
      E(8, 8, 7, 7, c ?? LG);
      E(9.5, 9.5, 4.5, 4.5, c ? PL : GR);
      E(8, 8, 6.2, 6.2, c ?? LG);
      E(5.6, 5.4, 1.8, 1.6, WH);
      return;
    case "sun":
      for (let i = 0; i < 8; i++) {
        const a = i * Math.PI / 4;
        L([8 + Math.cos(a) * 5.6, 8 + Math.sin(a) * 5.6], [8 + Math.cos(a) * 7.8, 8 + Math.sin(a) * 7.8], c ?? O, 1.2);
      }
      E(8, 8, 4.6, 4.6, c ?? Y);
      E(6.8, 6.8, 1.4, 1.4, WH);
      return;
    case "cloud":
      E(5, 10, 3.5, 3, c ?? LG);
      E(8.5, 7.5, 4.2, 4, c ?? LG);
      E(12, 10, 3.5, 3, c ?? LG);
      B(4, 10, 8.5, 3, c ?? LG);
      E(8, 6.2, 2, 1.4, WH);
      return;
    case "drop":
      G([[8, 1.5], [12.2, 9], [3.8, 9]], c ?? SK);
      E(8, 10.5, 4.3, 4.3, c ?? SK);
      E(6.4, 10, 1, 1.6, WH);
      return;
    case "tree":
      B(6.8, 9, 2.4, 6.5, BR);
      E(8, 6.5, 6, 5.5, c ?? GN);
      E(6, 5, 2.2, 1.8, LM);
      return;
    case "house":
      B(3, 7.5, 10, 7.5, c ?? PE);
      G([[1.5, 8], [8, 2], [14.5, 8]], R);
      B(6.8, 10.5, 2.6, 4.5, BR);
      B(4.2, 9, 2, 2, SK);
      B(10, 9, 2, 2, SK);
      return;
    case "star": {
      const pts = [];
      for (let i = 0; i < 10; i++) {
        const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 3 : 7.5;
        pts.push([8 + Math.cos(a) * r, 8.5 + Math.sin(a) * r]);
      }
      G(pts, c ?? Y);
      return;
    }
    case "heart":
      E(5.3, 6, 3.3, 3.3, c ?? R);
      E(10.7, 6, 3.3, 3.3, c ?? R);
      G([[2.2, 7], [13.8, 7], [8, 14]], c ?? R);
      E(4.5, 5, 1, 1, PK);
      return;
    case "apple":
      E(8, 9.5, 5.5, 5, c ?? R);
      L([8, 5], [8.6, 2], BR, 1);
      E(10.5, 3, 2, 1, LM);
      E(6, 8, 1.2, 1.6, PK);
      return;
    case "planet":
      E(8, 8, 4.8, 4.8, c ?? O);
      E(8, 8, 7.8, 2.2, c ? LG : Y, false);
      E(6.5, 6.5, 1.3, 1.1, Y);
      return;
    case "moon":
      E(8, 8, 6, 6, c ?? Y);
      E(10.5, 6.5, 5, 5, NV);
      return;
    case "car":
      B(1, 8, 14, 4, c ?? R, 1);
      G([[3.6, 8.2], [5.4, 4.4], [10.6, 4.4], [12.8, 8.2]], c ?? R);
      G([[5.2, 7.8], [6.2, 5.2], [7.8, 5.2], [7.8, 7.8]], SK);
      G([[8.6, 7.8], [8.6, 5.2], [10.2, 5.2], [11.6, 7.8]], SK);
      B(14, 8.8, 1, 1.2, Y);
      B(1, 8.8, 0.8, 1.2, R);
      E(4.5, 12.3, 2.1, 2.1, K);
      E(11.5, 12.3, 2.1, 2.1, K);
      E(4.5, 12.3, 0.8, 0.8, LG);
      E(11.5, 12.3, 0.8, 0.8, LG);
      return;
    case "bus":
      B(0.8, 3.5, 14.4, 9, c ?? Y, 1);
      for (let i = 0; i < 4; i++) B(1.8 + i * 3, 4.8, 2.3, 2.8, SK, 0.3);
      B(13.3, 4.8, 1.3, 6.6, GR);
      B(0.8, 9, 14.4, 0.8, O);
      E(4, 12.8, 1.9, 1.9, K);
      E(12, 12.8, 1.9, 1.9, K);
      E(4, 12.8, 0.7, 0.7, LG);
      E(12, 12.8, 0.7, 0.7, LG);
      return;
    case "person":
      E(8, 3.8, 2.6, 2.6, PE);
      B(5, 7, 6, 5, c ?? SK, 1);
      B(5.5, 12, 2, 3.5, NV);
      B(8.5, 12, 2, 3.5, NV);
      B(3.6, 7.3, 1.5, 4, c ?? SK, 0.6);
      B(10.9, 7.3, 1.5, 4, c ?? SK, 0.6);
      return;
    case "book":
      B(2, 4, 12, 9, c ?? PL, 0.6);
      B(3, 5, 5, 7, WH);
      B(8, 5, 5, 7, WH);
      B(7.6, 4, 0.8, 9, c ?? PL);
      for (let i = 0; i < 3; i++) {
        B(3.8, 6.5 + i * 1.6, 3.4, 0.6, LG);
        B(8.8, 6.5 + i * 1.6, 3.4, 0.6, LG);
      }
      return;
    case "bulb":
      E(8, 6.5, 4.6, 4.6, c ?? Y);
      B(6, 10.2, 4, 2.5, c ?? Y);
      B(6, 12.5, 4, 2.4, GR, 0.4);
      B(6.8, 14.9, 2.4, 0.9, GR);
      E(6.4, 5, 1.2, 1.4, WH);
      return;
    case "flask":
      B(6.5, 1.5, 3, 5.5, LG);
      G([[6.5, 7], [9.5, 7], [14, 14.5], [2, 14.5]], LG);
      G([[4.6, 10.5], [11.4, 10.5], [13.2, 13.8], [2.8, 13.8]], c ?? LM);
      E(7, 12, 0.8, 0.8, WH);
      return;
    case "mountain":
      G([[0.5, 15], [6, 4], [11.5, 15]], c ?? GR);
      G([[5, 15], [10.5, 7], [15.5, 15]], LV);
      G([[4.4, 7.2], [6, 4], [7.6, 7.2]], WH);
      return;
    case "fish":
      E(7, 8, 5.2, 3.6, c ?? O);
      G([[11.5, 8], [15, 4.5], [15, 11.5]], c ?? O);
      E(4.3, 7.2, 0.9, 0.9, K);
      L([8, 5.2], [8, 10.8], PK, 0.7);
      return;
    case "flower":
      B(7.4, 8, 1.2, 7.5, GN);
      E(5, 12, 2, 1, LM);
      for (let i = 0; i < 6; i++) {
        const a = i * Math.PI / 3;
        E(8 + Math.cos(a) * 3, 6 + Math.sin(a) * 3, 2, 2, c ?? PK);
      }
      E(8, 6, 1.8, 1.8, Y);
      return;
    case "battery":
      B(2, 5, 11, 7, GR, 0.8);
      B(13, 7, 1.6, 3, GR);
      B(3, 6, 6, 5, c ?? LM);
      B(9, 6, 3, 5, NV);
      return;
    default:
      E(8, 8, 6, 6, c ?? LV);
      return;
  }
}

// src/schema.ts
var PAL = ["#29ADFF", "#FFA300", "#00E436", "#FF77A8", "#FFEC27", "#83769C", "#FF004D", "#C2C3C7"];
var num = (v, d) => typeof v === "number" && Number.isFinite(v) ? v : d;
var str = (v, n = 48) => (typeof v === "string" ? v : typeof v === "number" ? String(v) : v && typeof v === "object" && "s" in v ? String(v.s ?? "") : "").slice(0, n);
var colorOf = (v, i) => {
  const c = v && typeof v === "object" ? v.c : null;
  return typeof c === "string" && /^#[0-9a-f]{3,8}$/i.test(c) ? c : PAL[i % PAL.length];
};
var list = (v, n) => Array.isArray(v) ? v.slice(0, n) : [];
function layoutSchema(c, id) {
  const A = { x: num(c.x, 8), y: num(c.y, 8), w: num(c.w, 304), h: num(c.h, 164) };
  A.x = Math.max(2, Math.min(A.x, 300));
  A.y = Math.max(2, Math.min(A.y, 170));
  A.w = Math.max(40, Math.min(A.w, 318 - A.x));
  A.h = Math.max(30, Math.min(A.h, 178 - A.y));
  const out = { cmds: [], parts: [], box: A };
  const add = (cmd, d) => out.cmds.push({ c: cmd, d });
  const part = (pid, s) => out.parts.push([pid, s]);
  const type = String(c.type ?? "");
  const items = list(c.items, 10);
  const D = 420;
  if (type === "cycle") {
    const n = Math.max(2, Math.min(8, items.length));
    if (items.length < 2) return null;
    let bw = Math.min(96, A.w / (n <= 4 ? 2.6 : 3.3)), bh = n > 6 ? 24 : 30, rx = 0, ry = 0;
    const cx = A.x + A.w / 2, cy = A.y + A.h / 2;
    const at = (i) => {
      const t = -Math.PI / 2 + i * Math.PI * 2 / n;
      return [cx + Math.cos(t) * rx, cy + Math.sin(t) * ry, t];
    };
    for (let k = 0; k < 30; k++) {
      rx = A.w / 2 - bw / 2 - 2;
      ry = A.h / 2 - bh / 2 - 2;
      const ok = Array.from({ length: n }, (_, i) => {
        const [x1, y1] = at(i), [x2, y2] = at((i + 1) % n);
        return Math.abs(x1 - x2) >= bw + 14 || Math.abs(y1 - y2) >= bh + 12;
      }).every(Boolean);
      if (ok) break;
      if (bh > 18) bh *= 0.92;
      else bw = Math.max(36, bw * 0.92);
    }
    const pos = at;
    for (let i = 0; i < n; i++) {
      const [x, y] = pos(i), s = str(items[i]);
      add({ op: "box", id: `${id}.${i + 1}`, x: x - bw / 2, y: y - bh / 2, w: bw, h: bh, s, c: colorOf(items[i], i) }, i * D);
      part(`${id}.${i + 1}`, s);
      const j = (i + 1) % n, [ax, ay] = pos(i), [bx, by] = pos(j);
      const edge = (px, py, qx2, qy2) => {
        const dx = qx2 - px, dy = qy2 - py, s2 = Math.min((bw / 2 + 3) / (Math.abs(dx) || 1e-6), (bh / 2 + 3) / (Math.abs(dy) || 1e-6));
        return [px + dx * s2, py + dy * s2];
      };
      const [sx, sy] = edge(ax, ay, bx, by), [ex, ey] = edge(bx, by, ax, ay);
      const mx = (sx + ex) / 2, my = (sy + ey) / 2, ox = mx - cx, oy = my - cy, ol = Math.hypot(ox, oy) || 1, bend = Math.hypot(ex - sx, ey - sy) * 0.22;
      const qx = mx + ox / ol * bend, qy = my + oy / ol * bend, pts = [];
      for (let k = 0; k <= 16; k++) {
        const t = k / 16;
        pts.push([(1 - t) ** 2 * sx + 2 * (1 - t) * t * qx + t * t * ex, (1 - t) ** 2 * sy + 2 * (1 - t) * t * qy + t * t * ey]);
      }
      if (Math.hypot(ex - sx, ey - sy) > 6) add({ op: "path", id: `${id}.a${i + 1}`, pts, arrow: true, c: "#C2C3C7", lw: 1.6 }, i * D + D * 0.6);
    }
    if (typeof c.center === "string" && c.center && rx - bw / 2 > 26 && ry - bh / 2 > 8) add({ op: "text", id: `${id}.c`, x: cx, y: cy - 7, s: c.center.slice(0, 24), size: 1, align: "center", c: "#FFF1E8", bold: true }, n * D);
    return out;
  }
  if (type === "flow") {
    const n = items.length;
    if (n < 2) return null;
    const vert = c.dir === "v" && n <= 5;
    const per = vert ? 1 : n <= 5 ? n : Math.ceil(n / 2), rows = vert ? n : Math.ceil(n / per);
    const gx = 18, gy = vert ? 14 : 22;
    const bw = vert ? Math.min(150, A.w * 0.7) : Math.min(110, (A.w - (per - 1) * gx) / per);
    const bh = Math.min(vert ? 30 : 40, (A.h - (rows - 1) * gy) / rows);
    const tw = per * bw + (per - 1) * gx, th = rows * bh + (rows - 1) * gy;
    const x0 = A.x + (A.w - tw) / 2, y0 = A.y + (A.h - th) / 2;
    const at = (i) => {
      const r = Math.floor(i / per), k = i % per, col2 = r % 2 ? per - 1 - k : k;
      return [x0 + col2 * (bw + gx), y0 + r * (bh + gy)];
    };
    for (let i = 0; i < n; i++) {
      const [x, y] = at(i), s = str(items[i]);
      add({ op: "box", id: `${id}.${i + 1}`, x, y, w: bw, h: bh, s, c: colorOf(items[i], i) }, i * D);
      part(`${id}.${i + 1}`, s);
      if (i + 1 < n) {
        const [nx, ny] = at(i + 1);
        const a = ny > y ? { x1: x + bw / 2, y1: y + bh + 2, x2: nx + bw / 2, y2: ny - 3 } : nx > x ? { x1: x + bw + 2, y1: y + bh / 2, x2: nx - 3, y2: ny + bh / 2 } : { x1: x - 2, y1: y + bh / 2, x2: nx + bw + 3, y2: ny + bh / 2 };
        add({ op: "arrow", id: `${id}.a${i + 1}`, ...a, c: "#C2C3C7", lw: 1.6 }, i * D + D * 0.6);
      }
    }
    return out;
  }
  if (type === "timeline") {
    const n = Math.min(8, items.length);
    if (n < 1) return null;
    const ly = A.y + A.h / 2, left = A.x + 16, right = A.x + A.w - 16;
    add({ op: "arrow", id: `${id}.line`, x1: A.x + 2, y1: ly, x2: A.x + A.w - 2, y2: ly, c: "#C2C3C7", lw: 1.6 }, 0);
    const step = n > 1 ? (right - left) / (n - 1) : 0;
    const bw = Math.min(92, n > 2 ? step * 2 - 8 : A.w * 0.42, A.w / Math.ceil(n / 2) - 6), bh = Math.max(12, Math.min(40, A.h / 2 - 13));
    for (let i = 0; i < n; i++) {
      const it = items[i], x = n > 1 ? left + i * step : A.x + A.w / 2;
      const raw = typeof it === "string" ? it : "";
      const t = it && typeof it === "object" && "t" in it ? str(it.t, 14) : /^([^:]{1,14}):\s*/.exec(raw)?.[1] ?? "";
      const s = it && typeof it === "object" ? str(it) : raw.replace(/^[^:]{1,14}:\s*/, "").slice(0, 48);
      const up = i % 2 === 0, by = up ? ly - 10 - bh : ly + 10;
      const bx = Math.max(A.x, Math.min(A.x + A.w - bw, x - bw / 2));
      const d = 300 + i * D;
      add({ op: "circle", id: `${id}.${i + 1}.dot`, x, y: ly, r: 2.6, c: colorOf(it, i), fill: true }, d);
      add({ op: "line", id: `${id}.${i + 1}.tick`, x1: x, y1: up ? ly - 3 : ly + 3, x2: x, y2: up ? by + bh : by, c: colorOf(it, i), lw: 1 }, d + 80);
      if (t) add({ op: "text", id: `${id}.${i + 1}.t`, x, y: up ? ly + 3 : ly - 12, s: t, size: 0, align: "center", c: "#FFEC27", bold: true, place: false }, d + 120);
      if (s) add({ op: "box", id: `${id}.${i + 1}`, x: bx, y: by, w: bw, h: bh, s, c: colorOf(it, i) }, d + 160);
      part(`${id}.${i + 1}`, [t, s].filter(Boolean).join(" \u2014 "));
    }
    return out;
  }
  if (type === "compare") {
    const cols = items.slice(0, 3);
    if (cols.length < 2) return null;
    const k = cols.length, gx = 10, cw = (A.w - (k - 1) * gx) / k, hh = 24;
    cols.forEach((col2, i) => {
      const o = col2 && typeof col2 === "object" ? col2 : {};
      const x = A.x + i * (cw + gx), color = colorOf(col2, i), title = str(o.title ?? col2, 32);
      add({ op: "box", id: `${id}.${i + 1}`, x, y: A.y, w: cw, h: hh, s: title, c: color, bg: color, alpha: 0.35, bold: true }, i * D);
      part(`${id}.${i + 1}`, title);
      const pts = list(o.points, 6), area = A.h - hh - 6, ph = Math.min(30, area / Math.max(1, pts.length));
      pts.forEach((p, j) => {
        const s = str(p, 60);
        add({ op: "box", id: `${id}.${i + 1}.${j + 1}`, x, y: A.y + hh + 6 + j * ph, w: cw, h: ph - 3, s, c: color, frame: false, align: "left", fs: 9 }, i * D + 250 + j * 220);
        part(`${id}.${i + 1}.${j + 1}`, s);
      });
    });
    return out;
  }
  if (type === "table") {
    const head = list(c.head, 6).map((h) => str(h, 24));
    const rows = list(c.rows, 8).map((r) => list(r, 6).map((x) => str(x, 40)));
    const nc = Math.max(head.length, ...rows.map((r) => r.length));
    if (!nc || !rows.length && !head.length) return null;
    const nat = Array.from({ length: nc }, (_, j) => Math.max(30, textW(head[j] ?? "", 10, true) + 14, ...rows.map((r) => Math.min(120, textW(r[j] ?? "", 10) + 14))));
    const sum = nat.reduce((a, b) => a + b, 0), k = Math.min(1.6, A.w / sum);
    const cw = nat.map((w) => w * k), tw = cw.reduce((a, b) => a + b, 0);
    const nr = rows.length + (head.length ? 1 : 0), rh = Math.min(26, A.h / nr);
    const x0 = A.x + (A.w - tw) / 2, y0 = A.y + (A.h - nr * rh) / 2;
    const xs = cw.reduce((a, w) => [...a, a.at(-1) + w], [x0]);
    let r0 = 0;
    if (head.length) {
      head.forEach((s, j) => add({ op: "box", id: `${id}.h.${j + 1}`, x: xs[j], y: y0, w: cw[j], h: rh, s, c: "#29ADFF", bg: "#29ADFF", alpha: 0.3, r: 0, bold: true }, j * 120));
      part(`${id}.h`, head.join(" | "));
      r0 = 1;
    }
    rows.forEach((r, i) => {
      for (let j = 0; j < nc; j++) add({ op: "box", id: `${id}.r${i + 1}.${j + 1}`, x: xs[j], y: y0 + (i + r0) * rh, w: cw[j], h: rh, s: r[j] ?? "", c: "#C2C3C7", alpha: 0.06, r: 0 }, (i + 1) * D + j * 100);
      part(`${id}.r${i + 1}`, r.join(" | "));
    });
    return out;
  }
  if (type === "tree") {
    let count = 0;
    const norm = (v, lvl, ci) => {
      if (count >= 20 || lvl > 3) return null;
      count++;
      const o = v && typeof v === "object" ? v : { s: v };
      const node = { s: str(o.s ?? v), kids: [], x: 0, lvl, n: count, c: colorOf(v, ci) };
      for (const [k, kid] of list(o.kids ?? o.children, 6).entries()) {
        const m = norm(kid, lvl + 1, lvl === 0 ? k : ci);
        if (m) node.kids.push(m);
      }
      return node;
    };
    const root = norm(c.root ?? (items.length ? { s: c.s ?? "", kids: items } : null), 0, 0);
    if (!root) return null;
    let leaves = 0, depth = 0;
    const walk = (nd) => {
      depth = Math.max(depth, nd.lvl + 1);
      if (!nd.kids.length) nd.x = leaves++;
      else {
        nd.kids.forEach(walk);
        nd.x = (nd.kids[0].x + nd.kids.at(-1).x) / 2;
      }
    };
    walk(root);
    const slot = A.w / leaves, lh = A.h / depth, bh = Math.min(30, lh - 14);
    const bwOf = (nd) => {
      const same = [];
      const gather = (m) => {
        if (m.lvl === nd.lvl) same.push(m);
        m.kids.forEach(gather);
      };
      gather(root);
      const xs = same.map((m) => m.x).sort((a, b) => a - b), i = xs.indexOf(nd.x);
      const gap = Math.min(i > 0 ? nd.x - xs[i - 1] : Infinity, i < xs.length - 1 ? xs[i + 1] - nd.x : Infinity);
      const room = Number.isFinite(gap) ? gap * slot : A.w;
      return Math.min(110, room - 10, A.w - 4);
    };
    const X = (nd) => A.x + slot * (nd.x + 0.5), Yc = (nd) => A.y + lh * (nd.lvl + 0.5);
    const order = [];
    const q = [root];
    while (q.length) {
      const nd = q.shift();
      order.push(nd);
      q.push(...nd.kids);
    }
    order.forEach((nd, i) => {
      const bw = bwOf(nd);
      add({ op: "box", id: `${id}.${i + 1}`, x: Math.max(A.x, Math.min(A.x + A.w - bw, X(nd) - bw / 2)), y: Yc(nd) - bh / 2, w: bw, h: bh, s: nd.s, c: nd.c, ...nd.lvl === 0 ? { bg: nd.c, alpha: 0.3, bold: true } : {} }, i * 330);
      part(`${id}.${i + 1}`, nd.s);
      nd.kids.forEach((kid) => {
        const x1 = X(nd), y1 = Yc(nd) + bh / 2, x2 = X(kid), y2 = Yc(kid) - bh / 2, my = (y1 + y2) / 2;
        add({ op: "path", id: `${id}.l${kid.n}`, pts: [[x1, y1], [x1, my], [x2, my], [x2, y2]], c: "#C2C3C7", lw: 1.2 }, i * 330 + 200);
      });
    });
    return out;
  }
  if (type === "venn") {
    const sets = list(c.sets, 3).map((s) => str(s, 24));
    if (sets.length < 2) return null;
    const cx = A.x + A.w / 2, cy = A.y + A.h / 2 + 7;
    const r = Math.min(A.h / 2 - 14, A.w / (sets.length === 2 ? 3.4 : 3.2));
    const joined = (v) => list(v, 5).map((x) => str(x, 24)).join("\n");
    if (sets.length === 2) {
      const d = r * 0.62;
      [[cx - d, sets[0], 0], [cx + d, sets[1], 1]].forEach(([x, s, i]) => {
        const n = i, color = PAL[n];
        add({ op: "circle", id: `${id}.${n + 1}`, x, y: cy, r, c: color, fill: true, alpha: 0.22, stroke: color }, n * D);
        add({ op: "text", id: `${id}.${n + 1}.t`, x: x + (n ? r * 0.35 : -r * 0.35), y: cy - r - 13, s, size: 1, align: "center", c: color, bold: true, place: false }, n * D + 200);
        part(`${id}.${n + 1}`, s);
      });
      const zones = [["a", c.a, cx - d - r * 0.42, r * 0.85], ["ab", c.ab, cx, (r - d) * 1.5], ["b", c.b, cx + d + r * 0.42, r * 0.85]];
      zones.forEach(([k, v, x, w], i) => {
        const s = joined(v);
        if (!s) return;
        add({ op: "box", id: `${id}.${k}`, x: x - w / 2, y: cy - r * 0.7, w, h: r * 1.4, s, c: "#FFF1E8", frame: false }, 2 * D + i * 300);
        part(`${id}.${k}`, s.replace(/\n/g, ", "));
      });
    } else {
      const d = r * 0.6;
      const ctr = [[cx, cy - d * 0.75], [cx - d * 0.85, cy + d * 0.45], [cx + d * 0.85, cy + d * 0.45]];
      ctr.forEach(([x, y], n) => {
        const color = PAL[n];
        add({ op: "circle", id: `${id}.${n + 1}`, x, y, r: r * 0.82, c: color, fill: true, alpha: 0.2, stroke: color }, n * D);
        const tx = n === 0 ? x : n === 1 ? x - r * 0.7 : x + r * 0.7, ty = n === 0 ? y - r * 0.82 - 13 : y + r * 0.82 - 4;
        add({ op: "text", id: `${id}.${n + 1}.t`, x: tx, y: ty, s: sets[n], size: 1, align: "center", c: color, bold: true, place: false }, n * D + 200);
        part(`${id}.${n + 1}`, sets[n]);
      });
      const s = joined(c.abc ?? c.ab);
      if (s) {
        add({ op: "box", id: `${id}.abc`, x: cx - r * 0.3, y: cy - r * 0.12, w: r * 0.6, h: r * 0.4, s, c: "#FFF1E8", frame: false }, 3 * D);
        part(`${id}.abc`, s);
      }
    }
    return out;
  }
  return null;
}

// src/board.ts
var W = 320;
var H = 180;
var K2 = 6;
var BG = "#1D2B53";
var num2 = (v, d = 0) => typeof v === "number" && Number.isFinite(v) ? v : typeof v === "string" && v.trim() && Number.isFinite(+v) ? +v : d;
var col = (v, d = "#FFF1E8") => typeof v === "string" && /^#[0-9a-f]{3,8}$/i.test(v) ? v : d;
var str2 = (v, n) => String(v ?? "").slice(0, n);
var overlaps = (a, b) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
var union = (bs) => {
  if (!bs.length) return null;
  const x0 = Math.min(...bs.map((b) => b.x)), y0 = Math.min(...bs.map((b) => b.y));
  return { x: x0, y: y0, w: Math.max(...bs.map((b) => b.x + b.w)) - x0, h: Math.max(...bs.map((b) => b.y + b.h)) - y0 };
};
var TEXT_SIZE = { 0: 8, 1: 12, 2: 22, 3: 34 };
var TEX_SIZE = { 1: 14, 2: 20, 3: 30 };
var isTex = (s) => /\\[a-zA-Z]|\^\{|_\{/.test(s);
var Board = class {
  // auto-names for unnamed objects ("o7") so the AI can point at them
  // onTitle: the diagram title is shown ABOVE the board (never gets in the way of the drawing)
  constructor(canvas, onTitle = () => {
  }) {
    this.canvas = canvas;
    this.onTitle = onTitle;
    canvas.width = W * K2;
    canvas.height = H * K2;
    this.out = canvas.getContext("2d");
    this.clear(BG);
    this.loop();
  }
  out;
  bg = BG;
  items = [];
  labels = [];
  // areas taken by labels, so new ones don't overlap
  highlights = [];
  pointer = { x: W / 2, y: H / 2, tx: W / 2, ty: H / 2, until: 0, on: 0, c: "#FFEC27" };
  sys = /* @__PURE__ */ new Map();
  // coordinate systems (axes, number lines), by name
  lastSys = "";
  groups = /* @__PURE__ */ new Map();
  steps = /* @__PURE__ */ new Map();
  pics = [];
  title = "";
  instant = false;
  raf = 0;
  idle = 0;
  seq = 0;
  after = [];
  destroy() {
    cancelAnimationFrame(this.raf);
  }
  /** Draw instantly, without the appear animation (e.g. when joining a lesson whose board is already drawn). */
  drawAll(cmds) {
    this.instant = true;
    try {
      for (const c of cmds) this.draw(c);
    } finally {
      this.instant = false;
    }
  }
  /* ------------------------------ frame assembly ------------------------------ */
  loop = () => {
    const now = performance.now();
    const busy = this.idle < 2 || this.pointer.on > 0.01 || this.highlights.length || this.items.some((i) => i.anim || now - i.t0 < i.dur + 50);
    if (busy) {
      this.compose(now);
      this.idle++;
    }
    this.raf = requestAnimationFrame(this.loop);
  };
  wake() {
    this.idle = 0;
  }
  compose(now) {
    const g = this.out;
    g.setTransform(K2, 0, 0, K2, 0, 0);
    g.globalAlpha = 1;
    g.fillStyle = this.bg;
    g.fillRect(0, 0, W, H);
    const v = g.createRadialGradient(W / 2, H / 2, 20, W / 2, H / 2, W * 0.62);
    v.addColorStop(0, "rgba(255,255,255,0.045)");
    v.addColorStop(1, "rgba(0,0,0,0.18)");
    g.fillStyle = v;
    g.fillRect(0, 0, W, H);
    let head = null, headC = "";
    for (const it of this.items) {
      const p = (now - it.t0) / it.dur;
      if (p <= 0) continue;
      g.save();
      if (it.clip) {
        g.beginPath();
        g.rect(it.clip.x, it.clip.y, it.clip.w, it.clip.h);
        g.clip();
      }
      const cx = it.box.x + it.box.w / 2, cy = it.box.y + it.box.h / 2;
      if (it.anim) this.transform(g, it.anim, (it.anim.loop === "once" ? now - it.at : now) / 1e3, cx, cy);
      const h = paint(g, it.prims, Math.min(1, p));
      g.restore();
      if (p < 1) {
        head = h ?? head ?? [cx, cy];
        const first = it.prims[0];
        headC = first && "c" in first ? first.c : headC;
      }
    }
    this.highlights = this.highlights.filter((h) => h.until > now);
    for (const h of this.highlights) {
      const k2 = 0.55 + 0.45 * Math.sin((now - h.t0) / 180), b = h.box, pad = 3 + k2;
      g.strokeStyle = alpha("#FFEC27", 0.5 + 0.5 * k2);
      g.lineWidth = 1.4;
      g.setLineDash([4, 3]);
      g.lineDashOffset = -now / 60;
      g.beginPath();
      g.roundRect(b.x - pad, b.y - pad, b.w + pad * 2, b.h + pad * 2, 4);
      g.stroke();
      g.setLineDash([]);
      g.lineDashOffset = 0;
    }
    const pt = this.pointer;
    if (head) {
      pt.tx = head[0];
      pt.ty = head[1];
      pt.until = Math.max(pt.until, now + 350);
      if (/^#/.test(headC)) pt.c = headC;
    }
    const show = pt.until > now;
    pt.on += ((show ? 1 : 0) - pt.on) * 0.18;
    const k = head ? 0.45 : 0.16;
    pt.x += (pt.tx - pt.x) * k;
    pt.y += (pt.ty - pt.y) * k;
    if (pt.on > 0.01) this.marker(g, pt.x, pt.y + (head ? 0 : Math.sin(now / 200) * 0.8), pt.c, pt.on);
  }
  // marker: tip at (x, y), body extending up and to the right
  marker(g, x, y, c, a) {
    g.save();
    g.globalAlpha = a;
    g.translate(x, y);
    g.rotate(-0.85);
    g.fillStyle = "rgba(0,0,0,0.25)";
    g.beginPath();
    g.roundRect(7, -1.2, 22, 5, 1.5);
    g.fill();
    g.fillStyle = c;
    g.beginPath();
    g.moveTo(0, 0);
    g.lineTo(4.5, -1.4);
    g.lineTo(4.5, 1.4);
    g.closePath();
    g.fill();
    g.fillStyle = "#3A3F55";
    g.fillRect(4.5, -1.9, 3, 3.8);
    g.fillStyle = "#F2F2F7";
    g.beginPath();
    g.roundRect(7.5, -2.4, 18, 4.8, 1);
    g.fill();
    g.fillStyle = "#C9CAD6";
    g.fillRect(7.5, 0.9, 18, 1.5);
    g.fillStyle = c;
    g.beginPath();
    g.roundRect(25.5, -2.6, 4, 5.2, 1.2);
    g.fill();
    g.restore();
  }
  transform(g, a, t, cx, cy) {
    const ph = t % a.period / a.period;
    const wave = 0.5 - 0.5 * Math.cos(ph * Math.PI * 2);
    const prog = a.loop === "once" ? Math.min(1, t / a.period) : a.loop === "pingpong" ? wave : ph;
    switch (a.type) {
      case "move":
      case "fall":
      case "rise":
        g.translate(a.dx * prog, a.dy * prog);
        if (a.type !== "move" && a.loop !== "once") g.globalAlpha = Math.min(1, (1 - ph) * 4, ph * 10);
        return;
      case "orbit": {
        const ang = a.a0 + ph * Math.PI * 2;
        g.translate(a.cx + Math.cos(ang) * a.r - cx, a.cy + Math.sin(ang) * a.r - cy);
        return;
      }
      case "spin":
        g.translate(cx, cy);
        g.rotate(ph * Math.PI * 2);
        g.translate(-cx, -cy);
        return;
      case "swing":
        g.translate(a.cx, a.cy);
        g.rotate(a.angle * Math.PI / 180 * Math.sin(ph * Math.PI * 2));
        g.translate(-a.cx, -a.cy);
        return;
      case "pulse": {
        const s = 1 + (a.scale - 1) * wave;
        g.translate(cx, cy);
        g.scale(s, s);
        g.translate(-cx, -cy);
        return;
      }
      case "blink":
        g.globalAlpha = ph < 0.5 ? 1 : 0.15;
        return;
      case "shake":
        g.translate(Math.sin(t * 40) * 1.5, 0);
        return;
    }
  }
  parseAnim(v, box) {
    if (!v || typeof v !== "object") return null;
    const a = v;
    const type = String(a.type ?? "");
    if (!["move", "fall", "rise", "orbit", "spin", "swing", "pulse", "blink", "shake"].includes(type)) return null;
    const icx = box.x + box.w / 2, icy = box.y + box.h / 2, cx = num2(a.cx, icx), cy = num2(a.cy, icy);
    return {
      type,
      period: Math.max(0.3, Math.min(20, num2(a.period, 2))),
      dx: num2(a.dx, 0),
      dy: num2(a.dy, type === "fall" ? 40 : type === "rise" ? -40 : 0),
      cx,
      cy,
      r: num2(a.r, Math.hypot(icx - cx, icy - cy) || 30),
      angle: num2(a.angle, 30),
      scale: Math.max(1, Math.min(2, num2(a.scale, 1.2))),
      loop: a.loop === "once" || a.loop === "pingpong" ? String(a.loop) : type === "move" ? "pingpong" : "repeat",
      a0: Math.atan2(icy - cy, icx - cx)
    };
  }
  /* ------------------------------- commands ------------------------------- */
  clear(bg = BG) {
    this.bg = bg;
    this.items = [];
    this.labels = [];
    this.highlights = [];
    this.pics = [];
    this.sys.clear();
    this.groups.clear();
    this.steps.clear();
    this.lastSys = "";
    this.title = "";
    this.onTitle("");
    this.seq = 0;
    this.wake();
  }
  // by name: the object itself or all of its parts ("s" → "s.1", "s.a1"…)
  find(id) {
    return typeof id === "string" && id ? this.items.filter((i) => i.id === id || i.auto === id || !!i.id?.startsWith(`${id}.`)) : [];
  }
  /** A teacher command. */
  draw(c) {
    this.exec(c, 0);
    this.wake();
  }
  exec(c, delay) {
    const now = performance.now();
    switch (c.op) {
      case "clear":
        return this.clear(col(c.bg, BG));
      case "erase": {
        const gone = this.find(c.id);
        this.items = this.items.filter((i) => !gone.includes(i));
        const id = String(c.id ?? "");
        this.sys.delete(id);
        this.groups.delete(id);
        this.steps.delete(id);
        if (this.pics.some((p) => gone.includes(p.it))) {
          this.pics = this.pics.filter((p) => !gone.includes(p.it));
          this.layoutPics();
        }
        return;
      }
      case "anim": {
        for (const i of this.find(c.id)) {
          i.anim = c.type === "stop" ? null : this.parseAnim(c, i.box);
          i.at = now;
        }
        return;
      }
      case "title":
        this.title = str2(c.s, 60);
        return this.onTitle(this.title);
      case "point": {
        const box = union(this.find(c.id).map((i) => i.box)) ?? (() => {
          const m2 = this.mapPt(c, num2(c.x, W / 2), num2(c.y, H / 2));
          return { x: m2[0] - 6, y: m2[1] - 6, w: 12, h: 12 };
        })();
        this.highlights.push({ box, until: now + delay + Math.max(800, Math.min(8e3, num2(c.ms, 2500))), t0: now });
        Object.assign(this.pointer, { tx: Math.min(W - 10, box.x + box.w * 0.75), ty: box.y + box.h * 0.5, until: now + delay + 2600, c: "#FFEC27" });
        return;
      }
      case "pendulum":
      case "atom":
      case "wave":
      case "road":
      case "crosswalk":
      case "trafficlight":
        return this.composite(c, delay);
      case "pic":
        return this.addPic(c, now);
      case "step":
        return this.step(c, delay);
      case "schema":
        return this.schema(c, delay);
      case "mark":
        return this.mark(c, delay);
    }
    const m = this.mapCmd(c);
    const pen = new Pen();
    const info = this.paint(m, pen);
    if (!info) return;
    this.add(m, pen, delay, info);
    for (const f of this.after.splice(0)) f(delay);
  }
  // new object from pen parts; the same name replaces the object (appears quickly: it is a state change)
  add(c, pen, delay, info) {
    if (!pen.prims.length) return null;
    const box = bounds(pen.prims);
    if (!box) return null;
    const total = timeline(pen.prims);
    const id = info.id !== void 0 ? info.id : typeof c.id === "string" && c.id ? c.id : null;
    const replaced = !!id && this.items.some((i) => i.id === id);
    if (id) this.items = this.items.filter((i) => i.id !== id);
    const now = performance.now();
    const it = {
      id,
      op: c.op,
      prims: pen.prims,
      box,
      anim: this.parseAnim(c.anim, box),
      clip: info.clip ?? (c.clip && typeof c.clip === "object" ? c.clip : void 0),
      t0: this.instant ? -1e9 : now + delay,
      at: now + delay,
      dur: replaced ? 180 : Math.max(info.min ?? 220, Math.min(1800, total * 3.2)),
      kind: info.kind,
      text: info.text ?? "",
      auto: id ? void 0 : `o${++this.seq}`
    };
    this.items.push(it);
    return it;
  }
  /* ----------------------------- coordinates ----------------------------- */
  // command "in axis coordinates" ("axes":"ax" / "on":"nl"): numbers are mathematical, the board maps them to board points
  sysOf(c) {
    const id = typeof c.axes === "string" ? c.axes : typeof c.on === "string" ? c.on : "";
    return id ? this.sys.get(id) ?? null : null;
  }
  mapPt(c, x, y) {
    const s = this.sysOf(c);
    return s ? [s.X(x), s.Y(y)] : [x, y];
  }
  mapCmd(c) {
    const s = this.sysOf(c);
    if (!s || ["plot", "interval", "axes", "numberline"].includes(c.op)) return c;
    const m = { ...c };
    const P = (v) => Array.isArray(v) ? [s.X(num2(v[0])), s.Y(num2(v[1]))] : v;
    if (typeof c.x === "number") m.x = s.X(c.x);
    if (typeof c.y === "number" || s.kind === "line") m.y = s.Y(num2(c.y));
    for (const [a, b] of [["x1", "y1"], ["x2", "y2"]]) if (typeof c[a] === "number") {
      m[a] = s.X(c[a]);
      m[b] = s.Y(num2(c[b]));
    }
    if (Array.isArray(c.pts)) m.pts = c.pts.map(P);
    if (c.a) m.a = P(c.a);
    if (c.b) m.b = P(c.b);
    if (c.to && typeof c.to === "object") {
      const t = c.to;
      m.to = { x: s.X(num2(t.x)), y: s.Y(num2(t.y)) };
    }
    return m;
  }
  /* ------------------------------- labels ------------------------------- */
  // label placement: not off the board edge and not on another label (search the nearest free spot: below, above, right, left)
  place(x, y, w, h, pad, place = true) {
    const clamp = (cx, cy) => [Math.max(2 + pad, Math.min(cx, W - w - 2 - pad)), Math.max(2 + pad, Math.min(cy, H - h - 2 - pad))];
    [x, y] = clamp(x, y);
    const at = (cx, cy) => ({ x: cx - pad, y: cy - pad, w: w + pad * 2, h: h + pad * 2 });
    const solid = this.items.filter((i) => i.box.w * i.box.h < W * H * 0.35 && i.kind !== "grid").map((i) => i.box);
    const free = (b) => !this.labels.some((l) => overlaps(l, b)) && !solid.some((o) => overlaps(o, b));
    if (place && this.labels.some((b) => overlaps(b, at(x, y)))) {
      const sy = h + pad * 2 + 2, sx = Math.min(60, w + pad * 2 + 4);
      search: for (let k = 1; k <= 5; k++) {
        for (const [dx, dy] of [[0, sy], [0, -sy], [sx, 0], [-sx, 0], [sx, sy], [-sx, -sy]]) {
          const [cx, cy] = clamp(x + dx * k, y + dy * k);
          if (free(at(cx, cy))) {
            x = cx;
            y = cy;
            break search;
          }
        }
      }
    }
    if (place) this.labels.push(at(x, y));
    return [x, y];
  }
  // text in a box: pick the size and line breaks so it fits
  fit(s, w, h, max, bold) {
    for (let size = max; size >= 5.5; size -= 0.5) {
      const lines = [];
      for (const para of s.split("\n")) {
        let cur = "";
        for (const word of para.split(/\s+/).filter(Boolean)) {
          const t = cur ? `${cur} ${word}` : word;
          if (textW(t, size, bold) <= w || !cur) cur = t;
          else {
            lines.push(cur);
            cur = word;
          }
        }
        lines.push(cur);
      }
      if (lines.length * size * 1.18 <= h && lines.every((l) => textW(l, size, bold) <= w)) return { size, lines };
      if (size <= 6) {
        const out = [];
        for (const l of lines) {
          let rest = l;
          while (textW(rest, size, bold) > w && rest.length > 4) {
            let k = rest.length - 1;
            while (k > 2 && textW(`${rest.slice(0, k)}-`, size, bold) > w) k--;
            const V = /[аеёиоуыэюяaeiouўАЕЁИОУЫЭЮЯ]/;
            for (let j = k; j > Math.max(2, k - 4); j--) if (V.test(rest[j - 1]) && !V.test(rest[j])) {
              k = j;
              break;
            }
            out.push(`${rest.slice(0, k)}-`);
            rest = rest.slice(k);
          }
          out.push(rest);
        }
        return { size, lines: out };
      }
    }
    return { size: 6, lines: [s] };
  }
  /* ------------------------------ drawing ------------------------------ */
  paint(c, pen) {
    const w = lwOf(c.lw), dash = c.dash === true, cc = col(c.c);
    const fillC = (d) => typeof c.alpha === "number" ? alpha(col(c.c, d), Math.max(0.05, Math.min(1, c.alpha))) : col(c.c, d);
    switch (c.op) {
      case "rect": {
        const x = num2(c.x), y = num2(c.y), ww = Math.max(1, num2(c.w, 1)), hh = Math.max(1, num2(c.h, 1)), pts = rectPts(x, y, ww, hh, num2(c.r, 0));
        if (c.fill === false) pen.line(pts, cc, w, dash);
        else pen.shape(pts, { fill: fillC("#FFF1E8"), stroke: typeof c.stroke === "string" ? col(c.stroke) : null, w: 1 });
        return { kind: "rect" };
      }
      case "circle":
      case "ellipse": {
        const x = num2(c.x), y = num2(c.y), rx = Math.max(0.5, num2(c.op === "circle" ? c.r : c.rx, 1)), ry = Math.max(0.5, num2(c.op === "circle" ? c.r : c.ry, 1));
        const pts = ellipsePts(x, y, rx, ry, -Math.PI / 2, Math.PI * 1.5);
        if (c.fill === true) pen.shape(pts, { fill: fillC("#FFF1E8"), stroke: typeof c.stroke === "string" ? col(c.stroke) : null, w: 1 });
        else pen.line(pts, cc, w, dash);
        return { kind: c.op };
      }
      case "pie": {
        const x = num2(c.x), y = num2(c.y), r = Math.max(1, num2(c.r, 1)), from = num2(c.from), to = num2(c.to, 360);
        const a0 = (from - 90) * Math.PI / 180, a1 = (to - 90 + (to < from ? 360 : 0)) * Math.PI / 180;
        const arc = ellipsePts(x, y, r, r, a0, a1);
        pen.shape(to - from >= 360 ? arc : [x, y, ...arc, x, y], { fill: fillC("#FF004D"), stroke: typeof c.stroke === "string" ? col(c.stroke) : null, w: 1 });
        return { kind: "pie" };
      }
      case "poly": {
        const pts = this.pts(c.pts, 40);
        if (pts.length < 4) return null;
        const closed = [...pts, pts[0], pts[1]];
        if (c.fill === false) pen.line(closed, cc, w, dash);
        else pen.shape(closed, { fill: fillC("#008751"), stroke: typeof c.stroke === "string" ? col(c.stroke) : null, w: 1 });
        const names = Array.isArray(c.names) ? c.names.map((n) => str2(n, 3)) : [];
        if (names.length) {
          const n = pts.length / 2, mx = pts.filter((_, i) => i % 2 === 0).reduce((a, b) => a + b, 0) / n, my = pts.filter((_, i) => i % 2).reduce((a, b) => a + b, 0) / n;
          names.forEach((nm, i) => {
            if (!nm || i >= n) return;
            const px = pts[i * 2], py = pts[i * 2 + 1], d = Math.hypot(px - mx, py - my) || 1;
            const tx = px + (px - mx) / d * 8, ty = py + (py - my) / d * 8;
            pen.tex(tex(nm, 13), tx - tex(nm, 13).w / 2, ty + 4.5, col(c.tc, "#FFF1E8"));
          });
        }
        return { kind: "poly", text: names.join("") };
      }
      case "path": {
        const pts = this.pts(c.pts, 800);
        if (pts.length < 4) return null;
        pen.line(pts, cc, w, dash);
        if (c.arrow === true) {
          const n = pts.length;
          pen.arrowHead(pts[n - 4], pts[n - 3], pts[n - 2], pts[n - 1], cc, w);
        }
        return { kind: "path" };
      }
      case "line":
      case "arrow": {
        const x1 = num2(c.x1), y1 = num2(c.y1), x2 = num2(c.x2), y2 = num2(c.y2);
        const L = Math.hypot(x2 - x1, y2 - y1) || 1, ux = (x2 - x1) / L, uy = (y2 - y1) / L;
        pen.line([x1, y1, x2 - (c.op === "arrow" ? ux * w : 0), y2 - (c.op === "arrow" ? uy * w : 0)], cc, w, dash);
        if (c.op === "arrow") pen.arrowHead(x1, y1, x2, y2, cc, w);
        if (c.both === true) pen.arrowHead(x2, y2, x1, y1, cc, w);
        const ticks = Math.max(0, Math.min(3, Math.round(num2(c.ticks, 0)))), mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
        for (let i = 0; i < ticks; i++) {
          const o = (i - (ticks - 1) / 2) * 2.5;
          pen.line([mx + ux * o - uy * 3.5, my + uy * o + ux * 3.5, mx + ux * o + uy * 3.5, my + uy * o - ux * 3.5], cc, 1);
        }
        const s = str2(c.s, 24);
        if (s) {
          const nx = uy > 0 || uy === 0 && ux < 0 ? uy : -uy, ny = uy > 0 || uy === 0 && ux < 0 ? -ux : ux;
          const b = isTex(s) ? tex(s, 13) : null, tw = b ? b.w : textW(s, 11);
          const tx = mx + nx * 9 - tw / 2, ty = my + ny * 9;
          if (b) pen.tex(b, tx, ty + 4.5, col(c.tc, cc));
          else pen.text(s, tx, ty - 6.5, 11, col(c.tc, cc));
        }
        return { kind: c.op, text: s };
      }
      case "text":
      case "label": {
        const s = str2(c.s, 60);
        const label = c.op === "label" || typeof c.bg === "string";
        if (isTex(s)) {
          const b = tex(s, TEX_SIZE[num2(c.size, 1)] ?? 14), pad2 = label ? 3 : 0;
          let x2 = num2(c.x), y2 = num2(c.y);
          if (c.align === "center") x2 -= b.w / 2;
          [x2, y2] = this.place(x2, y2, b.w, b.h + b.d, pad2, c.place !== false);
          if (label) pen.fill(rectPts(x2 - pad2, y2 - pad2, b.w + pad2 * 2, b.h + b.d + pad2 * 2, 3), alpha(col(c.bg, "#000000"), 0.8));
          pen.tex(b, x2, y2 + b.h, cc);
          this.pointerLine(c, pen, { x: x2, y: y2, w: b.w, h: b.h + b.d });
          return { kind: "formula", text: s };
        }
        const size = TEXT_SIZE[num2(c.size, 1)] ?? 12, bold = c.bold === true || size >= 22, tw = textW(s, size, bold), th = size * 1.2, pad = label ? 3 : 0;
        let x = num2(c.x), y = num2(c.y);
        if (c.align === "center") x -= tw / 2;
        [x, y] = this.place(x, y, tw, th, pad, c.place !== false);
        if (label) pen.fill(rectPts(x - pad, y - pad, tw + pad * 2, th + pad * 2, 3), alpha(col(c.bg, "#000000"), 0.8));
        pen.text(s, x, y + size * 0.08, size, cc, { outline: !label, bold });
        this.pointerLine(c, pen, { x, y, w: tw, h: th });
        return { kind: c.op, text: s, min: 260 };
      }
      case "formula": {
        const s = str2(c.s, 300), b = tex(s, TEX_SIZE[num2(c.size, 2)] ?? 20);
        let x = num2(c.x, 160), y = num2(c.y, 20);
        if (c.align === "center") x -= b.w / 2;
        [x, y] = this.place(x, y, b.w, b.h + b.d, 0, c.place !== false);
        pen.tex(b, x, y + b.h, cc);
        return { kind: "formula", text: s, min: 400 };
      }
      case "box": {
        const x = num2(c.x), y = num2(c.y), ww = Math.max(8, num2(c.w, 80)), hh = Math.max(8, num2(c.h, 28)), r = num2(c.r, 4);
        const frame = c.frame !== false, edge = col(c.c, "#FFF1E8");
        const bg = typeof c.bg === "string" || typeof c.alpha === "number" ? alpha(col(c.bg, edge), num2(c.alpha, 0.16)) : frame ? alpha(edge, 0.14) : null;
        pen.shape(rectPts(x, y, ww, hh, r), { fill: bg, stroke: frame ? edge : null, w: 1.1 });
        const s = str2(c.s, 160), bold = c.bold === true;
        if (s) {
          const left = c.align === "left";
          const f = this.fit(left ? `\u2022 ${s}` : s, ww - 8, hh - 4, typeof c.fs === "number" ? Math.max(6, Math.min(24, c.fs)) : [0, 11, 15, 20][num2(c.size, 1)] ?? 11, bold);
          const lh = f.size * 1.18, top = y + (hh - f.lines.length * lh) / 2;
          f.lines.forEach((l, i) => pen.text(l, left ? x + 4 : x + ww / 2, top + i * lh + f.size * 0.06, f.size, col(c.tc, "#FFF1E8"), { outline: !frame && !bg, bold, align: left ? "left" : "center" }));
        }
        return { kind: "box", text: s, min: 350 };
      }
      case "icon": {
        const s = Math.max(8, Math.min(140, num2(c.s, 32)));
        icon(pen, String(c.name), num2(c.x), num2(c.y), s, typeof c.c === "string" ? col(c.c) : null);
        return { kind: `icon:${String(c.name).slice(0, 12)}`, min: 420 };
      }
      case "pixels": {
        const rows = Array.isArray(c.rows) ? c.rows.map(String).slice(0, 32) : [];
        const pal = c.pal && typeof c.pal === "object" ? c.pal : {};
        const x = num2(c.x), y = num2(c.y), k = Math.max(1, Math.min(4, num2(c.scale, 2)));
        rows.forEach((row, ry) => [...row.slice(0, 32)].forEach((ch, rx) => {
          if (ch !== "." && ch !== " ") pen.fill(rectPts(x + rx * k, y + ry * k, k + 0.05, k + 0.05), col(pal[ch]));
        }));
        return { kind: "pixels", min: 400 };
      }
      case "axes":
        return this.axes(c, pen);
      case "numberline":
        return this.numberline(c, pen);
      case "plot":
        return this.plot(c, pen);
      case "interval":
        return this.interval(c, pen);
      case "dot": {
        const x = num2(c.x), y = num2(c.y), r = Math.max(1, Math.min(8, num2(c.r, 2.6))), s = this.sysOf(c);
        if (c.proj === true && s && s.kind === "axes") {
          const ax = Math.max(s.box.y, Math.min(s.box.y + s.box.h, s.Y(0))), ay = Math.max(s.box.x, Math.min(s.box.x + s.box.w, s.X(0)));
          pen.line([x, y, x, ax], alpha(cc === "#FFF1E8" ? "#FFEC27" : cc, 0.7), 0.8, true);
          pen.line([x, y, ay, y], alpha(cc === "#FFF1E8" ? "#FFEC27" : cc, 0.7), 0.8, true);
        }
        pen.shape(ellipsePts(x, y, r, r), { fill: col(c.c, "#FFEC27"), stroke: "#10142E", w: 0.6 });
        const lb = str2(c.s ?? c.label, 24);
        if (lb) {
          const b = isTex(lb) || /[A-Za-z]\(|\^|_/.test(lb) ? tex(lb, 12) : null, tw = b ? b.w : textW(lb, 11), th = b ? b.h + b.d : 13;
          const [tx, ty] = this.place(x + r + 2, y - r - th, tw, th, 0);
          if (b) pen.tex(b, tx, ty + b.h, col(c.tc, "#FFF1E8"));
          else pen.text(lb, tx, ty, 11, col(c.tc, "#FFF1E8"));
        }
        return { kind: c.proj === true ? "dot with projections" : "dot", text: lb, min: 260 };
      }
      case "angle": {
        const x = num2(c.x), y = num2(c.y), A = Array.isArray(c.a) ? c.a : [x + 20, y], B = Array.isArray(c.b) ? c.b : [x, y - 20];
        const t1 = Math.atan2(num2(A[1]) - y, num2(A[0]) - x), t2 = Math.atan2(num2(B[1]) - y, num2(B[0]) - x);
        let d = t2 - t1;
        while (d > Math.PI) d -= Math.PI * 2;
        while (d <= -Math.PI) d += Math.PI * 2;
        const r = Math.max(5, Math.min(40, num2(c.r, 12))), color = col(c.c, "#FFEC27");
        if (c.right === true) {
          const s2 = r * 0.7, u1 = [Math.cos(t1), Math.sin(t1)], u2 = [Math.cos(t2), Math.sin(t2)];
          pen.line([x + u1[0] * s2, y + u1[1] * s2, x + (u1[0] + u2[0]) * s2, y + (u1[1] + u2[1]) * s2, x + u2[0] * s2, y + u2[1] * s2], color, 1.1);
        } else {
          pen.line(ellipsePts(x, y, r, r, t1, t1 + d), color, 1.2);
          if (c.double === true) pen.line(ellipsePts(x, y, r + 2.5, r + 2.5, t1, t1 + d), color, 1.2);
        }
        const s = str2(c.s, 16);
        if (s) {
          const tb = t1 + d / 2, b = tex(s, 12), rr = r + 4 + b.w * 0.35;
          pen.tex(b, x + Math.cos(tb) * rr - b.w / 2, y + Math.sin(tb) * rr + b.h * 0.45, color);
        }
        return { kind: "angle", text: s, min: 300 };
      }
      case "grid": {
        const x = num2(c.x, 0), y = num2(c.y, 0), ww = num2(c.w, W), hh = num2(c.h, H), st = Math.max(4, num2(c.step, 10)), gc = alpha(col(c.c, "#C2C3C7"), 0.16);
        for (let gx = x; gx <= x + ww + 0.01; gx += st) pen.line([gx, y, gx, y + hh], gc, 0.35);
        for (let gy = y; gy <= y + hh + 0.01; gy += st) pen.line([x, gy, x + ww, gy], gc, 0.35);
        return { kind: "grid", min: 300 };
      }
    }
    return null;
  }
  pts(v, max) {
    const raw = Array.isArray(v) ? v.slice(0, max) : [];
    return raw.flatMap((p) => Array.isArray(p) ? [num2(p[0]), num2(p[1])] : []);
  }
  // callout label: a line from the label to the object with a dot at the end
  pointerLine(c, pen, box) {
    if (!c.to || typeof c.to !== "object") return;
    const t = c.to, tx = num2(t.x), ty = num2(t.y);
    const sx = Math.max(box.x, Math.min(tx, box.x + box.w)), sy = ty < box.y ? box.y - 3 : ty > box.y + box.h ? box.y + box.h + 3 : box.y + box.h / 2;
    const lc = col(c.lc, col(c.c));
    pen.line([sx, sy, tx, ty], lc, 0.9);
    pen.fill(ellipsePts(tx, ty, 1.5, 1.5), lc);
  }
  /* ----------------------------- axes and graphs ----------------------------- */
  axes(c, pen) {
    const id = typeof c.id === "string" && c.id ? c.id : "ax";
    const x = num2(c.x, 20), y = num2(c.y, 10), w = Math.max(30, num2(c.w, 180)), h = Math.max(30, num2(c.h, 160));
    let xmin = num2(c.xmin, -5), xmax = num2(c.xmax, 5), ymin = num2(c.ymin, -5), ymax = num2(c.ymax, 5);
    if (xmax <= xmin) xmax = xmin + 1;
    if (ymax <= ymin) ymax = ymin + 1;
    const X = (v) => x + (v - xmin) / (xmax - xmin) * w, Y2 = (v) => y + h - (v - ymin) / (ymax - ymin) * h;
    const xs = num2(c.xstep, num2(c.step, niceStep(xmax - xmin, w / 22))), ys = num2(c.ystep, num2(c.step, niceStep(ymax - ymin, h / 18)));
    const gridC = alpha("#C2C3C7", 0.17), axisC = col(c.c, "#C2C3C7");
    if (c.grid !== false) {
      for (let v = Math.ceil(xmin / xs) * xs; v <= xmax + 1e-9; v += xs) pen.line([X(v), y, X(v), y + h], gridC, 0.35);
      for (let v = Math.ceil(ymin / ys) * ys; v <= ymax + 1e-9; v += ys) pen.line([x, Y2(v), x + w, Y2(v)], gridC, 0.35);
    }
    const ox = Math.max(x, Math.min(x + w, X(0))), oy = Math.max(y, Math.min(y + h, Y2(0)));
    pen.line([x, oy, x + w + 6, oy], axisC, 1);
    pen.arrowHead(x, oy, x + w + 7, oy, axisC, 0.9);
    pen.line([ox, y + h, ox, y - 6], axisC, 1);
    pen.arrowHead(ox, y + h, ox, y - 7, axisC, 0.9);
    const lx = str2(c.xl ?? "x", 8), ly = str2(c.yl ?? "y", 8);
    pen.tex(tex(lx, 12), x + w + 2, oy + 12, axisC);
    pen.tex(tex(ly, 12), ox + 5, y - 1, axisC);
    if (c.labels !== false) {
      const every = (v) => Math.abs(v) > 1e-9;
      const lc = alpha("#FFF1E8", 0.75);
      for (let v = Math.ceil(xmin / xs) * xs; v <= xmax + 1e-9; v += xs) if (every(v) && X(v) < x + w - 2) {
        pen.line([X(v), oy - 1.5, X(v), oy + 1.5], axisC, 0.8);
        const s = fmtNum(v);
        pen.text(s, X(v) - textW(s, 7) / 2, oy + 3, 7, lc, { outline: true });
      }
      for (let v = Math.ceil(ymin / ys) * ys; v <= ymax + 1e-9; v += ys) if (every(v) && Y2(v) > y + 2) {
        pen.line([ox - 1.5, Y2(v), ox + 1.5, Y2(v)], axisC, 0.8);
        const s = fmtNum(v);
        pen.text(s, ox - 3 - textW(s, 7), Y2(v) - 4.5, 7, lc, { outline: true });
      }
      if (X(0) >= x && X(0) <= x + w && Y2(0) >= y && Y2(0) <= y + h) pen.text("0", ox - 7, oy + 2, 7, lc);
    }
    this.sys.set(id, { kind: "axes", X, Y: Y2, box: { x, y, w, h }, xmin, xmax, ymin, ymax });
    this.lastSys = id;
    return { kind: `axes x\u2208[${fmtNum(xmin)};${fmtNum(xmax)}] y\u2208[${fmtNum(ymin)};${fmtNum(ymax)}]`, min: 700 };
  }
  numberline(c, pen) {
    const id = typeof c.id === "string" && c.id ? c.id : "nl";
    const x1 = num2(c.x1, 20), x2 = num2(c.x2, 300), y = num2(c.y, 100);
    let from = num2(c.from, -5), to = num2(c.to, 5);
    if (to <= from) to = from + 1;
    const X = (v) => x1 + (v - from) / (to - from) * (x2 - x1);
    const st = num2(c.step, niceStep(to - from, (x2 - x1) / 24)), cc = col(c.c, "#C2C3C7");
    pen.line([x1 - 6, y, x2 + 8, y], cc, 1.1);
    pen.arrowHead(x1, y, x2 + 9, y, cc, 1);
    pen.tex(tex(str2(c.xl ?? "x", 6), 12), x2 + 6, y + 13, cc);
    if (c.labels !== false) for (let v = Math.ceil(from / st) * st; v <= to + 1e-9; v += st) {
      pen.line([X(v), y - 2.5, X(v), y + 2.5], cc, 0.9);
      const s = fmtNum(v);
      pen.text(s, X(v) - textW(s, 8) / 2, y + 5, 8, alpha("#FFF1E8", 0.8));
    }
    this.sys.set(id, { kind: "line", X, Y: () => y, box: { x: x1, y: y - 8, w: x2 - x1, h: 16 }, xmin: from, xmax: to, ymin: 0, ymax: 0 });
    this.lastSys = id;
    return { kind: `numberline ${fmtNum(from)}\u2026${fmtNum(to)}`, min: 600 };
  }
  plot(c, pen) {
    const s = this.sys.get(typeof c.axes === "string" ? c.axes : this.lastSys);
    const f = compile(str2(c.fn, 120));
    if (!s || s.kind !== "axes" || !f) return null;
    const a = num2(c.from, s.xmin), b = num2(c.to, s.xmax), cc = col(c.c, "#29ADFF"), w = lwOf(c.lw ?? 2);
    const span = s.ymax - s.ymin, lo = s.ymin - span * 0.6, hi = s.ymax + span * 0.6;
    let seg = [], last = null, prevY = null;
    const N = 360;
    for (let i = 0; i <= N; i++) {
      const xv = a + (b - a) * i / N, yv = f(xv);
      if (!Number.isFinite(yv) || yv < lo || yv > hi || prevY !== null && Math.abs(yv - prevY) > span * 0.9) {
        if (seg.length >= 4) pen.line(seg, cc, w, c.dash === true);
        seg = [];
        prevY = Number.isFinite(yv) ? yv : null;
        continue;
      }
      seg.push(s.X(xv), s.Y(yv));
      prevY = yv;
      if (yv >= s.ymin && yv <= s.ymax) last = [s.X(xv), s.Y(yv)];
    }
    if (seg.length >= 4) pen.line(seg, cc, w, c.dash === true);
    if (!pen.prims.length) return null;
    const lb = str2(c.s, 40);
    if (lb && last) {
      const lp = new Pen(), bx = tex(lb, 12), [tx, ty] = this.place(Math.min(last[0] + 3, s.box.x + s.box.w - bx.w), last[1] - bx.h - bx.d - 3, bx.w, bx.h + bx.d, 2);
      lp.fill(rectPts(tx - 2, ty - 2, bx.w + 4, bx.h + bx.d + 4, 2), alpha("#000000", 0.55));
      lp.tex(bx, tx, ty + bx.h, cc);
      const pid = typeof c.id === "string" && c.id ? `${c.id}.label` : null;
      this.after.push((d) => this.add({ op: "plot" }, lp, d + 900, { kind: "plot label", text: lb, min: 400, id: pid }));
    }
    return { kind: `plot y=${str2(c.fn, 40)}`, text: lb, min: 900, clip: { x: s.box.x - 1, y: s.box.y - 1, w: s.box.w + 2, h: s.box.h + 2 } };
  }
  interval(c, pen) {
    const s = this.sys.get(typeof c.on === "string" ? c.on : typeof c.axes === "string" ? c.axes : this.lastSys);
    if (!s || s.kind !== "line") return null;
    const y = s.Y(0), cc = col(c.c, "#FF004D");
    const from = c.from === null || c.from === void 0 || c.from === "-inf" ? null : num2(c.from), to = c.to === null || c.to === void 0 || c.to === "inf" ? null : num2(c.to);
    const xa = from === null ? s.box.x - 4 : s.X(from), xb = to === null ? s.box.x + s.box.w + 4 : s.X(to);
    const lift = num2(c.lift, 0), yy = y - lift;
    pen.line([xa, yy, xb, yy], alpha(cc, 0.9), 2.4);
    for (let hx = xa + 3; hx < xb - 1; hx += 4) pen.line([hx, yy - 1, hx + 4, yy - 6], alpha(cc, 0.55), 0.7);
    const closed = Array.isArray(c.closed) ? c.closed : [true, true];
    const end = (v, cl) => {
      if (v === null) return;
      pen.shape(ellipsePts(s.X(v), yy, 2.6, 2.6), { fill: cl === false ? this.bg : cc, stroke: cc, w: 1 });
    };
    end(from, closed[0]);
    end(to, closed[1]);
    return { kind: `interval ${from ?? "\u2212\u221E"}\u2026${to ?? "+\u221E"}`, min: 500 };
  }
  /* ----------------------------- step-by-step solutions ----------------------------- */
  // solution line: lines of one solution stack vertically with "=" signs aligned in a column; a note goes on the right
  step(c, delay) {
    const id = typeof c.id === "string" && c.id ? c.id : "sol";
    let blk = this.steps.get(id);
    if (!blk) {
      blk = { x: num2(c.x, 170), y: num2(c.y, 14), size: TEX_SIZE[num2(c.size, 2)] ?? 20, c: col(c.c, "#FFF1E8"), lines: [], box: null };
      this.steps.set(id, blk);
      this.groups.set(id, { kind: "steps", parts: [] });
    }
    const s = str2(c.s, 200), sp = splitEq(s), z = blk.size;
    blk.lines.push({ s, note: str2(c.note, 30), full: tex(s, z), l: sp ? tex(sp[0], z) : null, r: sp ? tex(sp[1], z) : null, n: c.note ? tex(`|\\;{${str2(c.note, 30)}}`, z * 0.72) : null });
    const eq = tex("=", z), gap = z * 0.28;
    const maxL = Math.max(0, ...blk.lines.map((l) => l.l?.w ?? 0));
    const eqX = blk.x + maxL + gap;
    const right = Math.max(...blk.lines.map((l) => l.l ? eqX + eq.w + gap + l.r.w : blk.x + l.full.w));
    let yy = blk.y;
    const color = col(c.c, blk.c);
    blk.lines.forEach((l, k) => {
      const h = Math.max(l.full.h, z * 0.75), d = Math.max(l.full.d, z * 0.25);
      const base = yy + h;
      const pen = new Pen();
      if (l.l) {
        pen.tex(l.l, eqX - gap - l.l.w, base, color);
        pen.tex(eq, eqX, base, color);
        pen.tex(l.r, eqX + eq.w + gap, base, color);
      } else pen.tex(l.full, blk.x, base, color);
      if (l.n) pen.tex(l.n, Math.min(right + z * 0.6, W - 3 - l.n.w), base, "#83769C");
      const pid = `${id}.${k + 1}`, old = this.items.find((i) => i.id === pid);
      if (old) {
        old.prims = pen.prims;
        timeline(old.prims);
        old.box = bounds(old.prims) ?? old.box;
      } else this.add({ op: "step" }, pen, delay, { kind: "step", text: l.s, min: 500, id: pid });
      yy = base + d + z * 0.45;
    });
    this.groups.get(id).parts = blk.lines.map((l, k) => [`${id}.${k + 1}`, l.s + (l.note ? ` | ${l.note}` : "")]);
    const box = { x: blk.x, y: blk.y, w: right - blk.x, h: yy - blk.y };
    if (blk.box) this.labels = this.labels.filter((b) => b !== blk.box);
    blk.box = box;
    this.labels.push(box);
  }
  /* ------------------------------ diagrams, highlighting ------------------------------ */
  schema(c, delay) {
    const id = typeof c.id === "string" && c.id ? c.id : "s";
    const laid = layoutSchema(c, id);
    if (!laid) return;
    for (const old of this.find(id)) this.items = this.items.filter((i) => i !== old);
    for (const { c: cmd, d } of laid.cmds) this.exec(cmd, delay + d);
    this.groups.set(id, { kind: `schema:${String(c.type)}`, parts: laid.parts });
  }
  // marker highlighting: circle, underline, box, strike through, check mark
  mark(c, delay) {
    const target = typeof c.id === "string" ? c.id : "";
    const box = union(this.find(target).filter((i) => !i.id?.endsWith(".mark")).map((i) => i.box)) ?? (typeof c.x === "number" ? (() => {
      const [x, y] = this.mapPt(c, num2(c.x), num2(c.y));
      return { x: x - num2(c.w, 16) / 2, y: y - num2(c.h, 16) / 2, w: num2(c.w, 16), h: num2(c.h, 16) };
    })() : null);
    if (!box) return;
    const pen = new Pen(), cc = col(c.c, "#FF004D"), w = lwOf(c.lw ?? 1.6), style = String(c.style ?? "circle");
    const cx = box.x + box.w / 2, cy = box.y + box.h / 2;
    if (style === "underline") {
      const pts = [];
      for (let i = 0; i <= 20; i++) {
        const x = box.x - 2 + (box.w + 4) * i / 20;
        pts.push(x, box.y + box.h + 2 + Math.sin(i * 1.3) * 0.7);
      }
      pen.line(pts, cc, w);
    } else if (style === "box") pen.line(rectPts(box.x - 3, box.y - 3, box.w + 6, box.h + 6, 3), cc, w);
    else if (style === "cross") {
      pen.line([box.x, box.y, box.x + box.w, box.y + box.h], cc, w);
      pen.line([box.x + box.w, box.y, box.x, box.y + box.h], cc, w);
    } else if (style === "check") {
      const s = Math.min(14, Math.max(8, box.h));
      const x = box.x + box.w + 4, y = cy;
      pen.line([x, y, x + s * 0.35, y + s * 0.4, x + s, y - s * 0.55], col(c.c, "#00E436"), w * 1.2);
    } else pen.line(ellipsePts(cx, cy, box.w / 2 + 5, box.h / 2 + 4, -2.5, -2.5 + Math.PI * 2 + 0.55, 0.03), cc, w);
    this.add({ op: "mark" }, pen, delay, { kind: `mark:${style}`, min: 450, id: typeof c.mid === "string" ? c.mid : `${target || "xy"}.mark` });
  }
  /* -------------------------- ready-made objects, images -------------------------- */
  composite(c, delay) {
    const id = typeof c.id === "string" && c.id ? c.id : c.op;
    const x = num2(c.x, W / 2), y = num2(c.y, H / 2), cc = col(c.c, "#FF004D"), period = num2(c.period, 2);
    let d = delay;
    const sub = (cmd, gap = 140) => {
      this.exec(cmd, d);
      d += gap;
    };
    this.groups.set(id, { kind: c.op, parts: [] });
    if (c.op === "road") {
      const v = c.dir === "v", h = Math.max(24, Math.min(80, num2(c.h, 44)));
      const a = v ? num2(c.x, 140) : num2(c.y, 120), from = num2(v ? c.y1 : c.x1, 0), to = num2(v ? c.y2 : c.x2, v ? H : W), asphalt = col(c.c, "#5F574F");
      if (v) {
        sub({ op: "rect", id: `${id}.asphalt`, x: a, y: from, w: h, h: to - from, c: asphalt, fill: true });
        sub({ op: "line", id: `${id}.mid`, x1: a + h / 2, y1: from + 2, x2: a + h / 2, y2: to - 2, c: "#FFF1E8", lw: 1, dash: true });
      } else {
        sub({ op: "rect", id: `${id}.asphalt`, x: from, y: a, w: to - from, h, c: asphalt, fill: true });
        sub({ op: "line", id: `${id}.mid`, x1: from + 2, y1: a + h / 2, x2: to - 2, y2: a + h / 2, c: "#FFF1E8", lw: 1, dash: true });
      }
      return;
    }
    if (c.op === "crosswalk") {
      const v = c.dir === "v", h = Math.max(24, Math.min(80, num2(c.h, 44))), w = Math.max(14, Math.min(50, num2(c.w, 26)));
      const road0 = v ? num2(c.x, 140) : num2(c.y, 120), mid = v ? num2(c.y, H / 2) : num2(c.x, W / 2);
      const n = Math.max(3, Math.floor((h - 4) / 8));
      for (let i = 0; i < n; i++) {
        const o = road0 + 3 + i * ((h - 6) / n), t = Math.max(2, (h - 6) / n / 2);
        sub(v ? { op: "rect", id: `${id}.s${i}`, x: o, y: mid - w / 2, w: t, h: w, c: "#FFF1E8", fill: true } : { op: "rect", id: `${id}.s${i}`, x: mid - w / 2, y: o, w, h: t, c: "#FFF1E8", fill: true }, 60);
      }
      return;
    }
    if (c.op === "trafficlight") {
      const on = c.on === "green" ? 2 : c.on === "yellow" ? 1 : 0, pole = Math.max(0, Math.min(120, num2(c.pole, 40)));
      const lamps = [["#FF004D", "#5A1E2E"], ["#FFEC27", "#5B5530"], ["#00E436", "#1E4B32"]];
      if (pole) sub({ op: "rect", id: `${id}.pole`, x: x - 1.5, y: y + 44, w: 3, h: pole, c: "#83769C", fill: true });
      sub({ op: "rect", id: `${id}.box`, x: x - 9, y, w: 18, h: 45, r: 3, c: "#000000", fill: true, stroke: "#C2C3C7" });
      lamps.forEach(([bright, dim], i) => sub({ op: "circle", id: `${id}.l${i}`, x, y: y + 8 + i * 14.5, r: 5, c: i === on ? bright : dim, fill: true, ...i === on && c.blink === true ? { anim: { type: "blink", period: 1 } } : {} }, 80));
      return;
    }
    if (c.op === "pendulum") {
      const len2 = Math.max(30, Math.min(160, num2(c.len, 110))), angle = Math.max(5, Math.min(60, num2(c.angle, 25)));
      const swing = { type: "swing", cx: x, cy: y, angle, period };
      sub({ op: "rect", id: `${id}.bar`, x: x - 22, y: y - 4, w: 44, h: 4, r: 1, c: "#C2C3C7", fill: true });
      sub({ op: "line", id: `${id}.string`, x1: x, y1: y, x2: x, y2: y + len2, c: "#FFF1E8", lw: 1, anim: swing });
      sub({ op: "icon", id: `${id}.bob`, name: "ball", x, y: y + len2, s: Math.max(14, num2(c.s, 22)), c: cc, anim: swing });
      return;
    }
    if (c.op === "atom") {
      const shells = (Array.isArray(c.shells) ? c.shells.map((n2) => Math.max(1, Math.min(8, Math.round(num2(n2, 2))))) : [2]).slice(0, 3);
      const n = Math.max(2, Math.min(10, Math.round(num2(c.protons, shells.reduce((a, b) => a + b, 0)))));
      for (let i = 0; i < n * 2 && i < 16; i++) {
        const a = i * 2.4, rr = 2.2 * Math.sqrt(i);
        sub({ op: "circle", id: `${id}.n${i}`, x: x + Math.cos(a) * rr * 2, y: y + Math.sin(a) * rr * 2, r: 4, c: i % 2 ? "#C2C3C7" : "#FF004D", fill: true, stroke: "#1D2B53" }, 40);
      }
      shells.forEach((k, s) => {
        const r = 34 + s * 24;
        sub({ op: "circle", id: `${id}.shell${s}`, x, y, r, c: "#83769C", fill: false, lw: 1, dash: true }, 200);
        for (let e = 0; e < k; e++) {
          const a = e / k * Math.PI * 2 - Math.PI / 2;
          sub({ op: "circle", id: `${id}.e${s}_${e}`, x: x + Math.cos(a) * r, y: y + Math.sin(a) * r, r: 3.5, c: "#29ADFF", fill: true, anim: { type: "orbit", cx: x, cy: y, period: 3 + s * 1.6 } }, 60);
        }
      });
      return;
    }
    const x1 = num2(c.x1, 20), x2 = num2(c.x2, W - 20), amp = Math.max(4, Math.min(70, num2(c.amp, 25))), len = Math.max(20, Math.min(200, num2(c.len, 80)));
    const pts = [];
    for (let px = x1 - len; px <= x2; px += 1.5) pts.push([px, y - Math.sin((px - x1) / len * Math.PI * 2) * amp]);
    sub({ op: "path", id, pts, c: col(c.c, "#29ADFF"), lw: num2(c.lw, 2), clip: { x: x1, y: 0, w: x2 - x1, h: H }, anim: { type: "move", dx: len, dy: 0, period, loop: "repeat" } });
  }
  // Image from lesson materials (a sign, a situation): the board picks the spot: a centered row, a caption under each.
  addPic(c, now) {
    const id = typeof c.id === "string" ? c.id : null;
    if (id) {
      this.items = this.items.filter((i) => i.id !== id);
      this.pics = this.pics.filter((p2) => p2.it.id !== id);
    }
    const it = { id, op: "pic", prims: [], box: { x: 0, y: 0, w: 1, h: 1 }, anim: null, t0: this.instant ? -1e9 : now, at: now, dur: 500, kind: "picture", text: str2(c.cap, 24) };
    const p = { it, img: null, cap: str2(c.cap, 24) };
    if (this.pics.length >= 5) {
      const old = this.pics.shift();
      this.items = this.items.filter((i) => i !== old.it);
    }
    this.items.push(it);
    this.pics.push(p);
    if (typeof c.src === "string" && /^https?:\/\//.test(c.src)) {
      const img = new Image();
      img.onload = () => {
        if (!this.pics.includes(p)) return;
        p.img = img;
        this.layoutPics();
        this.wake();
      };
      img.src = c.src;
    }
    this.layoutPics();
  }
  layoutPics() {
    const n = this.pics.length;
    if (!n) return;
    const s = [0, 96, 84, 72, 60, 50][n], gap = n <= 3 ? 28 : 12, cy = 76;
    this.pics.forEach((p, i) => {
      const cx = W / 2 + (i - (n - 1) / 2) * (s + gap), x0 = cx - s / 2, y0 = cy - s / 2;
      const pen = new Pen();
      pen.fill(rectPts(x0 - 2, y0 - 2, s + 4, s + 4, 3), "#FFF1E8");
      if (p.img) {
        const k = Math.min(s / (p.img.naturalWidth || s), s / (p.img.naturalHeight || s));
        const w = (p.img.naturalWidth || s) * k, h = (p.img.naturalHeight || s) * k;
        pen.img(p.img, x0 + (s - w) / 2, y0 + (s - h) / 2, w, h);
      }
      if (p.cap) {
        const f = this.fit(p.cap, s + gap - 4, 22, 8, true);
        f.lines.slice(0, 2).forEach((l, k) => pen.text(l, cx, y0 + s + 5 + k * 10, f.size, "#FFF1E8", { bold: true, align: "center" }));
      }
      p.it.prims = pen.prims;
      timeline(p.it.prims);
      p.it.box = bounds(p.it.prims) ?? p.it.box;
    });
  }
  /* -------------------------------- memory -------------------------------- */
  /** What is on the board now, in brief for the AI: names, what each is, where (x,y w×h), labels; coordinate systems; free space. */
  scene() {
    if (!this.items.length) return "";
    const R2 = (b) => `@${Math.round(b.x)},${Math.round(b.y)} ${Math.round(b.w)}\xD7${Math.round(b.h)}`;
    const out = [];
    if (this.title) out.push(`title: "${this.title}"`);
    const seen = /* @__PURE__ */ new Set();
    let unnamed = 0;
    for (const it of this.items) {
      if (!it.id) {
        if (unnamed++ < 16) out.push(`${it.auto}: ${it.kind} ${R2(it.box)}${it.text ? ` "${it.text.slice(0, 40)}"` : ""}`);
        continue;
      }
      const key = this.groups.has(it.id.split(".")[0]) ? it.id.split(".")[0] : it.id;
      if (seen.has(key)) continue;
      seen.add(key);
      const g = this.groups.get(key);
      if (g) {
        const box = union(this.find(key).map((i) => i.box));
        const parts = g.parts.slice(0, 12).map(([pid, s]) => `${pid} "${s.slice(0, 36)}"`).join(", ");
        out.push(`${key}: ${g.kind}${box ? ` ${R2(box)}` : ""}${parts ? ` \u2014 parts: ${parts}` : ""}`);
      } else out.push(`${it.id}: ${it.kind} ${R2(it.box)}${it.text ? ` "${it.text.slice(0, 40)}"` : ""}${it.anim ? ` (anim ${it.anim.type})` : ""}`);
      if (out.length > 40) break;
    }
    const free = this.free();
    if (free.length) out.push(`free areas: ${free.map((b) => `x ${Math.round(b.x)}\u2013${Math.round(b.x + b.w)}, y ${Math.round(b.y)}\u2013${Math.round(b.y + b.h)}`).join("; ")}`);
    return out.join("\n").slice(0, 3e3);
  }
  // free space: a 10×10 grid with cells under objects marked as taken; pick the largest empty rectangles
  free() {
    const C = 10, nx = W / C, ny = H / C;
    const busy = Array.from({ length: ny }, () => new Array(nx).fill(false));
    for (const it of this.items) {
      const b = it.box;
      if (b.w * b.h > W * H * 0.6 || it.kind === "grid") continue;
      for (let y = Math.max(0, Math.floor(b.y / C)); y < Math.min(ny, Math.ceil((b.y + b.h) / C)); y++)
        for (let x = Math.max(0, Math.floor(b.x / C)); x < Math.min(nx, Math.ceil((b.x + b.w) / C)); x++) busy[y][x] = true;
    }
    const res = [];
    for (let n = 0; n < 3; n++) {
      let best = { a: 0, x: 0, y: 0, w: 0, h: 0 };
      const hgt = new Array(nx).fill(0);
      for (let y = 0; y < ny; y++) {
        for (let x = 0; x < nx; x++) hgt[x] = busy[y][x] ? 0 : hgt[x] + 1;
        for (let x = 0; x < nx; x++) {
          let mh = Infinity;
          for (let x2 = x; x2 < nx && hgt[x2] > 0; x2++) {
            mh = Math.min(mh, hgt[x2]);
            const a = mh * (x2 - x + 1);
            if (a > best.a) best = { a, x, y: y - mh + 1, w: x2 - x + 1, h: mh };
          }
        }
      }
      if (best.w < 4 || best.h < 3) break;
      res.push({ x: best.x * C, y: best.y * C, w: best.w * C, h: best.h * C });
      for (let y = best.y; y < best.y + best.h; y++) for (let x = best.x; x < best.x + best.w; x++) busy[y][x] = true;
    }
    return res;
  }
};
export {
  Board,
  H,
  ICONS,
  W
};
