import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc, updateDoc, collection, getDocs, writeBatch } from 'firebase/firestore';
import rawConfig from './firebase-applet-config.json' with { type: 'json' };
import { INITIAL_PRODUCTS } from './src/data/initialProducts';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isProd = process.env.NODE_ENV === 'production';
// Cloud Run/container proxies to port 3000; PORT env var might be 8080 for nginx
const PORT = 3000;

// Initialize Firebase for server-side persistence
const firebaseApp = !getApps().length ? initializeApp(rawConfig) : getApp();
const db = getFirestore(firebaseApp, rawConfig.firestoreDatabaseId || '(default)');

// Helper to sanitize handle
function cleanHandle(h?: string): string {
  const handle = h || process.env.INFINITEPAY_HANDLE || process.env.VITE_INFINITEPAY_HANDLE || 'vendas_online2';
  return handle.replace(/^[@$]/, '').trim();
}

async function startServer() {
  const app = express();
  app.use(express.json());

  // Health check
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  /**
   * 1. CREATE CHECKOUT LINK VIA OFFICIAL INFINITEPAY API
   * POST https://api.checkout.infinitepay.io/links
   */
  app.post('/api/infinitepay/create-checkout', async (req: Request, res: Response) => {
    try {
      const { orderId, items, shippingCost, shippingService, customer } = req.body;

      if (!orderId) {
        return res.status(400).json({ error: 'orderId é obrigatório' });
      }

      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: 'Nenhum item informado para o checkout' });
      }

      if (!customer || !customer.name || !customer.phone) {
        return res.status(400).json({ error: 'Nome e telefone do comprador são obrigatórios' });
      }

      // Compute official prices strictly on server
      const computedItems: Array<{ quantity: number; price: number; description: string }> = [];
      let totalCents = 0;

      for (const item of items) {
        const qty = Math.max(1, parseInt(item.quantity, 10) || 1);
        const catalogProd = INITIAL_PRODUCTS.find((p) => p.id === item.id);
        const unitPrice = catalogProd ? catalogProd.price : parseFloat(item.price) || 0;

        if (unitPrice <= 0) {
          return res.status(400).json({ error: `Preço inválido para o produto ${item.id}` });
        }

        const priceInCents = Math.round(unitPrice * 100);
        computedItems.push({
          quantity: qty,
          price: priceInCents,
          description: (item.name || catalogProd?.name || 'Produto Compraê').slice(0, 100)
        });

        totalCents += priceInCents * qty;
      }

      // Add shipping item if applicable
      const shippingCents = shippingCost ? Math.round(parseFloat(shippingCost) * 100) : 0;
      if (shippingCents > 0) {
        computedItems.push({
          quantity: 1,
          price: shippingCents,
          description: `Frete Correios (${shippingService || 'PAC'})`.slice(0, 100)
        });
        totalCents += shippingCents;
      }

      // Build Base URL
      const appUrl = (
        process.env.APP_URL ||
        `${req.protocol}://${req.get('host')}`
      ).replace(/\/$/, '');

      const handle = cleanHandle(process.env.INFINITEPAY_HANDLE);
      const redirectUrl = `${appUrl}/checkout/retorno?order_id=${encodeURIComponent(orderId)}`;
      const webhookUrl = `${appUrl}/api/webhooks/infinitepay`;

      let customerPhone = '';
      if (customer?.phone) {
        const rawDigits = customer.phone.replace(/\D/g, '');
        customerPhone = rawDigits.startsWith('55') ? `+${rawDigits}` : `+55${rawDigits}`;
      }

      const infinitePayPayload: Record<string, unknown> = {
        handle,
        order_nsu: orderId,
        redirect_url: redirectUrl,
        webhook_url: webhookUrl,
        items: computedItems
      };

      if (customer) {
        infinitePayPayload.customer = {
          name: customer.name,
          email: customer.email || undefined,
          phone_number: customerPhone || undefined
        };
      }

      if (customer?.address) {
        infinitePayPayload.address = {
          cep: customer.address.cep ? customer.address.cep.replace(/\D/g, '') : undefined,
          street: customer.address.street,
          number: customer.address.number || 'S/N',
          complement: customer.address.complement || undefined,
          neighborhood: customer.address.neighborhood,
          city: customer.address.city,
          state: customer.address.state
        };
      }

      console.log('[InfinitePay API] Creating link for order:', orderId, 'Amount (cents):', totalCents);

      const apiResponse = await fetch('https://api.checkout.infinitepay.io/links', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(infinitePayPayload)
      });

      const responseText = await apiResponse.text();
      let responseData: { url?: string; error?: string; message?: string } = {};

      try {
        responseData = JSON.parse(responseText);
      } catch {
        console.error('[InfinitePay API] Non-JSON response:', responseText);
      }

      if (!apiResponse.ok || !responseData.url) {
        console.error('[InfinitePay API] Error creating checkout:', apiResponse.status, responseText);
        return res.status(502).json({
          error: 'Falha ao gerar link de checkout oficial na InfinitePay',
          details: responseData.message || responseData.error || responseText,
          status: apiResponse.status
        });
      }

      const checkoutUrl = responseData.url;
      console.log('[InfinitePay API] Checkout generated successfully:', checkoutUrl);

      // Persist order in Firestore
      try {
        const orderRef = doc(db, 'orders', orderId);
        const orderSnap = await getDoc(orderRef);

        const orderData = {
          id: orderId,
          customer_name: customer.name,
          customer_phone: customer.phone,
          customer_email: customer.email || '',
          customer_cpf: customer.cpf || '',
          shipping_address: customer.address || {},
          shipping_service: shippingService || 'Correios PAC',
          shipping_cost: shippingCents / 100,
          items: items,
          subtotal: (totalCents - shippingCents) / 100,
          total: totalCents / 100,
          total_cents: totalCents,
          status: 'pending',
          payment_method: 'infinitepay_checkout',
          checkout_url: checkoutUrl,
          infinitepay_handle: `$${handle}`,
          updated_at: new Date().toISOString()
        };

        if (orderSnap.exists()) {
          await updateDoc(orderRef, orderData);
        } else {
          await setDoc(orderRef, {
            ...orderData,
            created_at: new Date().toISOString()
          });
        }
      } catch (dbErr) {
        console.warn('[Firestore] Notice updating order in database:', dbErr);
      }

      return res.json({
        success: true,
        checkout_url: checkoutUrl,
        order_id: orderId,
        total_cents: totalCents,
        handle: `$${handle}`
      });
    } catch (err: unknown) {
      console.error('[Server] Internal checkout creation error:', err);
      const msg = err instanceof Error ? err.message : String(err);
      return res.status(500).json({ error: 'Erro interno no servidor ao processar checkout', details: msg });
    }
  });

  /**
   * 2. CHECK PAYMENT STATUS VIA OFFICIAL INFINITEPAY API
   * POST https://api.checkout.infinitepay.io/payment_check
   */
  app.post('/api/infinitepay/check-payment', async (req: Request, res: Response) => {
    try {
      const { orderId, transaction_nsu, slug } = req.body;

      if (!orderId) {
        return res.status(400).json({ error: 'orderId é obrigatório' });
      }

      const handle = cleanHandle(process.env.INFINITEPAY_HANDLE);
      const checkPayload: Record<string, string> = {
        handle,
        order_nsu: orderId
      };

      if (transaction_nsu) checkPayload.transaction_nsu = String(transaction_nsu);
      if (slug) checkPayload.slug = String(slug);

      console.log('[InfinitePay API] Verifying payment for order:', orderId);

      const checkResponse = await fetch('https://api.checkout.infinitepay.io/payment_check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(checkPayload)
      });

      const checkData: {
        success?: boolean;
        paid?: boolean;
        amount?: number;
        paid_amount?: number;
        receipt_url?: string;
        capture_method?: string;
        transaction_nsu?: string;
      } = await checkResponse.json();

      console.log('[InfinitePay API] Check response:', checkData);

      // Verify legitimate payment confirmation
      const isPaid = Boolean(checkData.paid);
      if (isPaid) {
        try {
          const orderRef = doc(db, 'orders', orderId);
          await updateDoc(orderRef, {
            status: 'paid',
            receipt_url: checkData.receipt_url || null,
            capture_method: checkData.capture_method || null,
            transaction_nsu: checkData.transaction_nsu || transaction_nsu || null,
            paid_at: new Date().toISOString()
          });
        } catch (dbErr) {
          console.warn('[Firestore] Could not update order status to paid:', dbErr);
        }

        return res.json({
          success: true,
          paid: true,
          status: 'paid',
          receipt_url: checkData.receipt_url || null,
          capture_method: checkData.capture_method || null,
          amount: checkData.amount,
          paid_amount: checkData.paid_amount
        });
      }

      return res.json({
        success: true,
        paid: false,
        status: 'pending'
      });
    } catch (err: unknown) {
      console.error('[Server] Error checking payment:', err);
      const msg = err instanceof Error ? err.message : String(err);
      return res.status(500).json({ error: 'Erro ao consultar status no InfinitePay', details: msg });
    }
  });

  /**
   * 3. OFFICIAL INFINITEPAY WEBHOOK RECEIVER
   * Receives real-time payment notifications from InfinitePay
   */
  app.post('/api/webhooks/infinitepay', async (req: Request, res: Response) => {
    try {
      const payload = req.body;
      console.log('[InfinitePay Webhook] Event received:', JSON.stringify(payload));

      const orderNsu = payload.order_nsu;
      if (!orderNsu) {
        return res.status(400).json({ error: 'order_nsu ausente no payload do webhook' });
      }

      // Check order in Firestore
      const orderRef = doc(db, 'orders', orderNsu);
      const orderSnap = await getDoc(orderRef);

      if (!orderSnap.exists()) {
        console.warn('[InfinitePay Webhook] Order not found for order_nsu:', orderNsu);
        return res.status(404).json({ error: 'Pedido não localizado' });
      }

      const currentOrder = orderSnap.data();

      // Idempotency: if already marked as paid, return 200 immediately
      if (currentOrder.status === 'paid') {
        console.log('[InfinitePay Webhook] Order already marked as paid, skipping duplicated processing.');
        return res.status(200).json({ received: true, idempotent: true });
      }

      // Update order to paid
      await updateDoc(orderRef, {
        status: 'paid',
        transaction_nsu: payload.transaction_nsu || null,
        invoice_slug: payload.invoice_slug || null,
        receipt_url: payload.receipt_url || null,
        capture_method: payload.capture_method || null,
        paid_amount_cents: payload.paid_amount || payload.amount || null,
        paid_at: new Date().toISOString()
      });

      console.log(`[InfinitePay Webhook] Order ${orderNsu} successfully approved and updated in Firestore.`);
      return res.status(200).json({ received: true, success: true });
    } catch (err: unknown) {
      console.error('[InfinitePay Webhook] Error processing event:', err);
      return res.status(500).json({ error: 'Erro ao processar webhook' });
    }
  });

  /**
   * SI5 GLOBAL API & ADMIN ENDPOINTS
   */
  const SI5_BASE_URL = 'https://global.si5.com.br/api';

  async function checkAndUpdateQuota(): Promise<{ allowed: boolean; remaining: number; count: number }> {
    const todayStr = new Date().toISOString().slice(0, 10);
    const quotaRef = doc(db, 'api_usage_daily', todayStr);
    try {
      const snap = await getDoc(quotaRef);
      let count = 0;
      if (snap.exists()) {
        count = snap.data().external_calls || 0;
      }
      const limit = 100;
      if (count >= limit) {
        return { allowed: false, remaining: 0, count };
      }
      return { allowed: true, remaining: limit - count, count };
    } catch (err) {
      console.warn('[SI5 Quota] Error checking quota:', err);
      return { allowed: true, remaining: 100, count: 0 };
    }
  }

  async function incrementQuota() {
    const todayStr = new Date().toISOString().slice(0, 10);
    const quotaRef = doc(db, 'api_usage_daily', todayStr);
    try {
      const snap = await getDoc(quotaRef);
      if (snap.exists()) {
        const current = snap.data().external_calls || 0;
        await updateDoc(quotaRef, {
          external_calls: current + 1,
          last_query_at: new Date().toISOString()
        });
      } else {
        await setDoc(quotaRef, {
          date: todayStr,
          external_calls: 1,
          cache_hits: 0,
          last_query_at: new Date().toISOString()
        });
      }
    } catch (err) {
      console.warn('[SI5 Quota] Error incrementing quota:', err);
    }
  }

  async function incrementCacheHits() {
    const todayStr = new Date().toISOString().slice(0, 10);
    const quotaRef = doc(db, 'api_usage_daily', todayStr);
    try {
      const snap = await getDoc(quotaRef);
      if (snap.exists()) {
        const currentHits = snap.data().cache_hits || 0;
        await updateDoc(quotaRef, { cache_hits: currentHits + 1 });
      } else {
        await setDoc(quotaRef, {
          date: todayStr,
          external_calls: 0,
          cache_hits: 1,
          last_query_at: new Date().toISOString()
        });
      }
    } catch (err) {
      console.warn('[SI5 Quota] Error incrementing cache hits:', err);
    }
  }

  app.get('/api/si5/search', async (req: Request, res: Response) => {
    try {
      const q = (req.query.q as string) || '';
      const page = parseInt((req.query.page as string) || '1', 10);
      const per_page = parseInt((req.query.per_page as string) || '20', 10);
      const cacheKey = `search_${q.toLowerCase().trim()}_p${page}_pp${per_page}`;

      const cacheRef = doc(db, 'product_api_cache', cacheKey);
      const cacheSnap = await getDoc(cacheRef);
      const now = Date.now();
      if (cacheSnap.exists()) {
        const cacheData = cacheSnap.data();
        const cachedAt = new Date(cacheData.cached_at || 0).getTime();
        if (now - cachedAt < 24 * 60 * 60 * 1000) {
          await incrementCacheHits();
          return res.json({
            source: 'cache',
            products: cacheData.products || [],
            total: cacheData.total || 0,
            page,
            per_page
          });
        }
      }

      const quotaCheck = await checkAndUpdateQuota();
      if (!quotaCheck.allowed) {
        if (cacheSnap.exists()) {
          await incrementCacheHits();
          return res.json({
            source: 'cache_expired_quota_exceeded',
            warning: 'Limite diário de 100 consultas atingido. Exibindo dados em cache.',
            products: cacheSnap.data().products || [],
            total: cacheSnap.data().total || 0
          });
        }
        return res.status(429).json({
          error: 'Limite diário de 100 consultas à API SI5 Global atingido (429).'
        });
      }

      const si5Token = process.env.SI5_TOKEN;
      if (!si5Token) {
        return res.status(500).json({ error: 'Token SI5_TOKEN não configurado no backend.' });
      }

      const targetUrl = `${SI5_BASE_URL}/produtos?q=${encodeURIComponent(q)}&per_page=${per_page}&page=${page}`;
      const si5Res = await fetch(targetUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${si5Token}`,
          'Accept': 'application/json'
        }
      });

      if (si5Res.status === 429) {
        await incrementQuota();
        if (cacheSnap.exists()) {
          return res.json({ source: 'cache_fallback_429', products: cacheSnap.data().products || [] });
        }
        return res.status(429).json({ error: 'API SI5 retornou limite excedido (429).' });
      }

      if (!si5Res.ok) {
        const errText = await si5Res.text().catch(() => '');
        if (cacheSnap.exists()) {
          return res.json({ source: 'cache_fallback_error', products: cacheSnap.data().products || [] });
        }
        return res.status(si5Res.status).json({ error: `Erro ao consultar API SI5 (HTTP ${si5Res.status})`, details: errText });
      }

      const si5Json = await si5Res.json();
      await incrementQuota();

      const rawList = Array.isArray(si5Json) ? si5Json : si5Json.produtos || si5Json.data || [];
      const normalizedProducts = rawList.map((item: any) => {
        const precoMedio = parseFloat(item.preco_medio || item.preco || item.valor || 0);
        const hasConfirmedPrice = precoMedio > 0;
        const confirmed = hasConfirmedPrice ? precoMedio : 0;
        const estimated = hasConfirmedPrice ? precoMedio : (item.peso ? Math.round((item.peso / 1000) * 25 * 100) / 100 : 19.90);

        return {
          id: item.codbar || item.id || `si5_${Math.random().toString(36).slice(2, 9)}`,
          codbar: item.codbar || '',
          name: item.produto || item.name || 'Produto SI5',
          description: item.ingredientes || item.descricao || item.description || 'Produto importado via SI5 Global.',
          category: item.categoria || item.category || 'Geral',
          brand: item.marca || item.brand || 'SI5 Global',
          image_url: item.imagem_url || item.image || item.imagem || '',
          peso: item.peso || 0,
          ncm: item.ncm || '',
          cest_codigo: item.cest_codigo || '',
          ingredientes: item.ingredientes || '',
          alergenos: item.alergenos || '',
          nutrientes: item.nutrientes || '',
          preco_estimado: estimated,
          preco_confirmado: confirmed > 0 ? confirmed : null,
          tipo_preco: confirmed > 0 ? 'confirmado' : 'estimado',
          price: confirmed > 0 ? confirmed : estimated,
          preco_venda: confirmed > 0 ? confirmed : estimated,
          fonte_preco: confirmed > 0 ? 'SI5 Global (Preço Médio)' : 'Estimativa Automática Compraê',
          preco_verificado_em: new Date().toISOString(),
          moeda: 'BRL',
          stock: 100,
          created_at: new Date().toISOString()
        };
      });

      const responsePayload = {
        source: 'api',
        products: normalizedProducts,
        total: si5Json.total || normalizedProducts.length,
        page,
        per_page
      };

      await setDoc(cacheRef, {
        cacheKey,
        products: normalizedProducts,
        total: responsePayload.total,
        cached_at: new Date().toISOString()
      });

      return res.json(responsePayload);
    } catch (err: unknown) {
      return res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
    }
  });

  app.get('/api/si5/product/:codbar', async (req: Request, res: Response) => {
    try {
      const { codbar } = req.params;
      const cacheKey = `product_${codbar}`;
      const cacheRef = doc(db, 'product_api_cache', cacheKey);
      const cacheSnap = await getDoc(cacheRef);
      const now = Date.now();

      if (cacheSnap.exists()) {
        const data = cacheSnap.data();
        if (now - new Date(data.cached_at || 0).getTime() < 24 * 60 * 60 * 1000) {
          await incrementCacheHits();
          return res.json({ source: 'cache', product: data.product });
        }
      }

      const quotaCheck = await checkAndUpdateQuota();
      if (!quotaCheck.allowed) {
        if (cacheSnap.exists()) {
          await incrementCacheHits();
          return res.json({ source: 'cache_expired', product: cacheSnap.data().product });
        }
        return res.status(429).json({ error: 'Limite diário de 100 consultas excedido.' });
      }

      const si5Token = process.env.SI5_TOKEN;
      if (!si5Token) {
        return res.status(500).json({ error: 'Token SI5_TOKEN não configurado.' });
      }

      const si5Res = await fetch(`${SI5_BASE_URL}/produtos/${codbar}`, {
        headers: {
          'Authorization': `Bearer ${si5Token}`,
          'Accept': 'application/json'
        }
      });

      if (!si5Res.ok) {
        if (cacheSnap.exists()) {
          return res.json({ source: 'cache_fallback', product: cacheSnap.data().product });
        }
        return res.status(si5Res.status).json({ error: `Produto não encontrado na SI5 (HTTP ${si5Res.status})` });
      }

      const item = await si5Res.json();
      await incrementQuota();

      const precoMedio = parseFloat(item.preco_medio || item.preco || 0);
      const hasConfirmed = precoMedio > 0;
      const product = {
        id: item.codbar || codbar,
        codbar: item.codbar || codbar,
        name: item.produto || item.name || 'Produto',
        description: item.ingredientes || item.descricao || 'Detalhes do produto SI5',
        category: item.categoria || 'Geral',
        brand: item.marca || 'SI5 Global',
        image_url: item.imagem_url || item.image || '',
        peso: item.peso || 0,
        ncm: item.ncm || '',
        cest_codigo: item.cest_codigo || '',
        ingredientes: item.ingredientes || '',
        alergenos: item.alergenos || '',
        nutrientes: item.nutrientes || '',
        preco_estimado: hasConfirmed ? precoMedio : 19.90,
        preco_confirmado: hasConfirmed ? precoMedio : null,
        tipo_preco: hasConfirmed ? 'confirmado' : 'estimado',
        price: hasConfirmed ? precoMedio : 19.90,
        preco_venda: hasConfirmed ? precoMedio : 19.90,
        moeda: 'BRL',
        stock: 100,
        created_at: new Date().toISOString()
      };

      await setDoc(cacheRef, { product, cached_at: new Date().toISOString() });
      return res.json({ source: 'api', product });
    } catch (err: unknown) {
      return res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
    }
  });

  app.post('/api/admin/select-product', async (req: Request, res: Response) => {
    try {
      const product = req.body;
      if (!product || !product.id) {
        return res.status(400).json({ error: 'Dados do produto inválidos' });
      }
      const ref = doc(db, 'produtos_selecionados_admin', String(product.id));
      await setDoc(ref, { ...product, updated_at: new Date().toISOString() }, { merge: true });
      return res.json({ success: true, product });
    } catch (err: unknown) {
      return res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
    }
  });

  app.post('/api/admin/publish-showcase', async (req: Request, res: Response) => {
    try {
      const { products } = req.body;
      if (!products || !Array.isArray(products)) {
        return res.status(400).json({ error: 'Lista de produtos inválida' });
      }
      if (products.length > 50) {
        return res.status(400).json({ error: 'A vitrine suporta no máximo 50 produtos.' });
      }

      for (const p of products) {
        if (!p.name || typeof p.price !== 'number' || p.price <= 0) {
          return res.status(400).json({ error: `Produto ${p.name || p.id} possui preço de venda inválido.` });
        }
      }

      const vitrineRef = collection(db, 'produtos_vitrine');
      const existingSnap = await getDocs(vitrineRef);
      const batch = writeBatch(db);

      existingSnap.docs.forEach((d) => batch.delete(d.ref));

      for (const p of products) {
        const newRef = doc(db, 'produtos_vitrine', String(p.id || Math.random()));
        batch.set(newRef, { ...p, published_at: new Date().toISOString() });
      }

      const versionId = `v_${Date.now()}`;
      const versionRef = doc(db, 'store_publication_versions', versionId);
      batch.set(versionRef, { version_id: versionId, count: products.length, published_at: new Date().toISOString() });

      await batch.commit();
      return res.json({ success: true, published_count: products.length, version_id: versionId });
    } catch (err: unknown) {
      return res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
    }
  });

  app.get('/api/admin/metrics', async (_req: Request, res: Response) => {
    try {
      const todayStr = new Date().toISOString().slice(0, 10);
      const quotaRef = doc(db, 'api_usage_daily', todayStr);
      const quotaSnap = await getDoc(quotaRef);

      let externalCalls = 0;
      let cacheHits = 0;
      let lastQueryAt = null;

      if (quotaSnap.exists()) {
        const data = quotaSnap.data();
        externalCalls = data.external_calls || 0;
        cacheHits = data.cache_hits || 0;
        lastQueryAt = data.last_query_at || null;
      }

      const vitrineSnap = await getDocs(collection(db, 'produtos_vitrine'));
      let withoutImage = 0;
      let withoutConfirmedPrice = 0;

      vitrineSnap.docs.forEach((d) => {
        const p = d.data();
        if (!p.image_url) withoutImage++;
        if (p.tipo_preco !== 'confirmado') withoutConfirmedPrice++;
      });

      return res.json({
        date: todayStr,
        external_calls: externalCalls,
        cache_hits: cacheHits,
        quota_limit: 100,
        quota_remaining: Math.max(0, 100 - externalCalls),
        last_query_at: lastQueryAt,
        products_without_image: withoutImage,
        products_without_confirmed_price: withoutConfirmedPrice,
        api_status: process.env.SI5_TOKEN ? 'online_configured' : 'token_missing'
      });
    } catch (err: unknown) {
      return res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
    }
  });

  // Setup Vite in development or static serving in production
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
    app.use('*', async (req: Request, res: Response, next) => {
      const url = req.originalUrl;
      try {
        let template = fs.readFileSync(path.resolve(__dirname, 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist/index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] Compraê running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[Server] Fatal startup error:', err);
  process.exit(1);
});
