import BillSplitterFeature from '@/features/bill-splitter/components/BillSplitterFeature';
import { getSupabaseClient, NegocioRow } from '@/lib/supabase';
import { BannerRow } from '@/features/bill-splitter/types';

type PageProps = {
  searchParams: Promise<{ ref?: string | string[] }>;
};

type Brand = {
  name: string;
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
};

export default async function Home({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams;
  const refSlug = Array.isArray(resolvedSearchParams.ref) 
    ? resolvedSearchParams.ref[0] 
    : resolvedSearchParams.ref;
  
  const supabase = getSupabaseClient();

  let negocio: NegocioRow | null = null;
  let banners: BannerRow[] = [];
  if (refSlug && supabase) {
    const { data, error } = await supabase
      .from<NegocioRow>('negocios')
      .select('id,slug,nombre,logo_url,color_primario')
      .eq('slug', refSlug)
      .single();

    if (error) {
      console.error('Supabase lookup failed:', error.message);
    } else if (data) {
      negocio = data;
      
      // Fetch banners for this negocio
      const { data: bannerData, error: bannerError } = await supabase
        .from<BannerRow>('banners')
        .select('*')
        .eq('negocio_id', data.id)
        .eq('activo', true);

      if (bannerError) {
        console.error('Banner fetch failed:', bannerError.message);
      } else {
        banners = bannerData || [];
      }
    }
  }

  const brand: Brand = {
    name: negocio?.nombre ?? 'SplitPay',
    logoUrl: negocio?.logo_url,
    primaryColor: negocio?.color_primario ?? '#8b5cf6',
    secondaryColor: negocio?.color_primario ?? '#a1a1aa',
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-zinc-950">
      {/* Mobile-First Container: Simula un dispositivo móvil en todo tamaño */}
      <div className="w-full max-w-md mx-auto min-h-screen bg-black shadow-2xl overflow-x-hidden relative flex flex-col">
        
        {/* Header con Marca Blanca - Transparente con Backdrop Blur */}
        <header 
          className="sticky top-0 z-50 backdrop-blur-md bg-black/5 border-b transition-colors duration-300"
          style={{ 
            borderBottomColor: negocio ? brand.primaryColor : 'rgba(255,255,255,0.1)',
            borderBottomWidth: '2px'
          }}
        >
          <div className="px-4 py-3 flex items-center gap-3">
            {/* Logo del Local */}
            {brand.logoUrl ? (
              <img
                src={brand.logoUrl}
                alt={brand.name}
                className="w-10 h-10 rounded-full object-cover border border-white/10 flex-shrink-0"
              />
            ) : (
              <div className="flex w-10 h-10 items-center justify-center rounded-full bg-gradient-to-br from-purple-600 to-pink-600 text-white text-xs font-bold flex-shrink-0">
                {brand.name.substring(0, 2).toUpperCase()}
              </div>
            )}
            
            {/* Nombre del Local */}
            <div className="flex-1 min-w-0">
              <p className="text-[10px] uppercase tracking-widest text-zinc-400 leading-none">
                Local
              </p>
              <h1 
                className="text-sm font-black text-white truncate leading-tight"
                style={{ color: brand.primaryColor }}
              >
                {brand.name}
              </h1>
            </div>

            {/* Indicador de Estado */}
            {negocio && (
              <div className="flex-shrink-0 w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Conectado" />
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