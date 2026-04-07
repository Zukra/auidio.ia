import NextAuth from 'next-auth';
import { authConfig, setAuthEventPublisher } from '@/features/auth/index.server';
import { PrismaAuthEventPublisher } from '@/server/auth-events/prisma-auth-event-publisher';

// setAuthEventPublisher(process.env.NODE_ENV === 'production' ? new PrismaAuthEventPublisher() : new ConsoleAuthEventPublisher());
setAuthEventPublisher(new PrismaAuthEventPublisher());

const handler = NextAuth(authConfig);

export { handler as GET, handler as POST };
