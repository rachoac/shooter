package main

type Bounds struct {
	X1 int64
	Y1 int64
	X2 int64
	Y2 int64
	Width int64
	Height int64
}

func NewBounds(x1, y1, x2, y2 int64) *Bounds {
	bounds := Bounds{
		X1: x1,
		Y1: y1,
		X2: x2,
		Y2: y2,
	}
	return &bounds
}

func (b *Bounds) Collision(other *Bounds) bool {
	return !(other.X1 > b.X2 || other.X2 < b.X1 || other.Y1 > b.Y2 || other.Y2 < b.Y1)
}

func (b *Bounds) recompute() {
	b.Width = b.X2 - b.X1
	b.Height = b.Y2 - b.Y1
}
