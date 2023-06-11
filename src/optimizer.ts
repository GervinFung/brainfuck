import type { Nodes } from './parser';
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

    private readonly fuseAllMovements = (nodes: NegatedNodes): FusedMovements =>
        nodes.reduce((fusedMovements, node) => {
            const operation = (): FusedMovement =>
                type === 'arrow'
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

            const { type } = node;

            if (!fusedMovements.length) {
                return [operation()];
            }

            const previousElement = fusedMovements.at(-1);
            if (!previousElement) {
                throw new Error('Should be defined');
            }

            if (
                previousElement.type !== node.type ||
                (previousElement.type === node.type && node.type === 'bracket')
            ) {
                return fusedMovements.concat(operation());
            }

            const lastIndex = fusedMovements.lastIndexOf(previousElement);

            return fusedMovements.map((movement, index) => {
                if (
                    !(
                        index === lastIndex &&
                        movement.type !== 'clear-loop' &&
                        movement.type !== 'bracket'
                    )
                ) {
                    return movement;
                }
                const { type } = movement;
                switch (type) {
                    case 'arrow': {
                        return node.type !== type
                            ? movement
                            : {
                                  ...movement,
                                  index: movement.index + node.index,
                              };
                    }
                    case 'operation': {
                        return node.type !== type
                            ? movement
                            : {
                                  ...movement,
                                  value: movement.value + node.value,
                              };
                    }
                    case 'punctuation': {
                        return node.type !== type
                            ? movement
                            : {
                                  ...movement,
                                  repeat: movement.repeat + 1,
                              };
                    }
                }
            });
        }, [] as FusedMovements);

    private readonly negate = (nodes: Nodes): NegatedNodes =>
        nodes.map((node) => {
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
                        nodes: this.negate(node.operations),
                    };
                }
            }
            return node;
        });

    private readonly compoundArrowAndOperationMovement = (
        fusedMovements: FusedMovements
    ): CompoundMovements =>
        fusedMovements.reduce((compoundMovements, movement) => {
            if (!compoundMovements.length) {
                return [movement];
            }
            if (movement.type === 'bracket') {
                return compoundMovements.concat({
                    type: 'bracket',
                    operations: this.compoundArrowAndOperationMovement(
                        movement.operations
                    ),
                });
            }
            const previousMovement = guard({
                value: compoundMovements.at(-1),
                error: () =>
                    new Error(
                        'There should be at least one movement in compoundMovements'
                    ),
            });
            if (
                previousMovement.type === 'arrow' &&
                movement.type === 'operation'
            ) {
                return compoundMovements.slice(0, -1).concat({
                    type: 'arrow-operation',
                    index: previousMovement.index,
                    value: movement.value,
                });
            }
            return compoundMovements.concat(movement);
        }, [] as CompoundMovements);

    private readonly redundantMoveElimination = (nodes: Nodes): Nodes => {
        const redundantBrackets = nodes.reduce(
            (nodes, node, index, oldNodes) => {
                switch (node.type) {
                    case 'bracket': {
                        const previousNode = oldNodes[index - 1];
                        const nextNode = oldNodes[index + 1];
                        if (
                            previousNode?.type === 'bracket' ||
                            nextNode?.type === 'bracket'
                        ) {
                            return nodes;
                        }

                        const operations = this.redundantMoveElimination(
                            node.operations
                        );

                        if (!operations.length) {
                            return nodes;
                        }

                        return nodes.concat({
                            type: 'bracket',
                            operations,
                        });
                    }
                }

                return nodes.concat(node);
            },
            [] as Nodes
        );

        return redundantBrackets;
    };

    readonly generate = () =>
        this.compoundArrowAndOperationMovement(
            this.fuseAllMovements(
                this.negate(this.redundantMoveElimination(this.nodes))
            )
        );
}

export type { Generated, MutableGenerated };
