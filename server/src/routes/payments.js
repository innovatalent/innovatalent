const { Router } = require('express');
const db = require('../config/db');
const env = require('../config/env');
const { authenticate, authorize } = require('../middleware/auth');

const router = Router();

let stripe;
if (env.stripe.secretKey) {
  stripe = require('stripe')(env.stripe.secretKey);
}

// Create checkout session
router.post('/checkout', authenticate, authorize('startup'), async (req, res) => {
  try {
    if (!stripe) return res.status(503).json({ error: 'Pagos no configurados' });

    const { rows: clientRows } = await db.query('SELECT * FROM clients WHERE user_id = $1', [req.user.id]);
    if (!clientRows.length) return res.status(400).json({ error: 'Registrate como empresa primero' });

    const client = clientRows[0];

    // Check existing active subscription
    const { rows: existingSubs } = await db.query(
      `SELECT id FROM subscriptions WHERE user_id = $1 AND status = 'active'`,
      [req.user.id]
    );
    if (existingSubs.length) return res.status(400).json({ error: 'Ya tenés una suscripción activa' });

    // Find or create Stripe customer
    let customerId;
    const { rows: subRows } = await db.query(
      'SELECT stripe_customer_id FROM subscriptions WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1',
      [req.user.id]
    );

    if (subRows.length && subRows[0].stripe_customer_id) {
      customerId = subRows[0].stripe_customer_id;
    } else {
      const customer = await stripe.customers.create({
        email: req.user.email,
        name: client.contact_name,
        metadata: { userId: req.user.id, clientId: client.id },
      });
      customerId = customer.id;
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [{ price: env.stripe.priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: `${env.frontendUrl}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${env.frontendUrl}/pricing`,
      metadata: { userId: req.user.id, clientId: client.id },
    });

    res.json({ url: session.url, sessionId: session.id });
  } catch (err) {
    console.error('[PAYMENTS] Checkout error:', err.message);
    res.status(500).json({ error: 'Error al crear sesión de pago' });
  }
});

// Stripe webhook
router.post('/webhook', require('express').raw({ type: 'application/json' }), async (req, res) => {
  if (!stripe) return res.status(503).send();

  let event;
  try {
    const sig = req.headers['stripe-signature'];
    event = stripe.webhooks.constructEvent(req.body, sig, env.stripe.webhookSecret);
  } catch (err) {
    console.error('[STRIPE] Webhook signature error:', err.message);
    return res.status(400).send();
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const subscription = await stripe.subscriptions.retrieve(session.subscription);

        await db.query(
          `INSERT INTO subscriptions (client_id, user_id, plan, status, stripe_customer_id, stripe_subscription_id, current_period_start, current_period_end)
           VALUES ($1, $2, 'starter', 'active', $3, $4, to_timestamp($5), to_timestamp($6))`,
          [session.metadata.clientId, session.metadata.userId, session.customer, session.subscription,
           subscription.current_period_start, subscription.current_period_end]
        );

        await db.query(
          `INSERT INTO payments (user_id, amount, currency, status, provider, provider_payment_id, metadata)
           VALUES ($1, $2, $3, 'succeeded', 'stripe', $4, $5)`,
          [session.metadata.userId, session.amount_total, session.currency, session.payment_intent,
           JSON.stringify({ sessionId: session.id })]
        );
        break;
      }

      case 'invoice.paid': {
        const invoice = event.data.object;
        await db.query(
          `UPDATE subscriptions SET status = 'active', current_period_end = to_timestamp($1) WHERE stripe_subscription_id = $2`,
          [invoice.lines.data[0]?.period?.end, invoice.subscription]
        );
        await db.query(
          `INSERT INTO payments (user_id, amount, currency, status, provider, provider_payment_id)
           SELECT user_id, $1, $2, 'succeeded', 'stripe', $3 FROM subscriptions WHERE stripe_subscription_id = $4`,
          [invoice.amount_paid, invoice.currency, invoice.payment_intent, invoice.subscription]
        );
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        await db.query(
          `UPDATE subscriptions SET status = 'past_due' WHERE stripe_subscription_id = $1`,
          [invoice.subscription]
        );
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        await db.query(
          `UPDATE subscriptions SET status = 'canceled' WHERE stripe_subscription_id = $1`,
          [subscription.id]
        );
        break;
      }
    }
  } catch (err) {
    console.error('[STRIPE] Webhook processing error:', err.message);
  }

  res.json({ received: true });
});

// Get subscription status
router.get('/subscription', authenticate, async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT * FROM subscriptions WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1`,
      [req.user.id]
    );
    res.json(rows[0] || null);
  } catch (err) {
    res.status(500).json({ error: 'Error interno' });
  }
});

// Cancel subscription
router.post('/cancel', authenticate, authorize('startup'), async (req, res) => {
  try {
    if (!stripe) return res.status(503).json({ error: 'Pagos no configurados' });

    const { rows } = await db.query(
      `SELECT stripe_subscription_id FROM subscriptions WHERE user_id = $1 AND status = 'active'`,
      [req.user.id]
    );
    if (!rows.length) return res.status(400).json({ error: 'No tenés suscripción activa' });

    await stripe.subscriptions.update(rows[0].stripe_subscription_id, {
      cancel_at_period_end: true,
    });

    res.json({ message: 'Suscripción se cancelará al final del período' });
  } catch (err) {
    console.error('[PAYMENTS] Cancel error:', err.message);
    res.status(500).json({ error: 'Error al cancelar' });
  }
});

module.exports = router;
