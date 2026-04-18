import { createClient, SupabaseClient } from '@supabase/supabase-js';

export type NegocioRow = {
  id: number;
  slug: string;
  nombre: string;
  logo_url?: string;
  color_principal?: string;
};

export function getSupabaseClient(): SupabaseClient | null {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.warn('SUPABASE_URL or SUPABASE_ANON_KEY is not defined. Falling back to generic branding.');
    return null;
  }

  return createClient(supabaseUrl, supabaseKey);
}
