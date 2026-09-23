#!/usr/bin/env node
/**
 * Rasterizes the seed asset SVGs (in scripts/assets) to JPEG seed images.
 * These ship as committed placeholders — replace them with real artwork by
 * simply overwriting the files in public/seed/ (or re-running an image
 * generator). Paths MUST stay stable because data/seed JSON references them.
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const out = (p) => join(root, "public", p);
mkdirSync(out("seed/gallery"), { recursive: true });
mkdirSync(out("seed/blog"), { recursive: true });

const FONT = "font-family='Verdana, Arial, sans-serif'";

// ---------------------------------------------------------------------------
// 1. gallery/g4 — payments/subscriptions dashboard mock
// ---------------------------------------------------------------------------
const g4 = `
<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1000" viewBox="0 0 1600 1000">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#f6f5f3"/><stop offset="1" stop-color="#eceaf1"/>
    </linearGradient>
    <linearGradient id="acc" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#6d28d9"/><stop offset="1" stop-color="#8b5cf6"/>
    </linearGradient>
  </defs>
  <rect width="1600" height="1000" fill="url(#bg)"/>
  <rect x="0" y="0" width="1600" height="86" fill="#ffffff"/>
  <circle cx="52" cy="43" r="12" fill="#6d28d9"/>
  <rect x="82" y="34" width="130" height="18" rx="6" fill="#e4e2e9"/>
  <rect x="1330" y="28" width="120" height="32" rx="16" fill="#f1eff6"/>
  <rect x="1462" y="28" width="100" height="32" rx="16" fill="url(#acc)"/>

  <rect x="60" y="130" width="480" height="260" rx="20" fill="#ffffff" stroke="#e6e3ea"/>
  <rect x="90" y="160" width="150" height="16" rx="6" fill="#e4e2e9"/>
  <rect x="90" y="196" width="220" height="40" rx="8" fill="#6d28d9" opacity="0.14"/>
  <text x="104" y="226" ${FONT} font-size="26" font-weight="bold" fill="#6d28d9">$18,420</text>
  <rect x="90" y="258" width="410" height="10" rx="5" fill="#efedf3"/>
  <rect x="90" y="258" width="300" height="10" rx="5" fill="url(#acc)"/>
  <rect x="90" y="286" width="410" height="10" rx="5" fill="#efedf3"/>
  <rect x="90" y="286" width="215" height="10" rx="5" fill="url(#acc)" opacity="0.7"/>
  <rect x="90" y="314" width="410" height="10" rx="5" fill="#efedf3"/>
  <rect x="90" y="314" width="150" height="10" rx="5" fill="url(#acc)" opacity="0.45"/>

  <rect x="580" y="130" width="480" height="260" rx="20" fill="#ffffff" stroke="#e6e3ea"/>
  <rect x="610" y="160" width="140" height="16" rx="6" fill="#e4e2e9"/>
  ${[0,1,2,3,4,5,6].map(i=>`<rect x="${610+i*58}" y="${340-30-i*22}" width="34" height="${30+i*22}" rx="6" fill="url(#acc)" opacity="${0.35+i*0.09}"/>`).join("")}

  <rect x="1100" y="130" width="440" height="260" rx="20" fill="#211a33"/>
  <rect x="1130" y="162" width="120" height="14" rx="6" fill="#493e63"/>
  <text x="1130" y="216" ${FONT} font-size="24" fill="#ffffff" opacity="0.9">••••  ••••  4821</text>
  <rect x="1130" y="310" width="90" height="12" rx="6" fill="#493e63"/>
  <circle cx="1470" cy="330" r="18" fill="#8b5cf6"/><circle cx="1444" cy="330" r="18" fill="#6d28d9" opacity="0.85"/>

  <rect x="60" y="430" width="1480" height="500" rx="20" fill="#ffffff" stroke="#e6e3ea"/>
  <rect x="90" y="460" width="180" height="18" rx="7" fill="#e4e2e9"/>
  ${[0,1,2,3,4,5].map(i=>`
    <rect x="90" y="${520+i*66}" width="1420" height="1.5" fill="#f0eef4"/>
    <rect x="90" y="${524+i*66}" width="34" height="34" rx="10" fill="${i%2? "#ede9fe" : "#f1eff6"}"/>
    <rect x="140" y="${532+i*66}" width="${180-i*18}" height="14" rx="6" fill="#e0dde6"/>
    <rect x="980" y="${532+i*66}" width="90" height="14" rx="6" fill="#e0dde6"/>
    <rect x="1180" y="${528+i*66}" width="100" height="22" rx="11" fill="${i%3==0? "#d1fae5" : (i%3==1? "#ede9fe" : "#fee2e2")}"/>
  `).join("")}
</svg>`;

// ---------------------------------------------------------------------------
// 2. blog/realtime-systems — network nodes over dark indigo
// ---------------------------------------------------------------------------
const realtime = `
<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900" viewBox="0 0 1600 900">
  <defs>
    <radialGradient id="c1" cx="30%" cy="30%" r="80%">
      <stop offset="0" stop-color="#232a55"/><stop offset="1" stop-color="#0d1026"/>
    </radialGradient>
    <linearGradient id="beam" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#818cf8" stop-opacity="0"/>
      <stop offset="0.5" stop-color="#818cf8"/>
      <stop offset="1" stop-color="#14b8a6" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <rect width="1600" height="900" fill="url(#c1)"/>
  <g stroke="#3b4380" stroke-width="1">
    ${Array.from({length:16}).map((_,i)=>`<line x1="${i*100}" y1="0" x2="${i*100}" y2="900" opacity="0.35"/>`).join("")}
    ${Array.from({length:9}).map((_,i)=>`<line x1="0" y1="${i*100}" x2="1600" y2="${i*100}" opacity="0.35"/>`).join("")}
  </g>
  <g stroke="url(#beam)" stroke-width="2.5" opacity="0.9">
    <line x1="240" y1="620" x2="520" y2="320"/><line x1="520" y1="320" x2="880" y2="480"/>
    <line x1="880" y1="480" x2="1220" y2="240"/><line x1="520" y1="320" x2="760" y2="160"/>
    <line x1="880" y1="480" x2="1150" y2="620"/><line x1="240" y1="620" x2="560" y2="740"/>
    <line x1="560" y1="740" x2="1150" y2="620"/><line x1="1220" y1="240" x2="1420" y2="430"/>
    <line x1="1420" y1="430" x2="1150" y2="620"/><line x1="760" y1="160" x2="1220" y2="240"/>
  </g>
  ${[[240,620],[520,320],[880,480],[1220,240],[760,160],[1150,620],[560,740],[1420,430]].map(([x,y],i)=>`
    <circle cx="${x}" cy="${y}" r="46" fill="none" stroke="#818cf8" stroke-width="1.5" opacity="0.28"/>
    <circle cx="${x}" cy="${y}" r="${i%2?14:18}" fill="${i%3==0? "#14b8a6" : "#6366f1"}"/>
    <circle cx="${x}" cy="${y}" r="${i%2?28:36}" fill="${i%3==0? "#14b8a6" : "#6366f1"}" opacity="0.12"/>`).join("")}
  <text x="80" y="820" ${FONT} font-size="30" fill="#a5b4fc" letter-spacing="8">REAL-TIME · SOCKET.IO · WEBSOCKETS</text>
</svg>`;

// ---------------------------------------------------------------------------
// 3. blog/nextjs-production — stacked isometric browser windows
// ---------------------------------------------------------------------------
const nextjs = `
<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900" viewBox="0 0 1600 900">
  <defs>
    <linearGradient id="nb" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#eef1ff"/><stop offset="1" stop-color="#e2e7fb"/>
    </linearGradient>
    <linearGradient id="na" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#6366f1"/><stop offset="1" stop-color="#4f46e5"/>
    </linearGradient>
  </defs>
  <rect width="1600" height="900" fill="url(#nb)"/>
  <circle cx="1330" cy="150" r="230" fill="#c7d2fe" opacity="0.5"/>
  <circle cx="180" cy="760" r="180" fill="#99f6e4" opacity="0.35"/>

  <g transform="translate(300 200) rotate(-3)">
    <rect width="720" height="430" rx="22" fill="#1e1b4b" opacity="0.12" transform="translate(26 32)"/>
    <rect width="720" height="430" rx="22" fill="#ffffff"/>
    <rect width="720" height="56" rx="22" fill="#eef0fb"/>
    <rect y="34" width="720" height="22" fill="#eef0fb"/>
    <circle cx="30" cy="28" r="7" fill="#fca5a5"/><circle cx="54" cy="28" r="7" fill="#fcd34d"/><circle cx="78" cy="28" r="7" fill="#86efac"/>
    <rect x="24" y="86" width="300" height="24" rx="8" fill="#4338ca" opacity="0.9"/>
    <rect x="24" y="132" width="480" height="14" rx="7" fill="#dfe3f2"/>
    <rect x="24" y="158" width="420" height="14" rx="7" fill="#dfe3f2"/>
    <rect x="24" y="200" width="150" height="42" rx="21" fill="url(#na)"/>
    <rect x="24" y="270" width="672" height="120" rx="14" fill="#eef0fb"/>
    <polyline points="44,370 150,300 260,336 380,282 500,330 660,288" fill="none" stroke="#4f46e5" stroke-width="6" stroke-linecap="round"/>
  </g>

  <g transform="translate(910 330) rotate(4)">
    <rect width="480" height="340" rx="20" fill="#111033"/>
    <rect x="24" y="24" width="432" height="1.5" fill="#2b2766"/>
    ${["#818cf8","#5eead4","#fca5a5","#a5b4fc","#5eead4"].map((c,i)=>`
      <rect x="24" y="${56+i*40}" width="${140+i*52}" height="16" rx="7" fill="${c}" opacity="0.9"/>
      <rect x="${190+i*52}" y="${56+i*40}" width="${240-i*30}" height="16" rx="7" fill="#2b2766"/>`).join("")}
    <rect x="24" y="270" width="432" height="46" rx="12" fill="#1c1950"/>
    <text x="42" y="299" ${FONT} font-size="20" fill="#a5b4fc">$ next build  ✓ 2.4s</text>
  </g>
</svg>`;

// ---------------------------------------------------------------------------
// 4. blog/figma-to-react — design frame → code window
// ---------------------------------------------------------------------------
const figma = `
<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900" viewBox="0 0 1600 900">
  <defs>
    <linearGradient id="fb" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#fbf7f2"/><stop offset="1" stop-color="#f3eefb"/>
    </linearGradient>
    <linearGradient id="fa" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#a78bfa"/><stop offset="1" stop-color="#7c3aed"/>
    </linearGradient>
  </defs>
  <rect width="1600" height="900" fill="url(#fb)"/>

  <g transform="translate(120 170)">
    <rect width="560" height="480" rx="24" fill="#ffffff" stroke="#e8e2f2" stroke-width="2"/>
    <rect x="28" y="28" width="200" height="20" rx="8" fill="#d9d3ea"/>
    <rect x="28" y="72" width="504" height="170" rx="16" fill="#efeaf9"/>
    <circle cx="102" cy="157" r="46" fill="url(#fa)"/>
    <rect x="176" y="118" width="240" height="22" rx="9" fill="#d9d3ea"/>
    <rect x="176" y="156" width="180" height="16" rx="8" fill="#e4def0"/>
    <rect x="176" y="186" width="130" height="16" rx="8" fill="#e4def0"/>
    <rect x="28" y="268" width="154" height="110" rx="14" fill="#f3effb"/>
    <rect x="203" y="268" width="154" height="110" rx="14" fill="#f3effb"/>
    <rect x="378" y="268" width="154" height="110" rx="14" fill="#f3effb"/>
    <rect x="28" y="402" width="504" height="46" rx="23" fill="url(#fa)"/>
    <rect x="222" y="417" width="116" height="16" rx="8" fill="#ffffff" opacity="0.85"/>
  </g>

  <g>
    <path d="M 700 430 L 860 430" stroke="#7c3aed" stroke-width="6" stroke-linecap="round" fill="none" opacity="0.5"/>
    <path d="M 838 412 L 866 430 L 838 448" stroke="#7c3aed" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" fill="none" opacity="0.5"/>
  </g>

  <g transform="translate(910 230)">
    <rect width="560" height="400" rx="24" fill="#17133a"/>
    <circle cx="36" cy="36" r="7" fill="#fca5a5"/><circle cx="60" cy="36" r="7" fill="#fcd34d"/><circle cx="84" cy="36" r="7" fill="#86efac"/>
    <text x="32" y="102" ${FONT} font-size="22" fill="#c4b5fd">export function Hero() {</text>
    <text x="58" y="142" ${FONT} font-size="22" fill="#5eead4">return &lt;Card tone="accent"&gt;</text>
    <text x="88" y="182" ${FONT} font-size="22" fill="#a5b4fc">&lt;Button&gt;Get started&lt;/Button&gt;</text>
    <text x="58" y="222" ${FONT} font-size="22" fill="#5eead4">&lt;/Card&gt;;</text>
    <text x="32" y="262" ${FONT} font-size="22" fill="#c4b5fd">}</text>
    <rect x="32" y="300" width="300" height="60" rx="12" fill="#221d4f"/>
    <text x="52" y="338" ${FONT} font-size="18" fill="#7dd3fc">aria-label ✓  focus ✓  contrast ✓</text>
  </g>
</svg>`;

// ---------------------------------------------------------------------------
// 5. avatar — flat vector portrait
// ---------------------------------------------------------------------------
const avatar = `
<svg xmlns="http://www.w3.org/2000/svg" width="900" height="900" viewBox="0 0 900 900">
  <defs>
    <linearGradient id="ab" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#eef0fb"/><stop offset="1" stop-color="#e2e6f5"/>
    </linearGradient>
    <linearGradient id="shirt" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#312e81"/><stop offset="1" stop-color="#232051"/>
    </linearGradient>
  </defs>
  <rect width="900" height="900" fill="url(#ab)"/>
  <circle cx="450" cy="430" r="330" fill="#dfe5f6"/>
  <circle cx="450" cy="430" r="330" fill="none" stroke="#c4cdf0" stroke-width="3" stroke-dasharray="4 14"/>

  <path d="M450 900 C240 900 205 770 205 700 C205 620 300 580 450 580 C600 580 695 620 695 700 C695 770 660 900 450 900 Z" fill="url(#shirt)"/>
  <rect x="416" y="520" width="68" height="70" rx="24" fill="#c98f5f"/>
  <path d="M416 560 C430 585 470 585 484 560 L484 520 L416 520 Z" fill="#b0784a"/>

  <ellipse cx="450" cy="420" rx="150" ry="165" fill="#d49a67"/>
  <path d="M300 420 C300 300 360 235 450 235 C540 235 600 300 600 420 C600 440 596 455 590 465 C585 400 570 330 540 320 C500 345 380 345 350 320 C325 335 312 395 308 465 C302 455 300 440 300 420 Z" fill="#241f2e"/>
  <path d="M350 320 C360 300 420 288 450 288 L450 345 C410 345 365 340 350 320 Z" fill="#241f2e"/>
  <path d="M540 320 C530 300 480 288 450 288 L450 345 C490 345 525 340 540 320 Z" fill="#241f2e" opacity="0.96"/>

  <ellipse cx="390" cy="425" rx="14" ry="16" fill="#241f2e"/>
  <ellipse cx="510" cy="425" rx="14" ry="16" fill="#241f2e"/>
  <circle cx="394" cy="420" r="4.5" fill="#ffffff"/>
  <circle cx="514" cy="420" r="4.5" fill="#ffffff"/>

  <path d="M368 385 C382 374 404 374 416 383" stroke="#241f2e" stroke-width="10" stroke-linecap="round" fill="none"/>
  <path d="M484 383 C496 374 518 374 532 385" stroke="#241f2e" stroke-width="10" stroke-linecap="round" fill="none"/>

  <path d="M438 425 C432 455 428 470 442 478 L458 478 C452 470 452 455 456 440" fill="#c98f5f"/>
  <path d="M405 520 C430 542 470 542 495 520" stroke="#8f5a33" stroke-width="10" stroke-linecap="round" fill="none"/>

  <path d="M330 640 L450 690 L570 640 L570 610 C520 592 380 592 330 610 Z" fill="#3f3c78"/>
  <rect x="424" y="676" width="52" height="52" rx="12" fill="#4f46e5"/>
  <text x="450" y="711" ${FONT} font-size="26" font-weight="bold" fill="#ffffff" text-anchor="middle">&lt;/&gt;</text>
</svg>`;

// ---------------------------------------------------------------------------
// 6. og-default — social share banner
// ---------------------------------------------------------------------------
const og = `
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <radialGradient id="o1" cx="85%" cy="10%" r="70%">
      <stop offset="0" stop-color="#4338ca" stop-opacity="0.55"/><stop offset="1" stop-color="#0d1026" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="o2" cx="8%" cy="95%" r="70%">
      <stop offset="0" stop-color="#0f766e" stop-opacity="0.4"/><stop offset="1" stop-color="#0d1026" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="1200" height="630" fill="#0d1026"/>
  <rect width="1200" height="630" fill="url(#o1)"/>
  <rect width="1200" height="630" fill="url(#o2)"/>
  <g stroke="#262c55" stroke-width="1">
    ${Array.from({length:12}).map((_,i)=>`<line x1="${i*100}" y1="0" x2="${i*100}" y2="630"/>`).join("")}
    ${Array.from({length:7}).map((_,i)=>`<line x1="0" y1="${i*90}" x2="1200" y2="${i*90}"/>`).join("")}
  </g>
  <rect x="72" y="66" width="64" height="64" rx="18" fill="#4f46e5"/>
  <text x="104" y="110" ${FONT} font-size="30" font-weight="bold" fill="#ffffff" text-anchor="middle">AP</text>
  <rect x="72" y="245" width="90" height="6" rx="3" fill="#4f46e5"/>
  <text x="72" y="330" ${FONT} font-size="76" font-weight="bold" fill="#ffffff">Abhishek Prajapati</text>
  <text x="72" y="402" ${FONT} font-size="32" fill="#a5b4fc">Full Stack Developer — MERN · Next.js · React Native</text>
  <text x="72" y="540" ${FONT} font-size="24" fill="#5b6285" letter-spacing="4">PORTFOLIO · BLOG · CASE STUDIES</text>
</svg>`;

// ---------------------------------------------------------------------------

const jobs = [
  { file: "seed/gallery/g4.jpg", svg: g4, width: 1600 },
  { file: "seed/blog/realtime-systems.jpg", svg: realtime, width: 1600 },
  { file: "seed/blog/nextjs-production.jpg", svg: nextjs, width: 1600 },
  { file: "seed/blog/figma-to-react.jpg", svg: figma, width: 1600 },
  { file: "seed/avatar.jpg", svg: avatar, width: 900 },
  { file: "seed/og-default.jpg", svg: og, width: 1200 },
];

for (const job of jobs) {
  const dest = out(job.file);
  try {
    const buf = await sharp(Buffer.from(job.svg)).jpeg({ quality: 88 }).toBuffer();
    writeFileSync(dest, buf);
    console.log(`  ✓ ${job.file} (${(buf.length / 1024).toFixed(0)} KB)`);
  } catch (err) {
    console.error(`  ✗ ${job.file}:`, err.message);
    process.exitCode = 1;
  }
}
console.log("Done.");
