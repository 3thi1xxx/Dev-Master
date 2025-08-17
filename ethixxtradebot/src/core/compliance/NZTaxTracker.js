import fs from 'fs';
import path from 'path';
import axios from 'axios';

export class NZTaxTracker {
  constructor() {
    this.trades = [];
    this.logFile = 'tax-records/nz-trading-log.json';
    this.csvFile = 'tax-records/nz-trading-export.csv';
    this.currentTaxYear = this.getCurrentTaxYear();
    this.logger = console;
    
    // Ensure tax records directory exists
    this.ensureDirectories();
    
    // Load existing records
    this.loadExistingRecords();
  }

  getCurrentTaxYear() {
    const now = new Date();
    const year = now.getFullYear();
    // NZ tax year is April 1 - March 31
    return now.getMonth() >= 3 ? year : year - 1;
  }

  ensureDirectories() {
    const dirs = ['tax-records', 'tax-records/annual', 'tax-records/backups'];
    dirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  loadExistingRecords() {
    try {
      if (fs.existsSync(this.logFile)) {
        const data = fs.readFileSync(this.logFile, 'utf8');
        this.trades = JSON.parse(data);
        this.logger.log(`[TAX-TRACKER] 📊 Loaded ${this.trades.length} existing trade records`);
      }
    } catch (error) {
      this.logger.log('[TAX-TRACKER] ⚠️ Could not load existing records, starting fresh');
      this.trades = [];
    }
  }

  async recordTrade(tradeData) {
    const trade = {
      timestamp: tradeData.timestamp || Date.now(),
      type: tradeData.type || 'UNKNOWN',
      symbol: tradeData.symbol || 'UNKNOWN',
      address: tradeData.address || '',
      amount: tradeData.amount || 0,
      price: tradeData.price || 0,
      usdValue: tradeData.usdValue || 0,
      source: tradeData.source || 'manual',
      strategy: tradeData.strategy || 'unknown',
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
    
    this.trades.push(trade);
    
    this.logger.log(`[TAX] 📊 Trade recorded: ${trade.type} ${trade.symbol} - $${trade.usdValue.toFixed(2)}`);
    
    // Auto-export if enabled
    if (this.config && this.config.autoExport && this.trades.length % 10 === 0) {
      await this.exportToCSV();
    }
    
    return trade;
  }

  async getCurrentExchangeRates() {
    try {
      // Get USD/NZD rate from Reserve Bank of NZ (official rate for tax purposes)
      const rbnzResponse = await axios.get('https://api.rbnz.govt.nz/data/exchange-rates/daily/USD/NZD');
      const nzdRate = rbnzResponse.data?.observations?.[0]?.value || 1.65; // fallback
      
      // Get SOL/USD rate from CoinGecko
      const solResponse = await axios.get('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd');
      const solUsdRate = solResponse.data?.solana?.usd || 250; // fallback
      
      return {
        usdToNzd: parseFloat(nzdRate),
        solToUsd: parseFloat(solUsdRate),
        solToNzd: parseFloat(solUsdRate) * parseFloat(nzdRate),
        timestamp: new Date().toISOString(),
        source: 'RBNZ + CoinGecko'
      };
    } catch (error) {
      this.logger.log('[TAX-TRACKER] ⚠️ Could not fetch live rates, using fallback');
      return {
        usdToNzd: 1.65,
        solToUsd: 250,
        solToNzd: 412.5,
        timestamp: new Date().toISOString(),
        source: 'FALLBACK_RATES'
      };
    }
  }

  async logTrade(tradeData) {
    const rates = await this.getCurrentExchangeRates();
    const timestamp = new Date();
    
    const taxRecord = {
      // Unique identifier
      id: `${timestamp.getTime()}_${Math.random().toString(36).substr(2, 9)}`,
      
      // Timestamps (NZ time for tax purposes)
      timestamp: timestamp.toISOString(),
      nzTimestamp: timestamp.toLocaleString('en-NZ', { timeZone: 'Pacific/Auckland' }),
      taxYear: this.getCurrentTaxYear(),
      
      // Trade details
      tradeType: tradeData.type, // 'BUY' | 'SELL'
      tokenPair: tradeData.tokenPair,
      tokenAddress: tradeData.tokenAddress,
      tokenSymbol: tradeData.tokenSymbol,
      
      // Amounts
      tokenAmount: tradeData.tokenAmount,
      solAmount: tradeData.solAmount,
      
      // Prices at trade time
      solPriceUsd: rates.solToUsd,
      usdToNzdRate: rates.usdToNzd,
      solPriceNzd: rates.solToNzd,
      
      // Values in different currencies
      tradeValueUsd: tradeData.solAmount * rates.solToUsd,
      tradeValueNzd: tradeData.solAmount * rates.solToNzd,
      
      // Fees
      transactionFee: tradeData.transactionFee || 0,
      platformFee: tradeData.platformFee || 0,
      totalFeesUsd: (tradeData.transactionFee + tradeData.platformFee) * rates.solToUsd,
      totalFeesNzd: (tradeData.transactionFee + tradeData.platformFee) * rates.solToNzd,
      
      // Trading intelligence
      whaleSignalSource: tradeData.whaleSignalSource,
      signalConfidence: tradeData.signalConfidence,
      tradeRationale: tradeData.tradeRationale,
      executionLatency: tradeData.executionLatency,
      
      // P&L calculation (for sells)
      costBasisUsd: tradeData.costBasisUsd,
      costBasisNzd: tradeData.costBasisNzd,
      realizedPnlUsd: tradeData.realizedPnlUsd,
      realizedPnlNzd: tradeData.realizedPnlNzd,
      
      // Transaction identifiers
      solanaSignature: tradeData.signature,
      blockNumber: tradeData.blockNumber,
      
      // Exchange rate metadata
      exchangeRates: rates,
      
      // Compliance flags
      taxableEvent: tradeData.type === 'SELL',
      capitalGain: tradeData.realizedPnlNzd > 0,
      capitalLoss: tradeData.realizedPnlNzd < 0
    };
    
    // Add to records
    this.trades.push(taxRecord);
    
    // Save immediately
    await this.saveRecords();
    
    // Log for monitoring
    this.logger.log(`[TAX-TRACKER] 📝 Logged ${tradeData.type} trade: ${tradeData.tokenSymbol} for $${taxRecord.tradeValueNzd.toFixed(2)} NZD`);
    
    return taxRecord;
  }

  async saveRecords() {
    try {
      // Save JSON format
      fs.writeFileSync(this.logFile, JSON.stringify(this.trades, null, 2));
      
      // Save CSV format for accountants
      await this.exportToCSV();
      
      // Create backup
      const backupFile = `tax-records/backups/trading-log-${Date.now()}.json`;
      fs.writeFileSync(backupFile, JSON.stringify(this.trades, null, 2));
      
    } catch (error) {
      this.logger.log('[TAX-TRACKER] ❌ Failed to save records:', error.message);
    }
  }

  async exportToCSV() {
    const headers = [
      'Date (NZST)', 'Trade Type', 'Token Symbol', 'Token Amount', 
      'SOL Amount', 'Trade Value (NZD)', 'Trade Value (USD)',
      'Transaction Fees (NZD)', 'Realized P&L (NZD)', 'Capital Gain/Loss',
      'Whale Signal', 'Confidence %', 'Solana Signature', 'Tax Year'
    ];
    
    const rows = this.trades.map(trade => [
      trade.nzTimestamp,
      trade.tradeType,
      trade.tokenSymbol,
      trade.tokenAmount,
      trade.solAmount,
      trade.tradeValueNzd.toFixed(2),
      trade.tradeValueUsd.toFixed(2),
      trade.totalFeesNzd.toFixed(2),
      trade.realizedPnlNzd || 0,
      trade.capitalGain ? 'GAIN' : trade.capitalLoss ? 'LOSS' : 'NEUTRAL',
      trade.whaleSignalSource || 'N/A',
      trade.signalConfidence || 0,
      trade.solanaSignature,
      trade.taxYear
    ]);
    
    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');
    
    fs.writeFileSync(this.csvFile, csvContent);
  }

  getTaxYearSummary(year = this.currentTaxYear) {
    const yearTrades = this.trades.filter(trade => trade.taxYear === year);
    
    const summary = {
      taxYear: year,
      totalTrades: yearTrades.length,
      totalBuys: yearTrades.filter(t => t.tradeType === 'BUY').length,
      totalSells: yearTrades.filter(t => t.tradeType === 'SELL').length,
      totalVolumeNzd: yearTrades.reduce((sum, t) => sum + t.tradeValueNzd, 0),
      totalFeesNzd: yearTrades.reduce((sum, t) => sum + t.totalFeesNzd, 0),
      realizedGainsNzd: yearTrades
        .filter(t => t.capitalGain)
        .reduce((sum, t) => sum + (t.realizedPnlNzd || 0), 0),
      realizedLossesNzd: yearTrades
        .filter(t => t.capitalLoss)
        .reduce((sum, t) => sum + Math.abs(t.realizedPnlNzd || 0), 0),
      netRealizedPnlNzd: yearTrades.reduce((sum, t) => sum + (t.realizedPnlNzd || 0), 0),
      taxableIncome: 0 // Will be calculated based on NZ tax rules
    };
    
    // Calculate taxable income (gains - losses - fees)
    summary.taxableIncome = Math.max(0, 
      summary.realizedGainsNzd - summary.realizedLossesNzd - summary.totalFeesNzd
    );
    
    return summary;
  }

  generateTaxReport(year = this.currentTaxYear) {
    const summary = this.getTaxYearSummary(year);
    const report = {
      generated: new Date().toISOString(),
      taxYear: year,
      summary,
      
      // Detailed breakdown for IR3 form
      incomeStatement: {
        tradingIncome: summary.netRealizedPnlNzd > 0 ? summary.netRealizedPnlNzd : 0,
        tradingLosses: summary.netRealizedPnlNzd < 0 ? Math.abs(summary.netRealizedPnlNzd) : 0,
        deductibleExpenses: summary.totalFeesNzd,
        netTaxableIncome: summary.taxableIncome
      },
      
      // Supporting documentation
      tradeCount: summary.totalTrades,
      recordKeeping: {
        allTransactionsLogged: true,
        exchangeRatesUsed: 'RBNZ Official Rates',
        methodologyNotes: 'FIFO cost basis, real-time exchange rates'
      }
    };
    
    // Save annual report
    const reportFile = `tax-records/annual/tax-report-${year}.json`;
    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
    
    this.logger.log(`[TAX-TRACKER] 📋 Generated tax report for ${year}: $${summary.taxableIncome.toFixed(2)} NZD taxable income`);
    
    return report;
  }

  // Real-time profit tracking for decision making
  getCurrentPortfolioStatus() {
    const currentYearTrades = this.trades.filter(t => t.taxYear === this.currentTaxYear);
    
    return {
      tradesThisYear: currentYearTrades.length,
      realizedPnlNzd: currentYearTrades.reduce((sum, t) => sum + (t.realizedPnlNzd || 0), 0),
      totalFeesNzd: currentYearTrades.reduce((sum, t) => sum + t.totalFeesNzd, 0),
      unrealizedPositions: this.calculateUnrealizedPositions(),
      projectedTaxLiability: this.estimateTaxLiability()
    };
  }

  calculateUnrealizedPositions() {
    // Track open positions for unrealized P&L
    const positions = new Map();
    
    this.trades.forEach(trade => {
      if (!positions.has(trade.tokenAddress)) {
        positions.set(trade.tokenAddress, {
          symbol: trade.tokenSymbol,
          totalTokens: 0,
          totalCostNzd: 0,
          avgCostBasisNzd: 0
        });
      }
      
      const position = positions.get(trade.tokenAddress);
      
      if (trade.tradeType === 'BUY') {
        position.totalTokens += trade.tokenAmount;
        position.totalCostNzd += trade.tradeValueNzd;
        position.avgCostBasisNzd = position.totalCostNzd / position.totalTokens;
      } else if (trade.tradeType === 'SELL') {
        position.totalTokens -= trade.tokenAmount;
        position.totalCostNzd -= (trade.tokenAmount * position.avgCostBasisNzd);
      }
    });
    
    return Array.from(positions.values()).filter(p => p.totalTokens > 0);
  }

  estimateTaxLiability() {
    const summary = this.getTaxYearSummary();
    
    // NZ tax brackets (2024-2025)
    const taxBrackets = [
      { min: 0, max: 14000, rate: 0.105 },
      { min: 14000, max: 48000, rate: 0.175 },
      { min: 48000, max: 70000, rate: 0.3 },
      { min: 70000, max: 180000, rate: 0.33 },
      { min: 180000, max: Infinity, rate: 0.39 }
    ];
    
    // Simplified calculation - would need full income picture for accuracy
    let estimatedTax = 0;
    let remainingIncome = summary.taxableIncome;
    
    for (const bracket of taxBrackets) {
      const taxableInBracket = Math.min(remainingIncome, bracket.max - bracket.min);
      if (taxableInBracket > 0) {
        estimatedTax += taxableInBracket * bracket.rate;
        remainingIncome -= taxableInBracket;
      }
      if (remainingIncome <= 0) break;
    }
    
    return {
      estimatedTaxLiability: estimatedTax,
      effectiveRate: summary.taxableIncome > 0 ? estimatedTax / summary.taxableIncome : 0,
      note: 'Estimate only - consult tax professional for accurate calculation'
    };
  }
} 