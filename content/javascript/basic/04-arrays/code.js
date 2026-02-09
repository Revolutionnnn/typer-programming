const fruits = ["apple", "banana", "cherry"];

fruits.push("orange");
console.log(`Fruits: ${fruits}`);
console.log(`Count: ${fruits.length}`);

const upper = fruits.map(f => f.toUpperCase());
console.log(`Upper: ${upper}`);

fruits.forEach((fruit, i) => {
    console.log(`  ${i + 1}. ${fruit}`);
});
