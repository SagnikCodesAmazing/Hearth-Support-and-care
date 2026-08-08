# Hearth – Support & People Care

A warm, calm desk for customer support tickets and people operations. Built with React, TanStack Router, Vite, and Tailwind CSS, Hearth lets users submit requests, track them with a reference code, and view analytics in an admin dashboard.

## Features
- Submit support or people requests with category, priority, and a reference code.
- Lookup existing requests/invoices via reference code.
- Admin dashboard showing:
  - Incoming request trends (line chart)
  - Request volume by topic (bar chart)
  - Spend by category (bar chart)
- Local persistence via `window.localStorage` (with optional Supabase integration).
- Accessible UI primitives from Radix UI + Tailwind (shadcn/ui).
- TypeScript for safety.
- GitHub Actions CI pipeline (lint, type‑check, build).

## Stack
| Layer | Technology |
|-------|------------|
| Build Tool | Vite (plugin‑react) |
| Framework / Router | TanStack Start + TanStack Router |
| UI Library | React 19 |
| Styling | Tailwind CSS v4 + `tailwind-merge` + `class-variance-authority` |
| Primitives | Radix UI |
| Forms | React Hook Form + Zod |
| Data Fetching | TanStack Query |
| Charts | Recharts |
| Notifications | Sonner |
| Persistence | Custom `localStore` hook (localStorage) – Supabase ready |
| Language | TypeScript |
| Lint / Format | ESLint + Prettier |
| Package Manager | Bun |
| CI | GitHub Actions (lint → type‑check → build) |

See [`ARCHITECTURE.md`](ARCHITECTURE.md) for a deep dive.

## Getting Started

### Prerequisites
- [Bun](https://bun.sh) (v1+) – used to install dependencies and run scripts.
- Git (optional, for cloning).

### Installation
```bash
# Clone the repo
git clone https://github.com/SagnikCodesAmazing/Hearth-Support-and-care.git
cd Hearth-Support-and-care

# Install dependencies
bun install
```

### Development
```bash
bun dev
```
Starts Vite dev server at `http://localhost:5173` (or another port if occupied).

### Production Build
```bash
bun run build
```
Outputs to `dist/`. Preview with:
```bash
bun preview
```

### Lint & Type Check
```bash
bun run lint
bun run tsc --noEmit   # or `bun run typecheck` if added
```

### Running Tests (if added)
```bash
bun test
```

## CI/CD
A GitHub Actions workflow (`.github/workflows/ci.yml`) runs on every push and pull request to `main`:
1. Checkout code
2. Setup Bun
3. `bun install`
4. `bun run lint`
5. `bun run tsc --noEmit`
6. `bun run build`

A passing workflow shows a green check; failing indicates lint, type, or build issues.

## Project Structure
```
src/
 ├─ assets/          # static images
 ├─ components/      # UI primitives (Radix + Tailwind)
 ├─ integrations/    # Supabase stubs
 ├─ lib/             # localStore, ref‑code utilities, etc.
 ├─ routes/          # page components (/, /support, /hr, /finance, /admin)
 ├─ styles.css       # global CSS / CSS variables
```

## Contributing
1. Fork the repository.
2. Create a feature branch (`git checkout -b feature/awesome-feature`).
3. Commit your changes.
4. Push to the branch and open a Pull Request.
5. Ensure the CI workflow passes before merging.

## License
This project is MIT‑licensed – see the `LICENSE` file for details.

---

*Built with ���� �� �� ❤������️ using Claude Code.*