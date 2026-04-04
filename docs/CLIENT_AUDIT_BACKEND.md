# LKnight LMS — Backend Audit Summary

**Audience:** Client / stakeholders  
**Scope:** Backend API repository (Express, Prisma, PostgreSQL)  
**Purpose:** Summarize **code quality**, **security measures already in place**, **notable strengths**, and **planned enhancements** following this deliverable—particularly items that support a **US-market** launch posture.

This document is a technical overview for an audit-style review. It is not legal advice; privacy, terms of service, and sector-specific compliance (e.g. education or payments) require separate legal and product review.

---

## 1. Project overview

The LKnight backend is a REST API for a learning management system: user accounts, courses, modules, lessons, enrollments, admin analytics, file uploads, subscriptions, and integrations with payment and media providers. It is built for **Node.js 22+**, **Express 5**, **Prisma 7**, and **PostgreSQL**, with containerized deployment (Docker / Railway-style workflows).

---

## 2. Code quality and structure

| Area | Assessment |
|------|------------|
| **Organization** | Clear separation: server.js (entry, middleware, route mounting), src/routes/, src/controllers/, src/middleware/, src/config/, and prisma/schema.prisma for the data model. |
| **Consistency** | JSON responses follow a predictable shape (success, data, message) across controllers. |
| **Data access** | Prisma provides type-safe queries, migrations, and a single client entry point (src/config/db.js) with the Prisma 7 adapter pattern. |
| **Error handling** | Central errorHandler middleware maps common Prisma errors (e.g. duplicate key, not found) to appropriate HTTP statuses and stable client messages. |
| **Documentation** | OpenAPI/Swagger is generated from route annotations and served at /api-docs, improving onboarding and integration for teams and auditors. |
| **Process hygiene** | uncaughtException / unhandledRejection handlers on the process reduce silent failures in production. |

---

## 2b. Recently implemented (high-priority hardening)

| Item | Notes |
|------|--------|
| **HTTP security headers** | helmet applied globally; **contentSecurityPolicy** is disabled so Swagger UI and existing API clients keep working. |
| **Rate limiting** | express-rate-limit: stricter window for /api/auth/*, general limit for other /api/* routes. **Webhooks** (/api/webhooks/*) are unchanged (registered before the limiter). **/api-docs** is excluded from the general limiter (path prefix skip). Optional env: RATE_LIMIT_AUTH_MAX, RATE_LIMIT_API_MAX. |
| **Production Swagger** | In NODE_ENV=production, /api-docs is **off** unless ENABLE_API_DOCS=true. Interactive “Try it out” in production requires ENABLE_SWAGGER_INTERACTIVE=true. Development behavior is unchanged (docs on, interactive on). |
| **Reverse proxy** | trust proxy is set to 1 when NODE_ENV=production or TRUST_PROXY=true/1, so rate limits use the real client IP behind Railway/nginx. |

---

## 3. Security measures already in place

| Measure | Implementation |
|---------|----------------|
| **Authentication** | JWT-based access via Authorization: Bearer tokens; dedicated middleware verifies tokens and enforces roles (e.g. admin). |
| **Password storage** | Passwords hashed with **bcrypt** (cost factor **12**) for user signup, login, password reset, and admin creation—not stored in plain text. |
| **CORS** | Origin allowlist via ALLOWED_ORIGINS (comma-separated); credentials supported for cookie-aware clients when configured with a strict production list. |
| **Stripe webhooks** | Webhook route registered **before** express.json() using **raw body**; events verified with **Stripe signature** (constructEvent) when STRIPE_WEBHOOK_SECRET is set. |
| **Other webhooks** | Bunny and Mux webhook endpoints similarly use raw body handlers suitable for signature or payload verification in their respective controllers. |
| **Role-based access** | Admin and instructor capabilities are gated in middleware after token validation, reducing accidental exposure of privileged routes. |
| **Secrets configuration** | Sensitive values (database URL, JWT secret, OAuth, SMTP, Stripe, etc.) are intended for environment variables—not committed secrets in source control. |
| **Security headers & abuse limits** | Helmet (non-CSP defaults), per-route rate limits, and production-safe Swagger defaults (see §2b). |

---

## 4. Strengths and good practices

**Modern stack:** Prisma 7 and PostgreSQL support maintainable schema evolution and reliable migrations in production (prisma migrate deploy).
**Payment integration:** Stripe subscription-oriented webhook flow is structured to separate subscription lifecycle events from deprecated per-course paths.
**Operational readiness:** Dockerfile includes OpenSSL for Prisma on slim images; startup script runs migrations before serving traffic.
**Rich domain model:** Schema covers users, courses, enrollments, subscriptions, documents, vault/social features, and live streaming—aligned with a full LMS product.
**Third-party boundaries:** Card data is delegated to Stripe; the API focuses on business logic and webhook-driven state sync rather than handling raw card numbers.

---

## 5. Planned enhancements (remaining)

The **high-priority** security items (Helmet, rate limiting, production Swagger posture) are **implemented** (see §2b). The table below is the **backlog** for a later phase.

| Priority | Enhancement | How we will approach it (summary) |
|----------|-------------|-----------------------------------|
| Medium | **Request body size policy** | Audit routes that truly need large bodies (e.g. uploads via Multer); lower express.json / urlencoded defaults; keep higher limits only on upload paths so the API stays resilient to oversized JSON DoS. |
| Medium | **Production error responses** | In errorHandler, map unknown errors to a generic client message when NODE_ENV=production, keep err.stack / details only in server logs; preserve existing status codes and Prisma mappings (P2002, P2025). |
| Medium | **Startup / seed behavior** | Review start.sh / npm start: make seed.js strictly idempotent or run seeds only in CI/staging; avoid mutating production data on every deploy unless intended. |
| Ongoing | **Secrets & access** | Document rotation for JWT_SECRET, Stripe keys, DB credentials; use host secrets manager; separate DB roles (app vs migrate) if requirements grow. |
| Ongoing | **Monitoring & incident response** | Add structured logging (JSON), health/alerts for 5xx and webhook failures, optional APM; write a short incident checklist (who to notify, how to rotate keys). |
| Legal / product (parallel)** | **US privacy & consumer expectations** | Legal owns policies and DPAs; product/engineering add consent flows, data export/delete where required, and retention—often frontend + a few API endpoints—not a single backend-only change. |

**Parallel track with legal/product—not a substitute for engineering items above.*

---

## 6. Closing

The backend demonstrates **solid engineering structure**, **responsible handling of passwords and payment webhooks**, and **layered hardening** (headers, rate limits, production Swagger defaults). The **remaining enhancements** in §5 are the next concrete operations and compliance-oriented improvements when the client is ready.

---

Document version: 1.1 — High-priority security hardening implemented; backlog in §5.