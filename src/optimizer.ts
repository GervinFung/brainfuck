import type { Node, Nodes } from './parser';
import { guard, type Mutable } from './type';

type Punctuation = Readonly<{
    type: 'punctuation';
    punctuation: 'dot' | 'comma';
    repeat: number;
}>;

type TypeAndNumberOnly = Readonly<
    | {
          type: 'arrow';
          index: number;
      }
    | {
          type: 'operation';
          value: number;
      }
>;

type ClearLoop = Readonly<{ type: 'clear-loop' }>;

type NegatedBracket = Readonly<{
    type: 'bracket';
    nodes: NegatedNodes;
}>;

type NegatedNodes = ReadonlyArray<
    | {
          type: 'punctuation';
          punctuation: 'dot';
      }
    | {
          type: 'punctuation';
          punctuation: 'comma';
      }
    | NegatedBracket
    | TypeAndNumberOnly
>;

type FusedNonBracket = Readonly<Punctuation | ClearLoop | TypeAndNumberOnly>;

type FusedBracket = Readonly<{
    type: 'bracket';
    operations: FusedMovements;
}>;

type FusedMovement = FusedNonBracket | FusedBracket;

type FusedMovements = ReadonlyArray<FusedMovement>;

type CompoundMovements = ReadonlyArray<
    | Exclude<FusedMovements[0], FusedBracket>
    | Readonly<{
          type: 'bracket';
          operations: CompoundMovements;
      }>
    | Readonly<{
          type: 'arrow-operation';
          index: number;
          value: number;
      }>
>;

type Generated = ReturnType<Optimizer['generate']>;

type MutableGenerated = Mutable<Generated>;

export default class Optimizer {
    constructor(private readonly nodes: Nodes) {}

    private readonly fuseAllMovements = (
        nodes: NegatedNodes
    ): FusedMovements => {
        const fusedMovements = [] as Array<FusedMovement>;

        for (const node of nodes) {
            const operation = (): FusedMovement => {
                return type === 'arrow'
                    ? {
                          type,
                          index: node.index,
                      }
                    : type === 'operation'
                    ? {
                          type,
                          value: node.value,
                      }
                    : type === 'punctuation'
                    ? {
                          type,
                          punctuation: node.punctuation,
                          repeat: 1,
                      }
                    : node.nodes.length === 1 &&
                      node.nodes.at(0)?.type === 'operation'
                    ? ({
                          type: 'clear-loop',
                      } as const)
                    : {
                          type,
                          operations: this.fuseAllMovements(node.nodes),
                      };
            };

            const { type } = node;

            const previousElement = fusedMovements.at(-1);

            if (
                !previousElement ||
                previousElement.type !== node.type ||
                (previousElement.type === node.type &&
                    node.type === 'bracket') ||
                (previousElement.type === 'punctuation' &&
                    node.type === 'punctuation' &&
                    previousElement.punctuation !== node.punctuation)
            ) {
                fusedMovements.push(operation());
                continue;
            }

            const lastIndex = fusedMovements.length - 1;
            const previousType = previousElement.type;
            switch (previousType) {
                case 'arrow': {
                    if (node.type === previousType) {
                        fusedMovements[lastIndex] = {
                            ...previousElement,
                            index: previousElement.index + node.index,
                        };
                    }
                    break;
                }
                case 'operation': {
                    if (node.type === previousType) {
                        fusedMovements[lastIndex] = {
                            ...previousElement,
                            value: previousElement.value + node.value,
                        };
                    }
                    break;
                }
                case 'punctuation': {
                    if (node.type === previousType) {
                        fusedMovements[lastIndex] = {
                            ...previousElement,
                            repeat: previousElement.repeat + 1,
                        };
                    }
                    break;
                }
            }
        }

        return fusedMovements;
    };

    private readonly negate = (nodes: Nodes): NegatedNodes => {
        return nodes.map((node) => {
            const { type } = node;
            switch (type) {
                case 'operation': {
                    return {
                        type,
                        value: node.operation === 'plus' ? 1 : -1,
                    };
                }
                case 'arrow': {
                    return {
                        type,
                        index: node.direction === 'right' ? 1 : -1,
                    };
                }
                case 'bracket': {
                    return {
                        type,
                        nodes: this.negate(node.instructions),
                    };
                }
            }
            return node;
        });
    };

    private readonly compoundArrowAndOperationMovement = (
        fusedMovements: FusedMovements
    ): CompoundMovements => {
        const compoundMovements = [] as Array<CompoundMovements[number]>;

        for (const movement of fusedMovements) {
            if (!compoundMovements.length) {
                compoundMovements.push(movement);
                continue;
            }
            if (movement.type === 'bracket') {
                compoundMovements.push({
                    type: 'bracket',
                    operations: this.compoundArrowAndOperationMovement(
                        movement.operations
                    ),
                });
                continue;
            }
            const previousMovement = guard({
                value: compoundMovements.at(-1),
                error: () => {
                    return new Error(
                        'There should be at least one movement in compoundMovements'
                    );
                },
            });
            if (
                previousMovement.type === 'arrow' &&
                movement.type === 'operation'
            ) {
                compoundMovements[compoundMovements.length - 1] = {
                    type: 'arrow-operation',
                    index: previousMovement.index,
                    value: movement.value,
                };
                continue;
            }
            compoundMovements.push(movement);
        }

        return compoundMovements;
    };

    private readonly redundantMoveElimination = (nodes: Nodes): Nodes => {
        const redundantBrackets = [] as Array<Node>;
        let previousNode = undefined as Node | undefined;

        for (const node of nodes) {
            const previousWasBracket = previousNode?.type === 'bracket';
            previousNode = node;

            if (node.type !== 'bracket') {
                redundantBrackets.push(node);
                continue;
            }

            if (previousWasBracket) {
                continue;
            }

            const operations = this.redundantMoveElimination(node.instructions);

            if (!operations.length) {
                continue;
            }

            redundantBrackets.push({
                type: 'bracket',
                instructions: operations,
            });
        }

        return redundantBrackets;
    };

    readonly generate = () => {
        return this.compoundArrowAndOperationMovement(
            this.fuseAllMovements(
                this.negate(this.redundantMoveElimination(this.nodes))
            )
        );
    };
}

export type { Generated, MutableGenerated };
