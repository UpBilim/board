// Copyright 2026 UpBilim
// SPDX-License-Identifier: Apache-2.0
// Ready-made auto-layout diagrams: the AI names the type and content, the board places blocks and arrows without overlaps.
// cycle: a cycle, flow: a chain of steps, timeline: a time line, compare: side-by-side columns, table: a table,
// tree: a tree (classification), venn: Venn/Euler circles. Each part is named "id.N" so it can be pointed at and marked.
// A diagram expands into ordinary board commands (box, arrow, path, ellipse, text) with delays, so parts appear in turn.
import { textW } from './pen';

type Cmd = Record<string, unknown> & { op: string };
export interface Laid { cmds: Array<{ c: Cmd; d: number }>; parts: Array<[string, string]>; box: { x: number; y: number; w: number; h: number } }

const PAL = ['#29ADFF', '#FFA300', '#00E436', '#FF77A8', '#FFEC27', '#83769C', '#FF004D', '#C2C3C7'];
const num = (v: unknown, d: number) => (typeof v === 'number' && Number.isFinite(v) ? v : d);
const str = (v: unknown, n = 48) => (typeof v === 'string' ? v : typeof v === 'number' ? String(v) : v && typeof v === 'object' && 's' in v ? String((v as { s: unknown }).s ?? '') : '').slice(0, n);
const colorOf = (v: unknown, i: number) => {
  const c = v && typeof v === 'object' ? (v as { c?: unknown }).c : null;
  return typeof c === 'string' && /^#[0-9a-f]{3,8}$/i.test(c) ? c : PAL[i % PAL.length]!;
};
const list = (v: unknown, n: number) => (Array.isArray(v) ? v.slice(0, n) : []);

