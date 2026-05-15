# ProjectMeet Frontend

Next.js 16 App Router frontend for ProjectMeet. For the project overview, architecture diagram, and full-stack setup, see the [root README](../README.md).

## Stack

- **Next.js 16** (App Router, React 18, Turbopack)
- **Redux Toolkit + Redux-Saga** — state + async side effects
- **TailwindCSS** — styling
- **Socket.IO client** — realtime chat + meeting events
- **WebRTC** — peer-to-peer video/audio/screen

## Run locally

```bash
npm install
npm run dev      # http://localhost:3000
npm run build
npm run lint
```

The dev server expects the backend on the URLs set in `NEXT_PUBLIC_API_URL` / `NEXT_PUBLIC_WS_URL` (see [.env.example](../.env.example) at repo root).

## Structure

```
src/
├── app/
│   ├── (auth)/                    # Public routes: login, register
│   └── (main)/                    # Authenticated routes
│       ├── dashboard/
│       ├── meetings/              # Meetings list
│       │   └── [id]/report/       # Post-meeting report (video + transcript + AI summary)
│       ├── meeting/[code]/        # Live meeting room
│       └── settings/
├── components/                    # Reusable UI (MeetingControls, Modal, Topbar, ...)
├── store/
│   ├── slices/                    # authSlice, meetingSlice, chatSlice, recordingSlice
│   ├── sagas/                     # Async flows + socket events
│   ├── selectors/                 # Memoized selectors (reselect)
│   └── index.ts
└── lib/
    ├── services/api.ts            # HTTP API client (auth-aware)
    └── hooks/useStore.ts          # Typed Redux hooks
```

## Conventions

- **Slices** hold plain state, no side effects. Complex flows (API calls, socket events, retry logic) live in **sagas**.
- Components consume state through **memoized selectors**, never raw `useSelector(state => state.x)`.
- API calls go through `apiClient` ([src/lib/services/api.ts](src/lib/services/api.ts)) — it handles JWT, auto-refresh on 401, and redirects to `/login` on hard auth failure.
- Socket.IO is initialized in the root saga; incoming events are dispatched as Redux actions.

## Key flows

- **Login / register** — `authSaga` stores `accessToken` + `refreshToken` in `localStorage`, then fetches profile
- **Join meeting** — `meetingSaga` calls `/api/meetings/join`, then opens WebRTC peer connections via the signaling socket
- **Record meeting** — `MediaRecorder` captures the combined stream; on stop, `recordingSaga` uploads via multipart to `/api/recordings/upload`
- **View report** — `/meetings/[id]/report` polls `/api/transcripts/meeting/:id` every 5s while status is `PENDING` / `TRANSCRIBING` / `SUMMARIZING`
