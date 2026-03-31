import type { AuthOptions, User } from 'next-auth';
import type { JWT } from 'next-auth/jwt';
import CredentialsProvider from 'next-auth/providers/credentials';
import { getAuthSettings } from '@/features/auth/config/auth-settings';
import { authenticateWithLdap, isUserActiveByLogin, LdapAuthError } from '@/features/auth/server/ldap';

const authSettings = getAuthSettings();

function isLdapRecheckDue(token: JWT): boolean {
  if (!token.lastLdapValidationAt) {
    return true;
  }

  const nowSeconds = Math.floor(Date.now() / 1000);

  return nowSeconds - token.lastLdapValidationAt >= authSettings.ldapRecheckIntervalSeconds;
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
          return await authenticateWithLdap(credentials);
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
        token.user = user;
        token.error = undefined;
        token.lastLdapValidationAt = nowSeconds;
      }

      if (!token.error && token.user && isLdapRecheckDue(token)) {
        const login = token.user.id;
        try {
          const isActive = login ? await isUserActiveByLogin(login) : false;

          if (isActive) {
            token.lastLdapValidationAt = nowSeconds;
          } else {
            token.user = undefined;
            token.error = 'SessionExpired';
          }
        } catch (error) {
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
  theme: {
    colorScheme: 'auto',  // "auto" | "dark" | "light"
  },
  secret: authSettings.nextAuthSecret,
} satisfies AuthOptions;
