package main

import (
	"testing"
	"github.com/stretchr/testify/assert"
)

func TestEngineInitialization(t *testing.T) {
	engine := NewEngine(100, 100, 100, 100)
	engine.Initialize()

	assert.Len(t, engine.ObjectContainer.GetObjectsByType("Zombie"), 100)
	assert.Len(t, engine.ObjectContainer.GetObjectsByType("Tree"), 100)
}

func TestEngineStart(t *testing.T) {
	engine := NewEngine(100, 100, 100, 100)
	engine.Initialize()

	engine.Stop()
}