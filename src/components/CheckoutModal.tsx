import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  X,
  Truck,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  CreditCard,
  User,
  Phone,
  Mail,
  MapPin,
  Lock,
  ArrowRight,
  ShoppingBag,
  Clock,
  MessageCircle,
  RefreshCw,
  AlertCircle,
  Receipt,
  Copy,
  Check,
  Zap
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useStore } from '../context/StoreContext';
import {
  createRealInfinitePayCheckout,
  checkRealInfinitePayPayment,
  CheckPaymentResult,
  cleanInfinitePayHandle
} from '../lib/infinitepay';
import { ShippingAddress } from '../types';

export const CheckoutModal: React.FC = () => {
  const {
    isCheckoutOpen,
    setIsCheckoutOpen,
    items,
    subtotal,
    total,
    shippingAddress,
    setShippingAddress,
    shippingOption,
    shippingOptions,
    setShippingOption,
    handleCepSearch,
    isCalculatingShipping,
    clearCart
  } = useCart();

  const { settings } = useStore();

  // Buyer form fields
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerCpf, setCustomerCpf] = useState('');

  // Shipping address fields
  const [cep, setCep] = useState(shippingAddress?.cep || '01310-100');
  const [street, setStreet] = useState(shippingAddress?.street || 'Avenida Paulista');
  const [number, setNumber] = useState(shippingAddress?.number || '1000');
  const [complement, setComplement] = useState(shippingAddress?.complement || 'Apto 42');
  const [neighborhood, setNeighborhood] = useState(shippingAddress?.neighborhood || 'Bela Vista');
  const [city, setCity] = useState(shippingAddress?.city || 'São Paulo');
  const [stateUf, setStateUf] = useState(shippingAddress?.state || 'SP');

  // Checkout submission states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Active official checkout session
  const [activeSession, setActiveSession] = useState<{
    orderId: string;
    checkoutUrl: string;
    total: number;
    handle: string;
  } | null>(null);

  const [paymentStatus, setPaymentStatus] = useState<CheckPaymentResult | null>(null);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Polling for real payment confirmation from InfinitePay
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (activeSession && (!paymentStatus || !paymentStatus.paid)) {
      interval = setInterval(async () => {
        try {
          const res = await checkRealInfinitePayPayment(activeSession.orderId);
          if (res.paid) {
            setPaymentStatus(res);
            confetti({
              particleCount: 100,
              spread: 80,
              origin: { y: 0.5 }
            });
          }
        } catch {
          // Ignore transient polling errors
        }
      }, 5000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeSession, paymentStatus]);

  if (!isCheckoutOpen) return null;

  // Fill quick test data helper
  const handleFillTestData = () => {
    setCustomerName('Patrícia da Silva Oliveira');
    setCustomerPhone('(11) 98765-4321');
    setCustomerEmail('patricia.cliente@gmail.com');
    setCustomerCpf('345.892.108-99');
    setCep('01310-100');
    setStreet('Avenida Paulista');
    setNumber('1578');
    setComplement('Masp');
    setNeighborhood('Bela Vista');
    setCity('São Paulo');
    setStateUf('SP');
    setFormError(null);
  };

  // Phone input formatting
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length > 11) val = val.slice(0, 11);
    if (val.length > 6) {
      val = `(${val.slice(0, 2)}) ${val.slice(2, 7)}-${val.slice(7)}`;
    } else if (val.length > 2) {
      val = `(${val.slice(0, 2)}) ${val.slice(2)}`;
    }
    setCustomerPhone(val);
  };

  const handleCepLookup = async () => {
    if (!cep) return;
    const ok = await handleCepSearch(cep);
    if (ok && shippingAddress) {
      setStreet(shippingAddress.street || street);
      setNeighborhood(shippingAddress.neighborhood || neighborhood);
      setCity(shippingAddress.city || city);
      setStateUf(shippingAddress.state || stateUf);
    }
  };

  const handleProceedToInfinitePay = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!customerName.trim()) {
      setFormError('O Nome Completo é obrigatório para emissão do pedido.');
      return;
    }
    if (!customerPhone.trim() || customerPhone.replace(/\D/g, '').length < 10) {
      setFormError('O Telefone celular com DDD é obrigatório.');
      return;
    }
    if (items.length === 0) {
      setFormError('O seu carrinho está vazio.');
      return;
    }

    setIsSubmitting(true);

    try {
      const address: ShippingAddress = {
        cep: cep || '01310-100',
        street: street || 'Avenida Paulista',
        number: number || '1000',
        complement: complement || '',
        neighborhood: neighborhood || 'Bela Vista',
        city: city || 'São Paulo',
        state: stateUf || 'SP'
      };
      setShippingAddress(address);

      const orderCode = `COMPRAE-${Date.now().toString(36).toUpperCase()}`;
      const finalShippingCost = shippingOption ? shippingOption.price : 0;

      // Invoke real InfinitePay integration
      const result = await createRealInfinitePayCheckout({
        orderId: orderCode,
        items: items.map((i) => ({
          id: i.product.id,
          name: i.product.name,
          price: i.product.price,
          quantity: i.quantity
        })),
        shippingService: shippingOption ? shippingOption.name : 'Correios PAC',
        shippingCost: finalShippingCost,
        customer: {
          name: customerName,
          phone: customerPhone,
          email: customerEmail,
          cpf: customerCpf,
          address
        }
      });

      setActiveSession({
        orderId: orderCode,
        checkoutUrl: result.checkout_url,
        total: result.total_cents / 100,
        handle: result.handle
      });

      // Clear local cart
      clearCart();

      // Open InfinitePay official checkout in a new window/tab
      const paymentWindow = window.open(result.checkout_url, '_blank', 'noopener,noreferrer');
      if (!paymentWindow) {
        setStatusMessage(
          'O link oficial de pagamento foi gerado com sucesso! Clique no botão abaixo para abrir a tela segura da InfinitePay.'
        );
      }
    } catch (err: unknown) {
      console.error('Checkout error:', err);
      const msg = err instanceof Error ? err.message : String(err);
      setFormError(`Erro ao comunicar com a InfinitePay: ${msg}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Manual payment status verification with InfinitePay
  const handleCheckStatus = async () => {
    if (!activeSession) return;
    setIsCheckingStatus(true);
    setStatusMessage(null);

    try {
      const res = await checkRealInfinitePayPayment(activeSession.orderId);
      setPaymentStatus(res);

      if (res.paid) {
        confetti({
          particleCount: 120,
          spread: 90,
          origin: { y: 0.5 }
        });
      } else {
        setStatusMessage(
          'A InfinitePay ainda não identificou a liquidação deste pagamento. Se acabou de efetuar o Pix ou Cartão, aguarde alguns instantes e verifique novamente.'
        );
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setStatusMessage(`Erro ao consultar status oficial: ${msg}`);
    } finally {
      setIsCheckingStatus(false);
    }
  };

  const handleCopyLink = () => {
    if (!activeSession?.checkoutUrl) return;
    navigator.clipboard.writeText(activeSession.checkoutUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleWhatsAppContact = () => {
    if (!activeSession) return;
    const msg = `Olá Compraê! Estou no checkout do pedido *${activeSession.orderId}* no valor de R$ ${activeSession.total.toFixed(2)}. Nome: ${customerName}.`;
    window.open(`https://wa.me/5511999998888?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const currentHandle = cleanInfinitePayHandle(settings.infinitepay_handle);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 md:p-6 animate-fadeIn">
      <div
        className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[95vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold text-white font-['Space_Grotesk']">
                  Checkout Integrado InfinitePay
                </h2>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-bold border border-emerald-500/30">
                  ${currentHandle}
                </span>
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-1.5">
                <Lock className="w-3 h-3 text-emerald-400" />
                Ambiente Oficial InfinitePay (CloudWalk)
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsCheckoutOpen(false)}
            className="p-2 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-800 rounded-full transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {activeSession ? (
            /* ACTIVE INFINITEPAY SESSION VIEW */
            <div className="p-6 sm:p-8 space-y-6 text-center">
              {paymentStatus?.paid ? (
                /* APPROVED SCREEN (ONLY WHEN VERIFIED BY INFINITEPAY) */
                <div className="space-y-4">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                  <div>
                    <span className="text-xs font-black uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-3.5 py-1 rounded-full border border-emerald-500/30">
                      PAGAMENTO CONFIRMADO PELA INFINITEPAY
                    </span>
                    <h3 className="text-2xl font-black text-white font-['Space_Grotesk'] mt-2">
                      Compra Aprovada com Sucesso!
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Pedido: <strong className="text-white font-mono">{activeSession.orderId}</strong>
                    </p>
                  </div>

                  <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 text-left space-y-2 max-w-md mx-auto text-xs">
                    <div className="flex justify-between border-b border-slate-800 pb-2">
                      <span className="text-slate-400">Status Bancário:</span>
                      <strong className="text-emerald-400 font-bold">PAGO / APROVADO</strong>
                    </div>
                    {paymentStatus.capture_method && (
                      <div className="flex justify-between border-b border-slate-800 pb-2">
                        <span className="text-slate-400">Método de Captura:</span>
                        <strong className="text-white uppercase">{paymentStatus.capture_method}</strong>
                      </div>
                    )}
                    {paymentStatus.transaction_nsu && (
                      <div className="flex justify-between border-b border-slate-800 pb-2">
                        <span className="text-slate-400">NSU InfinitePay:</span>
                        <strong className="text-white font-mono">{paymentStatus.transaction_nsu}</strong>
                      </div>
                    )}
                    <div className="flex justify-between border-b border-slate-800 pb-2">
                      <span className="text-slate-400">Valor Pago:</span>
                      <strong className="text-emerald-400 font-bold">
                        R$ {activeSession.total.toFixed(2)}
                      </strong>
                    </div>
                    {paymentStatus.receipt_url && (
                      <div className="pt-2">
                        <a
                          href={paymentStatus.receipt_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold rounded-xl flex items-center justify-center gap-1.5 transition border border-slate-700"
                        >
                          <Receipt className="w-4 h-4" />
                          <span>Ver Comprovante Oficial InfinitePay</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => {
                      setActiveSession(null);
                      setPaymentStatus(null);
                      setIsCheckoutOpen(false);
                    }}
                    className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg transition"
                  >
                    Voltar para a Loja
                  </button>
                </div>
              ) : (
                /* WAITING PAYMENT ON INFINITEPAY */
                <div className="space-y-6">
                  <div className="w-16 h-16 rounded-full bg-amber-500/10 border-2 border-amber-500/40 text-amber-400 flex items-center justify-center mx-auto">
                    <Clock className="w-8 h-8 animate-pulse" />
                  </div>

                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-300 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/30">
                      AGUARDANDO PAGAMENTO NA INFINITEPAY
                    </span>
                    <h3 className="text-xl sm:text-2xl font-black text-white font-['Space_Grotesk'] mt-2">
                      Conclua seu Pagamento na InfinitePay
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Pedido: <strong className="text-white font-mono">{activeSession.orderId}</strong> • Total:{' '}
                      <strong className="text-emerald-400 font-['Space_Grotesk']">
                        R$ {activeSession.total.toFixed(2)}
                      </strong>
                    </p>
                  </div>

                  {/* Instructions & Primary Action Card */}
                  <div className="p-5 sm:p-6 rounded-2xl bg-slate-950 border border-slate-800 text-left space-y-4 max-w-lg mx-auto">
                    <div className="space-y-1.5">
                      <p className="text-xs text-slate-300 leading-relaxed">
                        A cobrança oficial foi emitida para o recebedor{' '}
                        <strong className="text-white">${currentHandle}</strong> no sistema InfinitePay.
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Clique no botão abaixo para acessar a página segura onde você encontrará o <strong>QR Code Pix oficial do Banco Central</strong> e o formulário de <strong>Cartão de Crédito em até 12x</strong>.
                      </p>
                    </div>

                    {/* Primary Button */}
                    <a
                      href={activeSession.checkoutUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-4 px-5 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-sm rounded-xl transition flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/25"
                    >
                      <span>Abrir Checkout Oficial InfinitePay (Pix / Cartão)</span>
                      <ExternalLink className="w-4 h-4" />
                    </a>

                    <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          window.location.href = activeSession.checkoutUrl;
                        }}
                        className="w-full sm:flex-1 py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 rounded-xl border border-slate-700 transition font-medium"
                      >
                        Pagar nesta mesma aba
                      </button>

                      <button
                        type="button"
                        onClick={handleCopyLink}
                        className="w-full sm:flex-1 py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 rounded-xl border border-slate-700 transition flex items-center justify-center gap-1.5 font-medium"
                      >
                        {copiedLink ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-emerald-400">Link Copiado!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-slate-400" />
                            <span>Copiar Link do Checkout</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div className="pt-2 border-t border-slate-850 flex items-center gap-2 text-[11px] text-slate-400">
                      <RefreshCw className="w-3.5 h-3.5 text-emerald-400 animate-spin shrink-0" />
                      <span>Verificando liquidação bancária com a InfinitePay a cada 5 segundos...</span>
                    </div>
                  </div>

                  {statusMessage && (
                    <div className="p-3.5 rounded-xl bg-slate-850 border border-slate-700 text-xs text-slate-300 max-w-lg mx-auto">
                      {statusMessage}
                    </div>
                  )}

                  {/* Secondary Action Buttons */}
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-2 max-w-lg mx-auto">
                    <button
                      type="button"
                      onClick={handleCheckStatus}
                      disabled={isCheckingStatus}
                      className="w-full sm:w-auto flex-1 py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl border border-slate-700 transition flex items-center justify-center gap-2"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isCheckingStatus ? 'animate-spin' : ''}`} />
                      <span>{isCheckingStatus ? 'Consultando...' : 'Verificar Pagamento com a InfinitePay'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleWhatsAppContact}
                      className="w-full sm:w-auto py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold text-xs rounded-xl border border-slate-700 transition flex items-center justify-center gap-1.5"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>Suporte WhatsApp</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* ORDER FORM */
            <form onSubmit={handleProceedToInfinitePay} className="p-5 sm:p-8 space-y-6">
              {/* Quick Fill Test button */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60">
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <Zap className="w-4 h-4 text-amber-400" />
                  <span>Preencher dados de comprador para teste rápido?</span>
                </div>
                <button
                  type="button"
                  onClick={handleFillTestData}
                  className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-xs font-bold transition"
                >
                  Preencher Teste
                </button>
              </div>

              {formError && (
                <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Section 1: Customer Data */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <User className="w-4 h-4 text-emerald-400" />
                  <span>1. Dados do Comprador</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1 font-medium">
                      Nome Completo *
                    </label>
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Ex: Patrícia da Silva"
                      className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1 font-medium">
                      Telefone Celular / WhatsApp *
                    </label>
                    <input
                      type="tel"
                      required
                      value={customerPhone}
                      onChange={handlePhoneChange}
                      placeholder="(11) 98765-4321"
                      className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1 font-medium">
                      E-mail (para envio do comprovante)
                    </label>
                    <input
                      type="email"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      placeholder="seuemail@exemplo.com"
                      className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1 font-medium">
                      CPF (para etiqueta de envio dos Correios)
                    </label>
                    <input
                      type="text"
                      value={customerCpf}
                      onChange={(e) => setCustomerCpf(e.target.value)}
                      placeholder="000.000.000-00"
                      maxLength={14}
                      className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Shipping Address & Correios */}
              <div className="space-y-3 pt-3 border-t border-slate-800">
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-emerald-400" />
                  <span>2. Endereço de Entrega (Correios)</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-1">
                    <label className="block text-[11px] text-slate-400 mb-1 font-medium">
                      CEP *
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        required
                        value={cep}
                        onChange={(e) => setCep(e.target.value)}
                        placeholder="01310-100"
                        maxLength={9}
                        className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                      />
                      <button
                        type="button"
                        onClick={handleCepLookup}
                        disabled={isCalculatingShipping}
                        className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-xs font-semibold shrink-0"
                      >
                        {isCalculatingShipping ? '...' : 'Buscar'}
                      </button>
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] text-slate-400 mb-1 font-medium">
                      Rua / Logradouro *
                    </label>
                    <input
                      type="text"
                      required
                      value={street}
                      onChange={(e) => setStreet(e.target.value)}
                      placeholder="Av. Paulista"
                      className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1 font-medium">
                      Número *
                    </label>
                    <input
                      type="text"
                      required
                      value={number}
                      onChange={(e) => setNumber(e.target.value)}
                      placeholder="1000"
                      className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1 font-medium">
                      Complemento
                    </label>
                    <input
                      type="text"
                      value={complement}
                      onChange={(e) => setComplement(e.target.value)}
                      placeholder="Apto 42"
                      className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1 font-medium">
                      Bairro *
                    </label>
                    <input
                      type="text"
                      required
                      value={neighborhood}
                      onChange={(e) => setNeighborhood(e.target.value)}
                      placeholder="Bela Vista"
                      className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1 font-medium">
                      Cidade *
                    </label>
                    <input
                      type="text"
                      required
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="São Paulo"
                      className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1 font-medium">
                      UF *
                    </label>
                    <input
                      type="text"
                      required
                      value={stateUf}
                      onChange={(e) => setStateUf(e.target.value.toUpperCase())}
                      placeholder="SP"
                      maxLength={2}
                      className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                {/* Correios Freight selection */}
                {shippingOptions.length > 0 && (
                  <div className="pt-2">
                    <label className="block text-[11px] text-slate-400 mb-1.5 font-medium">
                      Opção de Frete Correios:
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {shippingOptions.map((opt) => (
                        <label
                          key={opt.code}
                          onClick={() => setShippingOption(opt)}
                          className={`flex items-center justify-between p-3 rounded-2xl border text-xs cursor-pointer transition ${
                            shippingOption?.code === opt.code
                              ? 'bg-emerald-500/10 border-emerald-500 text-white'
                              : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:border-slate-600'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="radio"
                              name="shippingMethodCheckout"
                              checked={shippingOption?.code === opt.code}
                              onChange={() => setShippingOption(opt)}
                              className="text-emerald-500 focus:ring-0"
                            />
                            <div>
                              <p className="font-semibold text-white">{opt.name}</p>
                              <p className="text-[10px] text-slate-400">Prazo: até {opt.days} dias úteis</p>
                            </div>
                          </div>
                          <span className="font-extrabold text-emerald-400">
                            {opt.price === 0 ? 'GRÁTIS' : opt.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Section 3: InfinitePay Official Gateway Details */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-emerald-400" />
                    <span>Pagamento Seguro InfinitePay (${currentHandle})</span>
                  </span>
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-300 px-2 py-0.5 rounded font-bold border border-emerald-500/30">
                    Pix Oficial Banco Central + Cartão 12x
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Ao avançar, seu link de pagamento oficial será gerado pela API da InfinitePay. Na tela da InfinitePay você terá acesso ao <strong>QR Code Pix oficial emitido pelo Banco Central</strong> e ao parcelamento em até <strong>12x no cartão de crédito</strong>.
                </p>
              </div>

              {/* Total & Submit */}
              <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <p className="text-xs text-slate-400">Total do Pedido:</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl sm:text-3xl font-black text-white font-['Space_Grotesk']">
                      {(subtotal + (shippingOption ? shippingOption.price : 0)).toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL'
                      })}
                    </span>
                    <span className="text-xs text-emerald-400 font-semibold">
                      (Frete: {shippingOption ? (shippingOption.price === 0 ? 'Grátis' : shippingOption.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })) : 'A calcular'})
                    </span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 active:scale-95 text-slate-950 font-black text-sm rounded-2xl shadow-xl shadow-emerald-500/25 transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                      <span>Gerando Cobrança na InfinitePay...</span>
                    </div>
                  ) : (
                    <>
                      <span>Pagar no Checkout Oficial InfinitePay</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
