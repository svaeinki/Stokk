/**
 * Logger centralizado para la aplicación.
 * En producción (__DEV__ = false), los logs se silencian automáticamente.
 */

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

const formatMessage = (level: LogLevel, message: string): string => {
  const timestamp = new Date().toISOString().slice(11, 19);
  const prefix = {
    debug: '🔍',
    info: 'ℹ️',
    warn: '⚠️',
    error: '❌',
  }[level];
  return `${prefix} [${timestamp}] ${message}`;
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

  error: (message: string, ...args: unknown[]) => {
    if (shouldLog('error')) {
      console.error(formatMessage('error', message), ...args);
    }
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
