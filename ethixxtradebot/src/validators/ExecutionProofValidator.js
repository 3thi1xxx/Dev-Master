#!/usr/bin/env node
/* v0 — minimal, safe validator
   Checks:
   1) vault-log.ndjson anchor continuity + required fields
   2) .pmac.log has recent chatdrop_sig_verify ok:true
   3) (optional) replay enforcement: if --enforce-replay, require CWD contains /sandbox/replay/
*/
const fs = require('fs');
const path = require('path');

function readNdjson(p) {
  if (!fs.existsSync(p)) return [];
  return fs.readFileSync(p, 'utf8').split('\n').filter(Boolean).map(l => {
    try { return JSON.parse(l); } catch { return null; }
  }).filter(Boolean);
}

function validateAnchors(vaultPath, maxBreaks=0) {
  const lines = readNdjson(vaultPath);
  let breaks = [], prevHash = null;
  for (let i=0;i<lines.length;i++){
    const e = lines[i], a = e.anchor||{};
    if (!a.anchor_hash || !a.payload_hash) breaks.push({i,reason:'missing_anchor_fields'});
    const parent = Array.isArray(e.parents)? e.parents[0] : e.parents;
    if (prevHash && parent && parent !== prevHash) breaks.push({i,reason:'parent_mismatch', expected:prevHash, got:parent});
    prevHash = a.anchor_hash || prevHash;
    if (breaks.length > maxBreaks) break;
  }
  return { total: lines.length, breaks, ok: breaks.length<=maxBreaks };
}

function validateChatdrop(pmacPath, minHits=1) {
  const tail = fs.existsSync(pmacPath) ? fs.readFileSync(pmacPath,'utf8').split('\n').filter(Boolean).slice(-1000) : [];
  const ok = tail.filter(l => l.includes('"chatdrop_sig_verify"') && l.includes('"ok":true')).length;
  return { hits: ok, ok: ok >= minHits };
}

function validateReplayIsolation(enforce) {
  if (!enforce) return {ok:true};
  const cwd = process.cwd().replace(/\\/g,'/');
  const ok = cwd.includes('/sandbox/replay/');
  return { ok, cwd, reason: ok ? undefined : 'cwd_must_be_sandbox_replay' };
}

// ---- CLI ----
const args = process.argv.slice(2);
const get = (k, d) => {
  const i = args.findIndex(a => a===k || a.startsWith(k+'='));
  if (i<0) return d;
  const v = args[i].includes('=') ? args[i].split('=').slice(1).join('=') : args[i+1];
  return v ?? d;
};
const vault = get('--vault','vault-log.ndjson');
const pmac  = get('--pmac','.pmac.log');
const maxBreaks = parseInt(get('--max-breaks','0'),10);
const minSigs   = parseInt(get('--min-sigs','1'),10);
const enforceReplay = args.includes('--enforce-replay');

const anchors = validateAnchors(vault, maxBreaks);
const sigs = validateChatdrop(pmac, minSigs);
const replay = validateReplayIsolation(enforceReplay);

const summary = { anchors, sigs, replay, ok: anchors.ok && sigs.ok && replay.ok };
console.log(JSON.stringify(summary, null, 2));
process.exit(summary.ok ? 0 : 1); 