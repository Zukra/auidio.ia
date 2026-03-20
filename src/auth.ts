import type { AuthOptions, User } from 'next-auth';
import 'next-auth/jwt';
import { Client } from 'ldapts';

import CredentialsProvider from 'next-auth/providers/credentials';

type AdUser = {
  dn: string;
  cn: string;
  title: string;
  displayName: string;
  objectGUID: string;
  sAMAccountName: string;
  mail: string;
  employeeType: string | [];
  department: string | [];
  memberOf: Array<string | null>;
  manager: string | [];
  isDisabled: boolean | null;
};

export const authConfig: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'LDAP',
      credentials: {
        username: { label: 'DN', type: 'text', placeholder: '' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials, req): Promise<User | null> {
        if (!credentials) {
          return null;
        }

        /* credentials.username = process.env.AUTH_LDAP_SERVICE_USER!
          .replace(/\\\\/g, '\\')
          .replace(/\r?\n/g, '\\n').replace(/\t/g, '\\t');
        credentials.password = process.env.AUTH_LDAP_SERVICE_PASS as string; */

        if (!credentials?.username || !credentials?.password) {
          return null;
        }

        const client = new Client({
          url: process.env.AUTH_LDAP_SERVER_URI as string,
          timeout: 10000,
          connectTimeout: 10000,
          strictDN: true,
        });

        try {
          await client.bind(credentials.username, credentials.password);

          // TODO
          const login = normalizeLogin(credentials.username);
          // const login = 'D.Veremko';

          const { searchEntries } = await client.search(process.env.AUTH_LDAP_BASE_DN as string, {
            scope: 'sub',
            filter: `(&(objectClass=person)(sAMAccountName=${login}))`,
            sizeLimit: 1,
            timeLimit: 10,
            attributes: [
              'cn', 'employeeType', 'sAMAccountName', 'displayName', 'mail',
              'department', 'title', 'memberOf', 'objectGUID', 'manager',
            ],
          });

          if (!searchEntries.length) {
            console.log('Пользователь не найден');

            return null;
          } else {
            const user = searchEntries[0] as unknown as AdUser;
            user.isDisabled = isAccountDisabled(user);

            return user.isDisabled ? null : { id: user.sAMAccountName, ...user };
          }
        } catch (err) {
          console.error('LDAP authentication failed:', err);
          return null;
        } finally {
          try {
            await client.unbind();
          } catch (unbindErr) {
            // Игнорируем ошибки unbind
          }
        }
      },
    }),
  ],
  // basePath: '/auth',
  session: { strategy: 'jwt', maxAge: 60 * 60 * 2 },
  jwt: { maxAge: 60 * 60 * 24 * 30 },
  callbacks: {
    /* authorized({ request, token, auth }) {
      const { pathname } = request.nextUrl;
      if (pathname === '/middleware-example') return !!auth;

      return true;
    }, */
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
        user: {
          ...token.user,
          // ...session.user,
          // username: token.username,
          // name: session.user?.name ?? token.username,
        },
        token: token,
      };
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  // experimental: { enableWebAuthn: true },
};

// export const { handlers, auth, signIn, signOut } = NextAuth();

declare module 'next-auth' {
  interface Session {
    accessToken?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    accessToken?: string;
  }
}

function isAccountDisabled(user: AdUser): boolean {
  return user.dn.toUpperCase().includes('OU=DISABLED USERS'.toUpperCase());
}

function normalizeLogin(raw: string): string {
  const value = raw.trim();

  // DOMAIN\user -> user
  if (value.includes('\\')) {
    return value.split('\\').pop()!.trim().toLowerCase();
  }

  // user@domain -> user
  if (value.includes('@')) {
    return value.split('@')[0]!.trim().toLowerCase();
  }

  return value.toLowerCase();
}
