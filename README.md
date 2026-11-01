# TED ⚡

> **Real-Time AI Meeting Assistant & Developer Copilot Overlay**  
> *Low-latency, contextual intelligence designed to assist in interviews, technical meetings, and coding workflows without leaving your active workspace.*

---

## 🏗️ System Architecture

Ted operates as a distributed, low-latency monorepo comprising a modern Next.js client, an Electron desktop overlay, a high-performance Fastify platform server, and a stateless Python FastAPI AI execution runtime.

```mermaid
graph TD
    User["Developer / Interviewee"]
    
    subgraph ClientLayer["🖥️ Frontend & Desktop Layer"]
        Desktop["Desktop Shell (Electron)"]
        WebClient["Web Application (Next.js 16 + React 19)"]
        Overlay["Transparent Overlay Window"]
        Capture["Screen Capture & OCR (Tesseract)"]
    end
    
    subgraph ServerLayer["⚡ Platform Backend (Fastify)"]
        FastifyServer["Fastify Server (:4000)"]
        AuthModule["Auth & Session Management"]
        RealtimeGW["WebSocket Realtime Gateway"]
        BillingModule["Razorpay Billing & Quota"]
        AnalyticsModule["Session Analytics & Summaries"]
    end
    
    subgraph AIRuntime["🧠 Realtime AI Runtime (FastAPI)"]
        FastAPIServer["FastAPI Runtime (:8000)"]
        AudioPipeline["STT Pipeline (Deepgram nova-2)"]
        LLMOrchestrator["Streaming LLM (Gemini / Grok)"]
    end
    
    subgraph StorageLayer["🗄️ Persistence & Messaging"]
        Postgres[(PostgreSQL Persistence)]
        Redis[(Redis Cache & Pub/Sub)]
    end

    User <--> Desktop
    Desktop --> Overlay
    Desktop --> Capture
    WebClient <--> Desktop
    
    WebClient -->|HTTP REST| FastifyServer
    WebClient <-->|WebSockets & Audio PCM| RealtimeGW
    
    RealtimeGW <-->|Pub/Sub Event Bus| Redis
    RealtimeGW -->|Realtime Audio| AudioPipeline
    AudioPipeline -->|Transcripts| LLMOrchestrator
    LLMOrchestrator -->|Token Streams| RealtimeGW
    RealtimeGW -->|Streamed Answers| Overlay
    
    FastifyServer -->|Prisma ORM| Postgres
    FastifyServer <-->|Cache & Session State| Redis
```

---

## 🧩 Monorepo Workspace Structure

```txt
Ted/
├── apps/
│   ├── web/                   # Next.js 16 (App Router), React 19, Tailwind CSS v4, Lucide
│   ├── desktop/               # Electron 30, Vite 5, Always-on-top Transparent Overlay, OCR
│   ├── server/                # Fastify 5, Prisma ORM, WebSocket Gateway, Razorpay, Redis
│   └── api/                   # Python FastAPI, Deepgram STT, Grok/OpenAI Runtime
│
├── docker-compose.yml         # Containerized PostgreSQL 16 & Redis 7
├── pnpm-workspace.yaml        # PNPM Monorepo workspace configuration
├── ARCHITECTURE.md            # Detailed SaaS monorepo architectural specification
└── README.md                  # System overview, operational guides, and setup instructions
```

---

## ⚡ Core Capabilities

### 1. Always-on-Top Transparent Overlay
Runs alongside video conferencing applications, code editors, and browsers. Features:
- **Click-Through Mode**: Pass mouse and keyboard inputs directly to underlying applications.
- **Content Protection**: Conceals the overlay from screen sharing platforms.
- **Microphone & Desktop Audio Loopback**: Captures interview questions in real time.

### 2. Dual-Stream Audio & Real-Time Transcription
- Continuous bidirectional audio capture (Microphone & Speaker channels).
- High-accuracy real-time STT powered by **Deepgram nova-2**.
- Smart endpointing and debouncing to distinguish between user speech, interviewer queries, and pauses.

### 3. Spoken-Style AI Copilot
- Powered by **Google Gemini** and **xAI Grok**.
- System-prompt engineered specifically for natural, first-person spoken responses suitable for live meetings.
- Token-by-token streaming over WebSockets eliminates perceived latency.

### 4. Screen Context & OCR Extraction
- Electron desktop capture grabs screen frames on demand.
- Integrated **Tesseract.js** extracts visible code, problem statements, and diagram text for instant grounding.

### 5. Subscription & Quota Enforcement
- Tiered subscription plans (Monthly and Yearly Premium).
- **Razorpay** checkout integration, webhook verification, and automatic session quota management.

