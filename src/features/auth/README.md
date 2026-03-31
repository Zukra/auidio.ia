# Auth Feature (LDAP + NextAuth)

Эта фича содержит полный модуль авторизации и переносится между проектами целиком.

## Быстрый перенос (TL;DR)

1. Скопируйте `src/features/auth/**` целиком.
2. Подключите интеграционные файлы:
   - `src/app/api/auth/[...nextauth]/route.ts`
   - `src/app/auth/signin/page.tsx`
   - `src/providers/providers.tsx` 
      либо добавьте в `src/app/layout.tsx` провайдер из `src/features/auth/client/session-provider-client.tsx`
3. Проверьте переменные окружения и зависимости.

Подробный список: `./TRANSFER-CHECKLIST.md`.

## Что Внутри Фичи

- `server/ldap/*` — LDAP bind/search и серверная логика пользователя.
- `server/next-auth/*` — конфиг NextAuth, server helper и type augmentation.
- `config/auth-settings.ts` — единая точка runtime-настроек auth.
- `config/constants.ts` — дефолтные константы таймаутов/интервалов auth.
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

6. Client-side session:

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

- `NEXTAUTH_URL=http://localhost:3000`
- `NEXTAUTH_SECRET=secret_string`
- `AUTH_LDAP_SERVER_URI=ldap://emk.loc:389`
- `AUTH_LDAP_BASE_DN=DC=emk,DC=loc`
- `AUTH_LDAP_SERVICE_USER=<service-login>`
- `AUTH_LDAP_SERVICE_PASS=<service-password>`

Опциональные ENV для тюнинга:
- `AUTH_SESSION_MAX_AGE_SECONDS` (default: `30`)
- `AUTH_JWT_MAX_AGE_SECONDS` (default: `28800`)
- `AUTH_LDAP_RECHECK_INTERVAL_SECONDS` (default: `60`)

Пакеты:
- `next-auth`
- `ldapts`

## Проверка После Переноса

- Пользователь успешно логинится через LDAP-форму.
- После логина `auth()` и `useSession()` возвращают актуальную сессию.
- При `session.error === 'SessionExpired'` выполняется выход и редирект на страницу авторизации.

## Автопродление И Проверка Активности

Алгоритм:
1. На клиенте `SessionKeepAlive` в `session-provider-client.tsx` периодически вызывает `useSession().update()`.
2. Каждый `update()` запускает серверный `jwt` callback в `auth.config.ts`.
3. В `jwt` callback сессия обновляется, а LDAP-проверка активности выполняется по интервалу.
4. Если пользователь активен в LDAP, сессия продолжает жить.
5. Если пользователь неактивен или есть ошибка проверки, в токен пишется `error` (`SessionExpired` или `LDAP_CONFIG_ERROR`), после чего `SessionErrorHandler` делает `signOut` и редирект на `/auth/signin?error=...`.

Периодичность:
- клиентский keep-alive: каждые `DEFAULT_SESSION_KEEP_ALIVE_SECONDS` секунд (`config/constants.ts`);
- серверный LDAP re-check: не чаще, чем раз в `AUTH_LDAP_RECHECK_INTERVAL_SECONDS` секунд (`config/constants.ts`).
