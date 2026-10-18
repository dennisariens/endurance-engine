// Disposable browser contexts + real HTTP synthetic fixture. No real provider/athlete data.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const { createPersonalFixture } = require('./fixtures/personal-api.cjs');
(async () => {
  const { createServer } = await import('vite');
  const fixture = createPersonalFixture();
  const server = await createServer({ configFile: false, root: process.cwd(), plugins: [(await import('@vitejs/plugin-react')).default(), { name: 'synthetic-personal-api', configureServer(s) { s.middlewares.use((req, res, next) => fixture.handle(req, res, next).catch(next)); } }], define: { 'import.meta.env.VITE_AERION_MODE': JSON.stringify('hosted') }, server: { host: '127.0.0.1', port: 5174, strictPort: true } });
  let browser;
  const errors = [], checks = [];
  try {
    await server.listen();
    browser = await chromium.launch({ headless: true });
    const contexts = await Promise.all([1440, 1280, 390].map(width => browser.newContext({ viewport: { width, height: width === 390 ? 844 : 900 }, acceptDownloads: true })));
    const pages = await Promise.all(contexts.map(context => context.newPage()));
    const [a,b,m] = pages;
    for (const page of pages) {
      page.on('pageerror', error => errors.push(error.message));
      page.on('console', msg => { if (msg.type() === 'error' && !msg.text().includes('Failed to load resource')) errors.push(msg.text()); });
      page.on('dialog', dialog => dialog.accept());
      await page.goto('http://127.0.0.1:5174/');
      await page.getByLabel('Owner password').waitFor();
      assert.equal(await page.locator('.premium-shell').count(), 0);
      await page.getByLabel('Owner password').fill('synthetic-only');
      await page.getByRole('button', { name: 'Sign in', exact: true }).click();
      await page.getByRole('heading', { name: 'Shared state is empty' }).waitFor();
    }
    assert.equal(fixture.stats.writes, 0, 'No defaults uploaded by login'); checks.push('three owner sessions; first-load gate; no automatic upload');
    const syntheticBackup = { version: 2, exportedAt: new Date().toISOString(), races: [], goals: [{ id:'synthetic-goal', name:'Synthetic shared goal', type:'floating-goal', discipline:'cycling', status:'candidate' }], activeGoalId:'synthetic-goal', activities:[], blockedDates:[], decisionLog:[], currentState:{ injury_present:false, illness_present:false, recovery_status:'unknown' }, theme:'dark' };
    assert.equal(await a.getByLabel('Preview V3 backup').isDisabled(), true);
    await a.getByLabel('I have saved a separate backup').check();
    await a.getByLabel('Preview V3 backup').setInputFiles({ name:'synthetic-backup.json', mimeType:'application/json', buffer:Buffer.from(JSON.stringify(syntheticBackup)) });
    await a.getByRole('button', { name: 'Confirm import to empty server' }).waitFor();
    assert.equal(fixture.stats.writes, 0, 'Migration preview never commits');
    await a.getByRole('button', { name: 'Confirm import to empty server' }).click();
    checks.push('protected backup selection, validated preview and explicit empty-state import');
    await a.getByText('Owner session · revision 1', { exact: true }).waitFor();
    for (const page of [b,m]) { await page.getByRole('button', { name: 'Refresh from server' }).click(); await page.getByText('Owner session · revision 1', { exact: true }).waitFor(); }
    await a.getByLabel('Injury present', { exact: true }).check();
    assert.equal(fixture.state.snapshot.currentState.injury_present, false);
    await a.getByRole('button', { name: 'Save to server' }).click();
    await a.getByText('Owner session · revision 2', { exact: true }).waitFor();
    await b.getByLabel('Illness present', { exact: true }).check();
    await b.getByRole('button', { name: 'Save to server' }).click();
    await b.getByRole('region', { name: 'Resolve concurrent edits' }).waitFor();
    assert.equal(await b.getByLabel('Illness present', { exact: true }).isChecked(), true);
    await b.getByRole('button', { name: 'Export my version' }).click();
    await b.getByRole('button', { name: 'Use server version' }).click();
    assert.equal(await b.getByLabel('Injury present', { exact: true }).isChecked(), true);
    assert.equal(await b.getByLabel('Illness present', { exact: true }).isChecked(), false);
    checks.push('two-session CAS conflict; pending edits preserved/exportable; explicit server resolution');
    await m.getByRole('button', { name: 'Refresh from server' }).click();
    await m.getByText('Owner session · revision 2', { exact: true }).waitFor();
    assert.equal(await m.getByLabel('Injury present', { exact: true }).isChecked(), true);
    await m.getByLabel('Illness present', { exact: true }).check();
    await m.getByRole('button', { name: 'Save to server' }).click();
    await m.getByText('Owner session · revision 3', { exact: true }).waitFor();
    await m.reload(); await m.getByText('Owner session · revision 3', { exact: true }).waitFor();
    checks.push('mobile writes shared recovery; reload persists; desktop refresh sees mobile revision');
    await a.getByRole('button', { name: 'Refresh from server' }).click(); await a.getByText('Owner session · revision 3', { exact: true }).waitFor();
    await a.getByLabel('Injury present', { exact: true }).uncheck();
    fixture.dropNextCommitResponse();
    await a.getByRole('button', { name: 'Save to server' }).click();
    await a.getByText('A save needs confirmation.', { exact: false }).waitFor();
    const committedWrites = fixture.stats.writes;
    await a.getByRole('button', { name: 'Save to server' }).click(); await a.getByText('Owner session · revision 4', { exact: true }).waitFor();
    assert.equal(fixture.stats.writes, committedWrites); checks.push('lost commit response retries with same idempotency key; single commit');
    await contexts[0].setOffline(true);
    await a.getByText('Offline — editing paused', { exact: true }).waitFor();
    assert.equal(await a.getByLabel('Injury present', { exact: true }).isDisabled(), true);
    await contexts[0].setOffline(false);
    await a.getByRole('button', { name: 'Refresh from server' }).click(); await a.getByText('Owner session · revision 4', { exact: true }).waitFor(); checks.push('offline editing disabled; reconnect/refresh');
    await a.getByLabel('Injury present', { exact: true }).check(); fixture.expire();
    await a.getByRole('button', { name: 'Save to server' }).click();
    await a.getByLabel('Owner password').waitFor();
    assert.equal(await a.getByRole('button', { name: 'Export preserved pending edits' }).count(), 1);
    await a.getByLabel('Owner password').fill('synthetic-only'); await a.getByRole('button', { name: 'Sign in', exact: true }).click();
    await a.getByRole('region', { name: 'Resolve concurrent edits' }).waitFor();
    await a.getByRole('button', { name: 'Keep my version for review' }).click();
    await a.getByRole('button', { name: 'Save to server' }).click(); await a.getByText('Owner session · revision 5', { exact: true }).waitFor(); checks.push('session expiry hides athlete UI; edits survive real reauthentication and explicit review');
    // Sync twice against server ledger, then refresh independently authenticated mobile session.
    await a.evaluate(async () => { for (let i=0; i<2; i++) { const r = await fetch('/api/sync', { method:'POST', headers:{ 'X-CSRF-Token':'synthetic-csrf', 'Idempotency-Key':crypto.randomUUID() } }); if(!r.ok) throw Error('sync'); } });
    await a.getByRole('button', { name: 'Refresh from server' }).click(); await a.getByText('Owner session · revision 6', { exact: true }).waitFor();
    assert.equal(fixture.state.snapshot.activities.length, 1); assert.equal(fixture.state.snapshot.activities.reduce((s,a) => s + (a.load || 0), 0), 25); checks.push('repeated provider sync retains one confirmed activity/load in synthetic canonical ledger');
    await a.reload(); await a.getByText('Owner session · revision 6', { exact: true }).waitFor();
    assert.equal(await a.evaluate(() => Object.keys(localStorage).filter(k => k.startsWith('aerion:')).length), 0); checks.push('hosted flow never writes independent browser state');
    // Anonymous reads/writes are rejected at the fixture boundary, not hidden only by UI.
    const anon = await browser.newContext();
    for (const method of ['GET','PUT']) { const response = await anon.request.fetch('http://127.0.0.1:5174/api/state', { method, headers: { 'X-CSRF-Token':'synthetic-csrf' }, data: method === 'PUT' ? {} : undefined }); assert.equal(response.status(), 401); }
    await anon.close(); checks.push('anonymous HTTP reads and writes denied by synthetic auth boundary');
    // Canonical export can be restored only into explicitly empty state.
    const downloadEvent = a.waitForEvent('download'); await a.getByRole('button', { name: 'Export server backup' }).click();
    const download = await downloadEvent; const backup = JSON.parse(await fs.readFile(await download.path(), 'utf8'));
    assert.equal(backup.version, 2); assert.equal(backup.activities.length, 1); checks.push('canonical backup export includes confirmed revision contents');
    fixture.resetEmpty();
    await a.reload(); await a.getByRole('heading', { name:'Shared state is empty' }).waitFor();
    await a.getByLabel('I have saved a separate backup').check();
    await a.getByLabel('Preview V3 backup').setInputFiles({ name:'synthetic-restore.json', mimeType:'application/json', buffer:Buffer.from(JSON.stringify(backup)) });
    await a.getByRole('button', { name:'Confirm import to empty server' }).click();
    await a.getByText('Owner session · revision 1', { exact:true }).waitFor();
    assert.deepEqual(fixture.state.snapshot.activities, backup.activities);
    assert.deepEqual(fixture.state.snapshot.goals, backup.goals);
    checks.push('export → validated preview → explicit restore into empty state retains canonical records');
    // Desktop goal creation is persisted and visible after mobile reauthentication/refresh.
    await a.getByRole('button', { name:'Goals', exact:true }).click();
    await a.getByLabel('Idea / race / goal').fill('Synthetic second-device goal');
    await a.locator('.goal-intake-card button[type=submit]').click();
    await a.getByRole('button', { name:'Save to server' }).click();
    await a.getByText('Owner session · revision 2', { exact:true }).waitFor();
    await m.reload(); await m.getByLabel('Owner password').waitFor();
    await m.getByLabel('Owner password').fill('synthetic-only'); await m.getByRole('button', { name:'Sign in', exact:true }).click();
    await m.getByText('Owner session · revision 2', { exact:true }).waitFor();
    // Mobile menu is opened through its actual accessible control below.
    const menu = m.getByRole('button', { name:'More navigation', exact:true });
    if (await menu.count()) await menu.click();
    await m.getByRole('button', { name:'Goals', exact:true }).click();
    await m.getByRole('button', { name:'Synthetic second-device goal', exact:false }).waitFor();
    checks.push('goal edit on desktop is visible in mobile session after reload');
    await a.getByRole('button', { name:'Settings & data', exact:true }).click();
    await a.getByRole('button', { name:'Sync now', exact:true }).click();
    await a.getByText('Canonical server state refreshed after sync.', { exact:true }).waitFor();
    assert.equal(fixture.state.snapshot.activities.length, 1);
    checks.push('Settings Sync now calls authenticated POST then reloads canonical ledger');
    for (const page of [a,m]) {
      if (page === m) await page.getByRole('button', { name:'More navigation', exact:true }).click();
      await page.getByRole('button', { name:'Recovery', exact:true }).click();
      await page.getByRole('heading', { name:'Protection layer.' }).waitFor();
      await page.getByRole('button', { name:'Home', exact:true }).click();
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'no horizontal overflow'); }
    assert.deepEqual(errors, []);
    await fs.mkdir('artifacts/personal-beta', { recursive: true });
    await a.screenshot({ path:'artifacts/personal-beta/desktop.png', fullPage:true });
    await m.screenshot({ path:'artifacts/personal-beta/mobile.png', fullPage:true });
    const results = { browser: await browser.version(), checks, errors, stats: fixture.stats, limitation: 'Synthetic HTTP contract fixture; not Hermes/PostgreSQL, physical devices, real Safari, HTTPS or live providers.' };
    await fs.writeFile('artifacts/personal-beta/results.json', JSON.stringify(results,null,2));
    console.log(JSON.stringify(results,null,2));
  } finally { if(browser) await browser.close(); await server.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
