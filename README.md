# Abhishek Prajapati — Portfolio, Blog & Admin CMS

A production-grade personal platform: animated public portfolio, full blog, and a private
admin CMS that manages everything through flat-file JSON storage — no database server required.

**Stack:** Next.js 16 (App Router, TypeScript strict) · Tailwind CSS v4 · GSAP + ScrollTrigger ·
React Hook Form + Zod · Tiptap rich text · bcrypt + jose JWT sessions · local filesystem storage.

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
- **Builds** — distribute 100–150MB APK / IPA / ZIP files via an 8MB-chunked upload pipeline
  (retry per chunk, cancel), so large binaries never hit a request-body limit
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

On first run the data store is seeded from `lib/db/defaults.ts` into `data/` (gitignored).

**Default admin login** — `/admin/login`:

| | |
|---|---|
| Email | `dev.abhishek.ap11@gmail.com` |
| Password | `Admin@12345` |

> Change the password immediately from **Admin → Settings → Change password** — this also
> invalidates all existing sessions.

## Docker deployment (recommended)

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

## 🔐 Locked out of the admin?

The admin password is **not** in the repo — it lives in `data/users.json` (or the
Docker volume). If you changed it and forgot it, reset from the server:

```bash
# local / VPS
npm run reset-admin                              # back to the documented default
node scripts/reset-admin.mjs --password=NewSecret123

# Docker
docker compose exec portfolio node scripts/reset-admin.mjs --password=NewSecret123
```

This bumps the session token version, so every existing session is invalidated,
and it also recreates the admin account if `users.json` is missing or corrupt.
The login page's *"Can't sign in?"* panel lists the other common causes.

## ⚠️ Deployment caveats — read this

1. **Not a serverless app.** Do **not** deploy to Vercel/Netlify serverless: storage is the
   local filesystem (`/data`, `/public/uploads`) and app-build uploads (up to 150MB via 8MB
   chunks) need a long-running Node process with **persistent disk and no per-request body
   limit**. One process, one filesystem.
   **If you deploy to Vercel anyway:** set `JWT_SECRET` (≥ 16 chars) in *Project → Settings →
   Environment Variables* and redeploy. The app detects Vercel and runs read-only from the
   committed seed (`data/seed/*.seed.json`), with scratch writes going to ephemeral `/tmp`.
   Admin login works with the seeded credentials. CMS edits and uploads are **not durable**
   (they reset on cold start), and in-app password changes are disabled. To change the admin
   password, run `node scripts/reset-admin.mjs --seed --password=NewSecret123` locally, then commit
   `data/seed/users.seed.json` and redeploy.
2. **Single-instance by design.** The JSON data layer uses atomic writes; running multiple
   replicas behind a load balancer is unsafe without an external shared volume mount.
3. **Reverse proxy** in front (nginx/Caddy): allow `client_max_body_size` ≥ 12MB for chunk
   uploads and serve HTTPS so the `Secure` session cookie is honored.
4. **Seed assets**: images in `public/seed/` are committed placeholders / brand artwork.
   `npm run placeholders` regenerates the procedural ones (needs `sharp`).
   Replace any of them freely — keep the file paths stable because seed JSON references them.
5. **Runtime uploads are served by `app/uploads/[...path]`**, not by the Next static handler —
   standalone builds index `public/` once at build time and would 404 anything created later.
   The route streams files from disk with path-traversal protection, correct content types,
   immutable caching, and attachment headers for `.apk/.ipa/.zip`. Nothing to configure.
6. **Soft-404s**: public detail pages rely on Next's streamed rendering, so a missing
   project/post renders the custom 404 with HTTP 200 *and* `meta robots noindex` (the
   documented mitigation) — crawlers will not index it.

## Testing

```bash
npm run test:e2e    # 94 checks against a running instance (BASE_URL override supported)
npm run typecheck
npm run build       # full production build + type check
```

The e2e harness covers every public page, SEO surfaces, auth flows (login/logout,
invalid-session after password change, lockout recovery), rate limiting, contact +
honeypot, and authenticated CRUD round trips for projects, blog, media, messages,
builds and settings — leaving no test data behind.

## Project layout

```
app/
  (public)/            home, about, services, projects, blog, contact + [slug] pages
  admin/(dashboard)/   protected CMS: overview, projects, blog, media, builds, messages, settings
  admin/login/         sign-in page
  api/                 versioned REST-y route handlers (all JSON envelopes)
  proxy.ts             /admin + private /api guard
lib/
  db/                  JSON store (atomic writes) + repos + defaults/seed
  auth/                bcrypt password utils, jose sessions, route guard
  validation/          Zod schemas shared by client + server
  rate-limit.ts        in-memory sliding-window limiter
components/
  ui/, sections/, admin/, motion/
data/                  runtime JSON state (gitignored, seeded on boot)
public/uploads/        runtime uploads (gitignored)
```

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Development server |
| `npm run build` / `start` | Production build & serve |
| `npm run test:e2e` | 94-check end-to-end suite against the running server |
| `npm run typecheck` | TypeScript strict check |
| `npm run lint` | ESLint |
| `npm run seed` | Reset/seed the JSON data store |
| `npm run placeholders` | Regenerate procedural seed images via sharp |

## API shape

Every response follows `ApiResponse<T>`:

```jsonc
// ok
{ "success": true, "data": { /* … */ } }
// error
{ "success": false, "error": { "code": "VALIDATION_ERROR", "message": "…" } }
```

Public reads: `GET /api/projects`, `GET /api/blog`, `GET /api/media`.
Everything else (`POST/PATCH/DELETE` on projects/blog/media/builds/settings/messages,
chunk upload routes) requires the admin session cookie.
