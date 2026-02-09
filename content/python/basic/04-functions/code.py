def greet(name, greeting="Hello"):
    return f"{greeting}, {name}!"

def add(a, b):
    return a + b

message = greet("World")
print(message)

result = add(5, 3)
print(f"5 + 3 = {result}")
