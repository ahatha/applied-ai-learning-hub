import { chromium, devices } from "playwright";
import fs from "fs";
import path from "path";

const BASE = "http://localhost:5500";
const OUT = path.resolve("assets/temp/mobile-check");
fs.mkdirSync(OUT, { recursive: true });

const pages = [
  { name: "home", url: `${BASE}/` },
  { name: "topics", url: `${BASE}/courses/D0034E/` },
  { name: "lesson1", url: `${BASE}/courses/D0034E/lessons/lesson1.html` }
];

const viewports = [
  { name: "iphone", ...devices["iPhone 12"] },
  { name: "pixel", ...devices["Pixel 5"] }
];

function collectOverflow(page) {
  return page.evaluate(() => {
    const doc = document.documentElement;
    const body = document.body;
    const overflowing = [];
    const all = Array.from(document.querySelectorAll("body *"));
    for (const el of all) {
      const rect = el.getBoundingClientRect();
      if (rect.width > window.innerWidth + 1) {
        overflowing.push({
          tag: el.tagName.toLowerCase(),
          className: String(el.className || "").slice(0, 80),
          width: Math.round(rect.width),
          viewport: window.innerWidth
        });
      }
      if (overflowing.length >= 8) break;
    }
    return {
      scrollWidth: doc.scrollWidth,
      clientWidth: doc.clientWidth,
      bodyScrollWidth: body.scrollWidth,
      hasHorizontalOverflow: doc.scrollWidth > window.innerWidth + 1,
      overflowing
    };
  });
}

async function checkPage(browser, device, pageInfo) {
  const context = await browser.newContext({
    ...device,
    colorScheme: "light"
  });
  const page = await context.newPage();
  const consoleErrors = [];
  const pageErrors = [];
  const failed = [];

  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });
  page.on("pageerror", (err) => pageErrors.push(String(err)));
  page.on("response", (res) => {
    if (res.status() >= 400) {
      failed.push(`${res.status()} ${res.url()}`);
    }
  });

  const result = {
    device: device.name || "device",
    page: pageInfo.name,
    url: pageInfo.url,
    ok: true,
    issues: []
  };

  try {
    const response = await page.goto(pageInfo.url, {
      waitUntil: "networkidle",
      timeout: 30000
    });
    if (!response || response.status() >= 400) {
      result.ok = false;
      result.issues.push(`Navigation status ${response && response.status()}`);
    }

    await page.waitForTimeout(600);
    const shot = path.join(OUT, `${pageInfo.name}-${result.device.replace(/\s+/g, "-")}.png`);
    await page.screenshot({ path: shot, fullPage: true });
    result.screenshot = shot;

    const overflow = await collectOverflow(page);
    result.overflow = overflow;
    if (overflow.hasHorizontalOverflow) {
      result.ok = false;
      result.issues.push(
        `Horizontal overflow scrollWidth=${overflow.scrollWidth} viewport=${overflow.clientWidth}`
      );
    }

    // Page-specific sanity checks
    if (pageInfo.name === "home") {
      const explorer = await page.locator("#programme-explorer").count();
      const yearTab = await page.locator("[data-year-tab]").count();
      if (!explorer) result.issues.push("Missing #programme-explorer");
      if (!yearTab) result.issues.push("Missing year tabs");
      const openSemesters = await page.locator("details.explorer-block--semester[open]").count();
      const openPeriods = await page.locator("details.explorer-block--period[open]").count();
      result.explorer = { openSemesters, openPeriods };
      if (openSemesters < 1) result.issues.push("Expected open semesters by default");
      if (openPeriods !== 0) result.issues.push(`Expected 0 open periods, got ${openPeriods}`);
    }

    if (pageInfo.name === "lesson1") {
      const article = await page.locator(".notes-article").count();
      const reading = await page.locator("#lesson-reading, .reading-rail").count();
      const nav = await page.locator("#lesson-nav").count();
      result.lesson = { article, reading, nav };
      if (!article) result.issues.push("Missing lesson article");
      if (!nav) result.issues.push("Missing lesson nav");
    }

    if (pageInfo.name === "topics") {
      const cards = await page.locator(".topic-card").count();
      result.topics = { cards };
      if (cards < 1) result.issues.push("Missing topic cards");
    }

    if (consoleErrors.length) {
      result.issues.push(...consoleErrors.slice(0, 5).map((e) => `console: ${e}`));
    }
    if (pageErrors.length) {
      result.ok = false;
      result.issues.push(...pageErrors.slice(0, 5).map((e) => `pageerror: ${e}`));
    }
    const realFails = failed.filter((f) => !f.includes("favicon"));
    if (realFails.length) {
      result.ok = false;
      result.issues.push(...realFails.slice(0, 8).map((f) => `request: ${f}`));
    }
    if (result.issues.length) result.ok = result.ok && !result.issues.some((i) => !i.startsWith("console:"));
  } catch (err) {
    result.ok = false;
    result.issues.push(String(err));
  }

  await context.close();
  return result;
}

const browser = await chromium.launch({ headless: true });
const results = [];
for (const device of viewports) {
  for (const pageInfo of pages) {
    results.push(await checkPage(browser, device, pageInfo));
  }
}
await browser.close();

const summary = {
  checkedAt: new Date().toISOString(),
  base: BASE,
  results
};
fs.writeFileSync(path.join(OUT, "report.json"), JSON.stringify(summary, null, 2));
console.log(JSON.stringify(summary, null, 2));
const failed = results.filter((r) => !r.ok || r.issues.length);
console.log("\n--- SUMMARY ---");
console.log(`checked ${results.length}, with issues: ${failed.length}`);
for (const r of results) {
  console.log(
    `${r.ok && !r.issues.length ? "OK" : "ISSUE"} ${r.device} ${r.page}` +
      (r.issues.length ? ` -> ${r.issues.join(" | ")}` : "")
  );
}
