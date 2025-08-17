#!/usr/bin/env node
const fs = require('fs'); const path = require('path');
function* walk(d){ for(const f of fs.readdirSync(d)){ const p=path.join(d,f);
 const s=fs.statSync(p); if(s.isDirectory()) yield* walk(p); else yield p; } }
const root = 'agent_memory';
let files=0, bad=0, sample=[];
for(const p of walk(root)){
  if(!p.endsWith('.agent.md')) continue; files++;
  const txt = fs.readFileSync(p,'utf8');
  if(/TBD|TODO|<fill/i.test(txt)){ bad++; if(sample.length<20) sample.push(p); }
}
console.log(JSON.stringify({files, bad, sample}, null, 2)); 