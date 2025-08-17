import fetch from 'node-fetch'; // Install with: npm i node-fetch

const authToken ="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdXRoZW50aWNhdGVkVXNlcklkIjoiNjQ5NThiYjEtMzAxNi00NzgwLThiMDktZjY4NzA2MmNmYTIwIiwiaWF0IjoxNzUyMTMxODczLCJleHAiOjE3NTIxMzI4MzN9.mebSmeZfuynWS3zx2Lt_Lr_AtoYRm0JsU-s4yMtADwY"; // use real token here

const API_URL = 'https://api6.axiom.trade/meme-trending?timePeriod=1h';

async function testLatency() {
  const start = Date.now();

  const res = await fetch(API_URL, {
    method: 'GET',
    headers: {
      'Cookie': `auth-access-token=${authToken}`,
      'Content-Type': 'application/json',
      'User-Agent': 'Mozilla/5.0',
      'Accept': 'application/json'
    }
  });

  const end = Date.now();
  const ms = end - start;

  if (!res.ok) {
    console.error(`❌ Failed: ${res.status} ${res.statusText}`);
  } else {
    console.log(`✅ Axiom API latency: ${ms} ms`);
  }
}

testLatency();
