import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || ''
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY || ''

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.warn(
    'VITE_SUPABASE_URL or VITE_SUPABASE_KEY is missing. Supabase client will be created with empty values.'
  )
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
