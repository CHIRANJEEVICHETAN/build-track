import { STORAGE_KEYS } from '../storageKeys'

export function exportCurrentLocalBackup() {
  const payload = localStorage.getItem(STORAGE_KEYS.legacyState)
  if (!payload) return null
  const stamp = new Date().toISOString()
  const backup = { stamp, payload }
  localStorage.setItem(STORAGE_KEYS.exportBackup, JSON.stringify(backup))
  return backup
}

export function hasCompletedMigration() {
  return Boolean(localStorage.getItem(STORAGE_KEYS.migratedAt))
}

export function markMigrationCompleted() {
  localStorage.setItem(STORAGE_KEYS.migratedAt, new Date().toISOString())
}

export function readLegacyState() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.legacyState) || 'null')
  } catch {
    return null
  }
}

