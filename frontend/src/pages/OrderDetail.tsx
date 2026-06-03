import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api, MerchantOrderDetail } from "../api";
import { formatPrice } from "../cart";

function StatusPill({ status }: { status: string }) {
  return <span className={`pill pill-${status}`}>{status}</span>;
}

export default function OrderDetail() {
  const { id = "" } = useParams();
  const [order, setOrder] = useState<MerchantOrderDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    try {
      setOrder(await api.getOrder(Number(id)));
    } catch (err: any) {
      setError(err.message);
    }
  }

  useEffect(() => { load(); }, [id]);

  async function transition(to: string) {
    if (!order) return;
    if (to === "cancelled" && !confirm("Cancel this order? This cannot be undone.")) return;
    setBusy(true);
    setError(null);
    try {
      setOrder(await api.updateOrderStatus(order.id, to));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (error && !order) return <div className="container"><div className="card"><h2>{error}</h2></div></div>;
  if (!order) return <div className="container"><p className="muted">Loading...</p></div>;

  return (
    <div className="container" style={{ maxWidth: 800 }}>
      <div className="row" style={{ marginBottom: 16 }}>
        <Link to="/orders" className="muted">← All orders</Link>
      </div>

      <div className="card">
        <div className="row">
          <div className="grow">
            <h2 style={{ margin: 0 }}><code>{order.order_number}</code></h2>
            <div className="muted">{new Date(order.created_at).toLocaleString()}</div>
          </div>
          <StatusPill status={order.status} />
        </div>

        <div className="row" style={{ marginTop: 16, flexWrap: "wrap", gap: 8 }}>
          {order.allowed_next_statuses.length === 0 ? (
            <span className="muted">No further status changes available.</span>
          ) : (
            order.allowed_next_statuses.map((s) => (
              <button
                key={s}
                className={`btn ${s === "cancelled" ? "danger" : ""}`}
                disabled={busy}
                onClick={() => transition(s)}
              >
                Mark as {s}
              </button>
            ))
          )}
        </div>
        {error && <div className="error">{error}</div>}
      </div>

      <div className="checkout-grid" style={{ marginTop: 16 }}>
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Items</h3>
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
              <tr>
                <td colSpan={3} style={{ textAlign: "right" }} className="muted">Payment</td>
                <td><span className="pill pill-cod">{order.payment_method.toUpperCase()}</span></td>
              </tr>
            </tbody>
          </table>
        </div>

        <aside className="card">
          <h3 style={{ marginTop: 0 }}>Customer</h3>
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontWeight: 600 }}>{order.shipping_name}</div>
            <div className="muted">{order.buyer_email}</div>
            <div className="muted">{order.shipping_phone}</div>
          </div>

          <h4 style={{ marginBottom: 4 }}>Ship to</h4>
          <div>{order.address_line1}</div>
          {order.address_line2 && <div>{order.address_line2}</div>}
          <div>{order.city}{order.state ? `, ${order.state}` : ""} {order.postal_code}</div>
          <div>{order.country}</div>

          {order.notes && (
            <>
              <h4 style={{ marginBottom: 4, marginTop: 16 }}>Notes</h4>
              <div className="muted" style={{ whiteSpace: "pre-wrap" }}>{order.notes}</div>
            </>
          )}
        </aside>
      </div>
    </div>
  );
}
