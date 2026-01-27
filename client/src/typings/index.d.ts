export interface WebSocketExt extends WebSocket {
  pingTimeout?: ReturnType<typeof setTimeout>;
}