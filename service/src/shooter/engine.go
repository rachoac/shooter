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
	HighScore int64
	HighScoreHolder string

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

func (e *Engine) attackPlayer(player *Object, attacker *Object) {
	player.HP -= attacker.Damage
	e.broadcastExplosion(player.X, player.Y, RandomNumber(40, 60))
	e.broadcastPlayerAttributes(player)

	if  player.HP < 1 {
		// killed
		e.broadcastPlayedKilled(player)
		e.removeAndBroadcast(player)
	}
}

func (e *Engine) NewPlayer() int64 {
	// random world position
	x := RandomNumber(0, e.Width)
	y := RandomNumber(0, e.Height)

	player := e.ObjectFactory.CreatePlayer(x, y)
	player.OnAttacked = func(other *Object) bool {
		if other.ID == player.ID || other.OriginID == player.ID {
			return false
		}
		e.attackPlayer(player, other)
		return true
	}

	e.ObjectContainer.WriteObject(player)
	log.Info("New player created, id ", player.ID)

	return player.ID
}

func (e *Engine) broadcast(message string) {
	go e.hub.sendToAll([]byte(message))
}

func (e *Engine) sendToPlayer(playerID int64, message string) {
	go e.hub.send(playerID, []byte(message))
}

func (e *Engine) broadcastObject(object *Object) {
	e.broadcast(e.ProtocolHandler.asNew(object))
}

func (e *Engine) sendWorld(playerID int64) {
	for _, object := range e.ObjectContainer.ObjectsByID {
		e.sendToPlayer(playerID, e.ProtocolHandler.asNew(object))
	}

	newPlayer := e.ObjectContainer.GetObject(playerID)
	e.broadcastPlayerAttributes(newPlayer)
	e.sendToPlayer(playerID, e.ProtocolHandler.asHighScore(e.HighScore, e.HighScoreHolder))

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
		e.removeAndBroadcast(player)
	}
}

func (e *Engine) removeAndBroadcast(object *Object) {
	e.ObjectContainer.DeleteObject(object)
	e.broadcast(e.ProtocolHandler.asRemove(object))
}

func (e *Engine) TickleBullets() {
	bullets := e.ObjectContainer.GetObjectsByType("Bullet")

	var wg sync.WaitGroup

	for _, bullet := range bullets {
		wg.Add(1)
		go func(bullet *Object) {
			defer wg.Done()

			x := bullet.X
			y := bullet.Y

			if (x == bullet.TargetX && y == bullet.TargetY) || bullet.Distance > 100 {
				// target met
				e.broadcastExplosion(x, y, 20)
				e.removeAndBroadcast(bullet)
				return
			}

			x, y = e.calcAdjustedPosition(bullet, x, y)

			collisionObject := e.ObjectContainer.CollisionAt(bullet, x, y)
			if collisionObject == nil || collisionObject.ID == bullet.OriginID {
				bullet.X = x
				bullet.Y = y
				e.broadcastMove(bullet)
			} else {
				// break bullet & show explosion
				e.broadcastExplosion(x, y, RandomNumber(20, 40))
				e.removeAndBroadcast(bullet)
				return
			}

		}(bullet)

	}

	wg.Wait()
}

func (e *Engine) explodeBomb(bomb *Object) {
	explosion := e.ObjectFactory.CreateControlledExplosion(bomb.X, bomb.Y, RandomNumber(120, 150))
	explosion.CreationTick = e.Tick
	explosion.OriginID = bomb.OriginID
	e.ObjectContainer.WriteObject(explosion)
	e.broadcastExplosion(explosion.X, explosion.Y, explosion.Distance)
	e.broadcastObject(explosion)
}

func (e *Engine) TickleExplosions() {
	explosions := e.ObjectContainer.GetObjectsByType("Explosion")

	var wg sync.WaitGroup
	maxExplosionDuration := int64(30)
	for _, explosion := range explosions {
		wg.Add(1)
		go func(explosion *Object) {
			defer wg.Done()

			currentTick := e.Tick - explosion.CreationTick
			if currentTick > maxExplosionDuration {
				// remove it
				e.removeAndBroadcast(explosion)
				return
			}

			explosion.Height += 15
			explosion.ForceRecalculateBounds()
			//e.broadcast(e.ProtocolHandler.asExplosionAttributes(explosion))
			e.ObjectContainer.CollisionAt(explosion, explosion.X, explosion.Y)
		}(explosion)
	}
	wg.Wait()
}

