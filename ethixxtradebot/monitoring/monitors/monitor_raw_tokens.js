#!/usr/bin/env node
import WebSocket from 'ws';

console.log('�� RAW TOKEN MONITOR - Connecting to Cluster7...\n');

const ws = new WebSocket('wss://cluster7.axiom.trade/', {
  headers: {
    'User-Agent': 'Mozilla/5.0',
    'Origin': 'https://axiom.trade'
  }
});

let messageCount = 0;

ws.on('open', () => {
  console.log('✅ Connected to Cluster7');
  console.log('📡 Subscribing to new_pairs...\n');
  
  ws.send(JSON.stringify({
    command: 'subscribe',
    channel: 'new_pairs'
  }));
});

ws.on('message', (data) => {
  messageCount++;
  try {
    const msg = JSON.parse(data.toString());
    console.log(`[${new Date().toLocaleTimeString()}] Message #${messageCount}:`);
    console.log(JSON.stringify(msg, null, 2));
    console.log('-'.repeat(50));
  } catch (e) {
    console.log('Raw message:', data.toString());
  }
});

ws.on('error', (error) => {
  console.error('❌ WebSocket error:', error.message);
});

ws.on('close', () => {
  console.log('\n�� Connection closed');
});

process.on('SIGINT', () => {
  console.log('\n👋 Closing monitor...');
  ws.close();
  process.exit(0);
});
