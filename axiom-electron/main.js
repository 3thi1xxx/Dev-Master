// main.js
import dotenv from 'dotenv';
dotenv.config();

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const COOKIE = process.env.AXIOM_COOKIE;

async function fetchPulse() {
  try {
    const res = await fetch('https://api6.axiom.trade/api/v2/pulse', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0',
        'Cookie': COOKIE
      }
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();
    console.log(`✅ Fetched ${data.data.length} tokens`);
    console.log(data.data); // full list
  } catch (err) {
    console.error('❌ Fetch error:', err.message);
  }
}

fetchPulse();
