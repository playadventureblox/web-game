import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Supabase client bootstrap
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Lazy singleton — avoids "supabaseUrl is required" crash during SSR prerender
let _supabase: SupabaseClient | null = null;

const getSupabase = (): SupabaseClient => {
  if (!_supabase) {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      throw new Error('Supabase env vars not set');
    }
    _supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  return _supabase;
};

export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    return (getSupabase() as any)[prop];
  },
});
