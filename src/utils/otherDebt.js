/**
 * @param {Record<string, unknown>} row
 * @returns {{ taken: number, cleared: number, outstanding: number }}
 */
export function computeOtherDebtSnapshot(row) {
  const taken = Math.max(0, parseFloat(row.debtAmountTaken) || 0)
  const clearedRaw = parseFloat(row.debtAmountCleared)
  const cleared = Number.isFinite(clearedRaw) ? Math.min(Math.max(0, clearedRaw), taken) : 0
  const outstanding = Math.max(0, taken - cleared)
  return { taken, cleared, outstanding }
}

/**
 * @param {Record<string, unknown>} row
 * @returns {string}
 */
export function formatOtherDebtCreditor(row) {
  const type = row.creditorType || 'other'
  const name = String(row.creditorName || '').trim()
  if (type === 'vendor') return name ? `Vendor · ${name}` : 'Vendor'
  return name ? `Other · ${name}` : 'Other'
}
