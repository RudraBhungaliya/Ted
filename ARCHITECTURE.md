# SaaS Monorepo Structure Guide

## Backend (Express + TypeScript)

```
apps/api/src/
├── config/                    # Configuration files
│   ├── environment.ts         # Environment variables
│   ├── database.ts            # Database connection
│   ├── redis.ts               # Redis/cache configuration
│   └── index.ts               # Centralized exports
│
├── modules/                   # Feature modules
│   ├── auth/                  # Authentication module
│   │   ├── signup/
│   │   │   ├── signup.controller.ts
│   │   │   ├── signup.service.ts
│   │   │   ├── signup.routes.ts
│   │   │   └── signup.dto.ts
│   │   ├── auth.service.ts
│   │   ├── auth.middleware.ts
│   │   └── index.ts
│   │
│   ├── audio/                 # Audio processing module
│   │   ├── audio.controller.ts
│   │   ├── audio.service.ts
│   │   ├── audio.routes.ts
│   │   └── index.ts
│   │
│   ├── stream/                # Server-Sent Events module
│   │   ├── stream.controller.ts
│   │   ├── stream.service.ts
│   │   ├── stream.routes.ts
│   │   └── index.ts
│   │
│   └── index.ts               # Module router aggregator
│
├── shared/                    # Cross-cutting concerns
│   ├── middleware/
│   │   ├── error.middleware.ts
│   │   └── index.ts
│   ├── lib/
│   │   ├── eventBus.ts
│   │   ├── multer.ts
│   │   └── index.ts
│   └── utils/
│       ├── asyncHandler.ts
│       └── index.ts
│
├── prisma/                    # Database ORM
│   ├── schema.prisma          # Prisma schema
│   ├── client.ts              # Prisma client singleton
│   └── index.ts
│
├── routes.ts                  # Main router
└── server.ts                  # Server entry point
```

## Frontend (Next.js 13+ App Router)

```
apps/web/src/
├── app/                       # App router pages
│   ├── layout.tsx
│   └── page.tsx
│
├── components/                # React components
│   ├── common/                # Shared components
│   │   ├── Button.tsx
│   │   └── Loader.tsx
│   └── ui/                    # UI-specific components
│       ├── RecordingIndicator.tsx
│       └── TranscriptView.tsx
│
├── features/                  # Feature-specific logic
│   ├── audio/
│   ├── interview/
│   └── stream/
│
├── lib/                       # Utilities and services
│   ├── api/
│   │   ├── client.ts          # API client
│   │   ├── endpoints.ts       # API endpoints
│   │   └── index.ts
│   ├── db/                    # Database utilities
│   ├── stt/                   # Speech-to-text
│   ├── realtime/              # Real-time features
│   ├── types/                 # TypeScript types
│   ├── constants/             # Constants
│   ├── hooks/                 # Custom hooks
│   └── utils/
│
├── styles/                    # Global styles
└── overlay/                   # Overlay components
```

## Key Architectural Patterns

### 1. Modules Structure
Each module (auth, audio, stream) follows:
- **Controller**: Handles HTTP requests/responses
- **Service**: Business logic and database operations
- **Routes**: Route definitions
- **DTO**: Data Transfer Objects (interfaces)
- **index.ts**: Module exports

### 2. Shared Resources
Cross-cutting concerns are centralized:
- Middleware
- Utility functions
- Libraries
- Shared services

### 3. Configuration
Environment-based configuration:
- **environment.ts**: App configuration
- **database.ts**: Database connection
- **redis.ts**: Cache connection

### 4. Error Handling
- Centralized error middleware
- asyncHandler wrapper for Express routes
- Type-safe error responses

### 5. API Communication
- Centralized API client
- Organized endpoints
- Type-safe requests/responses

## File Naming Conventions

- Controllers: `*.controller.ts`
- Services: `*.service.ts`
- Routes: `*.routes.ts` (plural)
- DTOs: `*.dto.ts`
- Middleware: `*.middleware.ts`
- Types: `*.types.ts` or in `/types` folder
- Utilities: `*.utils.ts` or in `/utils` folder

## Environment Variables

See `.env.example` files in each app for required variables.

## Scripts

### Backend
```bash
npm run dev      # Development server
npm run build    # Build
npm run start    # Production
npm run prisma:migrate   # Run migrations
```

### Frontend
```bash
npm run dev      # Development
npm run build    # Build
npm run start    # Production
```

## Best Practices

1. **Dependency Injection**: Import from config/index for centralized configuration
2. **Error Handling**: Always wrap async routes with asyncHandler
3. **Type Safety**: Use DTOs and interfaces for all data transfers
4. **Middleware Ordering**: Middleware should be applied in correct order
5. **Environment Variables**: Never hardcode secrets
6. **Code Organization**: Keep related files together in feature modules
7. **Testing**: Each module should have corresponding test files
8. **Documentation**: Maintain README files in each module

## Scalability Considerations

- Database: PostgreSQL with Prisma ORM
- Cache: Redis for session and data caching
- Auth: JWT with token refresh
- Events: Event bus for async communication
- File uploads: Multer with memory storage (consider S3)
- Real-time: Server-Sent Events (consider WebSockets for bidirectional)
