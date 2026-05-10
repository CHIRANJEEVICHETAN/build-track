import Papa from 'papaparse'

export function parseCsvText(csvText) {
  const parsed = Papa.parse(csvText, { header: true, skipEmptyLines: true })
  if (parsed.errors?.length) {
    throw new Error(parsed.errors[0].message || 'Invalid CSV')
  }
  return parsed.data || []
}

export function mapRows(rows, mapping) {
  return rows.map(row => {
    const out = {}
    for (const [target, source] of Object.entries(mapping)) {
      out[target] = row[source]
    }
    return out
  })
}

