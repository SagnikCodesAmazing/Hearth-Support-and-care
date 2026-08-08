# Architecture Overview

## Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Build Tool | Vite (v8) with `@vitejs/plugin-react` | Fast dev server & production bundling |
| Framework / Meta | TanStack Start (`@tanstack/react-start`) + TanStack Router (`@tanstack/react-router`) | File‑based routing, route prefetching, SSR primitives (used mainly as client‑side SPA) |
| UI Library | React (v19) + React DOM | Core UI rendering |
| Styling | Tailwind CSS (v4) via `@tailwindcss/vite` + `tailwind-merge` + `class-variance-authority` | Utility‑first styling with design‑system primitives |
| Primitives | Radix UI (`@radix-ui/*`) | Accessible, unstyled components (accordion, dialog, dropdown, etc.) |
| Form Handling | React Hook Form (`react-hook-form`) + Zod (`zod`) | Validation and form state management |
| Data Fetching | TanStack Query (`@tanstack/react-query`) | Caching, background updates, optimistic updates |
| Charts | Recharts (`recharts`) | Declarative charting built on D3 & SVG |
| Notifications | Sonner (`sonner`) | Toast notifications |
| Persistence | Custom `localStore` hook (wraps `window.localStorage`) | Client‑side store for tickets, invoices, and audit log |
| Backend (optional) | Supabase (`@supabase/supabase-js`) | Placeholder for future auth & real‑time sync; currently unused in UI |
| Language | TypeScript (v5.8) | Strict typing across frontend and store logic |
| Linting / Formatting | ESLint + Prettier (with `eslint-config-prettier`, `eslint-plugin-prettier`) | Code quality enforcement |
| Package Manager | Bun (lockfile `bun.lockb`) | Fast installation and scripting |

## Data Model

All domain objects are defined in `src/lib/local-store.ts` and persisted in `localStorage` under the key `hearth.store.v1`.

### Core Types

```typescript
export type Priority = "urgent" | "high" | "medium" | "low";
export type Status = "new" | "in_progress" | "waiting" | "resolved";
export type Source = "Support" | "People";

export interface RequestRecord {
  id: string;                     // UUID‑like uid()
  ref_code: string;               // HT- or HR- + random chars
  source: Source;                 // Support or People
  name: string;                   // max 120
  email: string;                  // max 200
  topic: string;                  // free‑form category (e.g., Billing)
  detail: string;                 // max 4000
  priority: Priority;             // default "medium"
  status: Status;                 // workflow state
  confidential: boolean;          // flag for internal‑only
  created_at: string;             // ISO timestamp
  updated_at: string;             // ISO timestamp
}

export type InvoiceStatus =
  | "auto_approved"
  | "needs_review"
  | "approved"
  | "rejected"
  | "paid";

export interface InvoiceFlag { rule: string; note: string; }

export interface Invoice {
  id: string;
  ref_code: string;               // FN- + random chars
  vendor: string;                 // vendor name
  invoice_number: string;
  amount: number;                 // numeric
  currency: string;               // default "USD"
  category: string;               // from FINANCE_CATEGORIES
  due_date: string;               // ISO date string
  submitted_by: string;
  notes: string;
  status: InvoiceStatus;
  flags: InvoiceFlag[];
  created_at: string;
  updated_at: string;
}

export interface AuditEntry {
  id: string;
  ref_code: string;               // references Request or Invoice
  actor: "Automation" | "Human";
  action: string;
  at: string;                     // ISO timestamp
}

export interface Store {
  requests: RequestRecord[];
  invoices: Invoice[];
  audit: AuditEntry[];
}
```

### Store Operations

- **Reading/Writing** – `readStore()` / `writeStore()` sync with `localStorage` and dispatch a custom `hearth:store` event plus a native `storage` event for cross‑tab synchronization.
- **Mutation Helper** – `mutate(fn)` applies a pure function to the current store, writes the result, and returns the new store.
- **Audit Logging** – Every mutation (`addRequest`, `setRequestStatus`, `addInvoice`, `decideInvoice`) creates an `AuditEntry` (limited to the most recent 500 entries).
- **Requests API** – `addRequest`, `setRequestStatus`, `findByRefCode`.
- **Invoices API** – `addInvoice` runs deterministic finance rules (auto‑approve limit, vendor list, duplicate detection, past‑due flag) and sets `status` accordingly; `decideInvoice` lets a human override.
- **React Integration** – `useLocalStore()` provides a React‑friendly subscription to the store, triggering re‑renders on changes.

### Example Record Shapes

