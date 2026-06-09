import * as Sentry from '@sentry/react-native';
import { Platform } from 'react-native';
import Logger from '../utils/Logger';

// Event shape consumed by the beforeSend filter (structural subset of
// Sentry's ErrorEvent so it can be unit-tested without the SDK)
type FilterableEvent = {
  exception?: { values?: { value?: string }[] };
};

// Filter out events that aren't useful before sending them to Sentry
export const sentryBeforeSend = <T extends FilterableEvent>(
  event: T
): T | null => {
  const error = event.exception?.values?.[0];
  if (error?.value?.includes('Network request failed')) {
    return null; // Don't send network errors
  }
  return event;
};

// Initialize Sentry for production
export const initializeSentry = () => {
  const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;
  const isProduction = process.env.EXPO_PUBLIC_ENVIRONMENT === 'production';

  if (dsn && isProduction) {
    Sentry.init({
      dsn,
      environment: 'production',
      enableAutoSessionTracking: true,
      tracesSampleRate: 0.1, // Sample 10% of transactions
      // Performance monitoring
      _experiments: {
        // The sampling rate for transactions may be configured this way
        metricsAggregator: true,
      },
      // Only enable Sentry in production
      enabled: true,

      // Customize error grouping
      beforeSend: sentryBeforeSend,
    });

    // Set user context
    Sentry.setUser({
      platform: Platform.OS,
    });

    if (__DEV__) {
      Logger.info('Sentry initialized for production');
    }
  } else if (__DEV__) {
    Logger.info('Sentry disabled in development or missing DSN');
  }
};

// Error boundary wrapper
export const reportError = (error: Error, context?: string) => {
  const isProduction = process.env.EXPO_PUBLIC_ENVIRONMENT === 'production';

  if (isProduction) {
    Sentry.withScope(scope => {
      if (context) {
        scope.setTag('context', context);
      }
      Sentry.captureException(error);
    });
  }

  // Also log to console in development
  if (__DEV__) {
    Logger.error(`[${context || 'App'}] Error:`, error);
  }
};

// Performance tracking
export const trackPerformance = <T>(
  operation: string,
  callback: () => Promise<T>
): Promise<T> => {
  return Sentry.startSpan(
    {
      name: operation,
      op: 'function',
    },
    callback
  );
};
