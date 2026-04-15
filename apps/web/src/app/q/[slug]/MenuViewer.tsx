"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  X,
  ChefHat,
  Loader2,
  Plus,
  Minus,
  ShoppingBag,
  Check,
  Sparkles,
} from "lucide-react";
import type { SupabaseClient } from "@supabase/supabase-js";

// ── Types ──────────────────────────────────────────────────────────────────
type Categoria = {
  id: string;
  nombre: string;
  orden: number;
};

type Producto = {
  id: string;
  categoria_id: string;
  nombre: string;
  descripcion: string | null;
  precio: number;
  imagen_url: string | null;
  disponible: boolean;
  destacado: boolean;
};

type CartItem = {
  producto_id: string;
  nombre: string;
  precio: number;
  cantidad: number;
};

type MenuViewerProps = {
  negocioId: string;
  primaryColor: string;
  supabase: SupabaseClient;
  ticketId: string | null;
};

// ── Component ──────────────────────────────────────────────────────────────
export default function MenuViewer({
  negocioId,
  primaryColor,
  supabase,
  ticketId,
}: MenuViewerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [hasMenu, setHasMenu] = useState<boolean | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const tabsRef = useRef<HTMLDivElement>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Check if menu exists (lightweight HEAD count on mount) ──
  useEffect(() => {
    const checkMenu = async () => {
      const { count } = await supabase
        .from("productos")
        .select("*", { count: "exact", head: true })
        .eq("negocio_id", negocioId)
        .eq("disponible", true);

      setHasMenu(count !== null && count > 0);
    };
    checkMenu();
  }, [negocioId, supabase]);

  // ── Fetch full menu data + existing pre_comanda ──
  const fetchMenu = useCallback(async () => {
    if (categorias.length > 0) return;
    setLoading(true);

    const catQuery = supabase
      .from("categorias")
      .select("id, nombre, orden")
      .eq("negocio_id", negocioId)
      .order("orden", { ascending: true });

    const prodQuery = supabase
      .from("productos")
      .select(
        "id, categoria_id, nombre, descripcion, precio, imagen_url, disponible, destacado"
      )
      .eq("negocio_id", negocioId)
      .eq("disponible", true)
      .order("nombre", { ascending: true });

    const preComandaQuery = ticketId
      ? supabase
          .from("lista_espera")
          .select("pre_comanda")
          .eq("id", ticketId)
          .single()
      : Promise.resolve({ data: null, error: null });

    const [catRes, prodRes, preComandaRes] = await Promise.all([
      catQuery,
      prodQuery,
      preComandaQuery,
    ]);

    const cats = (catRes.data as Categoria[]) || [];
    const prods = (prodRes.data as Producto[]) || [];

    const catsWithProducts = cats.filter((c) =>
      prods.some((p) => p.categoria_id === c.id)
    );

    setCategorias(catsWithProducts);
    setProductos(prods);
    if (catsWithProducts.length > 0) {
      setActiveCategory(catsWithProducts[0].id);
    }

    // Restore cart from pre_comanda
    const preComanda = (
      preComandaRes.data as Record<string, unknown> | null
    )?.pre_comanda;
    if (preComanda) {
      const savedItems = preComanda as CartItem[];
      if (Array.isArray(savedItems) && savedItems.length > 0) {
        const validItems = savedItems.filter((item) =>
          prods.some((p) => p.id === item.producto_id)
        );
        setCart(validItems);
      }
    }

    setLoading(false);
  }, [negocioId, supabase, categorias.length, ticketId]);

  // ── Cart helpers ─────────────────────────────────────────────────────────
  const getCartQty = (productoId: string): number =>
    cart.find((item) => item.producto_id === productoId)?.cantidad || 0;

  const updateCart = (prod: Producto, delta: number) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.producto_id === prod.id);
      if (existing) {
        const newQty = existing.cantidad + delta;
        if (newQty <= 0) {
          return prev.filter((item) => item.producto_id !== prod.id);
        }
        return prev.map((item) =>
          item.producto_id === prod.id ? { ...item, cantidad: newQty } : item
        );
      }
      if (delta > 0) {
        return [
          ...prev,
          {
            producto_id: prod.id,
            nombre: prod.nombre,
            precio: prod.precio,
            cantidad: 1,
          },
        ];
      }
      return prev;
    });
  };

  const cartTotal = cart.reduce(
    (sum, item) => sum + item.precio * item.cantidad,
    0
  );
  const cartCount = cart.reduce((sum, item) => sum + item.cantidad, 0);

  // ── Derived: Chef's suggestions (max 3 destacados) ──
  const chefPicks = productos.filter((p) => p.destacado).slice(0, 3);

  // ── Submit pre-order ─────────────────────────────────────────────────────
  const handleSubmitPreOrder = async () => {
    if (!ticketId || cart.length === 0) return;
    setSaving(true);

    const { error } = await supabase
      .from("lista_espera")
      .update({ pre_comanda: cart })
      .eq("id", ticketId);

    setSaving(false);

    if (!error) {
      setShowToast(true);
      if (toastTimer.current) clearTimeout(toastTimer.current);
      toastTimer.current = setTimeout(() => setShowToast(false), 3000);
      handleClose();
    }
  };

  // ── Open / Close ─────────────────────────────────────────────────────────
  const handleOpen = () => {
    setIsOpen(true);
    fetchMenu();
    document.body.style.overflow = "hidden";
  };

  const handleClose = () => {
    setIsOpen(false);
    document.body.style.overflow = "";
  };

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    if (isOpen) window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen]);

  useEffect(() => {
    if (!activeCategory || !tabsRef.current) return;
    const activeTab = tabsRef.current.querySelector(
      `[data-cat="${activeCategory}"]`
    );
    activeTab?.scrollIntoView({
      behavior: "smooth",
      inline: "center",
      block: "nearest",
    });
  }, [activeCategory]);

  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  // ── Format price ──
  const formatPrice = (precio: number) => `S/ ${precio.toFixed(2)}`;

  // ── Filtered products ──
  const filteredProducts = activeCategory
    ? productos.filter((p) => p.categoria_id === activeCategory)
    : productos;

  // Don't render anything if no menu exists
  if (hasMenu === null || hasMenu === false) return null;

  // ═════════════════════════════════════════════════════════════════════════
  // Shared sub-renderers
  // ═════════════════════════════════════════════════════════════════════════

  /** Quantity controls: "Agregar" pill or [-] qty [+] stepper */
  const renderQtyControls = (prod: Producto) => {
    const qty = getCartQty(prod.id);
    if (qty === 0) {
      return (
        <button
          onClick={() => updateCart(prod, 1)}
          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all duration-200 hover:scale-105 active:scale-95"
          style={{
            color: primaryColor,
            borderColor: `${primaryColor}40`,
            backgroundColor: `${primaryColor}10`,
          }}
        >
          <Plus className="w-3.5 h-3.5" />
          Agregar
        </button>
      );
    }
    return (
      <div className="flex items-center gap-0.5">
        <button
          onClick={() => updateCart(prod, -1)}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-white transition-all active:scale-90"
          style={{ backgroundColor: `${primaryColor}30` }}
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
        <span
          className="w-8 text-center text-sm font-bold"
          style={{ color: primaryColor }}
        >
          {qty}
        </span>
        <button
          onClick={() => updateCart(prod, 1)}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-white transition-all active:scale-90"
          style={{ backgroundColor: primaryColor }}
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  };

  return (
    <>
      {/* ── Trigger Button ── */}
      <button
        onClick={handleOpen}
        className="w-full flex items-center justify-center gap-2.5 text-white font-semibold py-3.5 px-5 rounded-xl hover:opacity-90 hover:scale-[1.02] active:scale-95 transform transition-all shadow-lg mt-5"
        style={{
          backgroundColor: primaryColor,
          boxShadow: `0 8px 24px -4px ${primaryColor}50`,
        }}
      >
        <ChefHat className="w-5 h-5" />
        <span>{cartCount > 0 ? `Ver Carta (${cartCount})` : "Ver Carta"}</span>
      </button>

      {/* ── Success Toast ── */}
      {showToast && (
        <div
          className="fixed top-6 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-2.5 bg-emerald-500 text-white font-semibold px-5 py-3 rounded-2xl shadow-2xl"
          style={{
            animation:
              "menuSlideDown 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        >
          <Check className="w-5 h-5" />
          <span className="text-sm">¡Pre-pedido registrado!</span>
        </div>
      )}

      {/* ── Bottom Sheet Overlay ── */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center"
          onClick={(e) => {
            if (e.target === e.currentTarget) handleClose();
          }}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            style={{ animation: "menuFadeIn 0.2s ease-out" }}
          />

          {/* Sheet */}
          <div
            className="relative w-full max-w-lg bg-zinc-950 rounded-t-[2rem] border-t border-zinc-800 flex flex-col"
            style={{
              maxHeight: "88vh",
              animation:
                "menuSlideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
            }}
          >
            {/* ── Handle + Header ── */}
            <div className="shrink-0 pt-3 pb-2">
              <div className="w-10 h-1 rounded-full bg-zinc-700 mx-auto mb-4" />
              <div className="px-6 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white tracking-tight">
                    Nuestra Carta
                  </h2>
                  <span className="text-zinc-500 text-sm mt-0.5 block">
                    {productos.length}{" "}
                    {productos.length === 1
                      ? "plato disponible"
                      : "platos disponibles"}
                  </span>
                </div>
                <button
                  onClick={handleClose}
                  className="w-9 h-9 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors active:scale-90"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* ── Loading State ── */}
            {loading ? (
              <div className="flex-1 flex items-center justify-center py-20">
                <div className="text-center space-y-4">
                  <Loader2
                    className="w-10 h-10 mx-auto animate-spin"
                    style={{ color: primaryColor }}
                  />
                  <span className="text-zinc-500 text-sm font-medium block">
                    Cargando carta...
                  </span>
                </div>
              </div>
            ) : (
              <>
                {/* ═══ Scrollable content area ═══ */}
                <div
                  className="flex-1 overflow-y-auto"
                  style={{
                    paddingBottom: cartCount > 0 ? "100px" : "2rem",
                  }}
                >
                  {/* ── Sugerencias del Chef ── */}
                  {chefPicks.length > 0 && (
                    <div className="px-4 pt-3 pb-1">
                      <div className="flex items-center gap-2 mb-3">
                        <Sparkles
                          className="w-4 h-4"
                          style={{ color: primaryColor }}
                        />
                        <span
                          className="text-sm font-medium italic tracking-wide"
                          style={{ color: primaryColor }}
                        >
                          Sugerencias del Chef
                        </span>
                      </div>

                      <div
                        className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide"
                        style={{
                          scrollbarWidth: "none",
                          msOverflowStyle: "none",
                        }}
                      >
                        {chefPicks.map((prod) => {
                          const qty = getCartQty(prod.id);
                          return (
                            <div
                              key={`chef-${prod.id}`}
                              className={`shrink-0 w-[140px] rounded-2xl border overflow-hidden transition-all duration-200 ${
                                qty > 0
                                  ? "border-zinc-600/60"
                                  : "border-zinc-800/60"
                              }`}
                              style={{
                                background:
                                  "linear-gradient(180deg, rgba(39,39,42,0.7) 0%, rgba(24,24,27,0.9) 100%)",
                              }}
                            >
                              {/* Image */}
                              {prod.imagen_url ? (
                                <div className="relative">
                                  <img
                                    src={prod.imagen_url}
                                    alt={prod.nombre}
                                    className="w-full h-[100px] object-cover"
                                    loading="lazy"
                                  />
                                  <div
                                    className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full flex items-center justify-center"
                                    style={{
                                      backgroundColor: primaryColor,
                                    }}
                                  >
                                    <Sparkles className="w-3 h-3 text-white" />
                                  </div>
                                </div>
                              ) : (
                                <div className="w-full h-[100px] bg-zinc-800 flex items-center justify-center">
                                  <ChefHat className="w-8 h-8 text-zinc-600" />
                                </div>
                              )}

                              {/* Info */}
                              <div className="p-2.5">
                                <div className="text-[13px] font-semibold text-white truncate leading-snug">
                                  {prod.nombre}
                                </div>
                                <div className="flex items-center justify-between mt-2 gap-1">
                                  <span
                                    className="text-xs font-bold"
                                    style={{ color: primaryColor }}
                                  >
                                    {formatPrice(prod.precio)}
                                  </span>

                                  {/* Mini cart controls */}
                                  {qty === 0 ? (
                                    <button
                                      onClick={() => updateCart(prod, 1)}
                                      className="w-7 h-7 rounded-lg flex items-center justify-center text-white transition-all active:scale-90"
                                      style={{
                                        backgroundColor: primaryColor,
                                      }}
                                    >
                                      <Plus className="w-3.5 h-3.5" />
                                    </button>
                                  ) : (
                                    <div className="flex items-center gap-0.5">
                                      <button
                                        onClick={() =>
                                          updateCart(prod, -1)
                                        }
                                        className="w-6 h-6 rounded-md flex items-center justify-center text-white transition-all active:scale-90"
                                        style={{
                                          backgroundColor: `${primaryColor}30`,
                                        }}
                                      >
                                        <Minus className="w-3 h-3" />
                                      </button>
                                      <span
                                        className="w-5 text-center text-xs font-bold"
                                        style={{ color: primaryColor }}
                                      >
                                        {qty}
                                      </span>
                                      <button
                                        onClick={() =>
                                          updateCart(prod, 1)
                                        }
                                        className="w-6 h-6 rounded-md flex items-center justify-center text-white transition-all active:scale-90"
                                        style={{
                                          backgroundColor: primaryColor,
                                        }}
                                      >
                                        <Plus className="w-3 h-3" />
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Divider */}
                      <div className="border-t border-zinc-800/60 mt-2" />
                    </div>
                  )}

                  {/* ── Category Tabs ── */}
                  {categorias.length > 1 && (
                    <div className="shrink-0 px-4 pt-3 pb-2">
                      <div
                        ref={tabsRef}
                        className="flex gap-2 overflow-x-auto scrollbar-hide pb-1"
                        style={{
                          scrollbarWidth: "none",
                          msOverflowStyle: "none",
                        }}
                      >
                        {categorias.map((cat) => {
                          const isActive = activeCategory === cat.id;
                          return (
                            <button
                              key={cat.id}
                              data-cat={cat.id}
                              onClick={() => setActiveCategory(cat.id)}
                              className={`shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 border ${
                                isActive
                                  ? "text-white shadow-lg"
                                  : "text-zinc-400 bg-zinc-900/60 border-zinc-800 hover:text-zinc-200 hover:bg-zinc-800/80"
                              }`}
                              style={
                                isActive
                                  ? {
                                      backgroundColor: primaryColor,
                                      borderColor: primaryColor,
                                      boxShadow: `0 4px 12px -2px ${primaryColor}40`,
                                    }
                                  : undefined
                              }
                            >
                              {cat.nombre}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* ── Product List ── */}
                  <div className="px-4 pt-2 space-y-3">
                    {filteredProducts.length === 0 ? (
                      <div className="text-center py-12">
                        <ChefHat className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
                        <span className="text-zinc-500 text-sm block">
                          No hay platos en esta categoría.
                        </span>
                      </div>
                    ) : (
                      filteredProducts.map((prod) => {
                        const qty = getCartQty(prod.id);
                        return (
                          <div
                            key={prod.id}
                            className={`flex items-center gap-3 bg-zinc-900/70 border rounded-2xl p-3 transition-all duration-200 group ${
                              qty > 0
                                ? "border-zinc-600/60"
                                : "border-zinc-800/80 hover:border-zinc-700"
                            }`}
                          >
                            {/* Product Image */}
                            {prod.imagen_url ? (
                              <img
                                src={prod.imagen_url}
                                alt={prod.nombre}
                                className="w-[72px] h-[72px] rounded-xl object-cover shrink-0 bg-zinc-800 border border-zinc-800 group-hover:scale-105 transition-transform duration-300"
                                loading="lazy"
                              />
                            ) : (
                              <div className="w-[72px] h-[72px] rounded-xl bg-zinc-800 border border-zinc-700 shrink-0 flex items-center justify-center">
                                <ChefHat className="w-6 h-6 text-zinc-600" />
                              </div>
                            )}

                            {/* Product Info + Controls */}
                            <div className="flex-1 min-w-0 py-0.5">
                              <h3 className="text-[15px] font-semibold text-white truncate leading-snug">
                                {prod.nombre}
                              </h3>
                              {prod.descripcion && (
                                <span className="text-zinc-500 text-[13px] mt-0.5 line-clamp-1 leading-snug block">
                                  {prod.descripcion}
                                </span>
                              )}

                              {/* Price + Quantity Controls Row */}
                              <div className="flex items-center justify-between mt-2 gap-2">
                                <span
                                  className="text-sm font-bold tracking-tight"
                                  style={{ color: primaryColor }}
                                >
                                  {formatPrice(prod.precio)}
                                </span>
                                {renderQtyControls(prod)}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* ── Floating Checkout Bar ── */}
                {cartCount > 0 && (
                  <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-zinc-950 via-zinc-950/98 to-transparent pt-8">
                    <button
                      onClick={handleSubmitPreOrder}
                      disabled={saving}
                      className="w-full flex items-center justify-center gap-3 text-white font-semibold py-4 px-6 rounded-2xl hover:opacity-90 hover:scale-[1.01] active:scale-[0.98] transform transition-all shadow-2xl disabled:opacity-60"
                      style={{
                        backgroundColor: primaryColor,
                        boxShadow: `0 12px 32px -4px ${primaryColor}50`,
                      }}
                    >
                      {saving ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <ShoppingBag className="w-5 h-5" />
                      )}
                      <span>
                        {saving
                          ? "Guardando..."
                          : `Enviar Pre-pedido (${formatPrice(cartTotal)})`}
                      </span>
                      {!saving && (
                        <span className="bg-white/20 text-xs font-bold px-2 py-0.5 rounded-full ml-1">
                          {cartCount}
                        </span>
                      )}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Animations ── */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes menuSlideUp {
          from { transform: translateY(100%); }
          to   { transform: translateY(0); }
        }
        @keyframes menuSlideDown {
          from { transform: translate(-50%, -100%); opacity: 0; }
          to   { transform: translate(-50%, 0); opacity: 1; }
        }
        @keyframes menuFadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
      `,
        }}
      />
    </>
  );
}
