#!/usr/bin/env node
/**
 * Full end-to-end test harness for the portfolio + CMS.
 *
 * Usage:
 *   BASE_URL=http://localhost:3000 node scripts/e2e.mjs
 *   BASE_URL=http://localhost:3000 ADMIN_EMAIL=... ADMIN_PASSWORD=... node scripts/e2e.mjs
 *
 * Exercises: every public page, SEO surfaces, auth & session flows, rate
 * limiting, contact + honeypot, and authenticated CRUD round trips for
 * projects, blog, media, messages, builds and settings. Resource IPs are
 * spoofed via X-Forwarded-For so rate-limit tests can't lock out real users.
 */
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const BASE = (process.env.BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");
const EMAIL = process.env.ADMIN_EMAIL ?? "dev.abhishek.ap11@gmail.com";
const PASSWORD = process.env.ADMIN_PASSWORD ?? "Admin@12345";

let passed = 0;
let failed = 0;
const failures = [];

function ok(cond, label, extra = "") {
  if (cond) {
    passed++;
    console.log(`  \x1b[32m✓\x1b[0m ${label}`);
  } else {
    failed++;
    failures.push(label + (extra ? ` — ${extra}` : ""));
    console.log(`  \x1b[31m✗\x1b[0m ${label}${extra ? ` — ${extra}` : ""}`);
  }
}

function section(name) {
  console.log(`\n\x1b[1m${name}\x1b[0m`);
}

// ------------------------------- helpers ----------------------------------
const jar = new Map(); // cookie name -> value (session)
const runId = Date.now().toString(36);
let ipCtr = 0;

function cookieHeader() {
  return [...jar.entries()].map(([k, v]) => `${k}=${v}`).join("; ");
}

async function req(path, { method = "GET", body, json, headers = {}, spoofIp, raw } = {}) {
  const h = { ...headers };
  h["x-forwarded-for"] = spoofIp ?? `10.250.${ipCtr++ % 250}.99`;
  if (jar.size) h.cookie = cookieHeader();
  let payload = body;
  if (json !== undefined) {
    h["content-type"] = "application/json";
    payload = JSON.stringify(json);
  }
  const res = await fetch(BASE + path, { method, headers: h, body: payload, redirect: "manual" });
  const setCookies = res.headers.getSetCookie?.() ?? [];
  for (const c of setCookies) {
    const [pair] = c.split(";");
    const eq = pair.indexOf("=");
    const name = pair.slice(0, eq).trim();
    const value = pair.slice(eq + 1);
    if (value === "" || c.toLowerCase().includes("max-age=0")) jar.delete(name);
    else jar.set(name, value);
  }
  if (raw) return { status: res.status, headers: res.headers, body: await res.arrayBuffer() };
  const text = await res.text();
  let parsed = null;
  try { parsed = JSON.parse(text); } catch { /* html */ }
  return { status: res.status, headers: res.headers, json: parsed, text };
}

const apiReq = (p, o) => req(p, { json: o?.json ?? o?.body, method: o?.method ?? "GET", spoofIp: o?.spoofIp });

/** Anonymous request — never carries the session cookie (for public-visibility checks). */
async function anon(path, { method = "GET", json, spoofIp } = {}) {
  const saved = [...jar.entries()];
  jar.clear();
  const r = await req(path, { method, json, spoofIp });
  jar.clear();
  for (const [k, v] of saved) jar.set(k, v);
  return r;
}

async function main() {
  // ---------------------------------------------------------------- public pages
  section("Public pages");
  const pages = {
    "/": ["Full Stack", "Abhishek"],
    "/about": ["xperience", "Abhishek"],
    "/services": ["Service"],
    "/projects": ["Project"],
    "/blog": [],
    "/contact": ["Contact"],
  };
  for (const [p, markers] of Object.entries(pages)) {
    const r = await req(p);
    ok(r.status === 200, `GET ${p} → 200`, `got ${r.status}`);
    for (const m of markers) ok(r.text.includes(m), `  ${p} contains "${m}"`);
  }
  const nf = await req("/definitely-not-a-page-xyz");
  ok(nf.status === 404, `unknown route → custom 404`, `got ${nf.status}`);
  ok(nf.text.includes("404") || nf.text.includes("not found") || nf.text.includes("Not Found"),
    `  404 page renders custom content`);

  // ---------------------------------------------------------------- detail pages
  section("Detail pages (seeded content)");
  const projects = await apiReq("/api/projects");
  ok(projects.status === 200 && projects.json?.success, "GET /api/projects envelope ok");
  const prjList = projects.json?.data ?? [];
  ok(prjList.length >= 4, `  ≥4 seeded projects (got ${prjList.length})`);
  for (const p of prjList) {
    const r = await req(`/projects/${p.slug}`);
    ok(r.status === 200 && r.text.includes(p.title), `GET /projects/${p.slug} renders`);
  }

  const posts = await apiReq("/api/blog");
  ok(posts.status === 200 && posts.json?.success, "GET /api/blog envelope ok");
  const postList = posts.json?.data ?? [];
  ok(postList.length >= 1, `  seeded posts visible (got ${postList.length})`);
  for (const p of postList) {
    const r = await req(`/blog/${p.slug}`);
    ok(r.status === 200 && r.text.includes(p.title), `GET /blog/${p.slug} renders`);
  }

  // ---------------------------------------------------------------- SEO
  section("SEO surfaces");
  const sm = await req("/sitemap.xml");
  ok(sm.status === 200 && sm.text.includes("<urlset"), "sitemap.xml renders");
  ok(sm.text.includes("/projects/") || sm.text.includes("/blog/"), "  sitemap lists content URLs");
  const robots = await req("/robots.txt");
  ok(robots.status === 200 && /Disallow:\s*\/admin/i.test(robots.text), "robots.txt blocks /admin");
  const home = await req("/");
  ok(home.text.includes("application/ld+json"), "home ships JSON-LD");
  ok(/property="og:title"/.test(home.text) && /name="twitter:card"/.test(home.text), "OG + Twitter meta present");
  ok(prjList.length > 0, "  non-empty project list (seeded)");
  const projectDetail = prjList.length > 0 ? await req(`/projects/${prjList[0].slug}`) : { text: "" };
  ok(projectDetail.text.includes("application/ld+json"), "project detail ships JSON-LD");
  const postDetail = postList.length > 0 ? await req(`/blog/${postList[0].slug}`) : { text: "" };
  ok(postDetail.text.includes("application/ld+json"), "blog detail ships article JSON-LD");

  // ---------------------------------------------------------------- theme system (static)
  section("Theme system (static checks)");
  const globals = readFileSync(join(ROOT, "app/globals.css"), "utf8");
  ok(/\[data-theme="dark"\][\s\S]*--bg:\s*#0/.test(globals), 'dark palette overrides --bg in globals.css');
  ok(globals.includes(".glass") && globals.includes(".nav-pill"), "glass utilities present");
  const rootLayout = readFileSync(join(ROOT, "app/layout.tsx"), "utf8");
  ok(rootLayout.includes("ap-theme") && rootLayout.includes("ap-admin-theme"), "dual-scope theme boot script");
  const navbar = readFileSync(join(ROOT, "components/layout/navbar.tsx"), "utf8");
  ok(navbar.includes("ThemeToggle") && navbar.includes("open-search"), "navbar has theme toggle + search trigger");

  // ---------------------------------------------------------------- auth flows
  section("Auth & session");
  const badLogin = await apiReq("/api/auth/login", {
    method: "POST", json: { email: EMAIL, password: "definitely-wrong-99" }, spoofIp: "10.99.0.1",
  });
  ok(badLogin.status === 401 && badLogin.json?.error?.code === "UNAUTHORIZED",
    "wrong password → 401 envelope", `got ${badLogin.status}`);
  ok(jar.size === 0, "  no session cookie issued on failure");

  const good = await apiReq("/api/auth/login", {
    method: "POST", json: { email: EMAIL, password: PASSWORD }, spoofIp: "10.99.0.1",
  });
  ok(good.status === 200 && good.json?.success && jar.has("ap_session"),
    "correct credentials → session cookie", `got ${good.status}`);
  const me = await apiReq("/api/auth/me");
  ok(me.status === 200 && me.json?.data?.user?.email === EMAIL, "GET /api/auth/me returns the admin");
  const adminHome = await req("/admin");
  ok(adminHome.status === 200 && /Projects|Overview|Dashboard|Messages/i.test(adminHome.text),
    "authed GET /admin → dashboard renders", `got ${adminHome.status}`);

  // ---------------------------------------------------------------- auth guard + rate limit
  section("Authorization guard & rate limiting");
  const cookieBackup = [...jar.entries()];
  jar.clear();
  const needAuth = [
    ["POST", "/api/projects", { title: "x" }],
    ["PATCH", "/api/settings", { site: { name: "x" } }],
    ["DELETE", "/api/blog/whatever"],
    ["GET", "/api/messages"],
  ];
  for (const [m, p, j] of needAuth) {
    const r = await apiReq(p, { method: m, json: j, spoofIp: "10.98.1.7" });
    ok(r.status === 401, `${m} ${p} unauth → 401`, `got ${r.status}`);
  }
  const adminRedirect = await req("/admin");
  ok(adminRedirect.status === 307 && (adminRedirect.headers.get("location") ?? "").includes("/admin/login"),
    "unauth /admin → redirect to login", `got ${adminRedirect.status}`);

  // rate limit: 5 bad attempts → 6th blocked (fresh IP)
  let lastStatus = 0;
  for (let i = 0; i < 6; i++) {
    const r = await apiReq("/api/auth/login", {
      method: "POST", json: { email: EMAIL, password: `wrong-${i}` }, spoofIp: "10.97.2.3",
    });
    lastStatus = r.status;
  }
  ok(lastStatus === 429, "login rate limit kicks in (429 on 6th attempt)", `got ${lastStatus}`);
  // successful login clears the IP bucket on a different fresh IP
  for (const [k, v] of cookieBackup) jar.set(k, v);

  // logout
  const logout = await apiReq("/api/auth/logout", { method: "POST" });
  ok(logout.status === 200 && !jar.has("ap_session"), "logout clears session");
  // log back in for the CRUD sections
  const relogin = await apiReq("/api/auth/login", {
    method: "POST", json: { email: EMAIL, password: PASSWORD }, spoofIp: "10.96.9.9",
  });
  ok(relogin.status === 200 && jar.has("ap_session"), "re-login for CRUD suite");

  // ---------------------------------------------------------------- contact
  section("Contact form + honeypot");
  const missing = await apiReq("/api/contact", {
    method: "POST", json: { name: "A", email: "bad", subject: "hi", message: "short" }, spoofIp: "10.95.4.12",
  });
  ok(missing.status === 400 && missing.json?.error?.code === "VALIDATION_ERROR",
    "invalid payload → 400 validation envelope", `got ${missing.status}`);
  const sent = await apiReq("/api/contact", {
    method: "POST",
    json: { name: "E2E Test", email: "e2e@example.com", subject: "Smoke test", message: "This is an automated end-to-end test message." },
    spoofIp: "10.95.4.12",
  });
  ok((sent.status === 200 || sent.status === 201) && sent.json?.data?.id, "valid payload → message id", `got ${sent.status}`);
  const honeypot = await apiReq("/api/contact", {
    method: "POST",
    json: { name: "Bot", email: "bot@spam.io", subject: "Spammy spam offer", message: "This message is long enough to pass validation checks.", website: "http://spam.example" },
    spoofIp: "10.94.6.1",
  });
  ok(honeypot.status === 200 || honeypot.status === 400, `honeypot handled (${honeypot.status}) — no 5xx`);
  // contact rate limit (fresh ip, 5 messages)
  let contactLast = 0;
  for (let i = 0; i < 6; i++) {
    const r = await apiReq("/api/contact", {
      method: "POST", json: { name: "RL Test", email: "rl@example.com", subject: `Burst ${i}`, message: `Rate limit burst test number ${i} with enough length.` },
      spoofIp: "10.93.3.30",
    });
    contactLast = r.status;
  }
  ok(contactLast === 429, "contact rate limit kicks in (429 after burst)", `got ${contactLast}`);

  // verify the message is readable in the inbox, then tidy it up
  const inbox = await apiReq("/api/messages");
  const e2eMsg = inbox.json?.data?.items?.find((m) => m.email === "e2e@example.com")
    ?? inbox.json?.data?.find?.((m) => m.email === "e2e@example.com");
  ok(Boolean(e2eMsg), "contact message appears in admin inbox");
  if (e2eMsg) {
    const del = await apiReq(`/api/messages/${e2eMsg.id}`, { method: "DELETE" });
    ok(del.status === 200, "message delete works (test cleanup)");
  }

  // ---------------------------------------------------------------- project CRUD round trip
  section("Project CRUD round trip");
  const slug = `e2e-probe-${runId}`;
  const create = await apiReq("/api/projects", {
    method: "POST",
    json: {
      title: "E2E Probe Project", slug,
      shortDescription: "Automated test fixture — safe to delete.",
      description: "Created by the e2e harness to verify CRUD round trips end to end.",
      techStack: ["Playwright-of-Node", "Fetch"],
      featureImage: "/seed/feature/invoice-system.jpg",
      gallery: [], keyFeatures: [], role: "Test", year: "2026",
      status: "draft", featured: false,
    },
  });
  const createdId = create.json?.data?.id;
  ok(create.status === 201 || create.status === 200, "create draft project", `got ${create.status} ${JSON.stringify(create.json?.error ?? "")}`);
  ok(Boolean(createdId), "  id returned");
  const draftVisible = await anon("/api/projects");
  ok(!((draftVisible.json?.data ?? []).some((p) => p.slug === slug)), "draft hidden from public list");
  const publish = await apiReq(`/api/projects/${createdId}`, { method: "PATCH", json: { status: "published" } });
  ok(publish.status === 200, "publish project via PATCH");
  const nowPublic = await anon(`/projects/${slug}`);
  ok(nowPublic.status === 200, "published project detail live at /projects/<slug>", `got ${nowPublic.status}`);
  const listNow = await anon("/api/projects");
  ok((listNow.json?.data ?? []).some((p) => p.slug === slug), "  appears in public list");
  const delProj = await apiReq(`/api/projects/${createdId}`, { method: "DELETE" });
  ok(delProj.status === 200, "delete project (cleanup)");
  const gone = await anon(`/projects/${slug}`);
  // Next streams public layouts → notFound content ships with 200 + robots:noindex
  // (documented soft-404). Accept a real 404 OR the noindex soft-404 contract.
  const goneSoft = gone.status === 200 && gone.text.includes('name="robots" content="noindex"');
  ok(gone.status === 404 || goneSoft, "  detail 404s (real status or noindex soft-404)", `got ${gone.status}, noindex=${goneSoft}`);

  // slug conflict validation
  ok(prjList.length > 0, "conflict test has a seeded slug to clash with");
  if (prjList.length === 0) prjList.push({ slug: "__none__" });
  const conflict = await apiReq("/api/projects", {
    method: "POST",
    json: { title: "Conflicting Fixture", slug: prjList[0].slug, shortDescription: "A sufficiently long short description for validation.", description: "A nicely long description body that passes the minimum-length requirement of the schema.", featureImage: "/seed/feature/invoice-system.jpg", techStack: ["a"] },
  });
  ok(conflict.status === 409, `duplicate slug → 409`, `got ${conflict.status}`);

  // ---------------------------------------------------------------- blog CRUD round trip
  section("Blog CRUD round trip");
  const bslug = `e2e-probe-post-${runId}`;
  const bcreate = await apiReq("/api/blog", {
    method: "POST",
    json: {
      title: "E2E Probe Post", slug: bslug,
      excerpt: "Automated fixture verifying the blog pipeline end to end.",
      coverImage: "/seed/blog/realtime-systems.jpg",
      content: "<p>Fixture body for the e2e probe. This verifies create → publish → delete.</p>",
      tags: ["e2e"], status: "published",
      publishedAt: new Date().toISOString(),
    },
  });
  const bId = bcreate.json?.data?.id;
  ok((bcreate.status === 200 || bcreate.status === 201) && Boolean(bId), "create + publish post", `got ${bcreate.status} ${JSON.stringify(bcreate.json?.error ?? "")}`);
  const bLive = await anon(`/blog/${bslug}`);
  ok(bLive.status === 200 && bLive.text.includes("E2E Probe Post"), "post live at /blog/<slug>", `got ${bLive.status}`);
  ok(bLive.text.includes("application/ld+json"), "  article JSON-LD present");
  const sitemapAfter = await req("/sitemap.xml");
  ok(sitemapAfter.text.includes(bslug), "  dynamic sitemap picked it up");
  const bDel = await apiReq(`/api/blog/${bId}`, { method: "DELETE" });
  ok(bDel.status === 200, "delete post (cleanup)");

  // ---------------------------------------------------------------- media upload
  section("Media upload + validation");
  const pngB64 =
    "iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAYAAADED76LAAAAFElEQVR4nGP8//8/AyGAiShVDAwA/PEUFhcyJDIAAAAASUVORK5CYII=";
  const png = Buffer.from(pngB64, "base64");
  // Minimal *valid* empty ZIP archive (EOCD record) for the builds pipeline.
  const zip = Buffer.from([0x50, 0x4b, 0x05, 0x06, 0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0]);
  const form = new FormData();
  form.append("files", new Blob([png], { type: "image/png" }), "e2e-pixel.png");
  const up = await fetch(BASE + "/api/media", {
    method: "POST", body: form,
    headers: { cookie: cookieHeader(), "x-forwarded-for": "10.92.5.40" },
  });
  const upJson = await up.json().catch(() => null);
  const uploadedUrl = upJson?.data?.items?.[0]?.url ?? upJson?.data?.url;
  ok((up.status === 200 || up.status === 201) && upJson?.success && Boolean(uploadedUrl), "png upload accepted", `got ${up.status}`);
  if (uploadedUrl) {
    const img = await req(uploadedUrl, { raw: true });
    ok(img.status === 200 && Number(img.headers.get("content-length")) > 0, "  uploaded asset serves 200");
  }
  const badForm = new FormData();
  badForm.append("files", new Blob([Buffer.from("MZ fake exe")], { type: "application/octet-stream" }), "evil.exe");
  const badUp = await fetch(BASE + "/api/media", {
    method: "POST", body: badForm,
    headers: { cookie: cookieHeader(), "x-forwarded-for": "10.92.5.40" },
  });
  ok(badUp.status === 400, ".exe upload rejected (400)", `got ${badUp.status}`);
  if (uploadedUrl) {
    const mediaList = await apiReq("/api/media");
    const mediaId = (mediaList.json?.data?.items ?? mediaList.json?.data ?? []).find((m) => m.url === uploadedUrl)?.id;
    if (mediaId) {
      const delM = await apiReq("/api/media", { method: "DELETE", json: { id: mediaId } });
      ok(delM.status === 200, "media delete works (cleanup)");
    }
  }

  // ---------------------------------------------------------------- builds pipeline
  section("Builds chunked pipeline");
  const init = await apiReq("/api/builds/init", {
    method: "POST",
    json: { filename: `e2e-app-${runId}.zip`, size: zip.length, version: "9.9.9", platform: "android" },
  });
  ok((init.status === 200 || init.status === 201) && init.json?.data?.uploadId, "build init → uploadId", `got ${init.status} ${JSON.stringify(init.json?.error ?? "")}`);
  const uploadId = init.json?.data?.uploadId;
  if (uploadId) {
    const chunk = await fetch(BASE + `/api/builds/chunk?id=${encodeURIComponent(uploadId)}&index=0`, {
      method: "PUT", body: zip,
      headers: { cookie: cookieHeader(), "x-forwarded-for": "10.91.8.8", "content-type": "application/octet-stream" },
    });
    ok(chunk.status === 200, "chunk upload (index 0)", `got ${chunk.status}`);
    const fin = await apiReq("/api/builds/finalize", { method: "POST", json: { uploadId } });
    ok(fin.status === 200 || fin.status === 201, "finalize → build registered", `got ${fin.status} ${JSON.stringify(fin.json?.error ?? "")}`);
    const listB = await apiReq("/api/builds");
    const bIdList = (listB.json?.data ?? []).find((b) => b.version === "9.9.9")?.id;
    ok(Boolean(bIdList), "  build listed");
    const bItem = (listB.json?.data ?? []).find((b) => b.version === "9.9.9");
    if (bItem?.url) {
      const dl = await anon(bItem.url, { spoofIp: "10.88.2.20" });
      ok(dl.status === 200, "  build binary serves via uploads route", `got ${dl.status}`);
      const badPath = await anon("/uploads/builds/../../data/users.json", { spoofIp: "10.88.2.21" });
      ok(badPath.status === 404 || badPath.status === 307, "  uploads traversal blocked", `got ${badPath.status}`);
    }
    if (bIdList) {
      const delB = await apiReq(`/api/builds/${bIdList}`, { method: "DELETE" });
      ok(delB.status === 200, "build delete works (cleanup)");
    }
  }

  // ---------------------------------------------------------------- settings + password round trip
  section("Settings & password lifecycle");
  const settingsBefore = await apiReq("/api/settings");
  const origTagline = settingsBefore.json?.data?.profile?.tagline;
  const probeTagline = `E2E probe ${runId}`;
  const spatch = await apiReq("/api/settings", {
    method: "PATCH",
    json: { ...settingsBefore.json?.data,
      profile: { ...settingsBefore.json?.data?.profile, tagline: probeTagline },
      theme: { adminDefault: "light" },
    },
  });
  ok(spatch.status === 200, "settings PATCH accepted");
  const aboutAfter = await req("/about");
  ok(aboutAfter.text.includes(probeTagline), "  public site reflects settings immediately", "");
  const freshSettings = await apiReq("/api/settings");
  ok(freshSettings.json?.data?.profile?.tagline === probeTagline,
    "  updated settings read back from persistent store");
  const loginTheme = await req("/admin/login");
  ok(loginTheme.text.includes('isAdmin ? "light"'), "  admin theme default reflects settings");
  await apiReq("/api/settings", {
    method: "PATCH",
    json: { ...settingsBefore.json?.data, profile: { ...settingsBefore.json?.data?.profile, tagline: origTagline } },
  });

  const TEMP_PASS = "E2eProbe-123";
  const wrongCurrent = await apiReq("/api/settings/password", {
    method: "POST",
    json: { currentPassword: "not-the-password", newPassword: TEMP_PASS, confirmPassword: TEMP_PASS },
  });
  ok(wrongCurrent.status === 400, "incorrect current password refused", `got ${wrongCurrent.status}`);
  const mismatch = await apiReq("/api/settings/password", {
    method: "POST",
    json: { currentPassword: PASSWORD, newPassword: TEMP_PASS, confirmPassword: "Mismatch999" },
  });
  ok(mismatch.status === 400, "mismatched new passwords refused", `got ${mismatch.status}`);
  const firstSession = jar.get("ap_session");
  const secondLogin = await apiReq("/api/auth/login", {
    method: "POST", json: { email: EMAIL, password: PASSWORD }, spoofIp: "10.90.7.71",
  });
  ok(secondLogin.status === 200, "second active session issued", `got ${secondLogin.status}`);
  const oldSession = jar.get("ap_session");
  const p1 = await apiReq("/api/settings/password", {
    method: "POST",
    json: { currentPassword: PASSWORD, newPassword: TEMP_PASS, confirmPassword: TEMP_PASS },
  });
  ok(p1.status === 200, "password change accepted", `got ${p1.status} ${JSON.stringify(p1.json?.error ?? "")}`);
  if (oldSession) jar.set("ap_session", oldSession);
  const meAfter = await apiReq("/api/auth/me");
  ok(meAfter.status === 401, "  current session invalidated after password change", `got ${meAfter.status}`);
  if (firstSession) jar.set("ap_session", firstSession);
  const otherSessionAfter = await apiReq("/api/auth/me");
  ok(otherSessionAfter.status === 401, "  other active session invalidated too", `got ${otherSessionAfter.status}`);
  const staleAdmin = await req("/admin");
  ok(staleAdmin.status === 307 && (staleAdmin.headers.get("location") ?? "").includes("/admin/login"),
    "  stale device redirected to login", `got ${staleAdmin.status}`);
  const staleLoginPage = await req("/admin/login");
  ok(staleLoginPage.status === 200, "  login page reachable with stale signed cookie (no loop)",
    `got ${staleLoginPage.status}`);
  jar.delete("ap_session");
  const badRelog = await apiReq("/api/auth/login", {
    method: "POST", json: { email: EMAIL, password: PASSWORD }, spoofIp: "10.90.7.70",
  });
  ok(badRelog.status === 401, "  old password rejected", `got ${badRelog.status}`);
  const goodRelog = await apiReq("/api/auth/login", {
    method: "POST", json: { email: EMAIL, password: TEMP_PASS }, spoofIp: "10.90.7.70",
  });
  ok(goodRelog.status === 200, "  login with new password", `got ${goodRelog.status}`);
  const p2 = await apiReq("/api/settings/password", {
    method: "POST",
    json: { currentPassword: TEMP_PASS, newPassword: PASSWORD, confirmPassword: PASSWORD },
  });
  ok(p2.status === 200, "  password restored to original", `got ${p2.status}`);
  const finalLogin = await apiReq("/api/auth/login", {
    method: "POST", json: { email: EMAIL, password: PASSWORD }, spoofIp: "10.89.1.50",
  });
  ok(finalLogin.status === 200, "  final login with restored password", `got ${finalLogin.status}`);

  // reset-admin script end-to-end: scramble password → old creds fail →
  // script restores → default creds work again.
  if (process.env.DATA_SYNC_PATH) {
    // (In-sandbox runs only: mutate the data dir the server reads.)
    const { execSync } = await import("node:child_process");
    execSync(`node scripts/reset-admin.mjs --password=Scrambled999!`, {
      env: { ...process.env, DATA_DIR: process.env.DATA_SYNC_PATH },
    });
    const stale = await apiReq("/api/auth/login", {
      method: "POST", json: { email: EMAIL, password: PASSWORD }, spoofIp: "10.87.4.60",
    });
    ok(stale.status === 401, "reset-admin scramble → old password rejected", `got ${stale.status}`);
    const fresh = await apiReq("/api/auth/login", {
      method: "POST", json: { email: EMAIL, password: "Scrambled999!" }, spoofIp: "10.87.4.61",
    });
    ok(fresh.status === 200, "  scrambled password accepted", `got ${fresh.status}`);
    execSync(`node scripts/reset-admin.mjs`, { env: { ...process.env, DATA_DIR: process.env.DATA_SYNC_PATH } });
    const restored = await apiReq("/api/auth/login", {
      method: "POST", json: { email: EMAIL, password: PASSWORD }, spoofIp: "10.87.4.62",
    });
    ok(restored.status === 200, "reset-admin → default credentials restored", `got ${restored.status}`);
    // re-login so the test suite finishes authed with a valid tokenVersion
    await apiReq("/api/auth/login", { method: "POST", json: { email: EMAIL, password: PASSWORD }, spoofIp: "10.87.4.63" });
  }

  // ---------------------------------------------------------------- summary
  const total = passed + failed;
  console.log(`\n${"─".repeat(52)}`);
  if (failed === 0) {
    console.log(`\x1b[32m\x1b[1mALL ${total} CHECKS PASSED\x1b[0m`);
    process.exit(0);
  } else {
    console.log(`\x1b[31m\x1b[1m${failed}/${total} CHECKS FAILED\x1b[0m`);
    for (const f of failures) console.log(`  - ${f}`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("\nHarness crashed:", err);
  process.exit(2);
});
