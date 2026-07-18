import type { CellSize } from './memory';

export default class Guardian {
    private readonly range: Readonly<{
        min: number;
        max: number;
    }>;

    constructor(cellSize: CellSize = 8) {
        this.range = {
            min: 0,
            max: 2 ** cellSize - 1,
        };
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
}
