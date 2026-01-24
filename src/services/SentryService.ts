import * as Sentry from '@sentry/react-native';
import { Platform } from 'react-native';

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
      beforeSend(event) {
        // Filter out certain errors that aren't useful
        if (event.exception) {
          const error = event.exception.values?.[0];
          if (error?.value?.includes('Network request failed')) {
            return null; // Don't send network errors
          }
        }
        return event;
      },
    });

    // Set user context
    Sentry.setUser({
      platform: Platform.OS,
    });

    if (__DEV__) {
      console.log('Sentry initialized for production');
    }
  } else if (__DEV__) {
    console.log('Sentry disabled in development or missing DSN');
  }
};

// Error boundary wrapper
export const reportError = (error: Error, context?: string) => {
  const isProduction = process.env.EXPO_PUBLIC_ENVIRONMENT === 'production';
  
  if (isProduction) {
    Sentry.withScope((scope) => {
      if (context) {
        scope.setTag('context', context);
      }
      Sentry.captureException(error);
    });
  }
  
  // Also log to console in development
  if (__DEV__) {
    console.error(`[${context || 'App'}] Error:`, error);
  }
};

// Performance tracking
export const trackPerformance = (operation: string, callback: () => Promise<any>) => {
  return Sentry.startSpan(
    {
      name: operation,
      op: 'function',
    },
    callback
  );
};