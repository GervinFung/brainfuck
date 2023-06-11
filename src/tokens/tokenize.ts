import keywords from '../keywords';

export default class Tokenize {
    constructor(private readonly character: string) {}

    private readonly asArrow = () => {
        switch (this.character) {
            case keywords.arrow.left: {
                return {
                    type: 'arrow',
                    direction: 'left',
                } as const;
            }
            case keywords.arrow.right: {
                return {
                    type: 'arrow',
                    direction: 'right',
                } as const;
            }
        }
        return {
            type: 'not-arrow',
        } as const;
    };

    private readonly asBracket = () => {
        switch (this.character) {
            case keywords.bracket.left: {
                return {
                    type: 'bracket',
                    direction: 'left',
                } as const;
            }
            case keywords.bracket.right: {
                return {
                    type: 'bracket',
                    direction: 'right',
                } as const;
            }
        }
        return {
            type: 'not-bracket',
        } as const;
    };

    private readonly asOperation = () => {
        switch (this.character) {
            case keywords.operation.plus: {
                return {
                    type: 'operation',
                    operation: 'plus',
                } as const;
            }
            case keywords.operation.minus: {
                return {
                    type: 'operation',
                    operation: 'minus',
                } as const;
            }
        }
        return {
            type: 'not-operation',
        } as const;
    };

    private readonly asPunctuation = () => {
        switch (this.character) {
            case keywords.punctuation.dot: {
                return {
                    type: 'punctuation',
                    punctuation: 'dot',
                } as const;
            }

            case keywords.punctuation.comma: {
                return {
                    type: 'punctuation',
                    punctuation: 'comma',
                } as const;
            }
        }
        return {
            type: 'not-punctuation',
        } as const;
    };

    readonly token = () => {
        const arrow = this.asArrow();
        if (arrow.type === 'arrow') {
            return arrow;
        }

        const bracket = this.asBracket();
        if (bracket.type === 'bracket') {
            return bracket;
        }

        const operation = this.asOperation();
        if (operation.type === 'operation') {
            return operation;
        }

        const punctuation = this.asPunctuation();
        if (punctuation.type === 'punctuation') {
            return punctuation;
        }

        return {
            type: 'comment',
        } as const;
    };
}
