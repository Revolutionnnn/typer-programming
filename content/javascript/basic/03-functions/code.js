function greet(name) {
    return `Hello, ${name}!`;
}

const add = (a, b) => a + b;

const multiply = (a, b) => {
    const result = a * b;
    return result;
};

console.log(greet("World"));
console.log(`5 + 3 = ${add(5, 3)}`);
console.log(`4 * 7 = ${multiply(4, 7)}`);
