package main
import (
	"fmt"
	"sync"
)
type Object struct {
	ID                int64
	OriginID	  int64
	X                 int64
	Y                 int64
	Speed             int64
	Distance          int64
	Height            int64
	Score		  int64
	Type              string
	Code              string
	Name		  string

	LastX             int64
	LastY             int64

	TargetX           int64
	TargetY           int64
	TargetObjectID    int64
	Bounds            *Bounds
	RecalculateBounds func(x int64, y int64) *Bounds
	OnAttack          func(other *Object)
	AttackableBounds  func(self *Object) *Bounds
	Damaging	  bool
	HP		  int64
}

func (o *Object) GetBounds() *Bounds {
	if o.LastX == o.X && o.LastY == o.Y {
		return o.Bounds
	}

	o.LastX = o.X
	o.LastY = o.Y
	o.Bounds = o.RecalculateBounds(o.X, o.Y)

	return o.Bounds
}

func (o *Object) CollisionDetector(x int64, y int64, other *Object) bool {
	if (o.ID == other.ID) {
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
	ObjectsByID map[int64]*Object
	ObjectsByCode map[string]map[int64]*Object
	ObjectsByType map[string]map[int64]*Object
	IDSequence int64
	S		  sync.RWMutex
}

func NewObjectContainer() *ObjectContainer{
	container := ObjectContainer{}
	container.ObjectsByID = make(map[int64]*Object)
	container.ObjectsByCode = make(map[string]map[int64]*Object)
	container.ObjectsByType = make(map[string]map[int64]*Object)
	container.IDSequence = 1

	return &container
}

func (oc *ObjectContainer) DefaultAttackableBounds(self *Object) *Bounds {
	return nil
}

func (oc *ObjectContainer) CreateBlankObject() *Object {
	oc.IDSequence = oc.IDSequence + 1
	return &Object{
		ID: oc.IDSequence,
		Speed: 1,
		OnAttack:
		func(other *Object){},
		AttackableBounds: oc.DefaultAttackableBounds,
	}
}

func (oc *ObjectContainer) WriteObject(object *Object) {
	oc.S.Lock()

	// index by ID
	oc.ObjectsByID[object.ID] = object

	// index by code
	{
		peers := oc.ObjectsByCode[object.Code]
		if peers == nil {
			peers = make(map[int64]*Object)
			oc.ObjectsByCode[object.Code] = peers
		}
		peers[object.ID] = object
	}

	// index by type
	{
		peers := oc.ObjectsByType[object.Type]
		if peers == nil {
			peers = make(map[int64]*Object)
			oc.ObjectsByType[object.Type] = peers
		}
		peers[object.ID] = object
	}
	oc.S.Unlock()
}

func (oc *ObjectContainer) DeleteObject(object *Object) {
	oc.S.Lock()

	// index by code
	{
		peers := oc.ObjectsByCode[object.Code]
		delete(peers, object.ID)
	}

	// index by type
	{
		peers := oc.ObjectsByType[object.Type]
		delete(peers, object.ID)
	}

	// index by ID
	delete(oc.ObjectsByID, object.ID)
	oc.S.Unlock()

}

func (oc *ObjectContainer) DeleteAll() {
	oc.ObjectsByID = make(map[int64]*Object)
	oc.ObjectsByCode = make(map[string]map[int64]*Object)
	oc.ObjectsByType = make(map[string]map[int64]*Object)
}

func (oc *ObjectContainer) GetObject(objectID int64) *Object {
	oc.S.RLock()
	defer oc.S.RUnlock()
	return oc.ObjectsByID[objectID]
}

func (oc *ObjectContainer) GetObjectsByCode(objectCode string) (map[int64]*Object) {
	oc.S.RLock()
	defer oc.S.RUnlock()
	return oc.ObjectsByCode[objectCode]
}

func (oc *ObjectContainer) GetObjectsByType(objectType string) (map[int64]*Object) {
	oc.S.RLock()
	defer oc.S.RUnlock()
	return oc.ObjectsByType[objectType]
}

func (oc *ObjectContainer) CollisionAt(targetObject *Object, x int64, y int64) *Object {
	targetObjectBounds := targetObject.GetBounds()
	for _, other := range oc.ObjectsByID {
		if other == nil || targetObject == nil {
			continue
		}
		if other.ID == targetObject.ID {
			continue
		}
		if targetObject.Damaging {
			bounds := other.AttackableBounds(other)
			if bounds != nil && targetObjectBounds.Collision(bounds) {
				fmt.Println("COLLIDED: ", other.Type)
				other.OnAttack(targetObject)
			}
		}

		if targetObject.CollisionDetector(x, y, other) {
			return other
		}
	}

	return nil
}
