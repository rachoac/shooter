package main

type ObjectFactory struct {
	ObjectContainer *ObjectContainer
}

func NewObjectFactory(objectContainer *ObjectContainer) *ObjectFactory {
	objectFactory := ObjectFactory{objectContainer}

	return &objectFactory
}

func (e *ObjectFactory) humanoidRecalculateBounds(x int64, y int64) *Bounds {
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

func (oc *ObjectFactory) humanoidAttackableBounds(self *Object) *Bounds {
	height := float64(self.Height)
	x := float64(self.X) - height * 0.13
	y := float64(self.Y) - height * 0.63
	return NewBounds(int64(x), int64(y), int64(x + height * 0.25), int64(y + height * 0.25))
}

func (e *ObjectFactory) CreateTree(x int64, y int64) *Object {
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

func (e *ObjectFactory) CreateZombie(x int64, y int64) *Object {
	zombie := e.ObjectContainer.CreateBlankObject()
	zombie.Code = "Z"
	zombie.Type = "Zombie"
	zombie.X = x
	zombie.Y = y
	zombie.Bounds = NewBounds(0, 0, 0, 0)
	zombie.Speed = RandomNumber(1, 3)
	zombie.Height = 103
	zombie.RecalculateBounds = e.humanoidRecalculateBounds
	zombie.AttackableBounds = e.humanoidAttackableBounds

	return zombie
}

func (e *ObjectFactory) CreatePlayer(x, y int64) *Object {
	player := e.ObjectContainer.CreateBlankObject()
	player.Code = "P"
	player.Type = "Player"
	player.X = x
	player.Y = y
	player.Height = 103
	player.Speed = 8
	player.RecalculateBounds = e.humanoidRecalculateBounds
	player.AttackableBounds = e.humanoidAttackableBounds

	return player
}

func (e *ObjectFactory) CreateBullet(x, y, speed int64) *Object {
	bullet := e.ObjectContainer.CreateBlankObject()
	bullet.Code = "B"
	bullet.Type = "Bullet"
	bullet.X = x
	bullet.Y = y
	bullet.Speed = speed
	bullet.Height = 15
	bullet.Damaging = true
	bullet.RecalculateBounds = func(x int64, y int64) *Bounds {
		currentX := float64(x)
		currentY := float64(y)

		height := float64(bullet.Height)
		boundWidth := height * 0.25
		boundX := currentX - boundWidth * 0.5
		boundY := currentY - boundWidth * 0.5
		boundX2 := boundX + boundWidth
		boundY2 := boundY + boundWidth

		return NewBounds(int64(boundX), int64(boundY), int64(boundX2), int64(boundY2))
	}
	return bullet
}