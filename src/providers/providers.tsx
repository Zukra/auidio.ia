'use client';

import type { ReactNode } from 'react';
import { SessionProviderClient } from '@/features/auth/index.client';
import { ThemeProvider } from '@/features/theme/theme-provider';

type AppProvidersProps = {
  children: ReactNode;
};

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <SessionProviderClient>
      <ThemeProvider>
        {children}
      </ThemeProvider>
    </SessionProviderClient>
  );
}
