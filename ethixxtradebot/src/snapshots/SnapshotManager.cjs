#!/usr/bin/env node
const fs=require('fs'), cp=require('child_process'), path=require('path'), crypto=require('crypto');

function readJson(p,d=null){ try{ return JSON.parse(fs.readFileSync(p,'utf8')); }catch{ return d; } }
function log(evt){ try{ fs.appendFileSync('.pmac.log', JSON.stringify(evt)+'\n'); }catch{} }

function compositeHash(file) {
  const b = fs.readFileSync(file);
  return crypto.createHash('sha256').update(b).digest('hex');
}

function tarCreate(out, root='.') {
  const r = cp.spawnSync('tar', ['-czf', out, '--exclude-from=tools/manifest/.tarignore', root], {stdio:'inherit'});
  if (r.status!==0) process.exit(r.status);
}

function tarExtract(archive, root='.') {
  const r = cp.spawnSync('tar', ['-xzf', archive, '-C', root], {stdio:'inherit'});
  if (r.status!==0) process.exit(r.status);
}

function main(){
  const mode = process.argv[2];
  if (!mode || !['create','restore'].includes(mode)) {
    console.error('Usage: SnapshotManager.cjs create|restore <archive.tgz> [--yes]');
    process.exit(2);
  }
  if (mode==='create') {
    const ts = new Date().toISOString().replace(/[:.]/g,'-');
    fs.mkdirSync('snapshots', {recursive:true});
    const out = `snapshots/${ts}.tgz`;
    tarCreate(out, '.');
    const sha = compositeHash(out);
    const report = { type:'snapshot_create', ts:new Date().toISOString(), archive:out, sha256:sha };
    log(report);
    console.log(JSON.stringify({ok:true, ...report}, null, 2));
    return;
  }
  if (mode==='restore') {
    const archive = process.argv[3];
    const yes = process.argv.includes('--yes');
    if (!archive || !fs.existsSync(archive)) { console.error('archive missing'); process.exit(2); }
    if (!yes) { console.error('Refusing to restore without --yes'); process.exit(3); }
    tarExtract(archive, '.');
    log({ type:'snapshot_restore', ts:new Date().toISOString(), archive });
    console.log(JSON.stringify({ok:true, archive}, null, 2));
  }
}
main(); 