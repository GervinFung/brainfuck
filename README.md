# Brainfuck Interpreter

This is a brainfuck interpreter that does the following

1. Tokenization
2. Parse Tokens as Nodes
3. Optimize aodes

From here, it can either

1. Execute code on the fly
2. Output the instructions in another language

The first option was completed

I might just output the Brainfuck code to Javascript

# Process

## Tokenization

Brainfuck actually doesn't need Tokenization strictly speaking, all I did in Tokenization phase is to identify pair bracket(s), if there is mismatch of brackets, error will be thrown. This will help in parsing the operations inside brackets as loop. Also, it tokenize similar operation

Notice that Brainfuck contains only 8 instructions, and each instruction has their own 'sibling'
`'+', '-', '>', '<', '[', ']', '.', and ','`
Instruction would be tokenzied as either of the following type

```ts
{
    type Operation = {
        type: 'operation';
        operation: 'plus' | 'minus';
    };

    type Arrow = {
        type: 'arrow';
        direction: 'left' | 'right';
    };

    type Bracket = {
        type: 'bracket';
        direction: 'left' | 'right';
    };

    type Punctuation = {
        type: 'punctuation';
        punctuation: 'dot' | 'comma';
    };
}
```

## Parsing

Parsing involves removing unused tokens and creating loop nodes for operations inside paired brackets.

## Optimization

Optimization involves the following techniques:

1. Redundant move elimination:
   Removes unnecessary operations that reset the value to 0 or shift the value when it reaches 255.

2. Negate the value if negative:
   Determines the sign of the operation (to left or to right) and assigns a corresponding value (-1 or 1).

So, the following will transform to

```json
{
    "type": "arrow",
    "direction": "left"
}
```

this

```json
{
    "type": "arrow",
    "index": -1
}
```

3. Constant folding:
   Replaces repetitive operations with a condensed representation.

Consider the Brainfuck instructions below

`+++++<<<---++++>>>`

it will be transformed as the following pseudocode through constant folding

`5[+], 3[<], 3[-], 3[>]`

4. Combine Arrow and Operation Movement:
   Combines consecutive arrow and operation movements into a single node for efficiency.

    Take the pseudocode from previous example,

    `5[+], 3[<], 3[-], 3[>]`

    it will be tranform to the json structure below

```json
{
    "optimized": [
        { "type": "operation", "value": 5 },
        { "type": "arrow-operation", "index": -3, "value": 1 },
        { "type": "arrow", "index": 3 }
    ]
}
```

# Execution

## Interpret

At the time of writing, I only support interpreting, running the code without emitting any code

## Code Emission

I might support code emission through JavaScript or WASM (maybe, who knows?)
