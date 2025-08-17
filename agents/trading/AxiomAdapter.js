// MEATBRAIN v3 boundary adapter – no direct IO here.
import crypto from 'crypto';

export function normalizeConfig(raw) {
  const {
    rpcUrl, rpcUrls = [], maxSlippage = 0.01, dryRun = true,
    maxPositionUSD = 50, pollMs = 5000, strategy = "sniper"
  } = raw || {};
  return { rpcUrl, rpcUrls, maxSlippage, dryRun, maxPositionUSD, pollMs, strategy };
}

// Pure transform: legacy signal → Chad action intents (no network calls)
export function signalsToActions(signals, cfg) {
  return (signals || []).map(s => ({
    type: "OPEN_POSITION",
    symbol: s.symbol || s.mint || s.token,
    side: "BUY",
    reason: s.reason || "trend",
    confidence: s.score ?? 0.5,
    maxSlippage: cfg.maxSlippage,
    notionalUSD: Math.min(s.sizeUSD ?? 10, cfg.maxPositionUSD),
  }));
}

// Hashable effect message for audit (consumed by relay executor)
export function actionToEffect(action) {
  const payload = {
    kind: "trade_intent",
    action,
    ts: new Date().toISOString(),
  };
  payload.intent_id = crypto.createHash('sha256')
    .update(JSON.stringify(payload))
    .digest('hex');
  return payload;
} 