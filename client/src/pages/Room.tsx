import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { createTLStore, Tldraw } from "tldraw";
import type { WebSocketExt } from '../typings/index'
import "tldraw/tldraw.css";

const WS_URL = "ws://localhost/ws/" ;


export default function Room() {
  const { roomId } = useParams();
  const store = useMemo(() => createTLStore(), []);
  const wsRef = useRef<WebSocketExt | null>(null);
  const [connected, setConnected] = useState(false);
  const HEARTBEAT_TIMEOUT = 1000 * 4;
  const HEARTBEAT_VALUE = 1;


  const username =
    sessionStorage.getItem("username") ||
    `User-${Math.floor(Math.random() * 1000)}`;

  // connect websocket
  useEffect(() => {
    let ws: WebSocketExt;
    ws = new WebSocket(`${WS_URL}/${roomId}`);
    wsRef.current = ws;

    function heartbeat() {
      if (!ws) {
        return;
      }
      if (!!ws.pingTimeout) {
        clearTimeout(ws.pingTimeout);
      }

      const data = new Uint8Array(1);
      data[0] = HEARTBEAT_VALUE;
      console.log('received')
      ws.send(data);

      ws.pingTimeout = setTimeout(() => {
        ws.close()
      }, HEARTBEAT_TIMEOUT)

    }

    function isBinary(obj: any) {
        return typeof obj === 'object' && Object.prototype.toString.call(obj) === '[object Blob]';
    }

    ws.onopen = () => {
      setConnected(true);
      ws.send(JSON.stringify({ type: "join", name: username }));
    };

    ws.onmessage = (event) => {
      if (isBinary(event.data)) {
        console.log('isBinary is working')
        heartbeat();
      }
      else {
        const msg = JSON.parse(event.data);

        if (msg.type === "init" || msg.type === "update") {
          store.put(msg.shapes);
        }

        if (msg.type === "remove") {
          store.remove(msg.shapeIds);
        }
      }
    };

    ws.onclose = () => {
      setConnected(false);
      if (!!ws.pingTimeout) {
        clearTimeout(ws.pingTimeout);
      }
    }

    return (() => ws.close());
  }, [roomId]);

  // listen to local drawing changes
  useEffect(() => {
    return store.listen((entry) => {
      const ws = wsRef.current;
      if (!ws || ws.readyState !== WebSocket.OPEN) return;

      const { added = {}, updated = {}, removed = {} } = entry.changes as any;

      const shapesToSend: any[] = [];

      Object.values(added).forEach((s: any) => {
        if (s.typeName === "shape") shapesToSend.push(s);
      });

      Object.values(updated).forEach(([, s]: any) => {
        if (s?.typeName === "shape") shapesToSend.push(s);
      });

      if (shapesToSend.length > 0) {
        ws.send(JSON.stringify({ type: "update", shapes: shapesToSend }));
      }

      const removedIds = Object.keys(removed);
      if (removedIds.length > 0) {
        ws.send(JSON.stringify({ type: "remove", shapeIds: removedIds }));
      }
    });
  }, []);

  return (
    <div style={{ height: "99vh" }}>
      <div style={{ padding: 8, fontSize: 14 }}>
        Status: {connected ? "Connected" : "Disconnected"}
      </div>

      <Tldraw store={store} />
    </div>
  );
}
