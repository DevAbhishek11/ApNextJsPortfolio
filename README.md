# Abhishek Prajapati — Portfolio, Blog & Admin CMS

A personal platform with an animated public portfolio, full blog, and a private admin CMS.
Local/Docker installs use persistent JSON files; serverless deployments use shared PostgreSQL
for content, settings, and credentials, and Vercel Blob for uploaded files.

**Stack:** Next.js 16 (App Router, TypeScript strict) · Tailwind CSS v4 · GSAP + ScrollTrigger ·
React Hook Form + Zod · Tiptap rich text · bcrypt + jose JWT sessions · JSON/PostgreSQL + Blob.

---

## Features

### Public site
- **Dark & light themes** — toggle in the navbar, applied before first paint (no flash),
  independent from the admin theme
- **Global search** — `⌘K` / `Ctrl+K` / `/` or the navbar button; glass command-palette with
  keyboard navigation & recents
- Glassmorphism navigation island with a sliding active-link indicator and scroll progress bar
- Home (animated hero with rotating roles, marquee, stats, featured projects, experience
  timeline, skills matrix, testimonials, blog highlights, CTA)
- About (story, experience, education, certifications, interests, résumé download)
- Services · Projects (filterable grid) · Project detail (gallery, key features, related)
- Blog (search/generation, tag filters) · Blog detail with reading progress & TOC
- Contact (honeypot + server-side validation + rate limiting, optional SMTP notification)
- `sitemap.xml` (dynamic from content) · `robots.txt` (blocks `/admin`) · custom 404/500 pages,
  loading skeletons, per-route metadata, JSON-LD (Person / WebSite / Article / CreativeWork /
  BreadcrumbList)
- GSAP scroll animations: bidirectional reveals, scrub parallax, `ScrollTrigger.batch`,
  Lenis smooth scrolling, `prefers-reduced-motion` respected, strict cleanup on route change

### Admin CMS (`/admin`)
- Dashboard with at-a-glance stats and quick actions
- Projects CRUD — feature image, multi-image gallery with ordering, featured toggle,
  draft/published, duplication, bulk actions
- Blog CRUD — full Tiptap editor (headings, code blocks with syntax highlight, inline images
  with alt + captions via `<figure>`, links, word-count / read-time), per-post SEO fields
- Media library — multi-file drag & drop upload with per-file progress, usage scanning
- **Builds** — distribute 100–150MB APK / IPA / ZIP files via local 8MB chunks or
  direct-to-Blob multipart uploads on serverless (retry, progress, cancel)
- Messages inbox — read/unread, search, reply-by-mail, delete
- Settings — profile/SEO/theme/content editing without touching code, change password
  (bcrypt cost 12, invalidates existing sessions)
- Dark / light themes on CSS variables with no flash-of-wrong-theme

### Security
- JWT session in `HttpOnly; Secure; SameSite=Lax` cookie (jose)
- Zod validation on every write endpoint; consistent error envelope
  `{ success: false, error: { code, message } }`
- Rate limiting on `/api/auth/login` and `/api/contact`; contact honeypot
- Uploaded media checked by MIME + extension; rich text sanitized before storage
- `/admin/* + /api/*` guarded by proxy middleware (`proxy.ts`)

---

## Quick start (local)

```bash
npm ci
cp .env.example .env            # set JWT_SECRET (openssl rand -base64 32)
npm run dev                     # http://localhost:3000
```

On first run the data store is initialized once from `data/seed/*.seed.json` into
`data/*.json` (gitignored). Subsequent runs do **not** overwrite your edits.

**Default admin login** — `/admin/login`:

| | |
|---|---|
| Email | `dev.abhishek.ap11@gmail.com` |
| Password | `Admin@12345` |

> Change the password immediately from **Admin → Settings → Change password** — this also
> invalidates all existing sessions.

## Docker deployment (persistent filesystem)

```bash
cp .env.example .env            # set JWT_SECRET + NEXT_PUBLIC_SITE_URL
docker compose up --build -d
```

Compose mounts two persistent volumes that are **required**:

| Volume | Purpose |
|---|---|
| `./data → /app/data` | JSON content store (projects, blog, settings, messages, builds registry) |
| `./public/uploads → /app/public/uploads` | User media + chunk-uploaded app builds |

Any container host with persistent volumes works: your own VPS, Railway, Render, Fly.io, Hetzner…

## Vercel / serverless deployment (persistent CMS)

**Required services:** a PostgreSQL database (for content, messages, settings and the password)
and a **public Vercel Blob** store (for media and downloadable builds). A serverless function's
local disk and `/tmp` do **not** persist between instances or deployments. To set this up:

