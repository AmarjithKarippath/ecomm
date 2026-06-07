const BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";
const TOKEN_KEY = "ecomm.token";
const USER_KEY = "ecomm.user";

export type Store = { id: number; name: string; slug: string };
export type User = { id: number; email: string; store: Store };

export type ProductImage = { id: number; url: string; alt: string | null; position: number };
export type ProductImageInput = Omit<ProductImage, "id">;

export type ProductTier = { id: number; min_quantity: number; discount_pct: number };
export type ProductTierInput = Omit<ProductTier, "id">;

export type ProductAddon = {
  id: number;
  name: string;
  description: string | null;
  price_cents: number;
  image_url: string | null;
  is_active: boolean;
  position: number;
};
export type ProductAddonInput = Omit<ProductAddon, "id">;

export type Product = {
  id: number;
  store_id: number;
  name: string;
  subtitle: string | null;
  description: string | null;
  price_cents: number;
  compare_at_price_cents: number | null;
  currency: string;
  image_url: string | null;
  inventory: number;
  sale_ends_at: string | null;
  low_stock_threshold: number;
  images: ProductImage[];
  tiers: ProductTier[];
  addons: ProductAddon[];
};
export type ProductInput = {
  name: string;
  subtitle?: string | null;
  description?: string | null;
  price_cents: number;
  compare_at_price_cents?: number | null;
  currency: string;
  image_url?: string | null;
  inventory: number;
  sale_ends_at?: string | null;
  low_stock_threshold: number;
};

export type PublicAddon = Omit<ProductAddon, "is_active" | "position">;
export type PublicProduct = Omit<Product, "store_id" | "addons"> & { addons: PublicAddon[] };
export type StorePage = { store: Store; product: PublicProduct | null };

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
  addon_ids: number[];
};

export type OrderItemOut = {
  kind: "product" | "addon";
  product_id: number | null;
  addon_id: number | null;
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
  subtotal_cents: number;
  discount_cents: number;
  items: OrderItemOut[];
  allowed_next_statuses: string[];
};

export type OrderOut = {
  order_number: string;
  store_slug: string;
  status: string;
  payment_method: string;
  currency: string;
  subtotal_cents: number;
  discount_cents: number;
  total_cents: number;
  applied_tier_id: number | null;
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

  // Single-product helpers
  listProducts: () => request<Product[]>("/products"),
  getMyProduct: async (): Promise<Product | null> => {
    const list = await request<Product[]>("/products");
    return list[0] ?? null;
  },
  getProduct: (id: number) => request<Product>(`/products/${id}`),
  createProduct: (p: ProductInput) =>
    request<Product>("/products", { method: "POST", body: JSON.stringify(p) }),
  updateProduct: (id: number, p: ProductInput) =>
    request<Product>(`/products/${id}`, { method: "PUT", body: JSON.stringify(p) }),
  deleteProduct: (id: number) =>
    request<void>(`/products/${id}`, { method: "DELETE" }),

  // Gallery
  addGalleryImage: (productId: number, img: ProductImageInput) =>
    request<ProductImage>(`/products/${productId}/gallery`, {
      method: "POST", body: JSON.stringify(img),
    }),
  deleteGalleryImage: (productId: number, imageId: number) =>
    request<void>(`/products/${productId}/gallery/${imageId}`, { method: "DELETE" }),

  // Tiers
  addTier: (productId: number, t: ProductTierInput) =>
    request<ProductTier>(`/products/${productId}/tiers`, {
      method: "POST", body: JSON.stringify(t),
    }),
  deleteTier: (productId: number, tierId: number) =>
    request<void>(`/products/${productId}/tiers/${tierId}`, { method: "DELETE" }),

  // Addons
  addAddon: (productId: number, a: ProductAddonInput) =>
    request<ProductAddon>(`/products/${productId}/addons`, {
      method: "POST", body: JSON.stringify(a),
    }),
  updateAddon: (productId: number, addonId: number, a: ProductAddonInput) =>
    request<ProductAddon>(`/products/${productId}/addons/${addonId}`, {
      method: "PUT", body: JSON.stringify(a),
    }),
  deleteAddon: (productId: number, addonId: number) =>
    request<void>(`/products/${productId}/addons/${addonId}`, { method: "DELETE" }),

  // Storefront / checkout
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
