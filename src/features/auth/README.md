# Auth Feature (LDAP + NextAuth)

Модуль авторизации переносимый: внутри только LDAP/NextAuth логика и публикация auth-событий.

## Быстрый перенос

1. Скопировать `src/features/auth/**`.
2. Подключить `src/app/api/auth/[...nextauth]/route.ts`.
3. Подключить `SessionProviderClient` в `providers/layout`.
4. Проверить ENV и зависимости.

## Актуальные LDAP API

- `authenticateLdap(credentials)` — проверка логина/пароля пользователя.
- `getLdapUserByLogin(login)` — серверная выборка пользователя для recheck.

`getLdapUserByLogin`:
- возвращает пользователя с заполненным `isActive`;
- бросает `LDAP_USER_NOT_FOUND`, если пользователь не найден;
- бросает `LDAP_ACCOUNT_NOT_ACTIVE`, если учетная запись не активна.

## Auth Events

Публикуемые события:
- `auth.login` — каждый успешный вход.
- `auth.user_synced` — любое изменение snapshot пользователя (`previous/current`).
- `auth.logout` — ручной выход пользователя.

Режим публикации: `best-effort`.
Если publisher падает, авторизация не ломается (ошибка только в логах).

## Event Publisher

По умолчанию используется `NoopAuthEventPublisher`.

Для отладки можно подключить `ConsoleAuthEventPublisher` в route handler:

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

Важно: вызывать `setAuthEventPublisher(...)` только на сервере и до первого запроса авторизации.

## ENV

Обязательные:
- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`
- `AUTH_LDAP_SERVER_URI`
- `AUTH_LDAP_BASE_DN`
- `AUTH_LDAP_SERVICE_USER`
- `AUTH_LDAP_SERVICE_PASS`

Опциональные:
- `AUTH_SESSION_MAX_AGE_SECONDS`
- `AUTH_JWT_MAX_AGE_SECONDS`
- `AUTH_LDAP_RECHECK_INTERVAL_SECONDS`
