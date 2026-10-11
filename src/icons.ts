// Copyright 2026 UpBilim
// SPDX-License-Identifier: Apache-2.0
// Ready-made board icons (vector): the AI only places them, the board draws them. Each icon is designed on a
// 16×16 grid but drawn with smooth lines, and appears part by part.
import { ellipsePts, rectPts, type Pen } from './pen';

const K = '#000000', WH = '#FFF1E8', Y = '#FFEC27', O = '#FFA300', R = '#FF004D', PK = '#FF77A8', GN = '#008751', LM = '#00E436',
  SK = '#29ADFF', NV = '#1D2B53', LG = '#C2C3C7', GR = '#5F574F', BR = '#AB5236', PE = '#FFCCAA', LV = '#83769C', PL = '#7E2553';

export const ICONS = ['ball', 'sun', 'cloud', 'drop', 'tree', 'house', 'star', 'heart', 'apple', 'planet', 'moon', 'person', 'book', 'bulb', 'flask', 'mountain', 'fish', 'flower', 'battery', 'car', 'bus'] as const;

// (x, y) is the center, s the size; c the main color (to override the default)
export function icon(pen: Pen, name: string, x: number, y: number, s: number, c: string | null) {
  const u = s / 16;
  const X = (px: number) => x - s / 2 + px * u, Yy = (py: number) => y - s / 2 + py * u;
  const E = (px: number, py: number, rx: number, ry: number, cc: string, fill = true) =>
    fill ? pen.fill(ellipsePts(X(px), Yy(py), rx * u, ry * u), cc) : pen.line(ellipsePts(X(px), Yy(py), rx * u, ry * u), cc, Math.max(0.8, u));
  const B = (px: number, py: number, w: number, h: number, cc: string, r = 0) => pen.fill(rectPts(X(px), Yy(py), w * u, h * u, r * u), cc);
  const G = (pts: Array<[number, number]>, cc: string) => pen.fill(pts.flatMap(([a, b]) => [X(a), Yy(b)]), cc);
  const L = (a: [number, number], b: [number, number], cc: string, w = 1) => pen.line([X(a[0]), Yy(a[1]), X(b[0]), Yy(b[1])], cc, Math.max(0.8, w * u));
  switch (name) {
    case 'ball':
      E(8, 8, 7, 7, c ?? LG); E(9.5, 9.5, 4.5, 4.5, c ? PL : GR); E(8, 8, 6.2, 6.2, c ?? LG); E(5.6, 5.4, 1.8, 1.6, WH); return;
    case 'sun':
      for (let i = 0; i < 8; i++) { const a = (i * Math.PI) / 4; L([8 + Math.cos(a) * 5.6, 8 + Math.sin(a) * 5.6], [8 + Math.cos(a) * 7.8, 8 + Math.sin(a) * 7.8], c ?? O, 1.2); }
      E(8, 8, 4.6, 4.6, c ?? Y); E(6.8, 6.8, 1.4, 1.4, WH); return;
    case 'cloud':
      E(5, 10, 3.5, 3, c ?? LG); E(8.5, 7.5, 4.2, 4, c ?? LG); E(12, 10, 3.5, 3, c ?? LG); B(4, 10, 8.5, 3, c ?? LG); E(8, 6.2, 2, 1.4, WH); return;
    case 'drop':
      G([[8, 1.5], [12.2, 9], [3.8, 9]], c ?? SK); E(8, 10.5, 4.3, 4.3, c ?? SK); E(6.4, 10, 1, 1.6, WH); return;
    case 'tree':
      B(6.8, 9, 2.4, 6.5, BR); E(8, 6.5, 6, 5.5, c ?? GN); E(6, 5, 2.2, 1.8, LM); return;
    case 'house':
      B(3, 7.5, 10, 7.5, c ?? PE); G([[1.5, 8], [8, 2], [14.5, 8]], R); B(6.8, 10.5, 2.6, 4.5, BR); B(4.2, 9, 2, 2, SK); B(10, 9, 2, 2, SK); return;
    case 'star': {
      const pts: Array<[number, number]> = [];
      for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5, r = i % 2 ? 3 : 7.5; pts.push([8 + Math.cos(a) * r, 8.5 + Math.sin(a) * r]); }
      G(pts, c ?? Y); return;
    }
    case 'heart':
      E(5.3, 6, 3.3, 3.3, c ?? R); E(10.7, 6, 3.3, 3.3, c ?? R); G([[2.2, 7], [13.8, 7], [8, 14]], c ?? R); E(4.5, 5, 1, 1, PK); return;
    case 'apple':
      E(8, 9.5, 5.5, 5, c ?? R); L([8, 5], [8.6, 2], BR, 1); E(10.5, 3, 2, 1, LM); E(6, 8, 1.2, 1.6, PK); return;
    case 'planet':
      E(8, 8, 4.8, 4.8, c ?? O); E(8, 8, 7.8, 2.2, c ? LG : Y, false); E(6.5, 6.5, 1.3, 1.1, Y); return;
    case 'moon':
      E(8, 8, 6, 6, c ?? Y); E(10.5, 6.5, 5, 5, NV); return;
    case 'car':
      B(1, 8, 14, 4, c ?? R, 1); G([[3.6, 8.2], [5.4, 4.4], [10.6, 4.4], [12.8, 8.2]], c ?? R);
      G([[5.2, 7.8], [6.2, 5.2], [7.8, 5.2], [7.8, 7.8]], SK); G([[8.6, 7.8], [8.6, 5.2], [10.2, 5.2], [11.6, 7.8]], SK);
      B(14, 8.8, 1, 1.2, Y); B(1, 8.8, 0.8, 1.2, R);
      E(4.5, 12.3, 2.1, 2.1, K); E(11.5, 12.3, 2.1, 2.1, K); E(4.5, 12.3, 0.8, 0.8, LG); E(11.5, 12.3, 0.8, 0.8, LG); return;
    case 'bus':
      B(0.8, 3.5, 14.4, 9, c ?? Y, 1); for (let i = 0; i < 4; i++) B(1.8 + i * 3, 4.8, 2.3, 2.8, SK, 0.3);
      B(13.3, 4.8, 1.3, 6.6, GR); B(0.8, 9, 14.4, 0.8, O);
      E(4, 12.8, 1.9, 1.9, K); E(12, 12.8, 1.9, 1.9, K); E(4, 12.8, 0.7, 0.7, LG); E(12, 12.8, 0.7, 0.7, LG); return;
    case 'person':
      E(8, 3.8, 2.6, 2.6, PE); B(5, 7, 6, 5, c ?? SK, 1); B(5.5, 12, 2, 3.5, NV); B(8.5, 12, 2, 3.5, NV); B(3.6, 7.3, 1.5, 4, c ?? SK, 0.6); B(10.9, 7.3, 1.5, 4, c ?? SK, 0.6); return;
    case 'book':
      B(2, 4, 12, 9, c ?? PL, 0.6); B(3, 5, 5, 7, WH); B(8, 5, 5, 7, WH); B(7.6, 4, 0.8, 9, c ?? PL);
      for (let i = 0; i < 3; i++) { B(3.8, 6.5 + i * 1.6, 3.4, 0.6, LG); B(8.8, 6.5 + i * 1.6, 3.4, 0.6, LG); } return;
    case 'bulb':
      E(8, 6.5, 4.6, 4.6, c ?? Y); B(6, 10.2, 4, 2.5, c ?? Y); B(6, 12.5, 4, 2.4, GR, 0.4); B(6.8, 14.9, 2.4, 0.9, GR); E(6.4, 5, 1.2, 1.4, WH); return;
    case 'flask':
      B(6.5, 1.5, 3, 5.5, LG); G([[6.5, 7], [9.5, 7], [14, 14.5], [2, 14.5]], LG); G([[4.6, 10.5], [11.4, 10.5], [13.2, 13.8], [2.8, 13.8]], c ?? LM); E(7, 12, 0.8, 0.8, WH); return;
    case 'mountain':
      G([[0.5, 15], [6, 4], [11.5, 15]], c ?? GR); G([[5, 15], [10.5, 7], [15.5, 15]], LV); G([[4.4, 7.2], [6, 4], [7.6, 7.2]], WH); return;
    case 'fish':
      E(7, 8, 5.2, 3.6, c ?? O); G([[11.5, 8], [15, 4.5], [15, 11.5]], c ?? O); E(4.3, 7.2, 0.9, 0.9, K); L([8, 5.2], [8, 10.8], PK, 0.7); return;
    case 'flower':
      B(7.4, 8, 1.2, 7.5, GN); E(5, 12, 2, 1, LM);
      for (let i = 0; i < 6; i++) { const a = (i * Math.PI) / 3; E(8 + Math.cos(a) * 3, 6 + Math.sin(a) * 3, 2, 2, c ?? PK); }
      E(8, 6, 1.8, 1.8, Y); return;
    case 'battery':
      B(2, 5, 11, 7, GR, 0.8); B(13, 7, 1.6, 3, GR); B(3, 6, 6, 5, c ?? LM); B(9, 6, 3, 5, NV); return;
    default:
      E(8, 8, 6, 6, c ?? LV); return;
  }
}
