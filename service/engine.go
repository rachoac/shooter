package main

import (
	"time"
	"strings"
	"sync"
	log "github.com/Sirupsen/logrus"
)

type Engine struct {
	Width int64
	Height int64
	TreeCount int64
	ZombieCount int64

	ProtocolHandler *ProtocolHandler
	ObjectContainer *ObjectContainer
	ObjectFactory *ObjectFactory
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
	factory := NewObjectFactory(container)
	protocolHandler := NewProtocolHandler()
	engine := Engine{Width: width, Height: height,
		TreeCount: treeCount, ZombieCount: zombieCount,
		ObjectContainer: container, ObjectFactory: factory,
		ProtocolHandler: protocolHandler,
	}

	return &engine
}

func (e *Engine) SetHub(hub *Hub) {
	e.hub = hub
}

func (e *Engine) NewPlayer() int64 {
	// random world position
	x := RandomNumber(0, e.Width)
	y := RandomNumber(0, e.Height)

	player := e.ObjectFactory.CreatePlayer(x, y)
	e.ObjectContainer.WriteObject(player)
	log.Info("New player created, id ", player.ID)

	return player.ID
}

func (e *Engine) broadcast(message string) {
	e.hub.sendToAll([]byte(message))
}

func (e *Engine) sendToPlayer(playerID int64, message string) {
	e.hub.send(playerID, []byte(message))
}

func (e *Engine) broadcastObject(object *Object) {
	e.broadcast(e.ProtocolHandler.asNew(object))
}

func (e *Engine) sendWorld(playerID int64) {
	for _, object := range e.ObjectContainer.ObjectsByID {
		e.sendToPlayer(playerID, e.ProtocolHandler.asNew(object))
	}

	newPlayer := e.ObjectContainer.GetObject(playerID)

	// annouce new player to other players
	for _, player := range e.ObjectContainer.GetObjectsByType("Player") {
		if player.ID != playerID {
			e.sendToPlayer(player.ID, e.ProtocolHandler.asNew(newPlayer))
		}
	}
}

func (e *Engine) broadcastMove(object *Object) {
	e.broadcast(e.ProtocolHandler.asMove(object))
}

func (e *Engine) broadcastExplosion(x int64, y int64, height int64) {
	e.broadcast(e.ProtocolHandler.asExplosionAt(x, y, height))
}

func (e *Engine) RemovePlayer(playerID int64) {
	zombies := e.ObjectContainer.GetObjectsByType("Zombie")
	for _, zombie := range zombies {
		if zombie.TargetObjectID == playerID {
			zombie.TargetObjectID = 0
		}
	}
	player := e.ObjectContainer.GetObject(playerID)
	if player != nil {
		e.RemoveAndBroadcast(player)
		e.ObjectContainer.DeleteObject(player)
	}
}

func (e *Engine) RemoveAndBroadcast(object *Object) {
	e.ObjectContainer.DeleteObject(object)
	e.broadcast(e.ProtocolHandler.asRemove(object))
}

func (e *Engine) TickleBullets() {
	bullets := e.ObjectContainer.GetObjectsByType("Bullet")

	var wg sync.WaitGroup
	wg.Add(len(bullets))

	for _, bullet := range bullets {
		go func(bullet *Object) {
			defer wg.Done()

			x := bullet.X
			y := bullet.Y

			if (x == bullet.TargetX && y == bullet.TargetY) || bullet.Distance > 100 {
				// target met
				e.broadcastExplosion(x, y, 20)
				e.RemoveAndBroadcast(bullet)
				return
			}

			x, y = e.calcAdjustedPosition(bullet, x, y)

			if e.ObjectContainer.CollisionAt(bullet, x, y) == nil {
				bullet.X = x
				bullet.Y = y
				e.broadcastMove(bullet)
			} else {
				// break bullet & show explosion
				e.broadcastExplosion(x, y, RandomNumber(20, 40))
				e.RemoveAndBroadcast(bullet)
				return
			}

		}(bullet)

	}

	wg.Wait()
}

func (e *Engine) calcAdjustedPosition(object *Object, x int64, y int64) (int64, int64) {
	if x < object.TargetX {
		x += object.Speed
	}
	if y < object.TargetY {
		y += object.Speed
	}
	if x > object.TargetX {
		x -= object.Speed
	}
	if y > object.TargetY {
		y -= object.Speed
	}

	distance2 := Distance(x, y, object.TargetX, object.TargetY)
	if distance2 < float64(object.Speed) {
		x = object.TargetX
		y = object.TargetY
	}

	return x, y
}

func (e *Engine) TicklePlayers() {
	players := e.ObjectContainer.GetObjectsByType("Player")

	var wg sync.WaitGroup
	wg.Add(len(players))

	for _, player := range players {
		go func(player *Object) {
			defer wg.Done()

			x := player.X
			y := player.Y

			if x == player.TargetX && y == player.TargetY {
				// target met
				return
			}

			x, y = e.calcAdjustedPosition(player, x, y)

			if e.ObjectContainer.CollisionAt(player, x, y) == nil {
				if player.X != x || player.Y != y {
					player.X = x
					player.Y = y
					e.broadcastMove(player)
				}
			}

		}(player)

	}

	wg.Wait()
}

