/** @typedef {'cash' | 'half_on_debt' | 'full_on_debt'} PurchaseDebt */

/**
 * @param {PurchaseDebt | string | undefined} mode
 * @returns {number} fraction of total cost counted as debt taken
 */
export function getDebtTakenFactor(mode) {
  switch (mode) {
    case 'half_on_debt':
      return 0.5
    case 'full_on_debt':
      return 1
    case 'cash':
    default:
      return 0
  }
}

/**
 * @param {Record<string, unknown>} material
 * @returns {{ taken: number, cleared: number, outstanding: number }}
 */
export function computeMaterialDebtSnapshot(material) {
  const totalCost = parseFloat(material.totalCost) || 0
  const mode = material.purchaseDebt || 'cash'
  const taken = totalCost * getDebtTakenFactor(mode)
  const clearedRaw = parseFloat(material.materialDebtCleared)
  const cleared = Number.isFinite(clearedRaw) ? Math.min(Math.max(0, clearedRaw), taken) : 0
  const outstanding = Math.max(0, taken - cleared)
  return { taken, cleared, outstanding }
}

/**
 * @param {Record<string, unknown>} material
 * @returns {string}
 */
export function formatMaterialCreditor(material) {
  const mode = material.purchaseDebt || 'cash'
  if (mode === 'cash') return '—'
  const type = material.debtCreditorType || 'vendor'
  if (type === 'other') {
    const name = String(material.debtCreditorName || '').trim()
    return name ? `Other · ${name}` : 'Other'
  }
  const vendor = String(material.vendor || '').trim()
  return vendor ? `Vendor · ${vendor}` : 'Vendor'
}
