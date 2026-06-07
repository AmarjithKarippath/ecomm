"""initial schema — stores, users, products + gallery/tiers/addons, orders + items

Revision ID: 0001_initial
Revises:
Create Date: 2026-06-04
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "0001_initial"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "stores",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(120), nullable=False),
        sa.Column("slug", sa.String(80), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_stores_slug", "stores", ["slug"], unique=True)

    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "store_id", sa.Integer(),
            sa.ForeignKey("stores.id", ondelete="CASCADE"), nullable=False,
        ),
        sa.Column("email", sa.String(255), nullable=False),
        sa.Column("password_hash", sa.String(255), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.UniqueConstraint("email", name="uq_users_email"),
    )
    op.create_index("ix_users_store_id", "users", ["store_id"])

    op.create_table(
        "products",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "store_id", sa.Integer(),
            sa.ForeignKey("stores.id", ondelete="CASCADE"), nullable=False,
        ),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column("subtitle", sa.String(280)),
        sa.Column("description", sa.Text()),
        sa.Column("price_cents", sa.Integer(), nullable=False),
        sa.Column("compare_at_price_cents", sa.Integer()),
        sa.Column("currency", sa.String(3), nullable=False, server_default="USD"),
        sa.Column("image_url", sa.String(500)),
        sa.Column("inventory", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("sale_ends_at", sa.DateTime(timezone=True)),
        sa.Column("low_stock_threshold", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_products_store_id", "products", ["store_id"])

    op.create_table(
        "product_images",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "store_id", sa.Integer(),
            sa.ForeignKey("stores.id", ondelete="CASCADE"), nullable=False,
        ),
        sa.Column(
            "product_id", sa.Integer(),
            sa.ForeignKey("products.id", ondelete="CASCADE"), nullable=False,
        ),
        sa.Column("url", sa.String(500), nullable=False),
        sa.Column("alt", sa.String(200)),
        sa.Column("position", sa.Integer(), nullable=False, server_default="0"),
    )
    op.create_index("ix_product_images_store_id", "product_images", ["store_id"])
    op.create_index("ix_product_images_product_id", "product_images", ["product_id"])

    op.create_table(
        "product_quantity_tiers",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "store_id", sa.Integer(),
            sa.ForeignKey("stores.id", ondelete="CASCADE"), nullable=False,
        ),
        sa.Column(
            "product_id", sa.Integer(),
            sa.ForeignKey("products.id", ondelete="CASCADE"), nullable=False,
        ),
        sa.Column("min_quantity", sa.Integer(), nullable=False),
        sa.Column("discount_pct", sa.Integer(), nullable=False),
        sa.CheckConstraint("min_quantity >= 1", name="ck_tier_qty_positive"),
        sa.CheckConstraint("discount_pct > 0 AND discount_pct < 100", name="ck_tier_pct_range"),
        sa.UniqueConstraint("product_id", "min_quantity", name="uq_tier_product_qty"),
    )
    op.create_index("ix_product_quantity_tiers_store_id", "product_quantity_tiers", ["store_id"])
    op.create_index("ix_product_quantity_tiers_product_id", "product_quantity_tiers", ["product_id"])

    op.create_table(
        "product_addons",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "store_id", sa.Integer(),
            sa.ForeignKey("stores.id", ondelete="CASCADE"), nullable=False,
        ),
        sa.Column(
            "product_id", sa.Integer(),
            sa.ForeignKey("products.id", ondelete="CASCADE"), nullable=False,
        ),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column("description", sa.String(400)),
        sa.Column("price_cents", sa.Integer(), nullable=False),
        sa.Column("image_url", sa.String(500)),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("position", sa.Integer(), nullable=False, server_default="0"),
    )
    op.create_index("ix_product_addons_store_id", "product_addons", ["store_id"])
    op.create_index("ix_product_addons_product_id", "product_addons", ["product_id"])

    op.create_table(
        "orders",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "store_id", sa.Integer(),
            sa.ForeignKey("stores.id", ondelete="CASCADE"), nullable=False,
        ),
        sa.Column("order_number", sa.String(24), nullable=False),
        sa.Column("buyer_email", sa.String(255), nullable=False),
        sa.Column("shipping_name", sa.String(120), nullable=False),
        sa.Column("shipping_phone", sa.String(40), nullable=False),
        sa.Column("address_line1", sa.String(200), nullable=False),
        sa.Column("address_line2", sa.String(200)),
        sa.Column("city", sa.String(120), nullable=False),
        sa.Column("state", sa.String(120)),
        sa.Column("postal_code", sa.String(20), nullable=False),
        sa.Column("country", sa.String(2), nullable=False),
        sa.Column("notes", sa.Text()),
        sa.Column("subtotal_cents", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("discount_cents", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("total_cents", sa.Integer(), nullable=False),
        sa.Column("currency", sa.String(3), nullable=False, server_default="USD"),
        sa.Column(
            "applied_tier_id", sa.Integer(),
            sa.ForeignKey("product_quantity_tiers.id", ondelete="SET NULL"),
        ),
        sa.Column("payment_method", sa.String(20), nullable=False, server_default="cod"),
        sa.Column("status", sa.String(20), nullable=False, server_default="pending"),
        sa.Column("stripe_session_id", sa.String(255)),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_orders_store_id", "orders", ["store_id"])
    op.create_index("ix_orders_order_number", "orders", ["order_number"], unique=True)
    op.create_index("ix_orders_stripe_session_id", "orders", ["stripe_session_id"], unique=True)

    op.create_table(
        "order_items",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "store_id", sa.Integer(),
            sa.ForeignKey("stores.id", ondelete="CASCADE"), nullable=False,
        ),
        sa.Column(
            "order_id", sa.Integer(),
            sa.ForeignKey("orders.id", ondelete="CASCADE"), nullable=False,
        ),
        sa.Column(
            "product_id", sa.Integer(),
            sa.ForeignKey("products.id", ondelete="RESTRICT"),
        ),
        sa.Column(
            "addon_id", sa.Integer(),
            sa.ForeignKey("product_addons.id", ondelete="RESTRICT"),
        ),
        sa.Column("kind", sa.String(16), nullable=False, server_default="product"),
        sa.Column("name_snapshot", sa.String(200), nullable=False),
        sa.Column("unit_price_cents", sa.Integer(), nullable=False),
        sa.Column("quantity", sa.Integer(), nullable=False),
        sa.CheckConstraint(
            "(product_id IS NOT NULL) OR (addon_id IS NOT NULL)",
            name="ck_orderitem_kind",
        ),
    )
    op.create_index("ix_order_items_store_id", "order_items", ["store_id"])
    op.create_index("ix_order_items_order_id", "order_items", ["order_id"])


def downgrade() -> None:
    op.drop_table("order_items")
    op.drop_table("orders")
    op.drop_table("product_addons")
    op.drop_table("product_quantity_tiers")
    op.drop_table("product_images")
    op.drop_table("products")
    op.drop_table("users")
    op.drop_table("stores")