export function layoutSchema(c: Cmd, id: string): Laid | null {
  const A = { x: num(c.x, 8), y: num(c.y, 8), w: num(c.w, 304), h: num(c.h, 164) };
  A.x = Math.max(2, Math.min(A.x, 300)); A.y = Math.max(2, Math.min(A.y, 170));
  A.w = Math.max(40, Math.min(A.w, 318 - A.x)); A.h = Math.max(30, Math.min(A.h, 178 - A.y));
  const out: Laid = { cmds: [], parts: [], box: A };
  const add = (cmd: Cmd, d: number) => out.cmds.push({ c: cmd, d });
  const part = (pid: string, s: string) => out.parts.push([pid, s]);
  const type = String(c.type ?? '');
  const items = list(c.items, 10);
  const D = 420;

  if (type === 'cycle') {
    const n = Math.max(2, Math.min(8, items.length));
    if (items.length < 2) return null;
    // block size: neighboring blocks must not touch, so a small area gets smaller blocks
    let bw = Math.min(96, A.w / (n <= 4 ? 2.6 : 3.3)), bh = n > 6 ? 24 : 30, rx = 0, ry = 0;
    const cx = A.x + A.w / 2, cy = A.y + A.h / 2;
    const at = (i: number) => { const t = -Math.PI / 2 + (i * Math.PI * 2) / n; return [cx + Math.cos(t) * rx, cy + Math.sin(t) * ry, t] as const; };
    for (let k = 0; k < 30; k++) {
      rx = A.w / 2 - bw / 2 - 2; ry = A.h / 2 - bh / 2 - 2;
      const ok = Array.from({ length: n }, (_, i) => { const [x1, y1] = at(i), [x2, y2] = at((i + 1) % n); return Math.abs(x1 - x2) >= bw + 14 || Math.abs(y1 - y2) >= bh + 12; }).every(Boolean);
      if (ok) break;
      if (bh > 18) bh *= 0.92; else bw = Math.max(36, bw * 0.92);
    }
    const pos = at;
    for (let i = 0; i < n; i++) {
      const [x, y] = pos(i), s = str(items[i]);
      add({ op: 'box', id: `${id}.${i + 1}`, x: x - bw / 2, y: y - bh / 2, w: bw, h: bh, s, c: colorOf(items[i], i) }, i * D);
      part(`${id}.${i + 1}`, s);
      // arc to the next block: from this block's edge to the neighbor's edge, bulging outward from the circle's center
      const j = (i + 1) % n, [ax, ay] = pos(i), [bx, by] = pos(j);
      const edge = (px: number, py: number, qx: number, qy: number) => {
        // point on the border of block k (center px,py) in the direction of qx,qy
        const dx = qx - px, dy = qy - py, s = Math.min((bw / 2 + 3) / (Math.abs(dx) || 1e-6), (bh / 2 + 3) / (Math.abs(dy) || 1e-6));
        return [px + dx * s, py + dy * s] as const;
      };
      const [sx, sy] = edge(ax, ay, bx, by), [ex, ey] = edge(bx, by, ax, ay);
      const mx = (sx + ex) / 2, my = (sy + ey) / 2, ox = mx - cx, oy = my - cy, ol = Math.hypot(ox, oy) || 1, bend = Math.hypot(ex - sx, ey - sy) * 0.22;
      const qx = mx + (ox / ol) * bend, qy = my + (oy / ol) * bend, pts: number[][] = [];
      for (let k = 0; k <= 16; k++) { const t = k / 16; pts.push([(1 - t) ** 2 * sx + 2 * (1 - t) * t * qx + t * t * ex, (1 - t) ** 2 * sy + 2 * (1 - t) * t * qy + t * t * ey]); }
      if (Math.hypot(ex - sx, ey - sy) > 6) add({ op: 'path', id: `${id}.a${i + 1}`, pts, arrow: true, c: '#C2C3C7', lw: 1.6 }, i * D + D * 0.6);
    }
    if (typeof c.center === 'string' && c.center && rx - bw / 2 > 26 && ry - bh / 2 > 8) add({ op: 'text', id: `${id}.c`, x: cx, y: cy - 7, s: c.center.slice(0, 24), size: 1, align: 'center', c: '#FFF1E8', bold: true }, n * D);
    return out;
  }

  if (type === 'flow') {
    const n = items.length;
    if (n < 2) return null;
    const vert = c.dir === 'v' && n <= 5;
    const per = vert ? 1 : n <= 5 ? n : Math.ceil(n / 2), rows = vert ? n : Math.ceil(n / per);
    const gx = 18, gy = vert ? 14 : 22;
    const bw = vert ? Math.min(150, A.w * 0.7) : Math.min(110, (A.w - (per - 1) * gx) / per);
    const bh = Math.min(vert ? 30 : 40, (A.h - (rows - 1) * gy) / rows);
    const tw = per * bw + (per - 1) * gx, th = rows * bh + (rows - 1) * gy;
    const x0 = A.x + (A.w - tw) / 2, y0 = A.y + (A.h - th) / 2;
    const at = (i: number) => { const r = Math.floor(i / per), k = i % per, col = r % 2 ? per - 1 - k : k; return [x0 + col * (bw + gx), y0 + r * (bh + gy)] as const; };
    for (let i = 0; i < n; i++) {
      const [x, y] = at(i), s = str(items[i]);
      add({ op: 'box', id: `${id}.${i + 1}`, x, y, w: bw, h: bh, s, c: colorOf(items[i], i) }, i * D);
      part(`${id}.${i + 1}`, s);
      if (i + 1 < n) {
        const [nx, ny] = at(i + 1);
        const a = ny > y ? { x1: x + bw / 2, y1: y + bh + 2, x2: nx + bw / 2, y2: ny - 3 }
          : nx > x ? { x1: x + bw + 2, y1: y + bh / 2, x2: nx - 3, y2: ny + bh / 2 } : { x1: x - 2, y1: y + bh / 2, x2: nx + bw + 3, y2: ny + bh / 2 };
        add({ op: 'arrow', id: `${id}.a${i + 1}`, ...a, c: '#C2C3C7', lw: 1.6 }, i * D + D * 0.6);
      }
    }
    return out;
  }

  if (type === 'timeline') {
    const n = Math.min(8, items.length);
    if (n < 1) return null;
    const ly = A.y + A.h / 2, left = A.x + 16, right = A.x + A.w - 16;
    add({ op: 'arrow', id: `${id}.line`, x1: A.x + 2, y1: ly, x2: A.x + A.w - 2, y2: ly, c: '#C2C3C7', lw: 1.6 }, 0);
    const step = n > 1 ? (right - left) / (n - 1) : 0;
    const bw = Math.min(92, n > 2 ? step * 2 - 8 : A.w * 0.42, A.w / Math.ceil(n / 2) - 6), bh = Math.max(12, Math.min(40, A.h / 2 - 13));
    for (let i = 0; i < n; i++) {
      const it = items[i], x = n > 1 ? left + i * step : A.x + A.w / 2;
      const raw = typeof it === 'string' ? it : '';
      const t = it && typeof it === 'object' && 't' in it ? str((it as { t: unknown }).t, 14) : (/^([^:]{1,14}):\s*/.exec(raw)?.[1] ?? '');
      const s = it && typeof it === 'object' ? str(it) : raw.replace(/^[^:]{1,14}:\s*/, '').slice(0, 48);
      const up = i % 2 === 0, by = up ? ly - 10 - bh : ly + 10;
      const bx = Math.max(A.x, Math.min(A.x + A.w - bw, x - bw / 2));
      const d = 300 + i * D;
      add({ op: 'circle', id: `${id}.${i + 1}.dot`, x, y: ly, r: 2.6, c: colorOf(it, i), fill: true }, d);
      add({ op: 'line', id: `${id}.${i + 1}.tick`, x1: x, y1: up ? ly - 3 : ly + 3, x2: x, y2: up ? by + bh : by, c: colorOf(it, i), lw: 1 }, d + 80);
      if (t) add({ op: 'text', id: `${id}.${i + 1}.t`, x, y: up ? ly + 3 : ly - 12, s: t, size: 0, align: 'center', c: '#FFEC27', bold: true, place: false }, d + 120);
      if (s) add({ op: 'box', id: `${id}.${i + 1}`, x: bx, y: by, w: bw, h: bh, s, c: colorOf(it, i) }, d + 160);
      part(`${id}.${i + 1}`, [t, s].filter(Boolean).join(' — '));
    }
    return out;
  }

  if (type === 'compare') {
    const cols = items.slice(0, 3);
    if (cols.length < 2) return null;
    const k = cols.length, gx = 10, cw = (A.w - (k - 1) * gx) / k, hh = 24;
    cols.forEach((col, i) => {
      const o = (col && typeof col === 'object' ? col : {}) as { title?: unknown; points?: unknown };
      const x = A.x + i * (cw + gx), color = colorOf(col, i), title = str(o.title ?? col, 32);
      add({ op: 'box', id: `${id}.${i + 1}`, x, y: A.y, w: cw, h: hh, s: title, c: color, bg: color, alpha: 0.35, bold: true }, i * D);
      part(`${id}.${i + 1}`, title);
      const pts = list(o.points, 6), area = A.h - hh - 6, ph = Math.min(30, area / Math.max(1, pts.length));
      pts.forEach((p, j) => {
        const s = str(p, 60);
        add({ op: 'box', id: `${id}.${i + 1}.${j + 1}`, x, y: A.y + hh + 6 + j * ph, w: cw, h: ph - 3, s, c: color, frame: false, align: 'left', fs: 9 }, i * D + 250 + j * 220);
        part(`${id}.${i + 1}.${j + 1}`, s);
      });
    });
    return out;
  }

  if (type === 'table') {
    const head = list(c.head, 6).map((h) => str(h, 24));
    const rows = list(c.rows, 8).map((r) => list(r, 6).map((x) => str(x, 40)));
    const nc = Math.max(head.length, ...rows.map((r) => r.length));
    if (!nc || (!rows.length && !head.length)) return null;
    const nat = Array.from({ length: nc }, (_, j) => Math.max(30, textW(head[j] ?? '', 10, true) + 14, ...rows.map((r) => Math.min(120, textW(r[j] ?? '', 10) + 14))));
    const sum = nat.reduce((a, b) => a + b, 0), k = Math.min(1.6, A.w / sum);
    const cw = nat.map((w) => w * k), tw = cw.reduce((a, b) => a + b, 0);
    const nr = rows.length + (head.length ? 1 : 0), rh = Math.min(26, A.h / nr);
    const x0 = A.x + (A.w - tw) / 2, y0 = A.y + (A.h - nr * rh) / 2;
    const xs = cw.reduce<number[]>((a, w) => [...a, a.at(-1)! + w], [x0]);
    let r0 = 0;
    if (head.length) {
      head.forEach((s, j) => add({ op: 'box', id: `${id}.h.${j + 1}`, x: xs[j]!, y: y0, w: cw[j]!, h: rh, s, c: '#29ADFF', bg: '#29ADFF', alpha: 0.3, r: 0, bold: true }, j * 120));
      part(`${id}.h`, head.join(' | '));
      r0 = 1;
    }
    rows.forEach((r, i) => {
      for (let j = 0; j < nc; j++) add({ op: 'box', id: `${id}.r${i + 1}.${j + 1}`, x: xs[j]!, y: y0 + (i + r0) * rh, w: cw[j]!, h: rh, s: r[j] ?? '', c: '#C2C3C7', alpha: 0.06, r: 0 }, (i + 1) * D + j * 100);
      part(`${id}.r${i + 1}`, r.join(' | '));
    });
    return out;
  }

  if (type === 'tree') {
    interface N { s: string; kids: N[]; x: number; lvl: number; n: number; c: string }
    let count = 0;
    const norm = (v: unknown, lvl: number, ci: number): N | null => {
      if (count >= 20 || lvl > 3) return null;
      count++;
      const o = (v && typeof v === 'object' ? v : { s: v }) as { s?: unknown; kids?: unknown; children?: unknown };
      const node: N = { s: str(o.s ?? v), kids: [], x: 0, lvl, n: count, c: colorOf(v, ci) };
      for (const [k, kid] of list(o.kids ?? o.children, 6).entries()) { const m = norm(kid, lvl + 1, lvl === 0 ? k : ci); if (m) node.kids.push(m); }
      return node;
    };
    const root = norm(c.root ?? (items.length ? { s: c.s ?? '', kids: items } : null), 0, 0);
    if (!root) return null;
    let leaves = 0, depth = 0;
    const walk = (nd: N) => { depth = Math.max(depth, nd.lvl + 1); if (!nd.kids.length) nd.x = leaves++; else { nd.kids.forEach(walk); nd.x = (nd.kids[0]!.x + nd.kids.at(-1)!.x) / 2; } };
    walk(root);
    const slot = A.w / leaves, lh = A.h / depth, bh = Math.min(30, lh - 14);
    // block width follows the most crowded level (levels with fewer nodes get wider blocks)
    const bwOf = (nd: N) => {
      const same: N[] = [];
      const gather = (m: N) => { if (m.lvl === nd.lvl) same.push(m); m.kids.forEach(gather); };
      gather(root);
      const xs = same.map((m) => m.x).sort((a, b) => a - b), i = xs.indexOf(nd.x);
      const gap = Math.min(i > 0 ? nd.x - xs[i - 1]! : Infinity, i < xs.length - 1 ? xs[i + 1]! - nd.x : Infinity);
      const room = Number.isFinite(gap) ? gap * slot : A.w;
      return Math.min(110, room - 10, A.w - 4);
    };
    const X = (nd: N) => A.x + slot * (nd.x + 0.5), Yc = (nd: N) => A.y + lh * (nd.lvl + 0.5);
    const order: N[] = [];
    const q = [root];
    while (q.length) { const nd = q.shift()!; order.push(nd); q.push(...nd.kids); }
    order.forEach((nd, i) => {
      const bw = bwOf(nd);
      add({ op: 'box', id: `${id}.${i + 1}`, x: Math.max(A.x, Math.min(A.x + A.w - bw, X(nd) - bw / 2)), y: Yc(nd) - bh / 2, w: bw, h: bh, s: nd.s, c: nd.c, ...(nd.lvl === 0 ? { bg: nd.c, alpha: 0.3, bold: true } : {}) }, i * 330);
      part(`${id}.${i + 1}`, nd.s);
      nd.kids.forEach((kid) => {
        const x1 = X(nd), y1 = Yc(nd) + bh / 2, x2 = X(kid), y2 = Yc(kid) - bh / 2, my = (y1 + y2) / 2;
        add({ op: 'path', id: `${id}.l${kid.n}`, pts: [[x1, y1], [x1, my], [x2, my], [x2, y2]], c: '#C2C3C7', lw: 1.2 }, i * 330 + 200);
      });
    });
    return out;
  }

  if (type === 'venn') {
    const sets = list(c.sets, 3).map((s) => str(s, 24));
    if (sets.length < 2) return null;
    const cx = A.x + A.w / 2, cy = A.y + A.h / 2 + 7;
    const r = Math.min(A.h / 2 - 14, A.w / (sets.length === 2 ? 3.4 : 3.2));
    const joined = (v: unknown) => list(v, 5).map((x) => str(x, 24)).join('\n');
    if (sets.length === 2) {
      const d = r * 0.62;
      [[cx - d, sets[0]!, 0], [cx + d, sets[1]!, 1]].forEach(([x, s, i]) => {
        const n = i as number, color = PAL[n]!;
        add({ op: 'circle', id: `${id}.${n + 1}`, x: x as number, y: cy, r, c: color, fill: true, alpha: 0.22, stroke: color }, n * D);
        add({ op: 'text', id: `${id}.${n + 1}.t`, x: (x as number) + (n ? r * 0.35 : -r * 0.35), y: cy - r - 13, s: s as string, size: 1, align: 'center', c: color, bold: true, place: false }, n * D + 200);
        part(`${id}.${n + 1}`, s as string);
      });
      const zones: Array<[string, unknown, number, number]> = [['a', c.a, cx - d - r * 0.42, r * 0.85], ['ab', c.ab, cx, (r - d) * 1.5], ['b', c.b, cx + d + r * 0.42, r * 0.85]];
      zones.forEach(([k, v, x, w], i) => {
        const s = joined(v);
        if (!s) return;
        add({ op: 'box', id: `${id}.${k}`, x: x - w / 2, y: cy - r * 0.7, w, h: r * 1.4, s, c: '#FFF1E8', frame: false }, 2 * D + i * 300);
        part(`${id}.${k}`, s.replace(/\n/g, ', '));
      });
    } else {
      const d = r * 0.6;
      const ctr = [[cx, cy - d * 0.75], [cx - d * 0.85, cy + d * 0.45], [cx + d * 0.85, cy + d * 0.45]] as const;
      ctr.forEach(([x, y], n) => {
        const color = PAL[n]!;
        add({ op: 'circle', id: `${id}.${n + 1}`, x, y, r: r * 0.82, c: color, fill: true, alpha: 0.2, stroke: color }, n * D);
        const tx = n === 0 ? x : n === 1 ? x - r * 0.7 : x + r * 0.7, ty = n === 0 ? y - r * 0.82 - 13 : y + r * 0.82 - 4;
        add({ op: 'text', id: `${id}.${n + 1}.t`, x: tx, y: ty, s: sets[n]!, size: 1, align: 'center', c: color, bold: true, place: false }, n * D + 200);
        part(`${id}.${n + 1}`, sets[n]!);
      });
      const s = joined(c.abc ?? c.ab);
      if (s) { add({ op: 'box', id: `${id}.abc`, x: cx - r * 0.3, y: cy - r * 0.12, w: r * 0.6, h: r * 0.4, s, c: '#FFF1E8', frame: false }, 3 * D); part(`${id}.abc`, s); }
    }
    return out;
  }
  return null;
}
