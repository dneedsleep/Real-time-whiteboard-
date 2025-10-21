// server.js
const WebSocket = require('ws')

const wss = new WebSocket.Server({ port: 8080 })

// In-memory store for rooms: roomId => { users: Map, shapes: Map }
const rooms = new Map()

wss.on('connection', (ws, req) => {
  // Extract roomId from URL like ws://localhost:8080/room123
  const urlParts = req.url.split('/')
  const roomId = urlParts[1] || 'default-room'

  if (!rooms.has(roomId)) {
    rooms.set(roomId, { users: new Map(), shapes: new Map() })
  }
  const room = rooms.get(roomId)

  let userId = null
  let userName = 'Anonymous'

  ws.on('message', (msg) => {
    try {
      const data = JSON.parse(msg)

      switch (data.type) {
        case 'join':
          userName = data.name || 'Anonymous'
          userId = Math.random().toString(36).substring(2, 9)
          room.users.set(userId, userName)

          // Notify all users in room about updated users list
          broadcastUsers(room)

          // Send current shapes to new user
          ws.send(
            JSON.stringify({
              type: 'update',
              shapes: Array.from(room.shapes.values()),
            }),
          )
          break

        case 'update':
          data.shapes.forEach((shape) => {
            room.shapes.set(shape.id, shape)
          })
          broadcastExceptSender(room, ws, msg)
          break

        case 'remove':
          data.shapeIds.forEach((id) => {
            room.shapes.delete(id)
          })
          broadcastExceptSender(room, ws, msg)
          break
      }
    } catch (e) {
      console.error('Error handling message:', e)
    }
  })

  ws.on('close', () => {
    if (userId) {
      room.users.delete(userId)
      broadcastUsers(room)
    }
  })

  function broadcastUsers(room) {
    const usersMsg = JSON.stringify({
      type: 'users',
      users: Array.from(room.users.entries()).map(([id, name]) => ({ id, name })),
    })
    room.users.forEach((_name, _id) => {
      // Find the ws for this user? For simplicity broadcast to all sockets in the room
      // Here we broadcast to all clients connected (wss.clients), filtering by room
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(usersMsg)
        }
      })
    })
  }

  function broadcastExceptSender(room, senderWs, message) {
    wss.clients.forEach((client) => {
      if (client !== senderWs && client.readyState === WebSocket.OPEN) {
        client.send(message)
      }
    })
  }
})

console.log('WebSocket server running on ws://localhost:8080')
