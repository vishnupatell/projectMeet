# ProjectMeet Backend

Express + Socket.IO backend for ProjectMeet. For the project overview, architecture diagram, and full-stack setup, see the [root README](../README.md).

## Stack

- **Node.js + Express + TypeScript** (strict)
- **Socket.IO** with **Redis adapter** for horizontal scaling
- **Prisma** ORM on PostgreSQL
- **Zod** request validation
- **Pino** structured logging
- **JWT** auth (access + refresh)

## Run locally

```bash
npm install
npm run prisma:generate
npm run prisma:migrate          # create + run new migrations
npm run dev                     # tsx watch, http://localhost:4000

npm run build                   # compile to dist/
npm run typecheck
npm run lint
```

Requires a running PostgreSQL + Redis. Use `docker compose up -d postgres redis` from the repo root if you don't have them locally.

## Architecture — Modular DDD

Each module (`auth`, `chat`, `meeting`) is self-contained with its own layers. Modules never import each other directly — cross-module side effects go through the **domain-event bus** ([src/shared/infrastructure/events](src/shared/infrastructure/events)).

```
src/
├── modules/
│   └── auth/
│       ├── domain/                  # Entities, value objects, aggregates
│       ├── application/             # Commands, queries, application services
│       ├── events/                  # Domain events this module emits
│       └── infrastructure/          # Repository impls, external integrations
├── controllers/                     # Thin HTTP handlers — delegate to services
├── services/                        # Application services (meeting, recording, transcript, ...)
├── middlewares/                     # auth, validate, error, upload (multer)
├── validators/                      # Zod schemas
├── sockets/                         # Socket.IO event handlers + setup
├── routes/                          # Express route wiring
├── shared/
│   ├── domain/                      # DomainEvent interface, shared value objects
│   ├── application/                 # DomainEventBus interface
│   └── infrastructure/              # InMemoryDomainEventBus + default handlers
├── config/                          # env + DB + Redis clients
├── utils/                           # logger, errors, cors helpers
├── app.ts                           # Express app assembly
└── server.ts                        # HTTP server + graceful shutdown
```

## Conventions

- **Controllers** only translate HTTP ↔ service. No business logic.
- **Validators** (Zod) run as middleware before the controller ever sees `req.body`.
- **Errors** extend `AppError` ([src/utils/errors.ts](src/utils/errors.ts)); `error.middleware.ts` formats them into `{ success: false, error: { code, message } }`.
- **Logs** always use `logger` (Pino) — never `console.log`. Include structured context (`{ userId, meetingId }`).
- **Domain events** are emitted from services and consumed by handlers registered in `shared/infrastructure/events/default-domain-event-handlers.ts`.

## Database

Prisma schema lives at [prisma/schema.prisma](prisma/schema.prisma). Migrations in [prisma/migrations/](prisma/migrations/) are tracked in git.

```bash
npm run prisma:migrate          # create + apply (dev)
npm run prisma:migrate:prod     # apply existing migrations (prod)
npm run prisma:studio           # browse data at http://localhost:5555
```

## API

Full route reference — request bodies, cURL, Postman formats, responses — is in [../ProjectMeet_API_Reference.xlsx](../ProjectMeet_API_Reference.xlsx).

Quick map:
- `/api/auth/*` — register, login, refresh, logout, profile
- `/api/meetings/*` — CRUD + join/leave/end + ice-servers
- `/api/chats/*` — chats + messages (paginated)
- `/api/recordings/*` — upload (multipart), download, delete
- `/api/transcripts/*` — get + regenerate AI transcripts

## AI pipeline

When a recording is uploaded, [recording.controller.ts](src/controllers/recording.controller.ts) kicks off an async call to the AI sidecar via [transcript.service.ts](src/services/transcript.service.ts). That service:

1. `POST http://ai-service:8000/transcribe` with the file path → Whisper returns text + segments
2. `POST http://ai-service:8000/summarize` with the text → Ollama (Llama 3.2) returns summary + key points
3. Updates the `Transcript` row status: `PENDING → TRANSCRIBING → SUMMARIZING → READY`

On failure the status becomes `FAILED` and the frontend report page shows a Retry button that hits `POST /api/transcripts/recording/:id/generate`.
