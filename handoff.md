# Project Handoff — E-commerce Platform (Shopify / Dukaan style)

_Last updated: 2026-05-31_

## 1. What we're building

A multi-tenant e-commerce platform where a merchant can sign up, add products, connect payments, and have a live, sellable store in **under 10 minutes**. Same core promise as Dukaan: brutal simplicity first, depth later.

**North-star journey:** signup → add product → connect Stripe → store live at a public URL → first paid order.

## 2. Goals

- **Speed to value for merchants** — store live in ~10 minutes, zero technical setup.
- **Scalable from day one (architecturally)** — design must hold up to millions of stores without a rewrite, even though the week-1 build runs on a single box.
- **Ship a working product in 1 week** — ruthlessly cut anything that doesn't break the buy flow.
- **No corner-painting** — every week-1 shortcut must map cleanly back to the scalable target architecture.

## 3. Target architecture (the long-term picture)

Layered system, top to bottom:

1. **Clients** — React merchant dashboard + React storefront (PWA-ready).
2. **Edge / CDN** — CloudFront for static assets, SSL, DDoS protection.
3. **API Gateway** — auth (JWT), rate limiting, routing, tenant resolution.
4. **Core services (FastAPI)** — Store, Product, Order, Payment, Auth, Media, Notification, Analytics.
5. **Async / event bus** — Redis Streams / SQS for order events, notifications, webhook fanout.
6. **Data layer** — PostgreSQL (multi-tenant, row-level security), Redis (cache/sessions/queues), Elasticsearch (search), S3 (media).
7. **Infrastructure** — Docker, Kubernetes (EKS), Terraform, GitHub Actions CI/CD, per-service autoscaling.
8. **Observability** — Prometheus, Grafana, Loki, Sentry, OpenTelemetry.

### Core design principles
- **Single DB, row-level security** for multi-tenancy — every table carries `store_id`. (Not one DB per store.)
- **Subdomain-per-store** (`store.platform.com`) long-term; **path-based** (`/s/{slug}`) for the MVP.
- **Stateless API + JWT** so horizontal scaling is just "run more copies."

## 4. The 1-week MVP plan

Three decisions make 1 week possible, none of which break the product:
1. **Modular monolith**, not microservices (clear module boundaries → extract to services later).
2. **Stripe Checkout (hosted page)** instead of building card/payment flows.
3. **Path-based store URLs** (`/s/{slug}`) instead of wildcard-subdomain DNS + SSL setup.

### Day-by-day build sequence

| Day | Theme | Deliverable |
|-----|-------|-------------|
| 1 | Foundation & auth | Repo + Docker Compose; 5-table schema; JWT signup/login; store created on signup |
| 2 | Product management | Product CRUD scoped by `store_id`; image upload; dashboard skeleton (login, product list, add/edit form) |
| 3 | **Storefront** | Public store page `/s/{slug}`, product grid + detail, cart _(critical path)_ |
| 4 | **Checkout & payments** | Stripe Checkout session, order write, payment webhook, idempotency _(critical path)_ |
| 5 | **Orders & notifications** | Confirmation emails (buyer + merchant), merchant orders list _(critical path)_ |
| 6 | Onboarding & polish | 10-minute setup wizard, store settings, responsive styling |
| 7 | Deploy & test | Single managed host + managed Postgres, end-to-end test, Sentry, basic rate limiting |

> **Critical path = Days 3–5.** If the buy flow breaks, there is no product. Do not shortcut these.

### Tech stack (MVP)
- **Frontend:** React + Vite (dashboard). Storefront client-rendered for week 1; SSR (Next.js) is a Phase 2 SEO task.
- **Backend:** FastAPI (Python 3.12) as a modular monolith.
- **DB:** PostgreSQL 16, SQLAlchemy 2.0 (sync for week-1 reliability; async swap noted as future).
- **Cache/queue:** Redis 7.
- **Payments:** Stripe Checkout + webhooks.
- **Storage:** S3 (with a local-disk fallback so it runs out of the box in dev).
- **Email:** Resend or SES (one transactional template).
- **Deploy:** Railway / Render / Fly.io + managed Postgres. **No Kubernetes in week 1.**

## 5. Scope: in vs. deferred

**In scope (breaks the product if missing)**
- Email/password signup + JWT auth
- Product CRUD + images
- Public storefront + cart
- Stripe Checkout + payment webhook
- Order record + confirmation email
- Merchant orders list
- Path-based store URL `/s/{slug}`

**Deferred to Phase 1.5 / 2 (does not break the sale)**
- OTP / OAuth login, password reset
- Product variants, inventory holds, bulk import
- Themes / marketplace, SSR, custom domains
- Razorpay, multi-currency, refunds UI
- SMS/push, abandoned cart, async queue
- Analytics dashboard, Elasticsearch search
- Wildcard subdomains + automated SSL

## 6. Decisions that preserve scalability
- **`store_id` on every table from migration #1** — preserves multi-tenancy; adding Postgres RLS later is a policy change, not a rewrite.
- **Modular monolith with clear module names** (`auth`, `stores`, `products`, `orders`, `payments`) — extract to services along existing seams.
- **Stateless API + JWT** — scale horizontally by adding instances behind a load balancer.
- **Managed Postgres** — read replicas and pooling are a config change later.

## 7. Next steps (immediate)

We are starting to **code Day 1 + Day 2** now:

**Day 1**
- Scaffold repo + Docker Compose (FastAPI + Postgres + Redis + Vite).
- Define schema: `stores`, `users`, `products`, `orders`, `order_items` (all carry `store_id`).
- Build JWT email/password auth; on signup, atomically create the user **and** their store (with generated unique slug).

**Day 2**
- Product CRUD endpoints, all scoped to the caller's `store_id` via an auth dependency.
- Image upload endpoint (S3 when configured, local-disk fallback in dev).
- Merchant dashboard skeleton: login screen, product list table, add/edit product form, API client.

**Open items / assumptions to confirm**
- Team is fluent in FastAPI + React + Stripe (if learning, pad to 2 weeks — do not cut Days 3–5).
- Stripe account available for test keys.
- Choice of managed host for Day 7 (Railway / Render / Fly.io).
- Email provider decision (Resend vs SES).
