# LKnight LMS — US Market Launch Readiness (Full-Stack Audit)

**Audience:** Client / stakeholders  
**Date reference:** April 2026  
**Scope:** Backend (`LKnight_LMS_backend`) and web app (`lk-f/LKnight_LMS_web`), cross-checked against `docs/CLIENT_AUDIT_BACKEND.md` and the current codebase.

**Disclaimer:** This is a technical readiness assessment, not legal advice. US launch involves contracts, privacy law (state and federal), payment rules, accessibility, and sector-specific obligations (e.g. education). Counsel and a qualified compliance review should sign off on policies and processes.

---

## 1. Executive summary

| Verdict | Detail |
|--------|--------|
| **Engineering posture** | The backend has **strong structure** (Prisma, Express, documented API, Stripe webhook discipline) and has **completed the high-priority hardening** called out in `CLIENT_AUDIT_BACKEND.md` §2b (Helmet, rate limiting, production Swagger controls, trust proxy). |
| **Launch recommendation** | **Not “all clear” for a US public launch** until **critical account security** is fixed and **medium backlog** items are either implemented or explicitly accepted as risk. A **parallel legal/product track** remains required regardless of code quality. |

**Blocking issue (not listed in the original backend audit doc):** Several **user-specific auth routes are mounted without JWT verification**. Anyone who can guess or obtain a user UUID can call profile read/update, password change, and account deletion without proving they own that account. This is an **IDOR-class vulnerability** and must be remediated before marketing a US-facing product.

---

## 2. Scorecard vs `CLIENT_AUDIT_BACKEND.md`

### 2.1 What the backend audit document explicitly tracks

| Bucket | Items | Done in code | Notes |
|--------|-------|--------------|--------|
| **§2** Code quality table | 6 qualitative rows | N/A (assessment, not tasks) | Still accurate at a high level. |
| **§2b** High-priority hardening | **4** | **4 / 4** | Helmet (CSP off), `authLimiter` + `apiLimiter`, production `/api-docs` gating, `trust proxy` in production / `TRUST_PROXY`. |
| **§3** Security already in place | 9 measures | Largely as documented | JWT exists in middleware but **not applied to all `/api/auth/*` user routes** — see §4.1. |
| **§5** Planned / backlog | **6 rows** | **0 / 3** medium items fully done; **1 partial** | See §4.2. “Ongoing” and “legal parallel” rows are process, not binary completion. |

**Plain count from the written audit:**  
- **Completed and verifiable:** **4** items (all of §2b).  
- **Backlog §5 (engineering):** **3** medium items still open; **2** ongoing operational items; **1** legal/product parallel.

---

## 3. Frontend audit (`LKnight_LMS_web`)

### 3.1 Strengths (US-market relevant)

| Area | Status |
|------|--------|
| **Legal surface on signup** | `/signup` requires agreement to **Terms** and **Privacy** with links to `/terms` and `/privacy`. |
| **Published policies** | Dedicated `/privacy` (effective date, collection/use, rights section, contact emails) and `/terms` with cross-links. States **no sale/rent of personal information** (aligns with common US expectations; still not a substitute for legal review). |
| **SEO / discoverability** | Metadata, sitemap, robots — helpful for a public US site. |
| **Stack** | Next.js App Router, typed API client, auth context — maintainable for iteration. |

### 3.2 Gaps and risks

| Item | Severity | Notes |
|------|----------|--------|
| **No in-app “delete my account” flow** | **High (product + compliance UX)** | Privacy §10 tells users they may request deletion and to **contact by email**. There is **no** self-service delete in `profile` UI; `authApi` in `src/lib/api.ts` has **no** `deleteAccount` method. Backend exposes `DELETE /api/auth/delete-account/:userId` but **without token checks** (see §4.1) — even if wired in the UI, it would be unsafe until fixed. |
| **No self-service data export** | **Medium** | Privacy mentions access/correction/deletion rights; there is no **download my data** API usage or UI. US state laws may require specific mechanisms depending on scope and data types — **legal to confirm**. |
| **Cookie / tracking consent UI** | **Low–medium** | Privacy discloses cookies/analytics. No dedicated **cookie banner** or granular consent module was found in the codebase scan. If third-party scripts are added later, this becomes more important. |
| **JWT in `localStorage`** | **Medium (standard tradeoff)** | Common pattern; increases impact of **XSS**. Mitigate with CSP, careful dependency hygiene, and avoiding inline untrusted HTML. Backend CSP is intentionally relaxed for Swagger; frontend can still set stricter headers via hosting (e.g. Vercel) or `next.config` / middleware. |
| **`next.config.ts`** | **Low** | No custom security headers configured; Next defaults apply. Consider explicit headers for production once product stabilizes. |

