#!/usr/bin/env node
/**
 * Test Different Birdeye Endpoints
 * Find which endpoints work with the current API key
 */

import fetch from 'node-fetch';

const API_KEY = 'f31ad137262d4a57bbb85e0b35a75208';
const TEST_TOKEN = 'So11111111111111111111111111111111111111112'; // Wrapped SOL

console.log('🐦 TESTING BIRDEYE API ENDPOINTS');
console.log('=' .repeat(40));

const endpoints = [
  {
    name: 'Token Overview',
    url: `https://public-api.birdeye.so/defi/token_overview?address=${TEST_TOKEN}`
  },
  {
    name: 'Price Data',
    url: `https://public-api.birdeye.so/defi/price?address=${TEST_TOKEN}`
  },
  {
    name: 'Market Data',
    url: `https://public-api.birdeye.so/defi/token_market?address=${TEST_TOKEN}`
  },
  {
    name: 'Holder Analysis',
    url: `https://public-api.birdeye.so/defi/holder_list?address=${TEST_TOKEN}&limit=10`
  },
  {
    name: 'Trade History',
    url: `https://public-api.birdeye.so/defi/trade_history?address=${TEST_TOKEN}&limit=10`
  }
];

const headers = {
  'Accept': 'application/json',
  'x-chain': 'solana',
  'User-Agent': 'AxiomTrade/1.0',
  'X-API-KEY': API_KEY
};

async function testEndpoint(name, url) {
  try {
    console.log(`\n🔍 Testing: ${name}`);
    console.log(`🔗 URL: ${url}`);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: headers
    });
    
    console.log(`📊 Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ SUCCESS: ${name}`);
      console.log(`📄 Data keys: ${Object.keys(data).join(', ')}`);
    } else {
      const errorText = await response.text();
      console.log(`❌ FAILED: ${name}`);
      console.log(`📄 Error: ${errorText.substring(0, 100)}...`);
    }
    
  } catch (error) {
    console.log(`❌ ERROR: ${name} - ${error.message}`);
  }
}

async function testAllEndpoints() {
  for (const endpoint of endpoints) {
    await testEndpoint(endpoint.name, endpoint.url);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Rate limiting
  }
}

testAllEndpoints(); 