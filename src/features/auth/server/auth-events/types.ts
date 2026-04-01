export type AuthEventType =
  | 'auth.login'
  | 'auth.logout'
  | 'auth.user_synced';

export type AuthProfilePayload = {
  displayName: string | null;
  mail: string | null;
  department: string | null;
  isActive: boolean;
};

export type AuthLoginEvent = {
  type: 'auth.login';
  userId: string;
  occurredAt: string;
  payload: {
    profile: AuthProfilePayload;
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

export type AuthUserSyncedSnapshot = AuthProfilePayload;

export type AuthUserSyncedEvent = {
  type: 'auth.user_synced';
  userId: string;
  occurredAt: string;
  payload: {
    previous: AuthUserSyncedSnapshot;
    current: AuthUserSyncedSnapshot;
    changedFields: Array<'displayName' | 'mail' | 'department' | 'isActive'>;
    source: 'signin' | 'ldap_recheck';
  };
};

export type AuthEvent =
  | AuthLoginEvent
  | AuthLogoutEvent
  | AuthUserSyncedEvent;

export type AuthEventPublisher = {
  emit: (event: AuthEvent) => Promise<void>;
};
