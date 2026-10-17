import React, { useState } from 'react';
import {
  X,
  Star,
  Flame,
  Truck,
  ShieldCheck,
  Check,
  ShoppingBag,
  ArrowRight,
  Package,
  Sparkles
} from 'lucide-react';
import { Product } from '../types';
import { useCart } from '../context/CartContext';
import { calculateCorreiosShipping, lookupCep } from '../lib/correios';

interface ProductModalProps {
  product: Product;
  onClose: () => void;
}

export const ProductModal: React.FC<ProductModalProps> = ({ product, onClose }) => {
  const { addToCart, setIsCheckoutOpen } = useCart();
  const [activeImage, setActiveImage] = useState(product.image_url);
  const [quantity, setQuantity] = useState(1);
  const [cepInput, setCepInput] = useState('');
  const [cepLoading, setCepLoading] = useState(false);
  const [shippingResult, setShippingResult] = useState<{
    city: string;
    uf: string;
    options: ReturnType<typeof calculateCorreiosShipping>;
  } | null>(null);
  const [cepError, setCepError] = useState<string | null>(null);

  const images = product.images && product.images.length > 0 ? product.images : [product.image_url];

  const formattedPrice = product.price.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
  const installment = (product.price / 12).toFixed(2).replace('.', ',');

  const handleCalculateCep = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = cepInput.replace(/\D/g, '');
    if (clean.length !== 8) {
      setCepError('Informe um CEP com 8 dígitos válidos.');
      return;
    }
    setCepLoading(true);
    setCepError(null);
    try {
      const data = await lookupCep(clean);
      if (!data) {
        setCepError('CEP não encontrado nos Correios.');
        return;
      }
      const options = calculateCorreiosShipping(data.uf, product.price * quantity);
      setShippingResult({
        city: data.localidade,
        uf: data.uf,
        options,
      });
    } catch {
      setCepError('Erro ao consultar frete.');
    } finally {
      setCepLoading(false);
    }
  };

  const handleBuyNow = () => {
    addToCart(product, quantity);
    onClose();
    setIsCheckoutOpen(true);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 md:p-6 animate-fadeIn">
      <div
        className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-800 rounded-full transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 p-5 sm:p-8">
          {/* Left Column: Gallery */}
          <div className="flex flex-col gap-4">
            <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-inner">
              <img
                src={activeImage}
                alt={product.name}
                className="w-full h-full object-cover object-center transition-all duration-300"
              />
              <div className="absolute top-3 left-3 flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-950/85 backdrop-blur-md border border-emerald-500/40 text-emerald-400 text-xs font-bold shadow-lg">
                <Flame className="w-4 h-4 text-amber-400 fill-amber-400" />
                <span>Score Viral: {product.virality_score}/10</span>
              </div>
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImage(img)}
                    className={`relative w-16 h-16 rounded-xl overflow-hidden border-2 transition-all shrink-0 ${
                      activeImage === img ? 'border-emerald-400 scale-105' : 'border-slate-800 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt={`Thumb ${idx}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Virality notice */}
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                <strong>Produto Tendência:</strong> Alta procura nas redes sociais. Fornecimento testado com garantia de envio imediato via Correios.
              </span>
            </div>
          </div>

          {/* Right Column: Info & Actions */}
          <div className="flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2">
                <span>{product.category}</span>
                <span>•</span>
                <span className="flex items-center gap-1 text-amber-400">
                  <Star className="w-3.5 h-3.5 fill-amber-400" /> 4.9 (328 avaliações)
                </span>
              </div>

              <h2 className="text-xl sm:text-2xl font-black text-white font-['Space_Grotesk'] leading-snug mb-3">
                {product.name}
              </h2>

              <p className="text-sm text-slate-300 leading-relaxed mb-4">
                {product.description}
              </p>

              {/* Price display */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 mb-5">
                <div className="flex items-baseline gap-3">
                  <span className="text-2xl sm:text-3xl font-extrabold text-white font-['Space_Grotesk']">
                    {formattedPrice}
                  </span>
                  <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                    5% OFF no Pix
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  ou 12x de <strong className="text-slate-200">R$ {installment}</strong> no cartão de crédito
                </p>
                <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  Processado com segurança pelo InfinitePay ($vendas_online2)
                </div>
              </div>

              {/* Quantity selector */}
              <div className="flex items-center gap-4 mb-5">
                <span className="text-xs font-semibold text-slate-300">Quantidade:</span>
                <div className="flex items-center border border-slate-700 bg-slate-800 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-3 py-1.5 text-slate-300 hover:text-white hover:bg-slate-700 text-sm font-bold transition"
                  >
                    -
                  </button>
                  <span className="px-4 py-1.5 text-xs font-bold text-white min-w-[36px] text-center">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="px-3 py-1.5 text-slate-300 hover:text-white hover:bg-slate-700 text-sm font-bold transition"
                  >
                    +
                  </button>
                </div>
                <span className="text-[11px] text-slate-400">
                  {product.stock} unidades disponíveis
                </span>
              </div>

              {/* Interactive CEP Shipping Calculator */}
              <div className="mb-6 p-4 rounded-2xl bg-slate-800/60 border border-slate-800">
                <div className="flex items-center gap-2 text-xs font-bold text-white mb-2.5">
                  <Truck className="w-4 h-4 text-emerald-400" />
                  <span>Calcular Frete dos Correios</span>
                </div>
                <form onSubmit={handleCalculateCep} className="flex gap-2">
                  <input
                    type="text"
                    value={cepInput}
                    onChange={(e) => setCepInput(e.target.value)}
                    placeholder="Digite seu CEP (ex: 01310-100)"
                    maxLength={9}
                    className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    type="submit"
                    disabled={cepLoading}
                    className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white font-semibold text-xs rounded-xl transition"
                  >
                    {cepLoading ? 'Calculando...' : 'Calcular'}
                  </button>
                </form>

                {cepError && (
                  <p className="text-[11px] text-rose-400 mt-2">{cepError}</p>
                )}

                {shippingResult && (
                  <div className="mt-3 pt-3 border-t border-slate-700/60 flex flex-col gap-2">
                    <p className="text-[11px] text-slate-300">
                      Entrega para <strong>{shippingResult.city} - {shippingResult.uf}</strong>:
                    </p>
                    {shippingResult.options.map((opt) => (
                      <div
                        key={opt.code}
                        className="flex items-center justify-between p-2 rounded-lg bg-slate-900/80 text-xs"
                      >
                        <span className="text-slate-300">
                          {opt.name} ({opt.days} dias úteis)
                        </span>
                        <strong className="text-emerald-400">
                          {opt.price === 0 ? 'GRÁTIS' : opt.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </strong>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3 pt-3 border-t border-slate-800">
              <button
                onClick={() => {
                  addToCart(product, quantity);
                  onClose();
                }}
                className="flex-1 py-3 px-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold text-xs sm:text-sm rounded-xl transition flex items-center justify-center gap-2"
              >
                <ShoppingBag className="w-4 h-4 text-emerald-400" />
                <span>Adicionar ao Carrinho</span>
              </button>

              <button
                onClick={handleBuyNow}
                className="flex-1 py-3 px-4 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-emerald-500/20 transition flex items-center justify-center gap-2"
              >
                <span>Finalizar Pedido</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
