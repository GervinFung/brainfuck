import { describe, expect, it } from 'vitest';
import Brainfuck from '../../src';

describe('Injected input', () => {
    it('should read one character', async () => {
        const result = await Brainfuck.execute(',.', { input: 'A' });
        expect(result).toBe('A');
    });

    it('should read characters in order', async () => {
        const result = await Brainfuck.execute(',>,.<.', { input: 'AB' });
        expect(result).toBe('BA');
    });

    it('should keep the last character of fused commas', async () => {
        const result = await Brainfuck.execute(',,,.', { input: 'ABC' });
        expect(result).toBe('C');
    });

    it('should leave the cell unchanged on exhausted input', async () => {
        const result = await Brainfuck.execute('+++,.', { input: '' });
        expect(result.charCodeAt(0)).toBe(3);
    });

    it('should read input regardless of cell size', async () => {
        const result = await Brainfuck.execute(',.', {
            input: 'A',
            cellSize: 32,
        });
        expect(result).toBe('A');
    });
});
