#!/usr/bin/env node
/**
 * Migration Script - Old Architecture → Consolidated Core
 * Safely transitions from 200+ files to 7 core modules
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '../..');

console.log('\n🔄 ETHIXXTRADEBOT MIGRATION TOOL');
console.log('━'.repeat(50));

// Migration mapping
const migrationMap = {
  intelligence: {
    target: 'src/core/IntelligenceEngine.js',
    sources: [
      'src/services/IntelligentWhaleDiscovery.js',
      'src/services/LiveTokenAnalyzer.js',
      'src/services/FastMemeAnalyzer.js',
      'src/services/EnhancedExternalAnalysis.js'
    ]
  },
  
  strategy: {
    target: 'src/core/StrategyEngine.js',
    sources: [
      'src/trading/TradingStrategies.js',
      'src/execution/StrategyOrchestrator.js'
    ]
  },
  
  risk: {
    target: 'src/core/RiskManager.js',
    sources: [
      'src/risk/RiskAssessment.js',
      'src/risk/PositionManager.js',
      'src/validation/TradeValidator.js'
    ]
  },
  
  execution: {
    target: 'src/core/ExecutionManager.js',
    sources: [
      'src/execution/TradeExecutor.js',
      'src/clients/JupiterClient.js',
      'src/clients/RaydiumClient.js'
    ]
  },
  
  data: {
    target: 'src/core/DataManager.js',
    sources: [
      'src/services/SharedWebSocketManager.js',
      'src/data/BirdeyeClient.js',
      'src/data/CacheManager.js'
    ]
  },
  
  monitoring: {
    target: 'src/core/SystemMonitor.js',
    sources: [
      'src/monitoring/PerformanceTracker.js',
      'src/monitoring/AlertSystem.js',
      'src/reporting/ReportGenerator.js'
    ]
  }
};

// Check migration status
function checkMigrationStatus() {
  console.log('\n📋 CHECKING MIGRATION STATUS:');
  
  let readyCount = 0;
  let pendingCount = 0;
  
  Object.entries(migrationMap).forEach(([module, config]) => {
    const targetPath = path.join(rootDir, config.target);
    const exists = fs.existsSync(targetPath);
    
    if (exists) {
      console.log(`✅ ${module.toUpperCase()}: Core module ready`);
      readyCount++;
    } else {
      console.log(`❌ ${module.toUpperCase()}: Core module missing`);
      pendingCount++;
    }
    
    // Check source files
    config.sources.forEach(source => {
      const sourcePath = path.join(rootDir, source);
      if (fs.existsSync(sourcePath)) {
        console.log(`   📄 ${source} - Ready for migration`);
      }
    });
  });
  
  console.log('\n📊 MIGRATION SUMMARY:');
  console.log(`   ✅ Ready: ${readyCount} modules`);
  console.log(`   ⏳ Pending: ${pendingCount} modules`);
  
  return readyCount === Object.keys(migrationMap).length;
}

// Generate import mapping file
function generateImportMapping() {
  console.log('\n📝 GENERATING IMPORT MAPPING:');
  
  const importMap = {
    // Old imports → New imports
    '../services/IntelligentWhaleDiscovery': '../core/IntelligenceEngine',
    '../services/LiveTokenAnalyzer': '../core/IntelligenceEngine',
    '../services/SharedWebSocketManager': '../core/DataManager',
    '../trading/TradingStrategies': '../core/StrategyEngine',
    '../risk/RiskAssessment': '../core/RiskManager',
    '../execution/TradeExecutor': '../core/ExecutionManager',
    '../monitoring/PerformanceTracker': '../core/SystemMonitor'
  };
  
  const mapPath = path.join(rootDir, 'scripts/migration/import-mapping.json');
  fs.writeFileSync(mapPath, JSON.stringify(importMap, null, 2));
  
  console.log(`✅ Import mapping saved to: ${mapPath}`);
  return importMap;
}

// Validate core modules
async function validateCoreModules() {
  console.log('\n🔍 VALIDATING CORE MODULES:');
  
  const coreModules = [
    'DataManager.js',
    'IntelligenceEngine.js',
    'StrategyEngine.js',
    'RiskManager.js',
    'ExecutionManager.js',
    'SystemMonitor.js',
    'ApiServer.js'
  ];
  
  let valid = true;
  
  for (const module of coreModules) {
    const modulePath = path.join(rootDir, 'src/core', module);
    
    try {
      // Check if file exists
      if (!fs.existsSync(modulePath)) {
        console.log(`❌ ${module}: Missing`);
        valid = false;
        continue;
      }
      
      // Try to import it
      const mod = await import(modulePath);
      
      // Check for required exports
      const className = module.replace('.js', '');
      const instanceName = className.charAt(0).toLowerCase() + className.slice(1);
      
      if (mod[className] && mod[instanceName]) {
        console.log(`✅ ${module}: Valid exports`);
      } else {
        console.log(`⚠️ ${module}: Missing exports`);
        valid = false;
      }
      
    } catch (error) {
      console.log(`❌ ${module}: Import error - ${error.message}`);
      valid = false;
    }
  }
  
  return valid;
}

// Test new architecture
async function testNewArchitecture() {
  console.log('\n🧪 TESTING NEW ARCHITECTURE:');
  
  try {
    // Try to import the main entry point
    const mainModule = path.join(rootDir, 'src/core/index.js');
    
    if (!fs.existsSync(mainModule)) {
      console.log('❌ Main entry point missing');
      return false;
    }
    
    console.log('✅ Main entry point exists');
    
    // Check if we can import it
    await import(mainModule);
    console.log('✅ Main module imports successfully');
    
    return true;
    
  } catch (error) {
    console.log(`❌ Architecture test failed: ${error.message}`);
    return false;
  }
}

// Main migration process
async function runMigration() {
  console.log('\n🚀 STARTING MIGRATION PROCESS...\n');
  
  // Step 1: Check status
  const isReady = checkMigrationStatus();
  
  if (!isReady) {
    console.log('\n⚠️ Not all core modules are ready.');
    console.log('Please ensure all core modules are created first.');
    return;
  }
  
  // Step 2: Generate import mapping
  generateImportMapping();
  
  // Step 3: Validate modules
  const isValid = await validateCoreModules();
  
  if (!isValid) {
    console.log('\n⚠️ Core module validation failed.');
    console.log('Please fix the issues before proceeding.');
    return;
  }
  
  // Step 4: Test new architecture
  const testPassed = await testNewArchitecture();
  
  if (!testPassed) {
    console.log('\n⚠️ Architecture test failed.');
    console.log('Please check the main entry point.');
    return;
  }
  
  console.log('\n━'.repeat(50));
  console.log('🎉 MIGRATION READY!');
  console.log('━'.repeat(50));
  console.log('\n📋 NEXT STEPS:');
  console.log('1. Run: npm run start');
  console.log('2. Monitor logs for any issues');
  console.log('3. Test all trading functionality');
  console.log('4. Once confirmed, remove old files');
  console.log('\n💡 TIP: Keep old files until fully validated');
}

// Run the migration
runMigration().catch(console.error); 