import { createClient } from '@supabase/supabase-js'

// Supabase Credentials
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Initialize Supabase client only if credentials are present
// This prevents build errors during static generation if env vars are missing
export const supabase = (supabaseUrl && supabaseAnonKey)
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null

if (!supabaseUrl || !supabaseAnonKey) {
    if (process.env.NODE_ENV !== 'production') {
        console.warn('Missing Supabase Environment Variables. Check .env.local')
    }
}
