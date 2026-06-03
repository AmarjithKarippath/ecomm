from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from ..db import get_db
from ..deps import get_current_user
from ..models import Order, User

router = APIRouter(prefix="/orders", tags=["orders"])

# pending → confirmed → shipped → delivered. cancelled is terminal.
ALLOWED_TRANSITIONS: dict[str, set[str]] = {
    "pending": {"confirmed", "cancelled"},
    "confirmed": {"shipped", "cancelled"},
    "shipped": {"delivered", "cancelled"},
    "delivered": set(),
    "cancelled": set(),
}
ALL_STATUSES = list(ALLOWED_TRANSITIONS.keys())


class OrderItemOut(BaseModel):
    product_id: int
    name: str
    unit_price_cents: int
    quantity: int
    line_total_cents: int


class OrderSummary(BaseModel):
    id: int
    order_number: str
    status: str
    payment_method: str
    currency: str
    total_cents: int
    item_count: int
    buyer_email: str
    shipping_name: str
    city: str
    country: str
    created_at: str


class OrderDetail(OrderSummary):
    shipping_phone: str
    address_line1: str
    address_line2: str | None
    state: str | None
    postal_code: str
    notes: str | None
    items: list[OrderItemOut]
    allowed_next_statuses: list[str]


class StatusUpdateIn(BaseModel):
    status: str = Field(pattern="^(pending|confirmed|shipped|delivered|cancelled)$")


def _summary(o: Order, item_count: int) -> OrderSummary:
    return OrderSummary(
        id=o.id,
        order_number=o.order_number,
        status=o.status,
        payment_method=o.payment_method,
        currency=o.currency,
        total_cents=o.total_cents,
        item_count=item_count,
        buyer_email=o.buyer_email,
        shipping_name=o.shipping_name,
        city=o.city,
        country=o.country,
        created_at=o.created_at.isoformat(),
    )


def _detail(o: Order) -> OrderDetail:
    return OrderDetail(
        id=o.id,
        order_number=o.order_number,
        status=o.status,
        payment_method=o.payment_method,
        currency=o.currency,
        total_cents=o.total_cents,
        item_count=sum(i.quantity for i in o.items),
        buyer_email=o.buyer_email,
        shipping_name=o.shipping_name,
        city=o.city,
        country=o.country,
        created_at=o.created_at.isoformat(),
        shipping_phone=o.shipping_phone,
        address_line1=o.address_line1,
        address_line2=o.address_line2,
        state=o.state,
        postal_code=o.postal_code,
        notes=o.notes,
        items=[
            OrderItemOut(
                product_id=i.product_id,
                name=i.name_snapshot,
                unit_price_cents=i.unit_price_cents,
                quantity=i.quantity,
                line_total_cents=i.unit_price_cents * i.quantity,
            )
            for i in o.items
        ],
        allowed_next_statuses=sorted(ALLOWED_TRANSITIONS[o.status]),
    )


@router.get("", response_model=list[OrderSummary])
def list_orders(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    status_filter: str | None = None,
):
    stmt = (
        select(Order)
        .where(Order.store_id == user.store_id)
        .options(selectinload(Order.items))
        .order_by(Order.id.desc())
    )
    if status_filter:
        if status_filter not in ALL_STATUSES:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid status filter")
        stmt = stmt.where(Order.status == status_filter)
    rows = db.scalars(stmt).all()
    return [_summary(o, sum(i.quantity for i in o.items)) for o in rows]


@router.get("/stats")
def order_stats(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    rows = db.execute(
        select(Order.status, func.count(Order.id), func.coalesce(func.sum(Order.total_cents), 0))
        .where(Order.store_id == user.store_id)
        .group_by(Order.status)
    ).all()
    by_status = {s: {"count": int(c), "total_cents": int(t)} for s, c, t in rows}
    for s in ALL_STATUSES:
        by_status.setdefault(s, {"count": 0, "total_cents": 0})
    return by_status


def _get_owned(db: Session, order_id: int, store_id: int) -> Order:
    o = db.scalar(
        select(Order)
        .where(Order.id == order_id, Order.store_id == store_id)
        .options(selectinload(Order.items))
    )
    if not o:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Order not found")
    return o


@router.get("/{order_id}", response_model=OrderDetail)
def get_order(order_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return _detail(_get_owned(db, order_id, user.store_id))


@router.patch("/{order_id}/status", response_model=OrderDetail)
def update_status(
    order_id: int,
    payload: StatusUpdateIn,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    o = _get_owned(db, order_id, user.store_id)
    if payload.status == o.status:
        return _detail(o)
    allowed = ALLOWED_TRANSITIONS[o.status]
    if payload.status not in allowed:
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            f"Cannot transition from '{o.status}' to '{payload.status}'. Allowed: {sorted(allowed) or 'none (terminal)'}",
        )
    o.status = payload.status
    db.commit()
    db.refresh(o)
    return _detail(o)
