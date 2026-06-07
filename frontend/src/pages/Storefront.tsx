import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api, PublicAddon, PublicProduct, StorePage } from "../api";
import { addToCart, formatPrice, setAddons, setQuantity } from "../cart";
import StorefrontHeader from "../components/StorefrontHeader";

export default function Storefront() {
  const { slug = "" } = useParams();
  const nav = useNavigate();
  const [page, setPage] = useState<StorePage | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getPublicStore(slug).then(setPage).catch((e) => setError(e.message));
  }, [slug]);

  if (error) return <div className="container"><div className="card"><h2>{error}</h2></div></div>;
  if (!page) return <div className="container"><p className="muted">Loading...</p></div>;

  if (!page.product) {
    return (
      <>
        <StorefrontHeader store={page.store} />
        <div className="container">
          <div className="card">
            <h2>Coming soon</h2>
            <p className="muted">{page.store.name} hasn't published their product yet. Check back soon.</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <StorefrontHeader store={page.store} />
      <SingleProduct store={page.store} product={page.product} onBuy={() => nav(`/s/${slug}/checkout`)} />
    </>
  );
}

function SingleProduct({
  store,
  product,
  onBuy,
}: {
  store: { slug: string; name: string };
  product: PublicProduct;
  onBuy: () => void;
}) {
  const slug = store.slug;
  const allImages = [
    ...(product.image_url ? [{ id: -1, url: product.image_url, alt: product.name, position: -1 }] : []),
    ...product.images,
  ];
  const [activeImage, setActiveImage] = useState<string | null>(allImages[0]?.url ?? null);
  const [qty, setQty] = useState(1);
  const [selectedAddons, setSelectedAddons] = useState<Record<number, boolean>>({});

  const tiers = useMemo(
    () => [...product.tiers].sort((a, b) => a.min_quantity - b.min_quantity),
    [product.tiers]
  );

  // Best tier currently earned + next tier hint
  const earnedTier = useMemo(() => {
    const eligible = tiers.filter((t) => t.min_quantity <= qty);
    return eligible.reduce<typeof eligible[number] | null>(
      (best, t) => (!best || t.discount_pct > best.discount_pct ? t : best),
      null
    );
  }, [tiers, qty]);
  const nextTier = useMemo(() => tiers.find((t) => t.min_quantity > qty) ?? null, [tiers, qty]);

  // Price calculations
  const subtotal = product.price_cents * qty;
  const discount = earnedTier ? Math.floor(subtotal * earnedTier.discount_pct / 100) : 0;
  const addonsTotal = product.addons
    .filter((a) => selectedAddons[a.id])
    .reduce((s, a) => s + a.price_cents, 0);
  const total = subtotal - discount + addonsTotal;

  const outOfStock = product.inventory <= 0;
  const lowStock =
    product.low_stock_threshold > 0 &&
    product.inventory > 0 &&
    product.inventory <= product.low_stock_threshold;

  function addAndGo() {
    if (outOfStock) return;
    addToCart(slug, {
      product_id: product.id,
      name: product.name,
      unit_price_cents: product.price_cents,
      currency: product.currency,
      image_url: product.image_url ?? allImages[0]?.url ?? null,
    }, qty);
    // Replace cart line (qty might exist already)
    setQuantity(slug, product.id, qty);
    setAddons(slug, Object.entries(selectedAddons).filter(([, v]) => v).map(([k]) => Number(k)));
    onBuy();
  }

  return (
    <div className="container product-page">
      <div className="product-grid">
        {/* Left: media */}
        <div>
          <div className="hero-image">
            {activeImage
              ? <img src={activeImage} alt={product.name} />
              : <div className="placeholder" />}
          </div>
          {allImages.length > 1 && (
            <div className="thumbs">
              {allImages.map((img) => (
                <button
                  key={img.id}
                  type="button"
                  className={`thumb-btn ${activeImage === img.url ? "thumb-active" : ""}`}
                  onClick={() => setActiveImage(img.url)}
                >
                  <img src={img.url} alt={img.alt ?? ""} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: details */}
        <div>
          <h1 className="product-title">{product.name}</h1>
          {product.subtitle && <p className="product-subtitle">{product.subtitle}</p>}

          <PriceBlock product={product} />

          {product.sale_ends_at && <Countdown endsAt={product.sale_ends_at} />}
          {lowStock && <div className="scarcity-banner">⚡ Only {product.inventory} left!</div>}
          {outOfStock && <div className="scarcity-banner out">Sold out</div>}

          {tiers.length > 0 && (
            <div className="tier-row">
              {tiers.map((t) => (
                <div
                  key={t.id}
                  className={`tier-chip ${earnedTier?.id === t.id ? "tier-on" : ""}`}
                >
                  Buy {t.min_quantity}+ · save {t.discount_pct}%
                </div>
              ))}
            </div>
          )}
          {nextTier && (
            <p className="muted nudge">
              Add {nextTier.min_quantity - qty} more to save {nextTier.discount_pct}%.
            </p>
          )}

          <div className="row qty-row">
            <label className="muted" style={{ marginRight: 8 }}>Quantity</label>
            <button className="btn secondary qty-btn" type="button" onClick={() => setQty(Math.max(1, qty - 1))} disabled={qty <= 1}>−</button>
            <input
              className="input"
              style={{ width: 60, textAlign: "center" }}
              value={qty}
              onChange={(e) => {
                const n = Math.max(1, Number(e.target.value) || 1);
                setQty(Math.min(n, Math.max(1, product.inventory || 99)));
              }}
            />
            <button className="btn secondary qty-btn" type="button" onClick={() => setQty(qty + 1)} disabled={qty >= product.inventory && product.inventory > 0}>+</button>
          </div>

          {product.addons.length > 0 && (
            <div className="addons">
              <div className="muted" style={{ marginBottom: 6, fontWeight: 600 }}>Add to your order</div>
              {product.addons.map((a) => (
                <AddonRow
                  key={a.id}
                  addon={a}
                  currency={product.currency}
                  selected={!!selectedAddons[a.id]}
                  onToggle={() => setSelectedAddons((s) => ({ ...s, [a.id]: !s[a.id] }))}
                />
              ))}
            </div>
          )}

          <div className="total-row">
            <div className="grow muted">Total</div>
            <div className="total-amount">{formatPrice(total, product.currency)}</div>
          </div>
          {discount > 0 && (
            <div className="muted tiny" style={{ textAlign: "right" }}>
              Includes {formatPrice(discount, product.currency)} tier discount
            </div>
          )}

          <button
            className="btn buy-btn"
            disabled={outOfStock}
            onClick={addAndGo}
          >
            {outOfStock ? "Sold out" : "Buy now"}
          </button>
          <p className="muted tiny" style={{ textAlign: "center", marginTop: 8 }}>
            Cash on delivery · Ships from {store.name}
          </p>
        </div>
      </div>

      {product.description && (
        <div className="card description">
          <h3 style={{ marginTop: 0 }}>About this product</h3>
          <p style={{ whiteSpace: "pre-wrap", margin: 0 }}>{product.description}</p>
        </div>
      )}

      <p style={{ textAlign: "center", marginTop: 32 }}>
        <Link to={`/s/${slug}/cart`} className="muted">View cart →</Link>
      </p>
    </div>
  );
}

function PriceBlock({ product }: { product: PublicProduct }) {
  const hasCompare = product.compare_at_price_cents != null && product.compare_at_price_cents > product.price_cents;
  return (
    <div className="price-block">
      <span className="price-now">{formatPrice(product.price_cents, product.currency)}</span>
      {hasCompare && (
        <>
          <span className="price-was">{formatPrice(product.compare_at_price_cents!, product.currency)}</span>
          <span className="price-save">
            Save {Math.round(((product.compare_at_price_cents! - product.price_cents) / product.compare_at_price_cents!) * 100)}%
          </span>
        </>
      )}
    </div>
  );
}

function AddonRow({
  addon, currency, selected, onToggle,
}: { addon: PublicAddon; currency: string; selected: boolean; onToggle: () => void }) {
  return (
    <label className={`addon-row ${selected ? "addon-selected" : ""}`}>
      <input type="checkbox" checked={selected} onChange={onToggle} />
      {addon.image_url && <img className="addon-thumb" src={addon.image_url} alt="" />}
      <div className="grow">
        <div style={{ fontWeight: 600 }}>{addon.name}</div>
        {addon.description && <div className="muted tiny">{addon.description}</div>}
      </div>
      <div style={{ fontWeight: 600 }}>+{formatPrice(addon.price_cents, currency)}</div>
    </label>
  );
}

function Countdown({ endsAt }: { endsAt: string }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const ms = new Date(endsAt).getTime() - now;
  if (ms <= 0) return null;
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return (
    <div className="scarcity-banner">
      ⏱ Sale ends in {d > 0 ? `${d}d ` : ""}{String(h).padStart(2, "0")}h {String(m).padStart(2, "0")}m {String(sec).padStart(2, "0")}s
    </div>
  );
}
