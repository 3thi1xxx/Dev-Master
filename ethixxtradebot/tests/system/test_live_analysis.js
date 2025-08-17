#!/usr/bin/env node
/**
 * Test Live Analysis
 * Manually trigger AI analysis to see what's happening
 */

import { enhancedAnalysis } from './services/EnhancedExternalAnalysis.js';

console.log('🧠 TESTING LIVE AI ANALYSIS');
console.log('=' .repeat(40));

async function testAnalysis() {
  try {
    console.log('🔬 Testing AI analysis with a sample token...');
    
    // Test with a known Solana token address
    const testToken = 'So11111111111111111111111111111111111111112'; // Wrapped SOL
    const testSymbol = 'WSOL';
    
    console.log(`📊 Analyzing: ${testSymbol} (${testToken})`);
    
    const startTime = Date.now();
    const analysis = await enhancedAnalysis.analyzeToken(testToken, testSymbol);
    const analysisTime = Date.now() - startTime;
    
    console.log(`⏱️ Analysis completed in ${analysisTime}ms`);
    
    if (analysis.error) {
      console.log(`❌ Analysis failed: ${analysis.error}`);
      return;
    }
    
    console.log('✅ Analysis successful!');
    console.log(`📊 Overall Score: ${analysis.scores?.overall}/100`);
    console.log(`🎯 Recommendation: ${analysis.recommendation?.action}`);
    console.log(`💪 Confidence: ${Math.round((analysis.confidence || 0) * 100)}%`);
    
    if (analysis.neural) {
      console.log(`🧠 Neural Prediction: ${analysis.neural.prediction} (${Math.round(analysis.neural.confidence * 100)}%)`);
    }
    
    if (analysis.scores) {
      console.log('📈 Component Scores:');
      console.log(`   Technical: ${analysis.scores.technical}/100`);
      console.log(`   Security: ${analysis.scores.security}/100`);
      console.log(`   Market: ${analysis.scores.market}/100`);
      console.log(`   Neural: ${analysis.scores.neural}/100`);
      console.log(`   Cluster7: ${analysis.scores.cluster7 || 'N/A'}/100`);
    }
    
  } catch (error) {
    console.log(`❌ Test failed: ${error.message}`);
    console.log('Stack trace:', error.stack);
  }
}

testAnalysis(); 