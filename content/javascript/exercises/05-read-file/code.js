const fs = require('fs');

function readAndProcessJSON(filename) {
    try {
        const data = fs.readFileSync(filename, 'utf8');
        const jsonData = JSON.parse(data);
        console.log("Parsed JSON:", jsonData);

        // Example processing: sum ages if it's an array of users
        if (Array.isArray(jsonData)) {
            const totalAge = jsonData.reduce((sum, user) => sum + (user.age || 0), 0);
            console.log("Total age:", totalAge);
        }
        return jsonData;
    } catch (error) {
        console.error("Error reading or parsing file:", error.message);
        return null;
    }
}

// Usage
readAndProcessJSON('users.json');