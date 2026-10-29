---
name: web-api-patterns
description: >
  Defines the canonical patterns for declaring API/UI routes and making API calls in this project.
  Use this skill whenever you are: adding a new API endpoint, calling a backend endpoint,
  reading data in a Server Component or Server Action, wiring up a form submission, or doing
  anything that touches HTTP requests. Trigger on requests like "call the API", "fetch data",
  "add an endpoint", "make a request to...", "POST to...", "GET ...", or any time backend
  communication is involved. This skill is the source of truth for how routes are declared
  and how API calls are made — both client-side and server-side.
---

# Web API Patterns

Three concerns are covered here:

1. **How to declare endpoints** — the `routes` object in `utils/routes/index.tsx`
2. **How to call endpoints** — `apiCall` (client) and `apiRequest` (server)
3. **How to poll** — TanStack Query, and only for polling (§4)

---

## 1. Declaring Routes — `utils/routes/index.tsx`

All route strings — both UI navigation paths and API endpoint paths — live in a single `routes` object exported from this file. Nothing else should hard-code a path string.

### Structure

```typescript
export const routes = {
  ui: {
    // Static paths
    indexRoute: "/",
    signIn: "/auth/sign-in",
    featureName: "/feature-name",

    // Dynamic paths — use a function
    featureDetails: (id: string | number) => `feature-name/${id}`,

    // With optional query params
    orderDetails: (id: string | number, number?: string | number) =>
      number ? `orders/${id}?number=${number}` : `orders/${id}`,
  },

  api: {
    // Static endpoints (no leading slash — the base URL is prepended by the caller)
    listFeatures: "features",
    createFeature: "features",

    // Dynamic endpoints — use a function
    getFeature:    (id: string | number) => `features/${id}`,
    updateFeature: (id: string | number) => `features/${id}`,
    deleteFeature: (id: string | number) => `features/${id}`,

    // Sub-resource endpoints
    getFeatureItems: (id: string | number) => `features/${id}/items`,

    // Action endpoints
    markFeatureActive:   (id: string) => `features/${id}/mark-as-active`,
    markFeatureInactive: (id: string) => `features/${id}/mark-as-inactive`,
  },
};
```

### Rules

- **`routes.ui`** — paths for `<Link href={...}>`, `router.push(...)`, `redirect(...)`. Always start with `/`.
- **`routes.api`** — endpoint paths appended to `config.apiUrl`. **No leading slash.** The caller prepends the base URL.
- **Static values** are plain strings. **Dynamic values** are arrow functions that receive an `id` (and optionally other params) and return a string.
- **Never** hard-code a path string anywhere else in the codebase. Always import from `routes`.

### Usage example

```typescript
import { routes } from '@/utils/routes';

// UI navigation
router.push(routes.ui.orderDetails(orderId));

// API endpoint passed to apiCall / apiRequest
const res = await apiCall({ endpoint: routes.api.getOrderDetails(orderId), method: 'GET' });
```

---

## 2. Client-Side API Calls — `utils/api-call/index.ts`

Use `apiCall` inside **Client Components** (`'use client'`) and any browser-side event handler (button clicks, form submissions, etc.).

### Signature

```typescript
apiCall<T = unknown>({
  endpoint,        // string — from routes.api
  method,          // 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  data?,           // Record<string, unknown> — body for POST/PUT/PATCH, params for GET
  headers?,        // Record<string, string> — extra headers
  showSuccessToast?,  // boolean (default: false)
  successMessage?,    // string — custom success toast text
}): Promise<ApiResponse<T>>
```

### `ApiResponse<T>` shape

```typescript
{
  success: boolean;     // true = 2xx, false = error
  data: T | null;       // response body on success, raw error body on failure
  status: number | null;
  message: string;      // human-readable result or error description
}
```

### How it works

