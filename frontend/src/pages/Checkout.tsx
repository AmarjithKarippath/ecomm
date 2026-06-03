import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api, CheckoutInput, Store } from "../api";
import { CartLine, cartTotalCents, clearCart, formatPrice, getCart } from "../cart";
import StorefrontHeader from "../components/StorefrontHeader";

type Form = Omit<CheckoutInput, "items">;

const emptyForm: Form = {
  buyer_email: "",
  shipping_name: "",
  shipping_phone: "",
  address_line1: "",
  address_line2: "",
  city: "",
  state: "",
  postal_code: "",
  country: "IN",
  notes: "",
};

export default function Checkout() {
  const { slug = "" } = useParams();
  const nav = useNavigate();
  const [store, setStore] = useState<Store | null>(null);
  const [lines, setLines] = useState<CartLine[]>(() => getCart(slug));
  const [form, setForm] = useState<Form>(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.getPublicStore(slug).then((p) => setStore(p.store)).catch((e) => setError(e.message));
  }, [slug]);

  function update<K extends keyof Form>(key: K, value: Form[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (lines.length === 0) {
      setError("Your cart is empty.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const order = await api.checkoutCod(slug, {
        ...form,
        address_line2: form.address_line2 || null,
        state: form.state || null,
        notes: form.notes || null,
        country: form.country.toUpperCase(),
        items: lines.map((l) => ({ product_id: l.product_id, quantity: l.quantity })),
      });
      clearCart(slug);
      nav(`/s/${slug}/orders/${order.order_number}`, { replace: true });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (error && !store) return <div className="container"><div className="card"><h2>{error}</h2></div></div>;
  if (!store) return <div className="container"><p className="muted">Loading...</p></div>;

  const currency = lines[0]?.currency || "USD";
  const total = cartTotalCents(lines);

  return (
    <>
      <StorefrontHeader store={store} />
      <div className="container">
        <h2>Checkout</h2>
        {lines.length === 0 ? (
          <div className="card">
            <p className="muted" style={{ margin: 0 }}>
              Your cart is empty. <Link to={`/s/${slug}`}>Continue shopping →</Link>
            </p>
          </div>
        ) : (
          <div className="checkout-grid">
            <form className="card" onSubmit={onSubmit}>
              <h3 style={{ marginTop: 0 }}>Shipping details</h3>
              <div className="field">
                <label>Full name</label>
                <input className="input" required value={form.shipping_name} onChange={(e) => update("shipping_name", e.target.value)} />
              </div>
              <div className="row">
                <div className="field grow">
                  <label>Email</label>
                  <input className="input" type="email" required value={form.buyer_email} onChange={(e) => update("buyer_email", e.target.value)} />
                </div>
                <div className="field grow">
                  <label>Phone</label>
                  <input className="input" type="tel" required value={form.shipping_phone} onChange={(e) => update("shipping_phone", e.target.value)} />
                </div>
              </div>
              <div className="field">
                <label>Address line 1</label>
                <input className="input" required value={form.address_line1} onChange={(e) => update("address_line1", e.target.value)} />
              </div>
              <div className="field">
                <label>Address line 2 <span className="muted" style={{ fontWeight: 400 }}>(optional)</span></label>
                <input className="input" value={form.address_line2 ?? ""} onChange={(e) => update("address_line2", e.target.value)} />
              </div>
              <div className="row">
                <div className="field grow">
                  <label>City</label>
                  <input className="input" required value={form.city} onChange={(e) => update("city", e.target.value)} />
                </div>
                <div className="field grow">
                  <label>State / Region</label>
                  <input className="input" value={form.state ?? ""} onChange={(e) => update("state", e.target.value)} />
                </div>
              </div>
              <div className="row">
                <div className="field grow">
                  <label>Postal code</label>
                  <input className="input" required value={form.postal_code} onChange={(e) => update("postal_code", e.target.value)} />
                </div>
                <div className="field" style={{ width: 100 }}>
                  <label>Country</label>
                  <input className="input" maxLength={2} required value={form.country} onChange={(e) => update("country", e.target.value.toUpperCase())} />
                </div>
              </div>
              <div className="field">
                <label>Order notes <span className="muted" style={{ fontWeight: 400 }}>(optional)</span></label>
                <textarea className="textarea" value={form.notes ?? ""} onChange={(e) => update("notes", e.target.value)} />
              </div>
              <div className="cod-banner">
                <strong>Payment: Cash on Delivery</strong>
                <div className="muted" style={{ fontSize: 13 }}>Pay in cash when your order arrives. No card required.</div>
              </div>
              {error && <div className="error">{error}</div>}
              <button className="btn" disabled={busy} style={{ marginTop: 12 }}>
                {busy ? "Placing order..." : `Place order · ${formatPrice(total, currency)}`}
              </button>
            </form>

            <aside className="card">
              <h3 style={{ marginTop: 0 }}>Order summary</h3>
              {lines.map((l) => (
                <div key={l.product_id} className="row" style={{ marginBottom: 10 }}>
                  {l.image_url ? <img className="thumb" src={l.image_url} alt="" /> : <div className="thumb" />}
                  <div className="grow">
                    <div style={{ fontWeight: 600 }}>{l.name}</div>
                    <div className="muted" style={{ fontSize: 13 }}>Qty {l.quantity}</div>
                  </div>
                  <div>{formatPrice(l.unit_price_cents * l.quantity, l.currency)}</div>
                </div>
              ))}
              <hr style={{ border: 0, borderTop: "1px solid #eef0f2", margin: "12px 0" }} />
              <div className="row">
                <div className="grow muted">Subtotal</div>
                <div>{formatPrice(total, currency)}</div>
              </div>
              <div className="row">
                <div className="grow muted">Shipping</div>
                <div>Calculated at delivery</div>
              </div>
              <div className="row" style={{ marginTop: 10 }}>
                <div className="grow" style={{ fontWeight: 700 }}>Total</div>
                <div style={{ fontSize: 20, fontWeight: 700 }}>{formatPrice(total, currency)}</div>
              </div>
            </aside>
          </div>
        )}
      </div>
    </>
  );
}