func (e *Engine) processZombie(zombie *Object, players map[int64]*Object) {
	if zombie == nil {
		return
	}
	if len(players) < 1 {
		zombie.TargetObjectID = 0
		return
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
		return
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
		if zombie.X != x || zombie.Y != y {
			// only broadcast move if change in position
			zombie.X = x
			zombie.Y = y
			e.broadcastMove(zombie)
		}
	}
}

func (e *Engine) TickleZombies() {
	zombies := e.ObjectContainer.GetObjectsByType("Zombie")
	players := e.ObjectContainer.GetObjectsByType("Player")

	var wg sync.WaitGroup
	wg.Add(len(zombies))

	for _, zombie := range zombies {
		go func(zombie *Object) {
			defer wg.Done()
			e.processZombie(zombie, players)

		}(zombie)
	}

	wg.Wait()
}

func (e *Engine) logState() {
	log.Info("--------------------------------")
	zombies := e.ObjectContainer.GetObjectsByType("Zombie")
	for _, zombie := range zombies {
		log.Info("zombie ", zombie.ID, " [", zombie.X, ", ", zombie.Y, "]; targetID: ", zombie.TargetObjectID)
	}
}

func (e *Engine) MainLoop() {
	lastCount := 0
	for e.Running {
		e.Tick += 1

		// wrap back around
		if e.Tick > 9223372036854775805 {
			e.Tick = 0
		}

		var wg sync.WaitGroup
		wg.Add(2)
		func() {
			defer wg.Done()
			e.TickleZombies()
		}()
		func() {
			defer wg.Done()
			e.TicklePlayers()
		}()
		wg.Wait()

		e.TickleBullets()

		zombies := e.ObjectContainer.GetObjectsByType("Zombie")
		if e.Tick % 60 == 0 {
			//e.logState()
			if lastCount != len(zombies) {
				lastCount = len(zombies)
				log.Info("Zombie count ", lastCount)
			}
			if lastCount < 5 {
				// randomly spawn another one
				if RandomBool() {
					e.broadcastObject(e.spawnZombie())
					e.broadcastObject(e.spawnZombie())
				}
			}
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
	case "F": {
		// fire a bullet from x,y -> x2,y2
		x :=  StringToInt64(parts[1])
		y :=  StringToInt64(parts[2])
		x2 :=  StringToInt64(parts[3])
		y2 :=  StringToInt64(parts[4])
		speed :=  StringToInt64(parts[5])
		ownerID :=  StringToInt64(parts[6])

		object := e.ObjectFactory.CreateBullet(x, y, speed)
		object.TargetX = x2
		object.TargetY = y2
		object.OriginID = ownerID
		e.ObjectContainer.WriteObject(object)

		// announce the bullet
		e.broadcast(e.ProtocolHandler.asNew(object))
	}
	case "T": {
		// move player target to x,y
		playerID :=  StringToInt64(parts[1])
		x :=  StringToInt64(parts[2])
		y :=  StringToInt64(parts[3])

		object := e.ObjectContainer.GetObject(playerID)
		if object != nil {
			object.TargetX = x
			object.TargetY = y
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

func (e *Engine) attributePlayerKill(player *Object) {
	e.sendToPlayer(player.ID, e.ProtocolHandler.asAttributePlayerKill(player))
}

func (e *Engine) spawnZombie() *Object {
	offset := int64(20)
	x := int64(0)
	y := int64(0)

	x = RandomNumber(0, e.Width)
	if RandomBool() {
		y = -offset
	}

	y = RandomNumber(0, e.Height)
	if RandomBool() {
		x = -offset
	} else {
		x = e.Width + offset
	}

	zombie := e.ObjectFactory.CreateZombie(x, y)

	zombie.OnAttack = func(other *Object) {
		// killed
		e.broadcastExplosion(zombie.X, zombie.Y, RandomNumber(20, 40))
		e.RemoveAndBroadcast(zombie)

		origin := e.ObjectContainer.GetObject(other.OriginID)
		if origin != nil && origin.Type == "Player" {
			e.attributePlayerKill(origin)
		}

		if RandomBool() {
			// spawn more
			e.broadcastObject(e.spawnZombie())
		}
	}
	e.ObjectContainer.WriteObject(zombie)
	return zombie
}

func (e *Engine) Initialize() {
	log.Info("Initializing engine")
	e.eventStream = make(chan []byte)
	var i int64
	for i = 0; i < e.TreeCount; i++ {
		tree := e.ObjectFactory.CreateTree(
			RandomNumber(0, e.Width),
			RandomNumber(0, e.Height),
		)
		e.ObjectContainer.WriteObject(tree)
	}

	for i = 0; i < e.ZombieCount; i++ {
		e.spawnZombie()
	}

	e.Running = true
	go e.MainLoop()
	go e.ListenToEvents()
	log.Info("Engine running")
}

func (e *Engine) Stop() {
	e.Running = false
}
