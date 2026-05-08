# SaaS Monorepo Structure Guide

## Backend (Python + FastAPI)

```
apps/api/
├── .env                       # Environment variables (e.g., OPENAI_API_KEY)
├── requirements.txt           # Python dependencies (if used)
├── venv/                      # Python virtual environment
└── app/
    ├── main.py                # FastAPI application entry point
    │
    ├── api/                   # Route handlers
    │   ├── health.py          # Health check endpoints
    │   ├── interview.py       # Interview endpoints
    │   ├── audio.py           # Audio processing endpoints
    │   └── stream.py          # Server-Sent Events endpoints
    │
    ├── core/                  # Configuration
    │   ├── config.py
    │   ├── logging.py
    │   └── settings.py
    │
    ├── schemas/               # Pydantic models (Data Transfer Objects)
    │   ├── audio.py
    │   ├── interview.py
    │   └── stream.py
    │
    ├── services/              # Business logic
    │   ├── ai/                # LLM and context management
    │   ├── audio/             # Speech-to-text
    │   ├── cache/             # Redis integration
    │   ├── interview/         # Interview pipelines
    │   └── realtime/          # SSE and real-time managers
    │
    └── utils/                 # Utility functions
```

## Frontend (Next.js 16+ App Router)

```
apps/web/
├── .env                       # Environment variables (e.g., NEXT_PUBLIC_API_URL)
├── package.json               # Dependencies and scripts
├── next.config.ts             # Next.js configuration
├── tsconfig.json              # TypeScript configuration
├── globals.css                # Global Tailwind CSS
│
└── app/                       # App Router root directory
    ├── layout.tsx             # Root layout component
    ├── page.tsx               # Home page
    │
    ├── components/            # React components
    │   ├── common/            # Shared components (Button, Loader)
    │   └── ui/                # UI-specific components (TranscriptView, RecordingIndicator)
    │
    ├── features/              # Feature-specific logic, hooks, and Zustand stores
    │   ├── audio/             # Microphone recording and processing
    │   ├── interview/         # Interview state management
    │   └── stream/            # Real-time streaming features
    │
    ├── lib/                   # Utilities and services
    │   ├── api/               # API client factory and endpoints
    │   ├── ai/                # AI integrations
    │   ├── db/                # IndexedDB and local storage utilities
    │   ├── realtime/          # Event bus and session management
    │   └── stt/               # Speech-to-text utilities
    │
    ├── overlay/               # Overlay floating UI components
    │   ├── FloatingPanel.tsx
    │   ├── Overlay.tsx
    │   └── StreamRenderer.tsx
    │
    ├── public/                # Static assets (images, icons)
    └── styles/                # Additional styling
```

## Key Architectural Patterns

### 1. Backend Modules Structure (FastAPI)
The backend uses a modular pattern centered around domains:
- **api**: Contains FastAPI route definitions, organized by domain (`audio.py`, `interview.py`).
- **services**: Encapsulates business logic, making it reusable and testable.
- **schemas**: Uses Pydantic to enforce strong typing and validation on requests/responses.

### 2. Frontend Structure (Next.js App Router)
The frontend leverages Next.js App Router features:
- **app/**: Routes are defined at the root using `page.tsx` and `layout.tsx`.
- **features/**: Groups related state (Zustand), hooks, and logic (e.g., `features/interview/store.ts`).
- **components/**: Kept strictly for UI presentation (Dumb components where possible).
- **lib/**: Handles external communication, like the centralized API client in `lib/api/client.ts`.

### 3. API Communication
- The frontend defines a centralized `ApiClient` (`lib/api/client.ts`) wrapper around `fetch`.
- The backend accepts cross-origin requests via CORS configured in `main.py`.

### 4. Real-time Capabilities
- **Server-Sent Events (SSE)**: The backend streams interview feedback via SSE (`api/stream.py`).
- **Frontend Streaming**: Custom hooks (`useStream.ts`) consume the SSE connection to render chunks in real-time.

## Environment Variables

See the respective `.env.example` files in each app (`apps/api` and `apps/web`) for required configuration details.

## Scripts

### Backend
Navigate to `apps/api`:
```bash
source venv/bin/activate
uvicorn app.main:app --reload --port 3001
```

### Frontend
Navigate to `apps/web`:
```bash
npm install
npm run dev      # Development server on port 3000
npm run build    # Build for production
npm run start    # Start production server
```

## Scalability Considerations

- **State Management**: Frontend utilizes Zustand for un-opinionated, lightweight state management.
- **Database/Storage**: Uses IndexedDB (`lib/db/postgre.ts` or similar wrappers) on the frontend for local history persistence.
- **Backend Processing**: Structured to allow asynchronous operations via async/await in FastAPI to avoid blocking the event loop on audio or LLM tasks.
