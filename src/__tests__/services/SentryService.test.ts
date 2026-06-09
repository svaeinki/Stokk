import * as Sentry from '@sentry/react-native';
import {
  initializeSentry,
  reportError,
  trackPerformance,
  sentryBeforeSend,
} from '../../services/SentryService';

jest.mock('@sentry/react-native', () => ({
  init: jest.fn(),
  setUser: jest.fn(),
  captureException: jest.fn(),
  withScope: jest.fn((callback: (scope: unknown) => void) =>
    callback({ setTag: jest.fn() })
  ),
  startSpan: jest.fn((_options: unknown, callback: () => unknown) =>
    callback()
  ),
}));

// Note: EXPO_PUBLIC_* vars are snapshotted by babel-preset-expo at module
// load, so these tests run against the test environment (no DSN, not
// production) defined in jest.env.js.

describe('SentryService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('initializeSentry', () => {
    it('should not initialize outside production or without a DSN', () => {
      initializeSentry();

      expect(Sentry.init).not.toHaveBeenCalled();
      expect(Sentry.setUser).not.toHaveBeenCalled();
    });
  });

  describe('sentryBeforeSend', () => {
    it('should drop network errors', () => {
      const networkEvent = {
        exception: { values: [{ value: 'Network request failed' }] },
      };

      expect(sentryBeforeSend(networkEvent)).toBeNull();
    });

    it('should keep other error events', () => {
      const event = {
        exception: { values: [{ value: 'Something broke' }] },
      };

      expect(sentryBeforeSend(event)).toBe(event);
    });

    it('should keep events without exception data', () => {
      const event = {};

      expect(sentryBeforeSend(event)).toBe(event);
    });
  });

  describe('reportError', () => {
    it('should not send to Sentry outside production', () => {
      reportError(new Error('boom'), 'TestContext');

      expect(Sentry.captureException).not.toHaveBeenCalled();
    });
  });

  describe('trackPerformance', () => {
    it('should run the callback inside a span and return its result', async () => {
      const result = await trackPerformance('test-op', async () => 42);

      expect(result).toBe(42);
      expect(Sentry.startSpan).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'test-op' }),
        expect.any(Function)
      );
    });
  });
});
