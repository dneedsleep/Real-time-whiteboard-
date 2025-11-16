import { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { createTLStore, Tldraw } from 'tldraw';
import 'tldraw/tldraw.css';

const URL = process.env.VITE_WS_URL ;

interface User { id: string; name: string; }


const Room = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const store = useMemo(() => createTLStore(), []);
  const socketRef = useRef<WebSocket | null>(null);
  const applyingRemoteRef = useRef(false);
  const recentLocalRef = useRef<Map<string, number>>(new Map());
  const [onlineUsers, setOnlineUsers] = useState<User[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [showUsers, setShowUsers] = useState(false);
  const [mousePressed, setMousepressed] = useState(false);


  const userName = sessionStorage.getItem('username') || `User-${Math.floor(Math.random()*1000)}`;
  function logMouseUp() {
    setMousepressed(!mousePressed);
  }


  useEffect(() => {
    if (!roomId) {
      alert('No roomId provided');
      return;
    }
    

    console.log('Connecting to room:', roomId, 'as:', userName);
    const ws = new WebSocket(`${URL}/${roomId}`);
    socketRef.current = ws;

    ws.addEventListener('open', () => {
      console.log('WebSocket open');
      setIsConnected(true);
      ws.send(JSON.stringify({ type: 'join', name: userName }));
      
    });

    ws.addEventListener('error', (err) => {
      console.error('WebSocket error', err);
      setIsConnected(false);
    });

    // We apply remote updates immediately. `applyingRemoteRef` prevents
    // the store.listen handler from re-sending these changes back to server.

    ws.addEventListener('message', async (event) => {
      try {
        let text: string;
        if (typeof event.data === 'string') text = event.data;
        else if (event.data instanceof Blob) text = await event.data.text();
        else if (event.data instanceof ArrayBuffer) text = new TextDecoder().decode(event.data);
        else text = String(event.data);

        const msg = JSON.parse(text);
        if ((msg.type === 'init' || msg.type === 'update') && Array.isArray(msg.shapes)) {
          // apply remote shapes immediately
          applyingRemoteRef.current = true;
          try {
            store.put(msg.shapes);
          } finally {
            applyingRemoteRef.current = false;
          }
        } else if (msg.type === 'users' && Array.isArray(msg.users)) {
          setOnlineUsers(msg.users);
        } else if (msg.type === 'remove' && Array.isArray(msg.shapeIds)) {
          applyingRemoteRef.current = true;
          try {
            store.remove(msg.shapeIds as any[]);
          } finally {
            applyingRemoteRef.current = false;
          }
        } else {
          console.warn('Unknown message type:', msg);
        }
      } catch (err) {
        console.error('Failed to parse WS message', err);
      }
    });

    return () => {
      try { ws.close(); } catch (e) {}
      socketRef.current = null;
    };
  }, []);
  
  // Buffer to collect shape updates before sending
const updateBuffer = useRef<any[]>([]);
const deleteBuffer = useRef<string[]>([]);
const debounceTimer = useRef<NodeJS.Timeout | null>(null);

// Debounce function to send updates
function flushUpdates() {
  const ws = socketRef.current;
  if (!ws || ws.readyState !== WebSocket.OPEN) return;

  if (updateBuffer.current.length > 0) {
    ws.send(JSON.stringify({ type: 'update', shapes: updateBuffer.current }));
    updateBuffer.current = [];
  }
  if (deleteBuffer.current.length > 0) {
    ws.send(JSON.stringify({ type: 'remove', shapeIds: deleteBuffer.current }));
    deleteBuffer.current = [];
  }
}


  useEffect(() => {
  const cleanup = store.listen((entry) => {
    if (applyingRemoteRef.current) return;

    const { added = {}, updated = {}, removed = {} } = entry.changes as any;
    const now = Date.now();

    for (const id in added) {
      const rec = (added as any)[id];
      if (rec?.typeName === 'shape') {
        recentLocalRef.current.set(rec.id, now);
        updateBuffer.current.push(rec);
      }
    }

    for (const id in updated) {
      const pair = (updated as any)[id];
      const next = pair && pair[1];
      if (next?.typeName === 'shape') {
        recentLocalRef.current.set(next.id, now);
        updateBuffer.current.push(next);
      }
    }

    for (const id in removed) {
      const rec = (removed as any)[id];
      deleteBuffer.current.push(rec?.id ?? id);
    }

    // Debounce: wait 100ms after last change before sending
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => flushUpdates(), 100);
  });

  return cleanup;
}, []);


  // Render
  return (
    <div style={{ position: 'relative', height: '100vh' }} >
      {/* Top center controls */}
      <div style={{ position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)', zIndex: 1000, display: 'flex', gap: 8 , color:'black' }}>
        <button
          onClick={() => { sessionStorage.removeItem('username'); navigate('/'); }}
          style={{
            padding: '8px 12px',
            borderRadius: 8,
            border: '1px solid rgba(0,0,0,0.08)',
            background: '#fff',
            boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
            cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          Leave Room
        </button>

        <button
          onClick={() => setShowUsers((s) => !s)}
          style={{
            padding: '8px 12px',
            borderRadius: 8,
            border: '1px solid rgba(0,0,0,0.08)',
            background: showUsers ? '#f3f4f6' : '#fff',
            boxShadow: showUsers ? 'none' : '0 2px 6px rgba(0,0,0,0.06)',
            cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          {showUsers ? 'Hide Users' : 'Show Users'}
        </button>

        <div style={{ marginLeft: 8, color: 'rgba(0,0,0,0.75)', fontSize: 13 }}>Status: {isConnected ? 'Connected' : 'Disconnected'}</div>
      </div>

     

      {/* expanded users panel */}
      {showUsers && (
        <div
          style={{
            position: 'absolute',
            top: 48,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1001,
            background: '#ffffff',
            color: 'black',
            padding: 12,
            borderRadius: 10,
            boxShadow: '0 10px 30px rgba(2,6,23,0.08)',
            minWidth: 220,
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: 8 }}>Online Users</div>
          <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {onlineUsers.length === 0 ? (
              <li style={{ padding: '8px 6px', borderRadius: 8, background: '#f8fafc', color: '#6b7280' }}>No users</li>
            ) : (
              onlineUsers.map((u) => (
                <li
                  key={u.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '6px 8px',
                    borderRadius: 8,
                    background: '#fff',
                    border: '1px solid rgba(15,23,42,0.04)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 36,
                      height: 36,
                      borderRadius: 9999,
                      background: '#eef2ff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      color: 'black',
                    }}>{u.name.charAt(0).toUpperCase()}</div>
                    <div style={{ fontWeight: 600 }}>{u.name}</div>
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>
      )}

      {/* the canvas */}
      <div style={{ height: '100%' } }onMouseUp={() => logMouseUp()}>
  <Tldraw store={store}  />
      </div>
    </div>
  );
};

export default Room;

