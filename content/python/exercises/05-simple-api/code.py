class SimpleAPI:
    def __init__(self):
        self.users = {
            1: {"name": "Alice", "age": 25, "email": "alice@example.com"},
            2: {"name": "Bob", "age": 30, "email": "bob@example.com"},
            3: {"name": "Charlie", "age": 35, "email": "charlie@example.com"}
        }
        self.posts = [
            {"id": 1, "title": "First Post", "content": "Hello World"},
            {"id": 2, "title": "Second Post", "content": "Python is great"}
        ]

    def get_user(self, user_id):
        return self.users.get(user_id, {"error": "User not found"})

    def get_all_users(self):
        return list(self.users.values())

    def get_posts(self):
        return self.posts

    def add_user(self, name, age, email):
        new_id = max(self.users.keys()) + 1
        self.users[new_id] = {"name": name, "age": age, "email": email}
        return {"id": new_id, "message": "User added"}

# Usage
api = SimpleAPI()
print(api.get_user(1))
print(api.get_all_users())
print(api.add_user("David", 28, "david@example.com"))