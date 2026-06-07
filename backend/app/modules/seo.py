"""Public SEO endpoints.

These are intentionally cheap (one DB query, in-memory render) so they can be
hit by Googlebot without burning a worker.
"""
import os
from datetime import datetime, timezone
from xml.sax.saxutils import escape

from fastapi import APIRouter, Depends, Response
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..db import get_db
from ..models import Product, Store

router = APIRouter(tags=["seo"])

# The PUBLIC hostname where storefronts live (app.sainsberry.com in prod).
# Override per environment via env var.
STOREFRONT_BASE = os.environ.get("STOREFRONT_BASE", "http://localhost:5173").rstrip("/")


def _utc(dt: datetime | None) -> str:
    if dt is None:
        return datetime.now(timezone.utc).date().isoformat()
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.date().isoformat()


@router.get("/robots.txt", include_in_schema=False)
def robots_txt() -> Response:
    body = (
        "User-agent: *\n"
        "Allow: /\n"
        "Disallow: /docs\n"
        "Disallow: /openapi.json\n"
        f"Sitemap: {STOREFRONT_BASE}/sitemap.xml\n"
    )
    return Response(content=body, media_type="text/plain")


@router.get("/sitemap.xml", include_in_schema=False)
def sitemap_xml(db: Session = Depends(get_db)) -> Response:
    """Sitemap of every published storefront and its product page.

    Format: standard <urlset> per sitemaps.org. Capped implicitly by query
    size — past ~50k URLs we'd shard into a sitemap index. Out of scope today.
    """
    rows = db.execute(
        select(Store.slug, Product.id, Product.created_at)
        .join(Product, Product.store_id == Store.id, isouter=True)
        .order_by(Store.created_at.desc())
    ).all()

    seen_slugs: set[str] = set()
    urls: list[str] = []

    for slug, product_id, product_created in rows:
        loc = f"{STOREFRONT_BASE}/s/{slug}"
        if slug in seen_slugs:
            continue
        seen_slugs.add(slug)
        urls.append(
            "<url>"
            f"<loc>{escape(loc)}</loc>"
            f"<lastmod>{_utc(product_created)}</lastmod>"
            "<changefreq>daily</changefreq>"
            "<priority>0.8</priority>"
            "</url>"
        )

    body = (
        '<?xml version="1.0" encoding="UTF-8"?>'
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
        + "".join(urls)
        + "</urlset>"
    )
    return Response(content=body, media_type="application/xml")
