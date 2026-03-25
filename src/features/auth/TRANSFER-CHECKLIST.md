# Auth Transfer Checklist

Этот чек-лист нужен для переноса auth-фичи в другой проект.

## 1) Файлы Фичи (Копировать Целиком)

- `src/features/auth/index.client.ts`
- `src/features/auth/index.server.ts`
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
- `src/proxy.ts`
- `src/providers/providers.tsx`

Важно:
- В Next.js 16 используется `src/proxy.ts` (это замена `middleware.ts`).
- `pages` в `src/proxy.ts` должны совпадать с `pages` в `src/features/auth/server/next-auth/auth.config.ts`.

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

## 6) Post-Copy Настройка

- Проверить `tsconfig.json`: alias `@/*` должен резолвиться на `src/*`.
- Проверить `src/proxy.ts`: `matcher` покрывает нужные приватные маршруты.
- Проверить `providers.tsx`: подключён `SessionProviderClient`.
- Проверить `route.ts`: `NextAuth(authConfig)` использует импорт из `@/features/auth/index.server`.

## 7) Smoke-Check

- Гость открывает приватный роут (`/profile`) -> редирект на `/auth/signin` c `callbackUrl` и `error=SessionRequired`.
- Успешный логин -> возврат на `callbackUrl`.
- Клиентский `useSession()` возвращает сессию в компонентах.

## 8) Типовые Проблемы

- Не подключены shadcn/ui-компоненты.
- Не совпадают `pages` в `proxy.ts` и `auth.config.ts`.
- Неверный `NEXTAUTH_URL` или `NEXTAUTH_SECRET`.
- Не настроены LDAP ENV.
