import { PMHat } from '../hats/PMHat.ts';
import { CopilotHat } from '../hats/CopilotHat.ts';
import { AuditorHat } from '../hats/AuditorHat.ts';
import { RetroHat } from '../hats/RetroHat.ts';
import { ChaosHat } from '../hats/ChaosHat.ts';
import { EthicsHat } from '../hats/EthicsHat.ts';
import { Hat999x as NineNineNineXHat } from '../hats/999xHat.ts';

const councilHats = [
  new PMHat(),
  new CopilotHat(),
  new AuditorHat(),
  new RetroHat(),
  new ChaosHat(),
  new EthicsHat(),
  new NineNineNineXHat()
];

export async function conveneCouncil(topic, input) {
  const results = await Promise.all(
    councilHats.map(hat => hat.deliberate(topic, input))
  );

  const summary = results.join('\n');
  logDecision(topic, results, summary);
  return summary;
}

function logDecision(topic, votes, summary) {
  const fs = require('fs');
  const path = './.chad/council.log';
  fs.mkdirSync('./.chad', { recursive: true });
  const entry = {
    timestamp: new Date().toISOString(),
    topic,
    votes,
    summary
  };
  fs.appendFileSync(path, JSON.stringify(entry, null, 2) + '\n');
}