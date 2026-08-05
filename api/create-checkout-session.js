'use strict';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://neritqpjotzfkelottgu.supabase.co';
const SUPABASE_PUBLISHABLE_KEY =
  process.env.SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_wf8deoATQo-pT57dpDIZfA_q8GibjBa';
const MAX_CART_ITEMS = 20;
const MAX_QUANTITY = 10;

function sendJson(response, status, payload) {
  response.status(status).setHeader('Content-Type', 'application/json; charset=utf-8');
  response.setHeader('Cache-Control', 'no-store');
  response.end(JSON.stringify(payload));
}

function requestOrigin(request) {
  const forwardedHost = request.headers['x-forwarded-host'];
  const host = String(forwardedHost || request.headers.host || 'carestheticpr.com').split(',')[0].trim();
  const forwardedProtocol = request.headers['x-forwarded-proto'];
  const protocol = String(forwardedProtocol || 'https').split(',')[0].trim();
  return `${protocol}://${host}`;
}

function isAllowedOrigin(origin) {
  try {
    const hostname = new URL(origin).hostname;
    return (
      hostname === 'carestheticpr.com' ||
      hostname === 'www.carestheticpr.com' ||
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname.endsWith('.vercel.app')
    );
  } catch (error) {
    return false;
  }
}

function parseItems(body) {
  if (!body || !Array.isArray(body.items) || body.items.length === 0) return null;
  if (body.items.length > MAX_CART_ITEMS) return null;

  const merged = new Map();
  for (const item of body.items) {
    if (!item || typeof item.id !== 'string' || !/^[0-9a-f-]{36}$/i.test(item.id)) return null;
    if (!Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > MAX_QUANTITY) return null;
    merged.set(item.id, Math.min((merged.get(item.id) || 0) + item.quantity, MAX_QUANTITY));
  }

  return Array.from(merged, ([id, quantity]) => ({ id, quantity }));
}

async function getProducts(items) {
  const ids = items.map((item) => item.id);
  const params = new URLSearchParams({
    select: 'id,slug,name,short_description,price_cents,currency,inventory_count,cover_image_url,active',
    id: `in.(${ids.join(',')})`,
    active: 'eq.true'
  });
  const response = await fetch(`${SUPABASE_URL}/rest/v1/products?${params}`, {
    headers: {
      apikey: SUPABASE_PUBLISHABLE_KEY,
      Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`
    }
  });
  if (!response.ok) throw new Error('No se pudo validar el catálogo.');
  return response.json();
}

function appendLineItem(params, index, product, quantity, origin) {
  const prefix = `line_items[${index}]`;
  params.append(`${prefix}[quantity]`, String(quantity));
  params.append(`${prefix}[price_data][currency]`, String(product.currency || 'USD').toLowerCase());
  params.append(`${prefix}[price_data][unit_amount]`, String(product.price_cents));
  params.append(`${prefix}[price_data][product_data][name]`, product.name);
  if (product.short_description) {
    params.append(`${prefix}[price_data][product_data][description]`, product.short_description.slice(0, 500));
  }
  if (product.cover_image_url) {
    const imageUrl = new URL(product.cover_image_url, origin).toString();
    params.append(`${prefix}[price_data][product_data][images][0]`, imageUrl);
  }
  params.append(`${prefix}[price_data][product_data][metadata][product_id]`, product.id);
  params.append(`${prefix}[price_data][product_data][metadata][slug]`, product.slug);
  if (process.env.STRIPE_TAX_RATE_ID) {
    params.append(`${prefix}[tax_rates][0]`, process.env.STRIPE_TAX_RATE_ID);
  }
}

module.exports = async function createCheckoutSession(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return sendJson(response, 405, { message: 'Método no permitido.' });
  }

  const origin = requestOrigin(request);
  if (!isAllowedOrigin(origin)) {
    return sendJson(response, 403, { message: 'Origen no permitido.' });
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return sendJson(response, 503, {
      code: 'STRIPE_NOT_CONFIGURED',
      message: 'El pago en línea todavía no está activado. Comunícate con Caresthetic para completar tu compra.'
    });
  }

  const items = parseItems(request.body);
  if (!items) return sendJson(response, 400, { message: 'El carrito no es válido.' });

  try {
    const products = await getProducts(items);
    const productMap = new Map(products.map((product) => [product.id, product]));
    if (productMap.size !== items.length) {
      return sendJson(response, 409, { message: 'Uno de los productos ya no está disponible.' });
    }

    const params = new URLSearchParams();
    params.append('mode', 'payment');
    params.append('locale', 'es');
    params.append('customer_creation', 'always');
    params.append('billing_address_collection', 'auto');
    params.append('phone_number_collection[enabled]', 'true');
    params.append('success_url', `${origin}/checkout-success?session_id={CHECKOUT_SESSION_ID}`);
    params.append('cancel_url', `${origin}/tizo?checkout=cancelled`);
    params.append('metadata[source]', 'caresthetic_tizo');

    items.forEach((item, index) => {
      const product = productMap.get(item.id);
      if (!Number.isInteger(product.price_cents) || product.price_cents < 50) {
        throw new Error(`${product.name} todavía no tiene un precio válido.`);
      }
      if (Number.isInteger(product.inventory_count) && item.quantity > product.inventory_count) {
        throw new Error(`Solo quedan ${product.inventory_count} unidades de ${product.name}.`);
      }
      appendLineItem(params, index, product, item.quantity, origin);
    });

    const stripeResponse = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params.toString()
    });
    const session = await stripeResponse.json();
    if (!stripeResponse.ok || !session.url) {
      const stripeMessage = session && session.error && session.error.message;
      throw new Error(stripeMessage || 'Stripe no pudo iniciar el pago.');
    }

    return sendJson(response, 200, { url: session.url });
  } catch (error) {
    return sendJson(response, 400, {
      message: error && error.message ? error.message : 'No pudimos iniciar el pago.'
    });
  }
};
