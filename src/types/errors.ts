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
