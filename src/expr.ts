// Copyright 2026 UpBilim
// SPDX-License-Identifier: Apache-2.0
// Function for plotting: "x^2 - 2", "2sin(x)", "sqrt(x+1)", "1/x", "|x|" → (x) => y. Own parser, no eval:
// + − * / ^, parentheses, implicit multiplication (2x, 3(x+1), x sin x), functions and the constants pi, e.
type Fn = (x: number) => number;
const F: Record<string, (v: number) => number> = {
  sin: Math.sin, cos: Math.cos, tan: Math.tan, tg: Math.tan, cot: (v) => 1 / Math.tan(v), ctg: (v) => 1 / Math.tan(v),
  asin: Math.asin, acos: Math.acos, atan: Math.atan, arcsin: Math.asin, arccos: Math.acos, arctg: Math.atan, arctan: Math.atan,
  sqrt: Math.sqrt, abs: Math.abs, ln: Math.log, log: Math.log10, lg: Math.log10, exp: Math.exp, floor: Math.floor, ceil: Math.ceil, round: Math.round, sign: Math.sign,
};

export function compile(src: string): Fn | null {
  const s = src.toLowerCase().replace(/^\s*(y|f\(x\))\s*=/, '').replace(/[−–]/g, '-').replace(/[·×]/g, '*').replace(/²/g, '^2').replace(/³/g, '^3').replace(/π/g, 'pi').replace(/√/g, 'sqrt').replace(/,/g, '.');
  let i = 0;
  const ws = () => { while (s[i] === ' ') i++; };
  const peek = () => { ws(); return s[i] ?? ''; };
  // expression := terms; term := factors (including implicit multiplication); factor := unary ^ factor
  const expr = (): Fn => {
    let a = term();
    for (;;) {
      const c = peek();
      if (c === '+') { i++; const l = a, r = term(); a = (x) => l(x) + r(x); }
      else if (c === '-') { i++; const l = a, r = term(); a = (x) => l(x) - r(x); }
      else return a;
    }
  };
  const term = (): Fn => {
    let a = unary();
    for (;;) {
      const c = peek();
      if (c === '*') { i++; const l = a, r = unary(); a = (x) => l(x) * r(x); }
      else if (c === '/') { i++; const l = a, r = unary(); a = (x) => l(x) / r(x); }
      else if (c && /[0-9a-z(|.]/.test(c) && !(c === '|' && absDepth > 0)) { const l = a, r = power(); a = (x) => l(x) * r(x); }
      else return a;
    }
  };
  const unary = (): Fn => {
    const c = peek();
    if (c === '-') { i++; const r = unary(); return (x) => -r(x); }
    if (c === '+') { i++; return unary(); }
    return power();
  };
  const power = (): Fn => {
    const b = atom();
    if (peek() === '^') { i++; const e = unary(); return (x) => Math.pow(b(x), e(x)); }
    return b;
  };
  let absDepth = 0;
  const atom = (): Fn => {
    const c = peek();
    if (c === '(') { i++; const e = expr(); if (peek() === ')') i++; return e; }
    if (c === '|') { i++; absDepth++; const e = expr(); absDepth--; if (peek() === '|') i++; return (x) => Math.abs(e(x)); }
    const num = /^[0-9]*\.?[0-9]+/.exec(s.slice(i));
    if (num) { i += num[0].length; const v = parseFloat(num[0]); return () => v; }
    const id = /^[a-z]+/.exec(s.slice(i));
    if (id) {
      const w = id[0];
      const fn = Object.keys(F).sort((a, b) => b.length - a.length).find((k) => w.startsWith(k));
      if (fn) { i += fn.length; const f = F[fn]!; const arg = peek() === '(' ? atom() : power(); return (x) => f(arg(x)); }
      if (w.startsWith('pi')) { i += 2; return () => Math.PI; }
      if (w[0] === 'x') { i += 1; return (x) => x; }
      if (w[0] === 'e') { i += 1; return () => Math.E; }
    }
    throw new Error('bad');
  };
  try {
    const f = expr();
    if (i < s.length && s.slice(i).trim()) return null;
    f(1.234);
    return f;
  } catch { return null; }
}

/** A "nice" axis tick step: 1, 2, 5 × 10ⁿ. */
export function niceStep(range: number, ticks = 8) {
  const raw = Math.abs(range) / ticks || 1;
  const p = Math.pow(10, Math.floor(Math.log10(raw)));
  const k = raw / p;
  return (k <= 1 ? 1 : k <= 2 ? 2 : k <= 5 ? 5 : 10) * p;
}

/** Axis number label: no trailing zeros, a real minus sign. */
export const fmtNum = (v: number) => {
  const r = Math.round(v * 1000) / 1000;
  return (Object.is(r, -0) ? '0' : String(r)).replace('-', '−').replace('.', ',');
};
