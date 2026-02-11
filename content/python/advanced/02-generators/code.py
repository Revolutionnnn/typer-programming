def my_generator(n):
    for i in range(n):
        yield i * 2

for num in my_generator(5):
    print(num)