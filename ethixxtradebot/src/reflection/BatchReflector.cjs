#!/usr/bin/env node
// BatchReflection v0 — deterministic scoring of agent specs (no LLM).
const fs = require('fs'); const path = require('path');

function* walk(dir){ for (const n of fs.readdirSync(dir)) {
  const p = path.join(dir, n); const s=fs.statSync(p);
  if (s.isDirectory()) yield* walk(p); else yield p;
}}

function scoreAgent(txt) {
  const checks = [
    {k:'purpose', re:/^#{1,3}\s*purpose\b/im},
    {k:'io', re:/^#{1,3}\s*(io|inputs|outputs)\b/im},
    {k:'invariants', re:/^#{1,3}\s*invariants?\b/im},
    {k:'failure_modes', re:/^#{1,3}\s*failure\s*modes?\b/im},
    {k:'examples', re:/^#{1,3}\s*examples?\b/im},
  ];
  const present = checks.reduce((a,c)=>a + (c.re.test(txt) ? 1 : 0), 0);
  const tbd = /TBD|TODO|<fill/i.test(txt);
  // 70% structure, 30% cleanliness (no TBD)
  const structure = present / checks.length;
  const cleanliness = tbd ? 0 : 1;
  const score = +(0.7*structure + 0.3*cleanliness).toFixed(3);
  return {score, present, required:checks.length, tbd};
}

function main() {
  const root = 'agent_memory';
  if (!fs.existsSync(root)) { console.error('agent_memory missing'); process.exit(2); }
  fs.mkdirSync('memory/scores', {recursive:true});
  let results = [];
  for (const f of walk(root)) {
    if (!f.endsWith('.agent.md')) continue;
    const name = path.basename(f).replace(/\.agent\.md$/,'');
    const txt = fs.readFileSync(f,'utf8');
    const r = scoreAgent(txt);
    const out = { agent:name, file:f, score:r.score, present:r.present, required:r.required, has_tbd:r.tbd, ts:new Date().toISOString() };
    fs.writeFileSync(`memory/scores/${name}.json`, JSON.stringify(out,null,2));
    try { fs.appendFileSync('.pmac.log', JSON.stringify({type:'score_write', agent:name, score:r.score, ts:new Date().toISOString()})+'\n'); } catch {}
    results.push(out);
  }
  results.sort((a,b)=>a.score-b.score);
  const avg = results.length ? +(results.reduce((a,b)=>a+b.score,0)/results.length).toFixed(3) : 0;
  const summary = { total: results.length, avg, weakest: results.slice(0,5), ts:new Date().toISOString() };
  fs.writeFileSync('memory/scores/summary.json', JSON.stringify(summary,null,2));
  try { fs.appendFileSync('.pmac.log', JSON.stringify({type:'reflection_summary', total:summary.total, avg:summary.avg, ts:new Date().toISOString()})+'\n'); } catch {}
  console.log(JSON.stringify({ok:true, ...summary}, null, 2));
}
if (require.main === module) main(); 