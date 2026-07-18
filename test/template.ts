import fs from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';
import TokensGenerator from '../src/tokens/tokenizer';
import Optimizer from '../src/optimizer';
import Parser from '../src/parser';
import InterpreterRunner from '../src/interpreter/runner';
import type { CellSize } from '../src/memory';

const template = (
    param: Readonly<{
        dirName: string;
        codeName?: string;
        cellSize?: CellSize;
        input?: string;
    }>
) => {
    return describe('Tokens Generator -> Constant Folder -> Node -> Interpreter', () => {
        const testFileName = param.dirName.split(path.sep).at(-1);

        const code = fs.readFileSync(
            path.join('test', 'codes', `${param.codeName ?? testFileName}.bf`),
            {
                encoding: 'utf-8',
            }
        );

        describe('On the fly interpreter', () => {
            const join = (...paths: ReadonlyArray<string>) => {
                return path.join('snapshot', ...paths);
            };

            it(`should tokenize, constant fold, generate node and interpret "${testFileName}" code`, async () => {
                const tokens = new TokensGenerator(code).generate();
                expect(tokens).toMatchFileSnapshot(join('tokenizer.json'));

                const nodes = new Parser(tokens).generate();
                expect(nodes).toMatchFileSnapshot(join('parser.json'));

                const optimized = new Optimizer(nodes).generate();
                expect(optimized).toMatchFileSnapshot(join('optimized.json'));

                const result = await new InterpreterRunner(optimized, {
                    cellSize: param.cellSize,
                    input: param.input,
                }).run();
                expect(result).toMatchFileSnapshot(join('result'));
            });
        });
    });
};

export default template;
