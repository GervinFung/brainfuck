import fs from 'fs';
import { describe, expect, it } from 'vitest';
import TokensGenerator from '../src/tokens/tokenizer';
import Optimizer from '../src/optimizer';
import Parser from '../src/parser';
import InterpreterRunner from '../src/interpreter/runner';

const template = (
    param: Readonly<{
        testFileName: string;
    }>
) =>
    describe('Tokens Generator -> Constant Folder -> Node -> Interpreter', () => {
        const helloWorldCode = fs.readFileSync(
            `test/codes/${param.testFileName}.bf`,
            {
                encoding: 'utf-8',
            }
        );
        describe('On the fly interpreter', () => {
            const snapshot = `snapshot/`;
            it(`should tokenize, constant fold, generate node and interpret "${param.testFileName}" code`, async () => {
                const tokens = new TokensGenerator(helloWorldCode).generate();
                expect(tokens).toMatchFileSnapshot(`${snapshot}tokenizer.json`);

                const nodes = new Parser(tokens).generate();
                expect(nodes).toMatchFileSnapshot(`${snapshot}parser.json`);

                const optimized = new Optimizer(nodes).generate();
                expect(optimized).toMatchFileSnapshot(
                    `${snapshot}optimized.json`
                );

                const result = await new InterpreterRunner(optimized).run();
                expect(result).toMatchFileSnapshot(`${snapshot}result`);
            });
        });
    });

export default template;
