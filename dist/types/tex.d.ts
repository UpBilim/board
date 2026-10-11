export interface TBox {
    w: number;
    h: number;
    d: number;
    cls?: Cls;
    draw(g: CanvasRenderingContext2D, x: number, y: number, c: string): void;
}
type Cls = 'ord' | 'bin' | 'rel' | 'open' | 'close' | 'punct' | 'op' | 'space';
/** Formula → box (size is the font height in board units). */
export declare function tex(s: string, size: number): TBox;
/** Split "left = right" at the first "=" outside brackets (for aligning solution steps). */
export declare function splitEq(s: string): [string, string] | null;
export {};
