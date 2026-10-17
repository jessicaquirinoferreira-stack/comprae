/**
 * InfinitePay Payment Client Module
 * Communicates with backend endpoints (/api/infinitepay/*) and
 * official InfinitePay Checkout API (https://api.checkout.infinitepay.io/links).
 *
 * Official Documentation: https://www.infinitepay.io/checkout-documentacao
 */

import { doc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';

export interface CreateCheckoutParams {
  orderId: string;
  items: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
  }>;
  shippingService: string;
  shippingCost: number;
  customer: {
    name: string;
    phone: string;
    email?: string;
    cpf?: string;
    address: {
      cep: string;
      street: string;
      number: string;
      complement?: string;
      neighborhood: string;
      city: string;
      state: string;
    };
  };
}

export interface CreateCheckoutResult {
  success: boolean;
  checkout_url: string;
  order_id: string;
  total_cents: number;
  handle: string;
}

export interface CheckPaymentResult {
  success: boolean;
  paid: boolean;
  status: 'paid' | 'pending' | 'failed';
  receipt_url?: string;
  capture_method?: string;
  amount?: number;
  paid_amount?: number;
  transaction_nsu?: string;
}

export function cleanInfinitePayHandle(handle?: string): string {
  const h = handle || import.meta.env.VITE_INFINITEPAY_HANDLE || 'vendas_online2';
  return h.replace(/^[@$]/, '').trim();
}

/**
 * Creates official checkout link via backend proxy or directly via InfinitePay Checkout API
 * Endpoint: POST https://api.checkout.infinitepay.io/links
 */
