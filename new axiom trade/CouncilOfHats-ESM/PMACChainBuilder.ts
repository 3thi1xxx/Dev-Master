// TODO: Build PMACChainBuilder
// Purpose: Parse `.pmac.log` and extract { taskId, proofPath, timestamp }
// Requirements:
// - Accept `--json` flag to export parsed chain to `proof/PMACChainBuilder-output.json`
// - Default behavior: log each entry to console as human-readable lines
// - Validate file format with regex
// - Use ESM syntax (import/export) and async/await
// Style: TS-first, clean functions, readable output

import fs from 'fs/promises';
import path from 'path';

const PMAC_LOG_PATH = '.chad/pmac.log';

interface PMACEntry {
  taskId: string;
  proofPath: string;
  timestamp: string;
}

async function parsePMACLog(): Promise<PMACEntry[]> {
  const data = await fs.readFile(PMAC_LOG_PATH, 'utf-8');
  const lines = data.split('\n').filter(line => line.trim() !== '');
  return lines.map(line => {
    const match = line.match(/\[PMAC\]\s+(\S+)\s+\|\s+(.+)\s+\|\s+(\S+)/);
    if (!match) throw new Error(`Invalid PMAC log line: ${line}`);
    return {
      taskId: match[1],
      proofPath: match[2],
      timestamp: match[3],
    };
  });
}

async function main() {
  const isJson = process.argv.includes('--json');
  const entries = await parsePMACLog();

  if (isJson) {
    await fs.mkdir('proof', { recursive: true });
    const jsonPath = 'proof/PMACChainBuilder-output.json';
    await fs.writeFile(jsonPath, JSON.stringify(entries, null, 2), 'utf-8');
    console.log(`✅ JSON written to ${jsonPath}`);
  } else {
    console.log('🔗 PMAC Chain:\n');
    entries.forEach(({ taskId, proofPath, timestamp }) => {
      console.log(`- ${taskId} | ${proofPath} | ${timestamp}`);
    });
  }
}

main().catch(err => {
  console.error('❌ PMACChainBuilder error:', err.message);
  process.exit(1);
});