func (e *Engine) TickleBombs() {
	bullets := e.ObjectContainer.GetObjectsByType("Bomb")

	var wg sync.WaitGroup
	toRemove := []*Object{}
	for _, bomb := range bullets {
		wg.Add(1)
		go func(bomb *Object) {
			defer wg.Done()

			if e.Tick - bomb.CreationTick > bomb.Speed {
				// timeout -- blow up
				e.explodeBomb(bomb)
				toRemove = append(toRemove, bomb)
				return
			}

			collisionObject := e.ObjectContainer.CollisionAt(bomb, bomb.X, bomb.Y)
			if collisionObject != nil && collisionObject.ID != bomb.OriginID {
				// trigger bomb
				e.explodeBomb(bomb)
				toRemove = append(toRemove, bomb)
			}

		}(bomb)
	}
	wg.Wait()

	for _, object := range toRemove {
		e.removeAndBroadcast(object)
	}
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

	for _, player := range players {
		wg.Add(1)
		go func(player *Object) {
			defer wg.Done()

			// replenish hp
			if e.Tick - player.LastHealTick > 400 {
				// heal periodically
				if player.HP < player.MaxHP {
					player.HP += 1
					e.broadcastPlayerAttributes(player)
					player.LastHealTick = e.Tick
				}
			}

			// replenish bullets
			if e.Tick - player.LastBulletTick > 10 {
				// add bullets periodically
				if player.Bullets < player.MaxBullets {
					player.Bullets += 1
					e.broadcastPlayerAttributes(player)
					player.LastBulletTick = e.Tick
				}
			}

			// update position
			x := player.X
			y := player.Y

			if x == player.TargetX && y == player.TargetY {
				// target met
				return
			}

			x, y = e.calcAdjustedPosition(player, x, y)

			collisionObject := e.ObjectContainer.CollisionAt(player, x, y)
			if collisionObject == nil || !collisionObject.Blocking {
				if player.X != x || player.Y != y {
					player.X = x
					player.Y = y
					e.broadcastMove(player)
				}

				// todo - trigger bombs and such
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

	collisionObject := e.ObjectContainer.CollisionAt(zombie, x, y)
	if collisionObject == nil || !collisionObject.Blocking {
		if zombie.X != x || zombie.Y != y {
			// only broadcast move if change in position
			zombie.X = x
			zombie.Y = y
			e.broadcastMove(zombie)
		}
	}

	i := Distance(zombie.X, zombie.Y, closest.X, closest.Y)
	if i < 20 {
		// we're close enough for an attack
		if e.Tick == 0 || e.Tick - zombie.LastAttackTick > int64(float64(80)/float64(zombie.Speed)) {
			// enough time has elapsed since the last attack
			zombie.LastAttackTick = e.Tick

			// attack!
			e.attackPlayer(closest, zombie)
		}
	}
}

func (e *Engine) TickleZombies() {
	zombies := e.ObjectContainer.GetObjectsByType("Zombie")
	players := e.ObjectContainer.GetObjectsByType("Player")

	var wg sync.WaitGroup

	for _, zombie := range zombies {
		wg.Add(1)
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
		e.TickleBombs()
		e.TickleExplosions()

		zombies := e.ObjectContainer.GetObjectsByType("Zombie")
		if e.Tick % 60 == 0 {
			//e.logState()
			if lastCount != len(zombies) {
				lastCount = len(zombies)
				log.Info("Zombie count ", lastCount)
			}
			if lastCount < 25 {
				if lastCount < 5 && RandomBool() {
					e.spawnAndBroadcastZombies(true, 5)
				} else {
					// randomly spawn another one
					if RandomBool() {
						e.spawnAndBroadcastZombies(false, 2)
					}
				}
			}
		}

		if e.Tick % 350 == 0 {
			WriteStringToFile(Int64ToString(e.HighScore) + ":" + e.HighScoreHolder, "score.txt")
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
	case "I": {
		playerID :=  StringToInt64(parts[1])
		name :=  parts[2]
		object := e.ObjectContainer.GetObject(playerID)

		if object != nil {
			object.Name = name
		}
		e.sendWorld(playerID)
	}
	case "F": {
		// fire a bullet from x,y -> x2,y2 ... if you have enough bullets
		ownerID :=  StringToInt64(parts[6])
		owner := e.ObjectContainer.GetObject(ownerID)
		if owner != nil && owner.Bullets - 1 > 0 {
			x :=  StringToInt64(parts[1])
			y :=  StringToInt64(parts[2])
			x2 :=  StringToInt64(parts[3])
			y2 :=  StringToInt64(parts[4])
			speed :=  StringToInt64(parts[5])

			object := e.ObjectFactory.CreateBullet(x, y, speed)

			object.TargetX = x2
			object.TargetY = y2
			object.OriginID = ownerID
			e.ObjectContainer.WriteObject(object)

			// announce the bullet
			e.broadcast(e.ProtocolHandler.asNew(object))

			owner.Bullets -= 1
			e.broadcastPlayerAttributes(owner)
		}
	}
	case "B": {
		// drop a bomb at player location
		ownerID :=  StringToInt64(parts[1])
		owner := e.ObjectContainer.GetObject(ownerID)
		if owner != nil && owner.Bombs - 1 >= 0 {
			object := e.ObjectFactory.CreateBomb(owner.X, owner.Y - 25, 100)
			object.CreationTick = e.Tick
			object.OriginID = ownerID

			e.ObjectContainer.WriteObject(object)

			// announce the bomb
			e.broadcast(e.ProtocolHandler.asNew(object))

			owner.Bombs -= 1
			e.broadcastPlayerAttributes(owner)
		}
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

func (e *Engine) broadcastPlayerAttributes(player *Object) {
	e.broadcast(e.ProtocolHandler.asPlayerAttributes(player))
}

func (e *Engine) broadcastPlayedKilled(player *Object) {
	e.broadcast(e.ProtocolHandler.asPlayerKilled(player))
}

func (e *Engine) handleHighScore(player *Object) {
	if player.Score > e.HighScore {
		// new high score
		e.HighScore = player.Score
		e.HighScoreHolder = player.Name
		e.broadcast(e.ProtocolHandler.asHighScore(e.HighScore, e.HighScoreHolder))
	}
}

func (e *Engine) spawnAndBroadcastZombies(fast bool, amount int64) {
	for i := 0; i < int(amount); i++ {
		e.broadcastObject(e.spawnZombie(fast))
	}
}

func (e *Engine) spawnZombie(fast bool) *Object {
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

	var zombie *Object
	if fast {
		zombie = e.ObjectFactory.CreateFastZombie(x, y)
	} else {
		zombie = e.ObjectFactory.CreateZombie(x, y)
	}

	zombie.OnAttacked = func(other *Object) bool {
		// killed
		//e.broadcastExplosion(zombie.X, zombie.Y, RandomNumber(20, 40))
		e.removeAndBroadcast(zombie)

		origin := e.ObjectContainer.GetObject(other.OriginID)
		if origin != nil && origin.Type == "Player" {
			origin.Score += zombie.Speed
			if zombie.Speed > 4 {
				// you get bombs for fast zombies
				origin.Bombs += 1 + RandomNumber(1, zombie.Speed)
				if origin.Bombs > origin.MaxBombs {
					origin.Bombs = origin.MaxBombs
				}
			}

			e.broadcastPlayerAttributes(origin)
			e.handleHighScore(origin)
		}

		if RandomBool() {
			// spawn more
			e.spawnAndBroadcastZombies(false, 1)
		}
		return true
	}
	e.ObjectContainer.WriteObject(zombie)
	return zombie
}

func (e *Engine) Initialize() {
	log.Info("Initializing engine")

	scoreStr, _ := ReadStringFromFile("score.txt")
	if scoreStr != "" {
		parts := strings.Split(scoreStr, ":")
		e.HighScore = StringToInt64(parts[0])
		e.HighScoreHolder = parts[1]
	}

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
		e.spawnZombie(false)
	}

	e.Running = true
	go e.MainLoop()
	go e.ListenToEvents()
	log.Info("Engine running")
}

func (e *Engine) Stop() {
	e.Running = false
}
