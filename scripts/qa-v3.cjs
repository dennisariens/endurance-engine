// Dedicated disposable browser + server. Never attaches to an existing profile.
const { chromium } = require('playwright');
const fs = require('node:fs/promises');
const path = require('node:path');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
let browserCache;

async function launch() {
  if (process.platform === 'linux' && !process.env.AERION_QA_BROWSER) {
    // Do not restore archive ownership: managed containers cannot chown to
    // arbitrary build-machine UIDs. Extract only into this QA cache.
    const { brotliDecompressSync } = require('node:zlib');
    const bin = path.resolve(path.dirname(require.resolve('@sparticuz/chromium')), '../bin');
    const cache = await fs.mkdtemp(path.join(require('node:os').tmpdir(), 'aerion-qa-browser-'));
    browserCache = cache;
    const executablePath = path.join(cache, 'chromium');
    await fs.mkdir(cache, { recursive: true });
    try { await fs.access(path.join(cache, 'ready')); } catch {
      const binary = brotliDecompressSync(await fs.readFile(path.join(bin, 'chromium.br')));
      const file = await fs.open(executablePath, 'w', 0o700);
      for (let offset = 0; offset < binary.length;) {
        const { bytesWritten } = await file.write(binary, offset, Math.min(1024 * 1024, binary.length - offset), offset);
        if (!bytesWritten) throw new Error('Browser extraction made no progress');
        offset += bytesWritten;
      }
      await file.close();
      assert.equal((await fs.stat(executablePath)).size, binary.length, 'Complete browser extraction');
      await fs.mkdir(path.join(cache, 'fonts'), { recursive: true });
      for (const name of ['fonts', 'swiftshader']) {
        execFileSync('tar', ['--extract', '--no-same-owner', '--directory', name === 'fonts' ? path.join(cache, 'fonts') : cache], { input: brotliDecompressSync(await fs.readFile(path.join(bin, `${name}.tar.br`))) });
      }
      await fs.writeFile(path.join(cache, 'fonts', 'fonts.conf'), `<?xml version="1.0"?><!DOCTYPE fontconfig SYSTEM "fonts.dtd"><fontconfig><include ignore_missing="yes">/etc/fonts/fonts.conf</include><dir>${cache}/fonts/fonts</dir><cachedir>${cache}/font-cache</cachedir></fontconfig>`);
      await fs.writeFile(path.join(cache, 'ready'), '153.0.0');
    }
    return chromium.launch({ executablePath, args: ['--no-sandbox', '--disable-dev-shm-usage', '--no-zygote', '--use-gl=angle', '--use-angle=swiftshader'], headless: true, env: { ...process.env, FONTCONFIG_PATH: path.join(cache, 'fonts'), LD_LIBRARY_PATH: [cache, process.env.LD_LIBRARY_PATH].filter(Boolean).join(':') } });
  }
  return chromium.launch({ headless: true, ...(process.env.AERION_QA_BROWSER ? { executablePath: process.env.AERION_QA_BROWSER } : {}) });
}

