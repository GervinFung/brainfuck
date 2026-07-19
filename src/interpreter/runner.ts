import readline from 'readline';
import Guardian from '../guardian';
import MemoryBlock, { type CellSize } from '../memory';
import { guard } from '../type';
import type { Generated, MutableGenerated } from '../optimizer';

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

    private readonly readInput = async (
        param: Parameters<InterpreterRunner['execute']>[0]
    ) => {
        if (!param.input.values) {
            return this.askForDecimal(param.guardian);
        }

        const value = param.input.values.at(param.input.index);
        param.input.index += 1;

        return value;
    };

    private readonly operation = (
        value: number,
        param: Parameters<InterpreterRunner['execute']>[0]
    ) => {
        param.memoryBlock.add(param.pointer, value);
    };

    private readonly arrow = (
        index: number,
        param: Parameters<InterpreterRunner['execute']>[0]
    ) => {
        param.pointer += index;
        if (!param.guardian.pointerWithinRange(param.pointer)) {
            throw new Error(
                `Memory pointer of ${param.pointer} is out of range`
            );
        }
        param.memoryBlock = param.memoryBlock.grow(param.pointer);
    };

    private readonly execute = async (param: {
        pointer: number;
        result: Array<Uint8Array>;
        memoryBlock: MemoryBlock;
        copyNodes: MutableGenerated;
        guardian: Guardian;
        input: {
            values: ReadonlyArray<number> | undefined;
            index: number;
        };
    }) => {
        while (param.copyNodes.length) {
            const node = guard({
                value: param.copyNodes.at(0),
                error: () => {
                    return new Error('There should be element in the loop');
                },
            });
            switch (node.type) {
                case 'clear-loop': {
                    param.memoryBlock.clear(param.pointer);
                    break;
                }
                case 'operation': {
                    this.operation(node.value, param);
                    break;
                }
                case 'arrow': {
                    this.arrow(node.index, param);
                    break;
                }
                case 'arrow-operation': {
                    this.arrow(node.index, param);
                    this.operation(node.value, param);
                    break;
                }
                case 'bracket': {
                    let tempParam = {
                        ...param,
                        copyNodes: node.operations as MutableGenerated,
                    };
                    while (!tempParam.memoryBlock.isZero(tempParam.pointer)) {
                        const bracket = await this.execute(tempParam);
                        tempParam = {
                            ...bracket,
                            copyNodes: node.operations as MutableGenerated,
                        };
                    }
                    param.pointer = tempParam.pointer;
                    param.memoryBlock = tempParam.memoryBlock;
                    break;
                }
                case 'punctuation': {
                    switch (node.punctuation) {
                        case 'dot': {
                            param.result.push(
                                new Uint8Array(
                                    Array.from({ length: node.repeat }, () => {
                                        return param.memoryBlock.byte(
                                            param.pointer
                                        );
                                    })
                                )
                            );
                            break;
                        }
                        case 'comma': {
                            let repeated = 0;
                            while (repeated < node.repeat) {
                                const decimal = await this.readInput(param);
                                if (decimal !== undefined) {
                                    param.memoryBlock.set(
                                        param.pointer,
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
            param.copyNodes = param.copyNodes.slice(1);
        }
        return param;
    };

    readonly run = async () => {
        const param = await this.execute({
            pointer: 0,
            guardian: new Guardian(this.options?.cellSize),
            copyNodes: this.nodes.slice(),
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

        return Array.from(param.result)
            .map((result) => {
                return String.fromCharCode(...result);
            })
            .join('');
    };
}
