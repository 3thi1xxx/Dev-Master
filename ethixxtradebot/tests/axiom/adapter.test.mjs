import assert from 'node:assert';
import { signalsToActions, actionToEffect, normalizeConfig } from '../../agents/trading/AxiomAdapter.js';

const cfg = normalizeConfig({});
const actions = signalsToActions([{ symbol:"SOL", score:0.8, sizeUSD:12 }], cfg);
assert.equal(actions[0].symbol, "SOL");
const eff = actionToEffect(actions[0]);
assert.ok(eff.intent_id && eff.intent_id.length === 64); 