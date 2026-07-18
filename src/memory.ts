type CellSize = 8 | 16 | 32 | 64;

type Cells = Uint8Array | Uint16Array | Uint32Array | BigUint64Array;

export default class MemoryBlock {
    private constructor(
        private readonly cellSize: CellSize,
        private readonly cells: Cells
    ) {}

    static readonly create = (
        param: Readonly<{
            cellSize: CellSize;
            length: number;
        }>
    ) => {
        return new MemoryBlock(param.cellSize, MemoryBlock.allocate(param));
    };

    private static readonly allocate = (
        param: Readonly<{
            cellSize: CellSize;
            length: number;
        }>
    ): Cells => {
        switch (param.cellSize) {
            case 8: {
                return new Uint8Array(param.length);
            }
            case 16: {
                return new Uint16Array(param.length);
            }
            case 32: {
                return new Uint32Array(param.length);
            }
            case 64: {
                return new BigUint64Array(param.length);
            }
        }
    };

    readonly length = () => {
        return this.cells.length;
    };

    readonly at = (index: number): number | bigint => {
        const { cells } = this;
        return cells instanceof BigUint64Array
            ? cells.at(index) ?? 0n
            : cells.at(index) ?? 0;
    };

    readonly isZero = (index: number) => {
        return !this.cells.at(index);
    };

    readonly byte = (index: number) => {
        const value = this.at(index);
        return typeof value === 'bigint' ? Number(value & 0xffn) : value & 0xff;
    };

    readonly add = (index: number, value: number) => {
        const { cells } = this;
        if (cells instanceof BigUint64Array) {
            cells[index] = (cells.at(index) ?? 0n) + BigInt(value);
        } else {
            cells[index] = (cells.at(index) ?? 0) + value;
        }
    };

    readonly set = (index: number, value: number) => {
        const { cells } = this;
        if (cells instanceof BigUint64Array) {
            cells[index] = BigInt(value);
        } else {
            cells[index] = value;
        }
    };

    readonly clear = (index: number) => {
        this.set(index, 0);
    };

    private readonly grownCells = (length: number): Cells => {
        const { cells } = this;
        if (cells instanceof BigUint64Array) {
            const grown = new BigUint64Array(length);
            grown.set(cells);
            return grown;
        }
        if (cells instanceof Uint32Array) {
            const grown = new Uint32Array(length);
            grown.set(cells);
            return grown;
        }
        if (cells instanceof Uint16Array) {
            const grown = new Uint16Array(length);
            grown.set(cells);
            return grown;
        }
        const grown = new Uint8Array(length);
        grown.set(cells);
        return grown;
    };

    readonly grow = (pointer: number): MemoryBlock => {
        if (pointer < this.cells.length) {
            return this;
        }

        const grownLength = (length: number): number => {
            return length > pointer ? length : grownLength(length * 2);
        };

        return new MemoryBlock(
            this.cellSize,
            this.grownCells(grownLength(this.cells.length))
        );
    };
}

export type { CellSize };
