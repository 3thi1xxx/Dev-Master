// axiom-sniper.js

import fetch from 'node-fetch';

// 🔐 Paste your full Axiom cookie here
const COOKIE = 'auth-refresh-token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyZWZyZXNoVG9rZW5JZCI6ImZjZmVjNDhhLTNlY2UtNDdhZC1hODM4LWQxMmIyNzI4ZDc0NiIsImlhdCI6MTc1MTk3Mzk1Nn0.-bm3igLVV2tBzidlXo5BUFtvdM4_lCPnpXWDNbu_giY; auth-access-token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdXRoZW50aWNhdGVkVXNlcklkIjoiNjQ5NThiYjEtMzAxNi00NzgwLThiMDktZjY4NzA2MmNmYTIwIiwiaWF0IjoxNzUyMTA1Mzc5LCJleHAiOjE3NTIxMDYzMzl9.YHSYmmMe5BuaAMq_HyNsq_rP29nhF3V_H2FZpiGeUaM';

// 🔗 Trending endpoint (1-hour window)
const TRENDING_ENDPOINT = 'https://api7.axiom.trade/meme-trending?timePeriod=1h';

// 🎯 Filtering rules
const CONFIG = {
  minVolume: 1000,             // USD
  minBuyCount: 25,
  maxFDV: 5_000_000,           // $5M
  recentMinutes: 3,           // created within last 3 minutes
  maxTop10Holders: 30.0,      // percent
  minLpBurned: 1,
  requireSocials: true,
  minPercentChange: 3.0,
  maxPercentChange: 200.0
};

// 🕒 Check if token was created recently
function isRecent(createdAt) {
  if (!createdAt) return false;
  const created = new Date(createdAt);
  const now = new Date();
  const diff = now - created;
  return diff <= CONFIG.recentMinutes * 60 * 1000;
}

// 📢 Check if token has website + socials
function hasSocials(t) {
  return t.website && t.twitter && t.telegram;
}

// 🔌 Fetch trending tokens
async function fetchTrendingTokens() {
  try {
    const res = await fetch(TRENDING_ENDPOINT, {
      headers: {
        'cookie': COOKIE,
        'accept': 'application/json',
      }
    });

    if (!res.ok) {
      throw new Error(`Request failed: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();

    // 🧪 Debug: Raw data output
    console.log('\n--- RAW TRENDING TOKENS ---');
    console.log(data);

    return data;
  } catch (err) {
    console.error('❌ Error fetching trending tokens:', err.message);
    return [];
  }
}

// 🧠 Filter tokens using rules
function filterTokens(tokens) {
  return tokens.filter(t => {
    const fdv = t.fdvUsd || 0;
    const topHolders = t.top10Holders || 100;
    const lpBurned = t.lpBurned || 0;
    const percentChange = t.marketCapPercentChange || 0;

    return (
      t.volume >= CONFIG.minVolume &&
      t.buyCount >= CONFIG.minBuyCount &&
      fdv <= CONFIG.maxFDV &&
      isRecent(t.createdAt) &&
      topHolders <= CONFIG.maxTop10Holders &&
      lpBurned >= CONFIG.minLpBurned &&
      percentChange >= CONFIG.minPercentChange &&
      percentChange <= CONFIG.maxPercentChange &&
      (!CONFIG.requireSocials || hasSocials(t))
    );
  });
}

// ▶️ Run it!
(async () => {
  const trending = await fetchTrendingTokens();
  const filtered = filterTokens(trending);

  console.log(`\n🔍 Found ${filtered.length} trending tokens that match filters:\n`);
  filtered.forEach(t => {
    console.log(`🚀 ${t.tokenName} | ${t.tokenTicker}`);
    console.log(`    Vol: $${t.volume} | FDV: $${t.fdvUsd} | Buys: ${t.buyCount}`);
    console.log(`    Created: ${t.createdAt} | LP Burned: ${t.lpBurned}`);
    console.log(`    Top10Holders: ${t.top10Holders}%`);
    console.log(`    Site: ${t.website}`);
    console.log(`    Twitter: ${t.twitter}`);
    console.log(`    Telegram: ${t.telegram}`);
    console.log('');
  });
})();
