def read_and_sum_numbers(filename):
    total = 0
    try:
        with open(filename, 'r') as file:
            for line in file:
                # Assume each line has a number
                num = float(line.strip())
                total += num
        return total
    except FileNotFoundError:
        return "File not found"
    except ValueError:
        return "Invalid number in file"

# Example usage
result = read_and_sum_numbers('numbers.txt')
print(f"Sum: {result}")