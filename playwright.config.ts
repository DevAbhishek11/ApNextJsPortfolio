import { defineConfig } from "@playwright/test";

// Run against a running production instance, just like scripts/e2e.mjs:
//   npx playwright install --with-deps chromium
//   npm run build && npm run start
//   npm run test:responsive
// BASE_URL can point to another instance. The executable override is useful
// in sandboxes that provide Chromium but cannot download Playwright browsers.
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
const viewports = [
  { name: "small-phone", width: 320, height: 568 },
  { name: "android-phone", width: 360, height: 800 },
  { name: "iphone-se", width: 375, height: 667 },
  { name: "iphone", width: 390, height: 844 },
  { name: "android-wide", width: 412, height: 915 },
  { name: "wide-phone", width: 430, height: 932 },
  { name: "small-landscape", width: 568, height: 320 },
  { name: "sm-breakpoint", width: 640, height: 800 },
  { name: "below-tablet", width: 767, height: 900 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "phone-landscape", width: 844, height: 390 },
  { name: "below-desktop", width: 1023, height: 768 },
  { name: "desktop-breakpoint", width: 1024, height: 768 },
  { name: "desktop", width: 1440, height: 900 },
];

export default defineConfig({
  testDir: "./scripts",
  testMatch: "responsive.spec.ts",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  workers: 3,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: "list",
  use: {
    baseURL: process.env.BASE_URL || "http://localhost:3000",
    browserName: "chromium",
    actionTimeout: 10_000,
    navigationTimeout: 30_000,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    launchOptions: executablePath
      ? { executablePath, args: ["--no-sandbox"] }
      : {},
  },
  projects: viewports.map(({ name, width, height }) => ({
    name,
    use: {
      viewport: { width, height },
      isMobile: width < 1024,
      hasTouch: width < 1024,
      deviceScaleFactor: width < 1024 ? 2 : 1,
    },
  })),
});
