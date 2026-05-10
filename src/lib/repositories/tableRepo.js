import { supabase, hasSupabaseConfig } from '../supabaseClient'

export function createTableRepo(table) {
  async function list(orderBy = 'created_at', ascending = false) {
    if (!hasSupabaseConfig || !supabase) return []
    const { data, error } = await supabase.from(table).select('*').order(orderBy, { ascending })
    if (error) throw error
    return data || []
  }

  async function upsert(rows, onConflict = 'id') {
    if (!hasSupabaseConfig || !supabase || !rows?.length) return []
    const { data, error } = await supabase.from(table).upsert(rows, { onConflict }).select()
    if (error) throw error
    return data || []
  }

  async function insert(row) {
    if (!hasSupabaseConfig || !supabase) return null
    const { data, error } = await supabase.from(table).insert(row).select().single()
    if (error) throw error
    return data
  }

  async function update(id, patch) {
    if (!hasSupabaseConfig || !supabase) return null
    const { data, error } = await supabase.from(table).update(patch).eq('id', id).select().single()
    if (error) throw error
    return data
  }

  async function remove(id) {
    if (!hasSupabaseConfig || !supabase) return
    const { error } = await supabase.from(table).delete().eq('id', id)
    if (error) throw error
  }

  return { list, upsert, insert, update, remove }
}

