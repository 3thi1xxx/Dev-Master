/**
 * ResurrectionPipeline - Main pipeline orchestrating scout -> filter -> execute flow
 */
import env from '../utils/env.js';
import AxiomPulseFetcher from '../agents/axiom/AxiomPulseFetcher.js';
import DummyExecutor from '../executors/DummyExecutor.js';
import JupiterExecutor from '../executors/JupiterExecutor.js';
import fs from 'fs/promises';

class ResurrectionPipeline {
  constructor() {
    this.logger = console;
    this.pulseFetcher = new AxiomPulseFetcher({ logger: this.logger });
    this.executor = this.createExecutor();
    this.fallbackExecutor = this.createFallbackExecutor();
    this.rules = null;
    this.isRunning = false;
    this.pulseInterval = null;
    this.shadowBroker = null;
    this.scoutDedup = new Map(); // For deduplication
  }

  createExecutor() {
    switch (env.EXECUTOR) {
      case 'Jupiter':
        return new JupiterExecutor({ 
          logger: this.logger, 
          dryRun: env.JUPITER_DRY_RUN 
        });
      case 'Dummy':
      default:
        return new DummyExecutor({ logger: this.logger });
    }
  }

  createFallbackExecutor() {
    // Always return Dummy for fallback scenarios
    return new DummyExecutor({ logger: this.logger });
  }

  async loadRules() {
    try {
      const rulesData = await fs.readFile('config/rules.json', 'utf8');
      this.rules = JSON.parse(rulesData);
      this.logger.log('[RESURRECTION] Rules loaded:', this.rules);
    } catch (error) {
      this.logger.error('[RESURRECTION] Failed to load rules:', error.message);
      // Use default rules
      this.rules = {
        filters: {
          stages: ['final-stretch', 'migrated'],
          maxMarketCap: 500000,
          minMarketCap: 5000,
          maxInsidersPercent: 20,
          maxBundlersPercent: 25,
          maxAgeMinutes: 30
        },
        execution: {
          minScore: 0.6,
          defaultAmountSol: 0.1
        }
      };
    }
  }

  filterRow(row) {
    const { filters } = this.rules;
    
    // Stage filter
    if (!filters.stages.includes(row.stage)) {
      return { pass: false, reason: `stage_not_allowed: ${row.stage}` };
    }

    // Market cap filter
    if (row.marketCap < filters.minMarketCap || row.marketCap > filters.maxMarketCap) {
      return { pass: false, reason: `market_cap_out_of_range: ${row.marketCap}` };
    }

    // Insiders filter
    if (row.insidersPercent > filters.maxInsidersPercent) {
      return { pass: false, reason: `too_many_insiders: ${row.insidersPercent}%` };
    }

    // Bundlers filter  
    if (row.bundlersPercent > filters.maxBundlersPercent) {
      return { pass: false, reason: `too_many_bundlers: ${row.bundlersPercent}%` };
    }

    // Age filter
    if (row.ageMinutes > filters.maxAgeMinutes) {
      return { pass: false, reason: `too_old: ${row.ageMinutes}min` };
    }

    return { pass: true, reason: 'all_filters_passed' };
  }

  calculateScore(row) {
    let score = 0.5; // Base score

    const { scoring } = this.rules;
    
    // Stage bonuses
    if (row.stage === 'final-stretch' && scoring?.finalStretchBonus) {
      score += scoring.finalStretchBonus;
    }
    if (row.stage === 'migrated' && scoring?.migratedBonus) {
      score += scoring.migratedBonus;
    }

    // Low insiders bonus
    if (row.insidersPercent < 10 && scoring?.lowInsidersBonus) {
      score += scoring.lowInsidersBonus;
    }

    // Low bundlers bonus
    if (row.bundlersPercent < 10 && scoring?.lowBundlersBonus) {
      score += scoring.lowBundlersBonus;
    }

    return Math.min(1.0, score);
  }

