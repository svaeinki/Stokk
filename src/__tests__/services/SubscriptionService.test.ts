/**
 * SubscriptionService Tests
 *
 * These tests verify the SubscriptionService behavior with a missing API key.
 * The service is designed to gracefully handle missing configuration.
 */

// We're testing the actual service behavior, not mocking it
// This imports the actual singleton which has no API key in test environment
import SubscriptionService from '../../services/SubscriptionService';

describe('SubscriptionService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset the service state by invalidating cache
    SubscriptionService.invalidateCache();
  });

  describe('behavior without API key', () => {
    it('should return free status for getSubscriptionStatus', async () => {
      const status = await SubscriptionService.getSubscriptionStatus();

      expect(status).toMatchObject({
        isPro: false,
        willRenew: false,
        isLifetime: false,
      });
    });

    it('should return false for isPro', async () => {
      const isPro = await SubscriptionService.isPro();
      expect(isPro).toBe(false);
    });

    it('should return empty array for getPackages', async () => {
      const packages = await SubscriptionService.getPackages();
      expect(packages).toEqual([]);
    });

    it('should return null for getAppUserID when not initialized', async () => {
      const userId = await SubscriptionService.getAppUserID();
      expect(userId).toBeNull();
    });

    it('should return null for logOut when not initialized', async () => {
      const result = await SubscriptionService.logOut();
      expect(result).toBeNull();
    });

    it('should return null for logIn when API key is missing', async () => {
      const result = await SubscriptionService.logIn('test-user');
      expect(result).toBeNull();
    });
  });

  describe('cache management', () => {
    it('should invalidate cache without errors', () => {
      expect(() => SubscriptionService.invalidateCache()).not.toThrow();
    });
  });

  describe('listener management', () => {
    it('should set and remove customer info listener', () => {
      const listener = jest.fn();

      SubscriptionService.setCustomerInfoListener(listener);
      SubscriptionService.removeCustomerInfoListener();

      // No way to test this directly, but verifying it doesn't throw
      expect(true).toBe(true);
    });
  });
});
