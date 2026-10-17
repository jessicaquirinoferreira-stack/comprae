import React from 'react';
import { motion } from 'motion/react';
import { ShoppingBag, Star, Flame, Eye, Truck, Sparkles } from 'lucide-react';
import { Product } from '../types';
import { useCart } from '../context/CartContext';

interface ProductCardProps {
  product: Product;
  onSelect: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onSelect }) => {
  const { addToCart } = useCart();

  const installmentValue = (product.price / 12).toFixed(2).replace('.', ',');
  const formattedPrice = product.price.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });

  return (
    <motion.div
      whileHover={{ y: -6 }}
      transition={{ duration: 0.2 }}
      onClick={() => onSelect(product)}
      className="group relative bg-slate-850/70 hover:bg-slate-800/90 rounded-3xl border border-slate-800 hover:border-emerald-500/40 p-3 sm:p-4 transition-all duration-300 shadow-lg hover:shadow-2xl hover:shadow-emerald-950/20 cursor-pointer flex flex-col justify-between overflow-hidden"
    >
      <div>
        {/* Image wrapper */}
        <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 mb-3.5">
          <img
            src={product.image_url}
            alt={product.name}
            loading="lazy"
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
          />

          {/* Virality score badge */}
          <div className="absolute top-2.5 left-2.5 flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-950/80 backdrop-blur-md border border-emerald-500/40 text-emerald-400 text-[11px] font-bold shadow-md">
            <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            <span>Viral {product.virality_score}/10</span>
          </div>

          {/* Badge (e.g. Mais Vendido) */}
          {product.badge && (
            <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950 text-[10px] font-extrabold shadow-md">
              {product.badge}
            </div>
          )}

          {/* Quick view overlay button */}
          <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
            <span className="px-3.5 py-1.5 rounded-xl bg-slate-900/90 text-white text-xs font-semibold flex items-center gap-1.5 border border-slate-700 shadow-xl backdrop-blur-sm">
              <Eye className="w-3.5 h-3.5 text-emerald-400" /> Ver Detalhes
            </span>
          </div>
        </div>

        {/* Category & Rating */}
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="text-emerald-400 font-semibold tracking-wide uppercase text-[10px]">
            {product.category}
          </span>
          <div className="flex items-center gap-1 text-amber-400">
            <Star className="w-3.5 h-3.5 fill-amber-400" />
            <span className="text-[11px] font-bold text-slate-300">4.9</span>
          </div>
        </div>

        {/* Product title */}
        <h3 className="font-bold text-sm sm:text-base text-white group-hover:text-emerald-300 transition-colors line-clamp-2 leading-snug mb-2">
          {product.name}
        </h3>

        {/* Short description */}
        <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-3">
          {product.description}
        </p>
      </div>

      {/* Footer / Price & Fast Add */}
      <div className="pt-3 border-t border-slate-800/80">
        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-lg sm:text-xl font-extrabold text-white tracking-tight font-['Space_Grotesk']">
            {formattedPrice}
          </span>
          <span className="text-[11px] text-emerald-400 font-semibold">no Pix (-5%)</span>
        </div>
        <p className="text-[11px] text-slate-400 mb-3">
          ou 12x de <strong className="text-slate-200">R$ {installmentValue}</strong>
        </p>

        <button
          onClick={(e) => {
            e.stopPropagation();
            addToCart(product, 1);
          }}
          className="w-full py-2.5 px-3 bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-slate-950 font-bold text-xs sm:text-sm rounded-xl transition-all shadow-md shadow-emerald-500/10 flex items-center justify-center gap-2 group/btn"
        >
          <ShoppingBag className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
          <span>Comprar Agora</span>
        </button>
      </div>
    </motion.div>
  );
};