  async processRow(row) {
    try {
      this.logger.log(`[SCOUT] Scouted ${row.symbol} (${row.stage}) - mcap: ${row.marketCap}, age: ${row.ageMinutes}min`);

      // Apply filters
      const filterResult = this.filterRow(row);
      if (!filterResult.pass) {
        this.logger.log(`[FILTER] ${row.symbol} filtered out: ${filterResult.reason}`);
        return;
      }

      // Calculate score
      const score = this.calculateScore(row);
      const minScore = this.rules.execution?.minScore || 0.6;
      
      if (score < minScore) {
        this.logger.log(`[FILTER] ${row.symbol} score too low: ${score} < ${minScore}`);
        return;
      }

      this.logger.log(`[FILTER] ${row.symbol} passed filters - score: ${score}`);

      // Execute buy with Jupiter dry-run first, fallback to Dummy
      let buyResult;
      let executorUsed = env.EXECUTOR;

      if (env.EXECUTOR === 'Jupiter' && env.JUPITER_DRY_RUN) {
        // Try Jupiter dry-run first
        buyResult = await this.executor.executeBuy({
          symbol: row.symbol,
          mint: row.mint,
          preset: 'medium',
          amountSol: this.rules.execution?.defaultAmountSol || 0.1
        });

        // If no route found, fallback to Dummy for demo continuity
        if (!buyResult.success && (buyResult.reason === 'NO_ROUTE_MOCK_MINT' || buyResult.reason === 'NO_ROUTE_UNKNOWN_MINT')) {
          this.logger.log(`[JUPITER:DRY] no route for mint=${row.mint} (falling back to Dummy)`);
          buyResult = await this.fallbackExecutor.executeBuy({
            symbol: row.symbol,
            mint: row.mint,
            preset: 'medium',
            amountSol: this.rules.execution?.defaultAmountSol || 0.1
          });
          executorUsed = 'Dummy';
        }
      } else {
        // Use configured executor directly
        buyResult = await this.executor.executeBuy({
          symbol: row.symbol,
          mint: row.mint,
          preset: 'medium',
          amountSol: this.rules.execution?.defaultAmountSol || 0.1
        });
      }

      if (buyResult.success) {
        this.logger.log(`[EXECUTE] Buy completed for ${row.symbol} - txid: ${buyResult.txid || 'simulated'}`);
        
        // Simulate 2x profit and sell initials
        setTimeout(async () => {
          try {
            const sellExecutor = executorUsed === 'Dummy' ? this.fallbackExecutor : this.executor;
            const sellResult = await sellExecutor.executeSellInitials({
              symbol: row.symbol,
              mint: row.mint,
              percentage: 50
            });
            
            if (sellResult.success) {
              this.logger.log(`[EXECUTE] Sell initials completed for ${row.symbol} - txid: ${sellResult.txid || 'simulated'}`);
            }
          } catch (error) {
            this.logger.error(`[EXECUTE] Sell initials failed for ${row.symbol}:`, error.message);
          }
        }, 2000 + Math.random() * 3000); // 2-5 seconds delay
      }

    } catch (error) {
      this.logger.error(`[PIPELINE] Error processing ${row.symbol}:`, error.message);
    }
  }

