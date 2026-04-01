import type { AuthOptions, User } from 'next-auth';
import type { JWT } from 'next-auth/jwt';
import CredentialsProvider from 'next-auth/providers/credentials';
import { getAuthSettings } from '@/features/auth/config/auth-settings';
import { getAuthEventPublisher } from '@/features/auth/server/auth-events';
import { authenticateLdap, getLdapUserByLogin, LdapAuthError } from '@/features/auth/server/ldap';
import type { AuthEvent, AuthProfilePayload, AuthUserSyncedSnapshot } from '@/features/auth/server/auth-events';

const authSettings = getAuthSettings();

function isLdapRecheckDue(token: JWT): boolean {
  if (!token.lastLdapValidationAt) {
    return true;
  }

  const nowSeconds = Math.floor(Date.now() / 1000);

  return nowSeconds - token.lastLdapValidationAt >= authSettings.ldapRecheckIntervalSeconds;
}

function normalizeProfileValue(value: string | [] | null | undefined): string | null {
  if (Array.isArray(value)) {
    return null;
  }

  const normalized = value?.trim();

  return normalized || null;
}

function mapUserProfile(user: User, isActive: boolean): AuthProfilePayload {
  return {
    displayName: normalizeProfileValue(user.displayName),
    mail: normalizeProfileValue(user.mail),
    department: normalizeProfileValue(user.department),
    isActive,
  };
}

function mapUserSyncedSnapshot(user: User, isActive: boolean): AuthUserSyncedSnapshot {
  return mapUserProfile(user, isActive);
}

function mapTokenSnapshot(token: JWT): AuthUserSyncedSnapshot | null {
  if (!token.user || typeof token.lastKnownLdapActive !== 'boolean') {
    return null;
  }

  return mapUserSyncedSnapshot(token.user, token.lastKnownLdapActive);
}

function getUserSyncedChangedFields(
  previous: AuthUserSyncedSnapshot,
  current: AuthUserSyncedSnapshot,
): Array<'displayName' | 'mail' | 'department' | 'isActive'> {
  const changedFields: Array<'displayName' | 'mail' | 'department' | 'isActive'> = [];

  if (previous.displayName !== current.displayName) {
    changedFields.push('displayName');
  }

  if (previous.mail !== current.mail) {
    changedFields.push('mail');
  }

  if (previous.department !== current.department) {
    changedFields.push('department');
  }

  if (previous.isActive !== current.isActive) {
    changedFields.push('isActive');
  }

  return changedFields;
}

async function safeEmitAuthEvent(event: AuthEvent): Promise<void> {
  try {
    await getAuthEventPublisher().emit(event);
  } catch (error) {
    console.error('[auth-events] publish failed', { eventType: event.type, userId: event.userId, error });
  }
}

async function emitUserSyncedIfChanged(params: {
  userId: string;
  previous: AuthUserSyncedSnapshot | null;
  current: AuthUserSyncedSnapshot;
  source: 'signin' | 'ldap_recheck';
}): Promise<void> {
  const previousSnapshot = params.previous;
  if (!previousSnapshot) {
    return;
  }

  const changedFields = getUserSyncedChangedFields(previousSnapshot, params.current);
  if (changedFields.length === 0) {
    return;
  }

  await safeEmitAuthEvent({
    type: 'auth.user_synced',
    userId: params.userId,
    occurredAt: new Date().toISOString(),
    payload: {
      previous: previousSnapshot,
      current: params.current,
      changedFields,
      source: params.source,
    },
  });
}

export const authConfig = {
  providers: [
    CredentialsProvider({
      name: 'LDAP',
      credentials: {
        username: { label: 'DN', type: 'text', placeholder: '' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials): Promise<User | null> {
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
      },
    }),
  ],
  session: { strategy: 'jwt', maxAge: authSettings.sessionMaxAgeSeconds },
  jwt: { maxAge: authSettings.jwtMaxAgeSeconds },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/signin',
  },
  callbacks: {
    async jwt({ token, user, trigger }) {
      const nowSeconds = Math.floor(Date.now() / 1000);

      if (user) {
        const occurredAt = new Date().toISOString();
        const currentIsActive = !user.isDisabled;
        const currentProfile = mapUserProfile(user, currentIsActive);
        const currentSnapshot = mapUserSyncedSnapshot(user, currentIsActive);

        await safeEmitAuthEvent({
          type: 'auth.login',
          userId: user.id,
          occurredAt,
          payload: { profile: currentProfile },
        });

        token.user = user;
        token.error = undefined;
        token.lastLdapValidationAt = nowSeconds;
        token.lastKnownLdapActive = currentSnapshot.isActive;
      }

      if (!token.error && token.user && isLdapRecheckDue(token)) {
        const login = token.user.id;
        try {
          const previousSnapshot = mapTokenSnapshot(token);
          const ldapUser = await getLdapUserByLogin(login);
          const isActive = !ldapUser.isDisabled;
          const currentSnapshot = mapUserSyncedSnapshot(ldapUser, isActive);

          await emitUserSyncedIfChanged({
            userId: login,
            previous: previousSnapshot,
            current: currentSnapshot,
            source: 'ldap_recheck',
          });

          if (isActive) {
            token.user = ldapUser;
            token.lastLdapValidationAt = nowSeconds;
            token.lastKnownLdapActive = true;
          } else {
            token.lastKnownLdapActive = false;
            token.user = undefined;
            token.error = 'SessionExpired';
          }
        } catch (error) {
          const previousSnapshot = mapTokenSnapshot(token);
          const isInactiveError = error instanceof LdapAuthError
            && (error.code === 'LDAP_ACCOUNT_DISABLED' || error.code === 'LDAP_USER_NOT_FOUND');

          if (isInactiveError && token.user) {
            await emitUserSyncedIfChanged({
              userId: token.user.id,
              previous: previousSnapshot,
              current: mapUserSyncedSnapshot(token.user, false),
              source: 'ldap_recheck',
            });
          }

          token.lastKnownLdapActive = undefined;
          token.user = undefined;
          token.error = error instanceof LdapAuthError && error.code === 'LDAP_CONFIG_ERROR'
            ? 'LDAP_CONFIG_ERROR'
            : 'SessionExpired';
        }
      }

      if (trigger) {
        token.trigger = trigger;
      }

      return token;
    },
    async session({ session, token }) {
      return {
        ...session,
        user: token.user,
        error: token.error,
        ...{ exp: token.exp, jti: token.jti, trigger: token.trigger },
      };
    },
  },
  events: {
    async signOut(message) {
      const userId = message.token?.user?.id ?? message.session?.user?.id;

      if (!userId) {
        return;
      }

      await safeEmitAuthEvent({
        type: 'auth.logout',
        userId,
        occurredAt: new Date().toISOString(),
        payload: { reason: 'manual' },
      });
    },
  },
  theme: {
    colorScheme: 'auto', // "auto" | "dark" | "light"
  },
  secret: authSettings.nextAuthSecret,
} satisfies AuthOptions;
