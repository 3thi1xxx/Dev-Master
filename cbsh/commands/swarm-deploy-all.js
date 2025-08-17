// cbsh/commands/swarm-deploy-all.js
import fs from 'fs/promises';
import fetch from 'node-fetch';

const SWARM_PATH = './swarm_tasks.json';
const PMAC_LOG = './.pmac.log';
const CLAUDE_RELAY_URL = 'http://localhost:3055/dispatch';

async function deploySwarmBatch() {
    const swarm = JSON.parse(await fs.readFile(SWARM_PATH, 'utf-8'));
    const timestamp = new Date().toISOString();
    let deployed = 0;

    for (const task of swarm) {
        if (task.status !== 'queued') continue;
        
        try {
            const res = await fetch(CLAUDE_RELAY_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(task)
            });
            
            const result = await res.json();
            
            if (result.status === 'success') {
                task.status = 'dispatched';
                task.dispatched = timestamp;
                await fs.appendFile(PMAC_LOG, `${task.linkedFile}, dispatched via swarm, ${timestamp}\n`);
                console.log(`🚀 Deployed: ${task.linkedFile}`);
                deployed++;
            } else {
                console.warn(`⚠️ Failed to dispatch: ${task.linkedFile}`);
            }
        } catch (err) {
            console.error(`❌ Error dispatching ${task.linkedFile}:`, err.message);
        }
    }

    await fs.writeFile(SWARM_PATH, JSON.stringify(swarm, null, 2));
    console.log(`\n✅ ${deployed} tasks dispatched.`);
}

export { deploySwarmBatch };
