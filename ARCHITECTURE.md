# Ted — SaaS Monorepo Architecture Guide

## Overview

Ted is a realtime AI communication and interview intelligence platform.

The system is divided into three major layers:

1. Web Layer (`apps/web`)
2. Platform Backend (`apps/server`)
3. AI Runtime Layer (`apps/api`)

The architecture intentionally separates:
- frontend UX
- business/platform logic
- realtime AI orchestration
- runtime coordination
- durable persistence

This separation prevents:
- AI provider coupling
- frontend business logic leakage
- auth/runtime coupling
- scaling bottlenecks
- future rewrite disasters

---

# Monorepo Structure

```txt
TED/
├── apps/
│
│   ├── api/                   # FastAPI realtime AI runtime
│   ├── server/                # Fastify SaaS backend
│   └── web/                   # Next.js frontend
│
├── packages/
│   ├── ui/                    # Shared UI system
│   ├── shared-types/          # Shared DTOs/contracts
│   ├── config/                # Shared config/constants
│   └── eslint-config/
│
├── infra/
│   ├── docker/
│   ├── nginx/
│   └── scripts/
│
├── turbo.json
├── pnpm-workspace.yaml
└── README.md
```

---

# 1. AI Runtime Layer — FastAPI

## Purpose

The FastAPI runtime acts as:
- realtime AI execution engine
- streaming orchestration layer
- transcript intelligence pipeline
- STT runtime
- websocket orchestration system

The runtime layer is intentionally:
- stateless
- horizontally scalable
- isolated from business concerns

It should NEVER own:
- auth
- billing
- subscriptions
- durable truth
- organizations
- payment logic

---

# Runtime Structure

```txt
apps/api/
├── .env
├── requirements.txt
├── venv/
│
└── app/
    ├── main.py
    │
    ├── api/
    │   ├── health.py
    │   ├── interview.py
    │   ├── audio.py
    │   └── stream.py
    │
    ├── core/
    │   ├── settings.py
    │   ├── config.py
    │   ├── logging.py
    │   ├── lifespan.py
    │   ├── http.py
    │   └── exceptions.py
    │
    ├── schemas/
    │   ├── audio.py
    │   ├── interview.py
    │   ├── stream.py
    │   └── ai.py
    │
    ├── services/
    │
    │   ├── ai/
    │   │   ├── providers/
    │   │   │   ├── base.py
    │   │   │   ├── grok.py
    │   │   │   └── openai.py
    │   │   │
    │   │   ├── llm.py
    │   │   ├── context.py
    │   │   └── prompt.py
    │   │
    │   ├── audio/
    │   │   ├── providers/
    │   │   │   ├── base.py
    │   │   │   └── deepgram.py
    │   │   │
    │   │   ├── stt.py
    │   │   └── utils.py
    │   │
    │   ├── cache/
    │   │   ├── redis.py
    │   │   ├── repository.py
    │   │   ├── lock.py
    │   │   ├── keys.py
    │   │   └── streams.py
    │   │
    │   ├── realtime/
    │   │   ├── manager.py
    │   │   ├── websocket.py
    │   │   └── events.py
    │   │
    │   └── interview/
    │       ├── pipeline.py
    │       ├── summary.py
    │       ├── scoring.py
    │       └── guidance.py
    │
    └── utils/
```

---

# Runtime Architecture Flow

```txt
Frontend
   ↓
WebSocket
   ↓
Realtime Manager
   ↓
Pipeline
   ↓
LLM/STT Services
   ↓
Providers
   ↓
External AI APIs
```

---

# Runtime Design Rules

Routes should remain thin.

Architecture should always follow:

```txt
Route
↓
Pipeline
↓
Service
↓
Provider
↓
Transport
```

Providers should NEVER:
- know websocket logic
- know frontend logic
- know persistence logic
- know auth/session ownership

---

# Realtime Architecture

Ted uses:
- WebSockets
- NOT SSE

Reason:
- bidirectional communication
- realtime microphone streaming
- token streaming
- interruption handling
- event synchronization
- low latency coordination

---

# Redis Runtime Infrastructure

Redis acts as:
- realtime coordination engine
- distributed runtime state layer
- event infrastructure

Redis is NOT durable truth.

PostgreSQL remains the system of record.

---

# Redis Responsibilities

Redis is used for:
- transcript caching
- websocket coordination
- active session state
- distributed locks
- replay buffers
- reconnect recovery
- token streaming
- rate limiting
- temporary runtime state

---

# Redis Data Structures

## Pub/Sub

Used for:
- realtime token streaming
- live updates
- cross-worker communication

---

## Redis Streams

Used for:
- ordered transcript events
- replayable sessions
- reconnect recovery
- event logs

---

## Redis Locks

Used for:
- duplicate STT prevention
- duplicate AI generation prevention
- race condition protection

---

# 2. Platform Backend — Fastify

## Purpose

The backend acts as:
- SaaS platform layer
- auth system
- persistence layer
- business logic layer
- subscription engine
- billing orchestration
- ownership/permissions layer