1. Create a hosted PostgreSQL database (for example Neon or Supabase), use a **pooled**
   connection string, and add it to the Vercel project's environment variables as
   `DATABASE_URL` (include the provider's SSL settings, e.g. `?sslmode=require`).
2. In Vercel **Storage**, create a *public* Blob store, connect it to this project, and confirm
   that Vercel has set `BLOB_READ_WRITE_TOKEN` for this deployment.
3. Set `JWT_SECRET` to a stable random string of at least 16 characters
   (`openssl rand -base64 32`) and `NEXT_PUBLIC_SITE_URL` to the deployed HTTPS URL.
   Set all variables for the environments you actually deploy (Production / Preview).
   **Do not commit these values**, and keep `JWT_SECRET` the same across redeploys.
4. Redeploy. The app creates `portfolio_collections` automatically. Each collection is seeded
   *only once* from `data/seed/*.seed.json`; changes are committed to PostgreSQL and are read
   by every instance immediately (including public pages and the dynamic sitemap).
   Uploaded files live in Blob and remain available after redeploys. Large media uploads
   (>4MB) and builds (up to 150MB) upload directly from the dashboard to Blob, bypassing
   Vercel's request-body limit. No Git commit or redeploy is needed for CMS edits.
5. Sign in using the initial credentials below and **change the password immediately** at
   **Admin → Settings → Change password**. The new bcrypt hash and session version live in
   PostgreSQL; all old sessions, including sessions on other devices, are rejected.

If `DATABASE_URL` is absent, the public site can still show committed seed content, but admin
login/writes fail explicitly with `STORAGE_NOT_CONFIGURED` (HTTP 503) rather than pretending to
save to `/tmp`. If Blob is missing, uploads fail with a configuration error. The code cannot
provision either external service on your behalf; configure them before using the dashboard.

**Migrating existing local/Docker edits** (if any): with `DATABASE_URL` pointing at the new
DB, run `npm run import:db` from the machine holding `data/*.json`, *before* the first
serverless request seeds empty DB rows. If the DB has already been seeded, back it up and
explicitly run `npm run import:db -- --replace` to overwrite its rows. This includes the
admin's local password and bumps its token version. Only real JSON files can be imported;
edits previously written to ephemeral serverless `/tmp` may already be lost after cold start
and cannot be recovered by redeploying. The committed seed remains the fallback starting point.

## 🔐 Locked out of the admin?

Use the same persistent backend as the deployed app (password recovery invalidates all sessions):

```bash
# JSON file / Docker volume
node scripts/reset-admin.mjs --password=NewSecret123
docker compose exec portfolio node scripts/reset-admin.mjs --password=NewSecret123

# PostgreSQL (run locally with the live DATABASE_URL, or from a server with it set)
DATABASE_URL='postgresql://...' node scripts/reset-admin.mjs --password=NewSecret123
# If your local env file contains DATABASE_URL:
node --env-file=.env.local scripts/reset-admin.mjs --password=NewSecret123
```

`--seed` edits a committed example file, **not** the live database. Do not commit your new
password hash to Git to change a deployed password. Protect the database URL and keep backups.

## Deployment notes

1. **Docker/local:** mount `./data` and `./public/uploads` on persistent storage. Without
   volumes, CMS content and uploads vanish on container replacement. A local JSON volume is
   for a **single Node process**; for multiple replicas, use `DATABASE_URL` and shared Blob.
2. **Reverse proxy (local JSON uploads):** allow at least 12MB per request and use HTTPS so
   session cookies can be `Secure`. On Vercel, large uploads bypass the function body limit.
3. **Seed artwork:** `public/seed/` contains committed images; `npm run placeholders`
   regenerates procedural ones. Do not move seed paths without updating the seed JSON.
4. **Local runtime uploads** are streamed from `app/uploads/[...path]`, rather than Next's
   static public handler. On serverless, the CMS stores and links directly to Blob URLs.
5. **Soft-404s:** public detail pages are streamed, so a missing project/post may render
   HTTP 200 with the custom 404 content and `meta robots noindex`.

## Testing

```bash
npm run test:e2e    # 102 checks against a running instance (BASE_URL override supported)
npm run test:store  # real Postgres WASM contract + serverless fail-closed checks
npm run typecheck
npm run build       # production build + type check (VERCEL=1 npm run build also works)
```

The e2e harness covers every public page, SEO surfaces, auth flows (login/logout,
invalid sessions on other devices after password change, lockout recovery), rate limiting,
contact + honeypot, and authenticated CRUD round trips for projects, blog, media,
messages, builds and settings — leaving no test fixtures behind. `test:store`
verifies concurrent mutations and survival across simulated serverless instances.
Direct Vercel Blob uploads require a real Blob store for live integration testing.

## Project layout

```
app/
  (public)/            home, about, services, projects, blog, contact + [slug] pages
  admin/(dashboard)/   protected CMS: overview, projects, blog, media, builds, messages, settings
  admin/login/         sign-in page
  api/                 JSON-envelope REST routes + Blob upload callbacks
  uploads/             local/Docker media and build streaming
proxy.ts               fast /admin JWT signature guard
lib/
  db/                  JSON/Postgres stores, static seeds, typed repos
  auth/                bcrypt password utils, jose sessions, route guard
  validation/          Zod schemas shared by client + server
  rate-limit.ts        in-memory sliding-window limiter
components/
  ui/, sections/, admin/, motion/
data/seed/*.seed.json  committed first-boot examples (one per collection)
data/*.json            local/Docker runtime state (gitignored)
public/uploads/        local/Docker runtime uploads (gitignored)
```

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Development server |
| `npm run build` / `start` | Production build & serve |
| `npm run test:e2e` | 102-check end-to-end suite against the running server |
| `npm run test:store` | PostgreSQL + missing-config unit tests |
| `npm run typecheck` | TypeScript strict check |
| `npm run lint` | ESLint |
| `npm run seed` | Seed missing local JSON files |
| `npm run import:db` | Import existing local JSON into Postgres (skip existing by default) |
| `npm run reset-admin` | Recover the admin password in the active backend |
| `npm run placeholders` | Regenerate procedural seed images via sharp |

## API shape

Every response follows `ApiResponse<T>`:

```jsonc
// ok
{ "success": true, "data": { /* … */ } }
// error
{ "success": false, "error": { "code": "VALIDATION_ERROR", "message": "…" } }
```

Public reads: `GET /api/projects`, `GET /api/blog`. Media, builds, settings,
messages and all mutations require the admin session cookie. Blob's upload-token
callback routes return the SDK's response format instead of this envelope.
