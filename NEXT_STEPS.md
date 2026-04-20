# Next Steps & Cleanup

## Immediate Actions

### 1. Delete Old Directories (after verifying files are migrated)
```
apps/api/src/
  ❌ auth/               (now at modules/auth/)
  ❌ lib/                (now at shared/lib/)
  ❌ middleware/         (now at shared/middleware/)
  ❌ utils/              (now at shared/utils/)

apps/api/
  ❌ prisma/             (now at src/prisma/)
```

### 2. Complete Missing Modules
- [ ] Add models to `src/prisma/schema.prisma`:
  ```prisma
  model User {
    id        String    @id @default(cuid())
    email     String    @unique
    password  String
    name      String?
    createdAt DateTime  @default(now())
    updatedAt DateTime  @updatedAt
  }
  ```

- [ ] Implement `modules/session/` (currently empty)
  - session.controller.ts
  - session.service.ts
  - session.routes.ts

- [ ] Complete AI module under `modules/ai/`

### 3. Update Imports
Replace old import paths throughout the codebase:
- `../../lib/` → `../../shared/lib/`
- `../../middleware/` → `../../shared/middleware/`
- `../../utils/` → `../../shared/utils/`
- `../config/env.ts` → `../config/environment.ts`
- `../config/db.ts` → use `db` from config/index

### 4. Frontend Enhancements
- [ ] Move existing hooks to `lib/hooks/`
- [ ] Move existing types to `lib/types/`
- [ ] Update existing API calls to use new `lib/api/` client
- [ ] Add form validation utilities
- [ ] Create custom hooks for auth, recording, streaming

### 5. Database Setup
```bash
# Install Prisma if not done
npm install @prisma/client prisma

# Initialize database
npx prisma migrate dev --name init

# Generate Prisma client
npx prisma generate
```

### 6. Environment Files
- [ ] Copy `.env.example` to `.env` in both apps
- [ ] Fill in actual values for:
  - DATABASE_URL
  - REDIS_URL
  - JWT_SECRET
  - API keys

### 7. Configuration Files
- [ ] Update `tsconfig.json` with proper path aliases:
  ```json
  {
    "compilerOptions": {
      "baseUrl": ".",
      "paths": {
        "@/*": ["src/*"]
      }
    }
  }
  ```

- [ ] Update `next.config.ts` if needed

### 8. Testing
- [ ] Test backend startup: `npm run dev`
- [ ] Test API endpoints with Postman/Insomnia
- [ ] Test frontend connections to API

### 9. Docker (Optional but Recommended)
Create Dockerfile for:
- PostgreSQL database
- Redis cache
- Express API
- Next.js frontend

### 10. CI/CD Setup (Optional)
- [ ] GitHub Actions workflows
- [ ] Linting/formatting rules
- [ ] Pre-commit hooks

## Additional Recommendations

### 1. Add These Utilities
- Validation library (zod or yup)
- Error handling utilities
- Logger (winston or pino)
- Rate limiting

### 2. Add These Dependencies
```bash
# Backend
npm install zod bcryptjs helmet rate-limit

# Frontend
npm install zustand react-query next-auth
```

### 3. Authentication Flow
- [ ] Implement proper signup flow
- [ ] Add refresh token logic
- [ ] Implement password reset
- [ ] Add email verification

### 4. Testing
- [ ] Set up Jest
- [ ] Add unit tests for services
- [ ] Add E2E tests with Cypress/Playwright

## File Migration Checklist

### Moved Files
- ✅ auth/signup → modules/auth/signup
- ✅ middleware/ → shared/middleware/
- ✅ lib/ → shared/lib/
- ✅ utils/ → shared/utils/
- ✅ prisma/ → src/prisma/
- ✅ config/env.ts → config/environment.ts

### Created Files
- ✅ config/index.ts
- ✅ config/database.ts (enhanced)
- ✅ config/redis.ts (enhanced)
- ✅ modules/auth/auth.service.ts
- ✅ modules/auth/auth.middleware.ts
- ✅ modules/auth/index.ts
- ✅ modules/auth/signup/signup.service.ts
- ✅ modules/auth/signup/signup.dto.ts
- ✅ modules/auth/signup/signup.routes.ts
- ✅ modules/index.ts
- ✅ modules/audio/index.ts
- ✅ modules/stream/stream.service.ts
- ✅ modules/stream/index.ts
- ✅ shared/lib/index.ts
- ✅ shared/middleware/index.ts
- ✅ shared/utils/index.ts
- ✅ prisma/client.ts
- ✅ prisma/index.ts
- ✅ web/lib/api/client.ts
- ✅ web/lib/api/endpoints.ts
- ✅ web/lib/types/index.ts
- ✅ web/lib/constants/index.ts
- ✅ web/lib/hooks/index.ts
- ✅ ARCHITECTURE.md
- ✅ .env.example files
