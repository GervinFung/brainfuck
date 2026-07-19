import Tokenize from './tokenize';

class BracketIndexStack {
    constructor(private readonly store: number[]) {}

    readonly last = () => {
        return this.store.at(-1) ?? -1;
    };

    readonly push = (t: number) => {
        return new BracketIndexStack(this.store.concat(t));
    };

    readonly pop = () => {
        return new BracketIndexStack(this.store.slice(0, -1));
    };
}

export default class Tokenizer {
    private readonly charactersFromCode: ReadonlyArray<string>;

    constructor(code: string) {
        this.charactersFromCode = code.split('');
    }

    readonly generate = () => {
        const oldTokens = this.charactersFromCode
            .map((character) => {
                return new Tokenize(character).token();
            })
            .flatMap((token) => {
                return token.type === 'comment' ? [] : [token];
            });

        type Tokens = ReadonlyArray<
            | Exclude<
                  (typeof oldTokens)[0],
                  { type: 'bracket'; direction: 'left' | 'right' }
              >
            | Readonly<{
                  type: 'bracket';
                  direction: 'left' | 'right';
                  pairID: number;
              }>
        >;

        const tokens = [] as Array<Tokens[number]>;
        let bracketStack = new BracketIndexStack([]);
        let leftBracketCount = 0;

        for (const token of oldTokens) {
            switch (token.type) {
                case 'bracket': {
                    tokens.push({
                        ...token,
                        pairID:
                            token.direction !== 'right'
                                ? leftBracketCount
                                : bracketStack.last(),
                    });
                    bracketStack =
                        token.direction === 'right'
                            ? bracketStack.pop()
                            : bracketStack.push(leftBracketCount);
                    leftBracketCount =
                        token.direction === 'left'
                            ? leftBracketCount + 1
                            : leftBracketCount;
                    break;
                }
                default: {
                    tokens.push(token);
                }
            }
        }

        const brackets = tokens.flatMap((token) => {
            return token.type !== 'bracket' ? [] : [token];
        });

        const leftBrackets = brackets.filter((token) => {
            return token.direction === 'left';
        });

        const rightPairIDs = new Set(
            brackets.flatMap((token) => {
                return token.direction !== 'right' ? [] : [token.pairID];
            })
        );

        if (
            leftBrackets.length !== rightPairIDs.size ||
            !leftBrackets.every((leftToken) => {
                return rightPairIDs.has(leftToken.pairID);
            })
        ) {
            throw new Error(`Number of brackets in code doesn't match`);
        }

        return tokens as Tokens;
    };
}
