import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const clientKey = publishableKey || anonKey

export const hasSupabaseConfig = Boolean(url && clientKey)

export const supabase = hasSupabaseConfig
  ? createClient(url, clientKey, {
      auth: { persistSession: true, autoRefreshToken: true },
    })
  : null

