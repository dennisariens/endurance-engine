import { build } from 'esbuild'
import { mkdir, copyFile } from 'node:fs/promises'
await mkdir('dist-server', { recursive: true })
await build({ entryPoints: { start: 'server/personal/start.ts', admin: 'server/personal/admin-entry.ts' }, outdir: 'dist-server', outExtension: { '.js': '.mjs' }, bundle: true, packages: 'external', platform: 'node', target: 'node24', format: 'esm', sourcemap: false, logLevel: 'info' })
// PgStore resolves this relative to the compiled entry's import.meta.url.
await copyFile('server/personal/schema.sql', 'dist-server/schema.sql')
