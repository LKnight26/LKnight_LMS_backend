const Stripe = require('stripe');

if (!process.env.STRIPE_SECRET_KEY) {
  console.warn('[STRIPE] WARNING: STRIPE_SECRET_KEY is not set. Payment features will be disabled.');
}

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

module.exports = stripe;
