import Tokenizer from './tokens/tokenizer';
import Parser from './parser';
import InterpreterRunner from './interpreter/runner';
import Optimizer from './optimizer';

const Brainfuck = {
    execute: async (code: string) => {
        const tokens = new Tokenizer(code).generate();
        const nodes = new Parser(tokens).generate();
        const optimized = new Optimizer(nodes).generate();
        const run = await new InterpreterRunner(optimized).run();
        return run;
    },
};

export default Brainfuck;
