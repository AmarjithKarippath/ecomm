# ecomm — Multi-tenant E-commerce Platform (MVP)

Modular monolith: FastAPI + Postgres + Redis backend, React + Vite dashboard.
See `handoff.md` for the full plan. This repo currently covers **Day 1 + Day 2**:

- Auth (JWT signup/login) — store auto-created on signup
- Products CRUD scoped by `store_id`
- Image upload (S3 if configured, local-disk fallback)
- Merchant dashboard skeleton (login, product list, add/edit)

## Quick start

```bash
cp .env.example .env
docker compose up --build
```

- API:       http://localhost:8000  (docs: /docs)
- Dashboard: http://localhost:5173
- Landing:   http://localhost:3000

## Layout

```
backend/   FastAPI modular monolith
frontend/  React + Vite merchant dashboard + storefront
landing/   Next.js marketing site (Sainsberry)
```
