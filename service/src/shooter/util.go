package main

import (
	"math"
	"math/rand"
	"time"
	"strconv"
	"os"
	"io/ioutil"
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

func WriteStringToFile(contents string, fileLocation string) error {

	fi, err := os.Create(fileLocation)
	if err != nil {
		return err
	}

	err = ioutil.WriteFile(fi.Name(), []byte(contents), 0644)
	return err
}

func ReadStringFromFile(fileLocation string) (string, error) {
	fi, err := os.Open(fileLocation)
	if err != nil {
		return "", err
	}

	byts, err := ioutil.ReadFile(fi.Name())
	if err != nil {
		return "", err
	}

	return string(byts), nil
}
