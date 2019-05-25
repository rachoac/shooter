package main

import (
	"sync"

	cm "github.com/orcaman/concurrent-map"
)

type Object struct {
	ID       int64
	OriginID int64
	X        int64
	Y        int64
	Speed    int64
	Distance int64
	Height   int64
	Score    int64
	Type     string
	Code     string
	Name     string

	LastX int64
	LastY int64

	TargetX           int64
	TargetY           int64
	TargetObjectID    int64
	Bounds            *Bounds
	RecalculateBounds func(x int64, y int64) *Bounds
	OnAttacked        func(other *Object) bool
	AttackableBounds  func(self *Object) *Bounds
	Damaging          bool
	HP                int64
	MaxHP             int64
	Bullets           int64
	MaxBullets        int64
	Bombs             int64
	MaxBombs          int64
	LastAttackTick    int64
	LastHealTick      int64
	LastBulletTick    int64
	LastEventTick     int64
	CreationTick      int64
	Blocking          bool
	Damage            int64
}

func (o *Object) GetBounds() *Bounds {
	if o.LastX != -1 && o.LastY != -1 && o.LastX == o.X && o.LastY == o.Y {
		return o.Bounds
	}

	o.LastX = o.X
	o.LastY = o.Y
	o.Bounds = o.RecalculateBounds(o.X, o.Y)

	return o.Bounds
}

func (o *Object) ForceRecalculateBounds() {
	o.Bounds = o.RecalculateBounds(o.X, o.Y)
}

func (o *Object) CollisionDetector(x int64, y int64, other *Object) bool {
	if o.ID == other.ID {
		return false
	}

	var targetBounds *Bounds
	if o.LastX == x && o.LastY == y {
		targetBounds = o.GetBounds()
	} else {
		targetBounds = o.RecalculateBounds(x, y)
	}
	if targetBounds != nil {
		otherBounds := other.GetBounds()
		return otherBounds != nil && targetBounds.Collision(otherBounds)
	} else {
		return false
	}
}

type ObjectContainer struct {
	ObjectsByID   cm.ConcurrentMap
	ObjectsByType map[string]map[int64]*Object
	IDSequence    int64
	S             sync.RWMutex
}

func NewObjectContainer() *ObjectContainer {
	container := ObjectContainer{}
	container.ObjectsByID = cm.New()
	container.ObjectsByType = make(map[string]map[int64]*Object)
	container.IDSequence = 100000

	return &container
}

func (oc *ObjectContainer) DefaultAttackableBounds(self *Object) *Bounds {
	return nil
}

func (oc *ObjectContainer) CreateBlankObject() *Object {
	oc.IDSequence = oc.IDSequence + 1
	return &Object{
		ID:               oc.IDSequence,
		LastX:            -1,
		LastY:            -1,
		Speed:            1,
		Damage:           1,
		Blocking:         true,
		OnAttacked:       func(other *Object) bool { return false },
		AttackableBounds: oc.DefaultAttackableBounds,
	}
}

func (oc *ObjectContainer) WriteObject(object *Object) {
	// index by ID
	oc.ObjectsByID.Set(Int64ToString(object.ID), object)

	// index by type
	{
		peers := oc.ObjectsByType[object.Type]
		if peers == nil {
			peers = make(map[int64]*Object)
			oc.ObjectsByType[object.Type] = peers
		}
		peers[object.ID] = object
	}
}

func (oc *ObjectContainer) DeleteObject(object *Object) {
	// index by type
	{
		peers := oc.ObjectsByType[object.Type]
		delete(peers, object.ID)
	}

	// index by ID

	oc.ObjectsByID.Remove(Int64ToString(object.ID))
}

func (oc *ObjectContainer) DeleteAll() {
	oc.ObjectsByID = cm.New()
	oc.ObjectsByType = make(map[string]map[int64]*Object)
}

func (oc *ObjectContainer) GetObject(objectID int64) *Object {
	obj, success := oc.ObjectsByID.Get(Int64ToString(objectID))
	if !success {
		return nil
	}
	return obj.(*Object)
}

func (oc *ObjectContainer) GetObjectsByType(objectType string) map[int64]*Object {
	return oc.ObjectsByType[objectType]
}

func (oc *ObjectContainer) CollisionAt(targetObject *Object, x int64, y int64) *Object {
	targetObjectBounds := targetObject.GetBounds()

	for obj := range oc.ObjectsByID.Iter() {
		other := obj.Val.(*Object)

		if other == nil || targetObject == nil || other.ID == targetObject.ID {
			continue
		}
		if targetObject.Damaging {
			bounds := other.AttackableBounds(other)
			if bounds != nil && targetObjectBounds.Collision(bounds) {
				if other.OnAttacked(targetObject) && targetObject.Blocking && other.Blocking {
					return other
				}
			}
		}

		if targetObject.CollisionDetector(x, y, other) {
			return other
		}
	}

	return nil
}
