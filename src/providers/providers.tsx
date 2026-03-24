'use client';

import type { ReactNode } from 'react';
import { SessionProviderClient } from '@/features/auth/index.client';
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
