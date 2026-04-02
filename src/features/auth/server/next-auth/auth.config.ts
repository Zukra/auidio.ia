import type { AuthOptions, User } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { getAuthSettings } from '@/features/auth/config/auth-settings';
import {
  applyLdapRecheckToToken,
  applySignInToToken,
  buildSession,
  handleAuthorize,
  handleSignOutEvent,
  isLdapRecheckDue,
} from '@/features/auth/server/core';

const authSettings = getAuthSettings();

export const authConfig = {
  providers: [
    CredentialsProvider({
      name: 'LDAP',
      credentials: {
        username: { label: 'DN', type: 'text', placeholder: '' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials): Promise<User | null> {
        return handleAuthorize(credentials);
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
        token = await applySignInToToken({ token, user, nowSeconds });
      }

      if (!token.error && token.user && isLdapRecheckDue(token, authSettings.ldapRecheckIntervalSeconds)) {
        token = await applyLdapRecheckToToken({ token, nowSeconds });
      }

      if (trigger) {
        token.trigger = trigger;
      }

      return token;
    },
    async session({ session, token }) {
      return buildSession(session, token);
    },
  },
  events: {
    async signOut(message) {
      await handleSignOutEvent(message);
    },
  },
  theme: {
    colorScheme: 'auto', // "auto" | "dark" | "light"
  },
  secret: authSettings.nextAuthSecret,
} satisfies AuthOptions;
