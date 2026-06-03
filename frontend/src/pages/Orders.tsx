import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api, MerchantOrderSummary } from "../api";
import { formatPrice } from "../cart";

const STATUSES = ["pending", "confirmed", "shipped", "delivered", "cancelled"];

function StatusPill({ status }: { status: string }) {
  return <span className={`pill pill-${status}`}>{status}</span>;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString();
}

export default function Orders() {
  const [orders, setOrders] = useState<MerchantOrderSummary[] | null>(null);
  const [stats, setStats] = useState<Record<string, { count: number; total_cents: number }> | null>(null);
  const [filter, setFilter] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      const [list, s] = await Promise.all([
        api.listOrders(filter || undefined),
        api.orderStats(),
      ]);
      setOrders(list);
      setStats(s);
    } catch (err: any) {
      setError(err.message);
    }
  }

  useEffect(() => { load(); }, [filter]);

  const totals = useMemo(() => {
    if (!stats) return null;
    const totalCount = Object.values(stats).reduce((n, s) => n + s.count, 0);
    const collected = (stats["delivered"]?.total_cents ?? 0);
    return { totalCount, collected };
  }, [stats]);

  return (
    <div className="container">
      <div className="row" style={{ marginBottom: 16 }}>
        <h2 className="grow" style={{ margin: 0 }}>Orders</h2>
      </div>

      {stats && (
        <div className="stats-grid">
          {STATUSES.map((s) => (
            <button
              key={s}
              className={`stat-card ${filter === s ? "stat-active" : ""}`}
              onClick={() => setFilter(filter === s ? "" : s)}
            >
              <div className="muted" style={{ fontSize: 12, textTransform: "uppercase" }}>{s}</div>
              <div style={{ fontSize: 22, fontWeight: 700 }}>{stats[s]?.count ?? 0}</div>
            </button>
          ))}
          {totals && (
            <div className="stat-card" style={{ cursor: "default" }}>
              <div className="muted" style={{ fontSize: 12, textTransform: "uppercase" }}>Collected (delivered)</div>
              <div style={{ fontSize: 22, fontWeight: 700 }}>
                {formatPrice(totals.collected, orders?.[0]?.currency || "USD")}
              </div>
            </div>
          )}
        </div>
      )}

      {filter && (
        <div className="muted" style={{ marginBottom: 12 }}>
          Filtering by <strong>{filter}</strong>. <a href="#" onClick={(e) => { e.preventDefault(); setFilter(""); }}>Clear</a>
        </div>
      )}

      {error && <div className="error">{error}</div>}

      {!orders ? (
        <p className="muted">Loading...</p>
      ) : orders.length === 0 ? (
        <div className="card"><p className="muted" style={{ margin: 0 }}>No orders {filter ? `with status "${filter}"` : "yet"}.</p></div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Order</th>
              <th>Placed</th>
              <th>Buyer</th>
              <th>Items</th>
              <th>Total</th>
              <th>Payment</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id}>
                <td><Link to={`/orders/${o.id}`}><code>{o.order_number}</code></Link></td>
                <td className="muted">{formatDate(o.created_at)}</td>
                <td>
                  <div>{o.shipping_name}</div>
                  <div className="muted" style={{ fontSize: 12 }}>{o.buyer_email}</div>
                </td>
                <td>{o.item_count}</td>
                <td>{formatPrice(o.total_cents, o.currency)}</td>
                <td><span className="pill pill-cod">{o.payment_method.toUpperCase()}</span></td>
                <td><StatusPill status={o.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
