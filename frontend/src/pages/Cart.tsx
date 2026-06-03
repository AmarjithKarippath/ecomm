import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api, Store } from "../api";
import { CartLine, cartTotalCents, formatPrice, getCart, removeFromCart, setQuantity } from "../cart";
import StorefrontHeader from "../components/StorefrontHeader";

export default function Cart() {
  const { slug = "" } = useParams();
  const [store, setStore] = useState<Store | null>(null);
  const [lines, setLines] = useState<CartLine[]>(() => getCart(slug));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getPublicStore(slug).then((p) => setStore(p.store)).catch((e) => setError(e.message));
  }, [slug]);

  useEffect(() => {
    const onChange = () => setLines(getCart(slug));
    window.addEventListener("cart-changed", onChange);
    return () => window.removeEventListener("cart-changed", onChange);
  }, [slug]);

  if (error) return <div className="container"><div className="card"><h2>{error}</h2></div></div>;
  if (!store) return <div className="container"><p className="muted">Loading...</p></div>;

  const currency = lines[0]?.currency || "USD";
  const total = cartTotalCents(lines);

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
              </tbody>
            </table>
            <div className="row" style={{ marginTop: 20, justifyContent: "flex-end" }}>
              <div style={{ textAlign: "right" }}>
                <div className="muted">Total</div>
                <div style={{ fontSize: 24, fontWeight: 700 }}>{formatPrice(total, currency)}</div>
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
