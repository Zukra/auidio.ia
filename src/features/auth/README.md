# Auth Feature (LDAP + NextAuth)

Модуль авторизации для Next.js App Router: LDAP-аутентификация, JWT-сессия через NextAuth, периодическая перепроверка пользователя в LDAP и публикация auth-событий.

## 1. Состав модуля

- `server/next-auth/*` — конфиг NextAuth, server helper `auth()`, type augmentation.
- `server/ldap/*` — LDAP bind/search и серверная логика проверки пользователя.
- `server/core/*` — основной auth-flow (signin/recheck/signout), сборка session/JWT, эмит событий.
- `server/auth-events/*` — модель события и publisher (noop/console + set/get publisher).
- `client/session-provider-client.tsx` — клиентский провайдер с keep-alive и auto sign-out при ошибке сессии.
- `ui/ldap-sign-in-form.tsx` — UI формы входа.
- `model/error-messages.ts` — маппинг кодов ошибок в сообщения UI.
- `config/*` — env-настройки и дефолтные константы.

## 2. Установка и подключение

### Шаг 1. Скопировать фичу

Скопируйте `src/features/auth/**`.

### Шаг 2. Подключить NextAuth route handler

`src/app/api/auth/[...nextauth]/route.ts`:

```ts
import NextAuth from 'next-auth';
import {
  authConfig,
  ConsoleAuthEventPublisher,
  NoopAuthEventPublisher,
  setAuthEventPublisher,
} from '@/features/auth/index.server';

setAuthEventPublisher(
  process.env.NODE_ENV === 'production'
    ? new NoopAuthEventPublisher()
    : new ConsoleAuthEventPublisher(),
);

const handler = NextAuth(authConfig);

export { handler as GET, handler as POST };
```

Важно: `setAuthEventPublisher(...)` должен вызываться только на сервере и до первого запроса авторизации.

### Шаг 3. Подключить страницу входа

`src/app/auth/signin/page.tsx`:

```tsx
import { LdapSignInForm } from '@/features/auth/ui/ldap-sign-in-form';

export default function SignInPage() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <LdapSignInForm />
      </div>
    </div>
  );
}
```

### Шаг 4. Подключить клиентский SessionProvider

`src/providers/providers.tsx`:

```tsx
'use client';

import type { ReactNode } from 'react';
import { SessionProviderClient } from '@/features/auth/index.client';
import { ThemeProvider } from '@/features/theme/theme-provider';

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <SessionProviderClient>
      <ThemeProvider>{children}</ThemeProvider>
    </SessionProviderClient>
  );
}
```

## 3. ENV и дефолты

### Обязательные ENV

- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`
- `AUTH_LDAP_SERVER_URI`
- `AUTH_LDAP_BASE_DN`
- `AUTH_LDAP_SERVICE_USER`
- `AUTH_LDAP_SERVICE_PASS`

### Дефолтные значения

`src/features/auth/config/constants.ts`:

## 4. Примеры использования

### Server-side получение сессии (App Router)

`src/app/profile/page.tsx`:

```tsx
import { auth } from '@/features/auth/index.server';

export default async function ProfilePage() {
  const session = await auth();

  return (
    <div>
      <h1>{session?.user?.cn}</h1>
      <div>{session?.user?.department}</div>
      <div>JTI: {session?.jti}</div>
      <div>EXP: {session?.exp}</div>
    </div>
  );
}
```

### Client-side получение сессии

```tsx
'use client';

import { useSession } from 'next-auth/react';

export function UserBadge() {
  const { data: session } = useSession();

  return <span>{session?.user?.cn ?? 'Guest'}</span>;
}
```

## 5. Алгоритм работы авторизации

### 5.1 Sign-in

1. Credentials provider вызывает `handleAuthorize(...)`.
2. `authenticateLdap(...)` делает bind/search в LDAP.
3. При успехе `applySignInToToken(...)` эмитит `auth.login`.

### 5.2 JWT callback и LDAP recheck

В `auth.config.ts` recheck выполняется, если:
- `isLdapRecheckDue(...)` вернул `true`.

`applyLdapRecheckToToken(...)`:

- Если LDAP-пользователь активен:
  - при изменении эмитится `auth.user_update`;
  
- Если LDAP возвращает неактивного пользователя (`LDAP_ACCOUNT_NOT_ACTIVE`):
  - `token.user = undefined`;
  - `token.error` получает LDAP-код.
  - вызов события `auth.user_update` уже был при проверке на изменения

- Если LDAP возвращает `LDAP_USER_NOT_FOUND`:
  - эмитится `auth.user_update` с `isActive: false`;

### 5.3 Session callback

`buildSession(...)` переносит в session:
- `session.user`
- `session.error`
- `session.exp`, `session.jti`, `session.trigger`

### 5.4 Клиентский keep-alive и авто-logout

`SessionProviderClient`:
- периодически вызывает `update()` сессии;
- если появился `session.error`, делает `signOut` с редиректом на `/auth/signin?error=...`.

### 5.5 Sign-out событие

В `events.signOut` вызывается `handleSignOutEvent(...)`, который эмитит `auth.logout` (если есть `userId`).

## 6. Auth Events

### Поддерживаемые типы

- `auth.login`
- `auth.user_update`
- `auth.logout`

### Формат

`AuthEvent`:
- `type`
- `userId`
- `occurredAt`
- `payload: Record<string, unknown>`

### Режим публикации

Best-effort: если publisher падает, auth-flow не ломается (ошибка только логируется).

## 7. Ошибки

UI-отображение кодов находится в `src/features/auth/model/error-messages.ts`.

## 8. Smoke-check

1. Успешный логин создает сессию и эмитит `auth.login`.
2. Ручной выход эмитит `auth.logout`.
3. При recheck изменение профиля эмитит `auth.user_update`.
4. При `LDAP_USER_NOT_FOUND` эмитится `auth.user_update`, затем сессия очищается.
5. При `LDAP_ACCOUNT_NOT_ACTIVE` сессия очищается.
