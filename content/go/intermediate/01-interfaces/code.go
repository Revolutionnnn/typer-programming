package main

import (
	"fmt"
	"math"
)

type Shape interface {
	Area() float64
}

type Circle struct {
	Radius float64
}

func (c Circle) Area() float64 {
	return math.Pi * c.Radius * c.Radius
}

type Rectangle struct {
	Width, Height float64
}

func (r Rectangle) Area() float64 {
	return r.Width * r.Height
}

func main() {
	shapes := []Shape{Circle{Radius: 5}, Rectangle{Width: 4, Height: 6}}
	for _, s := range shapes {
		fmt.Println("Area:", s.Area())
	}
}
