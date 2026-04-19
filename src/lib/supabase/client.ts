import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export function isSupabaseConfigured() {
  return !!(supabaseUrl && supabaseAnonKey && !supabaseUrl.includes('your-project'));
}

let _client: SupabaseClient | null = null;

export function createClient(): SupabaseClient {
  if (_client) return _client;
  if (!isSupabaseConfigured()) {
    _client = createBrowserClient(
      'https://placeholder.supabase.co',
      'placeholder-key'
    );
  } else {
    _client = createBrowserClient(supabaseUrl!, supabaseAnonKey!);
  }
  return _client;
}
