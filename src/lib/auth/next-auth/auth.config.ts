import type { AuthOptions, User } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { authenticateWithLdap } from '@/lib/auth/ldap';

export const authConfig = {
  providers: [
    CredentialsProvider({
      name: 'LDAP',
      credentials: {
        username: { label: 'DN', type: 'text', placeholder: '' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials): Promise<User | null> {
        return authenticateWithLdap(credentials);
      },
    }),
  ],
  session: { strategy: 'jwt', maxAge: 60 * 60 * 2 },
  jwt: { maxAge: 60 * 60 * 24 * 30 },
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
