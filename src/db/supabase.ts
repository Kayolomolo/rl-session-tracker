import { createClient } from '@supabase/supabase-js'

const url: string = import.meta.env.VITE_SUPABASE_URL ?? ''
const key: string = import.meta.env.VITE_SUPABASE_ANON_KEY ?? ''

export const hasConfig = url.length > 0 && key.length > 0
export const supabase = createClient(url || 'http://localhost:54321', key || 'placeholder', {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
})
