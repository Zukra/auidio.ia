'use client';

import { useEffect } from 'react';
import { SessionProvider, signOut, useSession } from 'next-auth/react';
import type { Session } from 'next-auth';
import type { ReactNode } from 'react';
import { DEFAULT_SESSION_KEEP_ALIVE_SECONDS } from '@/features/auth/config/constants';

type SessionProviderClientProps = {
  children: ReactNode;
  session?: Session | null;
};

function SessionErrorHandler() {
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === 'authenticated' && session?.error) {
      void signOut({ callbackUrl: `/auth/signin?error=${encodeURIComponent(session.error)}` });
    }
  }, [session?.error, status]);
  return null;
}

function SessionKeepAlive() {
  const { status, update } = useSession();

  useEffect(() => {
    if (status !== 'authenticated') {
      return;
    }

    let timeoutId: number | undefined;
    let isCancelled = false;

    const scheduleNext = () => {
      timeoutId = window.setTimeout(async () => {
        await update();

        if (!isCancelled) {
          scheduleNext();
        }
      }, DEFAULT_SESSION_KEEP_ALIVE_SECONDS * 1000);
    };

    scheduleNext();

    return () => {
      isCancelled = true;

      if (timeoutId !== undefined) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [status, update]);

  return null;
}

export function SessionProviderClient({ children, session }: SessionProviderClientProps) {
  return (
    <SessionProvider
      session={session}
      refetchOnWindowFocus
      refetchInterval={0}
    >
      <SessionKeepAlive />
      <SessionErrorHandler />
      {children}
    </SessionProvider>
  );
}
