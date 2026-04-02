import type { AdUser } from '@/features/auth/server/ldap/types';

export type AuthEventType =
  | 'auth.login'
  | 'auth.logout'
  | 'auth.user_update'
  | 'auth.user_synced';

export type AuthUserSnapshot = Pick<AdUser, 'displayName' | 'mail' | 'department' | 'isActive'>;

export type AuthLoginEvent = {
  type: 'auth.login';
  userId: string;
  occurredAt: string;
  payload: {
    profile: AuthUserSnapshot;
  };
};

export type AuthUserUpdate = {
  type: 'auth.user_update';
  userId: string;
  occurredAt: string;
  payload: {
    profile: AuthUserSnapshot;
    source: 'ldap_recheck';
  };
};

export type AuthLogoutEvent = {
  type: 'auth.logout';
  userId: string;
  occurredAt: string;
  payload: {
    reason: 'manual';
  };
};

export type AuthUserSyncedEvent = {
  type: 'auth.user_synced';
  userId: string;
  occurredAt: string;
  payload: {
    previous: AuthUserSnapshot;
    current: AuthUserSnapshot;
    source: 'signin' | 'ldap_recheck';
  };
};

export type AuthEvent =
  | AuthLoginEvent
  | AuthLogoutEvent
  | AuthUserUpdate
  | AuthUserSyncedEvent;

export type AuthEventPublisher = {
  emit: (event: AuthEvent) => Promise<void>;
};