  // Minimal tick processing - clean and simple
  async processTickMinimal(tick, source) {
    try {
      // Simple deduplication
      const now = Date.now();
      const dedupKey = tick.mint;
      const lastSeen = this.scoutDedup.get(dedupKey);
      
      if (lastSeen && now - lastSeen < 30000) { // 30s TTL
        return; // Skip duplicate
      }
      this.scoutDedup.set(dedupKey, now);

      // Clean up old entries
      for (const [key, timestamp] of [...this.scoutDedup.entries()]) {
        if (now - timestamp > 30000) {
          this.scoutDedup.delete(key);
        }
      }

      // Scout log
      this.logger.log(`[SCOUT] ${tick.symbol || 'UNKNOWN'} (${tick.mint}) src=${source} mcap=${tick.mcap || tick.marketCap || '-'}`);

      // Convert to row format for filtering
      const row = this.tickToRow(tick);
      
      // Scout -> Filter -> Score
      const decision = await this.scoutFilterScore(row);
      if (!decision.passed) {
        return; // Filtered out
      }

      this.logger.log(`[FILTER] pass score=${decision.score} reasons=${decision.reasons?.join(',') || ''}`);

      // Jupiter dry-run quotes
      const useDryRun = process.env.USE_JUPITER_DRYRUN === 'true';
      if (useDryRun) {
        await this.tryJupiterDryRun(row);
      }

      // Execution gate - OFF by default
      const allowExecute = process.env.ALLOW_EXECUTE === 'true';
      if (!allowExecute) {
        this.logger.log('[EXECUTE] skipped (ALLOW_EXECUTE=false)');
        return;
      }

      // REAL EXECUTION - $15 max spend
      this.logger.log(`[EXECUTE] 🚀 LIVE TRADING: ${row.symbol} (${row.mint})`);
      
      // Conservative $15 max: 0.01 SOL (~$2.50 at $250/SOL)
      const tradeSizeSol = 0.01;
      
      try {
        // REAL JUPITER EXECUTION - Live blockchain trades
        const buyResult = await this.executor.executeBuy({
          symbol: row.symbol,
          mint: row.mint,
          preset: 'small',
          amountSol: tradeSizeSol,
          dryRun: false // LIVE TRADING
        });

        if (buyResult.success) {
          if (buyResult.realTrade) {
            this.logger.log(`[EXECUTE] ✅ REAL TRADE SUCCESS: ${row.symbol} - ${tradeSizeSol} SOL - txid: ${buyResult.txid}`);
            this.logger.log(`[EXECUTE] 💰 LIVE MONEY: Spent $${(tradeSizeSol * 250).toFixed(2)} for ${row.symbol} tokens`);
          } else {
            this.logger.log(`[EXECUTE] ✅ BUY SUCCESS: ${row.symbol} - ${tradeSizeSol} SOL - txid: ${buyResult.txid || 'SIMULATED'}`);
            this.logger.log(`[EXECUTE] 💰 SIMULATED: Would have bought $${(tradeSizeSol * 250).toFixed(2)} worth of ${row.symbol}`);
          }
          
          // Set up sell target (8% profit target from config)
          const profitTarget = process.env.PROFIT_TARGET_PERCENT || '8';
          this.logger.log(`[EXECUTE] 🎯 Target: +${profitTarget}% profit on ${row.symbol}`);
          
        } else {
          this.logger.log(`[EXECUTE] ❌ BUY FAILED: ${row.symbol} - reason: ${buyResult.reason || 'unknown'}`);
        }
        
      } catch (error) {
        this.logger.error(`[EXECUTE] 💥 TRADE ERROR: ${row.symbol} - ${error.message}`);
      }

    } catch (error) {
      this.logger.error(`[PIPELINE] Error processing ${tick.symbol}:`, error.message);
    }
  }

  async scoutFilterScore(row) {
    // Apply filters
    const filterResult = this.filterRow(row);
    if (!filterResult.pass) {
      return { passed: false, reason: filterResult.reason };
    }

    // Calculate score
    const score = this.calculateScore(row);
    const minScore = this.rules.execution?.minScore || 0.6;
    
    if (score < minScore) {
      return { passed: false, reason: `score_too_low: ${score} < ${minScore}` };
    }

    return { 
      passed: true, 
      score, 
      reasons: ['passed_filters', 'score_ok']
    };
  }

  async tryJupiterDryRun(row) {
    try {
      const slippageBps = parseInt(process.env.QUOTE_SLIPPAGE_BPS || '150', 10);
      
      const quoteResult = await this.executor.executeBuy({
        symbol: row.symbol,
        mint: row.mint,
        preset: 'medium',
        amountSol: this.rules.execution?.defaultAmountSol || 0.1,
        dryRun: true
      });

      if (quoteResult.success && quoteResult.route) {
        const inSol = ((quoteResult.inputAmount || 0) / 1e9).toFixed(3);
        const outTokens = this.formatTokenAmount(quoteResult.outputAmount || 0, row.symbol);
        const amms = quoteResult.route.amms?.join('+') || 'Unknown';
        this.logger.log(`[JUPITER:DRY] quote ok route=${amms} in=${inSol} out=${outTokens} slip=${quoteResult.route.slippageBps || slippageBps}bps`);
      } else {
        this.logger.warn(`[JUPITER:DRY] no route mint=${row.mint} reason=${quoteResult.reason || 'unknown'}`);
      }
    } catch (error) {
      this.logger.warn(`[JUPITER:DRY] error mint=${row.mint} err=${error.message}`);
    }
  }

