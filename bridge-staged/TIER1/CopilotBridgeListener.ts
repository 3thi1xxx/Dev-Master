import chokidar from 'chokidar';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import * as unzipper from 'unzipper';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const BRIDGE_PATH = path.join(__dirname, '../bridge-staged/');
const EXTRACT_PATH = path.join(__dirname, '../dropped/');
const PID = `[PID:${process.pid}]`;

function cleanFolder(dir, label) {
  if (!process.argv.includes('--clean')) return;
  try {
    fs.rmSync(dir, { recursive: true, force: true });
    fs.mkdirSync(dir, { recursive: true });
    console.log(`${PID} ✅ Cleaned ${label}`);
  } catch (e) {
    console.error(`${PID} ❌ Clean failed for ${label}:`, e.message);
  }
}

cleanFolder(BRIDGE_PATH, 'bridge-staged');
cleanFolder(EXTRACT_PATH, 'dropped');

const watcher = chokidar.watch(BRIDGE_PATH, {
  persistent: true,
  ignoreInitial: false,
  depth: 5,
  awaitWriteFinish: {
    stabilityThreshold: 1000,
    pollInterval: 100
  }
});

watcher.on('ready', () => {
  console.log(`${PID} 👁️ Watching: ${BRIDGE_PATH}`);
  console.log(`${PID} 🎯 Ready for zip drops!`);
});

watcher.on('add', async (filePath) => {
  if (!filePath.endsWith('.zip')) return;
  const fileName = path.basename(filePath);
  const extractTarget = path.join(EXTRACT_PATH, fileName.replace('.zip', ''));
  const tier = filePath.includes('TIER1') ? 'TIER1' : filePath.includes('TIER2') ? 'TIER2' : 'unknown';

  fs.writeFileSync(path.join(__dirname, '../.watch-bridge.locked'), `Locked by: CopilotBridgeListener @ PID ${process.pid}\nTimestamp: ${new Date().toISOString()}\nFile: ${fileName}\n`);
  console.log(`${PID} 📦 Drop detected: ${fileName} (Tier: ${tier})`);

  try {
    await fs.createReadStream(filePath).pipe(unzipper.Extract({ path: extractTarget })).promise();
    const files = fs.existsSync(extractTarget) ? fs.readdirSync(extractTarget) : [];
    const js = files.find(f => f.endsWith('.js'));
    const ts = files.find(f => f.endsWith('.ts'));
    if (js) runJS(js, extractTarget, tier);
    else if (ts) compileAndRunTS(ts, extractTarget, tier);
    else console.error(`${PID} ❌ No .js or .ts file in drop`);
  } catch (e) {
    console.error(`${PID} ❌ Extraction error:`, e.message);
  }
});

function runJS(jsFile, dir, tier) {
  const full = path.join(dir, jsFile);
  const proc = spawn('node', [full], { cwd: process.cwd() });
  let out = '';
  proc.stdout.on('data', d => { const line = d.toString(); out += line; console.log(`${PID} 📋 ${line.trim()}`); });
  proc.stderr.on('data', d => console.error(`${PID} ❌ ${d.toString().trim()}`));
  proc.on('close', code => {
    const ts = new Date().toISOString();
    const status = code === 0 ? 'PASS' : 'FAIL';
    const log = `[${ts}] PMAC: ${jsFile} | Tier: ${tier} | Status: ${status} | PID: ${proc.pid} | Log: ${out.trim() || '(no output)'}\n`;
    fs.appendFileSync(path.join(__dirname, '../.pmac.log'), log);
    fs.appendFileSync(path.join(__dirname, '../.pickup.md'), `[PICKUP] ${ts} :: ${jsFile}\n`);
    updateTabMesh(jsFile, proc.pid, tier);
    console.log(`${PID} ✅ ${jsFile} executed [${status}]`);
  });
}

function compileAndRunTS(tsFile, dir, tier) {
  const full = path.join(dir, tsFile);
  const jsOut = full.replace('.ts', '.js');
  const tsc = spawn('npx', ['tsc', tsFile, '--outFile', jsOut], { cwd: dir });
  tsc.on('close', code => {
    if (code !== 0) return console.error(`${PID} ❌ TSC failed`);
    runJS(path.basename(jsOut), dir, tier);
  });
}

function updateTabMesh(jsFile, pid, tier) {
  const meshPath = path.join(__dirname, '../mesh/TabMesh.json');
  const date = new Date().toISOString().split('T')[0];
  const hour = new Date().getHours().toString().padStart(2, '0');
  const sourceThread = date.replace(/-/g, '') + 'T' + hour;

  let mesh = {};
  try {
    if (fs.existsSync(meshPath)) mesh = JSON.parse(fs.readFileSync(meshPath));
  } catch (e) {
    console.error(`${PID} ⚠️ TabMesh read error:`, e.message);
  }

  mesh[jsFile.replace('.js', '')] = {
    sourceThread,
    dropDate: date,
    tier,
    notes: `Bridge PID ${pid}`
  };

  try {
    fs.writeFileSync(meshPath, JSON.stringify(mesh, null, 2));
    console.log(`${PID} 🧠 TabMesh updated: ${jsFile}`);
  } catch (e) {
    console.error(`${PID} ❌ TabMesh write failed:`, e.message);
  }
}
