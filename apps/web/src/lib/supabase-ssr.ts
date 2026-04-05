import { createBrowserClient, createServerClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export function createClient() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}

export function createServerClientInstance(
  cookieStore: {
    getAll(): Array<{ name: string; value: string }>;
    setCookie(name: string, value: string, options: any): void;
    deleteCookie(name: string): void;
  }
) {
  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setCookie(name, value, options) {
        try {
          cookieStore.setCookie(name, value, { ...options, sameSite: 'Lax', secure: true });
        } catch (error) {
          // Handle server-side cookie setting
        }
      },
      removeCookie(name, options) {
        try {
          cookieStore.deleteCookie(name);
        } catch (error) {
          // Handle server-side cookie deletion
        }
      },
    },
  });
}
