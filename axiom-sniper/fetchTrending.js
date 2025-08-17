// 🧠 Axiom Trending Token Ranker

const fetch = global.fetch || (await import('node-fetch')).default;

const authToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdXRoZW50aWNhdGVkVXNlcklkIjoiNjQ5NThiYjEtMzAxNi00NzgwLThiMDktZjY4NzA2MmNmYTIwIiwiaWF0IjoxNzUyMTIwMzg3LCJleHAiOjE3NTIxMjEzNDd9.9DNXYYZX-7Q0xqlkOzdetNYYk5AmvRzmAWGcTrSZQKo"; // full cookie from DevTools

const API_URL = 'https://api6.axiom.trade/meme-trending?timePeriod=1h';

async function getTrendingTokens(token) {
  const res = await fetch(API_URL, {
    method: 'GET',
    headers: {
      'Cookie': `auth-access-token=${token}`,
      'Content-Type': 'application/json',
      'User-Agent': 'Mozilla/5.0',
      'Accept': 'application/json'
    }
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Request failed: ${res.status} — ${errText}`);
  }

  return await res.json();
}

function filterTokens(tokens) {
  const now = Date.now();

  return tokens.filter(token => {
    const createdAt = new Date(token.createdAt).getTime();
    const ageMinutes = (now - createdAt) / (1000 * 60);

    const liquidity = token.liquiditySol ?? 0;
    const volume = token.volumeSol ?? 0;
    const marketCap = token.marketCapSol ?? 0;
    const top10Holders = token.top10Holders ?? 100;
    const protocol = token.protocol || '';
    const pairData = token.pairRecentData || [];

    console.log(
      `🔍 ${token.tokenSymbol || 'Unnamed'} | Age: ${Math.round(ageMinutes)} min | ` +
      `Liq: ${liquidity} | Vol: ${volume} | MC: ${marketCap} | Top10: ${top10Holders} | ` +
      `Pairs: ${pairData.length} | Protocol: ${protocol}`
    );

    return (
      ageMinutes <= 20 &&
      liquidity >= 100 &&
      volume >= 150 &&
      (volume / liquidity) >= 0.25 &&
      marketCap >= 1000 &&
      marketCap <= 300000 &&
      top10Holders <= 30 &&
      protocol === 'Raydium CPMM' &&
      pairData.length > 0
    );
  });
}


function rankTokens(tokens) {
  return tokens.map(t => {
    const ageMin = (Date.now() - new Date(t.createdAt)) / 60000;
    const ageFactor = Math.max(0.5, 15 - ageMin) / 15;
    const score = (((t.volumeSol ?? 0) / (t.liquiditySol ?? 1)) * 100) * ageFactor;
    return { ...t, score: Math.round(score * 100) / 100 };
  }).sort((a, b) => b.score - a.score);
}

(async () => {
  try {
    const tokens = await getTrendingTokens(authToken);
    console.log(`\n📥 Got ${tokens.length} tokens`);
    const filtered = filterTokens(tokens);
    const ranked = rankTokens(filtered);

    console.log(`\n🏆 Top ${ranked.length} Tokens:\n`);
    ranked.forEach((t, i) => {
      console.log(`${i + 1}. ${t.tokenSymbol} | Score: ${t.score}`);
      console.log(`    Vol: $${Math.round(t.volumeSol)} | Liq: $${Math.round(t.liquiditySol)} | FDV: $${Math.round(t.marketCapSol)}`);
      console.log(`    Age: ${t.createdAt} | Pair: ${t.dexPairAddress}`);
      console.log('----------------------------------------');
    });
  } catch (err) {
    console.error("❌ Error fetching tokens:", err);
  }
})();
