import axios from 'axios';
import dotenv from 'dotenv';
import ora from 'ora';
import chalk from 'chalk';

// Load .env
dotenv.config();

// === CONFIGURATION ===
const CONFIG = {
  tradeAmount: 0.02,
  profitTarget: 0.10,
  stopLoss: 0.10,
  maxTradeAge: 600,         // in seconds (10 minutes)
  minLiquidity: 1000,       // in USD
  scanInterval: 15000       // in ms (15 seconds)
};

const spinner = ora();

// === HELPERS ===
function getTokenAgeInSeconds(unixTime) {
  const now = Math.floor(Date.now() / 1000);
  return now - unixTime;
}

// === MAIN SCANNER ===
async function scanRaydium() {
  console.log(chalk.blue.bold('\n🔁 Scanning Raydium Pools...\n'));

  try {
    spinner.start('Fetching Raydium data...');
    const response = await axios.get('https://api.raydium.io/pairs');
    spinner.succeed('Fetched successfully.');

    const rawTokens = response.data;
    console.log(`📦 Total tokens pulled: ${rawTokens.length}`);

    const tokens = rawTokens.filter(pair => {
      if (
        !pair.baseToken?.symbol ||
        !pair.createdUnixTime ||
        typeof pair.liquidity !== 'number'
      ) return false;

      const age = getTokenAgeInSeconds(pair.createdUnixTime);
      const liquidity = pair.liquidity;

      return (
        age <= CONFIG.maxTradeAge &&
        liquidity >= CONFIG.minLiquidity
      );
    });

    if (tokens.length === 0) {
      console.log(chalk.gray('\n❗ No tokens matched filters. Here’s a sample:\n'));
      rawTokens.slice(0, 5).forEach(pair => {
        const symbol = pair.baseToken?.symbol || '???';
        const age = pair.createdUnixTime ? getTokenAgeInSeconds(pair.createdUnixTime) + 's' : 'unknown';
        const liquidity = pair.liquidity || 0;
        console.log(`→ ${symbol} | Age: ${age} | Liquidity: $${liquidity}`);
      });
      return;
    }

    for (const token of tokens) {
      const symbol = token.baseToken?.symbol || '???';
      const name = token.baseToken?.name || 'Unknown Token';
      const age = getTokenAgeInSeconds(token.createdUnixTime);
      const liquidity = token.liquidity || 0;
      const price = token.price || 'unknown';

      console.log(chalk.green(`\n📈 ${name} (${symbol})`));
      console.log(`⏳ Age: ${age}s`);
      console.log(`💦 Liquidity: $${liquidity.toLocaleString()}`);
      console.log(`💵 Price: $${price}`);
      console.log(`🧪 LP: ${token.lpMint}`);
      console.log(`🛠 Market ID: ${token.marketId}`);

      // === AI SCORING PLACEHOLDER ===
      // Here’s where you’d send data to GPT:
      // const aiDecision = await getGPTScore({ name, symbol, age, liquidity, price });
      // if (aiDecision === 'buy') { executeBuy(); }

      console.log(chalk.yellow(`🚀 [DRY RUN] Would buy ${CONFIG.tradeAmount} SOL here\n`));
    }

    console.log(chalk.blue.bold('✅ Scan complete.\n'));

  } catch (error) {
    spinner.fail('Failed to fetch Raydium tokens.');
    console.error(chalk.red(error.message));
  }
}

// === LOOP ===
function startLoop() {
  console.log(chalk.cyan(`🔁 Starting scan loop every ${CONFIG.scanInterval / 1000}s...\n`));
  scanRaydium();
  setInterval(scanRaydium, CONFIG.scanInterval);
}

startLoop();
