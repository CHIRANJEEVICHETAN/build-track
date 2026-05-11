import { useMemo } from 'react'
import { Plus } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { useNavigatePage } from '../context/NavigationContext'

/**
 * Select a vendor by display name (matches Vendor Management `name` field).
 * Appends current `value` to options when not in the catalog (legacy rows).
 */
export default function VendorPicker({ value, onChange, disabled, id, emptyLabel }) {
  const { vendors } = useApp()
  const goToPage = useNavigatePage()

  const catalogNames = useMemo(() => {
    const seen = new Set()
    const out = []
    for (const v of vendors) {
      const n = String(v?.name ?? '').trim()
      if (!n || seen.has(n)) continue
      seen.add(n)
      out.push(n)
    }
    out.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }))
    return out
  }, [vendors])

  const options = useMemo(() => {
    const names = [...catalogNames]
    const v = String(value ?? '').trim()
    if (v && !names.includes(v)) names.push(v)
    return names
  }, [catalogNames, value])

  const hasCatalog = catalogNames.length > 0
  const placeholder = emptyLabel ?? (hasCatalog ? '— Select vendor —' : 'No vendors yet — tap + to add')

  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center', width: '100%' }}>
      <select
        id={id}
        className="input-field"
        style={{ flex: 1, minWidth: 0 }}
        value={value ?? ''}
        onChange={onChange}
        disabled={disabled}
      >
        <option value="">{placeholder}</option>
        {options.map(name => (
          <option key={name} value={name}>{name}</option>
        ))}
      </select>
      <button
        type="button"
        className="btn-secondary"
        title="Add or manage vendors"
        style={{ flexShrink: 0, padding: '8px 10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        onClick={() => goToPage('vendors')}
      >
        <Plus size={16} />
      </button>
    </div>
  )
}
