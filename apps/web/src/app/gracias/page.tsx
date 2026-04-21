import Link from "next/link";
import { CheckCircle2, Home } from "lucide-react";

export default function GraciasPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-zinc-950 text-white selection:bg-emerald-500/30">
      <div className="w-full max-w-md space-y-8 text-center animate-in fade-in zoom-in duration-700">
        {/* Icon Section */}
        <div className="relative flex justify-center">
          <div className="absolute inset-0 bg-emerald-500/20 blur-[100px] rounded-full scale-150 animate-pulse" />
          <div className="relative bg-zinc-900/50 p-6 rounded-full border border-emerald-500/20 shadow-2xl backdrop-blur-xl">
            <CheckCircle2 className="w-20 h-20 text-emerald-500 animate-in slide-in-from-bottom-4 duration-1000 delay-150" strokeWidth={1.5} />
          </div>
        </div>

        {/* Text Section */}
        <div className="space-y-3">
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-b from-white to-zinc-400 bg-clip-text text-transparent">
            ¡Pago Exitoso!
          </h1>
          <p className="text-lg text-zinc-400 font-light leading-relaxed">
            Gracias por tu visita. <br />
            Tu comprobante ha sido enviado <br />
            a tu <span className="text-emerald-400/90 font-medium">WhatsApp</span>.
          </p>
        </div>

        {/* Action Section */}
        <div className="pt-8">
          <Link
            href="/"
            className="group relative inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-black font-semibold rounded-full hover:bg-zinc-200 transition-all active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.2)]"
          >
            <Home className="w-4 h-4 transition-transform group-hover:-translate-y-0.5" />
            Volver al Inicio
          </Link>
        </div>

        {/* Footer info */}
        <div className="pt-12">
          <p className="text-xs text-zinc-600 uppercase tracking-[0.2em]">
            Titanium OS • Luxury Dining Experience
          </p>
        </div>
      </div>
    </main>
  );
}
