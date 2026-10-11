type Fn = (x: number) => number;
export declare function compile(src: string): Fn | null;
/** A "nice" axis tick step: 1, 2, 5 × 10ⁿ. */
export declare function niceStep(range: number, ticks?: number): number;
/** Axis number label: no trailing zeros, a real minus sign. */
export declare const fmtNum: (v: number) => string;
export {};
