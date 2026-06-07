import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api, PublicAddon, PublicProduct, Store } from "../api";
import {
  CartLine, cartTotalCents, formatPrice, getAddons, getCart,
  removeFromCart, setAddons, setQuantity,
} from "../cart";
import StorefrontHeader from "../components/StorefrontHeader";

export default function Cart() {
  const { slug = "" } = useParams();
  const [store, setStore] = useState<Store | null>(null);
  const [product, setProduct] = useState<PublicProduct | null>(null);
  const [lines, setLines] = useState<CartLine[]>(() => getCart(slug));
  const [addonIds, setAddonIds] = useState<number[]>(() => getAddons(slug));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getPublicStore(slug).then((p) => {
      setStore(p.store);
      setProduct(p.product);
    }).catch((e) => setError(e.message));
  }, [slug]);

  useEffect(() => {
    const onChange = () => {
      setLines(getCart(slug));
      setAddonIds(getAddons(slug));
    };
    window.addEventListener("cart-changed", onChange);
    return () => window.removeEventListener("cart-changed", onChange);
  }, [slug]);

  const tiers = product?.tiers ?? [];
  const mainLine = lines[0] ?? null;
  const mainQty = mainLine?.quantity ?? 0;
  const subtotal = cartTotalCents(lines);

  // Mirror server logic so totals match exactly
  const earnedTier = useMemo(() => {
    const eligible = tiers.filter((t) => t.min_quantity <= mainQty);
    return eligible.reduce<typeof eligible[number] | null>(
      (best, t) => (!best || t.discount_pct > best.discount_pct ? t : best),
      null,
    );
  }, [tiers, mainQty]);
  const discount = earnedTier ? Math.floor(subtotal * earnedTier.discount_pct / 100) : 0;

  const addonsById = useMemo(() => {
    const map = new Map<number, PublicAddon>();
    product?.addons.forEach((a) => map.set(a.id, a));
    return map;
  }, [product]);
  const selectedAddons = addonIds.map((id) => addonsById.get(id)).filter(Boolean) as PublicAddon[];
  const addonsTotal = selectedAddons.reduce((s, a) => s + a.price_cents, 0);

  const total = Math.max(0, subtotal - discount) + addonsTotal;

  function removeAddon(id: number) {
    const next = addonIds.filter((x) => x !== id);
    setAddons(slug, next);
  }

  if (error) return <div className="container"><div className="card"><h2>{error}</h2></div></div>;
  if (!store) return <div className="container"><p className="muted">Loading...</p></div>;

  const currency = mainLine?.currency || product?.currency || "USD";

  return (
    <>
      <StorefrontHeader store={store} />
      <div className="container">
        <h2>Your cart</h2>
        {lines.length === 0 ? (
          <div className="card">
            <p className="muted" style={{ margin: 0 }}>
              Cart is empty. <Link to={`/s/${slug}`}>Continue shopping →</Link>
            </p>
          </div>
        ) : (
          <>
            <table>
              <thead>
                <tr><th></th><th>Item</th><th>Price</th><th>Qty</th><th>Subtotal</th><th></th></tr>
              </thead>
              <tbody>
                {lines.map((l) => (
                  <tr key={l.product_id}>
                    <td>{l.image_url ? <img className="thumb" src={l.image_url} alt="" /> : <div className="thumb" />}</td>
                    <td>{l.name}</td>
                    <td>{formatPrice(l.unit_price_cents, l.currency)}</td>
                    <td>
                      <input
                        className="input"
                        style={{ width: 70 }}
                        type="number"
                        min={1}
                        value={l.quantity}
                        onChange={(e) => setQuantity(slug, l.product_id, Number(e.target.value))}
                      />
                    </td>
                    <td>{formatPrice(l.unit_price_cents * l.quantity, l.currency)}</td>
                    <td><button className="btn secondary" onClick={() => removeFromCart(slug, l.product_id)}>Remove</button></td>
                  </tr>
                ))}
                {selectedAddons.map((a) => (
                  <tr key={`addon-${a.id}`}>
                    <td>{a.image_url ? <img className="thumb" src={a.image_url} alt="" /> : <div className="thumb" />}</td>
                    <td>
                      <div>{a.name}</div>
                      <div className="muted tiny">Add-on</div>
                    </td>
                    <td>{formatPrice(a.price_cents, currency)}</td>
                    <td>1</td>
                    <td>{formatPrice(a.price_cents, currency)}</td>
                    <td><button className="btn secondary" onClick={() => removeAddon(a.id)}>Remove</button></td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="cart-totals">
              <div className="row"><div className="grow muted">Subtotal</div><div>{formatPrice(subtotal + addonsTotal, currency)}</div></div>
              {discount > 0 && earnedTier && (
                <div className="row" style={{ color: "#047857" }}>
                  <div className="grow">Tier discount (Buy {earnedTier.min_quantity}+, save {earnedTier.discount_pct}%)</div>
                  <div>−{formatPrice(discount, currency)}</div>
                </div>
              )}
              <div className="row" style={{ marginTop: 8, fontWeight: 700, fontSize: 20 }}>
                <div className="grow">Total</div>
                <div>{formatPrice(total, currency)}</div>
              </div>
            </div>

            <div className="row" style={{ marginTop: 16, justifyContent: "flex-end" }}>
              <Link to={`/s/${slug}`} className="btn secondary">Keep shopping</Link>
              <Link to={`/s/${slug}/checkout`} className="btn">Checkout</Link>
            </div>
          </>
        )}
      </div>
    </>
  );
}
