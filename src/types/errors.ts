/**
 * Enhanced error types for better error handling across the application
 */

// Base error interface
export interface AppError extends Error {
  readonly code?: string;
  readonly details?: unknown;
  readonly timestamp?: Date;
  readonly context?: string;
}

// Database-specific errors
export interface DatabaseError extends AppError {
  readonly type: 'database';
  readonly operation: 'read' | 'write' | 'connect' | 'migrate';
  readonly table?: string;
}

// Network/API errors
export interface NetworkError extends AppError {
  readonly type: 'network';
  readonly statusCode?: number;
  readonly endpoint?: string;
  readonly method?: string;
}

// Validation errors
export interface ValidationError extends AppError {
  readonly type: 'validation';
  readonly field?: string;
  readonly validationErrors?: string[];
}

// Permission errors
export interface PermissionError extends AppError {
  readonly type: 'permission';
  readonly permission: 'camera' | 'gallery' | 'storage' | 'notifications';
  readonly platform: 'ios' | 'android';
}

// Image handling errors
export interface ImageError extends AppError {
  readonly type: 'image';
  readonly operation: 'capture' | 'pick' | 'save' | 'delete' | 'process';
  readonly uri?: string;
}

// Subscription errors
export interface SubscriptionError extends AppError {
  readonly type: 'subscription';
  readonly operation: 'purchase' | 'restore' | 'validate' | 'initialize';
  readonly productId?: string;
}

// File system errors
export interface FileSystemError extends AppError {
  readonly type: 'filesystem';
  readonly operation: 'read' | 'write' | 'delete' | 'exists';
  readonly path?: string;
}

// Type union for all error types
export type StokkError = 
  | DatabaseError
  | NetworkError
  | ValidationError
  | PermissionError
  | ImageError
  | SubscriptionError
  | FileSystemError;

// Result type for operations that might fail
export type Result<T, E = StokkError> = {
  success: true;
  data: T;
} | {
  success: false;
  error: E;
};

// Utility functions for creating typed errors
export const createDatabaseError = (
  message: string,
  operation: DatabaseError['operation'],
  details?: unknown,
  table?: string
): DatabaseError => ({
  name: 'DatabaseError',
  type: 'database',
  operation,
  table,
  message,
  details,
  timestamp: new Date(),
  context: 'database',
});

export const createNetworkError = (
  message: string,
  statusCode?: number,
  endpoint?: string,
  method?: string
): NetworkError => ({
  name: 'NetworkError',
  type: 'network',
  statusCode,
  endpoint,
  method,
  message,
  timestamp: new Date(),
  context: 'network',
});

export const createValidationError = (
  message: string,
  field?: string,
  validationErrors?: string[]
): ValidationError => ({
  name: 'ValidationError',
  type: 'validation',
  field,
  validationErrors,
  message,
  timestamp: new Date(),
  context: 'validation',
});

export const createPermissionError = (
  message: string,
  permission: PermissionError['permission'],
  platform: PermissionError['platform']
): PermissionError => ({
  name: 'PermissionError',
  type: 'permission',
  permission,
  platform,
  message,
  timestamp: new Date(),
  context: 'permission',
});

export const createImageError = (
  message: string,
  operation: ImageError['operation'],
  uri?: string
): ImageError => ({
  name: 'ImageError',
  type: 'image',
  operation,
  uri,
  message,
  timestamp: new Date(),
  context: 'image',
});

export const createSubscriptionError = (
  message: string,
  operation: SubscriptionError['operation'],
  productId?: string
): SubscriptionError => ({
  name: 'SubscriptionError',
  type: 'subscription',
  operation,
  productId,
  message,
  timestamp: new Date(),
  context: 'subscription',
});

export const createFileSystemError = (
  message: string,
  operation: FileSystemError['operation'],
  path?: string
): FileSystemError => ({
  name: 'FileSystemError',
  type: 'filesystem',
  operation,
  path,
  message,
  timestamp: new Date(),
  context: 'filesystem',
});

// Type guard functions
export const isDatabaseError = (error: unknown): error is DatabaseError => {
  return error instanceof Error && (error as DatabaseError).type === 'database';
};

export const isNetworkError = (error: unknown): error is NetworkError => {
  return error instanceof Error && (error as NetworkError).type === 'network';
};

export const isValidationError = (error: unknown): error is ValidationError => {
  return error instanceof Error && (error as ValidationError).type === 'validation';
};

export const isPermissionError = (error: unknown): error is PermissionError => {
  return error instanceof Error && (error as PermissionError).type === 'permission';
};

export const isImageError = (error: unknown): error is ImageError => {
  return error instanceof Error && (error as ImageError).type === 'image';
};

export const isSubscriptionError = (error: unknown): error is SubscriptionError => {
  return error instanceof Error && (error as SubscriptionError).type === 'subscription';
};

export const isFileSystemError = (error: unknown): error is FileSystemError => {
  return error instanceof Error && (error as FileSystemError).type === 'filesystem';
};

// Utility function to wrap operations with proper error handling
export async function withErrorHandling<T, E = StokkError>(
  operation: () => Promise<T>,
  errorFactory: (error: unknown) => E
): Promise<Result<T, E>> {
  try {
    const data = await operation();
    return { success: true, data };
  } catch (error) {
    const typedError = errorFactory(error);
    return { success: false, error: typedError };
  }
}

// Synchronous version of withErrorHandling
export function withErrorHandlingSync<T, E = StokkError>(
  operation: () => T,
  errorFactory: (error: unknown) => E
): Result<T, E> {
  try {
    const data = operation();
    return { success: true, data };
  } catch (error) {
    const typedError = errorFactory(error);
    return { success: false, error: typedError };
  }
}