const WebSocket = require('ws');
const crypto = require('crypto');
const { getRoomInfo, bulkUpdate } = require('../controllers/room');

const HEARTBEAT_INTERVAL = 1000 * 2 // 10 sec;
const HEARTBEAT_VALUE = 1;

function ping(ws) {
  console.log('ping');
  ws.send(Buffer.from([HEARTBEAT_VALUE]));
}

function setupWebSocket(server) {
  const wss = new WebSocket.Server({ server });

  // rooms: roomId -> { users: Map<userId, name>, { shapes: { [shapeId] ; shape}} } 
  const rooms = new Map();

  let isbackUpPending = false;
  setInterval(async () => {
    if (isbackUpPending) return;

    isbackUpPending = true;

    const updates = Array.from(rooms.entries()).map(
      ([roomId, roomInfo]) => ({ roomId: roomId, shapes: roomInfo.shapes })
    );


    // auto update it 

    await bulkUpdate(updates).finally(() => { isbackUpPending = false });


  }, 5000)

  async function ensureRoom(roomId) {

    if (!rooms.has(roomId)) {
      const shapesInfo = await getRoomInfo(roomId);
      if(shapesInfo == "No room found") return false;
      rooms.set(roomId, { users: new Map(), shapes: shapesInfo || {} });
      //console.log(shapesInfo)
    }


    return rooms.get(roomId);
  }

  function safeSend(ws, obj) {
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(obj));
    }
  }

  function broadcastToRoom(roomId, obj, exceptWs = null) {
    const exceptUserId = exceptWs?.userId;

    wss.clients.forEach(client => {
      if (client.roomId !== roomId) return;
      if (exceptUserId && client.userId === exceptUserId) return;
      safeSend(client, obj);
    });
  }

  async function broadcastUsers(roomId) {
    const room = await ensureRoom(roomId);
    if(room  == false) return;
    const users = Array.from(room.users.entries())
      .map(([id, name]) => ({ id, name }));

    broadcastToRoom(roomId, { type: 'users', users });
  }

  wss.on('connection', async (ws, req) => {
    ws.isAlive = true;
    const parts = (req.url || '/').split('/').filter(Boolean);
    ws.roomId = parts[0] || 'default-room';

    const room = await ensureRoom(ws.roomId);
    if(room == false) return ;
    ws.userName = 'Anonymous';

    ws.on('message', (raw, isBinary) => {
      if (isBinary && raw[0] == HEARTBEAT_VALUE) {
        console.log('pong');
        ws.isAlive = true;
      }
      else {
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
              shapes: Object.values(room.shapes),
              id: userId
            });

            broadcastUsers(ws.roomId);
            break;
          }

          case 'update': {
            if (!Array.isArray(data.shapes)) return;
            console.log(data);
            data.shapes.forEach(s => {
              if (!s?.id) return;
              room.shapes[s.id] = s;
            })

            broadcastToRoom(ws.roomId, { type: 'update', shapes: data.shapes }, ws);
            break;
          }

          case 'remove': {
            if (!Array.isArray(data.shapeIds)) return;
            data.shapeIds.forEach(id => {
              delete room.shapes[id];
            }
            );
            broadcastToRoom(ws.roomId, { type: 'remove', shapeIds: data.shapeIds }, ws);
            break;
          }
        }
      }
    });

    ws.on('close', () => {
      room.users.delete(ws.userId);
      broadcastUsers(ws.roomId);
      if (room.users.size == 0) {
        // update the room

        // then remove the remove from map
        //rooms.delete(roomId);
        //console.log(`deleted Room id ${roomId}`);
      }
    });
  });

  const interval = setInterval(() => {
    console.log('firing interval')
    wss.clients.forEach(client => {
      if (!client.isAlive) {
        client.terminate();
      }

      client.isAlive = false;
      ping(client);
    })
  }, HEARTBEAT_INTERVAL)

  wss.on('close',()=>{
    clearInterval(interval);
  })
}

module.exports = { setupWebSocket };
