#!/usr/bin/env node
/**
 * Direct Birdeye API Test
 * Test the API directly to debug the issue
 */

import fetch from 'node-fetch';

const API_KEY = 'f31ad137262d4a57bbb85e0b35a75208';
const TEST_TOKEN = 'So11111111111111111111111111111111111111112'; // Wrapped SOL

console.log('🐦 DIRECT BIRDEYE API TEST');
console.log('=' .repeat(35));

async function testDirectAPI() {
  const url = `https://public-api.birdeye.so/defi/token_overview?address=${TEST_TOKEN}`;
  
  const headers = {
    'Accept': 'application/json',
    'x-chain': 'solana',
    'User-Agent': 'AxiomTrade/1.0',
    'X-API-KEY': API_KEY
  };
  
  console.log('🔗 URL:', url);
  console.log('🔑 Headers:', JSON.stringify(headers, null, 2));
  
  try {
    console.log('\n📡 Making API request...');
    const response = await fetch(url, {
      method: 'GET',
      headers: headers
    });
    
    console.log(`📊 Response Status: ${response.status} ${response.statusText}`);
    console.log(`📋 Response Headers:`, Object.fromEntries(response.headers.entries()));
    
    const data = await response.text();
    console.log(`📄 Response Body:`, data.substring(0, 500) + '...');
    
    if (response.ok) {
      const jsonData = JSON.parse(data);
      console.log('✅ API Success!');
      console.log('📊 Data:', JSON.stringify(jsonData, null, 2));
    } else {
      console.log('❌ API Error');
    }
    
  } catch (error) {
    console.log(`❌ Request failed: ${error.message}`);
  }
}

testDirectAPI(); 