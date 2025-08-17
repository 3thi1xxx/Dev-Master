import fs from 'fs/promises';
import path from 'path';

const pluginsDir = './cbsh/plugins/';
const taskRegistry = {};

function registerTask(name, fn) {
  taskRegistry[name] = fn;
}

async function loadPlugins() {
  const files = await fs.readdir(pluginsDir);
  for (const file of files) {
    if (file.endsWith('.js')) {
      const plugin = await import(path.resolve(pluginsDir, file));
      if (plugin.registerClaudePlugin) plugin.registerClaudePlugin(registerTask);
      if (plugin.registerClaudeRelay) plugin.registerClaudeRelay(registerTask);
      if (plugin.registerBridgeCleanup) plugin.registerBridgeCleanup(registerTask);
      if (plugin.registerGenerateSummary) plugin.registerGenerateSummary(registerTask);
    }
  }
}

async function run() {
  const [, , taskName, ...args] = process.argv;
  await loadPlugins();
  if (taskRegistry[taskName]) {
    await taskRegistry[taskName](args);
  } else {
    console.log(`❌ Unknown cbsh task: ${taskName}`);
    console.log(`Available: ${Object.keys(taskRegistry).join(', ')}`);
  }
}

run();