**Request (Support Ticket)**
```json
{
  "id":"a1b2c3d4",
  "ref_code":"HT-4F2K9A",
  "source":"Support",
  "name":"Alice Engineer",
  "email":"alice@example.com",
  "topic":"Billing",
  "detail":"Invoice #2841 charged twice",
  "priority":"medium",
  "status":"new",
  "confidential":false,
  "created_at":"2026-08-08T14:32:10.000Z",
  "updated_at":"2026-08-08T14:32:10.000Z"
}
```

**Invoice**
```json
{
  "id":"e5f6g7h8",
  "ref_code":"FN-A1B2C3",
  "vendor":"Northwind Supply",
  "invoice_number":"INV-1001",
  "amount":1520.00,
  "currency":"USD",
  "category":"Software & cloud",
  "due_date":"2026-09-15",
  "submitted_by":"Bob Manager",
  "notes":"",
  "status":"auto_approved",
  "flags":[],
  "created_at":"2026-08-08T09:11:05.000Z",
  "updated_at":"2026-08-08T09:11:05.000Z"
}
```

## High‑Level Design

### 1. Entry Point & Routing
- `src/main.tsx` (or `src/start.ts`) bootstraps the TanStack Router provider.
- Routes are file‑based under `src/routes/`:
  - `/` – Landing page (`index.tsx`)
  - `/support` – Ticket submission & lookup (`support.tsx`)
  - `/hr` – People request form (mirrors support)
  - `/finance` – Invoice upload & review (not shown in current UI but backed by store)
  - `/admin` – Dashboard with charts & queue (`admin.tsx`)
  - `/__root.tsx` – Root layout providing shared header/footer (if any)

### 2. UI Layer
- The project adopts **shadcn/ui** primitives built from Radix UI + Tailwind.
- All components in `src/components/ui/*` are thin wrappers that expose Tailwind‑configurable slots while preserving Radix accessibility.
- Custom components (`Reveal`, `Button`, `Input`, `Textarea`, `Label`, etc.) live in `src/components/ui/` and are imported via `@/components/ui/*` alias.
- Design tokens (colors, spacing, radii) are defined in `src/styles.css` using CSS variables that Tailwind consumes via the `tw-animate-css` plugin.

### 3. State Management
- **Client store** (`localStore`) is the single source of truth for all domain data.
- **TanStack Query** is used sparingly (e.g., for optimistic updates) but the primary state lives in the store; query keys are derived from store snapshots when needed.
- **React Context** is not used for global state; instead components directly call `useLocalStore()` and subscribe to updates.

### 4. Data Flow
1. User interaction (e.g., submitting a ticket) → calls a store mutator (`addRequest`) → `mutate` writes to `localStorage` → dispatches `hearth:store` event.
2. `useLocalStore()` hook in any component picks up the event via `window.addEventListener` (and `storage`) → triggers re‑render with fresh data.
3. Mutators also append an audit entry, providing an immutable trace of who did what and when.
4. Charts in `/admin` read derived statistics (`stats`, `byDay`, `byTopic`, `spendByCategory`) from the store via `useMemo` selectors; whenever the store changes, those selectors recompute and the chart updates.

### 5. Charts (Admin Dashboard)
- Uses **Recharts** (`LineChart`, `BarChart`).
- Data series are prepared in `admin.tsx`:
  - `byDay`: daily counts of Support, People, and Finance entries over the last 14 days.
  - `byTopic`: top‑7 request topics (bar chart).
  - `spendByCategory`: summed invoice amounts per category (bar chart).
- Charts are wrapped in `ResponsiveContainer` to fill their parent; the layout was adapted to let the line chart occupy the full width and a height of `70vh` for better visibility.

### 6. Extensibility / Future Work
- **Supabase Integration** – The `@supabase/supabase-js` package is installed and a set of thin wrappers exist in `src/integrations/supabase/*`. The current implementation persists everything locally; switching to a remote backend would involve replacing `readStore`/`writeStore` with Supabase calls while keeping the same type definitions.
- **Authentication** – The `source` field distinguishes Support vs People; a future auth layer could bind a user ID to each record and enable private views.
- **Server‑Side Rendering / API Routes** – TanStack Start conventions allow creating `src/routes/*.tsx` files that export `loader` or `action` functions for SSR; not used today but available.
- **Testing** – The store logic is pure and can be unit‑tested in isolation; React components can be tested with React Testing Library mocking `useLocalStore`.

### 7. Deployment
- Built with `vite build` → static assets served via any static‑host (Netlify, Vercel, Cloudflare Pages, or a simple Nginx server).
- No Node.js server required for the current client‑only build; if Supabase or custom endpoints are added, a Node runtime (via `nitro` in devDependencies) can be leveraged for edge functions.

--- 

*This document captures the stack, data model, and high‑level architectural decisions as of commit *[insert latest SHA]* (2026‑08‑08). It should be kept in sync with the codebase; any major change to dependencies, store shape, or routing warrants an update here.*