package main

import (
	log "github.com/Sirupsen/logrus"
	"time"
)
type Engine struct {
	Width int64
	Height int64
	TreeCount int64
	ZombieCount int64

	ObjectContainer *ObjectContainer
	Running bool
}

func NewEngine(
	width int64,
	height int64,
	treeCount int64,
	zombieCount int64,
) *Engine {
	container := NewObjectContainer()
	engine := Engine{Width: width, Height: height, TreeCount: treeCount, ZombieCount: zombieCount, ObjectContainer: container}

	return &engine
}

func (e *Engine) NewPlayer() int64 {
	// random world position
	x := RandomNumber(0, e.Width)
	y := RandomNumber(0, e.Height)

	player := e.ObjectContainer.CreateBlankObject()
	player.Code = "P"
	player.Type = "Player"
	player.X = x
	player.Y = y

	e.ObjectContainer.WriteObject(player)
	log.Info("New player created, id ", player.ID)

	return player.ID
}

func (e *Engine) CreateTree(x int64, y int64) *Object {
	tree := e.ObjectContainer.CreateBlankObject()
	tree.Code = "T"
	tree.Type = "Tree"
	tree.X = x
	tree.Y = y

	return tree
}

func (e *Engine) CreateZombie(x int64, y int64) *Object {
	tree := e.ObjectContainer.CreateBlankObject()
	tree.Code = "Z"
	tree.Type = "Zombie"
	tree.X = x
	tree.Y = y

	return tree
}

func (e *Engine) TickleZombies() {
	zombies := e.ObjectContainer.GetObjectsByType("Zombie")
	players := e.ObjectContainer.GetObjectsByType("Player")

	for _, zombie := range zombies {

	}
}

func (e *Engine) MainLoop() {
	for e.Running {

		e.TickleZombies()

		// sleep for an interval
		time.Sleep(10 * time.Millisecond)
	}
}

func (e *Engine) Initialize() {
	var i int64
	for i = 0; i < e.TreeCount; i++ {
		tree := e.CreateTree(
			RandomNumber(0, e.Width),
			RandomNumber(0, e.Height),
		)
		e.ObjectContainer.WriteObject(tree)
	}

	for i = 0; i < e.ZombieCount; i++ {
		zombie := e.CreateZombie(
			RandomNumber(0, e.Width),
			RandomNumber(0, e.Height),
		)
		e.ObjectContainer.WriteObject(zombie)
	}

	e.Running = true
	go e.MainLoop()
}

func (e *Engine) Stop() {
	e.Running = false
}