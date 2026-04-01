import NextAuth from 'next-auth';
import { authConfig, ConsoleAuthEventPublisher, setAuthEventPublisher } from '@/features/auth/index.server';

setAuthEventPublisher(new ConsoleAuthEventPublisher());

const handler = NextAuth(authConfig);

export { handler as GET, handler as POST };
