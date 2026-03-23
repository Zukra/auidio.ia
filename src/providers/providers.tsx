'use client';

import type { ReactNode } from 'react';
import { SessionProviderClient } from '@/lib/auth/next-auth/session-provider-client';
import { ThemeProvider } from '@/providers/theme-provider';

type AppProvidersProps = {
  children: ReactNode;
};

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <SessionProviderClient>
      <ThemeProvider
        attribute='class'
        defaultTheme='system'
        enableSystem
        disableTransitionOnChange
      >
        {children}
      </ThemeProvider>
    </SessionProviderClient>
  );
}
