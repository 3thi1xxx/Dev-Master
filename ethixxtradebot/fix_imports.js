#!/usr/bin/env node
/**
 * Import Path Fixer
 * Systematically updates all import paths after file migration
 */

import { readFileSync, writeFileSync } from 'fs';
import { glob } from 'glob';

const fixes = [
  // Fix DegenIntelligence imports
  {
    pattern: "import { degenIntelligence } from './DegenIntelligence.js';",
    replacement: "import { degenIntelligence } from '../../intelligence/DegenIntelligence.js';",
    files: ['src/core/trading/*.js']
  },
  
  // Fix BirdeyeAnalytics imports in non-data directories
  {
    pattern: "import { birdeyeAnalytics } from './BirdeyeAnalytics.js';",
    replacement: "import { birdeyeAnalytics } from '../data/BirdeyeAnalytics.js';",
    files: ['src/core/ai/*.js', 'src/core/trading/*.js', 'src/intelligence/*.js']
  },
  
  // Fix AxiomAPIService imports
  {
    pattern: "import { axiomApiService } from './AxiomAPIService.js';",
    replacement: "import { axiomApiService } from '../data/AxiomAPIService.js';",
    files: ['src/core/ai/*.js', 'src/core/trading/*.js', 'src/intelligence/*.js']
  },
  
  // Fix SharedWebSocketManager imports
  {
    pattern: "import { sharedWebSocketManager } from './SharedWebSocketManager.js';",
    replacement: "import { sharedWebSocketManager } from '../data/SharedWebSocketManager.js';",
    files: ['src/core/ai/*.js', 'src/core/trading/*.js', 'src/intelligence/*.js']
  }
];

console.log('🔧 Fixing import paths...');

for (const fix of fixes) {
  for (const pattern of fix.files) {
    const files = glob.sync(pattern);
    
    for (const file of files) {
      try {
        let content = readFileSync(file, 'utf8');
        if (content.includes(fix.pattern)) {
          content = content.replace(new RegExp(fix.pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), fix.replacement);
          writeFileSync(file, content);
          console.log(`✅ Fixed: ${file}`);
        }
      } catch (error) {
        console.log(`⚠️ Error fixing ${file}:`, error.message);
      }
    }
  }
}

console.log('🎉 Import path fixes completed!'); 