# Collabify

A brand↔creator campaign collaboration platform — built as a single project that
exercises the full stack from your list end to end, rather than bolting each
technology on separately.

**The premise:** brands post paid campaigns, creators pitch and get accepted,
the two sides negotiate over live chat or a quick video call, and creators
upload video deliverables that get encoded and thumbnailed automatically.
Every one of those steps needs a different tool, which is what makes it a
good vehicle for this stack.

## Why each piece of tech is there (not just listed)

| Tech | Where it's used | Why it's the right tool |
|---|---|---|
| **Next.js / TypeScript / Tailwind** | `apps/web` | App Router pages for the two dashboards, campaign detail, and the live call room. |
| **Redux Toolkit (RTK + RTK Query)** | `apps/web/src/store` | RTK Query owns REST data (campaigns, applications) with cache tags; plain slices hold live socket state (chat, presence) that doesn't fit a request/response model. |
| **Bun / Elysia** | `apps/api` | Fast, typed REST layer. Bun also does password hashing and file writes natively, no extra deps. |
| **Drizzle ORM / PostgreSQL** | `apps/api/src/db` | Typed schema for users, campaigns, applications, submissions, messages, and an analytics counters table the worker writes to. |
| **Socket.io + Redis adapter** | `apps/api/src/sockets` | Campaign chat and WebRTC signaling. The Redis adapter is what lets this scale past one API process — a message from a user on instance A reaches a user connected to instance B. |
| **Redis** (beyond the socket adapter) | `apps/api/src/lib/redis.ts` | Caches the campaign list (30s TTL) and backs BullMQ. |
| **BullMQ** | `apps/api/src/lib/queue.ts` (producer) → `apps/worker` (consumer) | Video upload enqueues a transcode job instead of blocking the request; a separate queue handles push notifications so a burst of one never starves the other. |
| **FFmpeg** (via `fluent-ffmpeg`) | `apps/worker/src/processors/videoProcessor.ts` | Generates a thumbnail and transcodes whatever codec a phone produced into a web-friendly H.264/AAC MP4. |
| **Kafka** | `apps/api/src/lib/kafka.ts` (producer) → `apps/worker/src/kafka/analyticsConsumer.ts` (consumer) | Campaign views, submission views, and applications are streamed as events rather than written straight to Postgres on every request — the worker aggregates them in Redis and flushes to Postgres every 10s. |
| **WebRTC** | `apps/web/src/lib/webrtc.ts` + `/live/[roomId]` | 1:1 live video pitch call between brand and creator, signaled over the existing Socket.io connection. |
| **Firebase (FCM)** | `apps/api/src/lib/firebase.ts`, `apps/worker/src/processors/notificationProcessor.ts`, `apps/web/src/lib/firebase.ts` | Push notification when a brand gets a new application — sent from the worker so a Firebase outage never blocks the request that triggered it. |

## Structure

```
collabify/
├── apps/
│   ├── web/      Next.js frontend (RTK, Tailwind, TypeScript)
│   ├── api/      Bun + Elysia REST API, Drizzle/Postgres, Socket.io, Kafka producer, BullMQ producer
│   └── worker/   BullMQ consumers (video, notifications) + Kafka consumer (analytics)
├── packages/
│   └── shared/   TypeScript types + socket/kafka/job contracts shared by all three apps
└── docker-compose.yml   Postgres, Redis, Kafka (KRaft mode, no Zookeeper)
```

## Running it locally

```bash
# 1. Infra
docker compose up -d

# 2. Install deps (bun workspaces)
bun install

# 3. Env files
cp apps/api/.env.example apps/api/.env
cp apps/worker/.env.example apps/worker/.env
cp apps/web/.env.local.example apps/web/.env.local

# 4. DB schema
bun run db:generate
bun run db:migrate

# 5. Run everything (in separate terminals)
bun run dev:api      # REST on :4000, Socket.io on :4001
bun run dev:worker    # BullMQ workers + Kafka consumer
bun run dev:web       # Next.js on :3000
```

Firebase push notifications and the video worker's ffmpeg calls both no-op
gracefully if unconfigured (no service account JSON, or `ffmpeg` not on
`PATH`) — everything else in the app still works without them, which is
useful for a first run.

## What's intentionally left as a stub

This is a scaffold meant to be extended, not a finished product:

- Auth is wired on the API (`/auth/register`, `/auth/login`, JWT cookie) but
  the frontend doesn't yet read the session — dashboard pages use a hardcoded
  demo user/brand id, called out with a `NOTE:` comment where it appears.
- No SFU for the live call — it's a plain 1:1 mesh connection, fine for a
  pitch call, not for group calls.
- No test suite yet.
