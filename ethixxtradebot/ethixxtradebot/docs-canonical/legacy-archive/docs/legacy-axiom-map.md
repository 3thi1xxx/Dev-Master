# Legacy Axiom API References Map

## Core Endpoints Found
- **Wallet Nonce**: `POST /wallet-nonce` - Get challenge for wallet authentication
- **Verify Wallet**: `POST /verify-wallet-v2` - Verify signature and get session
- **API6 Data**: `GET /meme-trending?timePeriod=1h` - Trending token data

## Base URLs
- `https://api{1-15}.axiom.trade` - Multi-endpoint rotation (api1, api2, ..., api15)
- `https://api6.axiom.trade` - Primary data endpoint
- `https://app.axiom.trade` - Main application

## Legacy Implementation Files

### Core Handshake
- `axiomtrade-archive/src/axiom-handshake.js` - Main handshake with cookie jar, endpoint rotation
- `agents/axiom/AxiomHandshake.js` - Modernized version (current)

### API6 Integration  
- `axiom-sniper/fetchTrending.js` - API6 trending data with hardcoded auth token
- `axiom-sniper/axiom-latency-check.js` - API6 latency testing
- `agents/axiom/AxiomAPI6Client.js` - Modern API6 client (current)

### Configuration Examples
- `chad-lockdown-spine/.env` - Live environment with AXIOM_API_HOSTS
- `new axiom trade/axiom-trade/.env` - Legacy configuration

## Key Patterns Found

### Authentication Flow
1. `POST {baseUrl}/wallet-nonce` with `{ walletAddress }`
2. Sign nonce with Ed25519 (tweetnacl + bs58)
3. `POST {baseUrl}/verify-wallet-v2` with signature
4. Extract session from response

### Cookie Management
- Uses tough-cookie CookieJar with axios-cookiejar-support
- Automatic Set-Cookie handling
- Session persistence across requests

### Headers
- `Content-Type: application/json`
- `Accept: application/json, text/plain, */*`
- `User-Agent`: Randomized browser strings
- `Referrer: https://axiom.trade/`

### Rate Limiting
- 5-minute cooldown between handshake attempts
- Exponential backoff on failures (2^n * 10s)
- 1-hour timeout after 3+ consecutive failures

### Endpoint Rotation
- Try api1-api15 in sequence until healthy endpoint found
- Parse from AXIOM_API_HOSTS environment variable
- Fallback to default api1-api15 template

## Environment Variables Found
- `AXIOM_API_HOSTS` - CSV of endpoint URLs
- `AXIOM_CHALLENGE_URL` - Direct nonce endpoint (legacy)
- `AXIOM_VERIFY_URL` - Direct verify endpoint (legacy)
- `AUTH_WALLET` - Wallet public key
- `SOLANA_PRIVATE_KEY_BASE58` - Private key for signing

## Dependencies Used
- `axios` - HTTP client
- `tough-cookie` - Cookie jar
- `axios-cookiejar-support` - Cookie integration
- `bs58` - Base58 encoding/decoding
- `@solana/web3.js` - Keypair management
- `tweetnacl` - Ed25519 signing

## Test Files
- `axiomtrade-archive/__tests__/axiom-handshake.endpoint-rotation.test.ts`
- `axiomtrade-archive/scripts/test-handshake.ts`
- Multiple test scripts in `axiomtrade-archive/scripts/`

## Notes
- All legacy code uses ESM imports
- Comprehensive error handling and alerting
- Session caching to avoid excessive handshakes
- Anti-fingerprinting with randomized User-Agents 