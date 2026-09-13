const { WebSocketServer, WebSocket } = require('ws');

const port = process.env.WS_PORT || 5174;
const wss = new WebSocketServer({ port }, () => {
  console.log(`[Supermercado Osos] WebSockets server listening on ws://localhost:${port}`);
});

wss.on('connection', (ws) => {
  ws.send(JSON.stringify({
    type: 'CONNECTED',
    message: 'WebSockets Supermercado Osos Live',
    timestamp: new Date().toISOString(),
  }));

  ws.on('message', (message) => {
    const data = message.toString();
    // Broadcast to all other connected clients
    for (const client of wss.clients) {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    }
  });
});
