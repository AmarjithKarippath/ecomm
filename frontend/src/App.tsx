import { Link, Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { clearSession, getStoredUser, getToken } from "./api";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Products from "./pages/Products";
import ProductEdit from "./pages/ProductEdit";
import Storefront from "./pages/Storefront";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import OrderConfirmation from "./pages/OrderConfirmation";
import Orders from "./pages/Orders";
import OrderDetail from "./pages/OrderDetail";
import { useLocation } from "react-router-dom";

function RequireAuth({ children }: { children: JSX.Element }) {
  return getToken() ? children : <Navigate to="/login" replace />;
}

function Nav() {
  const user = getStoredUser();
  const nav = useNavigate();
  const loc = useLocation();
  if (!user) return null;
  if (loc.pathname.startsWith("/s/")) return null;
  return (
    <div className="nav">
      <div className="row" style={{ gap: 16 }}>
        <span className="brand">ecomm</span>
        <Link to="/products">Your Product</Link>
        <Link to="/orders">Orders</Link>
      </div>
      <div className="row" style={{ gap: 12 }}>
        <span className="muted">{user.store.name} · /s/{user.store.slug}</span>
        <button
          className="btn secondary"
          onClick={() => {
            clearSession();
            nav("/login");
          }}
        >
          Sign out
        </button>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <>
      <Nav />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route
          path="/products"
          element={
            <RequireAuth>
              <Products />
            </RequireAuth>
          }
        />
        <Route
          path="/products/new"
          element={
            <RequireAuth>
              <ProductEdit />
            </RequireAuth>
          }
        />
        <Route
          path="/products/:id"
          element={
            <RequireAuth>
              <ProductEdit />
            </RequireAuth>
          }
        />
        <Route
          path="/orders"
          element={
            <RequireAuth>
              <Orders />
            </RequireAuth>
          }
        />
        <Route
          path="/orders/:id"
          element={
            <RequireAuth>
              <OrderDetail />
            </RequireAuth>
          }
        />
        <Route path="/s/:slug" element={<Storefront />} />
        <Route path="/s/:slug/p/:id" element={<ProductDetail />} />
        <Route path="/s/:slug/cart" element={<Cart />} />
        <Route path="/s/:slug/checkout" element={<Checkout />} />
        <Route path="/s/:slug/orders/:orderNumber" element={<OrderConfirmation />} />
        <Route path="*" element={<Navigate to={getToken() ? "/products" : "/login"} replace />} />
      </Routes>
    </>
  );
}
