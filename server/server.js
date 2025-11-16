const WebSocket = require('ws');

const PORT = process.env.PORT || 8081;
const wss = new WebSocket.Server({ port: PORT });

// rooms: roomId -> { users: Map<userId, name>, shapes: Map<shapeId, shape> }
const rooms = new Map();

function ensureRoom(roomId) {
  if (!rooms.has(roomId)) rooms.set(roomId, { users: new Map(), shapes: new Map() });
  return rooms.get(roomId);
}

function safeSend(ws, obj) {
  try {
    if (ws && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(obj));
  } catch (e) {
    console.error('Error sending message to client:', e);
  }
}

function broadcastToRoom(roomId, obj, exceptWs = null) {
  const msg = JSON.stringify(obj);
  const exceptUserId = exceptWs?.userId; 
  wss.clients.forEach((client) => {

    if (client.roomId !== roomId) return;
    if (exceptUserId && client.userId === exceptUserId) return; 
    try { client.send(msg); } catch (e) { console.error('Error broadcasting to client:', e); }
  });
}


function broadcastUsers(roomId , userId) {
  const room = ensureRoom(roomId);
  const users = Array.from(room.users.entries()).map(([id, name]) => ({ id, name }));
  broadcastToRoom(roomId, { type: 'users', users });
}

wss.on('connection', (ws, req) => {
  // parse roomId from path: /roomId
  const url = req.url || '/';
  const parts = url.split('/').filter(Boolean);
  const roomId = parts[0] || 'default-room';
  ws.roomId = roomId;

  const room = ensureRoom(roomId);

  // temporary holder for the user's id/name on this socket
  ws.userId = crypto.randomUUID();
  ws.userName = 'Anonymous';

  ws.on('message', (raw) => {
    let data;
    try {
      data = JSON.parse(raw);
    } catch (e) {
      console.error('Invalid JSON from client:', e);
      return;
    }
    console.log(data);
    if (!data || !data.type) return;

    switch (data.type) {
      case 'join': {
        const name = typeof data.name === 'string' && data.name.trim() ? data.name.trim() : 'Anonymous';
        const userId = Math.random().toString(36).slice(2, 9);
        ws.userId = userId;
        ws.userName = name;
        room.users.set(userId, name);

        // send current shapes as an init message
        safeSend(ws, { type: 'init', shapes: Array.from(room.shapes.values()) ,id : userId });

        // broadcast updated users list to room
        broadcastUsers(roomId);
        break;
      }

      case 'update': {
        if (!Array.isArray(data.shapes)) break;
        for (const s of data.shapes) {
          if (s && s.id) room.shapes.set(s.id, s);
        }
        // broadcast to others in same room
        broadcastToRoom(roomId, { type: 'update', shapes: data.shapes }, ws);
        break;
      }

      case 'remove': {
        if (!Array.isArray(data.shapeIds)) break;
        for (const id of data.shapeIds) room.shapes.delete(id);
        broadcastToRoom(roomId, { type: 'remove', shapeIds: data.shapeIds }, ws);
        break;
      }

      default:
        // unknown type
        break;
    }
  });

  ws.on('close', () => {
    // remove user from room users map
    if (ws.userId) {
      const room = rooms.get(ws.roomId);
      if (room) {
        room.users.delete(ws.userId);
        broadcastUsers(ws.roomId);
      }
    }
  });
});

console.log(`WebSocket server running on ws://localhost:${PORT}`);
