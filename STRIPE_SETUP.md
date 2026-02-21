# Stripe Payment Integration Setup Guide

This guide walks you through setting up Stripe as the payment provider for LKnight LMS course purchases.

---

## How It Works

- **Paid courses**: User clicks "Enroll Now" → redirected to Stripe's hosted checkout page → pays → redirected back → enrollment created automatically via webhook
- **Free courses** (price = $0): User clicks "Enroll for Free" → enrolled instantly, no Stripe involved
- Each course is purchased individually — buying Course 1 only unlocks Course 1

---

## Step 1: Create a Stripe Account

1. Go to [https://dashboard.stripe.com/register](https://dashboard.stripe.com/register)
2. Enter your business email and create an account
3. **Business name**: `LKnight Learning Hub`
4. Verify your email address

---

## Step 2: Enable Test Mode

1. After logging in, look at the **top-right** of the Stripe Dashboard
2. Toggle **"Test mode"** ON (it should show an orange "TEST" badge)
3. All keys will be prefixed with `sk_test_` and `pk_test_`
4. **Stay in test mode** until you're ready to accept real payments

---

## Step 3: Get Your API Keys

1. Go to **Developers** → **API Keys** (left sidebar)
2. You'll see two keys:
   - **Publishable key** (`pk_test_...`) — used in frontend (safe to expose)
   - **Secret key** (`sk_test_...`) — used in backend (**never expose this**)
3. Click **"Reveal test key"** to see the Secret key
4. **Copy both keys** — you'll need them for the `.env` file

---

## Step 4: Set Up the Webhook Endpoint

This is **critical** — the webhook is how Stripe tells your backend that a payment succeeded.

### For Local Development (Testing):

1. Install the [Stripe CLI](https://stripe.com/docs/stripe-cli):
   ```bash
   # Windows (with scoop)
   scoop install stripe

   # Or download from: https://stripe.com/docs/stripe-cli#install
   ```

2. Login to Stripe CLI:
   ```bash
   stripe login
   ```

3. Forward webhooks to your local server:
   ```bash
   stripe listen --forward-to localhost:5000/api/webhooks/stripe
   ```

4. The CLI will display a **webhook signing secret** (`whsec_...`) — copy this for your `.env`

### For Production (Railway):

1. Go to **Developers** → **Webhooks** in Stripe Dashboard
2. Click **"Add endpoint"**
3. Enter your backend URL: `https://your-backend.up.railway.app/api/webhooks/stripe`
4. Under **"Select events"**, choose: `checkout.session.completed`
5. Click **"Add endpoint"**
6. Click on the new endpoint → **"Reveal"** the signing secret (`whsec_...`)
7. Copy this secret for your Railway environment variables

---

## Step 5: Update Your `.env` File

Open `LKnight-Lms-backend/.env` and add your Stripe credentials:

```env
# Stripe Configuration
STRIPE_SECRET_KEY=[REDACTED]
STRIPE_WEBHOOK_SECRET=[REDACTED]
```

Replace:
- `STRIPE_SECRET_KEY` → Your Secret key from Step 3
- `STRIPE_WEBHOOK_SECRET` → The webhook signing secret from Step 4

---

## Step 6: Enable Receipt Emails (Optional but Recommended)

Stripe can automatically send branded receipt emails to customers after payment.

1. Go to **Settings** → **Emails** → **Customer emails**
2. Enable **"Successful payments"**
3. Customize your receipt branding:
   - Go to **Settings** → **Branding**
   - Upload your logo
   - Set your brand color to `#FF6F00` (LKnight orange)
   - Set your accent color to `#000E51` (LKnight navy)

---

## Step 7: Test the Payment Flow

### Start both servers:
```bash
# Terminal 1 - Backend
cd LKnight-Lms-backend
npm run dev

# Terminal 2 - Frontend
cd LKnight-Lms
npm run dev

# Terminal 3 - Stripe webhook forwarding (for local testing)
stripe listen --forward-to localhost:5000/api/webhooks/stripe
```

### Test with these card numbers:

| Card Number | Result |
|---|---|
| `4242 4242 4242 4242` | Payment succeeds |
| `4000 0000 0000 0002` | Card declined |
| `4000 0025 0000 3155` | Requires 3D Secure authentication |

For all test cards, use:
- **Expiry**: Any future date (e.g., `12/34`)
- **CVC**: Any 3 digits (e.g., `123`)
- **ZIP**: Any 5 digits (e.g., `12345`)

### Test the complete flow:

1. **Paid course**: Go to a course checkout page → Click "Enroll Now" → Enter test card `4242 4242 4242 4242` → Complete payment → Should see success page → Redirected to course
2. **Free course**: Go to a free course ($0) checkout → Click "Enroll for Free" → Should enroll instantly
3. **Canceled payment**: Click "Enroll Now" → On Stripe page, click the back arrow → Should return to checkout with "Payment was canceled" message
4. **Already enrolled**: Try to enroll in same course again → Should see "Already enrolled" error
5. **Check dashboard**: Go to dashboard → The purchased course should show as unlocked, other courses remain locked

---

## Production Deployment (Railway)

When deploying to Railway, add these environment variables:

| Variable | Value |
|---|---|
| `STRIPE_SECRET_KEY` | `` (your LIVE secret key) |
| `STRIPE_WEBHOOK_SECRET` | `` (from the production webhook endpoint) |

**Important production steps:**
1. Switch Stripe Dashboard from **Test mode** to **Live mode**
2. Create a **new webhook endpoint** for your production backend URL
3. Use the **live** API keys (not test keys)
4. Complete Stripe's business verification to accept real payments

---

## Troubleshooting

| Issue | Solution |
|---|---|
| "Payment service is not configured" | `STRIPE_SECRET_KEY` is missing from `.env` |
| Payment succeeds but course not unlocking | Check webhook: Is `STRIPE_WEBHOOK_SECRET` correct? Is webhook forwarding running? |
| "Webhook Error: No signatures found" | The webhook route must receive raw body. Make sure the webhook route is registered BEFORE `express.json()` in `server.js` |
| Enrollment takes too long after payment | Webhook may be delayed. The success page polls for up to 20 seconds. Check server logs for `[STRIPE WEBHOOK]` messages |
| "Already enrolled" error | User already has an enrollment for this course. Check the dashboard |
| Webhook fires but enrollment not created | Check server console for `[STRIPE WEBHOOK]` error logs. May need manual reconciliation |

---

## Architecture Overview

```
User clicks "Enroll Now"
    ↓
Frontend calls POST /api/enrollments/create-checkout-session
    ↓
Backend creates Stripe Checkout Session (with course price, user email)
    ↓
Frontend redirects to Stripe's hosted checkout page
    ↓
User enters card details and pays on Stripe
    ↓
Stripe sends webhook (checkout.session.completed) to backend
    ↓
Backend verifies signature → creates enrollment → sends receipt email
    ↓
User is redirected to success page → polls for enrollment → redirected to course
```

---

## Security Notes

- **Card data never touches your server** — Stripe's hosted checkout handles all card processing (PCI compliant)
- **Webhook signature verification** — Every webhook is verified using `STRIPE_WEBHOOK_SECRET` to prevent spoofing
- **Idempotent webhook handling** — Duplicate webhooks are safely ignored (checked by `stripeSessionId`)
- **User verification** — The success page verifies the enrollment belongs to the logged-in user
- **Never commit `.env`** — Your Stripe keys should never be in version control
