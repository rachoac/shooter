package main

type ProtocolHandler struct {
}

func NewProtocolHandler() *ProtocolHandler {
	handler := ProtocolHandler{}
	return &handler
}

func (e *ProtocolHandler) asNew(object *Object) string {
	return "N:" + Int64ToString(object.ID) + ":" +
		object.Code + ":" + Int64ToString(object.X) + ":" +
		Int64ToString(object.Y) + ":" +
		Int64ToString(object.Height) + ":" +
		Int64ToString(object.Speed) + ":" +
		object.Name + ":" +
		Int64ToString(object.Score)
}

func (e *ProtocolHandler) asMove(object *Object) string {
	return "M:" + Int64ToString(object.ID) + ":" + Int64ToString(object.X) + ":" + Int64ToString(object.Y)
}

func (e *ProtocolHandler) asExplosionAt(x, y, height int64) string {
	return "X:" + Int64ToString(x) + ":" + Int64ToString(y) + ":" + Int64ToString(height)

}

func (e *ProtocolHandler) asRemove(object *Object) string {
	return "R:" + Int64ToString(object.ID)
}

func (e *ProtocolHandler) asPlayerAttributes(player *Object) string {
	return "A:" + Int64ToString(player.ID) + ":" +
		Int64ToString(player.Score) + ":" +
		Int64ToString(player.HP) + ":" +
		Int64ToString(player.Bullets)
}

func (e *ProtocolHandler) asPlayerKilled(player *Object) string {
	return "K:" + Int64ToString(player.ID)
}

func (e *ProtocolHandler) asHighScore(score int64, holder string) string {
	return "Y:" + Int64ToString(score) + ":" + holder
}