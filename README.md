# Estuda+ — Plataforma de organização de estudos

Projeto da disciplina **Web 2** (Engenharia de Computação — IFSP Piracicaba, 2026).
Integrantes: Eduardo Mambelli Serotini, Gabriel Henrique Lima, Ryan Alberto Santos e Victor Gimenes Vianna.

Stacks separadas que conversam por API REST (JSON + JWT), como na seção 8 do documento:

| Pasta | Stack | Papel |
|---|---|---|
| `frontend/` | React + TypeScript + Vite + Tailwind + shadcn/ui + Recharts | Interface (organizada por features) |
| `backend/` | NestJS + TypeScript + Prisma + PostgreSQL | API REST em Clean Architecture |
| `docker-compose.yml` | Docker | Sobe front, back e banco (ambiente Dev) |
| `.github/workflows/ci.yml` | GitHub Actions | Lint → testes (Jest) → build a cada push |

## Como rodar (Docker, recomendado)

```bash
cp .env.example .env
docker compose up --build
```

- Front: <http://localhost:8080>
- API: <http://localhost:3000> (`GET /health` responde `{"status":"ok"}`)
- Banco: `localhost:5432` (usuário/senha do `.env`)

As migrações rodam sozinhas quando o back-end sobe. Para criar a conta de demonstração com disciplinas e tarefas:

```bash
docker compose exec backend npx prisma db seed
```

Os dados de acesso da conta demo estão em `backend/prisma/seed.mjs`.

## Como rodar sem Docker (desenvolvimento)

Precisa de Node 22 e de um PostgreSQL (dá para subir só o banco com `docker compose up db`).

```bash
cd backend
cp .env.example .env
npm install
npx prisma migrate dev
npm run start:dev
```

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

O front abre em <http://localhost:5173>.

## Testes (RNF05)

```bash
cd backend
npm test          # testes unitários + e2e
npm run test:cov  # com relatório de cobertura (mínimo: 80% de linhas)
```

- **Unitários** (`backend/test/unit`): entidades e casos de uso, usando repositórios em memória no lugar do Prisma (substituição de Liskov, seção 10.2).
- **E2E** (`backend/test/e2e`): sobe a API inteira (validação, guard JWT, bcrypt real) e testa os endpoints da seção 8.4, inclusive rotas sem token (RNF02) e isolamento entre usuários. Não precisa de banco.

## API — endpoints da 1ª etapa (seção 8.4)

| Método e rota | Função | Acesso |
|---|---|---|
| `POST /auth/register` | Cadastrar usuário e devolver JWT (RF01) | Público |
| `POST /auth/login` | Autenticar e devolver JWT (RF01) | Público |
| `GET`, `POST /disciplinas` | Listar e criar disciplinas (RF02) | JWT |
| `PATCH`, `DELETE /disciplinas/:id` | Editar e excluir disciplina (RF02) | JWT |
| `GET /tarefas?disciplinaId=&status=`, `POST /tarefas` | Listar com filtros e criar tarefas (RF03) | JWT |
| `PATCH`, `DELETE /tarefas/:id` | Editar, mudar status e excluir tarefa (RF03) | JWT |

Rotas protegidas exigem `Authorization: Bearer <token>`. Cada usuário só enxerga as próprias disciplinas e tarefas: recursos de outra conta respondem 404.

## Arquitetura do back-end (Clean Architecture, seção 8.3)

```
backend/src/
├── domain/          Entidades (Usuario, Disciplina, Tarefa), regras e interfaces dos repositórios
├── application/     Casos de uso, um por ação (CriarTarefaUseCase, LoginUseCase…)
├── infrastructure/  Prisma, bcrypt, JWT e config; único lugar que liga interface → implementação
└── presentation/    Controllers, DTOs com validação, guard JWT global, filtro de erros
```

A dependência aponta para dentro: `presentation` e `infrastructure` dependem de `application` e `domain`, nunca o contrário. O schema do Prisma (`backend/prisma/schema.prisma`) segue o MER da seção 7.3 com todas as tabelas, inclusive as que só ganham endpoints na 2ª etapa.

## Requisitos atendidos

| Requisito | Onde | Situação |
|---|---|---|
| RF01 Cadastro e login | `/login` + `/auth/*` | Integrado à API (bcrypt + JWT) |
| RF02 CRUD de disciplinas | `/disciplinas` | Integrado à API |
| RF03 CRUD de tarefas | `/tarefas` (quadro com filtros e arrastar e soltar) | Integrado à API |
| RF04 Calendário | `/calendario` | Integrado à API (usa as tarefas) |
| RF05 Pomodoro | `/pomodoro` | Interface; sessões salvas no navegador |
| RF06 Dashboard | `/dashboard` (Recharts) | Tarefas da API; horas a partir das sessões locais |
| RF07 Grupos | `/grupos` | Interface; dados no navegador (código demo `WEB2-7K`) |
| RF08 Notificações (prévia) | Sino no topo | Calculado no front |
| RF09 Modo escuro/claro | Lua/sol no topo | Implementado |
| RNF01 Responsivo | Todas as telas | Menu lateral vira gaveta no celular |
| RNF02 Segurança | Back-end | bcrypt + guard JWT global, testado no e2e |
| RNF04 3 cliques | Tarefas | "Nova tarefa" → preencher → "Criar tarefa" |
| RNF05 Testes | `backend/test` | Jest com limite mínimo de cobertura no CI |
| RNF06 Docker | `docker-compose.yml` | Front, back e banco com `docker compose up` |

Sessões de estudo e grupos ficam no `localStorage` porque a API da 1ª etapa cobre só auth, disciplinas e tarefas. As tabelas `sessao_estudo`, `grupo_estudo`, `membro` e `material` já existem no banco, então na 2ª etapa basta criar os endpoints e trocar `sessoes.storage.ts` e `grupos.storage.ts` por chamadas à API.

## Deploy (Prod)

- Front-end na Vercel: diretório `frontend/`, variável `VITE_API_URL` apontando para a API (`vercel.json` já trata as rotas da SPA).
- Back-end no Render ou Railway: diretório `backend/` com o `Dockerfile`, variáveis do `backend/.env.example`.
- Banco no Neon ou Supabase: usar a connection string em `DATABASE_URL`.