(async () => {
  const output = path.resolve(process.env.AERION_QA_OUTPUT || 'artifacts/v3-qa');
  await fs.mkdir(output, { recursive: true });
  const root = path.resolve(process.env.AERION_QA_ROOT || '.');
  const baseline = process.env.AERION_QA_BASELINE === '1';
  const { createServer } = await import('vite');
  const server = await createServer({ root, server: { host: '127.0.0.1', port: 5174, strictPort: true } });
  let browser;
  let activePage;
  const results = [];
  try {
    await server.listen();
    const url = `http://127.0.0.1:${server.httpServer.address().port}`;
    browser = await launch();
    for (const width of [1440, 390, 375]) {
      const context = await browser.newContext({ viewport: { width, height: width === 1440 ? 900 : 844 }, reducedMotion: 'reduce', acceptDownloads: true });
      await context.route('**/*', route => {
        const request = new URL(route.request().url());
        if (request.pathname === '/api/sync') return route.fulfill({ json: { ok: false, source: 'unavailable', message: 'Synthetic QA — live sync disabled' } });
        return request.origin === url ? route.continue() : route.abort();
      });
      await context.addInitScript(() => {
        if (location.protocol !== 'http:') return;
        const day = new Date().toISOString().slice(0, 10);
        const values = {
          races: [], goals: [{ id: 'qa-goal', name: 'Synthetic autumn 10K', type: 'floating-goal', discipline: 'running', status: 'draft' }],
          'active-goal-id': 'qa-goal', activities: [{ id: 'qa-activity', source: 'manual', date: day, name: 'Synthetic easy run', type: 'Run', durationSec: 2400, distanceM: 6000, avgHr: 130, load: 0 }],
          blocked: [], 'decision-log': [], 'goal-conversation': [],
          account: { status: 'local', displayName: 'Synthetic QA', localOnly: true },
          'current-state': { last_updated: day, injury_present: false, illness_present: false, recovery_status: 'green', recovery_score: 80, resting_hr_14d_avg: 50 }, theme: 'dark',
        };
        for (const [key, value] of Object.entries(values)) localStorage.setItem(`aerion:${key}`, JSON.stringify(value));
      });
      const page = await context.newPage();
      activePage = page;
      page.setDefaultTimeout(15000);
      page.setDefaultNavigationTimeout(20000);
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
      await page.goto(url);
      await page.getByRole('heading', { name: baseline ? 'Today at a glance' : 'Today', exact: true }).waitFor();
      await page.evaluate(() => document.fonts.ready);
      await page.screenshot({ path: path.join(output, `home-dark-${width}.png`), fullPage: true });
      await page.screenshot({ path: path.join(output, `viewport-dark-${width}.png`) });
      if (baseline) { await context.close(); continue; }
      assert.equal(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches), true);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `Horizontal overflow at ${width}`);
      assert.ok((await page.getByRole('button', { name: 'View session', exact: true }).boundingBox()).y < (width === 1440 ? 900 : 844), 'Recommendation action above fold');
      await page.getByText('Why this recommendation?', { exact: true }).click();
      assert.equal(await page.locator('.v3-why').getAttribute('open'), '');
      await page.getByText('Why this recommendation?', { exact: true }).click();
      await page.getByRole('button', { name: 'Switch to light mode', exact: true }).click();
      assert.equal(await page.locator('html').getAttribute('data-theme'), 'light');
      await page.screenshot({ path: path.join(output, `home-light-${width}.png`), fullPage: true });
      await page.getByRole('button', { name: 'Switch to dark mode', exact: true }).click();
      const navigate = async name => {
        if (width >= 1200) await page.getByRole('navigation', { name: 'Main navigation', exact: true }).getByRole('button', { name, exact: true }).click();
        else if (['Home', 'Training', 'Performance', 'Coach'].includes(name)) await page.getByRole('navigation', { name: 'Mobile navigation', exact: true }).getByRole('button', { name, exact: true }).click();
        else {
          await page.getByRole('button', { name: 'More navigation', exact: true }).click();
          await page.getByRole('dialog').getByRole('button', { name, exact: true }).click();
        }
        await page.locator('.v3-content > section').waitFor();
        await page.mouse.move(0, 0);
        await page.evaluate(() => document.fonts.ready);
        await page.waitForTimeout(150);
      };
      const interactionStates = [];
      for (const theme of ['dark', 'light']) {
        await page.evaluate(theme => document.documentElement.dataset.theme = theme, theme);
        await navigate('Home');
        const primary = page.getByRole('button', { name: 'View session', exact: true });
        const style = () => primary.evaluate(el => { const s = getComputedStyle(el); return { background: s.backgroundColor, color: s.color, outline: s.outlineStyle, cursor: s.cursor }; });
        await page.mouse.move(0, 0);
        const normal = await style();
        assert.equal(normal.background, 'rgb(255, 95, 184)');
        await primary.hover();
        const hover = await style();
        assert.notEqual(hover.background, normal.background);
        await page.screenshot({ path: path.join(output, `button-${theme}-hover-${width}.png`) });
        await page.mouse.down();
        const pressed = await style();
        assert.notEqual(pressed.background, hover.background);
        await page.screenshot({ path: path.join(output, `button-${theme}-pressed-${width}.png`) });
        // Release away from the button so the state capture does not navigate.
        await page.mouse.move(0, 0); await page.mouse.up();
        await primary.focus();
        await page.keyboard.press('Tab'); await page.keyboard.press('Shift+Tab');
        const focus = await style();
        assert.equal(focus.outline, 'solid');
        await page.screenshot({ path: path.join(output, `button-${theme}-focus-${width}.png`) });
        // Isolated CSS fixture: temporarily disable the real CTA, then restore it.
        await primary.evaluate(el => el.disabled = true);
        const disabled = await style();
        assert.equal(disabled.cursor, 'not-allowed');
        assert.equal(await primary.isDisabled(), true);
        assert.notEqual(disabled.background, normal.background);
        await primary.hover({ force: true });
        assert.deepEqual(await style(), disabled, 'Disabled hover preserves disabled styling');
        await page.screenshot({ path: path.join(output, `button-${theme}-disabled-${width}.png`) });
        await primary.evaluate(el => el.disabled = false);
        await page.mouse.move(0, 0);
        interactionStates.push({ theme, normal, hover, pressed, focus, disabled });
        for (const name of ['Home', 'Training', 'Performance', 'Coach', 'Goals', 'Races', 'Recovery', 'History', 'Settings & data']) {
          await navigate(name);
          assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `${name}/${theme}/${width} overflow`);
          if (['Performance', 'Races', 'Recovery'].includes(name)) {
            const option = name === 'Performance' ? page.locator('.chart-option-bar button:not(.active)').first() : page.locator('.chart-option-bar button').last();
            const before = await option.getAttribute('class');
            await option.click();
            assert.notEqual(await option.getAttribute('class'), before, `${name} option toggles`);
            await page.mouse.move(0, 0);
          }
          const slug = name.toLowerCase().replace(/[^a-z]+/g, '-');
          await page.screenshot({ path: path.join(output, `${slug}-${theme}-${width}.png`), fullPage: true });
        }
      }
      await page.evaluate(() => document.documentElement.dataset.theme = 'dark');
      await navigate('Home');
      await page.getByRole('button', { name: 'View session', exact: true }).click();
      await page.getByRole('heading', { name: 'Training', exact: true }).waitFor();
      await page.screenshot({ path: path.join(output, `training-${width}.png`), fullPage: true });
      for (const name of ['Performance', 'Coach', 'Goals', 'Races', 'Recovery', 'History', 'Settings & data']) await navigate(name);
      const downloadEvent = page.waitForEvent('download');
      await page.getByRole('button', { name: 'Export data', exact: true }).click();
      const download = await downloadEvent;
      const backupPath = path.join(output, `synthetic-backup-${width}.json`);
      await download.saveAs(backupPath);
      console.log(`QA ${width}: navigation and backup download complete`);
      const backup = JSON.parse(await fs.readFile(backupPath, 'utf8'));
      assert.equal(backup.account.displayName, 'Synthetic QA');
      assert.equal(backup.activities[0].load, 0);
      const upload = page.locator('label').filter({ hasText: 'Import data' }).locator('input');
      const changed = { ...backup, account: { ...backup.account, displayName: 'Synthetic changed' } };
      await upload.setInputFiles({ name: 'synthetic-changed.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(changed)) });
      console.log(`QA ${width}: changed backup submitted`);
      await page.waitForFunction(() => JSON.parse(localStorage.getItem('aerion:account')).value.displayName === 'Synthetic changed');
      await upload.setInputFiles(backupPath);
      await page.waitForFunction(() => JSON.parse(localStorage.getItem('aerion:account')).value.displayName === 'Synthetic QA');
      await navigate('Home');
      if (width < 1200) {
        const more = page.getByRole('button', { name: 'More navigation', exact: true });
        await more.click(); await page.keyboard.press('Escape');
        assert.equal(await page.getByRole('dialog').isVisible(), false);
        assert.equal(await more.evaluate(el => el === document.activeElement), true, 'Escape returns focus');
      }
      assert.deepEqual(errors, [], `Uncaught browser errors at ${width}`);
      results.push({ width, interactionStates, errors, overflow: false, themeSwitch: true, why: true, navigationScreens: 9, backupDownloadImportRestore: true, data: 'synthetic-only', reducedMotion: true });
      await context.close();
    }
    const report = { source: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim(), baseline, results };
    await fs.writeFile(path.join(output, 'results.json'), JSON.stringify(report, null, 2));
    console.log(JSON.stringify(report, null, 2));
  } catch (error) {
    if (activePage && !activePage.isClosed()) await activePage.screenshot({ path: path.join(output, 'failure.png'), fullPage: true }).catch(() => {});
    throw error;
  } finally { if (browser) await browser.close(); await server.close(); if (browserCache) await fs.rm(browserCache, { recursive: true, force: true }); }
})().catch(error => { console.error(error); process.exitCode = 1; });
