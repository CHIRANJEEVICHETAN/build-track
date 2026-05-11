import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const clientKey = publishableKey || anonKey

export const hasSupabaseConfig = Boolean(url && clientKey)

function browserLocalStorage() {
  try {
    if (typeof globalThis !== 'undefined' && globalThis.localStorage) return globalThis.localStorage
  } catch {
    /* private mode / blocked storage */
  }
  return undefined
}

export const supabase = hasSupabaseConfig
  ? createClient(url, clientKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        // Explicit storage so session survives refresh/tab close (same origin)
        storage: browserLocalStorage(),
      },
    })
  : null

