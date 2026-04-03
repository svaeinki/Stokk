/**
 * Logger centralizado para la aplicación.
 * En producción (__DEV__ = false), los logs se silencian automáticamente.
 */

import { StokkError } from '../types/errors';

const isDev = __DEV__;

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LoggerConfig {
  enabled: boolean;
  minLevel: LogLevel;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const config: LoggerConfig = {
  enabled: isDev,
  minLevel: isDev ? 'debug' : 'error',
};

const shouldLog = (level: LogLevel): boolean => {
  if (!config.enabled) return false;
  return LOG_LEVELS[level] >= LOG_LEVELS[config.minLevel];
};

const formatMessage = (
  level: LogLevel,
  message: string,
  error?: StokkError
): string => {
  const timestamp = new Date().toISOString().slice(11, 19);
  const prefix = {
    debug: '🔍',
    info: 'ℹ️',
    warn: '⚠️',
    error: '❌',
  }[level];

  let formattedMessage = `${prefix} [${timestamp}] ${message}`;

  if (error) {
    formattedMessage += ` [${error.type || 'Unknown'}]`;
    if (error.code) {
      formattedMessage += ` (${error.code})`;
    }
    if (error.context) {
      formattedMessage += ` Context: ${error.context}`;
    }
  }

  return formattedMessage;
};

const formatErrorObject = (error: StokkError | unknown): unknown => {
  if (!error) return undefined;

  if (error instanceof Error && 'type' in error) {
    const typedError = error as StokkError;
    return {
      name: typedError.name,
      message: typedError.message,
      type: typedError.type,
      code: typedError.code,
      context: typedError.context,
      timestamp: typedError.timestamp,
      details: typedError.details,
    };
  }

  return error;
};

export const Logger = {
  debug: (message: string, ...args: unknown[]) => {
    if (shouldLog('debug')) {
      console.log(formatMessage('debug', message), ...args);
    }
  },

  info: (message: string, ...args: unknown[]) => {
    if (shouldLog('info')) {
      console.log(formatMessage('info', message), ...args);
    }
  },

  warn: (message: string, ...args: unknown[]) => {
    if (shouldLog('warn')) {
      console.warn(formatMessage('warn', message), ...args);
    }
  },

  error: (
    message: string,
    error?: StokkError | unknown,
    ...args: unknown[]
  ) => {
    if (shouldLog('error')) {
      const stokkError =
        error instanceof Error && 'type' in error
          ? (error as StokkError)
          : undefined;
      console.error(
        formatMessage('error', message, stokkError),
        formatErrorObject(error),
        ...args
      );
    }
  },

  // Specialized logging methods for different error types
  databaseError: (message: string, error: StokkError | unknown) => {
    Logger.error(`[DATABASE] ${message}`, error);
  },

  networkError: (message: string, error: StokkError | unknown) => {
    Logger.error(`[NETWORK] ${message}`, error);
  },

  validationError: (message: string, error: StokkError | unknown) => {
    Logger.warn(`[VALIDATION] ${message}`, error);
  },

  permissionError: (message: string, error: StokkError | unknown) => {
    Logger.warn(`[PERMISSION] ${message}`, error);
  },

  imageError: (message: string, error: StokkError | unknown) => {
    Logger.error(`[IMAGE] ${message}`, error);
  },

  subscriptionError: (message: string, error: StokkError | unknown) => {
    Logger.error(`[SUBSCRIPTION] ${message}`, error);
  },

  fileSystemError: (message: string, error: StokkError | unknown) => {
    Logger.error(`[FILESYSTEM] ${message}`, error);
  },

  // Para configuración dinámica si es necesario
  setEnabled: (enabled: boolean) => {
    config.enabled = enabled;
  },

  setMinLevel: (level: LogLevel) => {
    config.minLevel = level;
  },
};

export default Logger;
