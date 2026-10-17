import React, { useState, useRef, useEffect } from 'react';
import { StoreProvider, useStore } from './context/StoreContext';
import { CartProvider } from './context/CartContext';
import { Navbar } from './components/Navbar';
import { HeroParallax } from './components/HeroParallax';
import { CategoryPills } from './components/CategoryPills';
import { ProductCard } from './components/ProductCard';
import { ProductModal } from './components/ProductModal';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutModal } from './components/CheckoutModal';
import { OrderReturnModal } from './components/OrderReturnModal';
import { AdminModal } from './components/AdminModal';
import { Footer } from './components/Footer';
import { Product } from './types';
import {
  Sparkles,
  ShoppingBag,
  SlidersHorizontal,
  Flame,
  Search,
  CheckCircle2,
  TrendingUp,
  Tag
} from 'lucide-react';

function MainStoreContent() {
  const {
    products,
    selectedCategory,
    searchQuery,
    selectedProduct,
    setSelectedProduct,
    isLoading
  } = useStore();

  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isDark, setIsDark] = useState(true);
  const catalogRef = useRef<HTMLDivElement>(null);

  // Check URL hash for admin e.g. #admin or /admin
  useEffect(() => {
    if (window.location.hash === '#admin' || window.location.pathname === '/admin') {
      setIsAdminOpen(true);
    }
  }, []);

  const scrollToCatalog = () => {
    catalogRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Filter products by category and search
  const filteredProducts = products.filter((p) => {
    const matchesCategory =
      selectedCategory === 'Todos' || p.category === selectedCategory;
    const matchesSearch =
      !searchQuery.trim() ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className={`min-h-screen flex flex-col font-['Plus_Jakarta_Sans'] ${isDark ? 'dark bg-[#0b0f19] text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      {/* Navigation */}
      <Navbar
        onOpenAdmin={() => setIsAdminOpen(true)}
        isDark={isDark}
        onToggleTheme={() => setIsDark(!isDark)}
      />

      {/* Parallax Hero */}
      <HeroParallax onExploreClick={scrollToCatalog} />

      {/* Main Storefront Body */}
      <main ref={catalogRef} className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-2">
              <Sparkles className="w-4 h-4" />
              <span>Vitrine Oficial Compraê</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white font-['Space_Grotesk'] tracking-tight">
              Achadinhos & Produtos em Alta
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Preços justos, estoque no Brasil e entrega expressa via Correios.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-400">
              Mostrando <strong className="text-white">{filteredProducts.length}</strong> produtos
            </span>
          </div>
        </div>

        {/* Category Filters */}
        <div className="mb-8">
          <CategoryPills />
        </div>

        {/* Products Grid */}
        {isLoading ? (
          <div className="py-20 text-center flex flex-col items-center justify-center">
            <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-sm text-slate-400">Carregando catálogo do Compraê...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="py-20 text-center bg-slate-900/50 rounded-3xl border border-slate-800 p-8">
            <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center text-slate-500 mx-auto mb-4">
              <Search className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">
              Nenhum produto encontrado
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mb-6">
              Não encontramos resultados para "{searchQuery}". Tente buscar por outros termos como fone, suporte, pet ou maquiagem.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onSelect={(prod) => setSelectedProduct(prod)}
              />
            ))}
          </div>
        )}

        {/* Feature highlight banner */}
        <div className="mt-16 sm:mt-24 rounded-3xl bg-gradient-to-r from-emerald-950/40 via-teal-950/40 to-slate-900 border border-emerald-500/20 p-6 sm:p-10 flex flex-col lg:flex-row items-center justify-between gap-8 relative overflow-hidden">
          <div className="absolute right-0 top-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="space-y-3 max-w-xl z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
              <Flame className="w-3.5 h-3.5 text-amber-400" /> Minerador Viral Ativo
            </div>
            <h3 className="text-2xl sm:text-3xl font-black text-white font-['Space_Grotesk']">
              Novos produtos chegam toda semana no Compraê!
            </h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              Nosso sistema monitora as redes sociais e os maiores marketplaces para trazer as soluções que realmente resolvem o seu dia a dia.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 z-10 shrink-0">
            <button
              onClick={() => setIsAdminOpen(true)}
              className="px-6 py-3.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold text-xs rounded-2xl transition"
            >
              Acesso Admin ($vendas_online2)
            </button>
            <button
              onClick={scrollToCatalog}
              className="px-6 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 text-slate-950 font-bold text-xs rounded-2xl shadow-lg transition"
            >
              Aproveitar Ofertas Agora
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer onOpenAdmin={() => setIsAdminOpen(true)} />

      {/* Modals & Drawers */}
      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}

      <CartDrawer />
      <CheckoutModal />
      <OrderReturnModal />
      <AdminModal
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <CartProvider>
        <MainStoreContent />
      </CartProvider>
    </StoreProvider>
  );
}
