import { describe, expect, it } from 'vitest';
import TokensGenerator from '../../src/tokens/tokenizer';

describe('Unmatched left bracket', () => {
    it('should throw for a program with an extra "["', () => {
        expect(() => {
            return new TokensGenerator('+++++[>+++++++>++<<-]>.>.[').generate();
        }).toThrowError(/number of brackets/i);
    });
});
