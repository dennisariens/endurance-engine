import { build } from 'esbuild'
import { mkdir, copyFile, readFile, writeFile, access } from 'node:fs/promises'
await mkdir('dist-server', { recursive: true })
await build({ entryPoints: { start: 'server/personal/start.ts', admin: 'server/personal/admin-entry.ts' }, outdir: 'dist-server', outExtension: { '.js': '.mjs' }, bundle: true, packages: 'external', platform: 'node', target: 'node24', format: 'esm', sourcemap: false, logLevel: 'info' })
// PgStore resolves this relative to the compiled entry's import.meta.url.
await copyFile('server/personal/schema.sql', 'dist-server/schema.sql')

// Preserve the Electron/local index and app assets byte-for-byte. Only the hosted
// shell gets absolute assets so /app/, refresh and deep links share /assets.
let hasClient = true
try { await access('dist/index.html') } catch (error) { if (error.code !== 'ENOENT') throw error; hasClient = false }
if (hasClient) {
  const shell = (await readFile('dist/index.html', 'utf8')).replaceAll('"./assets/', '"/assets/')
  await writeFile('dist/app.html', shell)
  await mkdir('dist/journey', { recursive: true })
  for (const file of ['index.html', 'site.css', 'color-story.css', 'repairs.css', 'journey.js', 'topography.png']) {
    await copyFile(`public-site/${file}`, `dist/journey/${file}`)
  }
}
