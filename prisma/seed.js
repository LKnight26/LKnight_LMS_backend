const bcrypt = require('bcryptjs');
require('dotenv').config();

// Use the same prisma instance from your config
const prisma = require('../src/config/db');

async function main() {
  // Create admin user
  const hashedPassword = await bcrypt.hash('Admin@123', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      firstName: 'Admin',
      lastName: 'User',
      password: hashedPassword,
      role: 'ADMIN',
      status: 'ACTIVE',
      isEmailVerified: true,
    },
  });

  console.log('Admin user created:', admin.email);

  // Static plans — pricing is fixed, Stripe IDs come from env vars
  const plans = [
    {
      name: 'Individual Plan',
      slug: 'individual',
      description: 'For independent professionals ready to grow their influence.',
      tagline: 'Growth starts with one.',
      closeLine: 'Your leadership starts here. Learn at your own pace through story-driven lessons designed to help you lead with authenticity, confidence, and care.',
      monthlyPrice: 29,
      yearlyPrice: 290,
      maxUsers: 1,
      additionalUserPrice: null,
      features: [
        { text: 'Full access to all learning modules', included: true },
        { text: 'Complete library of on-demand video trainings with companion guides', included: true },
        { text: 'Downloadable leadership resources', included: true },
        { text: 'Access to The Vault, our anonymous leadership community', included: true },
      ],
      ctaText: 'Start with Individual',
      ctaType: 'CHECKOUT',
      isPopular: false,
      order: 0,
      isActive: true,
      stripeProductId: process.env.STRIPE_PRODUCT_INDIVIDUAL || null,
      stripeMonthlyPriceId: process.env.STRIPE_PRICE_INDIVIDUAL_MONTHLY || null,
      stripeYearlyPriceId: process.env.STRIPE_PRICE_INDIVIDUAL_YEARLY || null,
    },
    {
      name: 'Small Team Plan',
      slug: 'small-team',
      description: 'For small teams building trust and shared language.',
      tagline: 'Build your foundation.',
      closeLine: 'Create shared language, deepen trust, and equip every leader to show up with intention.',
      monthlyPrice: process.env.PLAN_SMALL_TEAM_MONTHLY_PRICE ? parseFloat(process.env.PLAN_SMALL_TEAM_MONTHLY_PRICE) : null,
      yearlyPrice: 2000,
      maxUsers: 50,
      additionalUserPrice: 25,
      features: [
        { text: 'Full access for up to 50 users', included: true },
        { text: 'All modules, companion guides, and Vault access', included: true },
        { text: 'Team usage dashboard for engagement tracking', included: true },
      ],
      ctaText: 'Start with Team',
      ctaType: 'CHECKOUT',
      isPopular: false,
      order: 1,
      isActive: true,
      stripeProductId: process.env.STRIPE_PRODUCT_SMALL_TEAM || null,
      stripeMonthlyPriceId: process.env.STRIPE_PRICE_SMALL_TEAM_MONTHLY || null,
      stripeYearlyPriceId: process.env.STRIPE_PRICE_SMALL_TEAM_YEARLY || null,
    },
    {
      name: 'Organization Plan',
      slug: 'organization',
      description: 'For growing companies scaling leadership across teams.',
      tagline: 'Scale leadership at every level.',
      closeLine: 'Build a culture of empathy, accountability, and courage — one leader at a time.',
      monthlyPrice: process.env.PLAN_ORGANIZATION_MONTHLY_PRICE ? parseFloat(process.env.PLAN_ORGANIZATION_MONTHLY_PRICE) : null,
      yearlyPrice: 6500,
      maxUsers: 250,
      additionalUserPrice: 20,
      features: [
        { text: 'Full access for all employees', included: true },
        { text: 'Unlimited use of all modules, guides, and The Vault', included: true },
        { text: 'Organization-level dashboard for engagement visibility', included: true },
      ],
      ctaText: 'Start with Organization',
      ctaType: 'CHECKOUT',
      isPopular: false,
      order: 2,
      isActive: true,
      stripeProductId: process.env.STRIPE_PRODUCT_ORGANIZATION || null,
      stripeMonthlyPriceId: process.env.STRIPE_PRICE_ORGANIZATION_MONTHLY || null,
      stripeYearlyPriceId: process.env.STRIPE_PRICE_ORGANIZATION_YEARLY || null,
    },
    {
      name: 'Enterprise Plan',
      slug: 'enterprise',
      description: 'For large organizations transforming culture at scale.',
      tagline: 'Transform your culture at scale.',
      closeLine: 'Set a new standard for leadership. Scalable, data-informed, and rooted in humanity, this plan evolves with you.',
      monthlyPrice: process.env.PLAN_ENTERPRISE_MONTHLY_PRICE ? parseFloat(process.env.PLAN_ENTERPRISE_MONTHLY_PRICE) : null,
      yearlyPrice: 13000,
      maxUsers: 1000,
      additionalUserPrice: null,
      features: [
        { text: 'Full enterprise access to all LMS content and The Vault', included: true },
        { text: 'Basic enterprise dashboard and centralized account management', included: true },
        { text: 'Scalable infrastructure to grow with your organization', included: true },
      ],
      ctaText: 'Contact Sales',
      ctaType: 'CONTACT_SALES',
      isPopular: false,
      order: 3,
      isActive: true,
      stripeProductId: process.env.STRIPE_PRODUCT_ENTERPRISE || null,
      stripeMonthlyPriceId: process.env.STRIPE_PRICE_ENTERPRISE_MONTHLY || null,
      stripeYearlyPriceId: process.env.STRIPE_PRICE_ENTERPRISE_YEARLY || null,
    },
  ];

  for (const plan of plans) {
    await prisma.plan.upsert({
      where: { slug: plan.slug },
      update: plan,
      create: plan,
    });
  }

  console.log('Default plans seeded/synced:', plans.length);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