- Calls backend endpoints (`routes.api.*` paths like `fanhub/org/...`) **directly** and attaches the access token as a `Bearer` header automatically. The token comes from `utils/auth/client-token`, which gets it from the same-origin `/api/auth/token` route (the httpOnly cookies are sent to it automatically) and keeps it in memory. Don't add a Next route handler just to forward an org call.
- On a 401 it forces one token refresh (`/api/auth/refresh`) and retries once; if that fails the user is signed out.
- Need the raw `Response` (e.g. to show the backend's exact error message without a toast)? Use `backendFetch` from `@/utils/api-call` — same URL building, Bearer header and 401 retry.
- **Doesn't cache** — every call goes to the backend.
- Shows an error toast automatically on failure — you don't need to handle toasts yourself for errors.
- Pass `showSuccessToast: true` (and optionally `successMessage`) to show a success toast.

### Usage pattern

```typescript
'use client';
import apiCall from '@/utils/api-call';
import { routes } from '@/utils/routes';

// GET
const { success, data } = await apiCall<Order[]>({
  endpoint: routes.api.getOrders,
  method: 'GET',
});

// POST with success toast
const { success, data } = await apiCall<Order>({
  endpoint: routes.api.createRegularItem,
  method: 'POST',
  data: { itemId, quantity },
  showSuccessToast: true,
  successMessage: 'Item added to order',
});

// DELETE
const { success } = await apiCall({
  endpoint: routes.api.deleteOrderItem(itemId),
  method: 'DELETE',
  showSuccessToast: true,
  successMessage: 'Item removed',
});

// Always check success before using data
if (success && data) {
  // use data
}
```

### Error handling

`apiCall` handles all HTTP errors and network errors internally — it shows a toast and returns `{ success: false, ... }`. You only need to check the `success` flag; you don't need try/catch around `apiCall`.

---

## 3. Server-Side API Calls — `utils/api-request/index.ts`

Use `apiRequest` inside **Server Components**, **Server Actions**, and **Route Handlers** — any code that runs on the Node.js server where cookies are accessed via `next/headers`.

### Signature

```typescript
apiRequest({
  endpoint,         // string — from routes.api
  isProtected?,     // boolean (default: false) — attach accessToken cookie if true
  ...fetchOptions,  // any native fetch RequestInit options (method, body, headers, etc.)
}): Promise<any>   // returns the parsed JSON body directly
```

### How it works

- Uses the native `fetch` API with `cache: 'no-store'` (always fresh data).
- If `isProtected: true`, reads the `accessToken` cookie via `next/headers` and attaches it as a `Bearer` token.
- Calls Next.js `unauthorized()` automatically on a 401 response.
- Returns the parsed JSON body directly (not wrapped in a success/data envelope).

### Usage pattern

```typescript
// In a Server Component
import { apiRequest } from '@/utils/api-request';
import { routes } from '@/utils/routes';

// Public endpoint
const categories = await apiRequest({
  endpoint: routes.api.getItemCategories,
});

// Protected endpoint
const orders = await apiRequest({
  endpoint: routes.api.getOrders,
  isProtected: true,
});

// POST from a Server Action
const result = await apiRequest({
  endpoint: routes.api.createItemCategory,
  method: 'POST',
  body: JSON.stringify({ name, description }),
  headers: { 'Content-Type': 'application/json' },
  isProtected: true,
});
```

---

## Choosing Between `apiCall` and `apiRequest`

| Situation | Use |
|-----------|-----|
| Inside a `'use client'` component | `apiCall` |
| Button / form submit handler in the browser | `apiCall` |
| Server Component fetching data at render time | `apiRequest` |
| Server Action (`'use server'`) | `apiRequest` |
| Need automatic error toasts | `apiCall` |
| Need the backend's exact error message | `backendFetch` (or a feature helper on it, e.g. `sponsorRequest`) |
| Need access to cookies server-side | `apiRequest` |
| Polling a status until it's final | TanStack Query (§4) |

---

## 4. Polling — TanStack Query only

`@tanstack/react-query` is installed **for polling only**, and every poll uses it (no `setInterval` / sleep loops):

- a status asked for every few seconds until it's final — a Sponsor AI search (`components/organization/sponsor-ai-agent/use-sponsor-ai-run`), the Exposure sync (`components/organization/schedule/import-schedule`, with a backoff interval);
- a list kept fresh on a timer — the org's chat conversations (`components/organization/messages/use-org-chat`), Command Center live games (`components/organization/command-center/game-cards`).

The `QueryProvider` (`context/query-client`) wraps the app in `app/layout.tsx`.

- **Only the poll is a query.** Every other request (one-off GETs, lists, POST/PUT/PATCH/DELETE, starting the thing being polled) stays on `apiCall` / `backendFetch` with `useEffect` + state as above. No `useMutation`, no query caching for ordinary data.
- `queryFn` calls the backend through `backendFetch` (or a helper on it) and **throws** on failure, so a failed check keeps the last good data on screen.
- For a status, `refetchInterval` is a function that returns the interval while the status is active and `false` once it's final; for a list on a timer it's a plain number. Leave `refetchIntervalInBackground` off, so a hidden tab doesn't poll.
- Use `skipToken` (not `enabled`) while there's nothing to poll yet.
- Query keys: `["<feature>", "<resource>", id]`, e.g. `["sponsor-ai", "run", runId]`.
- To show a response you already have (e.g. the 202 that started the job) without waiting for the first poll, seed it with `queryClient.setQueryData(key, data)`.

```typescript
const { data: run } = useQuery({
  queryKey: ["sponsor-ai", "run", runId],
  queryFn: runId ? () => fetchRun(runId) : skipToken,
  refetchInterval: (q) => (isActiveRun(q.state.data?.status) ? 4000 : false),
});
```

---

## Quick Checklist When Adding a New Endpoint

1. Add the endpoint string(s) to `routes.api` in `utils/routes/index.tsx`
2. Add the corresponding UI path to `routes.ui` if there's a new page
3. Call the endpoint using `apiCall` (client) or `apiRequest` (server) — never `fetch` or `axios` directly
4. Check `success` (for `apiCall`) or handle errors at the call site (for `apiRequest`)
