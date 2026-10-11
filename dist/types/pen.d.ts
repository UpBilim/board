import type { TBox } from './tex';
export type Box = {
    x: number;
    y: number;
    w: number;
    h: number;
};
interface Base {
    o: number;
    a: number;
    b: number;
}
export type Prim = Base & ({
    k: 'line';
    pts: number[];
    c: string;
    w: number;
    dash: boolean;
    len: number;
    path?: Path2D;
} | {
    k: 'fill';
    pts: number[];
    c: string;
    path?: Path2D;
} | {
    k: 'text';
    s: string;
    x: number;
    y: number;
    size: number;
    c: string;
    w: number;
    outline: boolean;
    bold: boolean;
    align: 'left' | 'center';
} | {
    k: 'tex';
    bx: TBox;
    x: number;
    y: number;
    c: string;
} | {
    k: 'img';
    img: HTMLImageElement | null;
    x: number;
    y: number;
    w: number;
    h: number;
});
type Dist<T> = T extends unknown ? Omit<T, 'o' | 'a' | 'b'> : never;
export type PrimIn = Dist<Prim>;
export declare const SANS = "\"Inter\", system-ui, sans-serif";
export declare const textW: (s: string, size: number, bold?: boolean) => number;
export declare const lwOf: (v: unknown) => number;
/** Color with alpha: #RGB / #RRGGBB → rgba(). */
export declare function alpha(hex: string, a: number): string;
export declare const ellipsePts: (cx: number, cy: number, rx: number, ry: number, a0?: number, a1?: number, wob?: number) => number[];
export declare const rectPts: (x: number, y: number, w: number, h: number, r?: number) => number[];
export declare class Pen {
    prims: Prim[];
    private seq;
    push(p: PrimIn, o?: number): void;
    line(pts: number[], c: string, w?: number, dash?: boolean): void;
    fill(pts: number[], c: string): void;
    shape(pts: number[], o: {
        fill?: string | null;
        stroke?: string | null;
        w?: number;
        dash?: boolean;
    }): void;
    arrowHead(x1: number, y1: number, x2: number, y2: number, c: string, w: number): void;
    text(s: string, x: number, y: number, size: number, c: string, o?: {
        outline?: boolean;
        bold?: boolean;
        align?: 'left' | 'center';
    }): number;
    tex(b: TBox, x: number, baseline: number, c: string): void;
    img(img: HTMLImageElement | null, x: number, y: number, w: number, h: number): void;
}
/** Lay out parts in time (a..b is the fraction of the whole object's drawing); return the total "weight". */
export declare function timeline(prims: Prim[]): number;
/** Bounding box of all parts. */
export declare function bounds(prims: Prim[]): Box | null;
/** Draw the object's parts at progress p (0..1). Returns the "marker tip": where drawing is happening now. */
export declare function paint(g: CanvasRenderingContext2D, prims: Prim[], p: number): [number, number] | null;
export {};
