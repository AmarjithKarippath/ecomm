import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api, PublicProduct, Store } from "../api";
import { addToCart, formatPrice } from "../cart";
import StorefrontHeader from "../components/StorefrontHeader";

export default function ProductDetail() {
  const { slug = "", id = "" } = useParams();
  const nav = useNavigate();
  const [product, setProduct] = useState<PublicProduct | null>(null);
  const [store, setStore] = useState<Store | null>(null);
  const [qty, setQty] = useState(1);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      api.getPublicStore(slug),
      api.getPublicProduct(slug, Number(id)),
    ])
      .then(([page, p]) => {
        setStore(page.store);
        setProduct(p);
      })
      .catch((e) => setError(e.message));
  }, [slug, id]);

  if (error) return <div className="container"><div className="card"><h2>{error}</h2></div></div>;
  if (!product || !store) return <div className="container"><p className="muted">Loading...</p></div>;

  const outOfStock = product.inventory <= 0;

  function onAdd() {
    if (!product) return;
    addToCart(slug, {
      product_id: product.id,
      name: product.name,
      unit_price_cents: product.price_cents,
      currency: product.currency,
      image_url: product.image_url,
    }, qty);
    nav(`/s/${slug}/cart`);
  }

  return (
    <>
      <StorefrontHeader store={store} />
      <div className="container">
        <div className="detail">
          <div className="detail-image">
            {product.image_url ? <img src={product.image_url} alt={product.name} /> : <div className="placeholder" />}
          </div>
          <div>
            <h1 style={{ marginTop: 0 }}>{product.name}</h1>
            <div className="product-price" style={{ fontSize: 22 }}>{formatPrice(product.price_cents, product.currency)}</div>
            {product.description && <p style={{ whiteSpace: "pre-wrap" }}>{product.description}</p>}
            <p className="muted">{outOfStock ? "Out of stock" : `${product.inventory} in stock`}</p>
            <div className="row" style={{ marginTop: 16 }}>
              <input
                className="input"
                style={{ width: 80 }}
                type="number"
                min={1}
                max={Math.max(1, product.inventory)}
                value={qty}
                disabled={outOfStock}
                onChange={(e) => setQty(Math.max(1, Number(e.target.value)))}
              />
              <button className="btn" disabled={outOfStock} onClick={onAdd}>
                {outOfStock ? "Unavailable" : "Add to cart"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
