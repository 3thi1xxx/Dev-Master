/**
 * DummyExecutor - Mock executor for testing and development
 */
import { nextNonce } from '../utils/WalletNonce.js';

export class DummyExecutor {
  constructor({ logger = console } = {}) {
    this.logger = logger;
  }

  async executeBuy({ symbol, mint, preset = 'medium', amountSol = 0.1 }) {
    const nonce = nextNonce(symbol);
    const mockTxid = `dummy_buy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    this.logger.log(`[DUMMY] BUY ${symbol} (${mint}) - ${amountSol} SOL [${preset}] - nonce: ${nonce}`);
    
    // Simulate some processing time
    await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));
    
    return {
      success: true,
      txid: mockTxid,
      symbol,
      mint,
      amountSol,
      preset,
      simulated: true,
      nonce
    };
  }

  async executeSellInitials({ symbol, mint, percentage = 50 }) {
    const nonce = nextNonce(symbol);
    const mockTxid = `dummy_sell_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    this.logger.log(`[DUMMY] SELL_INITIALS ${symbol} (${mint}) - ${percentage}% - nonce: ${nonce}`);
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));
    
    return {
      success: true,
      txid: mockTxid,
      symbol,
      mint,
      percentage,
      simulated: true,
      nonce
    };
  }

  async executeSell({ symbol, mint, amountSol }) {
    const nonce = nextNonce(symbol);
    const mockTxid = `dummy_sell_full_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    this.logger.log(`[DUMMY] SELL ${symbol} (${mint}) - ${amountSol} SOL - nonce: ${nonce}`);
    
    await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));
    
    return {
      success: true,
      txid: mockTxid,
      symbol,
      mint,
      amountSol,
      simulated: true,
      nonce
    };
  }
}

export default DummyExecutor; 