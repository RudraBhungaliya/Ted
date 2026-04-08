## Overview

Reflex is a real-time assistive system designed to provide immediate, context-aware responses during technical interviews and problem-solving sessions. It operates as a low-latency overlay rather than a traditional application, allowing users to stay within their workflow while receiving structured answers.

The system captures input (voice or text), processes it through a structured backend pipeline, and streams responses incrementally. The focus is on speed, clarity, and usability under real interview conditions.

---

## Objective

Enable users to receive accurate, concise, and usable responses in real time without breaking focus or switching context during interviews.

---

## Core Capabilities

### Real-Time Voice Processing

The system captures spoken input through the browser, converts it to text, and processes it immediately. Responses are generated in a format suitable for direct verbal delivery.

---

### Problem Solving Assistance

Users can input coding problems directly. The system parses the problem, extracts constraints, and generates optimized solutions aligned with typical competitive programming requirements.

---

### Overlay-First Interface

The primary interface is a lightweight floating panel that displays responses as they are generated. It is designed to be non-intrusive and does not replace the main working screen.

---

### Streaming Response Pipeline

Responses are streamed token by token instead of waiting for full completion. This reduces perceived latency and makes the system usable in live scenarios.

---

### Context Structuring

Incoming input is not passed directly to the model. It is first analyzed to determine intent, domain, and structure. This improves output consistency and relevance.

---

### Caching Layer

Frequently repeated or similar queries are cached to reduce response time and API usage. Session-level context is also maintained for short-term continuity.

---

### History Tracking

All interactions are stored and can be reviewed later. This enables post-session analysis and learning.

---

## System Architecture

### Client (Next.js)

---

Handles microphone input, manages the overlay interface, and maintains a streaming connection with the backend.

### Server (FastAPI)

Responsible for processing requests through a defined pipeline:

- speech-to-text (when applicable)
- context construction
- prompt generation
- LLM interaction
- streaming responses

### Shared Contracts

API schemas are defined on the backend and used to generate types for the frontend. This ensures consistency and reduces integration errors.

---

## Data Flow

Input (voice or text)

→ optional speech-to-text

→ context builder

→ cache lookup

→ prompt construction

→ LLM processing (streaming)

→ streamed response to client

→ overlay rendering
