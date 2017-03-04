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

func RandomBool() bool {
	return RandomNumber(0, 2) == 0
}

func Int64ToString(n int64) string {
	return strconv.FormatInt(n, 10)
}

func StringToInt64(s string) int64 {
	i, err := strconv.ParseInt(s, 10, 64)
	if err != nil {
		panic(err)
	}

	return i
}

func Distance(x1, y1, x2, y2 int64) float64 {
	first := math.Pow(float64(x2-x1), 2)
	second := math.Pow(float64(y2-y1), 2)
	return math.Sqrt(first + second)
}
