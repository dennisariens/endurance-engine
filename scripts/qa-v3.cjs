/* Isolated browser QA. Install Playwright on the QA host before running.
 * AERION_QA_URL=http://127.0.0.1:5174 node scripts/qa-v3.cjs
 * Never attach this script to an existing browser profile.
 */
const { chromium } = require(process.env.AERION_PLAYWRIGHT_MODULE || 'playwright');
const fs = require('node:fs/promises');
const path = require('node:path');
const assert = require('node:assert/strict');

(async () => {
  const output = path.resolve(process.env.AERION_QA_OUTPUT || 'artifacts/v3-qa');
  await fs.mkdir(output, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const results = [];
  try {
    for (const width of [1440, 390, 375]) {
      const context = await browser.newContext({ viewport: { width, height: width === 1440 ? 900 : 844 }, reducedMotion: 'reduce' });
      // No live calls or existing local data: this context is always disposable.
      await context.route('**/api/sync*', route => route.fulfill({ json: { ok: false, source: 'unavailable', message: 'Synthetic QA — live sync disabled' } }));
      await context.addInitScript(() => {
        const day = new Date().toISOString().slice(0, 10);
        const values = {
          races: [], goals: [], activities: [], blocked: [], 'decision-log': [], 'goal-conversation': [],
          account: { status: 'local', displayName: 'Synthetic QA', localOnly: true },
          'current-state': { last_updated: day, injury_present: false, illness_present: false, recovery_status: 'unknown' },
          theme: 'dark',
        };
        for (const [key, value] of Object.entries(values)) localStorage.setItem(`aerion:${key}`, JSON.stringify(value));
      });
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.goto(process.env.AERION_QA_URL || 'http://127.0.0.1:5174');
      await page.getByRole('heading', { name: 'Today', exact: true }).waitFor();
      await page.screenshot({ path: path.join(output, `home-dark-${width}.png`), fullPage: true });
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `Horizontal overflow at ${width}`);
      await page.getByRole('button', { name: 'Switch to light mode', exact: true }).click();
      assert.equal(await page.locator('html').getAttribute('data-theme'), 'light');
      await page.screenshot({ path: path.join(output, `home-light-${width}.png`), fullPage: true });
      assert.deepEqual(errors, [], `Uncaught browser errors at ${width}`);
      results.push({ width, errors, overflow: false, themeSwitch: true, data: 'synthetic-empty', reducedMotion: true });
      await context.close();
    }
    await fs.writeFile(path.join(output, 'results.json'), JSON.stringify(results, null, 2));
    console.log(JSON.stringify(results, null, 2));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
