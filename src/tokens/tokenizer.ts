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

        const { tokens } = oldTokens.reduce(
            ({ tokens, bracketStack }, token) => {
                switch (token.type) {
                    case 'bracket': {
                        const { length } = tokens.filter((token) => {
                            return (
                                token.type === 'bracket' &&
                                token.direction === 'left'
                            );
                        });
                        return {
                            bracketStack:
                                token.direction === 'right'
                                    ? bracketStack.pop()
                                    : bracketStack.push(length),
                            tokens: tokens.concat({
                                ...token,
                                pairID:
                                    token.direction !== 'right'
                                        ? length
                                        : bracketStack.last(),
                            }),
                        };
                    }
                }

                return {
                    bracketStack,
                    tokens: tokens.concat(token),
                };
            },
            {
                bracketStack: new BracketIndexStack([]),
                tokens: [] as Tokens,
            } as const
        );

        const brackets = tokens.flatMap((token) => {
            return token.type !== 'bracket' ? [] : [token];
        });

        const leftBrackets = brackets.filter((token) => {
            return token.direction === 'left';
        });

        const rightBrackets = brackets.filter((token) => {
            return token.direction === 'right';
        });

        if (
            leftBrackets.length !== rightBrackets.length ||
            !leftBrackets.every((leftToken) => {
                return Boolean(
                    rightBrackets.find((rightToken) => {
                        return rightToken.pairID === leftToken.pairID;
                    })
                );
            })
        ) {
            throw new Error(`Number of brackets in code doesn't match`);
        }

        return tokens;
    };
}
