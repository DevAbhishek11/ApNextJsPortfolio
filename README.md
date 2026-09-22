# Abhishek Prajapati — Portfolio, Blog & Admin CMS

A production-grade personal platform: animated public portfolio, full blog, and a private
admin CMS that manages everything through flat-file JSON storage — no database server required.

**Stack:** Next.js 16 (App Router, TypeScript strict) · Tailwind CSS v4 · GSAP + ScrollTrigger ·
React Hook Form + Zod · Tiptap rich text · bcrypt + jose JWT sessions · local filesystem storage.

---

## Features

### Public site
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

## ⚠️ Deployment caveats — read this

1. **Not a serverless app.** Do **not** deploy to Vercel/Netlify serverless: storage is the
   local filesystem (`/data`, `/public/uploads`) and app-build uploads (up to 150MB via 8MB
   chunks) need a long-running Node process with **persistent disk and no per-request body
   limit**. One process, one filesystem.
2. **Single-instance by design.** The JSON data layer uses atomic writes; running multiple
   replicas behind a load balancer is unsafe without an external shared volume mount.
3. **Reverse proxy** in front (nginx/Caddy): allow `client_max_body_size` ≥ 12MB for chunk
   uploads and serve HTTPS so the `Secure` session cookie is honored.
4. **Seed assets**: images in `public/seed/` are committed placeholders / brand artwork.
   `node scripts/make-placeholders.mjs` regenerates the procedural ones (needs `sharp`).
   Replace any of them freely — keep the file paths stable because seed JSON references them.

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
| `npm run typecheck` | TypeScript strict check |
| `npm run lint` | ESLint |
| `npm run seed` | Reset/seed the JSON data store |

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
