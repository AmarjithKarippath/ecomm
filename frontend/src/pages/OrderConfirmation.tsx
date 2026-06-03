import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api, OrderOut, Store } from "../api";
import { formatPrice } from "../cart";
import StorefrontHeader from "../components/StorefrontHeader";

export default function OrderConfirmation() {
  const { slug = "", orderNumber = "" } = useParams();
  const [order, setOrder] = useState<OrderOut | null>(null);
  const [store, setStore] = useState<Store | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      api.getPublicStore(slug),
      api.getPublicOrder(slug, orderNumber),
    ])
      .then(([page, o]) => {
        setStore(page.store);
        setOrder(o);
      })
      .catch((e) => setError(e.message));
  }, [slug, orderNumber]);

  if (error) return <div className="container"><div className="card"><h2>{error}</h2></div></div>;
  if (!order || !store) return <div className="container"><p className="muted">Loading...</p></div>;

  return (
    <>
      <StorefrontHeader store={store} />
      <div className="container" style={{ maxWidth: 720 }}>
        <div className="card">
          <div className="success-badge">✓ Order placed</div>
          <h2 style={{ marginTop: 12 }}>Thanks, {order.shipping_name.split(" ")[0]}!</h2>
          <p className="muted">
            Your order <strong>{order.order_number}</strong> is confirmed.
            We've emailed a copy to <strong>{order.buyer_email}</strong>.
            Payment will be collected on delivery.
          </p>

          <h3>Items</h3>
          <table>
            <thead>
              <tr><th>Item</th><th>Qty</th><th>Price</th><th>Subtotal</th></tr>
            </thead>
            <tbody>
              {order.items.map((i) => (
                <tr key={i.product_id}>
                  <td>{i.name}</td>
                  <td>{i.quantity}</td>
                  <td>{formatPrice(i.unit_price_cents, order.currency)}</td>
                  <td>{formatPrice(i.line_total_cents, order.currency)}</td>
                </tr>
              ))}
              <tr>
                <td colSpan={3} style={{ textAlign: "right", fontWeight: 700 }}>Total</td>
                <td style={{ fontWeight: 700 }}>{formatPrice(order.total_cents, order.currency)}</td>
              </tr>
            </tbody>
          </table>

          <h3 style={{ marginTop: 24 }}>Shipping to</h3>
          <div className="card" style={{ background: "#fafbfc" }}>
            <div>{order.shipping_name}</div>
            <div>{order.address_line1}</div>
            {order.address_line2 && <div>{order.address_line2}</div>}
            <div>
              {order.city}{order.state ? `, ${order.state}` : ""} {order.postal_code}
            </div>
            <div>{order.country}</div>
            <div className="muted" style={{ marginTop: 6 }}>Phone: {order.shipping_phone}</div>
            {order.notes && <div className="muted" style={{ marginTop: 6 }}>Notes: {order.notes}</div>}
          </div>

          <div className="row" style={{ marginTop: 20 }}>
            <Link to={`/s/${slug}`} className="btn">Keep shopping</Link>
          </div>
        </div>
      </div>
    </>
  );
}
