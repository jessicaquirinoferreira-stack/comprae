import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import {
  CheckCircle2,
  Clock,
  Receipt,
  ExternalLink,
  ShieldCheck,
  ShoppingBag,
  ArrowRight,
  RefreshCw,
  X,
  MapPin,
  PackageCheck
} from 'lucide-react';
import { checkRealInfinitePayPayment, CheckPaymentResult } from '../lib/infinitepay';
import { useCart } from '../context/CartContext';
import { useStore } from '../context/StoreContext';
import { Order } from '../types';

export const OrderReturnModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [transactionNsu, setTransactionNsu] = useState<string | null>(null);
  const [slug, setSlug] = useState<string | null>(null);
  const [paymentResult, setPaymentResult] = useState<CheckPaymentResult | null>(null);
  const [isVerifying, setIsVerifying] = useState(true);
  const [matchedOrder, setMatchedOrder] = useState<Order | null>(null);

  const { clearCart } = useCart();
  const { orders } = useStore();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ord = params.get('order_id') || params.get('order_nsu');
    const nsu = params.get('transaction_nsu') || undefined;
    const s = params.get('slug') || undefined;

    if (ord || window.location.pathname.includes('/checkout/retorno')) {
      const targetOrder = ord || 'COMPRAE-RETORNO';
      setOrderId(targetOrder);
      if (nsu) setTransactionNsu(nsu);
      if (s) setSlug(s);
      setIsOpen(true);
      clearCart();

      // Check payment status with InfinitePay official API
      verifyPayment(targetOrder, nsu, s);
    }
  }, []);

  // Match order details from Firestore
  useEffect(() => {
    if (orderId && orders.length > 0) {
      const found = orders.find((o) => o.id === orderId);
      if (found) setMatchedOrder(found);
    }
  }, [orderId, orders]);

  const verifyPayment = async (oid: string, nsu?: string, s?: string) => {
    setIsVerifying(true);
    try {
      const res = await checkRealInfinitePayPayment(oid, nsu, s);
      setPaymentResult(res);

      if (res.paid) {
        confetti({
          particleCount: 150,
          spread: 100,
          origin: { y: 0.5 }
        });
      }
    } catch (err) {
      console.warn('Error checking return payment status:', err);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    // Clean URL query parameters cleanly without reload
    const cleanUrl = window.location.origin + window.location.pathname.replace(/\/checkout\/retorno/, '/');
    window.history.replaceState({}, document.title, cleanUrl);
  };

  if (!isOpen || !orderId) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 text-center space-y-6">
        <button
          onClick={handleClose}
          className="absolute right-4 top-4 p-2 text-slate-400 hover:text-white rounded-full bg-slate-800/80 hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {isVerifying ? (
          <div className="py-8 space-y-4">
            <RefreshCw className="w-12 h-12 text-emerald-400 animate-spin mx-auto" />
            <h3 className="text-xl font-bold text-white font-['Space_Grotesk']">
              Verificando Pagamento na InfinitePay...
            </h3>
            <p className="text-xs text-slate-400">
              Consultando confirmação bancária do pedido <strong className="text-white font-mono">{orderId}</strong>
            </p>
          </div>
        ) : paymentResult?.paid ? (
          /* CONFIRMED BY INFINITEPAY */
          <div className="space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <span className="text-xs font-black uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-3.5 py-1 rounded-full border border-emerald-500/30">
                PAGAMENTO CONFIRMADO
              </span>
              <h3 className="text-2xl font-black text-white font-['Space_Grotesk'] mt-2">
                Obrigado! Seu pedido foi confirmado
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Número do Pedido: <strong className="text-white font-mono">{orderId}</strong>
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-left space-y-2 text-xs">
              <div className="flex justify-between border-b border-slate-800/80 pb-2">
                <span className="text-slate-400">Status Bancário:</span>
                <span className="text-emerald-400 font-bold">APROVADO PELA INFINITEPAY</span>
              </div>
              {paymentResult.capture_method && (
                <div className="flex justify-between border-b border-slate-800/80 pb-2">
                  <span className="text-slate-400">Forma de Pagamento:</span>
                  <span className="text-white font-semibold uppercase">{paymentResult.capture_method}</span>
                </div>
              )}
              {paymentResult.transaction_nsu && (
                <div className="flex justify-between border-b border-slate-800/80 pb-2">
                  <span className="text-slate-400">NSU Transação:</span>
                  <span className="text-white font-mono">{paymentResult.transaction_nsu}</span>
                </div>
              )}
              {matchedOrder && (
                <div className="pt-2 text-[11px] text-slate-400">
                  <p className="flex items-center gap-1.5 font-medium text-slate-300">
                    <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                    Entrega via Correios ({matchedOrder.shipping_service || 'PAC'}):
                  </p>
                  <p className="mt-0.5">
                    {matchedOrder.shipping_address?.street}, {matchedOrder.shipping_address?.number} - {matchedOrder.shipping_address?.city}/{matchedOrder.shipping_address?.state} (CEP: {matchedOrder.shipping_address?.cep})
                  </p>
                </div>
              )}
              {paymentResult.receipt_url && (
                <div className="pt-2">
                  <a
                    href={paymentResult.receipt_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2 px-3 bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold rounded-xl flex items-center justify-center gap-1.5 transition border border-slate-700"
                  >
                    <Receipt className="w-4 h-4" />
                    <span>Ver Comprovante Oficial InfinitePay</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}
            </div>

            <button
              onClick={handleClose}
              className="w-full py-3 px-6 bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg transition"
            >
              Continuar Comprando no Compraê
            </button>
          </div>
        ) : (
          /* STILL PENDING OR VERIFYING */
          <div className="space-y-4">
            <div className="w-14 h-14 rounded-full bg-amber-500/10 border-2 border-amber-500/40 text-amber-400 flex items-center justify-center mx-auto">
              <Clock className="w-8 h-8 animate-pulse" />
            </div>

            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-300 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/30">
                PAGAMENTO EM PROCESSAMENTO
              </span>
              <h3 className="text-xl font-bold text-white font-['Space_Grotesk'] mt-2">
                Aguardando Confirmação
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Pedido: <strong className="text-white font-mono">{orderId}</strong>
              </p>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed bg-slate-950 p-4 rounded-xl border border-slate-800">
              A InfinitePay ainda está processando a liquidação deste pedido. Assim que o pagamento for liquidado, nosso sistema atualizará seu pedido automaticamente.
            </p>

            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={() => verifyPayment(orderId, transactionNsu || undefined, slug || undefined)}
                className="flex-1 py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs rounded-xl border border-slate-700 transition flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Checar Novamente</span>
              </button>
              <button
                onClick={handleClose}
                className="flex-1 py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-xl border border-slate-700 transition"
              >
                Voltar à Loja
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
