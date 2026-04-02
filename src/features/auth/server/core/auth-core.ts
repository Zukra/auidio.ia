import type { Session, User } from 'next-auth';
import type { JWT } from 'next-auth/jwt';
import { LdapAuthError, authenticateLdap, getLdapUserByLogin } from '@/features/auth/server/ldap';
import type { AuthUserSnapshot } from '@/features/auth/server/auth-events';
import { emitLoginEvent, emitLogoutEvent, emitUserSynced, emitUserUpdate } from '@/features/auth/server/core/events';
import { isUserSyncedSnapshotChanged } from '@/features/auth/server/core/profile';
import type { SessionErrorCode } from '@/features/auth/server/core/types';

type SignOutMessage = {
  token?: { user?: { id?: string } };
  session?: { user?: { id?: string } };
};

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

export async function applySignInToToken(params: {
  token: JWT;
  user: User;
  nowSeconds: number;
}): Promise<JWT> {
  const { token, user, nowSeconds } = params;

  await emitLoginEvent(user);

  token.user = user;
  token.error = undefined;
  token.lastLdapValidationAt = nowSeconds;

  return token;
}

function mapRecheckErrorCode(error: unknown): SessionErrorCode {
  if (error instanceof LdapAuthError && error.code === 'LDAP_CONFIG_ERROR') {
    return 'LDAP_CONFIG_ERROR';
  }

  return 'SessionExpired';
}

export async function applyLdapRecheckToToken(params: { token: JWT; nowSeconds: number; }): Promise<JWT> {
  const { token, nowSeconds } = params;

  if (!token.user) {
    return token;
  }

  try {
    const ldapUser = await getLdapUserByLogin(token.user.id);
    const previousSnapshot: AuthUserSnapshot = {
      displayName: token.user.displayName,
      mail: token.user.mail,
      department: token.user.department,
      isActive: token.user.isActive,
    };
    const currentSnapshot: AuthUserSnapshot = {
      displayName: ldapUser.displayName,
      mail: ldapUser.mail,
      department: ldapUser.department,
      isActive: ldapUser.isActive,
    };

    // TODO compare & update user data
    if (isUserSyncedSnapshotChanged(previousSnapshot, currentSnapshot)) {
      await emitUserSynced({
        userId: token.user.id,
        previous: previousSnapshot,
        current: currentSnapshot,
        source: 'ldap_recheck',
      });
    }

    if (ldapUser.isActive) {
      token.user = ldapUser;
      token.lastLdapValidationAt = nowSeconds;
    } else {
      token.user = undefined;
      token.error = 'SessionExpired';
    }

    return token;
  } catch (error) {
    const isInactiveError = error instanceof LdapAuthError
      && (error.code === 'LDAP_ACCOUNT_NOT_ACTIVE' || error.code === 'LDAP_USER_NOT_FOUND');

    if (isInactiveError && token.user) {
      const currentSnapshot: AuthUserSnapshot = {
        displayName: token.user.displayName,
        mail: token.user.mail,
        department: token.user.department,
        isActive: false,
      };

      await emitUserUpdate({
        userId: token.user.id,
        profile: currentSnapshot,
        source: 'ldap_recheck',
      });
    }

    token.user = undefined;
    token.error = mapRecheckErrorCode(error);

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

  await emitLogoutEvent(userId);
}
