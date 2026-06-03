export type CartLine = {
  product_id: number;
  name: string;
  unit_price_cents: number;
  currency: string;
  image_url: string | null;
  quantity: number;
};

const key = (slug: string) => `ecomm.cart.${slug}`;

export function getCart(slug: string): CartLine[] {
  const raw = localStorage.getItem(key(slug));
  return raw ? (JSON.parse(raw) as CartLine[]) : [];
}

export function saveCart(slug: string, lines: CartLine[]) {
  localStorage.setItem(key(slug), JSON.stringify(lines));
  window.dispatchEvent(new CustomEvent("cart-changed", { detail: { slug } }));
}

export function addToCart(slug: string, line: Omit<CartLine, "quantity">, qty = 1) {
  const lines = getCart(slug);
  const existing = lines.find((l) => l.product_id === line.product_id);
  if (existing) existing.quantity += qty;
  else lines.push({ ...line, quantity: qty });
  saveCart(slug, lines);
}

export function setQuantity(slug: string, productId: number, qty: number) {
  const lines = getCart(slug).map((l) =>
    l.product_id === productId ? { ...l, quantity: Math.max(0, qty) } : l
  ).filter((l) => l.quantity > 0);
  saveCart(slug, lines);
}

export function removeFromCart(slug: string, productId: number) {
  saveCart(slug, getCart(slug).filter((l) => l.product_id !== productId));
}

export function clearCart(slug: string) {
  saveCart(slug, []);
}

export function cartCount(slug: string): number {
  return getCart(slug).reduce((n, l) => n + l.quantity, 0);
}

export function cartTotalCents(lines: CartLine[]): number {
  return lines.reduce((s, l) => s + l.unit_price_cents * l.quantity, 0);
}

export function formatPrice(cents: number, currency: string): string {
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(cents / 100);
  } catch {
    return `${(cents / 100).toFixed(2)} ${currency}`;
  }
}
