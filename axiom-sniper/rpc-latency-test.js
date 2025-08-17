// rpc-latency-test.js
import { Connection } from "@solana/web3.js";

const RPCS = [
  {
    name: "Helius",
    url: "https://mainnet.helius-rpc.com/?api-key=43464bb1-0df3-4c2e-9e7d-20542fcd0060",
  },
  {
    name: "Solana Mainnet",
    url: "https://api.mainnet-beta.solana.com",
  },
  {
    name: "Triton RPC",
    url: "https://rpc.triton.one",
  },
  {
    name: "Jito",
    url: "https://rpc.jito.wtf/",
  },
];

const TRIALS = 5;

async function measureLatency(name, url) {
  const connection = new Connection(url);
  const latencies = [];

  for (let i = 0; i < TRIALS; i++) {
    const start = Date.now();
    try {
      await connection.getSlot("finalized");
      const end = Date.now();
      latencies.push(end - start);
    } catch (err) {
      console.log(`❌ Error from ${name}: ${err.message}`);
      latencies.push(null);
    }
  }

  const valid = latencies.filter((l) => l !== null);
  const avg =
    valid.reduce((sum, ms) => sum + ms, 0) / (valid.length || 1);

  return {
    name,
    latencies,
    avg: Math.round(avg),
    min: Math.min(...valid),
    max: Math.max(...valid),
  };
}

async function runBenchmarks() {
  console.log("⏱ Testing RPC latency across providers...\n");

  const results = [];
  for (const { name, url } of RPCS) {
    const result = await measureLatency(name, url);
    results.push(result);
    console.log(
      `📡 ${name}: avg ${result.avg}ms | min ${result.min}ms | max ${result.max}ms`
    );
  }

  const fastest = results.sort((a, b) => a.avg - b.avg)[0];
  console.log(
    `\n🏆 Fastest RPC: ${fastest.name} — avg ${fastest.avg}ms`
  );
}

runBenchmarks();
