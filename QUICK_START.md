# Quick Reference Guide

## Project Structure at a Glance

### Backend Location Map
```
src/config/           → All app configuration
src/modules/          → Feature implementation
src/shared/           → Reusable utilities
src/prisma/           → Database schema & client
src/routes.ts         → Route aggregator
src/server.ts         → Server startup
```

### Frontend Location Map
```
src/app/              → Pages (App Router)
src/components/       → React components
src/features/         → Feature logic
src/lib/api/          → API requests
src/lib/types/        → TypeScript types
src/lib/constants/    → App constants
src/lib/hooks/        → Custom hooks
```

## Adding a New Feature Module

### Step 1: Create Module Structure
```bash
mkdir -p src/modules/newfeature
touch src/modules/newfeature/{newfeature.controller.ts,newfeature.service.ts,newfeature.routes.ts,index.ts}
```

### Step 2: Implementation Pattern

**newfeature.controller.ts:**
```typescript
import { Request, Response } from "express";
import { asyncHandler } from "../../shared/utils/asyncHandler";
import * as newfeatureService from "./newfeature.service";

export const getSomething = asyncHandler(async (req: Request, res: Response) => {
  const result = await newfeatureService.getSomething();
  res.json({ success: true, data: result });
});
```

**newfeature.service.ts:**
```typescript
import { db } from "../../config";

export async function getSomething() {
  // Business logic here
  return {};
}
```

**newfeature.routes.ts:**
```typescript
import { Router } from "express";
import * as controller from "./newfeature.controller";

const router = Router();
router.get("/", controller.getSomething);
export default router;
```

**index.ts:**
```typescript
import { Router } from "express";
import newfeatureRoutes from "./newfeature.routes";

const router = Router();
router.use(newfeatureRoutes);
export default router;
```

### Step 3: Register Module
In `src/modules/index.ts`:
```typescript
import newfeatureRoutes from "./newfeature";
modulesRouter.use("/newfeature", newfeatureRoutes);
```

## Common Imports

### From Config
```typescript
import { ENV } from "../config/environment";
import { db } from "../config/database";
import { redis } from "../config/redis";
// OR
import { ENV, db, redis } from "../config";
```

### From Shared
```typescript
import { asyncHandler } from "../../shared/utils/asyncHandler";
import { errorHandler } from "../../shared/middleware/error.middleware";
import { publish, subscribe } from "../../shared/lib/eventBus";
import { upload } from "../../shared/lib/multer";
```

### Frontend API Calls
```typescript
import { apiClient, authApi, audioApi } from "@/lib/api";
import { User, ApiResponse } from "@/lib/types";
import { API_CONFIG } from "@/lib/constants";
```

## Environment Variables

### Backend (.env)
```
DATABASE_URL=
REDIS_URL=
JWT_SECRET=
NODE_ENV=development
PORT=3001
XAI_API_KEY=
```

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
```

## Database Operations

### Using Prisma
```typescript
import { db } from "../../config";

// Create
const user = await db.user.create({
  data: { email, name }
});

// Read
const user = await db.user.findUnique({
  where: { id }
});

// Update
const user = await db.user.update({
  where: { id },
  data: { name }
});

// Delete
await db.user.delete({
  where: { id }
});
```

### Migrations
```bash
# Create migration
npx prisma migrate dev --name add_users_table

# Apply migrations
npx prisma migrate deploy

# Reset database
npx prisma migrate reset
```

## API Usage (Frontend)

### Making Requests
```typescript
// Get request
const data = await apiClient.get<User>("/auth/me");

// Post request
const result = await authApi.signup({
  email: "user@example.com",
  password: "password",
  name: "User"
});

// File upload
const response = await audioApi.upload(audioFile);
```

### Server-Sent Events
```typescript
const eventSource = streamApi.connect();
eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log(data);
};
```

## Error Handling

### Backend
```typescript
// Automatic error catching with asyncHandler
export const handler = asyncHandler(async (req, res) => {
  throw new Error("Something went wrong"); // Will be caught
});

// Manual error handling
try {
  // Code
} catch (error) {
  res.status(500).json({ 
    success: false, 
    message: error.message 
  });
}
```

### Frontend
```typescript
try {
  const data = await apiClient.get("/endpoint");
} catch (error) {
  console.error("API Error:", error);
}
```

## Development Workflow

### 1. Start Backend
```bash
cd apps/api
npm run dev
# Server on http://localhost:3001
```

### 2. Start Frontend
```bash
cd apps/web
npm run dev
# App on http://localhost:3000
```

### 3. Database Setup
```bash
# Run migrations
npx prisma migrate dev --name init

# Seed data (create seed.ts)
npx prisma db seed
```

## Git Workflow

```bash
# Create feature branch
git checkout -b feature/new-feature

# Commit changes
git add .
git commit -m "feat: add new feature"

# Push
git push origin feature/new-feature

# Create PR
```

## Testing Endpoints

### Using curl
```bash
# Get health check
curl http://localhost:3001/api/v1/health

# Post signup
curl -X POST http://localhost:3001/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"pass","name":"User"}'
```

### Using Postman/Insomnia
- Import environment variables
- Create requests following module structure
- Example: `/api/v1/auth/signup`, `/api/v1/audio/upload`

## Logging & Debugging

### Backend Logging
```typescript
import { ENV } from "../config";

if (ENV.NODE_ENV === "development") {
  console.log("Debug info");
}
```

### Frontend Debugging
```typescript
// Check API calls in Network tab
// Check state in React DevTools
// Enable debug logging
if (process.env.NODE_ENV === "development") {
  console.debug("Debug");
}
```

## Performance Tips

1. **Use Redis for caching**
   ```typescript
   const cached = await redis.get("key");
   if (!cached) {
     const data = await db.query();
     await redis.set("key", JSON.stringify(data), "EX", 3600);
   }
   ```

2. **Batch database queries**
   ```typescript
   const users = await db.user.findMany({
     where: { active: true },
     select: { id: true, email: true } // Only needed fields
   });
   ```

3. **Optimize API responses**
   - Only return needed fields
   - Implement pagination
   - Use compression middleware

4. **Frontend optimization**
   - Use React.memo for components
   - Implement code splitting
   - Optimize images

## Useful Commands

### Backend
```bash
npm run dev          # Start development server
npm run build        # Build TypeScript
npm start            # Start production
npx prisma studio   # Open database GUI
```

### Frontend
```bash
npm run dev          # Start development
npm run build        # Build for production
npm run lint         # Run linter
npm run format       # Format code
```

## Resources

- [Express.js Documentation](https://expressjs.com)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)
- [Redis Documentation](https://redis.io/docs)

---

For detailed architecture information, see [ARCHITECTURE.md](./ARCHITECTURE.md)
For implementation checklist, see [NEXT_STEPS.md](./NEXT_STEPS.md)
For structure changes, see [STRUCTURE_CHANGES.md](./STRUCTURE_CHANGES.md)
