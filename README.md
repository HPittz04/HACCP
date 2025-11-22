# HACCP Guard Monorepo

Monorepo Node.js/TypeScript para gestão HACCP com API REST, renderização server-side EJS e sincronização offline-first.

## Estrutura
- `haccp-guard/server` – API Express, Prisma e vistas EJS.

## Requisitos
- Node.js 20
- PostgreSQL

## Setup
```bash
cd haccp-guard/server
cp .env.example .env
npm install
npx prisma migrate dev
npx prisma db seed
npm run dev
```

## Endpoints principais
- `POST /api/auth/pin` – login por PIN.
- `GET/POST /api/users` – gestão de utilizadores (admin).
- `GET/POST/PUT /api/assets` – inventário e limites.
- `GET/POST /api/round-templates` – templates de rondas.
- `POST /api/rounds/generate` – gera rondas do dia.
- `GET /api/rounds` – listar rondas.
- `POST /api/rounds/:id/start|done` – estados.
- `POST /api/measurements` – registo com validação de limites e corretiva opcional.
- `POST /api/corrective-actions` – criar corretiva.
- `POST /api/sync/batch` – sincronização offline com HMAC e idempotência por `device_id + id_local`.
- `GET /api/reports/csv|pdf` – exportações.

## Testes
```bash
npm test
```

## Notas
- RBAC simples com roles `operator`, `supervisor`, `admin`.
- Rate limit aplicado a `/api/*` e Helmet configurado.
- Logger com pino e request-id do pino-http.
