# Repository Guidelines

## Project Structure & Module Organization
- `src/app/` contains Next.js App Router entry points (`layout.tsx`, `page.tsx`) and global styles.
- `src/components/` stores reusable UI components (including `src/components/ui/` primitives).
- `src/server/` holds backend-facing logic; profile data access is split into `profile.repository.ts` and `profile.service.ts`.
- `src/lib/`, `src/hooks/`, and `src/providers/` contain shared utilities, React hooks, and context providers.
- `prisma/schema.prisma` defines data models; Prisma config lives in `prisma.config.ts`. Static assets are in `public/`.

## Build, Test, and Development Commands
Use `pnpm` (the repo includes `pnpm-lock.yaml`).
- `pnpm dev` - run the local Next.js dev server.
- `pnpm build` - create a production build.
- `pnpm start` - serve the production build.
- `pnpm lint` - run ESLint with Next.js + TypeScript rules.
- `pnpm prisma migrate dev` - create/apply local DB migrations when schema changes.
- `pnpm prisma generate` - regenerate Prisma Client after schema updates.

## Coding Style & Naming Conventions
- TypeScript is `strict`; prefer explicit types on public APIs and server-layer functions.
- Follow existing style: 2-space indentation, semicolons, and single quotes in TS/TSX files.
- Use path aliases from `tsconfig.json`: import app code via `@/...` instead of long relative paths.
- Naming: components and providers in `PascalCase`, hooks in `camelCase` prefixed with `use`, service/repository files as `*.service.ts` and `*.repository.ts`.

## Testing Guidelines
- There is currently no dedicated test runner configured. Minimum quality gate is passing `pnpm lint` and `pnpm build`.
- For logic-heavy additions (for example in `src/server/`), include focused tests with your preferred framework and document the command in the PR.
- Keep test filenames consistent (`*.test.ts` / `*.test.tsx`) and colocate near the code under test.

## Commit & Pull Request Guidelines
- Git history is minimal (initial `start` commit), so no strict convention is established yet.
- Use clear, imperative commit messages (example: `Add profile update validation`). Keep each commit scoped to one concern.
- PRs should include: purpose, key changes, local verification steps, and any schema/env updates.
- Link related issues and include screenshots/GIFs for UI changes under `src/app/` or `src/components/`.

## Security & Configuration Tips
- Keep secrets in `.env`; never commit credentials.
- Ensure `DATABASE_URL` is set before running Prisma commands.

## Prompt: [User rules]
  - Prioritize clean, efficient and maintainable code
  - Follow best practices and design patterns appropriate for language, framework and project
  - If task is unclear ask clarifying questions
  - Always follow SOLID and KISS principles
  - Answer in Russian
  - Think like a senior developer
  - Apply the best best solutions and practices of code and UX/UT at the moment
  - Pay attention to strict typing
  - Carefully analyze my files and requirements
  - Display information in an easy-to-read format
  - Use the components ui.shadcn.com for the front-end

## 1) Структура репозитория
```txt
project-app/
  public/                    # статические ассеты (svg, logo, favicon и т.д.)
  src/
    app/                     # Next.js App Router: страницы, layout, API-роуты (BFF)
      api/                   # серверные route handlers, проксирующие backend API
    features/                # доменные модули (feature-first)
    components/              # переиспользуемые компоненты UI/лейаута
      ui/                    # базовые UI-примитивы (button, input, dialog, table и т.д.)
    providers/               # глобальные React providers (auth/query/theme/layout)
    lib/                     # инфраструктурные утилиты (http, proxy, форматтеры, helpers)
    hooks/                   # общие React hooks (не привязанные к конкретной фиче)
    middleware.ts            # entrypoint Next middleware    
  eslint.config.mjs          # линтинг
  .prettierrc                # форматирование
  tsconfig.json              # TypeScript + alias @/*
  package.json               # зависимости и npm scripts
```
Примечание: названия файлой компонент в kebab-case стиле (например user-profile.tsx)

## 2) Архитектурный подход
Проект использует **feature-first** подход:

- `src/app` отвечает за маршрутизацию и композицию страниц.
- `src/features/*` содержит бизнес-логику по доменам.
- `src/components/ui` хранит общие низкоуровневые UI-компоненты без доменной логики.
- `src/lib` содержит инфраструктуру (HTTP-клиент, BFF-прокси, форматтеры, утилиты).

## 3) Стандарт структуры фичи
Новая фича создается в `src/features/<domain>/` и по возможности следует шаблону:

```txt
src/features/<domain>/
  api/        # вызовы API + DTO/типы API
  hooks/      # react-query hooks и адаптеры для UI
  ui/         # компоненты интерфейса фичи
  model/      # чистая доменная логика/трансформации
  store/      # локальные сторы состояния (например, zustand)
  types/      # доменные типы
  index.ts    # публичный API фичи (реэкспорты)
```
Примечание: не все подпапки обязательны. Если слой не нужен, его не создаем.

## 4) Правила размещения кода
1. **Новая страница**: `src/app/<route>/page.tsx`.
2. **Бизнес-логика страницы**: в `src/features/...`, а не в `src/app`.
3. **Запросы к backend**:
    - клиент вызывает только `"/api/..."` маршруты приложения;
    - проксирование во внешний backend делается в `src/app/api/**/route.ts` через `src/lib/apiProxy.ts`.
4. **Общие UI-примитивы**: `src/components/ui`.
5. **Общие доменно-независимые утилиты**: `src/lib`.
6. **Публичные импорты фичи**: через `index.ts` внутри фичи.
