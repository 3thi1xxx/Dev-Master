import 'dotenv/config';
import { Connection, PublicKey } from '@solana/web3.js';

const RAYDIUM_PROGRAM_ID = new PublicKey('675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8');
const RPC_URL = process.env.RPC_URL;

if (!RPC_URL) {
  console.error('❌ RPC_URL missing. Add it to .env');
  process.exit(1);
}

const connection = new Connection(RPC_URL, 'confirmed');
const seenPools = new Set();

console.log(`🔌 Connected to RPC: ${RPC_URL}`);
console.log(`🎯 Watching Raydium AMM v4 Program: ${RAYDIUM_PROGRAM_ID.toBase58()}\n`);

setInterval(() => console.log('⏳ Heartbeat — still listening…'), 10000);

connection.onProgramAccountChange(
  RAYDIUM_PROGRAM_ID,
  (info) => {
    const poolId = info.accountId.toString();
    if (seenPools.has(poolId)) return;
    seenPools.add(poolId);
    console.log(`🚨 New Raydium pool detected: ${poolId} at ${new Date().toLocaleTimeString()}`);
  },
  'finalized'
);