---

## 🔌 Protocols & Communication Pipeline

| Channel | Protocol | Payload / Role |
| :--- | :--- | :--- |
| `POST /api/auth/*` | HTTP REST | User authentication, session cookies, and Google OAuth |
| `GET /api/session/*` | HTTP REST | Session history, analytics metrics, and AI summary logs |
| `POST /api/billing/*` | HTTP REST | Razorpay order creation, payment signature verification, and plan querying |
| `/realtime` | WebSocket (Binary/JSON) | Bidirectional streaming of Linear-16 PCM audio, live transcription events, and token responses |
| `Pub/Sub Event Bus` | Redis Streams | Inter-service coordination across audio workers, LLM streaming, and transcript storage |

---

## ⚙️ Setup & Installation

### Prerequisites
- **Node.js** `>= 20.0.0`
- **pnpm** `>= 9.0.0`
- **Python** `>= 3.9` (optional for `apps/api`)
- **Docker** & **Docker Compose** (for PostgreSQL and Redis)

---

### 1. Clone & Install Dependencies
Install dependencies across all monorepo packages with a single command from the root:
```bash
git clone https://github.com/RudraBhungaliya/Ted.git
cd Ted

# Install monorepo dependencies
pnpm install
```

---

### 2. Start Infrastructure (PostgreSQL & Redis)
Spin up PostgreSQL and Redis with Docker Compose:
```bash
pnpm docker:up
```

---

### 3. Environment Configuration

Create local environment files for each app from their provided templates:

#### Platform Server (`apps/server/.env`)
```bash
cp apps/server/.env.example apps/server/.env
```
Key configuration settings in `apps/server/.env`:
```env
PORT=4000
DATABASE_URL=postgresql://rudra:qwerty@localhost:5432/ted
REDIS_URL=redis://localhost:6379
JWT_SECRET=super_secret_jwt_key_ted_dev_2026_change_in_prod

# AI & STT Providers
GEMINI_API_KEY=your_gemini_api_key_here
DEEPGRAM_API_KEY=your_deepgram_api_key_here
XAI_API_KEY=your_xai_grok_key_here

# Payments (Razorpay)
RAZORPAY_KEY_ID=rzp_test_your_key_id
RAZORPAY_KEY_SECRET=your_key_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
```

#### Web Client (`apps/web/.env.local`)
```bash
cp apps/web/.env.example apps/web/.env.local
```
```env
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_WS_URL=ws://localhost:4000/realtime
```

#### AI Runtime Service (`apps/api/.env` - Optional)
```bash
cp apps/api/.env.example apps/api/.env
```

---

### 4. Database Setup & Seeding
Generate the Prisma client and apply database migrations:
```bash
# Generate Prisma Client
pnpm db:generate

# Run Migrations
pnpm db:migrate

# Seed default subscription plans & demo user
pnpm db:seed
```

---

### 5. Running the Application

#### Run Web and Server Concurrently (Recommended):
```bash
pnpm dev
```
- **Web App**: [http://localhost:3000](http://localhost:3000)
- **Fastify Backend**: [http://localhost:4000](http://localhost:4000)

#### Run Electron Desktop Application:
In a separate terminal:
```bash
pnpm dev:desktop
```

#### Run AI Runtime (Python FastAPI):
```bash
pnpm dev:api
```

---

## 🛠️ Root Monorepo Commands

| Command | Action |
| :--- | :--- |
| `pnpm dev` | Concurrently launches backend server (:4000) and Next.js web app (:3000) |
| `pnpm dev:server` | Starts the Fastify platform server in watch mode with `tsx` |
| `pnpm dev:web` | Starts the Next.js development server |
| `pnpm dev:desktop` | Launches Vite dev server and the Electron desktop application |
| `pnpm dev:all` | Concurrently starts server, web, and desktop clients |
| `pnpm dev:api` | Starts the Python FastAPI AI runtime on port 8000 |
| `pnpm build` | Builds server (`tsc`), web (`next build`), and desktop (`vite build`) |
| `pnpm typecheck` | Typechecks all TypeScript projects across the monorepo |
| `pnpm db:generate` | Generates the Prisma client |
| `pnpm db:migrate` | Runs Prisma schema migrations |
| `pnpm db:seed` | Seeds plans and demo user into the database |
| `pnpm db:studio` | Opens Prisma Studio GUI at `http://localhost:5555` |
| `pnpm docker:up` | Starts PostgreSQL and Redis containers |
| `pnpm docker:down` | Stops container services |

---

## 🛡️ License
ISC