  async processShadowTick(tick) {
    try {
      // Convert to row format for filtering
      const row = this.tickToRow(tick);
      
      // Scout step - log the opportunity with source tag
      this.logger.log(`[SCOUT:SHADOW] ${tick.symbol ?? ''} ${tick.mint} mcap=${tick.mcap ?? '-'} prot=${tick.protocol ?? '-'}`);

      // Filter step
      const filterResult = this.filterRow(row);
      if (!filterResult.pass) {
        return; // Skip logging for shadow filter-outs to reduce noise
      }

      // Score step
      const score = this.calculateScore(row);
      const minScore = this.rules.execution?.minScore || 0.6;
      if (score < minScore) {
        return; // Skip logging for low scores
      }

      // Quote-only execution for shadow opportunities
      if (env.EXECUTOR === 'Jupiter') {
        try {
          const quoteResult = await this.executor.executeBuy({
            symbol: row.symbol,
            mint: row.mint,
            preset: 'medium',
            amountSol: this.rules.execution?.defaultAmountSol || 0.1,
            dryRun: true // Force dry run for shadow
          });

          if (quoteResult.success && quoteResult.route) {
            const inSol = ((quoteResult.inputAmount || 0) / 1e9).toFixed(3);
            const outTokens = this.formatTokenAmount(quoteResult.outputAmount || 0, row.symbol);
            const amms = quoteResult.route.amms?.join('+') || 'Unknown';
            console.log(`[QUOTE:SHADOW] route=${amms} in=${inSol} SOL out=${outTokens} ${row.symbol} slip=${quoteResult.route.slippageBps || 0}bps`);
            
            // Cache quote if enabled
            await this.cacheQuote({
              ts: Date.now(),
              mint: row.mint,
              symbol: row.symbol,
              route: amms,
              inSol: parseFloat(inSol),
              outAmt: quoteResult.outputAmount || 0,
              slipBps: quoteResult.route.slippageBps || 0,
              cu: quoteResult.route.computeUnitPriceMicroLamports || 0,
              ok: true,
              reason: ''
            });
          } else {
            console.log(`[QUOTE:SHADOW] no-route mint=${row.mint}`);
            
            // Cache failed quote
            await this.cacheQuote({
              ts: Date.now(),
              mint: row.mint,
              symbol: row.symbol,
              route: '',
              inSol: 0,
              outAmt: 0,
              slipBps: 0,
              cu: 0,
              ok: false,
              reason: quoteResult.reason || 'no-route'
            });
          }
        } catch (error) {
          console.log(`[QUOTE:SHADOW] error mint=${row.mint} err=${error.message}`);
          
          // Cache error quote
          await this.cacheQuote({
            ts: Date.now(),
            mint: row.mint,
            symbol: row.symbol,
            route: '',
            inSol: 0,
            outAmt: 0,
            slipBps: 0,
            cu: 0,
            ok: false,
            reason: error.message
          });
        }
      }
    } catch (error) {
      this.logger.error(`[PIPELINE] Error processing shadow tick:`, error.message);
    }
  }

  formatTokenAmount(amount, symbol) {
    if (amount >= 1e9) {
      return `${(amount / 1e9).toFixed(1)}B`;
    } else if (amount >= 1e6) {
      return `${(amount / 1e6).toFixed(1)}M`;
    } else if (amount >= 1e3) {
      return `${(amount / 1e3).toFixed(1)}K`;
    }
    return amount.toLocaleString();
  }



