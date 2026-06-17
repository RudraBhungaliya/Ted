# TED

## Overview

TED is a real-time AI Meeting Assistant and Developer Copilot designed to provide immediate, context-aware assistance during meetings, discussions, coding sessions, and everyday development workflows.

Rather than acting as a traditional chatbot, TED operates as a low-latency overlay that stays alongside existing applications. It captures audio or text input, processes context through a structured backend pipeline, and streams responses incrementally to minimize interruptions and preserve focus.

The system is built around speed, contextual understanding, and seamless workflow integration.

---

## Objective

Enable developers and teams to receive relevant insights, summaries, explanations, and contextual assistance in real time without leaving their current workflow.

---

# Core Capabilities

## Real-Time Audio Processing

TED captures microphone and system audio streams, converts speech into text, and continuously processes conversations to maintain contextual awareness.

---

## AI Developer Copilot

TED provides contextual assistance during development tasks, helping with:

* Code explanations
* API references
* Debugging guidance
* Architecture discussions
* Documentation lookup
* Technical problem solving

---

## Meeting Intelligence

TED continuously understands ongoing conversations and provides:

* Live contextual assistance
* Action item extraction
* Key discussion points
* Automated summaries
* Follow-up notes

---

## Overlay-First Interface

TED runs as a lightweight overlay instead of replacing existing tools. Responses appear inside an always-on-top panel designed to stay out of the way while remaining instantly accessible.

---

## Streaming Response Pipeline

Responses are streamed token by token rather than waiting for complete generation. This significantly reduces perceived latency and improves usability during live interactions.

---

## Context Structuring

Incoming data is first analyzed and structured before being sent to the model. Intent, domain, and conversation state are extracted to improve output relevance and consistency.

---

## Caching Layer

Frequently repeated requests and session context are cached to reduce response time and API consumption while maintaining continuity.

---

## History Tracking

Sessions, transcripts, and interactions are stored for later review, enabling searchable archives and post-meeting analysis.

---

# System Architecture

## Desktop Client (Electron + Next.js)

Responsible for:

* Overlay interface
* Audio capture
* Screen capture
* Session management
* Streaming connections
* Real-time interaction

---

## Backend Server (Fastify)

Processes requests through a structured pipeline:

* Speech-to-text
* Transcript aggregation
* Context construction
* Prompt generation
* LLM interaction
* Streaming responses
* Persistence and analytics

---

## Shared Contracts

API schemas are shared across frontend and backend to maintain consistency and reduce integration errors.

---

# Data Flow

Audio / Text Input

↓

Speech-to-Text

↓

Transcript Aggregation

↓

Context Builder

↓

Cache Lookup

↓

Prompt Construction

↓

LLM Processing (Streaming)

↓

Streamed Response

↓

Overlay Rendering

↓

Session Storage

---

# Design Principles

* Low latency first
* Overlay-based workflow
* Context-aware assistance
* Streaming responses
* Persistent conversational memory
* Minimal workflow interruption
* Cross-application accessibility

---

# Tech Stack

### Frontend

* Next.js
* TypeScript
* Electron
* Web Audio APIs

### Backend

* Fastify
* PostgreSQL
* Prisma
* Redis

### AI

* Gemini
* Deepgram

### Infrastructure

* Streaming APIs
* Session Persistence
* Analytics Pipeline
* Context Management