---

## 4. Backend deep dive (verified against code)

### 4.1 Critical: unauthenticated user account routes

These routes in `src/routes/auth.routes.js` are registered **without** `verifyToken` (unlike `enrollment`, `subscription`, `vault`, etc.):

- `GET /api/auth/me/:userId`
- `PUT /api/auth/profile/:userId`
- `PUT /api/auth/change-password/:userId`
- `DELETE /api/auth/delete-account/:userId`

**Impact:** Account takeover, data breach, and arbitrary deletion if `userId` is known or enumerated.

**Recommendation:** Require `verifyToken`, then enforce `req.userId === :userId` (or decode user id from JWT only and drop path param). Treat as **P0 before US launch**.

### 4.2 Items from `CLIENT_AUDIT_BACKEND.md` §5 — implementation status

| Enhancement | Status | Evidence |
|-------------|--------|----------|
| **Request body size policy** | **Not done** | `server.js` uses `express.json({ limit: '50mb' })` and `urlencoded` **globally** — same as audit’s concern (DoS / oversized JSON). |
| **Production error responses** | **Not done** | `errorHandler.js` returns `err.message` for unknown errors; stacks logged but clients can still see internal messages on 500s. |
| **Startup / seed behavior** | **Partially addressed** | `start.sh` runs `prisma/seed.js` on **every** deploy. `seed.js` uses **upserts** for admin and plans and syncs plan catalog — better than blind inserts, but **production** should avoid seeding a **default admin** unless credentials are rotated and process is intentional. |
| **Secrets & access** | **Process** | Document rotation, secret manager — operational. |
| **Monitoring & incident response** | **Process** | Structured logging / alerts / runbooks — not evidenced as implemented in the audit scope. |
| **US privacy & consumer expectations** | **Product + legal** | Partially reflected on **frontend** (policies, signup consent); backend needs **secured** delete/access APIs if self-service is required. |

### 4.3 Items already aligned with the audit (positive)

- Stripe webhook **before** `express.json`, raw body, signature verification pattern.  
- Password hashing (bcrypt cost 12) as documented.  
- CORS allowlist, Helmet (non-CSP), rate limits, production Swagger opt-in — as in §2b.

---

## 5. US market launch — practical checklist

**Engineering (recommended before broad US marketing)**

1. **P0:** Fix auth on all user-specific `/api/auth/*` routes; enforce identity from JWT.  
2. **P0:** Add **self-service delete** in the app **only after** (1), with confirmation and Stripe/subscription cancellation rules defined.  
3. **P1:** Tighten JSON body limits; keep large limits only on upload routes.  
4. **P1:** Generic 500 messages in production; log details server-side only.  
5. **P1:** Revisit `seed.js` on production boot (feature flag, or CI-only seed, or remove default admin from prod path).  
6. **P2:** Monitoring, structured logs, webhook failure alerts.

**Legal / product (parallel)**

- Final **Privacy Policy** and **Terms** for US operations (state laws, minors if applicable, dispute resolution).  
- **DPA / subprocessors** list if B2B or enterprise.  
- **Accessibility** (WCAG) review for public and learning flows.  
- **Payment disclosures** and refund/chargeback alignment with Stripe setup.

---

## 6. Closing statement for the client

**How much of the backend audit is “done”?**  
All **four** high-priority hardening items in §2b are implemented. The **§5 backlog** engineering items are **largely still open**, with **seed** improved but not fully “production-safe” without policy decisions.

**Frontend vs backend split:**  
The **frontend** already supports **policy visibility and signup consent**, which is essential but not sufficient. **Sensitive privacy actions** (delete, export) are **not** fully productized on the frontend, and the **backend delete/profile/password** surface currently has a **critical authorization gap** that the original audit document did not call out.

**Bottom line:** The project shows **credible engineering** and **meaningful security investment**, but it is **not** accurate to tell stakeholders the stack is **fully ready for US launch** without addressing **P0 authentication on user routes** and deciding how to close **privacy self-service** and **§5** medium items (or documenting accepted risk with counsel).

---

*Document version: 1.0 — Consolidated full-stack readiness; supersedes nothing in `CLIENT_AUDIT_BACKEND.md` but extends it with frontend review and P0 auth finding.*
