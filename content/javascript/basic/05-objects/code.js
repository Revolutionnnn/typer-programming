const person = {
    name: "Alice",
    age: 30,
    city: "Madrid",
};

console.log(`Name: ${person.name}`);
console.log(`Age: ${person.age}`);

person.email = "alice@example.com";

const { name, city } = person;
console.log(`${name} lives in ${city}`);

const keys = Object.keys(person);
console.log(`Keys: ${keys}`);
