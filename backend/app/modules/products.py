from datetime import datetime

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from ..db import get_db
from ..deps import get_current_user
from ..models import Product, ProductAddon, ProductImage, ProductQuantityTier, User
from ..storage import save_image

router = APIRouter(prefix="/products", tags=["products"])

MAX_IMAGE_BYTES = 5 * 1024 * 1024
ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
MAX_GALLERY_IMAGES = 8
MAX_TIERS = 6
MAX_ADDONS = 6


# ---------- schemas ----------

class ProductImageIn(BaseModel):
    url: str = Field(min_length=1, max_length=500)
    alt: str | None = Field(default=None, max_length=200)
    position: int = Field(default=0, ge=0, le=99)


class ProductImageOut(ProductImageIn):
    id: int


class ProductTierIn(BaseModel):
    min_quantity: int = Field(ge=1, le=999)
    discount_pct: int = Field(ge=1, le=99)


class ProductTierOut(ProductTierIn):
    id: int


class ProductAddonIn(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    description: str | None = Field(default=None, max_length=400)
    price_cents: int = Field(ge=0)
    image_url: str | None = Field(default=None, max_length=500)
    is_active: bool = True
    position: int = Field(default=0, ge=0, le=99)


class ProductAddonOut(ProductAddonIn):
    id: int


class ProductIn(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    subtitle: str | None = Field(default=None, max_length=280)
    description: str | None = None
    price_cents: int = Field(ge=0)
    compare_at_price_cents: int | None = Field(default=None, ge=0)
    currency: str = Field(default="USD", min_length=3, max_length=3)
    image_url: str | None = None
    inventory: int = Field(default=0, ge=0)
    sale_ends_at: datetime | None = None
    low_stock_threshold: int = Field(default=0, ge=0)


class ProductOut(ProductIn):
    id: int
    store_id: int
    images: list[ProductImageOut] = []
    tiers: list[ProductTierOut] = []
    addons: list[ProductAddonOut] = []


# ---------- serialisers ----------

def _img(i: ProductImage) -> ProductImageOut:
    return ProductImageOut(id=i.id, url=i.url, alt=i.alt, position=i.position)


def _tier(t: ProductQuantityTier) -> ProductTierOut:
    return ProductTierOut(id=t.id, min_quantity=t.min_quantity, discount_pct=t.discount_pct)


def _addon(a: ProductAddon) -> ProductAddonOut:
    return ProductAddonOut(
        id=a.id, name=a.name, description=a.description, price_cents=a.price_cents,
        image_url=a.image_url, is_active=a.is_active, position=a.position,
    )


def _to_out(p: Product) -> ProductOut:
    return ProductOut(
        id=p.id,
        store_id=p.store_id,
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
        images=[_img(i) for i in p.images],
        tiers=[_tier(t) for t in p.tiers],
        addons=[_addon(a) for a in p.addons],
    )


# ---------- helpers ----------

def _load_owned_product(db: Session, product_id: int, store_id: int) -> Product:
    p = db.scalar(
        select(Product)
        .where(Product.id == product_id, Product.store_id == store_id)
        .options(
            selectinload(Product.images),
            selectinload(Product.tiers),
            selectinload(Product.addons),
        )
    )
    if not p:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Product not found")
    return p


def _existing_product_id(db: Session, store_id: int) -> int | None:
    return db.scalar(select(Product.id).where(Product.store_id == store_id))


# ---------- main product ----------

@router.get("", response_model=list[ProductOut])
def list_products(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    rows = db.scalars(
        select(Product)
        .where(Product.store_id == user.store_id)
        .options(
            selectinload(Product.images),
            selectinload(Product.tiers),
            selectinload(Product.addons),
        )
        .order_by(Product.id.desc())
    ).all()
    return [_to_out(p) for p in rows]


@router.post("", response_model=ProductOut, status_code=status.HTTP_201_CREATED)
def create_product(payload: ProductIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if _existing_product_id(db, user.store_id) is not None:
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            "This store already has a product. Single-product stores are capped at one.",
        )
    p = Product(store_id=user.store_id, **payload.model_dump())
    db.add(p)
    db.commit()
    return _to_out(_load_owned_product(db, p.id, user.store_id))


@router.get("/{product_id}", response_model=ProductOut)
def get_product(product_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return _to_out(_load_owned_product(db, product_id, user.store_id))


@router.put("/{product_id}", response_model=ProductOut)
def update_product(
    product_id: int,
    payload: ProductIn,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    p = _load_owned_product(db, product_id, user.store_id)
    for k, v in payload.model_dump().items():
        setattr(p, k, v)
    db.commit()
    return _to_out(_load_owned_product(db, p.id, user.store_id))


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(product_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    p = _load_owned_product(db, product_id, user.store_id)
    db.delete(p)
    db.commit()


# ---------- images (upload + gallery) ----------

@router.post("/images", status_code=status.HTTP_201_CREATED)
async def upload_image(file: UploadFile = File(...), user: User = Depends(get_current_user)):
    """Upload an image and get back a URL. The URL can then be attached to the
    product (as image_url, an addon image_url, or as a gallery entry)."""
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(status.HTTP_415_UNSUPPORTED_MEDIA_TYPE, "Unsupported image type")
    data = await file.read()
    if len(data) > MAX_IMAGE_BYTES:
        raise HTTPException(status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, "Image too large (5MB max)")
    url = save_image(
        store_id=user.store_id,
        filename=file.filename or "upload",
        data=data,
        content_type=file.content_type,
    )
    return {"url": url}


@router.post("/{product_id}/gallery", response_model=ProductImageOut, status_code=status.HTTP_201_CREATED)
def add_gallery_image(
    product_id: int,
    payload: ProductImageIn,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    p = _load_owned_product(db, product_id, user.store_id)
    if len(p.images) >= MAX_GALLERY_IMAGES:
        raise HTTPException(status.HTTP_409_CONFLICT, f"Gallery capped at {MAX_GALLERY_IMAGES} images")
    img = ProductImage(
        store_id=user.store_id, product_id=p.id,
        url=payload.url, alt=payload.alt, position=payload.position,
    )
    db.add(img)
    db.commit()
    db.refresh(img)
    return _img(img)


@router.delete("/{product_id}/gallery/{image_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_gallery_image(
    product_id: int, image_id: int,
    user: User = Depends(get_current_user), db: Session = Depends(get_db),
):
    img = db.get(ProductImage, image_id)
    if not img or img.store_id != user.store_id or img.product_id != product_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Image not found")
    db.delete(img)
    db.commit()


# ---------- quantity tiers ----------

@router.post("/{product_id}/tiers", response_model=ProductTierOut, status_code=status.HTTP_201_CREATED)
def add_tier(
    product_id: int, payload: ProductTierIn,
    user: User = Depends(get_current_user), db: Session = Depends(get_db),
):
    p = _load_owned_product(db, product_id, user.store_id)
    if len(p.tiers) >= MAX_TIERS:
        raise HTTPException(status.HTTP_409_CONFLICT, f"At most {MAX_TIERS} tiers per product")
    if any(t.min_quantity == payload.min_quantity for t in p.tiers):
        raise HTTPException(status.HTTP_409_CONFLICT, "A tier with that min_quantity already exists")
    t = ProductQuantityTier(
        store_id=user.store_id, product_id=p.id,
        min_quantity=payload.min_quantity, discount_pct=payload.discount_pct,
    )
    db.add(t)
    db.commit()
    db.refresh(t)
    return _tier(t)


@router.delete("/{product_id}/tiers/{tier_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_tier(
    product_id: int, tier_id: int,
    user: User = Depends(get_current_user), db: Session = Depends(get_db),
):
    t = db.get(ProductQuantityTier, tier_id)
    if not t or t.store_id != user.store_id or t.product_id != product_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Tier not found")
    db.delete(t)
    db.commit()


# ---------- addons ----------

@router.post("/{product_id}/addons", response_model=ProductAddonOut, status_code=status.HTTP_201_CREATED)
def add_addon(
    product_id: int, payload: ProductAddonIn,
    user: User = Depends(get_current_user), db: Session = Depends(get_db),
):
    p = _load_owned_product(db, product_id, user.store_id)
    if len(p.addons) >= MAX_ADDONS:
        raise HTTPException(status.HTTP_409_CONFLICT, f"At most {MAX_ADDONS} add-ons per product")
    a = ProductAddon(store_id=user.store_id, product_id=p.id, **payload.model_dump())
    db.add(a)
    db.commit()
    db.refresh(a)
    return _addon(a)


@router.put("/{product_id}/addons/{addon_id}", response_model=ProductAddonOut)
def update_addon(
    product_id: int, addon_id: int, payload: ProductAddonIn,
    user: User = Depends(get_current_user), db: Session = Depends(get_db),
):
    a = db.get(ProductAddon, addon_id)
    if not a or a.store_id != user.store_id or a.product_id != product_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Add-on not found")
    for k, v in payload.model_dump().items():
        setattr(a, k, v)
    db.commit()
    db.refresh(a)
    return _addon(a)


@router.delete("/{product_id}/addons/{addon_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_addon(
    product_id: int, addon_id: int,
    user: User = Depends(get_current_user), db: Session = Depends(get_db),
):
    a = db.get(ProductAddon, addon_id)
    if not a or a.store_id != user.store_id or a.product_id != product_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Add-on not found")
    db.delete(a)
    db.commit()
