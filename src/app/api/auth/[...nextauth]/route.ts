import NextAuth from 'next-auth';
import { authConfig } from '@/auth';

const handlers = NextAuth(authConfig);

export { handlers as GET, handlers as POST };