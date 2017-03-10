// Copyright 2013 The Gorilla WebSocket Authors. All rights reserved.
// Use of this source code is governed by a BSD-style
// license that can be found in the LICENSE file.
package main

import (
	"strconv"
	"fmt"
)

// hub maintains the set of active clients and broadcasts messages to the
// clients.
type Hub struct {
	engine *Engine

	// Registered clients.
	clients map[int64]*Client

	// Inbound messages from the clients.
	broadcast chan []byte

	// Register requests from the clients.
	register chan *Client

	// Unregister requests from clients.
	unregister chan *Client
}

func newHub(engine *Engine) *Hub {
	return &Hub{
		engine: engine,
		broadcast:  make(chan []byte),
		register:   make(chan *Client),
		unregister: make(chan *Client),
		clients:    make(map[int64]*Client),
	}
}

func (h *Hub) send(clientID int64, message []byte) {
	client := h.clients[clientID]
	client.send <- message
}

func (h *Hub) sendToAll(message []byte) {
	//fmt.Println("num clients:", len(h.clients))
	for _, client := range h.clients {
		select {
		case client.send <- message:
		default:
			close(client.send)
			//delete(h.clients, clientID)
		}
	}
}

func (h *Hub) run() {
	for {
		select {
		case client := <-h.register:
			fmt.Println("---- REGISTER ----")
			playerID := h.engine.NewPlayer()
			h.clients[playerID] = client
			msg := "ID:" + strconv.FormatInt(playerID, 10)
			client.send <- []byte(msg)
		case client := <-h.unregister:
			for playerID, hClient := range h.clients {
				if hClient == client {
					h.engine.RemovePlayer(playerID)
					delete(h.clients, playerID)
				}
			}
			close(client.send)
		case message := <-h.broadcast:
			h.engine.eventStream <- message
			for playerID, client := range h.clients {
				select {
				case client.send <- message:
				default:
					close(client.send)
					delete(h.clients, playerID)
				}
			}
		}
	}
}
