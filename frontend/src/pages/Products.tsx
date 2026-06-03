import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, Product } from "../api";

function formatPrice(cents: number, currency: string) {
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(cents / 100);
  } catch {
    return `${(cents / 100).toFixed(2)} ${currency}`;
  }
}

export default function Products() {
  const [items, setItems] = useState<Product[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      setItems(await api.listProducts());
    } catch (err: any) {
      setError(err.message);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function onDelete(id: number) {
    if (!confirm("Delete this product?")) return;
    await api.deleteProduct(id);
    load();
  }

  return (
    <div className="container">
      <div className="row" style={{ marginBottom: 16 }}>
        <h2 className="grow" style={{ margin: 0 }}>Products</h2>
        <Link to="/products/new" className="btn">+ New product</Link>
      </div>
      {error && <div className="error">{error}</div>}
      {!items ? (
        <p className="muted">Loading...</p>
      ) : items.length === 0 ? (
        <div className="card"><p className="muted" style={{ margin: 0 }}>No products yet. Add your first one to get started.</p></div>
      ) : (
        <table>
          <thead>
            <tr>
              <th></th>
              <th>Name</th>
              <th>Price</th>
              <th>Inventory</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.map((p) => (
              <tr key={p.id}>
                <td>{p.image_url ? <img className="thumb" src={p.image_url} alt="" /> : <div className="thumb" />}</td>
                <td><Link to={`/products/${p.id}`}>{p.name}</Link></td>
                <td>{formatPrice(p.price_cents, p.currency)}</td>
                <td>{p.inventory}</td>
                <td>
                  <button className="btn secondary" onClick={() => onDelete(p.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
