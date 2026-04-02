export { authConfig } from '@/features/auth/server/next-auth/auth.config';
export { auth } from '@/features/auth/server/next-auth/server';
export type { SessionErrorCode } from '@/features/auth/server/core';
export {
  ConsoleAuthEventPublisher,
  getAuthEventPublisher,
  NoopAuthEventPublisher,
  setAuthEventPublisher,
} from '@/features/auth/server/auth-events';
export type { AuthEvent, AuthEventPublisher, AuthEventType } from '@/features/auth/server/auth-events';
