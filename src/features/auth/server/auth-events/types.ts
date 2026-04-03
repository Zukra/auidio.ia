import type { AdUser } from '@/features/auth/server/ldap/types';

export type AuthUserSnapshot = Pick<AdUser, 'displayName' | 'mail' | 'department' | 'isActive'>;

export type AuthEventType = 'auth.login' | 'auth.logout' | 'auth.user_update';

export type AuthEvent = {
  type: AuthEventType;
  userId: string;
  occurredAt: string;
  payload: Record<string, unknown>;
};

export type AuthEventPublisher = {
  emit: (event: AuthEvent) => Promise<void>;
};
