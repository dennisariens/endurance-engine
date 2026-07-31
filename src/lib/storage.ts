export const AERION_LOCAL_STORAGE_SCHEMA_VERSION = 2
export const AERION_LOCAL_STORAGE_SCHEMA_KEY = 'aerion:schema-version'

type StorageEnvelope<T> = {
  schemaVersion: number
  value: T
  migratedFrom?: number
  savedAt: string
}

function isStorageEnvelope<T>(value: unknown): value is StorageEnvelope<T> {
  return typeof value === 'object'
    && value !== null
    && 'schemaVersion' in value
    && 'value' in value
}

function markSchemaVersion(): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(AERION_LOCAL_STORAGE_SCHEMA_KEY, String(AERION_LOCAL_STORAGE_SCHEMA_VERSION))
}

export function loadLocal<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  const raw = window.localStorage.getItem(key)
  if (!raw) return fallback
  try {
    const parsed = JSON.parse(raw) as unknown
    if (isStorageEnvelope<T>(parsed)) {
      if (parsed.schemaVersion === AERION_LOCAL_STORAGE_SCHEMA_VERSION) return parsed.value
      // Guardrail: future/unknown schemas are treated as user-owned data and left untouched.
      return fallback
    }
    // v1 localStorage stored raw JSON values. Read them, then the next save wraps them in v2.
    return parsed as T
  } catch {
    return fallback
  }
}

export function saveLocal<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return
  const existing = window.localStorage.getItem(key)
  let migratedFrom: number | undefined
  if (existing) {
    try {
      const parsed = JSON.parse(existing) as unknown
      migratedFrom = isStorageEnvelope(parsed) ? parsed.schemaVersion : 1
    } catch {
      migratedFrom = 1
    }
  }
  const payload: StorageEnvelope<T> = {
    schemaVersion: AERION_LOCAL_STORAGE_SCHEMA_VERSION,
    value,
    migratedFrom: migratedFrom && migratedFrom !== AERION_LOCAL_STORAGE_SCHEMA_VERSION ? migratedFrom : undefined,
    savedAt: new Date().toISOString(),
  }
  markSchemaVersion()
  window.localStorage.setItem(key, JSON.stringify(payload))
}
