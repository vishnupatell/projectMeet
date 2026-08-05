# ProjectMeet

Scalable video conferencing and real-time chat platform with built-in recording,
AI transcription, meeting summarization, email invitations, and a full suite of
collaboration features including polls, breakout rooms, whiteboard, live captions,
virtual backgrounds, and more.

```
┌──────────────┐   WebRTC    ┌──────────────┐  REST/WS   ┌──────────────┐
│   Browser    │ ──────────▶ │   coturn     │            │   Backend    │
│ (Next.js UI) │ ◀────────── │  TURN/STUN   │  ◀──────▶  │ Express + IO │
└──────┬───────┘                                          └──────┬───────┘
       │                                                         │
       │ HTTP / WebSocket                                        │ Prisma
       ▼                                                         ▼
  localhost:3003                                          ┌──────────────┐
                                                          │  PostgreSQL  │
                                                          └──────────────┘
                                                          ┌──────────────┐
                                                          │    Redis     │  (pub/sub + session)
                                                          └──────────────┘
                                                          ┌──────────────┐
                                                          │  AI Service  │  (Whisper + Ollama)
                                                          └──────────────┘
```

---

## Table of Contents

1. [What's in the Box](#whats-in-the-box)
2. [New Features (v2)](#new-features-v2)
3. [Tech Stack](#tech-stack)
4. [Project Structure](#project-structure)
5. [Prerequisites](#prerequisites)
6. [Quick Start](#quick-start)
7. [Environment Configuration](#environment-configuration)
8. [Email (SMTP) Setup](#email-smtp-setup)
9. [Docker Operations Cheatsheet](#docker-operations-cheatsheet)
10. [Hot Reload & Developer Workflow](#hot-reload--developer-workflow)
11. [Volumes & Persistence](#volumes--persistence)
12. [Network & Ports](#network--ports)
13. [Database Migrations](#database-migrations)
14. [AI Service (Whisper + Ollama)](#ai-service-whisper--ollama)
15. [Live Transcript & AI Meeting Assistant](#live-transcript--ai-meeting-assistant)
16. [Running Without Docker](#running-without-docker)
17. [API Endpoints](#api-endpoints)
18. [Troubleshooting](#troubleshooting)

---

## What's in the Box

| Feature | Description |
|---|---|
| 1-to-many video meetings | WebRTC mesh with TURN fallback via coturn |
| Real-time chat | Socket.IO rooms per meeting, Redis pub/sub adapter for scale |
| Authentication | JWT access + refresh tokens, session table in Postgres |
| Recording | In-browser MediaRecorder; uploads to backend; stored on a shared volume |
| AI transcription | Whisper (faster-whisper) runs on recorded audio |
| AI summary + key points | Ollama (`llama3.2:3b`) summarizes the transcript |
| **Live in-meeting transcript** | CC button records mic audio, sends 15-second chunks to Whisper, shows captions and stores text in Redis |
| **AI Meeting Assistant** | Sparkles icon opens a chat panel — late joiners ask questions about what was discussed before they arrived; AI answers using the stored transcript |
| Meeting invitations | Email invites via nodemailer at meeting creation (instant or scheduled) |
| Meeting report page | Per-recording transcript, summary, and searchable segments |

---

## New Features (v2)

### 1. Screen Sharing & Collaborative Whiteboard
- One-click screen sharing via `getDisplayMedia()` WebRTC stream
- Real-time collaborative whiteboard with drawing tools, colors, stroke widths
- Undo, clear, and multi-user synchronized drawing via WebSocket

### 2. Breakout Rooms
- Host creates multiple breakout rooms and assigns participants
- Configurable timer for auto-return to main room
- Host can broadcast messages to all breakout rooms simultaneously
- Participants can join/leave rooms; host can move participants between rooms

### 3. Polls & Reactions
- Host creates live polls with multiple-choice options (up to 6 per poll)
- Real-time voting with live result visualization (bar charts)
- Anonymous or named voting modes
- Emoji reactions (👍 👏 ❤️ 😂 🎉 🔥 💯 🤔) with floating animations
- Rate-limited to prevent spam (1 reaction/second/user)

### 4. Virtual Backgrounds & Noise Suppression
- Background selection panel: None, Blur, or custom image backgrounds
- TensorFlow.js body segmentation support (loaded on demand)
- Noise suppression toggle using Web Audio API

### 5. Waiting Room / Lobby
- Configurable per-meeting: auto-admit vs. manual approval
- Participants see a branded waiting screen while host is notified
- Host can admit/deny individually or "Admit All"
- Secure by default for meetings with waiting room enabled

### 6. Meeting Analytics Dashboard
- Speaking time per participant (bar visualization)
- Total duration, peak participants, total participants
- Join/leave timeline log
- Admin-level system-wide analytics (all meetings, recordings, storage)

### 7. Calendar Integration Ready
- Meeting scheduling with date/time picker
- Email invitations with calendar-friendly links
- Structured `scheduledAt` field supports future Google Calendar / Outlook sync

### 8. File Sharing & Persistent Chat
- Upload/share files during meetings (up to 50MB per file)
- Files stored on server with metadata in database
- Download and delete capabilities
- Files persist after meeting ends
- Real-time notifications when files are shared

### 9. End-to-End Encryption (E2EE) Ready
- `e2eeEnabled` flag per meeting stored in database
- Socket.IO signaling architecture supports WebRTC Insertable Streams
- UI indicator shows encryption status

### 10. Webhook & API Integrations
- Users can register webhook URLs for specific events
- Supported events: `meeting.started`, `meeting.ended`, `recording.ready`, `participant.joined`, `participant.left`, `transcript.ready`
- HMAC-SHA256 signature verification for webhook payloads
- Compatible with Zapier/n8n webhook format

### 11. Admin Panel
- Full user management: view, ban/unban, promote to admin, demote
- System-wide statistics: users, meetings, recordings, storage
- Audit log of recent meeting activity
- Role-based access (ADMIN role required)

### 12. Mobile-Responsive PWA
- Progressive Web App with offline schedule caching
- Service worker for network-first caching strategy
- Push notification support (configurable)
- Responsive video grid adapts to mobile/tablet/desktop
- iOS and Android home screen installable
- Manifest with app shortcuts (New Meeting, Dashboard)

### 13. Action Items Extraction (AI)
- AI extracts action items/tasks from meeting transcripts via `/extract-actions` endpoint
- Each item has title, optional assignee, and optional due date
- Action items panel in meeting UI with status tracking (Pending → In Progress → Completed)
- Manual action item creation during meetings

### 14. Multi-language Live Captions & Translation
- Real-time speech-to-text captions during meetings
- AI-powered translation via `/translate` endpoint
- Participants choose their preferred caption language
- Supports any language pair that the LLM can handle

### Quick Wins Included
| Feature | Description |
|---|---|
| 🖐️ Raise Hand | Toggle raise/lower hand with visual indicator for all participants |
| ⏱️ Meeting Duration Timer | Live HH:MM:SS counter from meeting start |
| 🔗 Copy Invite Link | One-click copy meeting URL to clipboard |
| 🌙 Dark/Light Theme | Toggle between dark and light modes (persisted in Redux) |
| 📧 Recording Ready Notifications | Webhook events fired when recordings finish processing |
| 🛡️ Rate Limiting | Tiered rate limits: Auth (20/15min), API (120/min), Uploads (10/5min) |
| 🔒 Password-Protected Meetings | Optional meeting password verified on join |

---

## Tech Stack

**Backend** — Node.js 20, Express, TypeScript, Socket.IO, Prisma ORM,
PostgreSQL 16, Redis 7, Pino logger, Zod validation, nodemailer, express-rate-limit, helmet.

**Frontend** — Next.js 16 (App Router), React 18, Redux Toolkit + Redux-Saga,
TailwindCSS, Socket.IO client, native WebRTC APIs, PWA (Service Worker + Manifest).

**AI Service** — Python 3.11, FastAPI, faster-whisper, Ollama HTTP client,
ffmpeg for audio extraction, action-item extraction, multi-language translation.

**Infra** — Docker Compose, coturn TURN/STUN, bridged docker network, named
volumes for all persistent state.

---

## Project Structure

```
projectMeet/
├── backend/                    Node.js + Express + Socket.IO API
│   ├── src/
│   │   ├── controllers/        Thin HTTP handlers (auth, meeting, chat, recording,
│   │   │                       transcript, poll, breakout, webhook, analytics,
│   │   │                       fileshare, actionitem, admin)
│   │   ├── services/           Business logic (all above + invitation, mail)
│   │   ├── repositories/       Prisma data access
│   │   ├── routes/             Express route definitions (12 route modules)
│   │   ├── sockets/            Socket.IO event handlers (WebRTC, chat, polls,
│   │   │                       reactions, whiteboard, breakout, captions, waiting room)
│   │   ├── middlewares/        Auth, validation, error, upload
│   │   ├── validators/         Zod schemas
│   │   ├── modules/            DDD modules (auth, chat, meeting)
│   │   ├── shared/             Cross-cutting infra (domain event bus)
│   │   ├── config/             Env parsing, DB client
│   │   ├── utils/              Logger, helpers, error classes
│   │   ├── app.ts              Express app wiring (rate limiting, security)
│   │   └── server.ts           HTTP + WS server bootstrap
│   ├── prisma/
│   │   ├── schema.prisma       Data model (User, Meeting, Recording, Transcript,
│   │   │                       Poll, BreakoutRoom, SharedFile, Webhook,
│   │   │                       MeetingAnalytics, ActionItem, …)
│   │   └── migrations/         Version-controlled SQL migrations
│   ├── uploads/                Shared file uploads directory
│   └── Dockerfile
│
├── frontend/                   Next.js 16 App Router (PWA)
│   ├── public/
│   │   ├── manifest.json       PWA manifest
│   │   └── sw.js               Service worker
│   ├── src/
│   │   ├── app/
│   │   │   ├── (auth)/         Login / Register
│   │   │   └── (main)/         Dashboard, Meetings, Settings, Admin, /meeting/[code]
│   │   ├── components/
│   │   │   ├── meeting/        VideoTile, MeetingControls, EnhancedControls,
│   │   │   │                   ReactionBar, RaiseHand, PollPanel, Whiteboard,
│   │   │   │                   BreakoutRoomPanel, WaitingRoom, LiveCaptions,
│   │   │   │                   FileSharePanel, ActionItemPanel, VirtualBackground,
│   │   │   │                   MeetingTimer, CopyInviteLink, MeetingAnalytics,
│   │   │   │                   LiveTranscript, MeetingAIAssistant
│   │   │   ├── ui/            ThemeToggle, common UI elements
│   │   │   ├── chat/          Chat panel components
│   │   │   └── layout/        Layout components
│   │   ├── store/
│   │   │   ├── slices/         Redux Toolkit slices (auth, meeting, chat, recording, features)
│   │   │   ├── sagas/          Async flows (auth, meeting, chat, recording, features)
│   │   │   └── selectors/      Memoized selectors
│   │   ├── lib/services/       API client, socket, WebRTC service
│   │   ├── lib/hooks/
│   │   └── types/              TypeScript interfaces (all models)
│   └── Dockerfile
│
├── ai-service/                 Python FastAPI — Whisper + Ollama
│   ├── app.py                  Endpoints: transcribe, summarize, ask,
│   │                           extract-actions, translate
│   ├── requirements.txt
│   └── Dockerfile
│
├── coturn/
│   └── turnserver.conf         TURN/STUN config mounted read-only into coturn
│
├── docker-compose.yml          Full-stack orchestration
├── .env                        Root-level env (read by docker-compose interpolation)
├── CLAUDE.md                   AI assistant project guidance
└── README.md
```

---

## Prerequisites

- Docker Engine **≥ 24** and Docker Compose v2 (`docker compose …`)
- 8 GB RAM recommended (Ollama + Whisper are memory-hungry)
- ~15 GB free disk for images, models, and recordings
- Free host ports: `3003, 4003, 5433, 6379, 3478, 8001, 11435`

---

## Quick Start

```bash
git clone <this-repo>
cd projectMeet

# Copy the env template and tweak if needed
cp .env.example .env   # or edit the existing .env

# Build and start everything
docker compose up -d --build

# Tail logs while things boot
docker compose logs -f

# Pull the LLM once (first boot only)
docker compose exec ollama ollama pull llama3.2:3b
```

Open:

- Frontend — http://localhost:3003
- Backend API — http://localhost:4003/api (health: `/api/health`)
- AI Service — http://localhost:8001/docs

The first `docker compose up` will build the backend, frontend, and ai-service
images, run Prisma migrations on container start, and leave everything behind
a single bridged network (`projectmeet-network`).

---

## Environment Configuration

The root `.env` file is the single source of truth. Docker Compose interpolates
values from it into every container. **Change every secret before deploying.**

### Core variables

| Variable | Purpose |
|---|---|
| `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` | Postgres credentials |
| `DATABASE_URL` | Prisma connection string (use `postgres` host inside containers) |
| `REDIS_URL` | Redis connection (`redis://redis:6379` inside containers) |
| `JWT_SECRET` / `JWT_REFRESH_SECRET` | Sign auth tokens — rotate in production |
| `JWT_EXPIRATION` / `JWT_REFRESH_EXPIRATION` | Token lifetimes (e.g. `15m`, `7d`) |
| `NODE_ENV` | `development` or `production` |
| `NEXT_PUBLIC_API_URL` | Public REST endpoint the browser calls |
| `NEXT_PUBLIC_WS_URL` | Public WebSocket endpoint the browser connects to |
| `NEXT_PUBLIC_APP_NAME` | Shown in UI headers |
| `TURN_SERVER_URL` / `TURN_USERNAME` / `TURN_PASSWORD` | coturn auth (match `coturn/turnserver.conf`) |
| `STUN_SERVER_URL` | Public STUN (Google is fine for dev) |
| `TURN_REALM` / `TURN_MIN_PORT` / `TURN_MAX_PORT` | coturn config |
| `RECORDINGS_DIR` | Backend-side recordings path (default `/app/recordings`) |
| `AI_SERVICE_URL` | Backend → AI Service URL (default `http://ai-service:8000`) |
| `APP_URL` | Public frontend URL used in email invite links |

### SMTP (email invitations) — see next section

---

## Email (SMTP) Setup

Meeting invitations are sent via nodemailer when a user adds emails in the
**Start a meeting** or **Schedule a meeting** modal. If SMTP isn't configured,
the backend **logs the invitation payload instead of sending** — the flow still
works end-to-end, emails just don't leave the server.

Add the following to the **root `.env`** (all values optional — leave `SMTP_HOST`
blank to stay in log-only mode):

```bash
# Public URL used inside invitation emails
APP_URL=http://localhost:3003

# SMTP transport
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false            # true for port 465
SMTP_USER=you@example.com
SMTP_PASS=your_app_password
SMTP_FROM=ProjectMeet <you@example.com>
```

You must also pass these through to the backend container. Edit
`docker-compose.yml` → `backend.environment` and append:

```yaml
      APP_URL: ${APP_URL}
      SMTP_HOST: ${SMTP_HOST}
      SMTP_PORT: ${SMTP_PORT}
      SMTP_SECURE: ${SMTP_SECURE}
      SMTP_USER: ${SMTP_USER}
      SMTP_PASS: ${SMTP_PASS}
      SMTP_FROM: ${SMTP_FROM}
```

Then restart the backend:

```bash
docker compose up -d backend
```

### Provider-specific notes

- **Gmail** — enable 2FA, then create an [App Password](https://myaccount.google.com/apppasswords)
  and use it as `SMTP_PASS`. Host `smtp.gmail.com`, port `587`, `SMTP_SECURE=false`.
- **Mailtrap (dev inbox)** — grab SMTP creds from your Mailtrap inbox. Emails
  land in the Mailtrap UI instead of real inboxes — ideal for testing.
- **SendGrid / AWS SES / Mailgun** — use the SMTP credentials each provider
  issues. The `SMTP_FROM` address usually needs to be verified on the provider
  dashboard first.

### How the flow works

1. User adds emails in a chip input, submits the meeting form
2. Backend validates emails (Zod), persists one `MeetingInvitation` row per
   address with status `PENDING`
3. Invites are fired **asynchronously** — the API response returns immediately,
   so meeting creation is never blocked by SMTP latency
4. On success the row flips to `SENT` with a `sentAt` timestamp; on failure it
   goes to `FAILED` with `errorMsg` for later inspection

---

## Docker Operations Cheatsheet

```bash
# Start everything (detached)
docker compose up -d

# Start with rebuild (use after Dockerfile or dependency changes)
docker compose up -d --build

# Start only a subset
docker compose up -d postgres redis backend

# Stop everything (keeps data)
docker compose down

# Stop AND wipe all volumes (destroys DB, recordings, models)
docker compose down -v

# Restart one service
docker compose restart backend

# Tail logs
docker compose logs -f                 # all services
docker compose logs -f backend ai-service

# Shell into a running container
docker compose exec backend sh
docker compose exec postgres psql -U projectmeet -d projectmeet

# Install a backend dep without rebuilding the image
docker compose exec backend npm install <pkg>

# Run a one-off command in a new container
docker compose run --rm backend npm run lint

# See service status and health
docker compose ps
```

---

## Hot Reload & Developer Workflow

Both backend and frontend run in dev mode inside their containers and hot
reload on file changes. This works because the host source directory is
bind-mounted into the container:

```yaml
# docker-compose.yml (backend)
volumes:
  - ./backend:/app           # host source → container /app  (writes sync both ways)
  - /app/node_modules        # anonymous volume shadows the host node_modules
  - recordings_data:/app/recordings
```

- **Backend** runs `tsx watch src/server.ts` — edits to any `.ts` file under
  `backend/src/` trigger an automatic restart (watch logs for `Restarting …`).
- **Frontend** runs `next dev` — Next.js Fast Refresh updates the browser
  without a reload; full route recompiles take ~1s.

The `/app/node_modules` anonymous-volume trick prevents your host's
`node_modules` (which may have been installed for a different OS/arch from
running `npm install` on your laptop) from clobbering the image's correctly
built `node_modules`. **If you add a dependency, do it inside the container:**

```bash
docker compose exec backend npm install <pkg>
docker compose exec frontend npm install <pkg>
```

Then restart that one service. Changes to `package.json` persist through the
bind-mount, so they survive container restarts.

### AI service hot reload

The `ai-service` container does **not** bind-mount source code — it bakes
`app.py` into the image. To iterate on AI code, either:

```bash
# Option A: rebuild just the ai-service image
docker compose up -d --build ai-service

# Option B: add a bind-mount temporarily (docker-compose.override.yml)
# services:
#   ai-service:
#     volumes:
#       - ./ai-service:/app
#     command: uvicorn app:app --host 0.0.0.0 --port 8000 --reload
```

---

## Volumes & Persistence

All stateful data lives in **named volumes** managed by Docker. They survive
`docker compose down` but are wiped by `docker compose down -v`.

| Volume | Mounted in | What it stores |
|---|---|---|
| `postgres_data` | `postgres:/var/lib/postgresql/data` | All application data — users, meetings, messages, invitations, transcripts |
| `redis_data` | `redis:/data` | Redis AOF persistence for pub/sub state |
| `recordings_data` | `backend:/app/recordings` **and** `ai-service:/recordings` | Meeting recordings — **shared between the two services so Whisper can read what the backend wrote** |
| `ollama_data` | `ollama:/root/.ollama` | Downloaded LLM weights (`llama3.2:3b` is ~2 GB) |
| `whisper_models` | `ai-service:/root/.cache/huggingface` | Cached Whisper model weights |

### Inspect / back up a volume

```bash
# List volumes
docker volume ls | grep projectmeet

# Inspect a volume (shows mount point on host)
docker volume inspect projectmeet_postgres_data

# Dump Postgres
docker compose exec postgres pg_dump -U projectmeet projectmeet > backup.sql

# Restore Postgres
cat backup.sql | docker compose exec -T postgres psql -U projectmeet -d projectmeet
```

---

## Network & Ports

All containers join a single bridge network named `projectmeet-network`.
Inside the network, services reach each other by container name
(e.g. `postgres`, `redis`, `ai-service`, `ollama`). Host-to-container port
mappings:

| Service | Container port | Host port | Notes |
|---|---|---|---|
| frontend | 3000 | **3003** | Next.js dev server |
| backend | 4000 | **4003** | Express + Socket.IO |
| postgres | 5432 | **5433** | Avoids clash with a local Postgres |
| redis | 6379 | 6379 | |
| coturn | 3478 (TCP+UDP) | 3478 | Plus UDP `49152-49200` for media relay |
| ai-service | 8000 | **8001** | FastAPI (`/docs` for Swagger) |
| ollama | 11434 | **11435** | Ollama HTTP API |

---

## Database Migrations

Prisma migrations live in `backend/prisma/migrations/` and are applied inside
the backend container.

```bash
# Create + apply a new migration (dev)
docker compose exec backend npx prisma migrate dev --name <change_name>

# Apply pending migrations only (production)
docker compose exec backend npx prisma migrate deploy

# Regenerate the Prisma client (after editing schema.prisma)
docker compose exec backend npx prisma generate

# Open Prisma Studio (GUI for the DB)
docker compose exec backend npx prisma studio
# then visit http://localhost:5555 — you may need to expose the port
```

The schema lives at `backend/prisma/schema.prisma`. Current models include:
`User`, `Session`, `Meeting`, `MeetingParticipant`, `MeetingInvitation`, `Chat`,
`ChatMember`, `Message`, `Recording`, `Transcript`.

---

## AI Service (Whisper + Ollama)

The AI pipeline runs as two containers:

1. **ollama** — serves local LLMs via the Ollama HTTP API. On first boot the
   model cache is empty; pull a model once:
   ```bash
   docker compose exec ollama ollama pull llama3.2:3b
   ```
   Swap the model by editing `docker-compose.yml` → `ai-service.environment.OLLAMA_MODEL`.

2. **ai-service** — FastAPI app that:
   - Accepts a recording reference from the backend
   - Reads the file from the shared `recordings_data` volume
   - Transcribes with `faster-whisper` (model set via `WHISPER_MODEL`, default `base`)
   - Summarizes the transcript with Ollama and returns segments, summary, and key points

The backend posts to `AI_SERVICE_URL` (defaults to `http://ai-service:8000`) and
stores the result in the `Transcript` table, surfacing it on the Meeting Report
page.

**CPU-only by default.** For GPU inference, add a `deploy.resources.reservations.devices`
block with NVIDIA runtime to the `ollama` and `ai-service` services, and flip
`WHISPER_DEVICE=cuda`.

---

## Live Transcript & AI Meeting Assistant

### Live Transcript (CC button)

During any active meeting a **CC (closed captions)** button appears in the
bottom control bar. Clicking it starts in-browser audio capture using the
`MediaRecorder` API:

1. Microphone audio is recorded in 15-second chunks (`audio/webm;codecs=opus`).
2. Each chunk is sent directly from the browser to the AI service
   (`POST http://localhost:8001/transcribe-upload`).
3. The transcribed text is displayed as scrolling captions above the controls
   **and simultaneously pushed to the backend**
   (`POST /api/meetings/:id/live-segment`), where it is appended to a Redis
   list with a 4-hour TTL.
4. Clicking CC again stops the recorder and clears the caption bar.

No video is captured — only the user's own microphone stream.

### AI Meeting Assistant (✨ Sparkles icon)

A ✨ **Sparkles** icon sits in the top-right of the meeting info bar. Clicking
it opens a side panel — no transcript is shown unless asked:

```
┌────────────────────────────────────┐
│ ✨ AI Meeting Assistant        ✕   │
│────────────────────────────────────│
│ 🤖  Hi! Ask me anything about      │
│     what's been discussed…         │
│                                    │
│  You ▶  was my name mentioned?     │
│  🤖  Based on the transcript, your │
│       name came up at 1:42 when…   │
│                                    │
│ ┌──────────────────────────────┐   │
│ │ Ask about the meeting…  [▶]  │   │
│ └──────────────────────────────┘   │
│ Powered by Whisper + Llama         │
└────────────────────────────────────┘
```

**Typical late-joiner flow:**

1. Join the meeting 10 minutes late.
2. Click ✨ in the top bar.
3. Type: *"Give me a quick summary"* or *"Was my name mentioned?"*
4. The backend (`POST /api/meetings/:id/ask`):
   - Fetches the accumulated live-transcript text from Redis.
   - Falls back to any DB-stored recording transcripts if no live text exists.
   - Looks up the requesting user's `displayName` from their profile and passes
     it to the AI so it can search for name mentions.
   - Forwards everything to the AI service (`POST /ask`) which uses Ollama
     (Llama 3.2 3B) to answer the question in context.
5. The answer appears in the chat panel within a few seconds.

### API endpoints added

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/meetings/:id/live-segment` | Append a transcript segment to the Redis live-transcript list |
| `POST` | `/api/meetings/:id/ask` | Ask the AI a question about the meeting; returns `{ answer }` |
| `POST` | `/transcribe-upload` *(AI service)* | Accept a raw audio blob and return Whisper transcript |
| `POST` | `/ask` *(AI service)* | Answer a question given a transcript and optional user name |

### Environment variable

| Variable | Default | Purpose |
|---|---|---|
| `NEXT_PUBLIC_AI_SERVICE_URL` | `http://localhost:8001` | Browser → AI service URL used for live chunk transcription |

---

## Running Without Docker

You generally don't need to — Compose is the supported path. But if you want to
run backend or frontend natively against Dockerized infra:

```bash
# Start only the stateful services
docker compose up -d postgres redis coturn

# Backend
cd backend
npm install
npm run prisma:generate
npm run prisma:migrate
# Point DATABASE_URL at localhost:5433 in backend/.env or shell env
DATABASE_URL=postgresql://projectmeet:projectmeet_secret_2024@localhost:5433/projectmeet?schema=public \
REDIS_URL=redis://localhost:6379 \
npm run dev

# Frontend (new terminal)
cd frontend
npm install
NEXT_PUBLIC_API_URL=http://localhost:4000/api \
NEXT_PUBLIC_WS_URL=http://localhost:4000 \
npm run dev
```

---

## API Endpoints

### Core Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/refresh` | Refresh access token |
| POST | `/api/auth/logout` | Logout |
| GET | `/api/meetings` | List user's meetings |
| POST | `/api/meetings` | Create meeting (supports `password`, `waitingRoomEnabled`, `e2eeEnabled`) |
| POST | `/api/meetings/join` | Join meeting by code |
| GET | `/api/chats/:chatId/messages` | Get chat messages |
| POST | `/api/recordings/upload` | Upload recording |
| GET | `/api/transcripts/:id` | Get transcript with summary |

### New Feature Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/polls/meeting/:meetingId` | Create poll |
| GET | `/api/polls/meeting/:meetingId` | List meeting polls |
| POST | `/api/polls/:pollId/vote` | Vote on poll |
| POST | `/api/polls/:pollId/close` | Close poll |
| GET | `/api/polls/:pollId/results` | Get poll results |
| POST | `/api/breakout-rooms/meeting/:meetingId` | Create breakout rooms |
| GET | `/api/breakout-rooms/meeting/:meetingId` | List breakout rooms |
| POST | `/api/breakout-rooms/meeting/:meetingId/close` | Close all rooms |
| POST | `/api/breakout-rooms/:roomId/move` | Move participant |
| POST | `/api/files/meeting/:meetingId` | Upload file (multipart) |
| GET | `/api/files/meeting/:meetingId` | List shared files |
| DELETE | `/api/files/:fileId` | Delete file |
| POST | `/api/webhooks` | Create webhook |
| GET | `/api/webhooks` | List user's webhooks |
| DELETE | `/api/webhooks/:webhookId` | Delete webhook |
| GET | `/api/analytics/meeting/:meetingId` | Get meeting analytics |
| GET | `/api/analytics/admin/stats` | System-wide stats |
| POST | `/api/action-items/meeting/:meetingId` | Create action item |
| GET | `/api/action-items/meeting/:meetingId` | List action items |
| PATCH | `/api/action-items/:itemId` | Update action item |
| DELETE | `/api/action-items/:itemId` | Delete action item |
| GET | `/api/admin/users` | List all users (admin) |
| POST | `/api/admin/users/:userId/toggle-active` | Ban/unban user |
| POST | `/api/admin/users/:userId/promote` | Promote to admin |
| GET | `/api/admin/stats` | System statistics |
| GET | `/api/admin/audit-log` | Audit log |

### AI Service Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/transcribe` | Transcribe audio file by path |
| POST | `/transcribe-upload` | Transcribe uploaded audio blob |
| POST | `/summarize` | Summarize transcript text |
| POST | `/ask` | AI assistant answers questions from transcript |
| POST | `/extract-actions` | Extract action items from transcript |
| POST | `/translate` | Translate text to target language |
| GET | `/health` | Health check |

### Socket.IO Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `meeting:join` | Client → Server | Join meeting room (supports `password`) |
| `meeting:leave` | Client → Server | Leave meeting |
| `meeting:reaction` | Bidirectional | Send/receive emoji reactions |
| `meeting:raise-hand` | Bidirectional | Toggle raise hand |
| `meeting:caption` | Bidirectional | Live caption text |
| `meeting:request-translation` | Client → Server | Request caption translation |
| `meeting:admit-participant` | Client → Server | Admit from waiting room |
| `meeting:admit-all` | Client → Server | Admit all waiting |
| `meeting:deny-participant` | Client → Server | Deny from waiting room |
| `poll:created` | Bidirectional | New poll notification |
| `poll:voted` | Bidirectional | Vote update |
| `poll:closed` | Bidirectional | Poll closed |
| `whiteboard:draw` | Bidirectional | Drawing strokes |
| `whiteboard:clear` | Bidirectional | Clear canvas |
| `whiteboard:undo` | Bidirectional | Undo last stroke |
| `breakout:join` | Client → Server | Join breakout room |
| `breakout:leave` | Client → Server | Leave breakout room |
| `breakout:broadcast` | Client → Server | Host broadcast |
| `breakout:close-all` | Client → Server | Close all breakouts |
| `meeting:file-shared` | Bidirectional | File shared notification |
| `meeting:speaking-start` | Client → Server | Speaking indicator |
| `meeting:speaking-stop` | Client → Server | Stop speaking (with duration) |

---

## Troubleshooting

**Containers won't start** — `docker compose logs <service>`. Port conflicts
are the most common cause; adjust the host port in `docker-compose.yml`.

**`P1001: Can't reach database server at postgres:5432`** — you're running
Prisma from the host instead of inside the container. Prefix with
`docker compose exec backend …` or export
`DATABASE_URL=postgresql://…@localhost:5433/…` first.

**Module not found after adding a dep** — you installed on the host instead of
in the container. Run `docker compose exec <service> npm install <pkg>` then
restart that service.

**WebRTC peers can't see each other across networks** — coturn isn't reachable
on UDP `3478` (or relay ports `49152–49200`). Open the ports on your firewall
and make sure `TURN_SERVER_URL` in `.env` points to a hostname your clients
can resolve (not `localhost` if peers are on different machines).

**Frontend shows stale code** — Next's `.next` cache can get wedged. Clear it:
```bash
docker compose exec frontend rm -rf .next
docker compose restart frontend
```

**Ollama returns 404 on model** — you never pulled it. Run
`docker compose exec ollama ollama pull llama3.2:3b`.

**Emails don't arrive** — check `docker compose logs backend | grep -i smtp`.
If SMTP isn't configured, invitations are persisted and logged but no email is
sent (by design). Set `SMTP_HOST` and related vars, pass them through to the
backend in `docker-compose.yml`, and `docker compose up -d backend`.

**Recordings not transcribing** — verify both backend and ai-service have the
same `recordings_data` volume mounted and that the file exists at the expected
path. `docker compose exec ai-service ls /recordings` should show it.
# ProjectMeet

A self-hosted video conferencing platform with real-time chat, meeting recording, and **zero-cost AI-powered post-meeting reports** (transcription + summary) — all running locally.

Built end-to-end: WebRTC video, Socket.IO chat, Whisper transcription, and Llama 3.2 summarization via Ollama.

---

## Features

- **Video conferencing** — WebRTC peer-to-peer with coturn TURN/STUN for NAT traversal
- **Real-time chat** — Socket.IO with Redis adapter for horizontal scaling
- **Screen sharing** — share your screen during meetings
- **Meeting recording** — MediaRecorder API captures meetings to webm/mp4
- **AI post-meeting reports** — every recording automatically produces:
  - Full transcript with clickable timestamped segments
  - ~20-line AI summary of what was discussed
  - 5-8 key discussion points
- **Auth** — JWT access + refresh tokens, session management, logout-everywhere
- **Fully Dockerized** — `docker compose up -d` and the whole stack runs

---

## Architecture

```
 ┌──────────────┐    HTTPS / WSS    ┌──────────────────┐
 │   Next.js    │ ────────────────► │   Express API    │
 │   Frontend   │ ◄──── Socket.IO ─►│   + Socket.IO    │
 │  (Redux +    │                    │   (Node/TS)      │
 │   Sagas)     │                    └────────┬─────────┘
 └──────┬───────┘                             │
        │ WebRTC                              │ Prisma
        ▼                                     ▼
 ┌──────────────┐                    ┌─────────────────┐
 │   coturn     │                    │   PostgreSQL    │
 │ (TURN/STUN)  │                    │      +          │
 └──────────────┘                    │   Redis pub/sub │
                                     └─────────────────┘

 Meeting ends ── recording uploads ──► backend ──HTTP──► ai-service
                                                          │    │
                                         ┌────────────────┘    │
                                         ▼                     ▼
                                 ┌──────────────┐      ┌──────────────┐
                                 │   Whisper    │      │    Ollama    │
                                 │ (transcribe) │      │ (llama3.2:3b │
                                 │              │      │  summarize)  │
                                 └──────────────┘      └──────────────┘
```

### Tech stack

**Frontend**
- Next.js 16 (App Router, React 18)
- Redux Toolkit + Redux-Saga
- TailwindCSS
- Socket.IO client
- WebRTC

**Backend**
- Node.js + Express + TypeScript
- Modular DDD (domain / application / infrastructure layers)
- Domain-event bus for cross-module communication
- Prisma ORM (PostgreSQL)
- Socket.IO with Redis adapter
- Zod validation, Pino structured logs, JWT auth

**Infra / AI**
- PostgreSQL 16, Redis 7
- coturn (TURN/STUN)
- Python FastAPI AI sidecar
- faster-whisper (`base` model, CPU int8)
- Ollama + Llama 3.2 3B
- Docker Compose

---

## Quick start

### Prerequisites

- Docker + Docker Compose
- ~8 GB free disk space (for AI models)
- 4 GB+ RAM recommended

### Setup

```bash
# 1. Clone
git clone https://github.com/<your-username>/projectMeet.git
cd projectMeet

# 2. Create your .env from the template
cp .env.example .env
# Edit .env and set JWT_SECRET, JWT_REFRESH_SECRET, POSTGRES_PASSWORD, TURN_PASSWORD

# 3. Start the stack
docker compose up -d

# 4. First-time: pull the Llama model into Ollama (~2 GB, one-time)
docker exec projectmeet-ollama ollama pull llama3.2:3b

# 5. Open the app
open http://localhost:3003
```

### Ports

| Service       | Port  | URL                          |
|---------------|-------|------------------------------|
| Frontend      | 3003  | http://localhost:3003        |
| Backend API   | 4003  | http://localhost:4003/api    |
| AI service    | 8001  | http://localhost:8001/health |
| Ollama        | 11435 | http://localhost:11435       |
| PostgreSQL    | 5433  | localhost:5433               |
| Redis         | 6379  | localhost:6379               |
| coturn        | 3478  | localhost:3478               |

---

## Using the app

1. Register an account at `http://localhost:3003/register`
2. Create a meeting from the dashboard
3. Join the meeting room — enable mic/camera/screen-share
4. Click the red record button to start recording
5. End the meeting when done
6. On the meetings page, click the **📄 report icon** next to the ended meeting
7. The report page shows the video, AI summary, and clickable transcript

The transcript pipeline runs automatically in the background as soon as a recording is uploaded. First recording takes ~2-5 min on CPU (Whisper model download + inference + Llama summarization).

---

## API reference

See [ProjectMeet_API_Reference.xlsx](ProjectMeet_API_Reference.xlsx) for the full API reference with cURL examples, Postman bodies, and response shapes for every endpoint:

- **Auth** — register, login, refresh, logout, profile
- **Meetings** — create, list, join, leave, end, ice-servers
- **Chat** — create chat, list chats, get messages, send message
- **Recordings** — upload, list, download, delete
- **Transcripts** — get by recording, generate, get by meeting
- **AI Service** — `/health`, `/transcribe`, `/summarize`

---

## Project structure

```
projectMeet/
├── backend/               # Node + Express + Socket.IO
│   ├── src/
│   │   ├── modules/       # DDD modules: auth, chat, meeting
│   │   ├── controllers/   # HTTP handlers
│   │   ├── services/      # Domain/application services
│   │   ├── sockets/       # Socket.IO event handlers
│   │   ├── shared/        # Domain-event bus, shared abstractions
│   │   └── routes/        # Route definitions
│   └── prisma/            # Schema + migrations
├── frontend/              # Next.js 16 + Redux + TailwindCSS
│   └── src/
│       ├── app/           # App Router pages
│       ├── components/    # Reusable React components
│       ├── store/         # Redux slices + sagas + selectors
│       └── lib/           # API client, WebRTC helpers
├── ai-service/            # Python FastAPI sidecar
│   ├── app.py             # Whisper + Ollama endpoints
│   ├── Dockerfile
│   └── requirements.txt
├── coturn/                # TURN/STUN server config
├── docker-compose.yml     # Full-stack orchestration
├── .env.example           # Config template
└── CLAUDE.md              # Dev guide (for Claude Code)
```

---

## Development (without Docker)

**Backend:**
```bash
cd backend
npm install
npm run prisma:generate
npm run prisma:migrate
npm run dev          # http://localhost:4000
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev          # http://localhost:3000
```

**AI service:**
```bash
cd ai-service
pip install -r requirements.txt
# Needs Ollama running locally: https://ollama.ai
uvicorn app:app --reload --port 8000
```

---

## Useful commands

```bash
# View logs
docker compose logs -f backend
docker compose logs -f ai-service

# Reset the database
docker compose down -v
docker compose up -d

# Run Prisma migrations
docker compose exec backend npx prisma migrate deploy

# Open Prisma Studio
docker compose exec backend npx prisma studio   # http://localhost:5555

# Health checks
curl http://localhost:4003/api/health
curl http://localhost:8001/health
```

---

## Design decisions

- **Modular DDD** — each module (`auth`, `chat`, `meeting`) is self-contained with its own domain/application/infrastructure layers. Cross-module communication goes through the domain-event bus, not direct imports.
- **Redux-Saga over thunks** — complex async flows (socket events, recording uploads, retry logic) are easier to model as sagas.
- **Socket.IO + Redis adapter** — lets you scale backend horizontally; sticky sessions aren't needed.
- **Self-hosted AI** — Whisper + Llama gives feature parity with Deepgram + GPT at zero ongoing cost. Trade-off is CPU inference latency (~30-60s for summary).
- **Prisma + migrations in git** — schema changes are tracked and reviewable.

---

## License

MIT

---

## Author

Built by **Vishnu** as a full-stack exploration of WebRTC, real-time systems, and self-hosted AI.
