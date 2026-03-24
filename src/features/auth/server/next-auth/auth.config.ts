import type { AuthOptions, User } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { authenticateWithLdap, LdapAuthError } from '@/features/auth/server/ldap';

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

          throw new Error('LDAP_AUTH_FAILED');
        }
      },
    }),
  ],
  session: { strategy: 'jwt', maxAge: 60 * 60 * 2 },
  jwt: { maxAge: 60 * 60 * 24 * 30 },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/signin',
  },
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.user = user;
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
        token: token,
      };
    },
  },
  theme: {
    colorScheme: 'auto',  // "auto" | "dark" | "light"
  },
  secret: process.env.NEXTAUTH_SECRET,
} satisfies AuthOptions;
