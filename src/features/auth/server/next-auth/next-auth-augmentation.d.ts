import type { DefaultSession } from 'next-auth';
import type { JWT as DefaultJWT } from 'next-auth/jwt';

declare module 'next-auth' {
  interface User {
    cn?: string;
    department?: string | [];
  }

  interface Session {
    user?: DefaultSession['user'] & {
      cn?: string;
      department?: string | [];
    };
    token?: DefaultJWT;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    user?: import('next-auth').User;
    trigger?: string;
    jti?: string;
  }
}
