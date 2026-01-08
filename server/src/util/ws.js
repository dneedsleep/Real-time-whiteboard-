const WebSocket = require('ws');
const crypto = require('crypto');

function setupWebSocket(server) {
  const wss = new WebSocket.Server({ server });

  // rooms: roomId -> { users: Map<userId, name>, shapes: Map<shapeId, shape> }
  const rooms = new Map();

  function ensureRoom(roomId) {
    if (!rooms.has(roomId)) {
      rooms.set(roomId, { users: new Map(), shapes: new Map() });
    }
    return rooms.get(roomId);
  }

  function safeSend(ws, obj) {
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(obj));
    }
  }

  function broadcastToRoom(roomId, obj, exceptWs = null) {
    const msg = JSON.stringify(obj);
    const exceptUserId = exceptWs?.userId;

    wss.clients.forEach(client => {
      if (client.roomId !== roomId) return;
      if (exceptUserId && client.userId === exceptUserId) return;
      safeSend(client, obj);
    });
  }

  function broadcastUsers(roomId) {
    const room = ensureRoom(roomId);
    const users = Array.from(room.users.entries())
      .map(([id, name]) => ({ id, name }));

    broadcastToRoom(roomId, { type: 'users', users });
  }

  wss.on('connection', (ws, req) => {
    const parts = (req.url || '/').split('/').filter(Boolean);
    ws.roomId = parts[0] || 'default-room';

    const room = ensureRoom(ws.roomId);

    ws.userId = crypto.randomUUID();
    ws.userName = 'Anonymous';

    ws.on('message', raw => {
      let data;
      try {
        data = JSON.parse(raw);
      } catch {
        return;
      }

      switch (data.type) {
        case 'join': {
          const name = data.name?.trim() || 'Anonymous';
          const userId = crypto.randomUUID();

          ws.userId = userId;
          ws.userName = name;
          room.users.set(userId, name);

          safeSend(ws, {
            type: 'init',
            shapes: Array.from(room.shapes.values()),
            id: userId
          });

          broadcastUsers(ws.roomId);
          break;
        }

        case 'update': {
          if (!Array.isArray(data.shapes)) return;
          data.shapes.forEach(s => s?.id && room.shapes.set(s.id, s));
          broadcastToRoom(ws.roomId, { type: 'update', shapes: data.shapes }, ws);
          break;
        }

        case 'remove': {
          if (!Array.isArray(data.shapeIds)) return;
          data.shapeIds.forEach(id => room.shapes.delete(id));
          broadcastToRoom(ws.roomId, { type: 'remove', shapeIds: data.shapeIds }, ws);
          break;
        }
      }
    });

    ws.on('close', () => {
      room.users.delete(ws.userId);
      broadcastUsers(ws.roomId);
    });
  });
}

module.exports = {setupWebSocket};
