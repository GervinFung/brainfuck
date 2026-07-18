import { describe, expect, it } from 'vitest';
import MemoryBlock from '../../src/memory';

describe('MemoryBlock cell sizes', () => {
    it('should wrap 8/16/32 bit cells at their max value', () => {
        (
            [
                [8, 255],
                [16, 65_535],
                [32, 4_294_967_295],
            ] as const
        ).forEach(([cellSize, max]) => {
            const memory = MemoryBlock.create({ cellSize, length: 4 });

            memory.add(0, -1);
            expect(memory.at(0)).toBe(max);

            memory.add(0, 1);
            expect(memory.at(0)).toBe(0);
        });
    });

    it('should wrap 64 bit cells with bigint precision', () => {
        const memory = MemoryBlock.create({ cellSize: 64, length: 4 });

        memory.add(0, -1);
        expect(memory.at(0)).toBe(18_446_744_073_709_551_615n);

        memory.add(0, 1);
        expect(memory.at(0)).toBe(0n);
    });

    it('should output the lowest byte of a cell', () => {
        const memory = MemoryBlock.create({ cellSize: 32, length: 1 });
        memory.set(0, 0x12_34);
        expect(memory.byte(0)).toBe(0x34);

        const bigMemory = MemoryBlock.create({ cellSize: 64, length: 1 });
        bigMemory.set(0, 0x12_34);
        expect(bigMemory.byte(0)).toBe(0x34);
    });

    it('should clear and report zero cells', () => {
        const memory = MemoryBlock.create({ cellSize: 64, length: 1 });
        expect(memory.isZero(0)).toBe(true);

        memory.add(0, 2);
        expect(memory.isZero(0)).toBe(false);

        memory.clear(0);
        expect(memory.isZero(0)).toBe(true);
    });

    it('should grow while preserving values and cell size', () => {
        const memory = MemoryBlock.create({ cellSize: 16, length: 2 });
        memory.add(1, 500);

        const grown = memory.grow(9);
        expect(grown.length()).toBe(16);
        expect(grown.at(1)).toBe(500);
        expect(grown.at(9)).toBe(0);

        expect(memory.grow(1)).toBe(memory);
    });
});
