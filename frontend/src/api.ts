const BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";
const TOKEN_KEY = "ecomm.token";
const USER_KEY = "ecomm.user";

export type Store = { id: number; name: string; slug: string };
export type User = { id: number; email: string; store: Store };
export type Product = {
  id: number;
  store_id: number;
  name: string;
  description: string | null;
  price_cents: number;
  currency: string;
  image_url: string | null;
  inventory: number;
};
export type ProductInput = Omit<Product, "id" | "store_id">;

export type PublicProduct = Omit<Product, "store_id">;
export type StorePage = {
  store: Store;
  products: PublicProduct[];
};

export type CheckoutInput = {
  buyer_email: string;
  shipping_name: string;
  shipping_phone: string;
  address_line1: string;
  address_line2?: string | null;
  city: string;
  state?: string | null;
  postal_code: string;
  country: string;
  notes?: string | null;
  items: { product_id: number; quantity: number }[];
};

export type OrderItemOut = {
  product_id: number;
  name: string;
  unit_price_cents: number;
  quantity: number;
  line_total_cents: number;
};

export type MerchantOrderSummary = {
  id: number;
  order_number: string;
  status: string;
  payment_method: string;
  currency: string;
  total_cents: number;
  item_count: number;
  buyer_email: string;
  shipping_name: string;
  city: string;
  country: string;
  created_at: string;
};

export type MerchantOrderDetail = MerchantOrderSummary & {
  shipping_phone: string;
  address_line1: string;
  address_line2: string | null;
  state: string | null;
  postal_code: string;
  notes: string | null;
  items: OrderItemOut[];
  allowed_next_statuses: string[];
};

export type OrderOut = {
  order_number: string;
  store_slug: string;
  status: string;
  payment_method: string;
  currency: string;
  total_cents: number;
  buyer_email: string;
  shipping_name: string;
  shipping_phone: string;
  address_line1: string;
  address_line2: string | null;
  city: string;
  state: string | null;
  postal_code: string;
  country: string;
  notes: string | null;
  items: OrderItemOut[];
};

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser(): User | null {
  const raw = localStorage.getItem(USER_KEY);
  return raw ? (JSON.parse(raw) as User) : null;
}

export function setSession(token: string, user: User) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (!headers.has("Content-Type") && init.body && !(init.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(`${BASE}${path}`, { ...init, headers });
  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const detail = (data && (data.detail || data.message)) || res.statusText;
    throw new Error(typeof detail === "string" ? detail : JSON.stringify(detail));
  }
  return data as T;
}

export const api = {
  signup: (body: { email: string; password: string; store_name: string }) =>
    request<{ access_token: string; user: User }>("/auth/signup", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  login: (body: { email: string; password: string }) =>
    request<{ access_token: string; user: User }>("/auth/login", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  me: () => request<User>("/auth/me"),

  listProducts: () => request<Product[]>("/products"),
  getProduct: (id: number) => request<Product>(`/products/${id}`),
  createProduct: (p: ProductInput) =>
    request<Product>("/products", { method: "POST", body: JSON.stringify(p) }),
  updateProduct: (id: number, p: ProductInput) =>
    request<Product>(`/products/${id}`, { method: "PUT", body: JSON.stringify(p) }),
  deleteProduct: (id: number) =>
    request<void>(`/products/${id}`, { method: "DELETE" }),

  getPublicStore: (slug: string) => request<StorePage>(`/public/stores/${slug}`),
  getPublicProduct: (slug: string, id: number) =>
    request<PublicProduct>(`/public/stores/${slug}/products/${id}`),
  checkoutCod: (slug: string, body: CheckoutInput) =>
    request<OrderOut>(`/public/stores/${slug}/checkout`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  getPublicOrder: (slug: string, orderNumber: string) =>
    request<OrderOut>(`/public/stores/${slug}/orders/${orderNumber}`),

  listOrders: (statusFilter?: string) => {
    const q = statusFilter ? `?status_filter=${encodeURIComponent(statusFilter)}` : "";
    return request<MerchantOrderSummary[]>(`/orders${q}`);
  },
  getOrder: (id: number) => request<MerchantOrderDetail>(`/orders/${id}`),
  orderStats: () => request<Record<string, { count: number; total_cents: number }>>(`/orders/stats`),
  updateOrderStatus: (id: number, status: string) =>
    request<MerchantOrderDetail>(`/orders/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),

  uploadImage: (file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    return request<{ url: string }>("/products/images", { method: "POST", body: fd });
  },
};
