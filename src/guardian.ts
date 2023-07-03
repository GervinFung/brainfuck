export default class Guardian {
    private readonly maxMemoryBlock: number;

    private readonly range: Readonly<{
        min: 0;
        max: 255;
    }>;

    constructor() {
        this.maxMemoryBlock = 30_000;
        this.range = {
            min: 0,
            max: 255,
        } as const;
    }

    readonly pointerWithinRange = (pointer: number) =>
        pointer >= 0 && pointer <= this.maxMemoryBlock;

    readonly getRangeMax = () => this.range.max;

    readonly getRangeMin = () => this.range.min;

    readonly memoryBlock = (
        param: Readonly<{
            pointer: number;
            memoryBlock: Uint8Array;
        }>
    ) => {
        if (param.pointer <= param.memoryBlock.length) {
            return param.memoryBlock;
        }

        const oldMemoryBlock = param.memoryBlock;

        const memoryBlock = new Uint8Array(param.memoryBlock.length * 2);
        memoryBlock.set(oldMemoryBlock);

        return memoryBlock;
    };
}
