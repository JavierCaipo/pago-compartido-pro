import { notFound } from 'next/navigation';
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import WaitlistClient from './WaitlistClient';

export const dynamic = 'force-dynamic';

export default async function WaitlistPage(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  const slug = params.slug;

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: () => {},
      }
    }
  );

  const { data: negocio, error } = await supabase
    .from('negocios')
    .select('id, nombre, logo_url, color_principal')
    .eq('slug', slug)
    .single();

  if (error || !negocio) {
    return notFound();
  }

  return <WaitlistClient negocio={negocio} />;
}
