import React from 'react';
import {
  Instagram,
  MessageCircle,
  Video,
  Facebook,
  Youtube,
  ShieldCheck,
  Truck,
  CreditCard,
  Lock,
  Sparkles,
  HelpCircle,
  Mail,
  Phone
} from 'lucide-react';
import { useStore } from '../context/StoreContext';

export const Footer: React.FC<{ onOpenAdmin: () => void }> = ({ onOpenAdmin }) => {
  const { settings } = useStore();

  return (
    <footer className="w-full bg-slate-950 border-t border-slate-800 text-slate-400 text-xs mt-20">
      {/* Trust & Guarantee strip */}
      <div className="border-b border-slate-800/80 bg-slate-900/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-white text-sm">Entrega Oficial Correios</p>
              <p className="text-[11px] text-slate-400">Rastreio ponto a ponto via PAC e SEDEX</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-white text-sm">InfinitePay Blindado</p>
              <p className="text-[11px] text-slate-400">Tag oficial {settings.infinitepay_handle || '$vendas_online2'}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-white text-sm">Certificado SSL 256-bit</p>
              <p className="text-[11px] text-slate-400">Dados cadastrais 100% criptografados</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-white text-sm">Garantia de 7 Dias</p>
              <p className="text-[11px] text-slate-400">Satisfação ou seu dinheiro de volta</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Info */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-black text-sm">
                CÊ
              </div>
              <span className="text-xl font-black text-white font-['Space_Grotesk']">
                Compra<span className="text-emerald-400">ê</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              O seu destino número #1 no Brasil para produtos virais, gadgets inteligentes e achadinhos práticos com o melhor custo-benefício.
            </p>

            {/* Social Media Links (Configured via Admin) */}
            <div className="pt-2">
              <p className="text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-2">
                Siga Nossas Redes
              </p>
              <div className="flex items-center gap-2.5">
                {settings.instagram && (
                  <a
                    href={settings.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-emerald-400 hover:border-emerald-500/40 transition"
                    title="Instagram"
                  >
                    <Instagram className="w-4 h-4" />
                  </a>
                )}
                {settings.tiktok && (
                  <a
                    href={settings.tiktok}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-emerald-400 hover:border-emerald-500/40 transition"
                    title="TikTok"
                  >
                    <Video className="w-4 h-4" />
                  </a>
                )}
                {settings.whatsapp && (
                  <a
                    href={settings.whatsapp}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-emerald-400 hover:border-emerald-500/40 transition"
                    title="WhatsApp"
                  >
                    <MessageCircle className="w-4 h-4" />
                  </a>
                )}
                {settings.facebook && (
                  <a
                    href={settings.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-emerald-400 hover:border-emerald-500/40 transition"
                    title="Facebook"
                  >
                    <Facebook className="w-4 h-4" />
                  </a>
                )}
                {settings.youtube && (
                  <a
                    href={settings.youtube}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-emerald-400 hover:border-emerald-500/40 transition"
                    title="YouTube"
                  >
                    <Youtube className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">
              Categorias Populares
            </h4>
            <ul className="space-y-2 text-xs">
              <li><a href="#" className="hover:text-emerald-400 transition">Tech & Gadgets</a></li>
              <li><a href="#" className="hover:text-emerald-400 transition">Office & Organização</a></li>
              <li><a href="#" className="hover:text-emerald-400 transition">Beleza & Skincare Coreano</a></li>
              <li><a href="#" className="hover:text-emerald-400 transition">Pet Supplies & Enriquecimento</a></li>
              <li><a href="#" className="hover:text-emerald-400 transition">Casa & Cozinha Inteligente</a></li>
            </ul>
          </div>

          {/* Customer Service & Policies */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">
              Atendimento & Ajuda
            </h4>
            <ul className="space-y-2 text-xs">
              <li className="flex items-center gap-1.5 text-slate-300">
                <Mail className="w-3.5 h-3.5 text-emerald-400" />
                <span>suporte@comprae.com.br</span>
              </li>
              <li className="flex items-center gap-1.5 text-slate-300">
                <Phone className="w-3.5 h-3.5 text-emerald-400" />
                <span>Segunda a Sexta: 09h às 18h</span>
              </li>
              <li><a href="#" className="hover:text-emerald-400 transition">Política de Envio e Correios</a></li>
              <li><a href="#" className="hover:text-emerald-400 transition">Trocas e Devoluções (CDC)</a></li>
              <li><a href="#" className="hover:text-emerald-400 transition">Termos de Serviço & Privacidade</a></li>
            </ul>
          </div>

          {/* Payment & Security Badges */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Formas de Pagamento
            </h4>
            <p className="text-[11px] text-slate-400">
              Pagamentos processados com tecnologia bancária InfinitePay:
            </p>
            <div className="flex flex-wrap gap-2 text-[10px] font-bold text-slate-300">
              <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 flex items-center gap-1 text-emerald-400">
                ⚡ Pix (Aprovação Imediata)
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800">
                💳 Cartão até 12x
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-teal-400">
                InfinitePay Oficial
              </span>
            </div>

            <div className="pt-2">
              <button
                onClick={onOpenAdmin}
                className="text-[11px] text-slate-500 hover:text-slate-300 underline transition"
              >
                Acesso Restrito ao Painel Admin
              </button>
            </div>
          </div>
        </div>

        {/* Legal Notice */}
        <div className="mt-12 pt-8 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} Compraê E-commerce Ltda. CNPJ: 45.892.103/0001-44. Todos os direitos reservados.</p>
          <div className="flex items-center gap-3">
            <span>Envios diários via Correios</span>
            <span>•</span>
            <span className="text-emerald-400 font-semibold">Tecnologia InfinitePay</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
