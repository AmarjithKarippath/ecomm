import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { api } from "../api";

/**
 * Single-product-store routing helper. There is no list of products in this
 * branch; visiting /products either lands the merchant on their product's
 * edit page, or — if they don't have one yet — on the create page.
 */
export default function Products() {
  const [target, setTarget] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getMyProduct()
      .then((p) => setTarget(p ? `/products/${p.id}` : "/products/new"))
      .catch((e) => setError(e.message));
  }, []);

  if (error) return <div className="container"><div className="card"><h2>{error}</h2></div></div>;
  if (!target) return <div className="container"><p className="muted">Loading...</p></div>;
  return <Navigate to={target} replace />;
}
