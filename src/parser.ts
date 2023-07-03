import type TokensGenerator from './tokens/tokenizer';
import { guard } from './type';

type NonBracketInstruction = Exclude<
    ReturnType<TokensGenerator['generate']>[0],
    {
        type: 'bracket';
        direction: 'left' | 'right';
        pairID: number;
    }
>;

type BracketInstruction = Readonly<{
    type: 'bracket';
    instructions: Instructions;
}>;

type Instruction = NonBracketInstruction | BracketInstruction;

type Instructions = ReadonlyArray<Instruction>;

type NonBracketNode = Readonly<{
    parser: Parser;
    instruction: NonBracketInstruction;
}>;

type BracketNode = Readonly<{
    parser: Parser;
    instruction: BracketInstruction;
}>;

type Nodes = ReturnType<Parser['generate']>;

export default class Parser {
    constructor(
        private readonly tokens: ReturnType<TokensGenerator['generate']>
    ) {}

    private readonly firstToken = () =>
        guard({
            value: this.tokens.at(0),
            error: () => new Error('There should be at least one token'),
        });

    private readonly removeUsedTokens = (end: number) => {
        return {
            usedTokens: this.tokens.slice(0, end),
            parser: new Parser(this.tokens.slice(end)),
        };
    };

    private readonly nonBracket = (
        token: NonBracketInstruction
    ): NonBracketNode => {
        const result = this.removeUsedTokens(1);

        return {
            instruction: token,
            parser: result.parser,
        };
    };

    private readonly bracket = (
        leftBracket: Readonly<{
            type: 'bracket';
            direction: 'left';
            pairID: number;
        }>
    ): BracketNode => {
        const matcingBracketPair = this.tokens.flatMap((token, index) =>
            !(token.type === 'bracket' && token.pairID === leftBracket.pairID)
                ? []
                : [{ ...token, index }]
        );

        if (matcingBracketPair.length !== 2) {
            throw new Error(
                'MatcingBracketPair should return left and right pair with matching pairID'
            );
        }

        const right = guard({
            value: matcingBracketPair.at(1),
            error: () => new Error('There should be matching right bracket'),
        });

        const result = this.removeUsedTokens(right.index + 1);

        const tokens = result.usedTokens.slice(1, -1);

        return {
            parser: result.parser,
            instruction: {
                type: 'bracket',
                instructions: new Parser(tokens).generate(),
            },
        };
    };

    private readonly processToken = () => {
        const token = this.firstToken();

        if (token.type !== 'bracket') {
            return this.nonBracket(token);
        }

        const { direction } = token;

        if (direction === 'right') {
            throw new Error('Right bracket should be removed by now');
        }

        return this.bracket({ ...token, direction });
    };

    private readonly recursively = (
        params: Readonly<{
            parser: Parser;
            instructions: Instructions;
        }>
    ): Instructions => {
        if (!params.parser.tokens.length) {
            return params.instructions;
        }

        const result = params.parser.processToken();

        return params.parser.recursively({
            parser: result.parser,
            instructions: params.instructions.concat(result.instruction),
        });
    };

    readonly generate = () => {
        return this.recursively({ instructions: [], parser: this });
    };
}

export type { Nodes };
