import readline from 'readline';
import Guardian from '../guardian';
import { guard } from '../type';
import type { Generated, MutableGenerated } from '../optimizer';

export default class InterpreterRunner {
    constructor(private readonly nodes: Generated) {}

    private readonly operation = (
        value: number,
        param: Parameters<InterpreterRunner['execute']>[0]
    ) => {
        param.memoryBlock[param.pointer] += value;
    };

    private readonly arrow = (
        index: number,
        param: Parameters<InterpreterRunner['execute']>[0]
    ) => {
        param.pointer += index;
        param.memoryBlock = param.guardian.memoryBlock({
            pointer: param.pointer,
            memoryBlock: param.memoryBlock,
        });
    };

    private readonly execute = async (param: {
        pointer: number;
        result: Array<Uint8Array>;
        memoryBlock: Uint8Array;
        copyNodes: MutableGenerated;
        guardian: Guardian;
    }) => {
        while (param.copyNodes.length) {
            const node = guard({
                value: param.copyNodes.at(0),
                error: () => new Error('There should be element in the loop'),
            });
            switch (node.type) {
                case 'clear-loop': {
                    param.memoryBlock[param.pointer] = 0;
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
                    while (tempParam.memoryBlock.at(tempParam.pointer)) {
                        const bracket = await this.execute(tempParam);
                        tempParam = {
                            ...bracket,
                            copyNodes: node.operations as MutableGenerated,
                        };
                    }
                    param.memoryBlock = tempParam.memoryBlock;
                    break;
                }
                case 'punctuation': {
                    switch (node.punctuation) {
                        case 'dot': {
                            param.result.push(
                                new Uint8Array(
                                    Array.from(
                                        { length: node.repeat },
                                        () =>
                                            param.memoryBlock.at(
                                                param.pointer
                                            ) ?? 0
                                    )
                                )
                            );
                            break;
                        }
                        case 'comma':
                            {
                                const io = readline.createInterface({
                                    input: process.stdin,
                                    output: process.stdout,
                                });

                                Array.from(
                                    { length: node.repeat },
                                    async () => {
                                        while (true) {
                                            const response = await new Promise<{
                                                isOk: true;
                                                decimal: number;
                                            }>((resolve) =>
                                                io.question(
                                                    'Input the decimal value of an ASCII character',
                                                    (input) => {
                                                        const decimal =
                                                            Number(input);
                                                        if (
                                                            Number.isSafeInteger(
                                                                decimal
                                                            ) &&
                                                            decimal >=
                                                                param.guardian.getRangeMin() &&
                                                            decimal <=
                                                                param.guardian.getRangeMax()
                                                        ) {
                                                            resolve({
                                                                decimal,
                                                                isOk: true,
                                                            });
                                                        }
                                                        console.log(
                                                            `"${input}" is an invalid decimal value of an ASCII character`
                                                        );
                                                    }
                                                )
                                            );
                                            if (response.isOk) {
                                                io.close();
                                                param.memoryBlock[
                                                    param.pointer
                                                ] = response.decimal;
                                            }
                                        }
                                    }
                                );
                            }
                            break;
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
            guardian: new Guardian(),
            copyNodes: this.nodes.slice(),
            result: [] as Array<Uint8Array>,
            memoryBlock: new Uint8Array(30_000),
        });

        return Array.from(param.result)
            .map((result) => String.fromCharCode(...result))
            .join('');
    };
}
