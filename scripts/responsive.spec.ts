import { expect, test, type Locator, type Page } from "@playwright/test";

// Scope the regression suite to the three pages covered by this fix.
const routes = ["/", "/about", "/contact"] as const;

async function ready(page: Page, route: string) {
  await page.goto(route);
  await expect(page.locator("main h1")).toBeVisible();
  // This label changes after hydration. Do not accidentally test only SSR
  // markup: the original overflow is also caused by GSAP's initial transforms.
  await expect(page.locator('nav[aria-label="Primary"] button[aria-pressed]'))
    .toHaveAttribute("aria-label", /Switch to (light|dark) theme/);
  await page.evaluate(() => document.fonts.ready);
}

async function noHorizontalOverflow(page: Page, phase: string) {
  const size = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    document: document.documentElement.scrollWidth,
    body: document.body.scrollWidth,
    horizontalScroll: window.scrollX,
  }));
  expect(size.document, `${phase}: document ${JSON.stringify(size)}`)
    .toBeLessThanOrEqual(size.viewport + 1);
  expect(size.body, `${phase}: body ${JSON.stringify(size)}`)
    .toBeLessThanOrEqual(size.viewport + 1);
  expect(size.horizontalScroll, `${phase}: horizontal pan`).toBe(0);
}

async function visibleAndContained(locator: Locator) {
  // Center it explicitly: an element in the bottom 12% of the viewport can
  // be geometrically visible but intentionally not have triggered its reveal.
  await locator.evaluate((element) => element.scrollIntoView({
    block: "center", inline: "nearest", behavior: "instant",
  }));
  // Wait for any containing reveal to finish, not just the child's visibility.
  await expect.poll(() => locator.evaluate((element) => {
    let current: Element | null = element;
    while (current) {
      if (Number(getComputedStyle(current).opacity) < 0.99) return false;
      current = current.parentElement;
    }
    return true;
  })).toBe(true);

  const bounds = await locator.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    const parent = element.parentElement!.getBoundingClientRect();
    const range = document.createRange();
    range.selectNodeContents(element);
    const clippedText = [...range.getClientRects()].some((text) =>
      text.width > 0 && (text.left < rect.left - 1 || text.right > rect.right + 1 ||
        text.top < rect.top - 1 || text.bottom > rect.bottom + 1),
    );
    return {
      left: rect.left, right: rect.right,
      parentLeft: parent.left, parentRight: parent.right,
      viewport: document.documentElement.clientWidth,
      clientWidth: element.clientWidth, scrollWidth: element.scrollWidth,
      clippedText,
    };
  });
  expect(bounds.left).toBeGreaterThanOrEqual(-1);
  expect(bounds.right).toBeLessThanOrEqual(bounds.viewport + 1);
  expect(bounds.left).toBeGreaterThanOrEqual(bounds.parentLeft - 1);
  expect(bounds.right).toBeLessThanOrEqual(bounds.parentRight + 1);
  expect(bounds.scrollWidth).toBeLessThanOrEqual(bounds.clientWidth + 1);
  expect(bounds.clippedText, `content clipped: ${JSON.stringify(bounds)}`).toBe(false);
}

for (const route of routes) {
  for (const theme of ["light", "dark"] as const) {
    for (const motion of ["no-preference", "reduce"] as const) {
      test(`${route} fits in ${theme} mode with ${motion} motion`, async ({ page }) => {
        const errors: string[] = [];
        page.on("pageerror", (error) => errors.push(error.message));
        await page.emulateMedia({ colorScheme: theme, reducedMotion: motion });
        await ready(page, route);
        await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
        await noHorizontalOverflow(page, "after hydration");

        // Sample the entire page in both directions, including while the
        // bidirectional reveals are starting and reversing below the fold.
        const viewport = page.viewportSize()!;
        const maxY = await page.evaluate(() =>
          Math.max(0, document.documentElement.scrollHeight - window.innerHeight),
        );
        const positions: number[] = [];
        for (let y = 0; y < maxY; y += viewport.height * 0.8) positions.push(y);
        positions.push(maxY);
        for (const y of [...positions, ...positions.toReversed()]) {
          await page.evaluate((top) => window.scrollTo({ top, left: 0, behavior: "instant" }), y);
          await page.waitForTimeout(40);
          await noHorizontalOverflow(page, `scroll Y=${Math.round(y)}`);
        }

        if (route === "/" || route === "/about") {
          // Width-only checks cannot catch a button cropped by overflow:hidden.
          await visibleAndContained(page.locator('main a[href^="mailto:"]'));
        } else {
          const email = page.locator('main a[href^="mailto:"]');
          await visibleAndContained(email);
          await expect(email.locator("p").last()).toHaveCSS("white-space", "normal");
          for (const id of ["cf-name", "cf-email", "cf-subject", "cf-message"]) {
            const field = page.locator(`#${id}`);
            await visibleAndContained(field);
            const style = await field.evaluate((element) => ({
              size: Number.parseFloat(getComputedStyle(element).fontSize),
              left: element.getBoundingClientRect().left,
              right: element.getBoundingClientRect().right,
            }));
            expect(style.size, "avoid iOS focus zoom").toBeGreaterThanOrEqual(16);
            expect(style.left).toBeGreaterThanOrEqual(0);
            expect(style.right).toBeLessThanOrEqual(viewport.width + 1);
          }
        }

        await page.evaluate(() => window.scrollTo({ left: 100, behavior: "instant" }));
        await noHorizontalOverflow(page, "attempted horizontal swipe");
        await expect.poll(() => page.locator("main img").evaluateAll((images) =>
          images.filter((element) => {
            const image = element as HTMLImageElement;
            return !image.complete || image.naturalWidth === 0;
          }).map((image) => image.getAttribute("src")),
        ), { message: "page images must load" }).toEqual([]);
        expect(errors, "browser runtime errors").toEqual([]);
      });
    }
  }
}

