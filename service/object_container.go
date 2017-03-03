package main

type Object struct {
	ID int64
	X int64
	Y int64
	Type string
	Code string

	TargetX int64
	TargetY int64
	TargetObjectID int64
}

type ObjectContainer struct {
	ObjectsByID map[int64]*Object
	ObjectsByCode map[string]map[int64]*Object
	ObjectsByType map[string]map[int64]*Object
	IDSequence int64
}

func NewObjectContainer() *ObjectContainer{
	container := ObjectContainer{}
	container.ObjectsByID = make(map[int64]*Object)
	container.ObjectsByCode = make(map[string]map[int64]*Object)
	container.ObjectsByType = make(map[string]map[int64]*Object)
	container.IDSequence = 1

	return &container
}

func (oc *ObjectContainer) CreateBlankObject() *Object {
	oc.IDSequence = oc.IDSequence + 1
	return &Object{ID: oc.IDSequence}
}

func (oc *ObjectContainer) WriteObject(object *Object) {
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
}

func (oc *ObjectContainer) DeleteObject(object *Object) {
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
}

func (oc *ObjectContainer) DeleteAll() {
	oc.ObjectsByID = make(map[int64]*Object)
	oc.ObjectsByCode = make(map[string]map[int64]*Object)
	oc.ObjectsByType = make(map[string]map[int64]*Object)
}

func (oc *ObjectContainer) GetObject(objectID int64) *Object {
	return oc.ObjectsByID[objectID]
}

func (oc *ObjectContainer) DeleteObjectByID(objectID int64) {
	object := oc.GetObject(objectID)
	if object != nil {
		oc.DeleteObject(object)
	}
}

func (oc *ObjectContainer) GetObjectsByCode(objectCode string) (map[int64]*Object) {
	return oc.ObjectsByCode[objectCode]
}

func (oc *ObjectContainer) GetObjectsByType(objectType string) (map[int64]*Object) {
	return oc.ObjectsByType[objectType]
}


