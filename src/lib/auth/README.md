# Auth Portability Guide

Этот модуль собран так, чтобы перенос авторизации в другой проект был максимально простым.

## Что копировать

- `src/lib/auth/ldap/**`
- `src/lib/auth/next-auth/**`

## Что подключить в новом проекте

1. Создать route handler:

```ts
// src/app/api/auth/[...nextauth]/route.ts
import NextAuth from 'next-auth';
import { authConfig } from '@/lib/auth/next-auth';

const handler = NextAuth(authConfig);

export { handler as GET, handler as POST };
```

2. Использовать server helper напрямую:

```ts
import { auth } from '@/lib/auth/next-auth';

export default async function Profile() {
  const session = await auth();
}
```

3. Подключить клиентский session provider в app providers:

```tsx
'use client';

import type { ReactNode } from 'react';
import { SessionProviderClient } from '@/lib/auth/next-auth/session-provider-client';

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <SessionProviderClient>
        {children}
    </SessionProviderClient>
  );
}
```

```tsx
'use client';

import { useSession, signIn, signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';

export function NavUser() {
  const { data: session, status } = useSession();

  if (session) {
    const { user } = session;
    const userLabel = user?.cn ?? user?.name ?? 'User';

    return (
      <>
        <Button variant="ghost" onClick={() => signOut()}>Sign Out</Button>
      </>
    );
  }

  return (
    <>
      <Button variant="ghost" onClick={() => signIn()}>Sign in</Button>
    </>
  );
}

```

## SessionProviderClient

`SessionProviderClient` (`src/lib/auth/next-auth/session-provider-client.tsx`) — это client-only обёртка над `SessionProvider` из `next-auth/react`.

Важно:
- серверные импорты (`authConfig`, `auth`) берите из `@/lib/auth/next-auth`;
- клиентский `SessionProviderClient` импортируйте только из `@/lib/auth/next-auth/session-provider-client`.

Назначение:
- даёт доступ к `useSession()`, `signIn()`, `signOut()` в client components;
- централизует настройки session refetch для проекта;
- находится в `next-auth`-слое, а не в LDAP-слое.

Текущее поведение:
- `refetchOnWindowFocus={false}`
- `refetchInterval={0}`
- опционально принимает `session?: Session | null` (для будущего server session hydration).

## Необходимые ENV

- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`
- `AUTH_LDAP_SERVER_URI`
- `AUTH_LDAP_BASE_DN`

## Архитектурные границы

- `ldap/*` — bind/search и LDAP-логика.
- `next-auth/*` — провайдер, callbacks, server helper и type augmentation.
