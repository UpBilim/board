type Cmd = Record<string, unknown> & {
    op: string;
};
export interface Laid {
    cmds: Array<{
        c: Cmd;
        d: number;
    }>;
    parts: Array<[string, string]>;
    box: {
        x: number;
        y: number;
        w: number;
        h: number;
    };
}
export declare function layoutSchema(c: Cmd, id: string): Laid | null;
export {};
