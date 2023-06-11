const keywords = {
    // > : increment the pointer (+1),
    // < : decrement the pointer (-1),
    arrow: {
        left: '<',
        right: '>',
    },
    // [ : if the pointed byte is 0 then jump to instruction after the corresponding ],
    // ] : if the pointed byte is not 0 then jump to the instruction after the corresponding [
    bracket: {
        left: '[',
        right: ']',
    },
    // + : increment the byte in the memory cell where the pointer is located,
    // - : decrement the byte in the memory cell where the pointer is located,
    operation: {
        plus: '+',
        minus: '-',
    },
    // . : send the value of the pointed byte as output (treated as an ASCII value),
    // , : insert an input byte (user input) in the memory cell where the pointer is located (ASCII value),
    punctuation: {
        dot: '.',
        comma: ',',
    },
} as const;

export default keywords;
