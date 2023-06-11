import type TokensGenerator from './tokens/tokenizer';
import { guard } from './type';

type NonBracket = Exclude<
    ReturnType<TokensGenerator['generate']>[0],
    {
        type: 'bracket';
        direction: 'left' | 'right';
        pairID: number;
    }
>;

type Operation = NonBracket | Bracket;

type Bracket = Readonly<{
    type: 'bracket';
    operations: ReadonlyArray<Operation>;
}>;

type Nodes = ReturnType<Parser['generate']>;

export default class Parser {
    constructor(private tokens: ReturnType<TokensGenerator['generate']>) {}

    private readonly firstToken = () =>
        guard({
            value: this.tokens.at(0),
            error: () => new Error('There should be at least one token'),
        });

    private readonly removeUsedToken = () =>
        guard({
            value: this.removeUsedTokens(1).at(0),
            error: () => new Error('There should be at least one token'),
        });

    private readonly removeUsedTokens = (end: number) => {
        const tokens = this.tokens.slice(0, end);
        this.tokens = this.tokens.slice(end);
        return tokens;
    };

    private readonly nonBracket = (token: NonBracket): NonBracket => {
        this.removeUsedToken();
        return token;
    };

    private readonly bracket = (
        leftBracket: Readonly<{
            type: 'bracket';
            direction: 'left';
            pairID: number;
        }>
    ): Bracket => {
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

        const operations = this.removeUsedTokens(right.index + 1).slice(1, -1);

        return {
            type: 'bracket',
            operations: new Parser(operations).generate(),
        };
    };

    private readonly processToken = () => {
        const token = this.firstToken();

        if (token.type !== 'bracket') {
            return this.nonBracket(token);
        }

        const { direction, ...rest } = token;

        if (direction === 'right') {
            throw new Error('Right bracket should be removed by now');
        }

        return this.bracket({ ...rest, direction: 'left' });
    };

    readonly generate = () => {
        if (this.tokens.length === 1) {
            return this.tokens as Bracket['operations'];
        }

        const nodes = [] as Array<Operation>;

        while (this.tokens.length) {
            nodes.push(this.processToken());
        }

        return nodes;
    };
}

export type { Nodes };
