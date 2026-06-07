from datetime import datetime

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .db import Base


class Store(Base):
    __tablename__ = "stores"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    slug: Mapped[str] = mapped_column(String(80), unique=True, index=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class User(Base):
    __tablename__ = "users"
    __table_args__ = (UniqueConstraint("email", name="uq_users_email"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    store_id: Mapped[int] = mapped_column(ForeignKey("stores.id", ondelete="CASCADE"), index=True, nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    store: Mapped["Store"] = relationship()


class Product(Base):
    __tablename__ = "products"

    id: Mapped[int] = mapped_column(primary_key=True)
    store_id: Mapped[int] = mapped_column(ForeignKey("stores.id", ondelete="CASCADE"), index=True, nullable=False)

    # Basics
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    subtitle: Mapped[str | None] = mapped_column(String(280), nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    price_cents: Mapped[int] = mapped_column(Integer, nullable=False)
    compare_at_price_cents: Mapped[int | None] = mapped_column(Integer, nullable=True)
    currency: Mapped[str] = mapped_column(String(3), default="USD", nullable=False)

    # Hero image kept for backwards compat; gallery lives in product_images
    image_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    inventory: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    # Scarcity
    sale_ends_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    low_stock_threshold: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    images: Mapped[list["ProductImage"]] = relationship(
        back_populates="product",
        cascade="all, delete-orphan",
        order_by="ProductImage.position",
    )
    tiers: Mapped[list["ProductQuantityTier"]] = relationship(
        back_populates="product",
        cascade="all, delete-orphan",
        order_by="ProductQuantityTier.min_quantity",
    )
    addons: Mapped[list["ProductAddon"]] = relationship(
        back_populates="product",
        cascade="all, delete-orphan",
        order_by="ProductAddon.position",
    )


class ProductImage(Base):
    __tablename__ = "product_images"

    id: Mapped[int] = mapped_column(primary_key=True)
    store_id: Mapped[int] = mapped_column(ForeignKey("stores.id", ondelete="CASCADE"), index=True, nullable=False)
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id", ondelete="CASCADE"), index=True, nullable=False)
    url: Mapped[str] = mapped_column(String(500), nullable=False)
    alt: Mapped[str | None] = mapped_column(String(200), nullable=True)
    position: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    product: Mapped["Product"] = relationship(back_populates="images")


class ProductQuantityTier(Base):
    """Tiered discount: 'buy at least N, get X% off the whole order line.'"""
    __tablename__ = "product_quantity_tiers"
    __table_args__ = (
        CheckConstraint("min_quantity >= 1", name="ck_tier_qty_positive"),
        CheckConstraint("discount_pct > 0 AND discount_pct < 100", name="ck_tier_pct_range"),
        UniqueConstraint("product_id", "min_quantity", name="uq_tier_product_qty"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    store_id: Mapped[int] = mapped_column(ForeignKey("stores.id", ondelete="CASCADE"), index=True, nullable=False)
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id", ondelete="CASCADE"), index=True, nullable=False)
    min_quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    discount_pct: Mapped[int] = mapped_column(Integer, nullable=False)

    product: Mapped["Product"] = relationship(back_populates="tiers")


class ProductAddon(Base):
    """Optional bundle add-on shown next to the main product (e.g. gift wrap)."""
    __tablename__ = "product_addons"

    id: Mapped[int] = mapped_column(primary_key=True)
    store_id: Mapped[int] = mapped_column(ForeignKey("stores.id", ondelete="CASCADE"), index=True, nullable=False)
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id", ondelete="CASCADE"), index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(String(400), nullable=True)
    price_cents: Mapped[int] = mapped_column(Integer, nullable=False)
    image_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    position: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    product: Mapped["Product"] = relationship(back_populates="addons")


class Order(Base):
    __tablename__ = "orders"

    id: Mapped[int] = mapped_column(primary_key=True)
    store_id: Mapped[int] = mapped_column(ForeignKey("stores.id", ondelete="CASCADE"), index=True, nullable=False)
    order_number: Mapped[str] = mapped_column(String(24), unique=True, index=True, nullable=False)

    # Buyer / shipping
    buyer_email: Mapped[str] = mapped_column(String(255), nullable=False)
    shipping_name: Mapped[str] = mapped_column(String(120), nullable=False)
    shipping_phone: Mapped[str] = mapped_column(String(40), nullable=False)
    address_line1: Mapped[str] = mapped_column(String(200), nullable=False)
    address_line2: Mapped[str | None] = mapped_column(String(200), nullable=True)
    city: Mapped[str] = mapped_column(String(120), nullable=False)
    state: Mapped[str | None] = mapped_column(String(120), nullable=True)
    postal_code: Mapped[str] = mapped_column(String(20), nullable=False)
    country: Mapped[str] = mapped_column(String(2), nullable=False)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Money + status
    subtotal_cents: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    discount_cents: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    total_cents: Mapped[int] = mapped_column(Integer, nullable=False)
    currency: Mapped[str] = mapped_column(String(3), default="USD", nullable=False)
    applied_tier_id: Mapped[int | None] = mapped_column(
        ForeignKey("product_quantity_tiers.id", ondelete="SET NULL"), nullable=True
    )
    payment_method: Mapped[str] = mapped_column(String(20), default="cod", nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="pending", nullable=False)
    stripe_session_id: Mapped[str | None] = mapped_column(String(255), unique=True, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    items: Mapped[list["OrderItem"]] = relationship(back_populates="order", cascade="all, delete-orphan")


class OrderItem(Base):
    __tablename__ = "order_items"
    __table_args__ = (
        CheckConstraint(
            "(product_id IS NOT NULL) OR (addon_id IS NOT NULL)",
            name="ck_orderitem_kind",
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    store_id: Mapped[int] = mapped_column(ForeignKey("stores.id", ondelete="CASCADE"), index=True, nullable=False)
    order_id: Mapped[int] = mapped_column(ForeignKey("orders.id", ondelete="CASCADE"), index=True, nullable=False)
    # Either product_id or addon_id is set. product_id is no longer NOT NULL so
    # we can record addon lines using the same table.
    product_id: Mapped[int | None] = mapped_column(
        ForeignKey("products.id", ondelete="RESTRICT"), nullable=True
    )
    addon_id: Mapped[int | None] = mapped_column(
        ForeignKey("product_addons.id", ondelete="RESTRICT"), nullable=True
    )
    kind: Mapped[str] = mapped_column(String(16), default="product", nullable=False)  # "product" | "addon"
    name_snapshot: Mapped[str] = mapped_column(String(200), nullable=False)
    unit_price_cents: Mapped[int] = mapped_column(Integer, nullable=False)
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)

    order: Mapped["Order"] = relationship(back_populates="items")
