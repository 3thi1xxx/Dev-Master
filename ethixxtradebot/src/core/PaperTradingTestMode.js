/**
 * TEST MODE - Generate simulated paper trades for demonstration
 * This will make random paper trades to show the GUI working
 */

export function startTestMode(paperTradingSystem, intervalMs = 5000) {
  console.log('🧪 TEST MODE ACTIVATED - Generating demo trades every 5 seconds');
  
  const testTokens = [
    { symbol: 'BONK', name: 'Bonk', price: 0.00001234 },
    { symbol: 'WIF', name: 'dogwifhat', price: 2.45 },
    { symbol: 'PEPE', name: 'Pepe', price: 0.00000789 },
    { symbol: 'SHIB', name: 'Shiba Inu', price: 0.00002345 },
    { symbol: 'DOGE', name: 'Dogecoin', price: 0.08765 }
  ];
  
  setInterval(() => {
    // Pick a random token
    const token = testTokens[Math.floor(Math.random() * testTokens.length)];
    
    // Simulate price movement
    const priceChange = (Math.random() - 0.5) * 0.1; // ±10%
    token.price = token.price * (1 + priceChange);
    
    // Randomly decide to buy or check for sells
    const positions = paperTradingSystem.getActivePositions();
    
    if (positions.length < 3 && Math.random() > 0.3) {
      // BUY
      const amount = Math.floor(Math.random() * 1000) + 100; // $100-$1100
      
      console.log(`[TEST] 🎯 Buying ${token.symbol} for $${amount.toFixed(2)}`);
      
      // Use the correct method for paper trading
      paperTradingSystem.openPosition({
        tokenAddress: `test_${token.symbol}_${Date.now()}`,
        ticker: token.symbol,
        price: token.price,
        confidence: 'strong',
        signal: {
          action: 'buy',
          reason: 'TEST MODE - Demo trade',
          scores: { composite: 7.5 }
        },
        scores: { composite: 7.5 }
      });
      
    } else if (positions.length > 0 && Math.random() > 0.5) {
      // SELL a random position
      const position = positions[Math.floor(Math.random() * positions.length)];
      
      if (position) {
        console.log(`[TEST] 💰 Selling ${position.ticker}`);
        
        // Calculate a random exit price based on position's entry price
        const exitPrice = position.entryPrice * (1 + (Math.random() - 0.5) * 0.2);
        
        // Use the correct method for closing positions (correct parameter order)
        paperTradingSystem.closePosition(
          position.id,
          'TEST MODE - Demo exit',
          exitPrice
        );
      }
    }
    
  }, intervalMs);
}

export default { startTestMode }; 