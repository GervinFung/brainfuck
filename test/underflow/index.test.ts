import { describe, expect, it } from 'vitest';
import TokensGenerator from '../../src/tokens/tokenizer';
import Optimizer from '../../src/optimizer';
import Parser from '../../src/parser';
import InterpreterRunner from '../../src/interpreter/runner';

describe('Pointer underflow', () => {
    it('should reject when the pointer moves below cell 0', async () => {
        const tokens = new TokensGenerator('<.').generate();
        const nodes = new Parser(tokens).generate();
        const optimized = new Optimizer(nodes).generate();

        await expect(
            new InterpreterRunner(optimized).run()
        ).rejects.toThrowError(/pointer/i);
    });
});
