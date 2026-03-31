# Auth Transfer Checklist

Этот чек-лист нужен для переноса auth-фичи в другой проект.

## 1) Файлы Фичи (Копировать Целиком)

- `src/features/auth/index.client.ts`
- `src/features/auth/index.server.ts`
- `src/features/auth/config/auth-settings.ts`
- `src/features/auth/config/constants.ts`
- `src/features/auth/client/session-provider-client.tsx`
- `src/features/auth/model/error-messages.ts`
- `src/features/auth/ui/ldap-sign-in-form.tsx`
- `src/features/auth/server/next-auth/auth.config.ts`
- `src/features/auth/server/next-auth/server.ts`
- `src/features/auth/server/next-auth/next-auth-augmentation.d.ts`
- `src/features/auth/server/ldap/config.ts`
- `src/features/auth/server/ldap/client.ts`
- `src/features/auth/server/ldap/errors.ts`
- `src/features/auth/server/ldap/helpers.ts`
- `src/features/auth/server/ldap/index.ts`
- `src/features/auth/server/ldap/repository.ts`
- `src/features/auth/server/ldap/service.ts`
- `src/features/auth/server/ldap/types.ts`

## 2) Интеграционные Файлы Проекта (Обязательно)

- `src/app/api/auth/[...nextauth]/route.ts`
- `src/app/auth/signin/page.tsx`
- `src/providers/providers.tsx`

Важно:
- Если в целевом проекте появятся приватные роуты, guard (`proxy`/`middleware`) подключается отдельно.

## 3) Опциональные Примеры Использования

- `src/components/nav-user.tsx`
- `src/app/profile/page.tsx`

## 4) Зависимости

- `next-auth`
- `ldapts`

Важно:
- Форма `ldap-sign-in-form.tsx` использует shadcn/ui-компоненты (`src/components/ui/*`), они должны быть доступны в целевом проекте.

## 5) ENV

- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`
- `AUTH_LDAP_SERVER_URI`
- `AUTH_LDAP_BASE_DN`
- `AUTH_LDAP_SERVICE_USER`
- `AUTH_LDAP_SERVICE_PASS`

Опциональные ENV:
- `AUTH_SESSION_MAX_AGE_SECONDS` (default: `30`)
- `AUTH_JWT_MAX_AGE_SECONDS` (default: `28800`)
- `AUTH_LDAP_RECHECK_INTERVAL_SECONDS` (default: `60`)

Без отдельного ENV:
- client keep-alive interval задаётся в `DEFAULT_SESSION_KEEP_ALIVE_SECONDS` (`config/constants.ts`).

## 6) Post-Copy Настройка

- Проверить `tsconfig.json`: alias `@/*` должен резолвиться на `src/*`.
- Проверить `providers.tsx`: подключён `SessionProviderClient`.
- Проверить `route.ts`: `NextAuth(authConfig)` использует импорт из `@/features/auth/index.server`.

## 7) Smoke-Check

- Успешный логин через LDAP-форму.
- Клиентский `useSession()` возвращает сессию в компонентах.
- Серверный `auth()` возвращает сессию в server-компонентах/роутах.

## 8) Типовые Проблемы

- Не подключены shadcn/ui-компоненты.
- Неверный `NEXTAUTH_URL` или `NEXTAUTH_SECRET`.
- Не настроены LDAP ENV.
