import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ExternalLink, Store } from "lucide-react";

export default async function PortalPage() {
  const cookieStore = await cookies();
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {}
      }
    }
  );

  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    redirect("/login");
  }

  // Fetch business data linked to this user
  const { data: userData, error: userError } = await supabase
    .from("roles_usuario")
    .select("negocio_id, negocios(nombre)")
    .eq("user_id", session.user.id)
    .single();

  const businessName = userData?.negocios?.nombre || "Tu Restaurante";

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center px-4 selection:bg-blue-500/30">
      <div className="w-full max-w-2xl">
        <div className="mb-12 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-[2rem] bg-zinc-900 border border-zinc-800 mb-8 shadow-2xl">
            <Store className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tighter mb-4">
            Bienvenido a <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">{businessName}</span>
          </h1>
          <p className="text-zinc-400 text-lg max-w-md mx-auto leading-relaxed">
            Portal administrativo. Desde aquí podrás acceder a tus herramientas operativas.
          </p>
        </div>

        <div className="bg-zinc-900/80 backdrop-blur-xl border border-zinc-800 rounded-[2rem] p-8 md:p-10 hover:border-zinc-700 transition-colors group">
          <h2 className="text-2xl font-semibold mb-3 tracking-tight">Sistema Operativo</h2>
          <p className="text-zinc-400 mb-8 text-lg leading-relaxed">
            Accede al punto de venta y gestión de reservaciones en tiempo real para tu negocio.
          </p>
          
          <a 
            href="http://localhost:5173" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center justify-between w-full bg-white text-black font-semibold rounded-2xl px-6 py-5 hover:scale-[1.02] transform transition-all shadow-xl shadow-white/5 group-hover:shadow-white/10"
          >
            <span className="text-lg">Abrir Titanium OS <span className="opacity-60 text-sm ml-2 font-normal tracking-normal">(Gestión de Reservas)</span></span>
            <ExternalLink className="w-6 h-6 text-zinc-400 group-hover:text-black transition-colors" />
          </a>
        </div>
      </div>
    </div>
  );
}
