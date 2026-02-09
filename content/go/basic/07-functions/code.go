package main

import "fmt"

func greet(name string) string {
	return "Hello, " + name + "!"
}

func main() {
	message := greet("Gopher")
	fmt.Println(message)
}
