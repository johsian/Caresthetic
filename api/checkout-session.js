'use strict';

function sendJson(response, status, payload) {
  response.status(status).setHeader('Content-Type', 'application/json; charset=utf-8');
  response.setHeader('Cache-Control', 'no-store');
  response.end(JSON.stringify(payload));
}

module.exports = async function getCheckoutSession(request, response) {
  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET');
    return sendJson(response, 405, { message: 'Método no permitido.' });
  }
  if (!process.env.STRIPE_SECRET_KEY) {
    return sendJson(response, 503, { message: 'El pago en línea todavía no está activado.' });
  }

  const sessionId = String(request.query && request.query.session_id ? request.query.session_id : '');
  if (!/^cs_(test_|live_)[A-Za-z0-9]+$/.test(sessionId)) {
    return sendJson(response, 400, { message: 'La confirmación de pago no es válida.' });
  }

  try {
    const stripeResponse = await fetch(
      `https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}`,
      { headers: { Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}` } }
    );
    const session = await stripeResponse.json();
    if (!stripeResponse.ok) {
      const stripeMessage = session && session.error && session.error.message;
      throw new Error(stripeMessage || 'No pudimos verificar el pago.');
    }

    return sendJson(response, 200, {
      paymentStatus: session.payment_status,
      status: session.status,
      customerEmail: session.customer_details ? session.customer_details.email : null
    });
  } catch (error) {
    return sendJson(response, 400, {
      message: error && error.message ? error.message : 'No pudimos verificar el pago.'
    });
  }
};