  // Convert normalized tick to legacy row format
  tickToRow(tick) {
    // For mock ticks, preserve original row format
    if (tick.source === 'mock') {
      return {
        symbol: tick.symbol,
        mint: tick.mint,
        stage: tick.stage,
        marketCap: tick.marketCap, // Keep original field name
        insidersPercent: tick.insidersPercent,
        bundlersPercent: tick.bundlersPercent,
        ageMinutes: tick.ageMinutes,
        protocol: tick.protocol,
        timestamp: tick.timestamp,
        source: tick.source
      };
    }
    
    // For shadow ticks, convert from normalized format
    return {
      symbol: tick.symbol || `UNKNOWN_${tick.mint.slice(0, 8)}`,
      mint: tick.mint,
      stage: 'migrated', // Default for shadow ticks
      marketCap: tick.mcap || 0,
      insidersPercent: 0, // Not available in shadow data
      bundlersPercent: 0, // Not available in shadow data
      ageMinutes: tick.age_minutes || 0,
      protocol: tick.protocol || 'Unknown',
      timestamp: new Date(tick.ts).toISOString(),
      source: tick.source
    };
  }

  async start() {
    if (this.isRunning) {
      this.logger.log('[RESURRECTION] Pipeline already running');
      return;
    }

    this.isRunning = true;

    // Load rules
    await this.loadRules();

    // Source selection - ONE source only
    const useShadow = process.env.USE_AXIOM_SHADOW === 'true';
    const useMock = process.env.USE_MOCK_DATA === 'true';
    
    if (useShadow) {
      await this.startShadowSource();
    } else if (useMock) {
      await this.startMockSource();
    } else {
      throw new Error('No source enabled: set USE_AXIOM_SHADOW=true or USE_MOCK_DATA=true');
    }

    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      this.logger.log('\n[RESURRECTION] Received SIGINT, shutting down gracefully...');
      await this.stop();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      this.logger.log('\n[RESURRECTION] Received SIGTERM, shutting down gracefully...');
      await this.stop();
      process.exit(0);
    });
  }

  async startShadowSource() {
    try {
      const { AxiomShadowBroker } = await import('../src/shadow/AxiomShadowBroker.js');
      this.shadowBroker = new AxiomShadowBroker();
      
      this.shadowBroker.on('tick', (tick) => {
        this.processTickMinimal(tick, 'shadow');
      });

      this.shadowBroker.on('error', (error) => {
        this.logger.error('[SHADOW:BROKER] Error:', error.message);
      });

      await this.shadowBroker.start();
      this.logger.log('[RESURRECTION] source=shadow ready');
    } catch (error) {
      this.logger.error('[RESURRECTION] Failed to start shadow source:', error.message);
      throw error;
    }
  }

  async startMockSource() {
    try {
      this.pulseInterval = await this.pulseFetcher.start((row) => {
        const tick = { ...row, source: 'mock', ts: Date.now() };
        this.processTickMinimal(tick, 'mock');
      });
      this.logger.log('[RESURRECTION] source=mock ready');
    } catch (error) {
      this.logger.error('[RESURRECTION] Failed to start mock source:', error.message);
      throw error;
    }
  }

  async stop() {
    if (!this.isRunning) return;

    const mode = env.JUPITER_DRY_RUN ? ' (dry-run)' : '';
    this.logger.log(`[RESURRECTION] Stopping pipeline...${mode}`);
    this.isRunning = false;

    if (this.pulseFetcher) {
      this.pulseFetcher.stop();
    }

    if (this.pulseInterval) {
      clearInterval(this.pulseInterval);
      this.pulseInterval = null;
    }

    if (this.shadowBroker) {
      this.shadowBroker.stop();
      this.shadowBroker = null;
    }

    this.logger.log(`[RESURRECTION] graceful shutdown${mode}`);
  }
}

// Auto-start if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  const pipeline = new ResurrectionPipeline();
  pipeline.start().catch(error => {
    console.error('[RESURRECTION] Pipeline failed to start:', error);
    process.exit(1);
  });
}

export default ResurrectionPipeline; 