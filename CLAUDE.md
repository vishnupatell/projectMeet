# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

**ProjectMeet** is a scalable video conferencing and real-time chat application with:
- Backend: Node.js/Express/TypeScript with Socket.IO, Prisma, PostgreSQL, and Redis
- Frontend: Next.js 16+ with React 18, Redux/Redux-Saga for state management, TailwindCSS
- WebRTC infrastructure with TURN/STUN servers (coturn)
- Docker Compose for full stack orchestration

## Development Workflow

### Local Development (Without Docker)

**Backend:**
```bash
cd backend
npm install
npm run prisma:generate
npm run prisma:migrate
npm run dev
```
Runs on `http://localhost:4000` with tsx watch. Requires PostgreSQL and Redis.

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```
Runs on `http://localhost:3000` with Next.js dev server.

### Docker Development (Recommended)

```bash
# Start all services (from root directory)
docker compose up -d

# View logs
docker compose logs -f

# Stop services
docker compose down

# Clean slate (removes volumes)
docker compose down -v
```

Services available:
- Frontend: `http://localhost:3003`
- Backend API: `http://localhost:4003`
- Database: postgres on 5433
- Redis: localhost:6379
- Coturn (TURN/STUN): localhost:3478

### Environment Configuration

Environment variables in `.env` at project root (checked into git but should be changed for production). Key variables:
- `NEXT_PUBLIC_API_URL` / `NEXT_PUBLIC_WS_URL`: Frontend API endpoints
- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_URL`: Redis connection string
- `JWT_SECRET` / `JWT_REFRESH_SECRET`: Auth tokens
- TURN/STUN configuration for WebRTC

## Code Organization

### Backend Architecture

**Modular DDD structure** with domain-driven design patterns:

```
src/
├── modules/              # Domain modules (auth, chat, meeting)
│   ├── auth/
│   │   ├── domain/       # Domain entities, aggregates, value objects
│   │   ├── application/  # Commands, queries, services
│   │   ├── events/       # Domain events
│   │   └── infrastructure/ # Repositories, external service implementations
│   ├── chat/
│   └── meeting/
├── controllers/          # HTTP request handlers (thin layer)
├── middlewares/          # Express middlewares (auth, validation, error handling)
├── validators/           # Request validation schemas (Zod)
├── sockets/              # Socket.IO event handlers and setup
├── shared/               # Cross-cutting concerns
│   ├── domain/          # Shared domain abstractions (DomainEvent interface)
│   ├── application/     # Shared application interfaces (DomainEventBus)
│   └── infrastructure/  # Shared infrastructure (InMemoryDomainEventBus, event handlers)
├── config/              # App configuration (env parsing)
├── utils/               # Helpers (logger, error handling, CORS)
├── app.ts               # Express app setup
└── server.ts            # HTTP server and graceful shutdown
```

**Event-driven architecture**: Domain events propagate through `DomainEventBus` for cross-module communication. Event handlers defined in `shared/infrastructure/events/default-domain-event-handlers.ts`.

**Database**: Prisma ORM with PostgreSQL. Schema at `prisma/schema.prisma`.

### Frontend Architecture

**Next.js 16+ App Router** with type-safe React components:

```
src/
├── app/
│   ├── (auth)/           # Public routes (login, register)
│   ├── (main)/           # Protected routes
│   │   ├── dashboard/
│   │   ├── meetings/
│   │   ├── meeting/[code]/ # Dynamic meeting room
│   │   └── settings/
│   └── layout.tsx, page.tsx
├── components/           # Reusable React components
├── store/                # Redux state management
│   ├── slices/          # Redux slices (authSlice, meetingSlice, chatSlice)
│   ├── selectors/       # Memoized selectors (authSelectors, meetingSelectors, etc.)
│   ├── sagas/           # Redux-Saga side effects for async operations
│   └── index.ts         # Store configuration
└── styles/              # TailwindCSS configuration
```

**State Management**: Redux Toolkit + Redux-Saga. Slices handle data, sagas handle async API calls and WebSocket events. Selectors provide memoized access to state.

**WebSocket**: Socket.IO client configured in sagas for real-time communication (chat messages, meeting events).

## Build & Deployment

### Building for Production

**Backend:**
```bash
cd backend
npm run build        # Compiles TypeScript to dist/
npm run typecheck    # Type check without emit
npm run lint         # ESLint
npm start            # Runs dist/server.js (requires env vars)
```

**Frontend:**
```bash
cd frontend
npm run build        # Next.js production build
npm start            # Runs production server
npm run lint         # Next.js ESLint
```

### Database Migrations

```bash
# In backend directory
npm run prisma:migrate          # Create and run migrations (dev)
npm run prisma:migrate:prod     # Deploy existing migrations (production)
npm run prisma:generate         # Regenerate Prisma client (after schema changes)
npm run prisma:seed             # Run seed script (if exists)
npm run prisma:studio           # Open Prisma Studio UI for data viewing
```

## Key Development Patterns

### Backend

- **Controllers**: Extract request/response handling, delegate to modules
- **Validators**: Use Zod for runtime request validation before controllers
- **Modules**: Each module is self-contained with domain logic; modules export only public APIs
- **Domain Events**: Emit domain events for cross-module side effects; listen via DomainEventBus
- **Error Handling**: Centralized in error.middleware.ts; structured error responses with code + message
- **Logging**: Pino logger (src/utils/logger.ts) for structured logs; use logger instead of console

### Frontend

- **Components**: Functional components with hooks; use client-side rendering where needed
- **Redux Slices**: Keep slice logic simple (just data mutations); complex logic in sagas
- **Sagas**: Handle async operations (API calls, WebSocket events); dispatch actions to update state
- **Selectors**: Memoize with `reselect` to prevent unnecessary re-renders
- **Socket.IO**: Initialized in root saga; socket events dispatched as Redux actions

## Testing & Validation

- Backend linting: `npm run lint` (ESLint in src/)
- Backend type checking: `npm run typecheck`
- Frontend linting: `npm run lint` (Next.js ESLint)
- No test suite configured yet; tests would live in `__tests__` or `*.test.ts` files

## Common Issues & Debugging

### Docker issues
- Containers won't start: Check logs with `docker compose logs <service>`
- Port conflicts: Change port mappings in docker-compose.yml (e.g., 4003:4000 means host:container)
- Database not ready: Services depend on health checks; wait a few seconds for postgres/redis

### Backend issues
- Module not found: Run `npm run prisma:generate` to regenerate Prisma client
- Env vars not loaded: Check .env exists at root and NODE_ENV is set
- Port already in use: Set BACKEND_PORT or PORT in .env or kill process on that port

### Frontend issues
- Components not updating: Check Redux state with Redux DevTools; verify sagas dispatch actions
- Socket.IO not connecting: Check NEXT_PUBLIC_API_URL and NEXT_PUBLIC_WS_URL in .env
- Build errors: Run `npm run lint` and `npm run typecheck` to find issues

## Architecture Decisions

1. **Modular DDD**: Modules can be independently developed and tested; domain logic stays in domain layer
2. **Event-driven cross-module communication**: Avoids tight coupling; scalable to additional modules
3. **Redux + Redux-Saga**: Predictable state; sagas handle complex async flows cleanly
4. **Prisma**: Type-safe database queries; migrations tracked in version control
5. **Socket.IO with Redis adapter**: WebSocket scaling across multiple backend instances
6. **Docker Compose**: Local dev matches production topology; services communicate via named network

## Notes for Future Instances

- Both frontend and backend are TypeScript; strict null checking enabled
- .env checked into git with dev defaults; **change JWT_SECRET, DB password, etc. for production**
- CORS configured dynamically in app.ts; update `isCorsOriginAllowed` for new origins
- Database connection pooling configured in Prisma schema; adjust for production load
- No database seeders present yet; add to prisma/seed.ts for dev data
