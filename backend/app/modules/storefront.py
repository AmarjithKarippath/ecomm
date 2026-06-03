from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..db import get_db
from ..models import Product, Store

router = APIRouter(prefix="/public/stores", tags=["storefront"])


class PublicStore(BaseModel):
    id: int
    name: str
    slug: str


class PublicProduct(BaseModel):
    id: int
    name: str
    description: str | None
    price_cents: int
    currency: str
    image_url: str | None
    inventory: int


class StorePage(BaseModel):
    store: PublicStore
    products: list[PublicProduct]


def _get_store(db: Session, slug: str) -> Store:
    store = db.scalar(select(Store).where(Store.slug == slug))
    if not store:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Store not found")
    return store


def _to_product(p: Product) -> PublicProduct:
    return PublicProduct(
        id=p.id,
        name=p.name,
        description=p.description,
        price_cents=p.price_cents,
        currency=p.currency,
        image_url=p.image_url,
        inventory=p.inventory,
    )


@router.get("/{slug}", response_model=StorePage)
def get_store(slug: str, db: Session = Depends(get_db)):
    store = _get_store(db, slug)
    products = db.scalars(
        select(Product).where(Product.store_id == store.id).order_by(Product.id.desc())
    ).all()
    return StorePage(
        store=PublicStore(id=store.id, name=store.name, slug=store.slug),
        products=[_to_product(p) for p in products],
    )


@router.get("/{slug}/products/{product_id}", response_model=PublicProduct)
def get_product(slug: str, product_id: int, db: Session = Depends(get_db)):
    store = _get_store(db, slug)
    p = db.get(Product, product_id)
    if not p or p.store_id != store.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Product not found")
    return _to_product(p)
