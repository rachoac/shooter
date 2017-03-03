package main

import (
	"math"
	"math/rand"
	"time"
	"strconv"
)

func RandomNumber(min, max int64) int64 {
	rand.Seed(time.Now().UnixNano())
	return int64(rand.Int63n(max-min) + min)
}

func Int64ToString(n int64) string {
	return strconv.FormatInt(n, 10)
}

func Distance(x1, y1, x2, y2 int64) float64 {
	first := math.Pow(float64(x2-x1), 2)
	second := math.Pow(float64(y2-y1), 2)
	return math.Sqrt(first + second)
}
