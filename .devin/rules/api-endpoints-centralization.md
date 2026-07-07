# API Endpoints Centralization

## Rule

All endpoints used in the frontend MUST be centralized in `dashboard/src/config/apiConfig.js`.
There are two types of endpoints with different patterns — both must be centralized.

## Two Types of Endpoints

### Type A: Express Backend Endpoints
Calls from Next.js to the **external Express server** (port 4000).
These use `buildApiUrl()` which prepends `NEXT_PUBLIC_API_URL`.

- Naming convention: `X_API` (e.g., `CONVERSACIONES_API`, `VUELOS_API`)
- Example: `CONVERSACIONES_API.syncBot(sessionName)`

### Type B: Next.js API Routes (Internal)
Calls to **internal Next.js API routes** (`/app/api/...`) within the same Next.js process.
These are relative paths — they must NOT use `buildApiUrl()`.

- Naming convention: `NEXT_X_API` (e.g., `NEXT_CONVERSACIONES_API`, `NEXT_RENDIMIENTO_API`)
- Example: `NEXT_CONVERSACIONES_API.generateReport`

## Required Usage

- Import from `apiConfig.js`: `import { CONVERSACIONES_API, NEXT_CONVERSACIONES_API } from '@/config/apiConfig'`
- Use predefined endpoint objects: `COTIZACIONES_API.crear`, `VUELOS_API.obtener(id)`
- For new Express endpoints, add to the appropriate `X_API` object using `buildApiUrl()`
- For new Next.js API routes, add to the appropriate `NEXT_X_API` object as a plain string path
- For new modules, create both `X_API` and `NEXT_X_API` objects as needed

## Forbidden

- Never hardcode Express backend URLs: `process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'`
- Never construct endpoint paths manually in components or services
- Never duplicate endpoint definitions across files
- Never use `buildApiUrl()` for Next.js internal API routes (it would break them)

## Exceptions

- External APIs (e.g., OpenAI, third-party services) are not subject to this rule
- `messageService.js` has special handling for WebSocket connections

## Verification

During code review, check that:
- All fetch/axios calls to Express use endpoints from a `X_API` object in `apiConfig.js`
- All fetch/axios calls to Next.js API routes use endpoints from a `NEXT_X_API` object in `apiConfig.js`
- No hardcoded backend URLs or inline path strings exist in new code
- New endpoints are added to the appropriate object in `apiConfig.js`
- `buildApiUrl()` is only used for Express endpoints, never for internal Next.js routes