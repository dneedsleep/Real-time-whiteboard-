const WebSocket = require('ws');
const crypto = require('crypto');
const { redis, pub, sub } = require('./redis');
const { getRoomInfo, bulkUpdate } = require('../controllers/room');

const HEARTBEAT_INTERVAL = 2000;
const HEARTBEAT_VALUE = 1;
const SERVER_ID = crypto.randomUUID();

function setupWebSocket(server) {
  const wss = new WebSocket.Server({ server });

  // local cache (per server)
  const rooms = new Map();

  /* ---------------- REDIS SUB ---------------- */

  sub.psubscribe('room:*');

  sub.on('pmessage', (pattern, channel, message) => {
    try {
      const { payload, exceptUserId } = JSON.parse(message);
      const roomId = channel.replace('room:', '');

      wss.clients.forEach(client => {
        if (client.roomId !== roomId) return;
        if (client.userId === exceptUserId) return; // skip sender
        if (client.readyState !== WebSocket.OPEN) return;

        client.send(JSON.stringify(payload));
      });
    } catch (err) {
      console.error('Redis message parse error:', err);
    }
  });


  /* ---------------- ROOM UTILS ---------------- */

  async function ensureRoom(roomId) {
    if (!rooms.has(roomId)) {
      const shapes = await getRoomInfo(roomId);
      rooms.set(roomId, {
        users: new Map(),
        shapes: shapes || {}
      });
    }
    return rooms.get(roomId);
  }

  function broadcastRedis(roomId, payload, exceptUserId) {
    pub.publish(
      `room:${roomId}`,
      JSON.stringify({ roomId, payload, exceptUserId })
    );
  }

  /* ---------------- WS HANDLER ---------------- */

  wss.on('connection', async (ws, req) => {
    const roomId = (req.url || '/')
      .replace(/^\/ws/, '')
      .replace(/^\//, '');

    ws.roomId = roomId;
    ws.userId = crypto.randomUUID();
    ws.isAlive = true;

    const room = await ensureRoom(roomId);

    ws.on('message', async (raw, isBinary) => {
      if (isBinary && raw[0] === HEARTBEAT_VALUE) {
        ws.isAlive = true;
        return;
      }

      let data;
      try {
        data = JSON.parse(raw);
      } catch {
        return;
      }

      if (data.type === 'join') {
        room.users.set(ws.userId, data.name);

        ws.send(JSON.stringify({
          type: 'init',
          shapes: Object.values(room.shapes),
          id: ws.userId
        }));
      }

      if (data.type === 'update') {
        data.shapes.forEach(s => {
          room.shapes[s.id] = s;
        });

        broadcastRedis(roomId, {
          type: 'update',
          shapes: data.shapes
        }, ws.userId);
      }

      if (data.type === 'remove') {
        data.shapeIds.forEach(id => delete room.shapes[id]);

        broadcastRedis(roomId, {
          type: 'remove',
          shapeIds: data.shapeIds
        }, ws.userId);
      }
    });

    ws.on('close', () => {
      room.users.delete(ws.userId);
    });
  });

  /* ---------------- HEARTBEAT ---------------- */

  setInterval(() => {
    wss.clients.forEach(ws => {
      if (!ws.isAlive) return ws.terminate();
      ws.isAlive = false;
      ws.send(Buffer.from([HEARTBEAT_VALUE]));
    });
  }, HEARTBEAT_INTERVAL);

  /* ---------------- SAFE BULK BACKUP ---------------- */

  setInterval(async () => {
    const lock = await redis.set('whiteboard:backup_lock', SERVER_ID, 'NX', 'PX', 4000);

    if (!lock) return;

    try {
      const updates = Array.from(rooms.entries()).map(
        ([roomId, data]) => ({
          roomId,
          shapes: data.shapes
        })
      );

      await bulkUpdate(updates);
    } finally {
      const val = await redis.get('whiteboard:backup_lock');
      if (val === SERVER_ID) {
        await redis.del('whiteboard:backup_lock');
      }
    }
  }, 5000);
}

module.exports = { setupWebSocket };
