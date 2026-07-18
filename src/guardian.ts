export default class Guardian {
    private readonly range: Readonly<{
        min: 0;
        max: 255;
    }>;

    constructor() {
        this.range = {
            min: 0,
            max: 255,
        } as const;
    }

    readonly pointerWithinRange = (pointer: number) => {
        return pointer >= 0;
    };

    readonly getRangeMax = () => {
        return this.range.max;
    };

    readonly getRangeMin = () => {
        return this.range.min;
    };

    readonly memoryBlock = (
        param: Readonly<{
            pointer: number;
            memoryBlock: Uint8Array;
        }>
    ) => {
        if (param.pointer < param.memoryBlock.length) {
            return param.memoryBlock;
        }

        const grownLength = (length: number): number => {
            return length > param.pointer ? length : grownLength(length * 2);
        };

        const memoryBlock = new Uint8Array(
            grownLength(param.memoryBlock.length)
        );
        memoryBlock.set(param.memoryBlock);

        return memoryBlock;
    };
}
