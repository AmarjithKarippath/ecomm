import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api, StorePage } from "../api";
import { formatPrice } from "../cart";
import StorefrontHeader from "../components/StorefrontHeader";

export default function Storefront() {
  const { slug = "" } = useParams();
  const [page, setPage] = useState<StorePage | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getPublicStore(slug).then(setPage).catch((e) => setError(e.message));
  }, [slug]);

  if (error) return <div className="container"><div className="card"><h2>{error}</h2></div></div>;
  if (!page) return <div className="container"><p className="muted">Loading...</p></div>;

  return (
    <>
      <StorefrontHeader store={page.store} />
      <div className="container">
        {page.products.length === 0 ? (
          <div className="card"><p className="muted" style={{ margin: 0 }}>This store has no products yet.</p></div>
        ) : (
          <div className="grid">
            {page.products.map((p) => (
              <Link key={p.id} to={`/s/${slug}/p/${p.id}`} className="product-card">
                <div className="product-image">
                  {p.image_url ? <img src={p.image_url} alt={p.name} /> : <div className="placeholder" />}
                </div>
                <div className="product-meta">
                  <div className="product-name">{p.name}</div>
                  <div className="product-price">{formatPrice(p.price_cents, p.currency)}</div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
