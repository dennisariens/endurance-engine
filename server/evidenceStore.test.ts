import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import type { EvidenceRecord } from '../src/data/evidence'
import { getEvidenceStoreSummary, initializeEvidenceStore, readLatestEvidenceRecords, resetEvidenceStore, upsertEvidenceRecords } from './evidenceStore'

const record: EvidenceRecord = {
  id: 'activity:manual:test-1',
  athleteId: 'dennis',
  kind: 'activity',
  source: 'manual',
  observedAt: '2026-07-31T07:00:00.000Z',
  receivedAt: '2026-07-31T08:00:00.000Z',
  value: { id: 'test-1', name: 'Easy run', load: 35 },
  quality: 'verified',
  confidence: 0.95,
  freshnessHours: 2,
  provenance: { externalId: 'test-1', calculationVersion: 'evidence-v1' },
}

function tempDbPath() {
  return join(mkdtempSync(join(tmpdir(), 'aerion-evidence-')), 'evidence.sqlite')
}

describe('SQLite evidence store', () => {
  it('initializes an empty server-side evidence database', () => {
    const dbPath = tempDbPath()
    resetEvidenceStore(dbPath)

    const summary = initializeEvidenceStore(dbPath)

    expect(summary).toMatchObject({ dbPath, records: 0 })
  })

  it('upserts and reads evidence records without client-side secrets', () => {
    const dbPath = tempDbPath()

    const summary = upsertEvidenceRecords(dbPath, [record])
    const records = readLatestEvidenceRecords(dbPath)

    expect(summary.records).toBe(1)
    expect(records[0]).toMatchObject({ id: record.id, athleteId: 'dennis', kind: 'activity', source: 'manual', quality: 'verified' })
    expect(records[0].value).toMatchObject({ name: 'Easy run', load: 35 })
  })

  it('updates an existing evidence record by stable id', () => {
    const dbPath = tempDbPath()

    upsertEvidenceRecords(dbPath, [record])
    upsertEvidenceRecords(dbPath, [{ ...record, confidence: 0.72, quality: 'estimated' }])

    expect(getEvidenceStoreSummary(dbPath).records).toBe(1)
    expect(readLatestEvidenceRecords(dbPath)[0]).toMatchObject({ confidence: 0.72, quality: 'estimated' })
  })
})
