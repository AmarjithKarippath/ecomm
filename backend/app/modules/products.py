from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..db import get_db
from ..deps import get_current_user
from ..models import Product, User
from ..storage import save_image

router = APIRouter(prefix="/products", tags=["products"])

MAX_IMAGE_BYTES = 5 * 1024 * 1024
ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}


class ProductIn(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    description: str | None = None
    price_cents: int = Field(ge=0)
    currency: str = Field(default="USD", min_length=3, max_length=3)
    image_url: str | None = None
    inventory: int = Field(default=0, ge=0)


class ProductOut(ProductIn):
    id: int
    store_id: int


def _to_out(p: Product) -> ProductOut:
    return ProductOut(
        id=p.id,
        store_id=p.store_id,
        name=p.name,
        description=p.description,
        price_cents=p.price_cents,
        currency=p.currency,
        image_url=p.image_url,
        inventory=p.inventory,
    )


def _get_owned(db: Session, product_id: int, store_id: int) -> Product:
    p = db.get(Product, product_id)
    if not p or p.store_id != store_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Product not found")
    return p


@router.get("", response_model=list[ProductOut])
def list_products(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    rows = db.scalars(
        select(Product).where(Product.store_id == user.store_id).order_by(Product.id.desc())
    ).all()
    return [_to_out(p) for p in rows]


@router.post("", response_model=ProductOut, status_code=status.HTTP_201_CREATED)
def create_product(payload: ProductIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    p = Product(store_id=user.store_id, **payload.model_dump())
    db.add(p)
    db.commit()
    db.refresh(p)
    return _to_out(p)


@router.get("/{product_id}", response_model=ProductOut)
def get_product(product_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return _to_out(_get_owned(db, product_id, user.store_id))


@router.put("/{product_id}", response_model=ProductOut)
def update_product(
    product_id: int,
    payload: ProductIn,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    p = _get_owned(db, product_id, user.store_id)
    for k, v in payload.model_dump().items():
        setattr(p, k, v)
    db.commit()
    db.refresh(p)
    return _to_out(p)


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(product_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    p = _get_owned(db, product_id, user.store_id)
    db.delete(p)
    db.commit()


@router.post("/images", status_code=status.HTTP_201_CREATED)
async def upload_image(file: UploadFile = File(...), user: User = Depends(get_current_user)):
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
