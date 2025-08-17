// ws-test.js
import WebSocket from 'ws';

const start = Date.now();
const ws = new WebSocket('wss://mainnet.helius-rpc.com/?api-key=43464bb1-0df3-4c2e-9e7d-20542fcd0060');

ws.on('open', () => {
  const latency = Date.now() - start;
  console.log(`✅ Helius WebSocket latency: ${latency}ms`);
  ws.terminate();
});
