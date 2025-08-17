#!/bin/bash

# Whale Monitoring Launch Script
source .env.dev

echo "🐋 DEPLOYING CONSERVATIVE WHALE MONITORING"
echo "═══════════════════════════════════════════"

node -e "
import('./services/IntelligentWhaleDiscovery.js').then(async (m) => {
  console.log('⚡ Initializing with Auckland speed advantage...');
  console.log('🎯 Monitoring 15 pre-configured whale addresses');
  console.log('📊 Real-time intelligence aggregation starting...');
  await m.whaleDiscovery.init();
  console.log('\n🚀 WHALE MONITORING ACTIVE - PRESS CTRL+C TO STOP');
  console.log('👀 Watching for profitable whale signals...');
  console.log('⏱️  Time advantage: 254ms head start on competitors');
  
  // Monitor for continuous operation, showing periodic updates
  setInterval(() => {
    const report = m.whaleDiscovery.getWhaleIntelligenceReport();
    const timestamp = new Date().toISOString();
    console.log(\`\n[\${timestamp}] 📊 DISCOVERY STATUS:\`);
    console.log(\`   🐋 Total Discovered: \${report.summary.totalDiscovered}\`);
    console.log(\`   ⭐ High Scoring: \${report.summary.highScoring}\`);
    console.log(\`   🎯 Auto-Added: \${report.summary.autoAdded}\`);
    if (report.topWhales.length > 0) {
      console.log('\n🎯 TOP DISCOVERIES:');
      report.topWhales.slice(0, 3).forEach((whale, i) => {
        console.log(\`   \${i+1}. \${whale.address.substring(0,8)}... (Score: \${whale.score}%)\`);
      });
    }
  }, 60000); // Update every minute
  
  // Save whale database periodically
  setInterval(() => {
    m.whaleDiscovery.saveWhaleDatabase();
  }, 300000); // Save every 5 minutes
});" 