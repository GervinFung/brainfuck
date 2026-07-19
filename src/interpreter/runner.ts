import readline from 'readline';
import Guardian from '../guardian';
import MemoryBlock, { type CellSize } from '../memory';
import { guard } from '../type';
import type { Generated } from '../optimizer';

type State = {
    pointer: number;
    result: Array<Uint8Array>;
    memoryBlock: MemoryBlock;
    guardian: Guardian;
    input: {
        values: ReadonlyArray<number> | undefined;
        index: number;
    };
};

export default class InterpreterRunner {
    constructor(
        private readonly nodes: Generated,
        private readonly options?: Readonly<{
            cellSize?: CellSize;
            input?: string;
        }>
    ) {}

    private readonly askForDecimal = async (guardian: Guardian) => {
        const io = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });

        try {
            // eslint-disable-next-line no-constant-condition
            while (true) {
                const input = await new Promise<string>((resolve) => {
                    return io.question(
                        'Input the decimal value of an ASCII character: ',
                        resolve
                    );
                });

                const decimal = Number(input);
                if (
                    Number.isSafeInteger(decimal) &&
                    decimal >= guardian.getRangeMin() &&
                    decimal <= guardian.getRangeMax()
                ) {
                    return decimal;
                }

                console.log(
                    `"${input}" is an invalid decimal value of an ASCII character`
                );
            }
        } finally {
            io.close();
        }
    };

    private readonly readInput = async (state: State) => {
        if (!state.input.values) {
            return this.askForDecimal(state.guardian);
        }

        const value = state.input.values.at(state.input.index);
        state.input.index += 1;

        return value;
    };

    private readonly operation = (value: number, state: State) => {
        state.memoryBlock.add(state.pointer, value);
    };

    private readonly arrow = (index: number, state: State) => {
        state.pointer += index;
        if (!state.guardian.pointerWithinRange(state.pointer)) {
            throw new Error(
                `Memory pointer of ${state.pointer} is out of range`
            );
        }
        state.memoryBlock = state.memoryBlock.grow(state.pointer);
    };

    private readonly execute = async (nodes: Generated, state: State) => {
        let index = 0;
        while (index < nodes.length) {
            const node = guard({
                value: nodes.at(index),
                error: () => {
                    return new Error('There should be element in the loop');
                },
            });
            switch (node.type) {
                case 'clear-loop': {
                    state.memoryBlock.clear(state.pointer);
                    break;
                }
                case 'operation': {
                    this.operation(node.value, state);
                    break;
                }
                case 'arrow': {
                    this.arrow(node.index, state);
                    break;
                }
                case 'arrow-operation': {
                    this.arrow(node.index, state);
                    this.operation(node.value, state);
                    break;
                }
                case 'bracket': {
                    while (!state.memoryBlock.isZero(state.pointer)) {
                        await this.execute(node.operations, state);
                    }
                    break;
                }
                case 'punctuation': {
                    switch (node.punctuation) {
                        case 'dot': {
                            state.result.push(
                                new Uint8Array(
                                    Array.from({ length: node.repeat }, () => {
                                        return state.memoryBlock.byte(
                                            state.pointer
                                        );
                                    })
                                )
                            );
                            break;
                        }
                        case 'comma': {
                            let repeated = 0;
                            while (repeated < node.repeat) {
                                const decimal = await this.readInput(state);
                                if (decimal !== undefined) {
                                    state.memoryBlock.set(
                                        state.pointer,
                                        decimal
                                    );
                                }
                                repeated += 1;
                            }
                            break;
                        }
                    }
                }
            }
            index += 1;
        }
        return state;
    };

    readonly run = async () => {
        const state = await this.execute(this.nodes, {
            pointer: 0,
            guardian: new Guardian(this.options?.cellSize),
            result: [] as Array<Uint8Array>,
            memoryBlock: MemoryBlock.create({
                cellSize: this.options?.cellSize ?? 8,
                length: 30_000,
            }),
            input: {
                index: 0,
                values:
                    this.options?.input === undefined
                        ? undefined
                        : Array.from(this.options.input).map((character) => {
                              return character.charCodeAt(0);
                          }),
            },
        });

        return Array.from(state.result)
            .map((result) => {
                return String.fromCharCode(...result);
            })
            .join('');
    };
}
