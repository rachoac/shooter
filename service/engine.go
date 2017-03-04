package main

import (
	"time"
	"strings"
	log "github.com/Sirupsen/logrus"
	"github.com/thedataguild/faer/util"
)

type Engine struct {
	Width int64
	Height int64
	TreeCount int64
	ZombieCount int64

	ObjectContainer *ObjectContainer
	Running bool
	Tick int64

	eventStream chan []byte

	hub *Hub
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

func (e *Engine) SetHub(hub *Hub) {
	e.hub = hub
}

func (e *Engine) HumanoidRecalculateBounds(x int64, y int64) *Bounds {
	currentX := float64(x)
	currentY := float64(y)

	height := float64(103)
	boundWidth := height * 0.25
	boundX := currentX - boundWidth * 0.27
	boundY := currentY - height * 0.12
	boundX2 := boundX + height *0.14
	boundY2 := boundY + height * 0.12

	return NewBounds(int64(boundX), int64(boundY), int64(boundX2), int64(boundY2))
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
	player.Height = 103
	player.RecalculateBounds = e.HumanoidRecalculateBounds

	e.ObjectContainer.WriteObject(player)
	log.Info("New player created, id ", player.ID)

	return player.ID
}

func (e *Engine) to(object *Object) string {
	return "N:" + Int64ToString(object.ID) + ":" + object.Code + ":" + Int64ToString(object.X) + ":" + Int64ToString(object.Y) + ":" + Int64ToString(object.Height)
}

func (e *Engine) sendWorld(playerID int64) {
	for _, object := range e.ObjectContainer.ObjectsByID {
		e.hub.send(playerID, []byte(e.to(object)))
	}

	newPlayer := e.ObjectContainer.GetObject(playerID)

	// annouce new player to other players
	for _, player := range e.ObjectContainer.GetObjectsByType("Player") {
		if player.ID != playerID {
			e.hub.send(player.ID, []byte(e.to(newPlayer)))
		}
	}
}

func (e *Engine) broadcastMove(object *Object) {
	message := "M:" + Int64ToString(object.ID) + ":" + Int64ToString(object.X) + ":" + Int64ToString(object.Y)
	e.hub.sendToAll([]byte(message))
}

func (e *Engine) RemovePlayer(playerID int64) {
	zombies := e.ObjectContainer.GetObjectsByType("Zombie")
	for _, zombie := range zombies {
		if zombie.TargetObjectID == playerID {
			zombie.TargetObjectID = 0
		}
	}
	e.ObjectContainer.DeleteObjectByID(playerID)
}

func (e *Engine) CreateTree(x int64, y int64) *Object {
	tree := e.ObjectContainer.CreateBlankObject()
	tree.Code = "T"
	tree.Type = "Tree"
	tree.X = x
	tree.Y = y
	tree.Height = RandomNumber(50, 103)
	tree.Bounds = NewBounds(0, 0, 0, 0)
	tree.RecalculateBounds = func(x int64, y int64) *Bounds {
		currentX := float64(x)
		currentY := float64(y)
		height := float64(tree.Height)
		boundWidth := height * 0.25
		boundX := currentX - boundWidth * 0.05
		boundY := currentY - height * 0.12
		boundX2 := boundX + height * 0.15
		boundY2 := boundY + height * 0.12

		return NewBounds(int64(boundX), int64(boundY), int64(boundX2), int64(boundY2))
	}

	return tree
}

func (e *Engine) CreateZombie(x int64, y int64) *Object {
	zombie := e.ObjectContainer.CreateBlankObject()
	zombie.Code = "Z"
	zombie.Type = "Zombie"
	zombie.X = x
	zombie.Y = y
	zombie.Bounds = NewBounds(0, 0, 0, 0)
	zombie.Speed = util.RandomInt64(1, 3)
	zombie.RecalculateBounds = e.HumanoidRecalculateBounds

	return zombie
}

func (e *Engine) TickleZombies() {
	zombies := e.ObjectContainer.GetObjectsByType("Zombie")
	players := e.ObjectContainer.GetObjectsByType("Player")

	for _, zombie := range zombies {
		if len(players) < 1 {
			zombie.TargetObjectID = 0
			continue
		}
		// each zombie should evaluate who the closest
		// player is, and make that one their target
		var closest *Object
		zombieTarget := e.ObjectContainer.GetObject(zombie.TargetObjectID)
		if zombieTarget != nil {
			distance1 := Distance(zombie.X, zombie.Y, zombieTarget.X, zombieTarget.Y)
			for _, player := range players {
				// see if anyone else is closer
				distance2 := Distance(zombie.X, zombie.Y, player.X, player.Y)
				if distance2 < distance1 {
					// other player is closer, its now the target
					closest = player
					break;
				}
			}
			if closest == nil {
				// current target is still closest
				closest = zombieTarget
			}
		} else {
			// zombie has no target; acquire a new one
			closestDistance := float64(-1)
			for _, player := range players {
				var distance float64
				if closest != nil {
					distance = Distance(zombie.X, zombie.Y, closest.X, closest.Y)
				}
				if closest == nil || distance < closestDistance {
					closest = player
					closestDistance = distance
				}
			}
		}

		if closest != nil {
			zombie.TargetObjectID = closest.ID
		} else {
			continue
		}

		x := zombie.X
		y := zombie.Y
		// move the zombie one click closer to their target
		if x < closest.X {
			x += zombie.Speed
		}
		if y < closest.Y {
			y += zombie.Speed
		}
		if x > closest.X {
			x -= zombie.Speed
		}
		if y > closest.Y {
			y -= zombie.Speed
		}

		if e.ObjectContainer.CollisionAt(zombie, x, y) == nil {
			zombie.X = x
			zombie.Y = y
			e.broadcastMove(zombie)
		}
	}

}

func (e *Engine) logState() {
	log.Info("--------------------------------")
	zombies := e.ObjectContainer.GetObjectsByType("Zombie")
	for _, zombie := range zombies {
		log.Info("zombie ", zombie.ID, " [", zombie.X, ", ", zombie.Y, "]; targetID: ", zombie.TargetObjectID)
	}
}

func (e *Engine) MainLoop() {
	for e.Running {
		e.Tick += 1

		// wrap back around
		if e.Tick > 9223372036854775805 {
			e.Tick = 0
		}

		e.TickleZombies()

		if e.Tick % 60 == 0 {
			//e.logState()
		}

		// sleep for an interval
		time.Sleep(30 * time.Millisecond)
	}
}

func (e *Engine) parseEvent(event string) {
	parts := strings.Split(event, ":")
	command := parts[0]

	switch command {
	case "P": {
		playerID :=  StringToInt64(parts[1])
		x :=  StringToInt64(parts[2])
		y :=  StringToInt64(parts[3])
		object := e.ObjectContainer.GetObject(playerID)

		if object != nil {
			if e.ObjectContainer.CollisionAt(object, x, y) == nil {
				object.X = x
				object.Y = y
				e.broadcastMove(object)
			}
		}
	}
		default:
		// nothing
	}
}

func (e *Engine) ListenToEvents() {
	// forever listen
	for e.Running {
		event := <- e.eventStream
		eventStr := string(event)
		//log.Info("Received [", eventStr, "]")
		e.parseEvent(eventStr)
	}
}

func (e *Engine) Initialize() {
	log.Info("Initializing engine")
	e.eventStream = make(chan []byte)
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
	go e.ListenToEvents()
	log.Info("Engine running")
}

func (e *Engine) Stop() {
	e.Running = false
}
