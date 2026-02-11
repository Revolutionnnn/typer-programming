person = {
    "name": "Alice",
    "age": 30,
    "city": "Madrid"
}

print(f"Name: {person['name']}")
print(f"Age: {person['age']}")

person["email"] = "alice@example.com"

for key, value in person.items():
    print(f"  {key}: {value}")
