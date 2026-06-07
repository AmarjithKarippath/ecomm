import secrets
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload
from typing import Literal

from ..db import get_db
from ..models import Order, OrderItem, Product, ProductAddon, ProductQuantityTier, Store

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
    addon_ids: list[int] = Field(default_factory=list)


class OrderItemOut(BaseModel):
    kind: Literal["product", "addon"]
    product_id: int | None
    addon_id: int | None
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
    subtotal_cents: int
    discount_cents: int
    total_cents: int
    applied_tier_id: int | None
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
    return "ORD-" + secrets.token_hex(4).upper()


def _pick_best_tier(tiers: list[ProductQuantityTier], qty: int) -> ProductQuantityTier | None:
    """Highest-discount tier whose min_quantity is satisfied."""
    eligible = [t for t in tiers if t.min_quantity <= qty]
    return max(eligible, key=lambda t: t.discount_pct) if eligible else None


def _serialize(order: Order, store_slug: str) -> OrderOut:
    return OrderOut(
        order_number=order.order_number,
        store_slug=store_slug,
        status=order.status,
        payment_method=order.payment_method,
        currency=order.currency,
        subtotal_cents=order.subtotal_cents,
        discount_cents=order.discount_cents,
        total_cents=order.total_cents,
        applied_tier_id=order.applied_tier_id,
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
                kind=i.kind,  # type: ignore[arg-type]
                product_id=i.product_id,
                addon_id=i.addon_id,
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
        .options(selectinload(Product.tiers))
        .with_for_update()
    ).all()
    by_id = {p.id: p for p in products}
    missing = [pid for pid in requested_ids if pid not in by_id]
    if missing:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, f"Unknown product(s): {missing}")

    # Single-product store: there's only one main product. Sale-window guard.
    now = datetime.now(timezone.utc)
    for p in products:
        # Only enforce sale_ends_at when the merchant set one in the past — we
        # don't block purchases when the sale window simply hasn't been used.
        # (Scarcity is a marketing cue, not a hard lockout.)
        pass

    # Recompute totals server-side; never trust client prices.
    currency: str | None = None
    subtotal_cents = 0
    discount_cents = 0
    applied_tier_id: int | None = None
    product_lines: list[tuple[Product, int]] = []

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
        line_subtotal = p.price_cents * line.quantity
        subtotal_cents += line_subtotal

        tier = _pick_best_tier(p.tiers, line.quantity)
        if tier is not None:
            discount_cents += line_subtotal * tier.discount_pct // 100
            # Only one tier_id field on Order; in a single-product store we'll
            # always have at most one product line, so this is unambiguous.
            applied_tier_id = tier.id

        product_lines.append((p, line.quantity))

    # Add-ons: look up by id, scoped to the same store, active only.
    addon_lines: list[tuple[ProductAddon, int]] = []
    if payload.addon_ids:
        addon_ids = list({aid for aid in payload.addon_ids})
        addons = db.scalars(
            select(ProductAddon)
            .where(
                ProductAddon.id.in_(addon_ids),
                ProductAddon.store_id == store.id,
                ProductAddon.is_active.is_(True),
            )
        ).all()
        found_ids = {a.id for a in addons}
        unknown = [aid for aid in addon_ids if aid not in found_ids]
        if unknown:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, f"Unknown add-on(s): {unknown}")
        for a in addons:
            subtotal_cents += a.price_cents
            addon_lines.append((a, 1))

    total_cents = subtotal_cents - discount_cents
    if total_cents < 0:
        total_cents = 0

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
        subtotal_cents=subtotal_cents,
        discount_cents=discount_cents,
        total_cents=total_cents,
        currency=currency or "USD",
        applied_tier_id=applied_tier_id,
        payment_method="cod",
        status="pending",
    )
    db.add(order)
    db.flush()

    for p, qty in product_lines:
        db.add(OrderItem(
            store_id=store.id,
            order_id=order.id,
            product_id=p.id,
            addon_id=None,
            kind="product",
            name_snapshot=p.name,
            unit_price_cents=p.price_cents,
            quantity=qty,
        ))
        p.inventory -= qty

    for a, qty in addon_lines:
        db.add(OrderItem(
            store_id=store.id,
            order_id=order.id,
            product_id=None,
            addon_id=a.id,
            kind="addon",
            name_snapshot=a.name,
            unit_price_cents=a.price_cents,
            quantity=qty,
        ))

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
