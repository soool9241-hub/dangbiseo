import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export function isSupabaseConfigured() {
  return !!(supabaseUrl && supabaseAnonKey && !supabaseUrl.includes('your-project'));
}

export function createClient() {
  if (!isSupabaseConfigured()) {
    // Return a dummy client that won't crash but won't work
    return createBrowserClient(
      'https://placeholder.supabase.co',
      'placeholder-key'
    );
  }
  return createBrowserClient(supabaseUrl!, supabaseAnonKey!);
}
