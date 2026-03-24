# Auth Feature (LDAP + NextAuth)

Эта фича содержит полный модуль авторизации и переносится между проектами целиком.

## Структура

- `server/ldap/*` — LDAP bind/search и серверная логика пользователя.
- `server/next-auth/*` — конфиг NextAuth, server helper и type augmentation.
- `client/session-provider-client.tsx` — клиентский провайдер сессии.
- `ui/ldap-sign-in-form.tsx` — кастомная форма входа.
- `model/error-messages.ts` — маппинг ошибок авторизации в сообщения UI.

## Точки экспорта

- Сервер: `@/features/auth/index.server`
- Клиент: `@/features/auth/index.client`

Важно: не смешивать server/client импорты в одном barrel.

## Подключение в проекте

1. Route handler:

```ts
// src/app/api/auth/[...nextauth]/route.ts
import NextAuth from 'next-auth';
import { authConfig } from '@/features/auth/index.server';

const handler = NextAuth(authConfig);

export { handler as GET, handler as POST };
```

2. Server helper:

```ts
import { auth } from '@/features/auth/index.server';
```

3. Session provider:

```tsx
import { SessionProviderClient } from '@/features/auth/index.client';

<SessionProviderClient>{children}</SessionProviderClient>
```

4. Кастомная страница входа:

`src/app/auth/signin/page.tsx` использует `LdapSignInForm`.

5. Server-side session (App Router):

Файл: `src/app/profile/page.tsx`

```tsx
import { auth } from '@/features/auth/index.server';

export default async function Profile() {
  const session = await auth();

  return (
    <div>
      <h1>{session?.user?.cn}</h1>
      <h1>{session?.user?.department}</h1>
      <div>Access Token: {session?.token?.jti}</div>
    </div>
  );
}
```

6. Client-side session:

Файл: `src/components/nav-user.tsx`

```tsx
'use client';

import { useSession, signIn, signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';

export function NavUser() {
  const { data: session } = useSession();

  if (session) {
    const userLabel = session.user?.cn ?? session.user?.name ?? 'User';

    return (
      <Button variant='ghost' onClick={() => signOut()}>
        {userLabel}
      </Button>
    );
  }

  return (
    <Button variant='ghost' onClick={() => signIn()}>
      Sign in
    </Button>
  );
}
```

Важно: для `useSession()` должен быть подключён `SessionProviderClient` в `src/providers/providers.tsx`.

## Обязательные ENV

- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`
- `AUTH_LDAP_SERVER_URI`
- `AUTH_LDAP_BASE_DN`

## Необходимые зависимости из `package.json`

Минимальный runtime-набор для этой auth-фичи:
- `next-auth`
- `ldapts`
