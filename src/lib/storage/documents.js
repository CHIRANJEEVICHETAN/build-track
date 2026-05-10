import { hasSupabaseConfig, supabase } from '../supabaseClient'

const bucket = import.meta.env.VITE_SUPABASE_DOCS_BUCKET || 'construction-docs'

export async function uploadDocumentFile(file) {
  if (!hasSupabaseConfig || !supabase || !file) return { filePath: null, publicUrl: null }
  const filePath = `docs/${Date.now()}-${file.name}`
  const { error } = await supabase.storage.from(bucket).upload(filePath, file, { upsert: false })
  if (error) throw error
  return { filePath, publicUrl: null }
}

export async function deleteDocumentFile(filePath) {
  if (!hasSupabaseConfig || !supabase || !filePath) return
  const { error } = await supabase.storage.from(bucket).remove([filePath])
  if (error) throw error
}

export async function getDocumentSignedUrl(filePath, expiresIn = 120) {
  if (!hasSupabaseConfig || !supabase || !filePath) return null
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(filePath, expiresIn)
  if (error) throw error
  return data?.signedUrl || null
}

