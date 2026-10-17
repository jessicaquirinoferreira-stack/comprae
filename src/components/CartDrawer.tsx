import React, { useState } from 'react';
import {
  X,
  Trash2,
  Plus,
  Minus,
  Truck,
  ArrowRight,
  ShoppingBag,
  Sparkles,
  ShieldCheck,
  Check
} from 'lucide-react';
import { useCart } from '../context/CartContext';

export const CartDrawer: React.FC = () => {
  const {
    isCartOpen,
    setIsCartOpen,
    items,
    removeFromCart,
    updateQuantity,
    subtotal,
    total,
    shippingOption,
    shippingOptions,
    setShippingOption,
    shippingAddress,
    handleCepSearch,
    isCalculatingShipping,
    shippingError,
    setIsCheckoutOpen
  } = useCart();

  const [cepInput, setCepInput] = useState(shippingAddress?.cep || '');

  if (!isCartOpen) return null;

  const freeShippingThreshold = 149.0;
  const remainingForFreeShipping = Math.max(0, freeShippingThreshold - subtotal);
  const progressPercentage = Math.min(100, (subtotal / freeShippingThreshold) * 100);

  const handleApplyCep = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cepInput) return;
    await handleCepSearch(cepInput);
  };

  const handleProceedToCheckout = () => {
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col justify-between">
          {/* Header */}
          <div className="p-5 sm:p-6 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <ShoppingBag className="w-5 h-5 text-emerald-400" />
              <h2 className="text-lg font-bold text-white font-['Space_Grotesk']">
                Seu Carrinho ({items.reduce((acc, c) => acc + c.quantity, 0)})
              </h2>
            </div>
            <button
              onClick={() => setIsCartOpen(false)}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Free Shipping Progress Indicator */}
          <div className="bg-slate-950 px-5 py-3 border-b border-slate-800/80">
            <div className="flex items-center justify-between text-xs mb-1.5">
              {remainingForFreeShipping > 0 ? (
                <span className="text-slate-300">
                  Faltam{' '}
                  <strong className="text-emerald-400">
                    {remainingForFreeShipping.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </strong>{' '}
                  para <strong>Frete Grátis</strong>!
                </span>
              ) : (
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" /> Parabéns! Você ganhou Frete Grátis!
                </span>
              )}
              <span className="text-[10px] text-slate-500 font-bold">
                {Math.round(progressPercentage)}%
              </span>
            </div>
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500 rounded-full"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-12">
                <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center text-slate-500 mb-4">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <h3 className="text-base font-bold text-white mb-1">Seu carrinho está vazio</h3>
                <p className="text-xs text-slate-400 max-w-[220px] mb-6">
                  Explore nossos achadinhos e produtos virais com super desconto!
                </p>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-md transition"
                >
                  Continuar Comprando
                </button>
              </div>
            ) : (
              items.map(({ product, quantity }) => (
                <div
                  key={product.id}
                  className="flex gap-3.5 p-3 rounded-2xl bg-slate-850 border border-slate-800 hover:border-slate-700 transition"
                >
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover bg-slate-900 border border-slate-800 shrink-0"
                  />
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-xs sm:text-sm font-bold text-white line-clamp-1">
                          {product.name}
                        </h4>
                        <button
                          onClick={() => removeFromCart(product.id)}
                          className="text-slate-500 hover:text-rose-400 p-1 transition"
                          title="Remover item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <span className="text-[10px] text-emerald-400 font-semibold uppercase">
                        {product.category}
                      </span>
                    </div>

                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center border border-slate-700 bg-slate-800 rounded-lg overflow-hidden">
                        <button
                          onClick={() => updateQuantity(product.id, quantity - 1)}
                          className="p-1 px-2 text-slate-300 hover:text-white hover:bg-slate-700 text-xs transition"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2 text-xs font-bold text-white">{quantity}</span>
                        <button
                          onClick={() => updateQuantity(product.id, quantity + 1)}
                          className="p-1 px-2 text-slate-300 hover:text-white hover:bg-slate-700 text-xs transition"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="text-right">
                        <span className="text-xs sm:text-sm font-bold text-white font-['Space_Grotesk']">
                          {(product.price * quantity).toLocaleString('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}

            {/* In-Drawer CEP Calculator */}
            {items.length > 0 && (
              <div className="mt-4 p-4 rounded-2xl bg-slate-950 border border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
                    <Truck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Calcular Frete Correios</span>
                  </div>
                  {shippingAddress && (
                    <span className="text-[10px] text-emerald-400 font-medium">
                      {shippingAddress.city}/{shippingAddress.state}
                    </span>
                  )}
                </div>

                <form onSubmit={handleApplyCep} className="flex gap-2">
                  <input
                    type="text"
                    value={cepInput}
                    onChange={(e) => setCepInput(e.target.value)}
                    placeholder="CEP (ex: 01001-000)"
                    maxLength={9}
                    className="flex-1 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    type="submit"
                    disabled={isCalculatingShipping}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs rounded-xl border border-slate-700 transition"
                  >
                    {isCalculatingShipping ? '...' : 'OK'}
                  </button>
                </form>

                {shippingError && (
                  <p className="text-[10px] text-rose-400 mt-1.5">{shippingError}</p>
                )}

                {shippingOptions.length > 0 && (
                  <div className="mt-2.5 space-y-1.5">
                    {shippingOptions.map((opt) => (
                      <label
                        key={opt.code}
                        onClick={() => setShippingOption(opt)}
                        className={`flex items-center justify-between p-2 rounded-xl border text-xs cursor-pointer transition ${
                          shippingOption?.code === opt.code
                            ? 'bg-emerald-500/10 border-emerald-500/50 text-white'
                            : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="shippingMethodDrawer"
                            checked={shippingOption?.code === opt.code}
                            onChange={() => setShippingOption(opt)}
                            className="text-emerald-500 focus:ring-0"
                          />
                          <span className="text-[11px] font-medium">{opt.name}</span>
                        </div>
                        <span className="font-bold text-emerald-400 text-[11px]">
                          {opt.price === 0 ? 'GRÁTIS' : opt.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer Summary & Checkout CTA */}
          {items.length > 0 && (
            <div className="p-5 sm:p-6 border-t border-slate-800 bg-slate-950 space-y-3">
              <div className="space-y-1.5 text-xs text-slate-400">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="text-white font-semibold">
                    {subtotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Frete (Correios)</span>
                  <span className="text-white font-semibold">
                    {shippingOption
                      ? shippingOption.price === 0
                        ? 'Grátis'
                        : shippingOption.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                      : 'A calcular'}
                  </span>
                </div>
                <div className="flex justify-between text-base font-extrabold text-white pt-2 border-t border-slate-800 font-['Space_Grotesk']">
                  <span>Total</span>
                  <span className="text-emerald-400">
                    {total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                </div>
              </div>

              <button
                onClick={handleProceedToCheckout}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-bold text-sm rounded-xl shadow-lg shadow-emerald-500/20 transition flex items-center justify-center gap-2 active:scale-95"
              >
                <span>Finalizar Compra</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-500">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                <span>Pagamento Blindado via InfinitePay ($vendas_online2)</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
