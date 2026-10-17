# 🛍️ Compraê - E-commerce Brasileiro de Produtos Virais

**Compraê** é uma plataforma moderna e completa de e-commerce brasileiro focada em produtos virais ("achadinhos"), desenvolvida com **Next.js / React 19 + TypeScript**, **Tailwind CSS**, animações com **Framer Motion**, banco de dados em tempo real no **Firebase (Firestore & Auth)**, uploads de imagens via **Vercel Blob**, cálculo automático de frete dos **Correios (PAC & SEDEX via CEP)** e checkout integrado com **InfinitePay** (handle: `$vendas_online2`).

---

## 🚀 Funcionalidades Principais

### 🛒 Loja & Experiência do Cliente
- **Hero Section com Parallax Real:** Efeito de profundidade e movimento com scroll suave e badges dinâmicos de tendência.
- **Catálogo Inteligente:** Filtros por categorias (*Tech & Gadgets, Office & Organization, Beauty & Health, Pet Supplies, Accessories, Home & Kitchen, Kids & Toys*).
- **12 Produtos Iniciais Pré-Cadastrados:** Incluindo fones TWS com cancelamento de ruído, organizadores modulares, máscaras coreanas de skincare, dispensers pets, papetes birken, mini processadores, suportes 360°, luminárias recarregáveis, etc.
- **Página / Modal de Produto:** Galeria de fotos em alta resolução, seletor de quantidade e **calculadora de frete interativa dos Correios**.
- **Carrinho Persistente:** Sincronizado no `localStorage` e integrado ao Firestore com barra de progresso para Frete Grátis (acima de R$ 149,00).
- **Cálculo de Frete Correios em Tempo Real:**
  - Consulta automática de endereço via **ViaCEP** (preenche rua, bairro, cidade e estado a partir do CEP).
  - Cálculo de cotação e prazos de entrega para **PAC** e **SEDEX** com matriz regional dos Correios.
- **Checkout Seguro Completo:**
  - Nome completo e Telefone com DDD obrigatórios (com máscara automática).
  - **Integração Real InfinitePay ($vendas_online2):**
    - **Pix InfinitePay Instantâneo:** Geração de QR Code e chave Pix Copia e Cola.
    - **Cartão de Crédito InfinitePay:** Parcelamento em até 12x via link direto e seguro.
  - Tela de comemoração com chuva de confetes (`canvas-confetti`) e resumo do pedido.
- **Rodapé Profissional:** Redes sociais dinâmicas, dados de CNPJ, canais de atendimento e selos de segurança.

---

### 🛡️ Painel Administrativo (/admin)
- **Credenciais de Acesso Fixo:**
  - **E-mail:** `patricia@x.com`
  - **Senha:** `patricia4321`
- **Dashboard de Métricas:**
  - Faturamento total em tempo real, pedidos recebidos, ticket médio e produtos ativos.
  - Gestão de status de pedidos: *Pendente*, *Pago*, *Enviado*, *Entregue* e *Cancelado*.
- **CRUD Completo de Produtos:**
  - Adicionar, editar, alterar preços, estoque e excluir produtos.
  - Upload de imagens integrado ao **Vercel Blob** com fallback seguro.
- **Buscador & Minerador de Produtos Virais:**
  - Pesquisa produtos em alta nas redes e marketplaces públicos (*TikTok Shop, Shopee, Mercado Livre, AliExpress*).
  - Extração automática de nome em português, descrição persuasiva, foto real e preço de custo de fornecedor.
  - Configuração de **Margem de Lucro Fixa** (ex: `+R$ 15,00` ou personalizada).
  - Importação para a vitrine com 1 clique (preço de venda = custo + margem).
- **Gestão de Redes Sociais & Avisos:**
  - Configuração em tempo real de Instagram, TikTok, WhatsApp, Facebook e YouTube, além da barra de avisos no topo do site.

---

## 🛠️ Stack Tecnológica

| Camada | Tecnologia |
|---|---|
| **Frontend** | React 19 / TypeScript, Motion (Framer Motion) |
| **Estilização** | Tailwind CSS v4 |
| **Banco de Dados** | Firebase Firestore (com `firestore.rules` ABAC e blueprint) |
| **Autenticação** | Firebase Auth |
| **Armazenamento de Mídia** | Vercel Blob (`@vercel/blob`) |
| **Pagamentos** | InfinitePay Oficial (`$vendas_online2`) |
| **Logística & Frete** | Correios PAC & SEDEX + ViaCEP API |

---

## ⚙️ Configuração e Variáveis de Ambiente

Copie o arquivo `.env.example` para `.env`:

```bash
cp .env.example .env
```

### Variáveis Disponíveis:

```env
# Configurações do Firebase (já injetadas automaticamente no AI Studio via firebase-applet-config.json)
VITE_FIREBASE_API_KEY="sua_api_key"
VITE_FIREBASE_AUTH_DOMAIN="seu-projeto.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="seu-projeto-id"
VITE_FIREBASE_STORAGE_BUCKET="seu-projeto.firebasestorage.app"
VITE_FIREBASE_MESSAGING_SENDER_ID="seu_sender_id"
VITE_FIREBASE_APP_ID="seu_app_id"
VITE_FIREBASE_DATABASE_ID="seu_database_id"

# Vercel Blob (para upload de imagens no painel de controle)
BLOB_READ_WRITE_TOKEN="vercel_blob_rw_xxxxxxxxxxxxxxxxxxxxxxxxxx"

# InfinitePay Merchant Handle
VITE_INFINITEPAY_HANDLE="$vendas_online2"

# Credenciais Admin
VITE_ADMIN_EMAIL="patricia@x.com"
VITE_ADMIN_PASSWORD="patricia4321"
```

---

## 📦 Como Configurar o Vercel Blob

1. Crie uma conta ou faça login na [Vercel](https://vercel.com).
2. Acesse o seu painel de controle e vá em **Storage** > **Create Database** > selecione **Blob**.
3. Dê um nome ao seu store (ex: `comprae-storage`) e clique em **Create**.
4. Copie o token `BLOB_READ_WRITE_TOKEN` gerado.
5. Adicione nas variáveis de ambiente na Vercel e no seu arquivo `.env`.

---

## 🔥 Como Configurar o Firebase

1. Acesse o [Firebase Console](https://console.firebase.google.com).
2. Crie um novo projeto (ou utilize o provisionado automaticamente no ambiente).
3. Em **Build**, ative o **Firestore Database** e o **Authentication** (Google Login ou Email/Senha).
4. No menu de Configurações do Projeto (ícone de engrenagem), crie um aplicativo Web para obter suas credenciais.
5. As regras de segurança de produção já estão definidas no arquivo `firestore.rules` e no `firebase-blueprint.json`.

---

## 🚀 Instruções de Deploy na Vercel

1. Suba o código para o seu repositório Git (GitHub/GitLab).
2. Na Vercel, clique em **Add New...** > **Project** e importe o repositório.
3. Configure as variáveis de ambiente em **Environment Variables**:
   - `BLOB_READ_WRITE_TOKEN`
   - Credenciais do Firebase (`VITE_FIREBASE_*`)
   - `VITE_INFINITEPAY_HANDLE` (`$vendas_online2`)
4. Clique em **Deploy**. A loja estará no ar em poucos segundos!

---

## 👩‍💻 Equipe Compraê
Desenvolvido com foco em alta conversão, performance mobile e experiência de compra fluida para o mercado brasileiro.
