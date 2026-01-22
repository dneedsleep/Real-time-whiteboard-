import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { createTLStore, Tldraw } from "tldraw";
import "tldraw/tldraw.css";

const WS_URL = "ws://localhost:8081";

export default function Room() {
  const { roomId } = useParams();
  const store = useMemo(() => createTLStore(), []);
  const wsRef = useRef<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);

  const username =
    sessionStorage.getItem("username") ||
    `User-${Math.floor(Math.random() * 1000)}`;

  // connect websocket
  useEffect(() => {
    const ws = new WebSocket(`${WS_URL}/${roomId}`);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      ws.send(JSON.stringify({ type: "join", name: username }));
    };

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);

      if (msg.type === "init" || msg.type === "update") {
        store.put(msg.shapes);
      }

      if (msg.type === "remove") {
        store.remove(msg.shapeIds);
      }
    };

    ws.onclose = () => setConnected(false);

    return () => ws.close();
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