test("navigation, themes and search remain usable", async ({ page }) => {
  await ready(page, "/");
  const primary = page.locator('nav[aria-label="Primary"]');
  const mobile = page.viewportSize()!.width < 1024;

  await primary.getByRole("button", { name: "Switch to dark theme" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");

  for (const [label, route] of [["About", "/about"], ["Contact", "/contact"], ["Home", "/"]]) {
    if (mobile) {
      await primary.getByRole("button", { name: "Open menu" }).click();
      const dialog = page.getByRole("dialog", { name: "Navigation menu" });
      await expect(dialog).toBeVisible();
      await noHorizontalOverflow(page, "navigation menu open");
      const menuBottom = await dialog.evaluate((element) => element.getBoundingClientRect().bottom);
      expect(menuBottom, "menu must fit even in landscape")
        .toBeLessThanOrEqual(page.viewportSize()!.height + 1);
      await visibleAndContained(dialog.getByRole("button", { name: /Search the site/ }));
      await dialog.locator(`a[href="${route}"]`).click();
      await expect(primary.getByRole("button", { name: "Open menu" })).toBeVisible();
    } else {
      await primary.locator("ul").getByRole("link", { name: label, exact: true }).click();
    }
    await expect(page).toHaveURL(new RegExp(`${route === "/" ? "/" : route}$`));
    await expect(page.locator("main h1")).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    expect(await page.evaluate(() => document.body.style.overflow)).toBe("");
    await noHorizontalOverflow(page, `navigated to ${route}`);
  }

  await primary.getByRole("button", { name: "Search (Ctrl+K)" }).click();
  const search = page.getByRole("dialog", { name: /search/i });
  await expect(search).toBeVisible();
  const query = search.getByRole("combobox", { name: "Search query" });
  await expect(query).toBeFocused();
  await query.fill("Next");
  await expect(search.getByRole("option").first()).toBeVisible();
  await noHorizontalOverflow(page, "search open");
  await search.getByRole("button", { name: "Close search" }).click();
  await expect(search).not.toBeVisible();
  await primary.getByRole("button", { name: "Search (Ctrl+K)" }).click();
  await expect(query).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(search).not.toBeVisible();
  await primary.getByRole("button", { name: "Switch to light theme" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
});

test("contact validation and successful submission fit the screen", async ({ page }) => {
  await ready(page, "/contact");
  const send = page.getByRole("button", { name: "Send message", exact: true });
  await send.click();
  await expect(page.locator("main form [role=alert]")).toHaveCount(4);
  await noHorizontalOverflow(page, "form validation errors");

  await page.locator("#cf-name").fill("Mobile Responsiveness Test");
  await page.locator("#cf-email").fill("mobile-test@example.com");
  await page.locator("#cf-subject").fill("Responsive contact form");
  await page.locator("#cf-message").fill("Checking that the mobile form can be filled and submitted without horizontal scrolling.");

  let payload: unknown;
  // UI tests don't write messages to a live CMS. scripts/e2e.mjs covers the
  // real contact endpoint separately, with cleanup of its test submissions.
  await page.route("**/api/contact", async (route) => {
    payload = route.request().postDataJSON();
    await route.fulfill({
      status: 201, contentType: "application/json",
      body: JSON.stringify({ success: true, data: { id: "responsive-test" } }),
    });
  });
  await send.click();
  await expect(page.getByText("Message received", { exact: true })).toBeVisible();
  expect(payload).toMatchObject({
    name: "Mobile Responsiveness Test", email: "mobile-test@example.com", website: "",
  });
  await noHorizontalOverflow(page, "form success state");
  await page.getByRole("button", { name: "Send another message" }).click();
  await expect(page.locator("#cf-name")).toHaveValue("");
  await expect(send).toBeVisible();
});

test("contact keeps entered values after a server error", async ({ page }) => {
  await ready(page, "/contact");
  await page.locator("#cf-name").fill("Mobile Retry Test");
  await page.locator("#cf-email").fill("mobile-test@example.com");
  await page.locator("#cf-subject").fill("Retry on mobile");
  await page.locator("#cf-message").fill("This message should stay in the form if the server cannot accept it.");
  await page.route("**/api/contact", (route) => route.fulfill({
    status: 500, contentType: "application/json",
    body: JSON.stringify({ success: false, error: { code: "INTERNAL_ERROR", message: "Please try again in a moment." } }),
  }));
  await page.getByRole("button", { name: "Send message", exact: true }).click();
  await expect(page.getByText("Please try again in a moment.", { exact: true })).toBeVisible();
  await expect(page.locator("#cf-name")).toHaveValue("Mobile Retry Test");
  await expect(page.getByRole("button", { name: "Send message", exact: true })).toBeEnabled();
  await noHorizontalOverflow(page, "form error state");
});
