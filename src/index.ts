import Tokenizer from './tokens/tokenizer';
import Parser from './parser';
import InterpreterRunner from './interpreter/runner';
import Optimizer from './optimizer';
import type { CellSize } from './memory';

const Brainfuck = {
    execute: async (
        code: string,
        options?: Readonly<{
            cellSize?: CellSize;
            input?: string;
        }>
    ) => {
        const tokens = new Tokenizer(code).generate();
        const nodes = new Parser(tokens).generate();
        const optimized = new Optimizer(nodes).generate();
        const run = await new InterpreterRunner(optimized, options).run();
        return run;
    },
};

export type { CellSize };
export default Brainfuck;
