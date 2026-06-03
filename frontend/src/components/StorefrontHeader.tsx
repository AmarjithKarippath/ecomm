import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Store } from "../api";
import { cartCount } from "../cart";

export default function StorefrontHeader({ store }: { store: Store }) {
  const [count, setCount] = useState(() => cartCount(store.slug));

  useEffect(() => {
    const handler = () => setCount(cartCount(store.slug));
    window.addEventListener("cart-changed", handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener("cart-changed", handler);
      window.removeEventListener("storage", handler);
    };
  }, [store.slug]);

  return (
    <div className="storefront-header">
      <div className="container row">
        <Link to={`/s/${store.slug}`} className="grow" style={{ color: "inherit" }}>
          <h2 style={{ margin: 0 }}>{store.name}</h2>
        </Link>
        <Link to={`/s/${store.slug}/cart`} className="cart-link">
          Cart{count > 0 && <span className="cart-badge">{count}</span>}
        </Link>
      </div>
    </div>
  );
}
