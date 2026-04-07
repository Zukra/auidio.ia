import type { Session, User } from 'next-auth';
import type { JWT } from 'next-auth/jwt';
import { LdapAuthError, authenticateLdap, getLdapUserByLogin } from '@/features/auth/server/ldap';
import type { LdapAuthErrorCode } from '@/features/auth/server/ldap';
import { getAuthEventPublisher } from '@/features/auth/server/auth-events';
import type { AuthEvent, AuthUserSnapshot } from '@/features/auth/server/auth-events';
import { isUserSyncedSnapshotChanged } from '@/features/auth/server/core/profile';

type SignOutMessage = {
  token?: { user?: { id?: string } };
  session?: { user?: { id?: string } };
};

function resolveLdapErrorCode(error: unknown): LdapAuthErrorCode {
  if (error instanceof LdapAuthError) {
    return error.code;
  }

  return 'SessionExpired';
}

function resolvePublishErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

function applyPublishErrorToToken(token: JWT, error: unknown): JWT {
  token.user = undefined;
  token.error = resolvePublishErrorMessage(error);
  token.lastLdapValidationAt = undefined;

  return token;
}

async function emitAuthEvent(event: AuthEvent): Promise<void> {
  try {
    await getAuthEventPublisher().emit(event);

    return;
  } catch (error) {
    console.error('[auth-events] publish failed', { eventType: event.type, userId: event.userId, error });

    throw error;
  }
}

function toAuthUserSnapshot(user: User): AuthUserSnapshot {
  return {
    displayName: user.displayName,
    cn: user.cn,
    mail: user.mail,
    isActive: user.isActive,
  };
}

export function isLdapRecheckDue(token: JWT, recheckIntervalSeconds: number): boolean {
  if (!token.lastLdapValidationAt) {
    return true;
  }

  const nowSeconds = Math.floor(Date.now() / 1000);

  return nowSeconds - token.lastLdapValidationAt >= recheckIntervalSeconds;
}

export async function handleAuthorize(credentials: { username?: string; password?: string } | undefined): Promise<User | null> {
  try {
    return await authenticateLdap(credentials);
  } catch (error) {
    if (error instanceof LdapAuthError) {
      throw new Error(error.code);
    }

    if (error instanceof Error) {
      throw error;
    }

    throw new Error('LDAP_AUTH_FAILED');
  }
}

export async function applySignInToToken({ token, user, nowSeconds }: { token: JWT; user: User; nowSeconds: number; }): Promise<JWT> {
  const profile = toAuthUserSnapshot(user);

  try {
    await emitAuthEvent({
      type: 'auth.login',
      userId: user.id,
      occurredAt: new Date().toISOString(),
      payload: { profile },
    });
  } catch (error) {
    return applyPublishErrorToToken(token, error);
  }

  token.user = user;
  token.error = undefined;
  token.lastLdapValidationAt = nowSeconds;

  return token;
}

export async function applyLdapRecheckToToken(params: { token: JWT; nowSeconds: number; }): Promise<JWT> {
  const { token, nowSeconds } = params;

  if (!token.user) {
    return token;
  }

  try {
    const ldapUser = await getLdapUserByLogin(token.user.id);
    const previousSnapshot = toAuthUserSnapshot(token.user);
    const currentSnapshot = toAuthUserSnapshot(ldapUser);

    if (isUserSyncedSnapshotChanged(previousSnapshot, currentSnapshot)) {
      try {
        await emitAuthEvent({
          type: 'auth.user_update',
          userId: token.user.id,
          occurredAt: new Date().toISOString(),
          payload: {
            profile: currentSnapshot,
            source: 'ldap_recheck',
          },
        });
      } catch (error) {
        return applyPublishErrorToToken(token, error);
      }
    }

    if (!ldapUser.isActive) {
      token.user = undefined;
      token.error = resolveLdapErrorCode(new LdapAuthError('LDAP_ACCOUNT_NOT_ACTIVE'));
    } else {
      token.user = ldapUser;
      token.lastLdapValidationAt = nowSeconds;
    }

    return token;
  } catch (error) {
    // TODO убрать проверку на конкретную ошибку и обрывать сессию на любую ошибку?
    const isUserNotFoundError = error instanceof LdapAuthError
      && error.code === 'LDAP_USER_NOT_FOUND';

    if (isUserNotFoundError) {
      if (token.user) {
        const currentSnapshot: AuthUserSnapshot = {
          ...toAuthUserSnapshot(token.user),
          isActive: false,
        };

        try {
          await emitAuthEvent({
            type: 'auth.user_update',
            userId: token.user.id,
            occurredAt: new Date().toISOString(),
            payload: {
              profile: currentSnapshot,
              source: 'ldap_recheck',
            },
          });
        } catch (publishError) {
          token.error = resolvePublishErrorMessage(publishError);
        }
      }
    }

    token.user = undefined;
    token.error = resolveLdapErrorCode(error);

    return token;
  }
}

export function buildSession(session: Session, token: JWT): Session {
  return {
    ...session,
    user: token.user,
    error: token.error,
    ...{ exp: token.exp, jti: token.jti, trigger: token.trigger },
  };
}

export async function handleSignOutEvent(message: SignOutMessage): Promise<void> {
  const userId = message.token?.user?.id ?? message.session?.user?.id;

  if (!userId) {
    return;
  }

  await emitAuthEvent({
    type: 'auth.logout',
    userId,
    occurredAt: new Date().toISOString(),
    payload: { reason: 'manual' },
  });
}
