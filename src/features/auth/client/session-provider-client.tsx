'use client';

import { SessionProvider } from 'next-auth/react';
import type { Session } from 'next-auth';
import type { ReactNode } from 'react';

type SessionProviderClientProps = {
  children: ReactNode;
  session?: Session | null;
};

export function SessionProviderClient({ children, session }: SessionProviderClientProps) {
  return (
    <SessionProvider
      session={session}
      refetchOnWindowFocus={false}
      refetchInterval={0}
    >
      {children}
    </SessionProvider>
  );
}
