package main

type ProtocolHandler struct {
}

func NewProtocolHandler() *ProtocolHandler {
	handler := ProtocolHandler{}
	return &handler
}

func (e *ProtocolHandler) asNew(object *Object) string {
	return "N:" + Int64ToString(object.ID) + ":" + object.Code + ":" + Int64ToString(object.X) + ":" + Int64ToString(object.Y) + ":" + Int64ToString(object.Height) + ":" + Int64ToString(object.Speed)
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

func (e *ProtocolHandler) asAttributePlayerKill(player *Object) string {
	return "S:" + Int64ToString(player.ID)
}