#!/usr/bin/env node
/**
 * Test Real Birdeye WebSocket API
 * Based on official documentation: https://docs.birdeye.so/docs/websocket
 */

import WebSocket from 'ws';

const BIRDEYE_API_KEY = process.env.BIRDEYE_API_KEY || 'f31ad137262d4a57bbb85e0b35a75208';
const CHAIN = 'solana';

console.log('🐦 BIRDEYE WEBSOCKET TEST (REAL API)');
console.log('=' .repeat(50));
console.log(`📡 Chain: ${CHAIN}`);
console.log(`🔑 API Key: ${BIRDEYE_API_KEY.substring(0, 8)}...`);
console.log('');

// Test tokens
const testTokens = [
  { address: 'So11111111111111111111111111111111111111112', symbol: 'SOL' },
  { address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', symbol: 'USDC' },
  { address: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263', symbol: 'BONK' }
];

// WebSocket URL with API key
const wsUrl = `wss://public-api.birdeye.so/socket/${CHAIN}?x-api-key=${BIRDEYE_API_KEY}`;

// Create WebSocket with proper headers
const ws = new WebSocket(wsUrl, 'echo-protocol', {
  headers: {
    'Origin': 'ws://public-api.birdeye.so',
    'Sec-WebSocket-Origin': 'ws://public-api.birdeye.so',
    'Sec-WebSocket-Protocol': 'echo-protocol'
  }
});

// Ping interval for connection stability
let pingInterval;
const PING_INTERVAL = 30000; // 30 seconds

ws.on('open', () => {
  console.log('✅ Connected to Birdeye WebSocket!');
  console.log('');
  
  // Start ping interval
  pingInterval = setInterval(() => {
    if (ws.readyState === WebSocket.OPEN) {
      console.log('🏓 Sending ping...');
      ws.ping();
    }
  }, PING_INTERVAL);
  
  // Subscribe to NEW_PAIR events (new token listings)
  console.log('📡 Subscribing to NEW_PAIR events...');
  ws.send(JSON.stringify({
    type: 'SUBSCRIBE_NEW_PAIR'
  }));
  
  // Subscribe to price updates for test tokens
  testTokens.forEach(token => {
    console.log(`📊 Subscribing to price updates for ${token.symbol}...`);
    ws.send(JSON.stringify({
      type: 'SUBSCRIBE_PRICE',
      data: {
        chartType: '1m',  // 1 minute candles
        currency: 'token',
        address: token.address
      }
    }));
    
    // Also subscribe to transactions
    console.log(`💸 Subscribing to transactions for ${token.symbol}...`);
    ws.send(JSON.stringify({
      type: 'SUBSCRIBE_TXS',
      data: {
        currency: 'token',
        address: token.address
      }
    }));
  });
  
  // Subscribe to large trades (>$10k)
  console.log('🐋 Subscribing to large trades (>$10k)...');
  ws.send(JSON.stringify({
    type: 'SUBSCRIBE_LARGE_TRADE_TXS',
    data: {
      min_volume: 10000  // $10k USD (FIXED: changed volume → min_volume per Birdeye docs)
    }
  }));
  
  console.log('\n🎯 Listening for events...\n');
});

ws.on('message', (data) => {
  try {
    const message = JSON.parse(data.toString());
    
    // Handle different message types
    if (message.type === 'NEW_PAIR') {
      console.log('🆕 NEW PAIR DETECTED!');
      console.log(`  Symbol: ${message.data?.symbol || 'Unknown'}`);
      console.log(`  Address: ${message.data?.address || 'Unknown'}`);
      console.log(`  Liquidity: $${message.data?.liquidity || 0}`);
      console.log('');
    }
    else if (message.type === 'PRICE_DATA') {
      const price = message.data;
      console.log(`📈 Price Update: ${price.symbol || 'Unknown'}`);
      console.log(`  Price: $${price.c || 0}`);  // close price
      console.log(`  Volume: $${price.v || 0}`);
      console.log(`  Time: ${new Date(price.unixTime * 1000).toLocaleTimeString()}`);
      console.log('');
    }
    else if (message.type === 'TXS_DATA') {
      const tx = message.data;
      console.log(`💸 Transaction: ${tx.symbol || 'Unknown'}`);
      console.log(`  Type: ${tx.side || 'Unknown'}`);
      console.log(`  Amount: $${tx.amount || 0}`);
      console.log(`  Trader: ${tx.owner?.substring(0, 8)}...`);
      console.log('');
    }
    else if (message.type === 'LARGE_TXS_DATA') {
      const tx = message.data;
      console.log('🐋 LARGE TRADE DETECTED!');
      console.log(`  Token: ${tx.symbol || 'Unknown'}`);
      console.log(`  Amount: $${tx.amount || 0}`);
      console.log(`  Type: ${tx.side || 'Unknown'}`);
      console.log(`  Trader: ${tx.owner?.substring(0, 8)}...`);
      console.log('');
    }
    else {
      console.log(`📦 Received: ${message.type}`);
      console.log(`  Data:`, JSON.stringify(message.data, null, 2).substring(0, 200));
      console.log('');
    }
  } catch (error) {
    console.log('📦 Raw message:', data.toString().substring(0, 200));
  }
});

ws.on('pong', () => {
  console.log('🏓 Received pong');
});

ws.on('error', (error) => {
  console.error('❌ WebSocket error:', error.message);
});

ws.on('close', (code, reason) => {
  console.log(`🔌 Connection closed: ${code} - ${reason}`);
  if (pingInterval) clearInterval(pingInterval);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down...');
  
  // Unsubscribe from all events
  ws.send(JSON.stringify({ type: 'UNSUBSCRIBE_NEW_PAIR' }));
  ws.send(JSON.stringify({ type: 'UNSUBSCRIBE_PRICE' }));
  ws.send(JSON.stringify({ type: 'UNSUBSCRIBE_TXS' }));
  ws.send(JSON.stringify({ type: 'UNSUBSCRIBE_LARGE_TRADE_TXS' }));
  
  ws.close();
  if (pingInterval) clearInterval(pingInterval);
  process.exit(0);
});

console.log('Press Ctrl+C to stop\n'); 