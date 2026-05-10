import { hasSupabaseConfig, supabase } from '../supabaseClient'

const bucket = import.meta.env.VITE_SUPABASE_DOCS_BUCKET || 'construction-docs'

export async function uploadDocumentFile(file) {
  if (!hasSupabaseConfig || !supabase || !file) return { filePath: null, publicUrl: null }
  const filePath = `docs/${Date.now()}-${file.name}`
  const { error } = await supabase.storage.from(bucket).upload(filePath, file, { upsert: false })
  if (error) throw error
  const { data } = supabase.storage.from(bucket).getPublicUrl(filePath)
  return { filePath, publicUrl: data?.publicUrl || null }
}

export async function deleteDocumentFile(filePath) {
  if (!hasSupabaseConfig || !supabase || !filePath) return
  const { error } = await supabase.storage.from(bucket).remove([filePath])
  if (error) throw error
}

