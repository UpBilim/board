export { ICONS } from './icons';
export declare const W = 320, H = 180;
export type Cmd = Record<string, unknown> & {
    op: string;
};
export declare class Board {
    private canvas;
    private onTitle;
    private out;
    private bg;
    private items;
    private labels;
    private highlights;
    private pointer;
    private sys;
    private lastSys;
    private groups;
    private steps;
    private pics;
    private title;
    private instant;
    private raf;
    private idle;
    private seq;
    private after;
    constructor(canvas: HTMLCanvasElement, onTitle?: (s: string) => void);
    destroy(): void;
    /** Draw instantly, without the appear animation (e.g. when joining a lesson whose board is already drawn). */
    drawAll(cmds: Cmd[]): void;
    private loop;
    private wake;
    private compose;
    private marker;
    private transform;
    private parseAnim;
    clear(bg?: string): void;
    private find;
    /** A teacher command. */
    draw(c: Cmd): void;
    private exec;
    private add;
    private sysOf;
    private mapPt;
    private mapCmd;
    private place;
    private fit;
    private paint;
    private pts;
    private pointerLine;
    private axes;
    private numberline;
    private plot;
    private interval;
    private step;
    private schema;
    private mark;
    private composite;
    private addPic;
    private layoutPics;
    /** What is on the board now, in brief for the AI: names, what each is, where (x,y w×h), labels; coordinate systems; free space. */
    scene(): string;
    private free;
}
