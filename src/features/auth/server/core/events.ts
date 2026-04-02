import type { User } from 'next-auth';
import type { AuthEvent, AuthUserSnapshot } from '@/features/auth/server/auth-events';
import { getAuthEventPublisher } from '@/features/auth/server/auth-events';

export async function safeEmitAuthEvent(event: AuthEvent): Promise<void> {
  try {
    await getAuthEventPublisher().emit(event);
  } catch (error) {
    console.error('[auth-events] publish failed', { eventType: event.type, userId: event.userId, error });
  }
}

export async function emitLoginEvent(user: User): Promise<void> {
  const profile: AuthUserSnapshot = {
    displayName: user.displayName,
    mail: user.mail,
    department: user.department,
    isActive: user.isActive,
  };

  await safeEmitAuthEvent({
    type: 'auth.login',
    userId: user.id,
    occurredAt: new Date().toISOString(),
    payload: {
      profile,
    },
  });
}

export async function emitUserUpdate(params: {
  userId: string;
  profile: AuthUserSnapshot;
  source: 'ldap_recheck';
}): Promise<void> {

  await safeEmitAuthEvent({
    type: 'auth.user_update',
    userId: params.userId,
    occurredAt: new Date().toISOString(),
    payload: {
      profile: params.profile,
      source: params.source,
    },
  });
}

export async function emitUserSynced(params: {
  userId: string;
  previous: AuthUserSnapshot;
  current: AuthUserSnapshot;
  source: 'signin' | 'ldap_recheck';
}): Promise<void> {
  await safeEmitAuthEvent({
    type: 'auth.user_synced',
    userId: params.userId,
    occurredAt: new Date().toISOString(),
    payload: {
      previous: params.previous,
      current: params.current,
      source: params.source,
    },
  });
}

export async function emitLogoutEvent(userId: string): Promise<void> {
  await safeEmitAuthEvent({
    type: 'auth.logout',
    userId,
    occurredAt: new Date().toISOString(),
    payload: { reason: 'manual' },
  });
}
