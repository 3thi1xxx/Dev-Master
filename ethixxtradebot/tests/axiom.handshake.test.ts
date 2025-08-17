/**
 * Axiom Handshake Tests - Mock the legacy endpoints discovered
 */
import nock from 'nock';
import { LegacyAxiomConnector } from '../src/connectors/axiom/LegacyAxiomConnector';

describe('Axiom Legacy Connector', () => {
  let connector: LegacyAxiomConnector;
  const testPubkey = 'TestPublicKey123';
  const testNonce = 'test-nonce-12345';
  const testSignature = 'test-signature-67890';

  beforeEach(() => {
    // Set up environment for testing
    process.env.AXIOM_ENABLE = 'true';
    process.env.AXIOM_STEALTH = 'true';
    
    connector = new LegacyAxiomConnector({
      apiHosts: ['https://api1.axiom.trade', 'https://api2.axiom.trade']
    });
  });

  afterEach(() => {
    nock.cleanAll();
  });

  describe('getWalletNonce', () => {
    it('should successfully get nonce from first healthy endpoint', async () => {
      nock('https://api1.axiom.trade')
        .post('/wallet-nonce', { walletAddress: testPubkey })
        .reply(200, testNonce, {
          'Set-Cookie': ['session=abc123; Path=/; HttpOnly']
        });

      const result = await connector.getWalletNonce(testPubkey);
      
      expect(result).toEqual({ nonce: testNonce });
    });

    it('should try multiple endpoints and find healthy one', async () => {
      // First endpoint fails
      nock('https://api1.axiom.trade')
        .post('/wallet-nonce', { walletAddress: testPubkey })
        .reply(500, 'Server Error');

      // Second endpoint succeeds
      nock('https://api2.axiom.trade')
        .post('/wallet-nonce', { walletAddress: testPubkey })
        .reply(200, testNonce);

      const result = await connector.getWalletNonce(testPubkey);
      
      expect(result).toEqual({ nonce: testNonce });
    });

    it('should return error when all endpoints fail', async () => {
      nock('https://api1.axiom.trade')
        .post('/wallet-nonce', { walletAddress: testPubkey })
        .reply(500, 'Server Error');

      nock('https://api2.axiom.trade')
        .post('/wallet-nonce', { walletAddress: testPubkey })
        .reply(404, 'Not Found');

      const result = await connector.getWalletNonce(testPubkey);
      
      expect(result).toEqual({ ok: false, reason: 'NO_HEALTHY_ENDPOINTS' });
    });

    it('should enforce rate limiting', async () => {
      // First call succeeds
      nock('https://api1.axiom.trade')
        .post('/wallet-nonce', { walletAddress: testPubkey })
        .reply(200, testNonce);

      await connector.getWalletNonce(testPubkey);

      // Second call immediately after should be rate limited
      const result = await connector.getWalletNonce(testPubkey);
      expect(result).toEqual({ ok: false, reason: 'RATE_LIMITED' });
    });
  });

  describe('verifySignature', () => {
    beforeEach(async () => {
      // Set up healthy host first
      nock('https://api1.axiom.trade')
        .post('/wallet-nonce', { walletAddress: testPubkey })
        .reply(200, testNonce);

      await connector.getWalletNonce(testPubkey);
    });

    it('should successfully verify signature', async () => {
      // Mock nonce request (called internally)
      nock('https://api1.axiom.trade')
        .post('/wallet-nonce', { walletAddress: testPubkey })
        .reply(200, testNonce);

      // Mock verify request
      nock('https://api1.axiom.trade')
        .post('/verify-wallet-v2', {
          walletAddress: testPubkey,
          allowRegistration: true,
          isVerify: false,
          nonce: testNonce,
          referrer: null,
          signature: testSignature
        })
        .reply(200, {
          session: { token: 'session-token-123', userId: 'user-456' }
        });

      const result = await connector.verifySignature(testPubkey, testSignature);
      
      expect(result.ok).toBe(true);
      expect(result.session).toEqual({ token: 'session-token-123', userId: 'user-456' });
    });

    it('should handle verification errors', async () => {
      // Mock nonce request
      nock('https://api1.axiom.trade')
        .post('/wallet-nonce', { walletAddress: testPubkey })
        .reply(200, testNonce);

      // Mock verify request with error
      nock('https://api1.axiom.trade')
        .post('/verify-wallet-v2')
        .reply(400, { error: 'Invalid signature' });

      const result = await connector.verifySignature(testPubkey, testSignature);
      
      expect(result.ok).toBe(false);
      expect(result.error).toBe('Invalid signature');
    });
  });

  describe('ping', () => {
    it('should return disabled when AXIOM_ENABLE is false', async () => {
      process.env.AXIOM_ENABLE = 'false';
      
      const result = await connector.ping();
      
      expect(result).toEqual({
        ok: false,
        code: 0,
        cookies: 0,
        error: 'DISABLED'
      });
    });

    it('should return stealth disabled when AXIOM_STEALTH is false', async () => {
      process.env.AXIOM_STEALTH = 'false';
      
      const result = await connector.ping();
      
      expect(result).toEqual({
        ok: false,
        code: 0,
        cookies: 0,
        error: 'STEALTH_DISABLED'
      });
    });

    it('should successfully ping api6 trending endpoint', async () => {
      nock('https://api6.axiom.trade')
        .get('/meme-trending?timePeriod=1h')
        .reply(200, { trending: [] }, {
          'Set-Cookie': ['session=ping-test; Path=/']
        });

      const result = await connector.ping();
      
      expect(result.ok).toBe(true);
      expect(result.code).toBe(200);
      expect(result.cookies).toBeGreaterThan(0);
    });

    it('should handle ping failures gracefully', async () => {
      nock('https://api6.axiom.trade')
        .get('/meme-trending?timePeriod=1h')
        .reply(503, 'Service Unavailable');

      const result = await connector.ping();
      
      expect(result.ok).toBe(false);
      expect(result.code).toBe(503);
      expect(result.cookies).toBe(0);
    });
  });

  describe('cookie jar integration', () => {
    it('should persist cookies between requests', async () => {
      const setCookieHeader = ['axiom_session=abc123; Path=/; HttpOnly', 'csrf_token=xyz789; Path=/'];
      
      // First request sets cookies
      nock('https://api1.axiom.trade')
        .post('/wallet-nonce', { walletAddress: testPubkey })
        .reply(200, testNonce, {
          'Set-Cookie': setCookieHeader
        });

      await connector.getWalletNonce(testPubkey);

      // Second request should include cookies
      nock('https://api1.axiom.trade')
        .post('/wallet-nonce', { walletAddress: testPubkey })
        .matchHeader('cookie', /axiom_session=abc123/)
        .reply(200, testNonce);

      // Force another request to test cookie persistence
      // Reset rate limiting by clearing lastHandshakeTime
      (connector as any).lastHandshakeTime = 0;
      
      const result = await connector.getWalletNonce(testPubkey);
      expect(result).toEqual({ nonce: testNonce });
    });
  });

  describe('CSRF handling', () => {
    it('should attempt to refresh CSRF on 401 error when stealth enabled', async () => {
      process.env.AXIOM_STEALTH = 'true';

      // Mock main page for CSRF extraction
      nock('https://app.axiom.trade')
        .get('/')
        .reply(200, '<meta name="csrf-token" content="csrf-123">');

      // First request fails with 401
      nock('https://api1.axiom.trade')
        .post('/wallet-nonce', { walletAddress: testPubkey })
        .reply(401, 'Unauthorized');

      // Retry with CSRF token should succeed
      nock('https://api1.axiom.trade')
        .post('/wallet-nonce', { walletAddress: testPubkey })
        .matchHeader('X-CSRF-Token', 'csrf-123')
        .reply(200, testNonce);

      const result = await connector.getWalletNonce(testPubkey);
      expect(result).toEqual({ nonce: testNonce });
    });
  });
}); 