The backend owns:
- durable truth
- monetization
- user lifecycle
- organizations
- quotas
- summaries
- analytics

The backend should NEVER:
- directly orchestrate AI pipelines
- directly process STT
- directly manage websocket AI execution

---

# Backend Structure

```txt
apps/server/
├── .env
├── package.json
├── tsconfig.json
│
├── prisma/
│   ├── schema.prisma
│   └── migrations/
│
└── src/
    ├── api/
    │   └── index.ts
    │
    ├── config/
    │   ├── env.ts
    │   ├── logger.ts
    │   ├── cors.ts
    │   └── constants.ts
    │
    ├── lib/
    │   ├── prisma.ts
    │   ├── redis.ts
    │   ├── jwt.ts
    │   ├── oauth.ts
    │   └── http.ts
    │
    ├── middleware/
    │   ├── auth.ts
    │   ├── error.ts
    │   ├── request.ts
    │   └── rate-limit.ts
    │
    ├── modules/
    │
    │   ├── auth/
    │   ├── user/
    │   ├── session/
    │   ├── interview/
    │   ├── summary/
    │   ├── subscription/
    │   ├── billing/
    │   └── organization/
    │
    ├── services/
    │   ├── ai/
    │   ├── cache/
    │   ├── email/
    │   └── storage/
    │
    ├── types/
    ├── utils/
    │
    └── app.ts
```

---

# Backend Design Rules

The backend owns:
- auth
- sessions
- subscriptions
- history
- organizations
- quotas
- analytics

The backend communicates with the runtime through:
- internal HTTP
- websocket coordination
- Redis events

---

# Authentication Strategy

Authentication Providers:
- Email/Password
- Google OAuth
- Microsoft OAuth

Authentication Stack:
- JWT access tokens
- refresh tokens
- HTTP-only cookies

Authentication ownership belongs ONLY to:
`apps/server`

---

# Subscription Strategy

Subscription tiers:
- Free
- Premium
- Enterprise

Free users may receive:
- watermarking
- limited history
- limited summaries
- lower quotas

Premium users receive:
- advanced summaries
- realtime coaching
- full exports
- higher quotas
- richer AI guidance

All subscription enforcement MUST occur inside:
`apps/server`

---

# Durable Persistence

PostgreSQL stores:
- users
- subscriptions
- sessions
- transcripts
- summaries
- analytics
- billing
- organizations

Redis stores:
- temporary runtime state
- replay buffers
- coordination state

---

# 3. Frontend Layer — Next.js

## Purpose

The frontend acts as:
- realtime interaction layer
- UX/rendering layer
- websocket client
- dashboard system
- session visualization layer

The frontend should NEVER:
- own business logic
- own auth validation
- own Prisma
- call AI providers directly

---

# Frontend Structure

```txt
apps/web/
├── .env
├── package.json
├── next.config.ts
├── tsconfig.json
│
├── app/
│   ├── (marketing)/
│   ├── (dashboard)/
│   ├── (auth)/
│   │
│   ├── interview/
│   ├── meeting/
│   └── api/
│
├── components/
│   ├── ui/
│   ├── common/
│   ├── interview/
│   └── meeting/
│
├── features/
│   ├── auth/
│   ├── audio/
│   ├── realtime/
│   ├── interview/
│   ├── summary/
│   └── subscription/
│
├── lib/
│   ├── api/
│   ├── websocket/
│   ├── auth/
│   └── storage/
│
├── stores/
├── hooks/
├── overlay/
└── styles/
```

---

# Frontend Design Rules

Components should remain:
- presentation-focused
- reusable
- mostly dumb

Business logic belongs inside:
- features/
- stores/
- lib/

Realtime communication should ONLY happen through:
- centralized websocket clients
- typed transport contracts

---

# Core Product Flows

---

# Interview Flow

```txt
User
   ↓
Frontend
   ↓
Backend Session/Auth Validation
   ↓
Realtime Runtime Session
   ↓
Audio/Text Streaming
   ↓
AI Processing
   ↓
Realtime Feedback
   ↓
Persist Final Session
```

---

# Meeting Summary Flow

```txt
Transcript
   ↓
Summary Pipeline
   ↓
AI Summary Generation
   ↓
Insights Extraction
   ↓
Persist Summary
```

---

# Guidance Flow

```txt
Transcript Context
   ↓
Prompt Enrichment
   ↓
Definitions
   ↓
Follow-up Questions
   ↓
Realtime Coaching
```

---

# Watermark Flow

```txt
Free User
   ↓
Server Checks Subscription
   ↓
Watermark Metadata Added
   ↓
Frontend Renders Limited Output
```

Subscription enforcement belongs to:
`apps/server`

---

# Scaling Strategy

Ted is designed to scale through:
- stateless runtime workers
- Redis coordination
- websocket orchestration
- isolated AI runtime
- horizontally scalable services

The architecture intentionally separates:
- frontend UX
- business platform
- AI runtime infrastructure

to avoid future rewrites and scaling bottlenecks.