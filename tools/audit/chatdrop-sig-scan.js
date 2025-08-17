#!/usr/bin/env node
const fs = require('fs');
if (!fs.existsSync('.pmac.log')) { console.log(JSON.stringify({ok:false, reason:'no_pmac'})); process.exit(0); }
const lines = fs.readFileSync('.pmac.log','utf8').split('\n').filter(Boolean);
const hits = lines.filter(l => l.includes('"chatdrop_sig_verify"')).slice(0, 200);
console.log(JSON.stringify({ok: hits.length>0, count: hits.length}, null, 2)); 