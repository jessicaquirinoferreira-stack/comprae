import React, { useEffect, useState } from 'react';
import { motion, useScroll, useTransform } from 'motion/react';
import {
  Sparkles,
  TrendingUp,
  ShieldCheck,
  Zap,
  ArrowRight,
  Flame,
  CheckCircle2,
  PackageCheck
} from 'lucide-react';

interface HeroParallaxProps {
  onExploreClick: () => void;
}

export const HeroParallax: React.FC<HeroParallaxProps> = ({ onExploreClick }) => {
  const { scrollY } = useScroll();
  const yBg = useTransform(scrollY, [0, 500], [0, 150]);
  const yContent = useTransform(scrollY, [0, 500], [0, 60]);
  const opacityHero = useTransform(scrollY, [0, 450], [1, 0.2]);

  return (
    <div className="relative min-h-[580px] sm:min-h-[640px] lg:min-h-[720px] flex items-center justify-center overflow-hidden border-b border-slate-800">
      {/* Parallax Background Layer */}
      <motion.div
        style={{ y: yBg }}
        className="absolute inset-0 z-0 pointer-events-none"
      >
        <div
          className="absolute inset-0 bg-cover bg-center scale-110 filter brightness-[0.25] saturate-150 transition-all duration-700"
          style={{
            backgroundImage:
              'url("https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?q=80&w=2070&auto=format&fit=crop")',
          }}
        />
        {/* Modern radial gradients for high-end look */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/70 via-slate-950/80 to-[#0b0f19]" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />
      </motion.div>

      {/* Hero Foreground Content */}
      <motion.div
        style={{ y: yContent, opacity: opacityHero }}
        className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center flex flex-col items-center"
      >
        {/* Viral Badge Pill */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900/80 backdrop-blur-md border border-emerald-500/30 text-emerald-300 text-xs sm:text-sm font-semibold mb-6 shadow-xl shadow-emerald-950/30">
          <Flame className="w-4 h-4 text-emerald-400 animate-bounce" />
          <span>Os Achadinhos Mais Desejados da Internet Chegaram</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
        </div>

        {/* Main Headline */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white font-['Space_Grotesk'] leading-[1.1] max-w-4xl">
          Descubra os produtos <br className="hidden sm:inline" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">
            virais que facilitam sua vida
          </span>
        </h1>

        {/* Subtitle */}
        <p className="mt-6 text-base sm:text-lg lg:text-xl text-slate-300 max-w-2xl font-normal leading-relaxed">
          Curadoria exclusiva de gadgets inovadores, beleza e soluções para sua casa.
          Entrega garantida pelos <strong>Correios</strong> com checkout seguro via <strong>InfinitePay</strong>.
        </p>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          <button
            onClick={onExploreClick}
            className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-bold text-base rounded-2xl shadow-xl shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all flex items-center justify-center gap-2.5 active:scale-95 group"
          >
            <span>Ver Vitrine de Ofertas</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>

          <div className="flex items-center gap-2 px-5 py-3.5 rounded-2xl bg-slate-900/60 backdrop-blur-md border border-slate-800 text-slate-300 text-xs sm:text-sm font-medium">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <span>+12.450 clientes satisfeitos no Brasil</span>
          </div>
        </div>

        {/* Trust Badges */}
        <div className="mt-12 pt-8 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-8 max-w-4xl w-full text-left">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">Frete Rápido</p>
              <p className="text-[11px] text-slate-400">Envio direto Correios PAC/SEDEX</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">InfinitePay Oficial</p>
              <p className="text-[11px] text-slate-400">Checkout 100% blindado & Pix</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">Produtos Testados</p>
              <p className="text-[11px] text-slate-400">Alta durabilidade e virais</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
              <PackageCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">Garantia Compraê</p>
              <p className="text-[11px] text-slate-400">7 dias de troca sem complicação</p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
