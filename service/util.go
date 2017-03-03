package main

import (
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
