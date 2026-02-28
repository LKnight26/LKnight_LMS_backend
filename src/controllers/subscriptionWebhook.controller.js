const prisma = require('../config/db');
const stripe = require('../config/stripe');

/**
 * @desc    Handle Stripe webhook events for subscriptions
 * @route   POST /api/webhooks/stripe (dispatched from main webhook handler)
 * @access  Public (verified via Stripe signature)
 */
const handleSubscriptionWebhook = async (event, res) => {
  const eventType = event.type;

  switch (eventType) {
    case 'checkout.session.completed': {
      await handleCheckoutCompleted(event.data.object);
      break;
    }
    case 'customer.subscription.updated': {
      await handleSubscriptionUpdated(event.data.object);
      break;
    }
    case 'customer.subscription.deleted': {
      await handleSubscriptionDeleted(event.data.object);
      break;
    }
    case 'invoice.payment_succeeded': {
      await handleInvoicePaymentSucceeded(event.data.object);
      break;
    }
    case 'invoice.payment_failed': {
      await handleInvoicePaymentFailed(event.data.object);
      break;
    }
    default:
      console.log('[SUB WEBHOOK] Unhandled event type:', eventType);
  }
};

/**
 * Handle checkout.session.completed for subscription mode
 */
const handleCheckoutCompleted = async (session) => {
  console.log('[SUB WEBHOOK] checkout.session.completed:', session.id);

  const { userId, planId, billingCycle, organizationName } = session.metadata || {};

  if (!userId || !planId) {
    console.error('[SUB WEBHOOK] Missing metadata in session:', session.id);
    return;
  }

  const stripeSubscriptionId = session.subscription;
  if (!stripeSubscriptionId) {
    console.error('[SUB WEBHOOK] No subscription ID in session:', session.id);
    return;
  }

  // IDEMPOTENCY: Check if this subscription was already created
  const existingSub = await prisma.subscription.findUnique({
    where: { stripeSubscriptionId },
  });

  if (existingSub) {
    console.log('[SUB WEBHOOK] Subscription already exists:', stripeSubscriptionId);
    return;
  }

  // Get plan details for maxUsers
  const plan = await prisma.plan.findUnique({
    where: { id: planId },
  });

  if (!plan) {
    console.error('[SUB WEBHOOK] Plan not found:', planId);
    return;
  }

  // Retrieve the Stripe subscription for period dates
  let stripeSubDetails;
  try {
    stripeSubDetails = await stripe.subscriptions.retrieve(stripeSubscriptionId);
  } catch (err) {
    console.error('[SUB WEBHOOK] Failed to retrieve Stripe subscription:', err.message);
    return;
  }

  // Create local subscription record
  const subscription = await prisma.subscription.create({
    data: {
      userId,
      planId,
      status: 'ACTIVE',
      billingCycle: billingCycle || 'YEARLY',
      stripeSubscriptionId,
      stripeCustomerId: session.customer,
      currentPeriodStart: new Date(stripeSubDetails.current_period_start * 1000),
      currentPeriodEnd: new Date(stripeSubDetails.current_period_end * 1000),
      cancelAtPeriodEnd: false,
      maxUsers: plan.maxUsers,
      organizationName: organizationName || null,
    },
  });

  console.log('[SUB WEBHOOK] Subscription created:', subscription.id, 'plan:', plan.name, 'user:', userId);
};

/**
 * Handle customer.subscription.updated
 */
const handleSubscriptionUpdated = async (stripeSubscription) => {
  console.log('[SUB WEBHOOK] customer.subscription.updated:', stripeSubscription.id);

  const subscription = await prisma.subscription.findUnique({
    where: { stripeSubscriptionId: stripeSubscription.id },
  });

  if (!subscription) {
    console.warn('[SUB WEBHOOK] Local subscription not found for:', stripeSubscription.id);
    return;
  }

  // Map Stripe status to our status
  const statusMap = {
    active: 'ACTIVE',
    past_due: 'PAST_DUE',
    unpaid: 'UNPAID',
    canceled: 'CANCELED',
    incomplete: 'INCOMPLETE',
    incomplete_expired: 'EXPIRED',
    trialing: 'TRIALING',
  };

  const updateData = {
    status: statusMap[stripeSubscription.status] || subscription.status,
    cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end || false,
    currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
    currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
  };

  // Handle plan change (upgrade/downgrade)
  if (stripeSubscription.metadata?.planId && stripeSubscription.metadata.planId !== subscription.planId) {
    const newPlan = await prisma.plan.findUnique({
      where: { id: stripeSubscription.metadata.planId },
    });
    if (newPlan) {
      updateData.planId = newPlan.id;
      updateData.maxUsers = newPlan.maxUsers;
      console.log('[SUB WEBHOOK] Plan changed to:', newPlan.name);
    }
  }

  await prisma.subscription.update({
    where: { id: subscription.id },
    data: updateData,
  });

  console.log('[SUB WEBHOOK] Subscription updated:', subscription.id, 'status:', updateData.status);
};

/**
 * Handle customer.subscription.deleted
 */
const handleSubscriptionDeleted = async (stripeSubscription) => {
  console.log('[SUB WEBHOOK] customer.subscription.deleted:', stripeSubscription.id);

  const subscription = await prisma.subscription.findUnique({
    where: { stripeSubscriptionId: stripeSubscription.id },
  });

  if (!subscription) {
    console.warn('[SUB WEBHOOK] Local subscription not found for:', stripeSubscription.id);
    return;
  }

  await prisma.subscription.update({
    where: { id: subscription.id },
    data: { status: 'EXPIRED' },
  });

  console.log('[SUB WEBHOOK] Subscription expired:', subscription.id);
};

/**
 * Handle invoice.payment_succeeded (renewal)
 */
const handleInvoicePaymentSucceeded = async (invoice) => {
  if (!invoice.subscription) return;

  console.log('[SUB WEBHOOK] invoice.payment_succeeded for sub:', invoice.subscription);

  const subscription = await prisma.subscription.findUnique({
    where: { stripeSubscriptionId: invoice.subscription },
  });

  if (!subscription) {
    console.warn('[SUB WEBHOOK] Local subscription not found for invoice:', invoice.subscription);
    return;
  }

  // Retrieve updated subscription from Stripe for new period dates
  try {
    const stripeSub = await stripe.subscriptions.retrieve(invoice.subscription);
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        status: 'ACTIVE',
        currentPeriodStart: new Date(stripeSub.current_period_start * 1000),
        currentPeriodEnd: new Date(stripeSub.current_period_end * 1000),
      },
    });
    console.log('[SUB WEBHOOK] Subscription renewed:', subscription.id);
  } catch (err) {
    console.error('[SUB WEBHOOK] Failed to update subscription after payment:', err.message);
  }
};

/**
 * Handle invoice.payment_failed
 */
const handleInvoicePaymentFailed = async (invoice) => {
  if (!invoice.subscription) return;

  console.log('[SUB WEBHOOK] invoice.payment_failed for sub:', invoice.subscription);

  const subscription = await prisma.subscription.findUnique({
    where: { stripeSubscriptionId: invoice.subscription },
  });

  if (!subscription) {
    console.warn('[SUB WEBHOOK] Local subscription not found for failed invoice:', invoice.subscription);
    return;
  }

  await prisma.subscription.update({
    where: { id: subscription.id },
    data: { status: 'PAST_DUE' },
  });

  console.log('[SUB WEBHOOK] Subscription set to PAST_DUE:', subscription.id);
};

module.exports = {
  handleSubscriptionWebhook,
};
