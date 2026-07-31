import { execFileSync } from 'node:child_process'
import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'
import type { EvidenceRecord } from '../src/data/evidence'

export type EvidenceStoreSummary = {
  dbPath: string
  records: number
  latestReceivedAt?: string
}

function sqlite(dbPath: string, sql: string): string {
  mkdirSync(dirname(dbPath), { recursive: true })
  return execFileSync('sqlite3', [dbPath, '-json', sql], { encoding: 'utf8' }).trim()
}

function sqliteScript(dbPath: string, sql: string): void {
  mkdirSync(dirname(dbPath), { recursive: true })
  execFileSync('sqlite3', [dbPath], { input: sql, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] })
}

function quote(value: string): string {
  return `'${value.replaceAll("'", "''")}'`
}

export function initializeEvidenceStore(dbPath: string): EvidenceStoreSummary {
  sqliteScript(dbPath, `
PRAGMA journal_mode=WAL;
CREATE TABLE IF NOT EXISTS evidence_records (
  id TEXT PRIMARY KEY,
  athlete_id TEXT NOT NULL,
  kind TEXT NOT NULL,
  source TEXT NOT NULL,
  observed_at TEXT NOT NULL,
  received_at TEXT NOT NULL,
  quality TEXT NOT NULL,
  confidence REAL NOT NULL,
  freshness_hours REAL,
  value_json TEXT NOT NULL,
  provenance_json TEXT,
  schema_version TEXT NOT NULL DEFAULT 'evidence-v1'
);
CREATE INDEX IF NOT EXISTS idx_evidence_athlete_received ON evidence_records (athlete_id, received_at DESC);
CREATE INDEX IF NOT EXISTS idx_evidence_kind_observed ON evidence_records (kind, observed_at DESC);
`)
  return getEvidenceStoreSummary(dbPath)
}

export function upsertEvidenceRecords(dbPath: string, records: EvidenceRecord[]): EvidenceStoreSummary {
  initializeEvidenceStore(dbPath)
  if (!records.length) return getEvidenceStoreSummary(dbPath)

  const statements = records.map((record) => `INSERT INTO evidence_records (
    id, athlete_id, kind, source, observed_at, received_at, quality, confidence, freshness_hours, value_json, provenance_json, schema_version
  ) VALUES (
    ${quote(record.id)},
    ${quote(record.athleteId)},
    ${quote(record.kind)},
    ${quote(record.source)},
    ${quote(record.observedAt)},
    ${quote(record.receivedAt)},
    ${quote(record.quality)},
    ${record.confidence},
    ${record.freshnessHours ?? 'NULL'},
    ${quote(JSON.stringify(record.value))},
    ${record.provenance ? quote(JSON.stringify(record.provenance)) : 'NULL'},
    'evidence-v1'
  ) ON CONFLICT(id) DO UPDATE SET
    athlete_id = excluded.athlete_id,
    kind = excluded.kind,
    source = excluded.source,
    observed_at = excluded.observed_at,
    received_at = excluded.received_at,
    quality = excluded.quality,
    confidence = excluded.confidence,
    freshness_hours = excluded.freshness_hours,
    value_json = excluded.value_json,
    provenance_json = excluded.provenance_json,
    schema_version = excluded.schema_version;`).join('\n')

  sqliteScript(dbPath, `BEGIN IMMEDIATE;\n${statements}\nCOMMIT;`)
  return getEvidenceStoreSummary(dbPath)
}

export function getEvidenceStoreSummary(dbPath: string): EvidenceStoreSummary {
  const rows = JSON.parse(sqlite(dbPath, 'SELECT COUNT(*) as records, MAX(received_at) as latestReceivedAt FROM evidence_records;') || '[]') as Array<{ records: number; latestReceivedAt?: string | null }>
  const row = rows[0]
  return { dbPath, records: row?.records ?? 0, latestReceivedAt: row?.latestReceivedAt ?? undefined }
}

export function readLatestEvidenceRecords(dbPath: string, limit = 50): EvidenceRecord[] {
  initializeEvidenceStore(dbPath)
  const rows = JSON.parse(sqlite(dbPath, `SELECT * FROM evidence_records ORDER BY received_at DESC, observed_at DESC LIMIT ${Math.max(1, Math.min(500, Math.round(limit)))};`) || '[]') as Array<Record<string, unknown>>
  return rows.map((row) => ({
    id: String(row.id),
    athleteId: String(row.athlete_id),
    kind: row.kind as EvidenceRecord['kind'],
    source: row.source as EvidenceRecord['source'],
    observedAt: String(row.observed_at),
    receivedAt: String(row.received_at),
    value: JSON.parse(String(row.value_json)),
    quality: row.quality as EvidenceRecord['quality'],
    confidence: Number(row.confidence),
    freshnessHours: row.freshness_hours == null ? undefined : Number(row.freshness_hours),
    provenance: row.provenance_json == null ? undefined : JSON.parse(String(row.provenance_json)),
  }))
}

export function resetEvidenceStore(dbPath: string): void {
  rmSync(dbPath, { force: true })
  rmSync(`${dbPath}-wal`, { force: true })
  rmSync(`${dbPath}-shm`, { force: true })
}

export function writeEvidenceSnapshot(dbPath: string, records: EvidenceRecord[], outPath: string): void {
  upsertEvidenceRecords(dbPath, records)
  writeFileSync(outPath, JSON.stringify(readLatestEvidenceRecords(dbPath, records.length), null, 2))
}
