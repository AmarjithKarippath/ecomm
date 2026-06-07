from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from ..db import get_db
from ..models import Product, Store

router = APIRouter(prefix="/public/stores", tags=["storefront"])


# ---------- schemas ----------

class PublicStore(BaseModel):
    id: int
    name: str
    slug: str


class PublicImage(BaseModel):
    id: int
    url: str
    alt: str | None
    position: int


class PublicTier(BaseModel):
    id: int
    min_quantity: int
    discount_pct: int


class PublicAddon(BaseModel):
    id: int
    name: str
    description: str | None
    price_cents: int
    image_url: str | None


class PublicProduct(BaseModel):
    id: int
    name: str
    subtitle: str | None
    description: str | None
    price_cents: int
    compare_at_price_cents: int | None
    currency: str
    image_url: str | None
    inventory: int
    sale_ends_at: datetime | None
    low_stock_threshold: int
    images: list[PublicImage]
    tiers: list[PublicTier]
    addons: list[PublicAddon]


class StorePage(BaseModel):
    store: PublicStore
    product: PublicProduct | None  # None when the merchant hasn't created one yet


# ---------- helpers ----------

def _get_store(db: Session, slug: str) -> Store:
    store = db.scalar(select(Store).where(Store.slug == slug))
    if not store:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Store not found")
    return store


def _to_product(p: Product) -> PublicProduct:
    return PublicProduct(
        id=p.id,
        name=p.name,
        subtitle=p.subtitle,
        description=p.description,
        price_cents=p.price_cents,
        compare_at_price_cents=p.compare_at_price_cents,
        currency=p.currency,
        image_url=p.image_url,
        inventory=p.inventory,
        sale_ends_at=p.sale_ends_at,
        low_stock_threshold=p.low_stock_threshold,
        images=[PublicImage(id=i.id, url=i.url, alt=i.alt, position=i.position) for i in p.images],
        tiers=[PublicTier(id=t.id, min_quantity=t.min_quantity, discount_pct=t.discount_pct) for t in p.tiers],
        addons=[
            PublicAddon(
                id=a.id, name=a.name, description=a.description,
                price_cents=a.price_cents, image_url=a.image_url,
            )
            for a in p.addons if a.is_active
        ],
    )


# ---------- routes ----------

@router.get("/{slug}", response_model=StorePage)
def get_store(slug: str, db: Session = Depends(get_db)):
    store = _get_store(db, slug)
    product = db.scalar(
        select(Product)
        .where(Product.store_id == store.id)
        .options(
            selectinload(Product.images),
            selectinload(Product.tiers),
            selectinload(Product.addons),
        )
        .order_by(Product.id.desc())
    )
    return StorePage(
        store=PublicStore(id=store.id, name=store.name, slug=store.slug),
        product=_to_product(product) if product else None,
    )


@router.get("/{slug}/products/{product_id}", response_model=PublicProduct)
def get_product(slug: str, product_id: int, db: Session = Depends(get_db)):
    """Kept for backwards compatibility with the old multi-product URLs."""
    store = _get_store(db, slug)
    p = db.scalar(
        select(Product)
        .where(Product.id == product_id, Product.store_id == store.id)
        .options(
            selectinload(Product.images),
            selectinload(Product.tiers),
            selectinload(Product.addons),
        )
    )
    if not p:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Product not found")
    return _to_product(p)
