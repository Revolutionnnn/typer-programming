function sumEvenNumbers(arr) {
    let sum = 0;
    for (let i = 0; i < arr.length; i++) {
        if (arr[i] % 2 === 0) {
            sum += arr[i];
        }
    }
    return sum;
}

function sumArrayWithReduce(arr) {
    return arr.reduce((acc, curr) => acc + curr, 0);
}

function findMax(arr) {
    if (arr.length === 0) return null;
    let max = arr[0];
    for (let num of arr) {
        if (num > max) {
            max = num;
        }
    }
    return max;
}

// Usage
const numbers = [1, 2, 3, 4, 5, 6];
console.log("Sum of evens:", sumEvenNumbers(numbers)); // 12
console.log("Total sum:", sumArrayWithReduce(numbers)); // 21
console.log("Max:", findMax(numbers)); // 6