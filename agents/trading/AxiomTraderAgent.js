import fs from 'fs/promises';
import path from 'path';
import { normalizeConfig, signalsToActions, actionToEffect } from './AxiomAdapter.js';
import { safeLog } from '../../src/lib/safelog.js'; // existing SafeLogger
import { relayDispatch } from '../../src/lib/relay-dispatch.js'; // tiny helper below

// 1) Load legacy signal producers (pure-ish)
const legacy = {
  fetchPulse: () => import('../../legacy/axiom/sniper/fetchPulse.js'),
  fetchTrending: () => import('../../legacy/axiom/sniper/fetchTrending.js'),
  thinker: () => import('../../legacy/axiom/sniper/thinker.js'),
};

export async function runAxiom({ configPath = 'config/axiom.config.json' } = {}) {
  const rawCfg = JSON.parse(await fs.readFile(configPath, 'utf8'));
  const cfg = normalizeConfig(rawCfg);

  // 2) Collect signals from legacy modules (side effects must be RPC-free here)
  const { default: fetchPulse } = await legacy.fetchPulse();
  const baseSignals = await fetchPulse(cfg);       // expects pure fetch/parse
  const signals = (await (await legacy.thinker()).default)(baseSignals, cfg);

  // 3) Plan → Effects
  const actions = signalsToActions(signals, cfg);
  const effects = actions.map(actionToEffect);

  // 4) Emit effects to the relay for dry-run execution
  const drop = {
    drop_id: `axiom-sim-${Date.now()}`,
    provider: "AxiomTraderAgent",
    dry_run: cfg.dryRun !== false,        // default true
    intents: effects,
    policy: { require_council: true, max_risk_usd: cfg.maxPositionUSD },
    metadata: { source: "legacy/axiom", strategy: cfg.strategy },
  };

  const res = await relayDispatch('/dispatch', drop);
  await safeLog({ type: "axiom_trader_dispatch", ok: res.ok, drop_id: drop.drop_id, count: effects.length });
  return { ok: res.ok, effects };
} 