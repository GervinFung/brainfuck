import { describe, expect, it } from 'vitest';
import Brainfuck from '../../src';

describe('Cell wrap through the whole pipeline', () => {
    ([8, 16, 32, 64] as const).forEach((cellSize) => {
        it(`should wrap below zero to the max value for ${cellSize} bit cells`, async () => {
            const result = await Brainfuck.execute('-.', { cellSize });
            expect(result.charCodeAt(0)).toBe(255);
        });

        it(`should wrap back to zero for ${cellSize} bit cells`, async () => {
            const result = await Brainfuck.execute('-+.', { cellSize });
            expect(result.charCodeAt(0)).toBe(0);
        });
    });
});
