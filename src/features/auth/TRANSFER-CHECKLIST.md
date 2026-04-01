# Auth Transfer Checklist

## 1) Копируемые файлы фичи

- `src/features/auth/index.client.ts`
- `src/features/auth/index.server.ts`
- `src/features/auth/config/*`
- `src/features/auth/client/session-provider-client.tsx`
- `src/features/auth/model/error-messages.ts`
- `src/features/auth/ui/ldap-sign-in-form.tsx`
- `src/features/auth/server/next-auth/*`
- `src/features/auth/server/ldap/*`
- `src/features/auth/server/auth-events/*`

## 2) Интеграция в проект

- `src/app/api/auth/[...nextauth]/route.ts`
- `src/app/auth/signin/page.tsx`
- глобальный provider c `SessionProviderClient`

## 3) Проверка route.ts

- `NextAuth(authConfig)` импортируется из `@/features/auth/index.server`.
- Publisher задается один раз на сервере через `setAuthEventPublisher(...)`.
- В production не использовать `ConsoleAuthEventPublisher`.

## 4) LDAP API (актуально)

- `authenticateLdap(credentials)`
- `getLdapUserByLogin(login)`

## 5) Auth events (актуально)

- `auth.login`
- `auth.user_synced`
- `auth.logout`

`auth.user_synced` содержит diff по:
- `displayName`
- `mail`
- `department`
- `isActive`

## 6) ENV

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

## 7) Smoke-check

- Успешный LDAP login.
- `auth.login` публикуется на каждый вход.
- При recheck:
  - изменения профиля/статуса публикуют `auth.user_synced`;
  - `isActive=false` приводит к `SessionExpired` и sign out.
- `auth.logout` публикуется при ручном выходе.

