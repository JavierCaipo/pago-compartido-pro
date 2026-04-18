import { createBrowserClient, createServerClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export function createClient() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}

export function createServerClientInstance(
  cookieStore: {
    getAll(): Array<{ name: string; value: string }>;
    set(name: string, value: string, options: Record<string, unknown>): void;
  }
) {
  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, { ...options, sameSite: 'Lax', secure: true })
          );
        } catch {
          // Server Components can't set cookies — safe to ignore.
        }
      },
    },
  });
}
