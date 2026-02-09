class SimpleAPI {
    constructor() {
        this.users = {
            1: { name: 'Alice', age: 25, email: 'alice@example.com' },
            2: { name: 'Bob', age: 30, email: 'bob@example.com' },
            3: { name: 'Charlie', age: 35, email: 'charlie@example.com' }
        };
        this.posts = [
            { id: 1, title: 'First Post', content: 'Hello World' },
            { id: 2, title: 'Second Post', content: 'JavaScript is great' }
        ];
    }

    getUser(userId) {
        return this.users[userId] || { error: 'User not found' };
    }

    getAllUsers() {
        return Object.values(this.users);
    }

    getPosts() {
        return this.posts;
    }

    addUser(name, age, email) {
        const newId = Math.max(...Object.keys(this.users).map(Number)) + 1;
        this.users[newId] = { name, age, email };
        return { id: newId, message: 'User added' };
    }
}

// Usage
const api = new SimpleAPI();
console.log(api.getUser(1));
console.log(api.getAllUsers());
console.log(api.addUser('David', 28, 'david@example.com'));