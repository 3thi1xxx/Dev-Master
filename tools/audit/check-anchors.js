#!/usr/bin/env node
/**
 * Minimal anchor continuity checker (read-only).
 * Usage: node tools/audit/check-anchors.js > out/audit/<TS>/anchors.json
 */
const fs = require('fs');
const path = 'vault-log.ndjson';
if (!fs.existsSync(path)) { console.error('vault-log.ndjson missing'); process.exit(2); }

const lines = fs.readFileSync(path, 'utf8').trim().split('\n').map(l => {
  try { return JSON.parse(l); } catch { return null; }
}).filter(Boolean);

let breaks = [];
let prev = null;
for (let i = 0; i < lines.length; i++) {
  const e = lines[i];
  const a = e.anchor || {};
  if (!a.anchor_hash || !a.payload_hash) {
    breaks.push({ index: i, reason: 'missing_anchor_fields' });
  }
  if (prev && prev.anchor && prev.anchor.anchor_hash && e.parents) {
    const parent = Array.isArray(e.parents) ? e.parents[0] : e.parents;
    if (parent && parent !== prev.anchor.anchor_hash) {
      breaks.push({ index: i, reason: 'parent_mismatch', expected: prev.anchor.anchor_hash, got: parent });
    }
  }
  prev = e;
}

const out = {
  total: lines.length,
  breaks_count: breaks.length,
  breaks: breaks.slice(0, 50)
};
console.log(JSON.stringify(out, null, 2)); 