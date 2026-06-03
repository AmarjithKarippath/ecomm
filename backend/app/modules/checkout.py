import secrets

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..db import get_db
from ..models import Order, OrderItem, Product, Store

router = APIRouter(prefix="/public", tags=["checkout"])


class CartItemIn(BaseModel):
    product_id: int
    quantity: int = Field(ge=1, le=999)


class CheckoutIn(BaseModel):
    buyer_email: EmailStr
    shipping_name: str = Field(min_length=1, max_length=120)
    shipping_phone: str = Field(min_length=4, max_length=40)
    address_line1: str = Field(min_length=1, max_length=200)
    address_line2: str | None = Field(default=None, max_length=200)
    city: str = Field(min_length=1, max_length=120)
    state: str | None = Field(default=None, max_length=120)
    postal_code: str = Field(min_length=1, max_length=20)
    country: str = Field(min_length=2, max_length=2, description="ISO 3166-1 alpha-2")
    notes: str | None = None
    items: list[CartItemIn] = Field(min_length=1)


class OrderItemOut(BaseModel):
    product_id: int
    name: str
    unit_price_cents: int
    quantity: int
    line_total_cents: int


class OrderOut(BaseModel):
    order_number: str
    store_slug: str
    status: str
    payment_method: str
    currency: str
    total_cents: int
    buyer_email: EmailStr
    shipping_name: str
    shipping_phone: str
    address_line1: str
    address_line2: str | None
    city: str
    state: str | None
    postal_code: str
    country: str
    notes: str | None
    items: list[OrderItemOut]


def _generate_order_number() -> str:
    # Short, URL-safe, unguessable. e.g. "ORD-7HJ4K2QF"
    return "ORD-" + secrets.token_hex(4).upper()


def _serialize(order: Order, store_slug: str) -> OrderOut:
    return OrderOut(
        order_number=order.order_number,
        store_slug=store_slug,
        status=order.status,
        payment_method=order.payment_method,
        currency=order.currency,
        total_cents=order.total_cents,
        buyer_email=order.buyer_email,
        shipping_name=order.shipping_name,
        shipping_phone=order.shipping_phone,
        address_line1=order.address_line1,
        address_line2=order.address_line2,
        city=order.city,
        state=order.state,
        postal_code=order.postal_code,
        country=order.country,
        notes=order.notes,
        items=[
            OrderItemOut(
                product_id=i.product_id,
                name=i.name_snapshot,
                unit_price_cents=i.unit_price_cents,
                quantity=i.quantity,
                line_total_cents=i.unit_price_cents * i.quantity,
            )
            for i in order.items
        ],
    )


@router.post("/stores/{slug}/checkout", response_model=OrderOut, status_code=status.HTTP_201_CREATED)
def checkout_cod(slug: str, payload: CheckoutIn, db: Session = Depends(get_db)):
    store = db.scalar(select(Store).where(Store.slug == slug))
    if not store:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Store not found")

    # Lock product rows we touch so two simultaneous orders can't oversell.
    requested_ids = list({i.product_id for i in payload.items})
    products = db.scalars(
        select(Product)
        .where(Product.store_id == store.id, Product.id.in_(requested_ids))
        .with_for_update()
    ).all()
    by_id = {p.id: p for p in products}
    missing = [pid for pid in requested_ids if pid not in by_id]
    if missing:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, f"Unknown product(s): {missing}")

    # Recompute totals server-side; never trust client prices.
    currency: str | None = None
    total_cents = 0
    items_to_create: list[tuple[Product, int]] = []
    for line in payload.items:
        p = by_id[line.product_id]
        if currency is None:
            currency = p.currency
        elif p.currency != currency:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Mixed currencies in cart")
        if p.inventory < line.quantity:
            raise HTTPException(
                status.HTTP_409_CONFLICT,
                f"Not enough inventory for '{p.name}' (have {p.inventory}, need {line.quantity})",
            )
        items_to_create.append((p, line.quantity))
        total_cents += p.price_cents * line.quantity

    order = Order(
        store_id=store.id,
        order_number=_generate_order_number(),
        buyer_email=payload.buyer_email.lower(),
        shipping_name=payload.shipping_name.strip(),
        shipping_phone=payload.shipping_phone.strip(),
        address_line1=payload.address_line1.strip(),
        address_line2=(payload.address_line2 or None),
        city=payload.city.strip(),
        state=(payload.state or None),
        postal_code=payload.postal_code.strip(),
        country=payload.country.upper(),
        notes=payload.notes,
        total_cents=total_cents,
        currency=currency or "USD",
        payment_method="cod",
        status="pending",
    )
    db.add(order)
    db.flush()

    for p, qty in items_to_create:
        db.add(OrderItem(
            store_id=store.id,
            order_id=order.id,
            product_id=p.id,
            name_snapshot=p.name,
            unit_price_cents=p.price_cents,
            quantity=qty,
        ))
        p.inventory -= qty

    db.commit()
    db.refresh(order)
    return _serialize(order, store.slug)


@router.get("/stores/{slug}/orders/{order_number}", response_model=OrderOut)
def get_order(slug: str, order_number: str, db: Session = Depends(get_db)):
    store = db.scalar(select(Store).where(Store.slug == slug))
    if not store:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Store not found")
    order = db.scalar(
        select(Order).where(Order.store_id == store.id, Order.order_number == order_number)
    )
    if not order:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Order not found")
    return _serialize(order, store.slug)
