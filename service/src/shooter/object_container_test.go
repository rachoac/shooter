package main

import (
	"testing"
	"github.com/stretchr/testify/assert"
)

func TestWriteObject(t *testing.T) {
	container := NewObjectContainer()

	object := Object{
		1,
		100,
		200,
		"Type1",
		"T",
	}

	container.WriteObject(&object)

	{
		dbObject := container.GetObject(1)
		assert.Equal(t, &object, dbObject)
	}
	{
		objects := container.GetObjectsByCode("T")
		assert.Len(t, objects, 1)
	}
	{
		objects := container.GetObjectsByType("Type1")
		assert.Len(t, objects, 1)
	}

}

func TestDeleteObject(t *testing.T) {
	container := NewObjectContainer()

	object := Object{
		1,
		100,
		200,
		"Type1",
		"T",
	}

	container.WriteObject(&object)
	container.DeleteObject(&object)

	{
		dbObject := container.GetObject(1)
		assert.Nil(t, dbObject)
	}
	{
		objects := container.GetObjectsByCode("T")
		assert.Len(t, objects, 0)
	}
	{
		objects := container.GetObjectsByType("Type1")
		assert.Len(t, objects, 0)
	}

}

func TestClearObjects(t *testing.T) {
	container := NewObjectContainer()

	object := Object{
		1,
		100,
		200,
		"Type1",
		"T",
	}

	container.WriteObject(&object)
	container.DeleteAll()
	{
		dbObject := container.GetObject(1)
		assert.Nil(t, dbObject)
	}
	{
		objects := container.GetObjectsByCode("T")
		assert.Len(t, objects, 0)
	}
	{
		objects := container.GetObjectsByType("Type1")
		assert.Len(t, objects, 0)
	}

}