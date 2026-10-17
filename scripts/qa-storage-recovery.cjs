// Focused real-browser regression: synthetic data, disposable profile, no live sync.
const { chromium } = require('playwright');
const fs = require('node:fs/promises');
const path = require('node:path');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const keys = ['races', 'goals', 'goal-conversation', 'active-goal-id', 'activities', 'blocked', 'decision-log', 'current-state', 'theme', 'account', 'visualization'].map(k => `aerion:${k}`);
(async () => {
  const { createServer } = await import('vite');
  const server = await createServer({ server: { host: '127.0.0.1', port: 5174, strictPort: true } });
  const output = path.resolve('artifacts/storage-recovery');
  await fs.mkdir(output, { recursive: true });
  let browser;
  const results = [];
  try {
    await server.listen();
    browser = await chromium.launch({ headless: true });
    const url = 'http://127.0.0.1:5174';
    for (const kind of ['malformed', 'future']) {
      const raw = kind === 'malformed' ? '{protected synthetic bytes' : JSON.stringify({ schemaVersion: 999, value: 'protected synthetic value' });
      const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
      await context.route('**/*', route => {
        const request = new URL(route.request().url());
        if (request.pathname === '/api/sync') return route.fulfill({ json: { ok: false, source: 'unavailable', message: 'Synthetic storage QA: live sync disabled' } });
        return request.origin === url ? route.continue() : route.abort();
      });
      await context.addInitScript(({ keys, raw }) => {
        if (sessionStorage.getItem('storage-qa-seeded')) return;
        sessionStorage.setItem('storage-qa-seeded', '1');
        for (const key of keys) localStorage.setItem(key, raw);
        localStorage.setItem('unrelated:synthetic', raw);
      }, { keys, raw });
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', e => errors.push(e.message));
      page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
      const settle = async () => {
        await page.getByRole('heading', { name: 'Today', exact: true }).waitFor();
        await page.waitForTimeout(150);
      };
      await page.goto(url); await settle();
      for (let pass = 0; pass < 2; pass++) {
        const stored = await page.evaluate(keys => keys.map(k => localStorage.getItem(k)), keys);
        assert.ok(stored.every(value => value === raw), 'Initial fallback auto-save preserves every protected key');
        if (pass === 0) { await page.reload(); await settle(); }
      }
      const backup = {
        version: 2, exportedAt: new Date().toISOString(), races: [], goals: [], goalConversation: [],
        activities: [{ id: 'synthetic-restored', date: new Date().toISOString().slice(0, 10), source: 'manual', name: 'Synthetic storage recovery', type: 'Run', load: 0 }],
        blockedDates: [], decisionLog: [], currentState: { injury_present: false, illness_present: false, recovery_status: 'unknown', recovery_score: 0 },
        theme: 'dark', account: { status: 'local', displayName: 'Synthetic restored', localOnly: true },
      };
      await page.getByRole('navigation', { name: 'Main navigation', exact: true }).getByRole('button', { name: 'Settings & data', exact: true }).click();
      await page.locator('label').filter({ hasText: 'Import data' }).locator('input').setInputFiles({ name: 'synthetic.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(backup)) });
      await page.waitForFunction(() => JSON.parse(localStorage.getItem('aerion:account')).value.displayName === 'Synthetic restored');
      await page.reload(); await settle();
      const restored = await page.evaluate(() => ({ activities: JSON.parse(localStorage.getItem('aerion:activities')).value, state: JSON.parse(localStorage.getItem('aerion:current-state')).value, account: JSON.parse(localStorage.getItem('aerion:account')).value, selection: localStorage.getItem('aerion:active-goal-id') }));
      assert.deepEqual(restored.activities, backup.activities);
      assert.equal(restored.state.recovery_score, 0);
      assert.equal(restored.account.displayName, 'Synthetic restored');
      assert.equal(restored.selection, null);
      await page.screenshot({ path: path.join(output, `${kind}-restored.png`) });
      // Reset from a protected fallback again, including unchanged default values.
      await page.evaluate(({ keys, raw }) => { for (const key of keys) localStorage.setItem(key, raw); }, { keys, raw });
      await page.reload(); await settle();
      await page.locator('.expert-layer > summary').click();
      page.once('dialog', dialog => dialog.accept());
      await page.getByRole('button', { name: 'Reset local data', exact: true }).click();
      await page.waitForFunction(() => localStorage.getItem('aerion:active-goal-id') === null && JSON.parse(localStorage.getItem('aerion:account')).value.displayName === 'Athlete');
      await page.reload(); await settle();
      const reset = await page.evaluate(keys => Object.fromEntries(keys.map(key => [key, localStorage.getItem(key)])), keys);
      assert.equal(reset['aerion:active-goal-id'], null);
      assert.deepEqual(JSON.parse(reset['aerion:activities']).value, []);
      assert.deepEqual(JSON.parse(reset['aerion:current-state']).value, { injury_present: false, illness_present: false, recovery_status: 'unknown' });
      for (const key of keys.filter(k => k !== 'aerion:active-goal-id')) assert.equal(JSON.parse(reset[key]).schemaVersion, 2);
      assert.equal(await page.evaluate(() => localStorage.getItem('unrelated:synthetic')), raw);
      assert.deepEqual(errors, []);
      await page.screenshot({ path: path.join(output, `${kind}-reset.png`) });
      results.push({ kind, automaticFallbackPreservesBytesAfterReload: true, explicitImportSurvivesReload: true, confirmedResetSurvivesReload: true, unchangedDefaultsPersist: true, unrelatedKeyPreserved: true, errors });
      await context.close();
    }
    const report = { source: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(), data: 'synthetic-only', results };
    await fs.writeFile(path.join(output, 'results.json'), JSON.stringify(report, null, 2));
    console.log(JSON.stringify(report, null, 2));
  } finally { if (browser) await browser.close(); await server.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