export async function createRealInfinitePayCheckout(
  params: CreateCheckoutParams
): Promise<CreateCheckoutResult> {
  const handle = cleanInfinitePayHandle();

  // Compute items & total in cents
  const computedItems: Array<{ quantity: number; price: number; description: string }> = [];
  let totalCents = 0;

  for (const item of params.items) {
    const qty = Math.max(1, parseInt(String(item.quantity), 10) || 1);
    const unitPrice = parseFloat(String(item.price)) || 0;
    const priceInCents = Math.round(unitPrice * 100);

    computedItems.push({
      quantity: qty,
      price: priceInCents,
      description: item.name.slice(0, 100)
    });
    totalCents += priceInCents * qty;
  }

  if (params.shippingCost && params.shippingCost > 0) {
    const shippingCents = Math.round(params.shippingCost * 100);
    computedItems.push({
      quantity: 1,
      price: shippingCents,
      description: `Frete Correios (${params.shippingService || 'PAC'})`.slice(0, 100)
    });
    totalCents += shippingCents;
  }

  // Format phone to international format: +55...
  let formattedPhone = '';
  if (params.customer?.phone) {
    const raw = params.customer.phone.replace(/\D/g, '');
    formattedPhone = raw.startsWith('55') ? `+${raw}` : `+55${raw}`;
  }

  const appOrigin = window.location.origin.replace(/\/$/, '');
  const redirectUrl = `${appOrigin}/checkout/retorno?order_id=${encodeURIComponent(params.orderId)}`;
  const webhookUrl = `${appOrigin}/api/webhooks/infinitepay`;

  let checkoutUrl: string | null = null;

  // 1. First attempt: call local server proxy route
  try {
    const response = await fetch('/api/infinitepay/create-checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(params)
    });

    if (response.ok) {
      const data: CreateCheckoutResult = await response.json();
      if (data?.checkout_url) {
        checkoutUrl = data.checkout_url;
      }
    } else {
      console.warn('[InfinitePay] Local server proxy returned HTTP', response.status);
    }
  } catch (backendErr) {
    console.warn('[InfinitePay] Local backend proxy unreachable, falling back to direct API:', backendErr);
  }

  // 2. Direct fallback to official InfinitePay API (has Access-Control-Allow-Origin: *)
  if (!checkoutUrl) {
    const directPayload: Record<string, unknown> = {
      handle,
      order_nsu: params.orderId,
      redirect_url: redirectUrl,
      webhook_url: webhookUrl,
      items: computedItems
    };

    if (params.customer) {
      directPayload.customer = {
        name: params.customer.name,
        email: params.customer.email || undefined,
        phone_number: formattedPhone || undefined
      };
    }

    if (params.customer?.address) {
      directPayload.address = {
        cep: params.customer.address.cep ? params.customer.address.cep.replace(/\D/g, '') : undefined,
        street: params.customer.address.street,
        number: params.customer.address.number || 'S/N',
        complement: params.customer.address.complement || undefined,
        neighborhood: params.customer.address.neighborhood,
        city: params.customer.address.city,
        state: params.customer.address.state
      };
    }

    console.log('[InfinitePay Client] Calling official API with payload:', directPayload);

    const directResponse = await fetch('https://api.checkout.infinitepay.io/links', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(directPayload)
    });

    if (!directResponse.ok) {
      const errorText = await directResponse.text().catch(() => '');
      throw new Error(`Falha na API oficial da InfinitePay (HTTP ${directResponse.status}): ${errorText || 'Erro ao gerar checkout'}`);
    }

    const directData = await directResponse.json();
    if (!directData?.url) {
      throw new Error('A InfinitePay não retornou a URL de checkout.');
    }
    checkoutUrl = directData.url;
  }

  // Persist order in Firestore
  try {
    const orderRef = doc(db, 'orders', params.orderId);
    await setDoc(
      orderRef,
      {
        id: params.orderId,
        customer_name: params.customer.name,
        customer_phone: params.customer.phone,
        customer_email: params.customer.email || '',
        customer_cpf: params.customer.cpf || '',
        shipping_address: params.customer.address,
        shipping_service: params.shippingService || 'Correios PAC',
        shipping_cost: params.shippingCost,
        items: params.items,
        total: totalCents / 100,
        total_cents: totalCents,
        status: 'pending',
        payment_method: 'infinitepay_checkout',
        checkout_url: checkoutUrl,
        infinitepay_handle: `$${handle}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      { merge: true }
    );
  } catch (firestoreErr) {
    console.warn('[Firestore] Could not save initial order record:', firestoreErr);
  }

  if (!checkoutUrl) {
    throw new Error('Não foi possível obter o link de checkout da InfinitePay.');
  }

  return {
    success: true,
    checkout_url: checkoutUrl,
    order_id: params.orderId,
    total_cents: totalCents,
    handle: `$${handle}`
  };
}

/**
 * Checks authentic payment status with the official InfinitePay API
 * Endpoint: POST https://api.checkout.infinitepay.io/payment_check
 */
export async function checkRealInfinitePayPayment(
  orderId: string,
  transactionNsu?: string,
  slug?: string
): Promise<CheckPaymentResult> {
  const handle = cleanInfinitePayHandle();

  // 1. Try local server endpoint first
  try {
    const response = await fetch('/api/infinitepay/check-payment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        orderId,
        transaction_nsu: transactionNsu,
        slug
      })
    });

    if (response.ok) {
      const data: CheckPaymentResult = await response.json();
      if (data.paid) {
        // Ensure firestore is in sync
        try {
          const orderRef = doc(db, 'orders', orderId);
          await updateDoc(orderRef, {
            status: 'paid',
            receipt_url: data.receipt_url || null,
            capture_method: data.capture_method || null,
            transaction_nsu: data.transaction_nsu || transactionNsu || null,
            paid_at: new Date().toISOString()
          });
        } catch (dbErr) {
          console.warn('[Firestore] Status update notice:', dbErr);
        }
      }
      return data;
    }
  } catch (proxyErr) {
    console.warn('[InfinitePay Check] Backend proxy check failed, testing direct API:', proxyErr);
  }

  // 2. Direct check to official InfinitePay endpoint
  const checkPayload: Record<string, string> = {
    handle,
    order_nsu: orderId
  };
  if (transactionNsu) checkPayload.transaction_nsu = String(transactionNsu);
  if (slug) checkPayload.slug = String(slug);

  const directResponse = await fetch('https://api.checkout.infinitepay.io/payment_check', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify(checkPayload)
  });

  if (!directResponse.ok) {
    return {
      success: false,
      paid: false,
      status: 'pending'
    };
  }

  const checkData: {
    success?: boolean;
    paid?: boolean;
    amount?: number;
    paid_amount?: number;
    receipt_url?: string;
    capture_method?: string;
    transaction_nsu?: string;
  } = await directResponse.json();

  const isPaid = Boolean(checkData.paid);

  if (isPaid) {
    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, {
        status: 'paid',
        receipt_url: checkData.receipt_url || null,
        capture_method: checkData.capture_method || null,
        transaction_nsu: checkData.transaction_nsu || transactionNsu || null,
        paid_at: new Date().toISOString()
      });
    } catch (dbErr) {
      console.warn('[Firestore] Could not mark order as paid directly:', dbErr);
    }

    return {
      success: true,
      paid: true,
      status: 'paid',
      receipt_url: checkData.receipt_url,
      capture_method: checkData.capture_method,
      transaction_nsu: checkData.transaction_nsu || transactionNsu,
      amount: checkData.amount,
      paid_amount: checkData.paid_amount
    };
  }

  return {
    success: true,
    paid: false,
    status: 'pending'
  };
}
