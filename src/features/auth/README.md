# Auth Feature (LDAP + NextAuth)

Эта фича содержит полный модуль авторизации и переносится между проектами целиком.

## Быстрый перенос (TL;DR)

1. Скопируйте `src/features/auth/**` целиком.
2. Подключите интеграционные файлы:
   - `src/app/api/auth/[...nextauth]/route.ts`
   - `src/app/auth/signin/page.tsx`
   - `src/proxy.ts`
   - `src/providers/providers.tsx`
3. Проверьте переменные окружения и зависимости.

Подробный список: `./TRANSFER-CHECKLIST.md`.

## Что Внутри Фичи

- `server/ldap/*` — LDAP bind/search и серверная логика пользователя.
- `server/next-auth/*` — конфиг NextAuth, server helper и type augmentation.
- `client/session-provider-client.tsx` — клиентский провайдер сессии.
- `ui/ldap-sign-in-form.tsx` — кастомная форма входа.
- `model/error-messages.ts` — маппинг ошибок авторизации в сообщения UI.

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

2. `proxy` (бывший `middleware`) для приватных роутов:
```ts
// src/proxy.ts
import { withAuth } from 'next-auth/middleware';
import type { NextRequestWithAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

const pages = { signIn: '/auth/signin', error: '/auth/signin' };

export default withAuth(
  function proxy(request: NextRequestWithAuth) {
    if (request.nextauth.token) {
      return NextResponse.next();
    }

    //  формирование сообщения об истечении срока действия сессии
    const signInUrl = new URL(pages.signIn, request.url);
    const callbackUrl = `${request.nextUrl.pathname}${request.nextUrl.search}`;

    signInUrl.searchParams.set('callbackUrl', callbackUrl);
    signInUrl.searchParams.set('error', 'SessionRequired');

    return NextResponse.redirect(signInUrl);
  },
  {
    callbacks: { authorized: () => true },
    pages,
  },
);

export const config = {
  matcher: ['/profile/:path*'],
};
```

Важно: `pages` в `src/proxy.ts` должны совпадать с `pages` в `src/features/auth/server/next-auth/auth.config.ts`.

3. Server helper:

```ts
import { auth } from '@/features/auth/index.server';
```

4. Session provider:

```tsx
import { SessionProviderClient } from '@/features/auth/index.client';

<SessionProviderClient>{children}</SessionProviderClient>
```

5. Кастомная страница входа:

`src/app/auth/signin/page.tsx` использует `LdapSignInForm`.

6. Server-side session (App Router):

`src/app/profile/page.tsx`

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

7. Client-side session:

 `src/components/nav-user.tsx`

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

## Обязательные ENV и зависимости

- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`
- `AUTH_LDAP_SERVER_URI`
- `AUTH_LDAP_BASE_DN`

- `next-auth`
- `ldapts`

## Проверка После Переноса

- Неавторизованный пользователь открывает `/profile` и получает редирект на `/auth/signin` с `callbackUrl` и `error=SessionRequired`.
- После успешного входа пользователь возвращается на `callbackUrl`.
- `useSession()` корректно работает в клиентских компонентах через `SessionProviderClient`.
