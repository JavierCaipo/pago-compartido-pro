import BillSplitterFeature from '@/features/bill-splitter/components/BillSplitterFeature';
import { createClient } from '@supabase/supabase-js';
import { NegocioRow } from '@/lib/supabase';
import { BannerRow } from '@/features/bill-splitter/types';

export const dynamic = 'force-dynamic';

type Brand = {
  name: string;
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  moneda?: string;
};

export default async function Home(props: { searchParams: Promise<{ ref?: string }> }) {
  const searchParams = await props.searchParams;
  const slug = searchParams?.ref;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;
  const supabase = createClient(supabaseUrl, supabaseKey);

  let negocio: NegocioRow | null = null;
  let banners: BannerRow[] = [];
  if (slug) {
    const { data: negocioData, error } = await supabase
      .from('negocios')
      .select('*')
      .eq('slug', slug)
      .eq('activo', true)
      .single();

    if (error) {
      console.error('Supabase lookup failed:', error.message);
    } else if (negocioData) {
      negocio = negocioData;

      // Fetch banners for this negocio
      const { data: bannerData, error: bannerError } = await supabase
        .from('banners')
        .select('*')
        .eq('negocio_id', negocioData.id)
        .eq('activo', true);

      if (bannerError) {
        console.error('Banner fetch failed:', bannerError.message);
      } else {
        banners = bannerData || [];
      }
    }
  }

  const brand: Brand | null = negocio
    ? {
      name: negocio.nombre,
      logoUrl: negocio.logo_url,
      primaryColor: negocio.color_principal ?? '#8b5cf6',
      secondaryColor: negocio.color_principal ?? '#a1a1aa',
      moneda: (negocio as any).moneda ?? 'PEN',
    }
    : null;

  return (
    <main className="min-block-size-screen flex items-center justify-center p-4 bg-zinc-950">
      {/* Mobile-First Container: Simula un dispositivo móvil en todo tamaño */}
      <div className="inline-size-full max-inline-size-md mx-auto min-block-size-screen bg-black shadow-2xl overflow-x-hidden relative flex flex-col">

        {/* Header con Marca Blanca - Transparente con Backdrop Blur */}
        <header
          className="sticky inset-block-start-0 z-50 backdrop-blur-md bg-black/5 border-block-end border-block-end-2 transition-colors duration-300"
          style={{
            borderBlockEndColor: brand?.primaryColor ?? 'rgba(255,255,255,0.1)'
          }}
        >
          <div className="px-4 py-3 flex items-center gap-3">
            {/* Logo del Local */}
            {brand?.logoUrl ? (
              <img
                src={brand.logoUrl}
                alt={brand.name}
                className="inline-size-10 block-size-10 rounded-full object-cover border border-white/10 flex-shrink-0"
              />
            ) : (
              <div className="flex inline-size-10 block-size-10 items-center justify-center rounded-full bg-gradient-to-br from-purple-600 to-pink-600 text-white text-xs font-bold flex-shrink-0">
                {(brand?.name ?? 'SplitPay').substring(0, 2).toUpperCase()}
              </div>
            )}

            {/* Nombre del Local */}
            <div className="flex-1 min-inline-size-0">
              <p className="text-[10px] uppercase tracking-widest text-zinc-400 leading-none">
                Local
              </p>
              <h1
                className="text-sm font-black text-white truncate leading-tight"
                style={{ color: brand?.primaryColor ?? '#8b5cf6' }}
              >
                {brand?.name ?? 'SplitPay'}
              </h1>
            </div>

            {/* Indicador de Estado */}
            {negocio && (
              <div className="flex-shrink-0 inline-size-2 block-size-2 rounded-full bg-emerald-500 animate-pulse" title="Conectado" />
            )}
          </div>
        </header>

        {/* Contenido Principal - Scrollable */}
        <div className="flex-1 overflow-y-auto">
          <BillSplitterFeature brand={brand} banners={banners} />
        </div>
      </div>
    </main>
  );
}