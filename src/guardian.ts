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

    readonly pointerWithinRange = (pointer: number) => pointer >= 0;

    readonly getRangeMax = () => this.range.max;

    readonly getRangeMin = () => this.range.min;

    readonly memoryBlock = (
        param: Readonly<{
            pointer: number;
            memoryBlock: Uint8Array;
        }>
    ) => {
        if (param.pointer < param.memoryBlock.length) {
            return param.memoryBlock;
        }

        const grownLength = (length: number): number =>
            length > param.pointer ? length : grownLength(length * 2);

        const memoryBlock = new Uint8Array(
            grownLength(param.memoryBlock.length)
        );
        memoryBlock.set(param.memoryBlock);

        return memoryBlock;
    };
}
