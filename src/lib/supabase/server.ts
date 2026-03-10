import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function isConfigured() {
  return !!(supabaseUrl && supabaseAnonKey && !supabaseUrl.includes('your-project'));
}

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    isConfigured() ? supabaseUrl! : 'https://placeholder.supabase.co',
    isConfigured() ? supabaseAnonKey! : 'placeholder-key',
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
          }
        },
      },
    }
  );
}
