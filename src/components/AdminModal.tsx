import React, { useState, useEffect } from 'react';
import {
  X,
  Lock,
  Package,
  ShoppingCart,
  TrendingUp,
  Share2,
  Plus,
  Trash2,
  Edit2,
  Search,
  Upload,
  CheckCircle2,
  Flame,
  DollarSign,
  AlertCircle,
  ExternalLink,
  Sparkles,
  BarChart3,
  RefreshCw
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { Product, StoreSettings, ViralCandidate, Order } from '../types';
import { searchViralProducts } from '../lib/viralSearch';
import { uploadToVercelBlob } from '../lib/vercel-blob';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminModal: React.FC<AdminModalProps> = ({ isOpen, onClose }) => {
  const {
    products,
    settings,
    orders,
    addProduct,
    updateProduct,
    deleteProduct,
    updateSettings,
    updateOrderStatus
  } = useStore();

  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);

  // Admin Navigation Tabs
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'viral_hunter' | 'social'>('overview');

  // Product CRUD Form State
  const [isEditingProduct, setIsEditingProduct] = useState<Product | null>(null);
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [prodName, setProdName] = useState('');
  const [prodDescription, setProdDescription] = useState('');
  const [prodCategory, setProdCategory] = useState('Tech & Gadgets');
  const [prodCost, setProdCost] = useState(30);
  const [prodPrice, setProdPrice] = useState(59.9);
  const [prodStock, setProdStock] = useState(50);
  const [prodBadge, setProdBadge] = useState('Novidade ✨');
  const [prodImage, setProdImage] = useState('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Viral Search Engine State
  const [viralQuery, setViralQuery] = useState('');
  const [viralResults, setViralResults] = useState<ViralCandidate[]>([]);
  const [isSearchingViral, setIsSearchingViral] = useState(false);
  const [profitMargin, setProfitMargin] = useState<number>(15.0);
  const [viralSuccessMessage, setViralSuccessMessage] = useState<string | null>(null);

  // Settings State
  const [socialSettings, setSocialSettings] = useState<StoreSettings>(settings);
  const [settingsSaved, setSettingsSaved] = useState(false);

  useEffect(() => {
    setSocialSettings(settings);
  }, [settings]);

  // Load initial viral recommendations on open
  useEffect(() => {
    if (isAuthenticated && activeTab === 'viral_hunter' && viralResults.length === 0) {
      handleViralSearch('');
    }
  }, [isAuthenticated, activeTab]);

  if (!isOpen) return null;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (email === 'patricia@x.com' && password === 'patricia4321') {
      setIsAuthenticated(true);
      setAuthError(null);
    } else {
      setAuthError('Credenciais inválidas. Verifique o email e senha de administrador.');
    }
  };

  const fillTestCredentials = () => {
    setEmail('patricia@x.com');
    setPassword('patricia4321');
  };

  // Image upload via Vercel Blob
  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingImage(true);
    try {
      const res = await uploadToVercelBlob(file, { folder: 'products' });
      setProdImage(res.url);
    } catch (err) {
      console.error('Vercel Blob upload failed:', err);
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Save Product (Add or Edit)
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodName || !prodImage) return;

    const margin = Math.max(0, prodPrice - prodCost);

    if (isEditingProduct) {
      await updateProduct(isEditingProduct.id, {
        name: prodName,
        description: prodDescription,
        category: prodCategory,
        cost_price: Number(prodCost),
        suggested_cost_base: Number(prodCost),
        profit_margin: margin,
        price: Number(prodPrice),
        stock: Number(prodStock),
        badge: prodBadge,
        image_url: prodImage
      });
      setIsEditingProduct(null);
    } else {
      await addProduct({
        name: prodName,
        description: prodDescription,
        category: prodCategory,
        cost_price: Number(prodCost),
        suggested_cost_base: Number(prodCost),
        profit_margin: margin,
        price: Number(prodPrice),
        stock: Number(prodStock),
        badge: prodBadge,
        image_url: prodImage,
        virality_score: 8.5
      });
      setIsAddingProduct(false);
    }

    // Reset fields
    setProdName('');
    setProdDescription('');
    setProdImage('');
  };

  const handleEditClick = (p: Product) => {
    setIsEditingProduct(p);
    setProdName(p.name);
    setProdDescription(p.description);
    setProdCategory(p.category);
    setProdCost(p.cost_price || p.suggested_cost_base || 20);
    setProdPrice(p.price);
    setProdStock(p.stock);
    setProdBadge(p.badge || '');
    setProdImage(p.image_url);
    setIsAddingProduct(false);
  };

  // Viral Search Execution
  const handleViralSearch = async (query: string) => {
    setIsSearchingViral(true);
    try {
      const results = await searchViralProducts(query);
      setViralResults(results);
    } finally {
      setIsSearchingViral(false);
    }
  };

  // Import Viral Product to Catalog
  const handleImportViralCandidate = async (candidate: ViralCandidate) => {
    const finalPrice = parseFloat((candidate.suggested_cost_base + profitMargin).toFixed(2));
    
    await addProduct({
      name: candidate.name,
      description: candidate.description,
      category: candidate.category,
      suggested_cost_base: candidate.suggested_cost_base,
      cost_price: candidate.suggested_cost_base,
      profit_margin: profitMargin,
      price: finalPrice,
      image_url: candidate.image_url,
      stock: 60,
      virality_score: candidate.virality_score,
      badge: `Tendência ${candidate.source_platform} 🔥`,
      source: candidate.source_platform
    });

    setViralSuccessMessage(`"${candidate.name.slice(0, 35)}..." foi adicionado à vitrine por R$ ${finalPrice.toFixed(2)}!`);
    setTimeout(() => setViralSuccessMessage(null), 4000);
  };

  // Save Social Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateSettings(socialSettings);
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 3000);
  };

  // Calculations for Overview Dashboard
  const totalRevenue = orders.reduce((acc, curr) => acc + curr.total, 0);
  const averageTicket = orders.length > 0 ? totalRevenue / orders.length : 0;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 md:p-6 animate-fadeIn">
      <div
        className="relative w-full max-w-5xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white font-['Space_Grotesk']">
                  Painel de Controle Compraê
                </h2>
                {isAuthenticated && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                    patricia@x.com
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                Gestão de vitrine, pedidos, InfinitePay ($vendas_online2) e minerador de produtos virais
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-800 rounded-full transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        {!isAuthenticated ? (
          /* Login View */
          <div className="p-6 sm:p-10 max-w-md mx-auto w-full my-auto text-center">
            <div className="w-14 h-14 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center mx-auto mb-4 text-emerald-400">
              <Lock className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold text-white font-['Space_Grotesk'] mb-2">
              Autenticação Administrativa
            </h3>
            <p className="text-xs text-slate-400 mb-6">
              Acesso restrito ao painel da loja Compraê.
            </p>

            {authError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4 text-left">
              <div>
                <label className="block text-xs text-slate-300 mb-1 font-medium">E-mail</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="patricia@x.com"
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1 font-medium">Senha</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-bold text-xs sm:text-sm rounded-xl transition shadow-lg shadow-emerald-500/20"
              >
                Entrar no Painel Admin
              </button>

              <button
                type="button"
                onClick={fillTestCredentials}
                className="w-full py-2 bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white text-xs rounded-xl transition"
              >
                Preencher com Login Fixo (patricia@x.com / patricia4321)
              </button>
            </form>
          </div>
        ) : (
          /* Authenticated Dashboard */
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Navigation Tabs */}
            <div className="flex items-center gap-2 px-6 pt-3 border-b border-slate-800 bg-slate-950/40 overflow-x-auto shrink-0">
              <button
                onClick={() => setActiveTab('overview')}
                className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition ${
                  activeTab === 'overview'
                    ? 'border-emerald-400 text-emerald-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                <span>Visão Geral & Pedidos ({orders.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('products')}
                className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition ${
                  activeTab === 'products'
                    ? 'border-emerald-400 text-emerald-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Package className="w-4 h-4" />
                <span>Gestão de Produtos ({products.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('viral_hunter')}
                className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition relative ${
                  activeTab === 'viral_hunter'
                    ? 'border-emerald-400 text-emerald-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Flame className="w-4 h-4 text-amber-400" />
                <span>Buscador de Produtos Virais</span>
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              </button>

              <button
                onClick={() => setActiveTab('social')}
                className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition ${
                  activeTab === 'social'
                    ? 'border-emerald-400 text-emerald-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Share2 className="w-4 h-4" />
                <span>Redes Sociais & Loja</span>
              </button>
            </div>

            {/* Tab Contents */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
              {/* TAB 1: OVERVIEW */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Metric Cards */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                      <span className="text-[11px] font-semibold text-slate-400">Faturamento Total</span>
                      <p className="text-xl sm:text-2xl font-black text-white font-['Space_Grotesk'] mt-1">
                        {totalRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </p>
                      <span className="text-[10px] text-emerald-400 font-semibold">Via InfinitePay & Pix</span>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                      <span className="text-[11px] font-semibold text-slate-400">Total de Pedidos</span>
                      <p className="text-xl sm:text-2xl font-black text-white font-['Space_Grotesk'] mt-1">
                        {orders.length}
                      </p>
                      <span className="text-[10px] text-teal-400 font-semibold">Sincronizado Firestore</span>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                      <span className="text-[11px] font-semibold text-slate-400">Ticket Médio</span>
                      <p className="text-xl sm:text-2xl font-black text-white font-['Space_Grotesk'] mt-1">
                        {averageTicket.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </p>
                      <span className="text-[10px] text-slate-400 font-semibold">Por cliente</span>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                      <span className="text-[11px] font-semibold text-slate-400">Produtos no Catálogo</span>
                      <p className="text-xl sm:text-2xl font-black text-white font-['Space_Grotesk'] mt-1">
                        {products.length}
                      </p>
                      <span className="text-[10px] text-emerald-400 font-semibold">100% ativos na vitrine</span>
                    </div>
                  </div>

                  {/* Orders Table */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-bold text-white flex items-center justify-between">
                      <span>Pedidos Recentes</span>
                      <span className="text-xs text-slate-400">Handle InfinitePay: {settings.infinitepay_handle || '$vendas_online2'}</span>
                    </h4>

                    {orders.length === 0 ? (
                      <div className="p-8 text-center bg-slate-950 rounded-2xl border border-slate-800 text-xs text-slate-400">
                        Nenhum pedido realizado ainda. Realize uma compra de teste na loja para ver os dados aqui em tempo real!
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {orders.map((ord) => (
                          <div
                            key={ord.id}
                            className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4"
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <strong className="text-sm text-white font-['Space_Grotesk']">
                                  {ord.id}
                                </strong>
                                <span className="text-xs text-slate-400">• {ord.customer_name}</span>
                                <span className="text-xs text-emerald-400">({ord.customer_phone})</span>
                              </div>
                              <p className="text-xs text-slate-400">
                                {ord.items.map((i) => `${i.quantity}x ${i.name}`).join(', ')}
                              </p>
                              <p className="text-[11px] text-slate-500">
                                Endereço: {ord.shipping_address?.street}, {ord.shipping_address?.number} - {ord.shipping_address?.city}/{ord.shipping_address?.state} (CEP: {ord.shipping_address?.cep})
                              </p>
                            </div>

                            <div className="flex items-center gap-4 shrink-0">
                              <div className="text-right">
                                <p className="text-sm font-black text-white font-['Space_Grotesk']">
                                  {ord.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                </p>
                                <span className="text-[10px] text-slate-400 uppercase font-semibold">
                                  {ord.payment_method === 'infinitepay_pix' ? 'Pix InfinitePay' : 'Cartão InfinitePay'}
                                </span>
                              </div>

                              <select
                                value={ord.status}
                                onChange={(e) => updateOrderStatus(ord.id, e.target.value as Order['status'])}
                                className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs font-semibold text-white focus:outline-none focus:border-emerald-500"
                              >
                                <option value="pending">🟡 Pendente</option>
                                <option value="paid">🟢 Pago</option>
                                <option value="shipped">🚚 Enviado</option>
                                <option value="delivered">✅ Entregue</option>
                                <option value="cancelled">❌ Cancelado</option>
                              </select>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 2: PRODUCTS CRUD */}
              {activeTab === 'products' && (
                <div className="space-y-6">
                  {/* Actions Bar */}
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-white">Catálogo de Produtos ({products.length})</h4>
                    <button
                      onClick={() => {
                        setIsAddingProduct(true);
                        setIsEditingProduct(null);
                        setProdName('');
                        setProdDescription('');
                        setProdCost(25);
                        setProdPrice(59.9);
                        setProdStock(50);
                        setProdImage('');
                      }}
                      className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-md"
                    >
                      <Plus className="w-4 h-4" /> Adicionar Produto
                    </button>
                  </div>

                  {/* Add / Edit Form Modal/Drawer */}
                  {(isAddingProduct || isEditingProduct) && (
                    <form
                      onSubmit={handleSaveProduct}
                      className="p-5 rounded-3xl bg-slate-950 border border-emerald-500/30 space-y-4 animate-fadeIn"
                    >
                      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                        <h5 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                          {isEditingProduct ? `Editar: ${isEditingProduct.name}` : 'Cadastrar Novo Produto'}
                        </h5>
                        <button
                          type="button"
                          onClick={() => {
                            setIsAddingProduct(false);
                            setIsEditingProduct(null);
                          }}
                          className="text-slate-400 hover:text-white text-xs"
                        >
                          Cancelar
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="sm:col-span-2">
                          <label className="block text-[11px] text-slate-400 mb-1">Nome do Produto *</label>
                          <input
                            type="text"
                            required
                            value={prodName}
                            onChange={(e) => setProdName(e.target.value)}
                            placeholder="Ex: Fone Bluetooth True Wireless"
                            className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className="block text-[11px] text-slate-400 mb-1">Descrição Completa</label>
                          <textarea
                            rows={3}
                            value={prodDescription}
                            onChange={(e) => setProdDescription(e.target.value)}
                            placeholder="Descreva os benefícios e especificações..."
                            className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] text-slate-400 mb-1">Categoria</label>
                          <select
                            value={prodCategory}
                            onChange={(e) => setProdCategory(e.target.value)}
                            className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
                          >
                            <option value="Tech & Gadgets">Tech & Gadgets</option>
                            <option value="Office & Organization">Office & Organization</option>
                            <option value="Beauty & Health">Beauty & Health</option>
                            <option value="Pet Supplies">Pet Supplies</option>
                            <option value="Accessories">Accessories</option>
                            <option value="Home & Kitchen">Home & Kitchen</option>
                            <option value="Kids & Toys">Kids & Toys</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[11px] text-slate-400 mb-1">Selo / Badge</label>
                          <input
                            type="text"
                            value={prodBadge}
                            onChange={(e) => setProdBadge(e.target.value)}
                            placeholder="Ex: Mais Vendido 🔥"
                            className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] text-slate-400 mb-1">Preço de Custo (R$)</label>
                          <input
                            type="number"
                            step="0.10"
                            value={prodCost}
                            onChange={(e) => setProdCost(Number(e.target.value))}
                            className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] text-slate-400 mb-1">Preço de Venda na Loja (R$)</label>
                          <input
                            type="number"
                            step="0.10"
                            value={prodPrice}
                            onChange={(e) => setProdPrice(Number(e.target.value))}
                            className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] text-slate-400 mb-1">Estoque</label>
                          <input
                            type="number"
                            value={prodStock}
                            onChange={(e) => setProdStock(Number(e.target.value))}
                            className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
                          />
                        </div>

                        {/* Image Upload with Vercel Blob */}
                        <div>
                          <label className="block text-[11px] text-slate-400 mb-1">
                            Foto do Produto (Upload Vercel Blob ou URL) *
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={prodImage}
                              onChange={(e) => setProdImage(e.target.value)}
                              placeholder="https://..."
                              className="flex-1 px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
                            />
                            <label className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-xs font-semibold cursor-pointer shrink-0 flex items-center gap-1.5">
                              <Upload className="w-3.5 h-3.5" />
                              <span>{isUploadingImage ? 'Enviando...' : 'Upload'}</span>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageFileChange}
                                className="hidden"
                              />
                            </label>
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-2">
                        <button
                          type="submit"
                          className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-md"
                        >
                          Salvar Produto
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Products Grid / Table */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {products.map((p) => (
                      <div
                        key={p.id}
                        className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={p.image_url}
                            alt={p.name}
                            className="w-14 h-14 rounded-xl object-cover bg-slate-900 border border-slate-800 shrink-0"
                          />
                          <div className="min-w-0">
                            <h5 className="text-xs font-bold text-white truncate">{p.name}</h5>
                            <span className="text-[10px] text-emerald-400 font-semibold">{p.category}</span>
                            <div className="flex items-center gap-2 text-[11px] mt-0.5">
                              <span className="font-bold text-white">
                                {p.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                              </span>
                              <span className="text-slate-500 font-medium">
                                Custo: R$ {(p.cost_price || p.suggested_cost_base || 0).toFixed(2)}
                              </span>
                              <span className="text-emerald-500 font-medium">
                                Margem: R$ {(p.profit_margin || Math.max(0, p.price - (p.cost_price || 0))).toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => handleEditClick(p)}
                            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
                            title="Editar produto"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => deleteProduct(p.id)}
                            className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition"
                            title="Excluir produto"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 3: VIRAL PRODUCT HUNTER */}
              {activeTab === 'viral_hunter' && (
                <div className="space-y-6">
                  {/* Explanatory Banner */}
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-teal-500/10 border border-amber-500/30 flex items-start gap-3">
                    <Flame className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-white">
                        Minerador de Produtos Virais (Shopee, Mercado Livre & TikTok Shop)
                      </h4>
                      <p className="text-xs text-slate-300 mt-0.5">
                        Digite uma palavra-chave para buscar achadinhos e tendências de alta conversão. O sistema extrai o título em português, foto real e preço de custo de fornecedores. Defina sua margem de lucro fixa e adicione à vitrine com 1 clique!
                      </p>
                    </div>
                  </div>

                  {viralSuccessMessage && (
                    <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-fadeIn">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>{viralSuccessMessage}</span>
                    </div>
                  )}

                  {/* Search and Margin controls */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-950 border border-slate-800">
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] text-slate-400 mb-1 font-semibold">
                        Palavra-chave ou Nicho Viral:
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={viralQuery}
                          onChange={(e) => setViralQuery(e.target.value)}
                          placeholder="Ex: garrafa térmica, fone, led, smartwatch, pet..."
                          className="flex-1 px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                        />
                        <button
                          type="button"
                          onClick={() => handleViralSearch(viralQuery)}
                          disabled={isSearchingViral}
                          className="px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-md shrink-0"
                        >
                          <Search className="w-3.5 h-3.5" />
                          <span>{isSearchingViral ? 'Minerando...' : 'Buscar Virais'}</span>
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1 font-semibold">
                        Margem de Lucro Fixa (R$):
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step="1.00"
                          value={profitMargin}
                          onChange={(e) => setProfitMargin(Number(e.target.value))}
                          placeholder="15.00"
                          className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white font-bold pl-8 focus:outline-none focus:border-emerald-500"
                        />
                        <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold">R$</span>
                      </div>
                      <p className="text-[10px] text-emerald-400 mt-1">Preço final = Custo + R$ {profitMargin.toFixed(2)}</p>
                    </div>
                  </div>

                  {/* Viral Candidate Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {viralResults.map((candidate) => {
                      const finalPrice = parseFloat((candidate.suggested_cost_base + profitMargin).toFixed(2));

                      return (
                        <div
                          key={candidate.id}
                          className="p-4 rounded-3xl bg-slate-950 border border-slate-800 hover:border-emerald-500/40 transition flex flex-col justify-between gap-4 group"
                        >
                          <div>
                            <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-slate-900 mb-3 border border-slate-800">
                              <img
                                src={candidate.image_url}
                                alt={candidate.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                              />
                              <div className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-full bg-slate-950/85 backdrop-blur-md border border-amber-500/40 text-amber-400 text-[10px] font-bold flex items-center gap-1">
                                <Flame className="w-3 h-3 fill-amber-400" />
                                <span>Score {candidate.virality_score}</span>
                              </div>
                              <div className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded-full bg-emerald-500 text-slate-950 text-[10px] font-extrabold shadow">
                                {candidate.source_platform}
                              </div>
                            </div>

                            <div className="flex items-center gap-2 text-[10px] font-semibold text-emerald-400 uppercase mb-1">
                              <span>{candidate.category}</span>
                              <span>•</span>
                              <span className="text-slate-400">{candidate.sales_velocity}</span>
                            </div>

                            <h5 className="font-bold text-sm text-white line-clamp-2 leading-snug mb-1">
                              {candidate.name}
                            </h5>

                            <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                              {candidate.description}
                            </p>
                          </div>

                          <div className="pt-3 border-t border-slate-800 space-y-3">
                            <div className="flex items-center justify-between text-xs">
                              <div>
                                <span className="text-[10px] text-slate-400 block">Custo Fornecedor:</span>
                                <strong className="text-slate-300">
                                  R$ {candidate.suggested_cost_base.toFixed(2)}
                                </strong>
                              </div>
                              <div className="text-right">
                                <span className="text-[10px] text-emerald-400 block">Preço Final na Vitrine:</span>
                                <strong className="text-base font-black text-white font-['Space_Grotesk']">
                                  R$ {finalPrice.toFixed(2)}
                                </strong>
                              </div>
                            </div>

                            <button
                              onClick={() => handleImportViralCandidate(candidate)}
                              className="w-full py-2.5 px-3 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-1.5 active:scale-95"
                            >
                              <Plus className="w-4 h-4" />
                              <span>Adicionar à Vitrine do Compraê (+R$ {profitMargin.toFixed(2)} lucro)</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 4: SOCIAL SETTINGS */}
              {activeTab === 'social' && (
                <form onSubmit={handleSaveSettings} className="space-y-4 max-w-xl">
                  {settingsSaved && (
                    <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Configurações salvas e sincronizadas no Firestore com sucesso!</span>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs text-slate-300 mb-1 font-semibold">
                      Handle Oficial InfinitePay
                    </label>
                    <input
                      type="text"
                      value={socialSettings.infinitepay_handle}
                      onChange={(e) => setSocialSettings({ ...socialSettings, infinitepay_handle: e.target.value })}
                      placeholder="$vendas_online2"
                      className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
                    />
                    <p className="text-[10px] text-slate-500 mt-1">Identificador exclusivo InfiniteTag da sua conta</p>
                  </div>

                  <div>
                    <label className="block text-xs text-slate-300 mb-1 font-semibold">
                      Chave Pix Real da Loja (E-mail, Telefone, CPF ou CNPJ)
                    </label>
                    <input
                      type="text"
                      value={socialSettings.pix_key || ''}
                      onChange={(e) => setSocialSettings({ ...socialSettings, pix_key: e.target.value })}
                      placeholder="jonasjessicalove@gmail.com"
                      className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
                    />
                    <p className="text-[10px] text-emerald-400 mt-1">Usada para gerar o QR Code oficial BACEN escaneável por qualquer banco</p>
                  </div>

                  <div>
                    <label className="block text-xs text-slate-300 mb-1 font-semibold">
                      Link de Pagamento Direto InfinitePay (Opcional)
                    </label>
                    <input
                      type="text"
                      value={socialSettings.infinitepay_payment_link || ''}
                      onChange={(e) => setSocialSettings({ ...socialSettings, infinitepay_payment_link: e.target.value })}
                      placeholder="https://infinitepay.io/pay/$vendas_online2"
                      className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
                    />
                    <p className="text-[10px] text-slate-500 mt-1">Link de cobrança gerado no seu app InfinitePay</p>
                  </div>

                  <div>
                    <label className="block text-xs text-slate-300 mb-1 font-semibold">
                      Instagram da Loja
                    </label>
                    <input
                      type="text"
                      value={socialSettings.instagram}
                      onChange={(e) => setSocialSettings({ ...socialSettings, instagram: e.target.value })}
                      placeholder="https://instagram.com/comprae.brasil"
                      className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-slate-300 mb-1 font-semibold">
                      TikTok da Loja
                    </label>
                    <input
                      type="text"
                      value={socialSettings.tiktok}
                      onChange={(e) => setSocialSettings({ ...socialSettings, tiktok: e.target.value })}
                      placeholder="https://tiktok.com/@comprae_oficial"
                      className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-slate-300 mb-1 font-semibold">
                      WhatsApp de Atendimento
                    </label>
                    <input
                      type="text"
                      value={socialSettings.whatsapp}
                      onChange={(e) => setSocialSettings({ ...socialSettings, whatsapp: e.target.value })}
                      placeholder="https://wa.me/5511999998888"
                      className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-slate-300 mb-1 font-semibold">
                      Barra de Anúncios no Topo do Site
                    </label>
                    <input
                      type="text"
                      value={socialSettings.banner_announcement}
                      onChange={(e) => setSocialSettings({ ...socialSettings, banner_announcement: e.target.value })}
                      placeholder="🔥 FRETE GRÁTIS EM COMPRAS ACIMA DE R$ 149..."
                      className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
                    />
                  </div>

                  <button
                    type="submit"
                    className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-md transition"
                  >
                    Salvar Alterações
                  </button>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
