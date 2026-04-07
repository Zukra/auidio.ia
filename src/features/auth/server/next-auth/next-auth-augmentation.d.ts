import type { DefaultSession } from 'next-auth';
import type { AdUser } from '@/features/auth/server/ldap/types';

declare module 'next-auth' {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface User extends AdUser {}

  interface Session {
    user?: DefaultSession['user'] & User;
    error?: string;
    trigger?: string;
    jti?: string;
    exp?: number;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    user?: import('next-auth').User;
    trigger?: string;
    jti?: string;
    lastLdapValidationAt?: number;
    error?: string;
    exp?: number;
  }
}
