import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api, Product, ProductAddon, ProductImage, ProductInput, ProductTier } from "../api";

type Tab = "basics" | "gallery" | "offers" | "scarcity";

const empty: ProductInput = {
  name: "",
  subtitle: "",
  description: "",
  price_cents: 0,
  compare_at_price_cents: null,
  currency: "USD",
  image_url: null,
  inventory: 0,
  sale_ends_at: null,
  low_stock_threshold: 0,
};

function priceToInput(cents: number | null | undefined): string {
  if (cents == null) return "";
  return (cents / 100).toFixed(2);
}
function inputToPrice(s: string): number | null {
  if (!s.trim()) return null;
  const n = parseFloat(s);
  return Number.isFinite(n) ? Math.round(n * 100) : null;
}

export default function ProductEdit() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const nav = useNavigate();

  const [product, setProduct] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductInput>(empty);
  const [priceDisplay, setPriceDisplay] = useState("0.00");
  const [compareDisplay, setCompareDisplay] = useState("");
  const [saleEndsLocal, setSaleEndsLocal] = useState<string>("");  // datetime-local string
  const [tab, setTab] = useState<Tab>("basics");
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load product if editing
  useEffect(() => {
    if (!isEdit) return;
    api.getProduct(Number(id)).then((p) => {
      setProduct(p);
      setForm({
        name: p.name,
        subtitle: p.subtitle ?? "",
        description: p.description ?? "",
        price_cents: p.price_cents,
        compare_at_price_cents: p.compare_at_price_cents,
        currency: p.currency,
        image_url: p.image_url,
        inventory: p.inventory,
        sale_ends_at: p.sale_ends_at,
        low_stock_threshold: p.low_stock_threshold,
      });
      setPriceDisplay(priceToInput(p.price_cents));
      setCompareDisplay(priceToInput(p.compare_at_price_cents));
      setSaleEndsLocal(p.sale_ends_at ? toLocalInput(p.sale_ends_at) : "");
    }).catch((e) => setError(e.message));
  }, [id]);

  function update<K extends keyof ProductInput>(key: K, value: ProductInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onHeroImage(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { url } = await api.uploadImage(file);
      update("image_url", url);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const payload: ProductInput = {
        ...form,
        price_cents: inputToPrice(priceDisplay) ?? 0,
        compare_at_price_cents: inputToPrice(compareDisplay),
        sale_ends_at: saleEndsLocal ? fromLocalInput(saleEndsLocal) : null,
      };
      if (isEdit) {
        const updated = await api.updateProduct(Number(id), payload);
        setProduct(updated);
      } else {
        const created = await api.createProduct(payload);
        nav(`/products/${created.id}`, { replace: true });
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="container" style={{ maxWidth: 860 }}>
      <h2 style={{ marginBottom: 4 }}>{isEdit ? "Your product" : "Create your product"}</h2>
      <p className="muted" style={{ marginTop: 0 }}>
        Single-product store — focus everything on this one item.
      </p>

      {isEdit && (
        <div className="tabs">
          {(["basics", "gallery", "offers", "scarcity"] as Tab[]).map((t) => (
            <button
              key={t}
              className={`tab ${tab === t ? "tab-active" : ""}`}
              onClick={() => setTab(t)}
              type="button"
            >
              {t[0].toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      )}

      {(!isEdit || tab === "basics") && (
        <div className="card">
          <form onSubmit={onSubmit}>
            <div className="field">
              <label>Name</label>
              <input className="input" required value={form.name} onChange={(e) => update("name", e.target.value)} />
            </div>
            <div className="field">
              <label>Subtitle <span className="muted" style={{ fontWeight: 400 }}>(short tagline shown under the name)</span></label>
              <input className="input" value={form.subtitle ?? ""} maxLength={280} onChange={(e) => update("subtitle", e.target.value)} />
            </div>
            <div className="field">
              <label>Description</label>
              <textarea className="textarea" value={form.description ?? ""} onChange={(e) => update("description", e.target.value)} />
            </div>
            <div className="row">
              <div className="field grow">
                <label>Price</label>
                <input className="input" inputMode="decimal" value={priceDisplay} onChange={(e) => setPriceDisplay(e.target.value)} />
              </div>
              <div className="field grow">
                <label>Compare-at price <span className="muted" style={{ fontWeight: 400 }}>(strike-through)</span></label>
                <input className="input" inputMode="decimal" value={compareDisplay} onChange={(e) => setCompareDisplay(e.target.value)} />
              </div>
              <div className="field" style={{ width: 100 }}>
                <label>Currency</label>
                <input className="input" maxLength={3} value={form.currency} onChange={(e) => update("currency", e.target.value.toUpperCase())} />
              </div>
              <div className="field" style={{ width: 120 }}>
                <label>Inventory</label>
                <input className="input" type="number" min={0} value={form.inventory} onChange={(e) => update("inventory", Number(e.target.value))} />
              </div>
            </div>
            <div className="field">
              <label>Hero image</label>
              {form.image_url && <div style={{ marginBottom: 8 }}><img src={form.image_url} alt="" style={{ maxHeight: 140, borderRadius: 6 }} /></div>}
              <input type="file" accept="image/*" onChange={onHeroImage} disabled={uploading} />
              {uploading && <div className="muted" style={{ fontSize: 12 }}>Uploading...</div>}
            </div>
            {error && <div className="error">{error}</div>}
            <div className="row" style={{ marginTop: 8 }}>
              <button className="btn" disabled={busy}>{busy ? "Saving..." : isEdit ? "Save changes" : "Create product"}</button>
            </div>
          </form>
        </div>
      )}

      {isEdit && product && tab === "gallery" && <GalleryTab product={product} onChange={setProduct} />}
      {isEdit && product && tab === "offers" && <OffersTab product={product} onChange={setProduct} />}
      {isEdit && product && tab === "scarcity" && (
        <ScarcityTab
          product={product}
          form={form}
          update={update}
          saleEndsLocal={saleEndsLocal}
          setSaleEndsLocal={setSaleEndsLocal}
          onSubmit={onSubmit}
          busy={busy}
        />
      )}
    </div>
  );
}

// ---------- Gallery tab ----------
function GalleryTab({ product, onChange }: { product: Product; onChange: (p: Product) => void }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const { url } = await api.uploadImage(file);
      await api.addGalleryImage(product.id, { url, alt: null, position: product.images.length });
      const refreshed = await api.getProduct(product.id);
      onChange(refreshed);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }

  async function onDelete(img: ProductImage) {
    if (!confirm("Remove this image?")) return;
    await api.deleteGalleryImage(product.id, img.id);
    onChange(await api.getProduct(product.id));
  }

  return (
    <div className="card">
      <h3 style={{ marginTop: 0 }}>Gallery</h3>
      <p className="muted">Up to 8 supporting images shown beneath the hero on the product page.</p>
      <div className="gallery-grid">
        {product.images.map((img) => (
          <div key={img.id} className="gallery-thumb">
            <img src={img.url} alt={img.alt ?? ""} />
            <button className="btn secondary thumb-delete" onClick={() => onDelete(img)}>Remove</button>
          </div>
        ))}
      </div>
      <div className="field" style={{ marginTop: 16 }}>
        <label>Add an image</label>
        <input type="file" accept="image/*" onChange={onUpload} disabled={uploading || product.images.length >= 8} />
        {product.images.length >= 8 && <div className="muted" style={{ fontSize: 12 }}>Max 8 images.</div>}
      </div>
      {error && <div className="error">{error}</div>}
    </div>
  );
}

// ---------- Offers tab ----------
function OffersTab({ product, onChange }: { product: Product; onChange: (p: Product) => void }) {
  return (
    <>
      <TiersCard product={product} onChange={onChange} />
      <AddonsCard product={product} onChange={onChange} />
    </>
  );
}

function TiersCard({ product, onChange }: { product: Product; onChange: (p: Product) => void }) {
  const [minQty, setMinQty] = useState(2);
  const [pct, setPct] = useState(10);
  const [error, setError] = useState<string | null>(null);

  async function add() {
    setError(null);
    try {
      await api.addTier(product.id, { min_quantity: minQty, discount_pct: pct });
      onChange(await api.getProduct(product.id));
    } catch (err: any) {
      setError(err.message);
    }
  }
  async function remove(t: ProductTier) {
    if (!confirm(`Remove "Buy ${t.min_quantity}+, save ${t.discount_pct}%"?`)) return;
    await api.deleteTier(product.id, t.id);
    onChange(await api.getProduct(product.id));
  }

  return (
    <div className="card">
      <h3 style={{ marginTop: 0 }}>Quantity discounts</h3>
      <p className="muted">Tiered pricing: "Buy 2, save 10%". Highest-discount tier the buyer qualifies for is applied automatically.</p>
      {product.tiers.length === 0 ? (
        <p className="muted">No tiers yet.</p>
      ) : (
        <table>
          <thead><tr><th>Buy at least</th><th>Discount</th><th></th></tr></thead>
          <tbody>
            {product.tiers.map((t) => (
              <tr key={t.id}>
                <td>{t.min_quantity}</td>
                <td>{t.discount_pct}%</td>
                <td><button className="btn secondary" onClick={() => remove(t)}>Remove</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <div className="row" style={{ marginTop: 12, alignItems: "flex-end" }}>
        <div className="field" style={{ width: 140 }}>
          <label>Min quantity</label>
          <input className="input" type="number" min={1} value={minQty} onChange={(e) => setMinQty(Number(e.target.value))} />
        </div>
        <div className="field" style={{ width: 140 }}>
          <label>Discount %</label>
          <input className="input" type="number" min={1} max={99} value={pct} onChange={(e) => setPct(Number(e.target.value))} />
        </div>
        <button className="btn" type="button" onClick={add}>+ Add tier</button>
      </div>
      {error && <div className="error">{error}</div>}
    </div>
  );
}

function AddonsCard({ product, onChange }: { product: Product; onChange: (p: Product) => void }) {
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [priceDisplay, setPriceDisplay] = useState("0.00");
  const [error, setError] = useState<string | null>(null);

  async function add() {
    setError(null);
    try {
      await api.addAddon(product.id, {
        name,
        description: desc || null,
        price_cents: inputToPrice(priceDisplay) ?? 0,
        image_url: null,
        is_active: true,
        position: product.addons.length,
      });
      setName(""); setDesc(""); setPriceDisplay("0.00");
      onChange(await api.getProduct(product.id));
    } catch (err: any) {
      setError(err.message);
    }
  }
  async function toggle(a: ProductAddon) {
    await api.updateAddon(product.id, a.id, { ...a, is_active: !a.is_active });
    onChange(await api.getProduct(product.id));
  }
  async function remove(a: ProductAddon) {
    if (!confirm(`Remove "${a.name}"?`)) return;
    await api.deleteAddon(product.id, a.id);
    onChange(await api.getProduct(product.id));
  }

  return (
    <div className="card">
      <h3 style={{ marginTop: 0 }}>Bundle add-ons</h3>
      <p className="muted">Optional items the buyer can tack on at checkout (gift wrap, accessory, etc).</p>
      {product.addons.length === 0 ? (
        <p className="muted">No add-ons yet.</p>
      ) : (
        <table>
          <thead><tr><th>Name</th><th>Price</th><th>Active</th><th></th></tr></thead>
          <tbody>
            {product.addons.map((a) => (
              <tr key={a.id} style={{ opacity: a.is_active ? 1 : 0.55 }}>
                <td>
                  <div style={{ fontWeight: 600 }}>{a.name}</div>
                  {a.description && <div className="muted" style={{ fontSize: 12 }}>{a.description}</div>}
                </td>
                <td>{(a.price_cents / 100).toFixed(2)}</td>
                <td><button className="btn secondary" onClick={() => toggle(a)}>{a.is_active ? "Disable" : "Enable"}</button></td>
                <td><button className="btn secondary" onClick={() => remove(a)}>Remove</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <div style={{ marginTop: 14 }}>
        <div className="field"><label>Name</label><input className="input" value={name} onChange={(e) => setName(e.target.value)} /></div>
        <div className="field"><label>Description</label><input className="input" value={desc} onChange={(e) => setDesc(e.target.value)} /></div>
        <div className="row" style={{ alignItems: "flex-end" }}>
          <div className="field" style={{ width: 160 }}>
            <label>Price</label>
            <input className="input" inputMode="decimal" value={priceDisplay} onChange={(e) => setPriceDisplay(e.target.value)} />
          </div>
          <button className="btn" type="button" disabled={!name} onClick={add}>+ Add add-on</button>
        </div>
      </div>
      {error && <div className="error">{error}</div>}
    </div>
  );
}

// ---------- Scarcity tab ----------
function ScarcityTab({
  product, form, update, saleEndsLocal, setSaleEndsLocal, onSubmit, busy,
}: {
  product: Product;
  form: ProductInput;
  update: <K extends keyof ProductInput>(key: K, value: ProductInput[K]) => void;
  saleEndsLocal: string;
  setSaleEndsLocal: (s: string) => void;
  onSubmit: (e: FormEvent) => void;
  busy: boolean;
}) {
  return (
    <div className="card">
      <h3 style={{ marginTop: 0 }}>Scarcity</h3>
      <p className="muted">
        Pure conversion psychology — no hard lock-out. Buyers can still purchase after the countdown ends or below threshold.
      </p>
      <form onSubmit={onSubmit}>
        <div className="field">
          <label>Sale ends at <span className="muted" style={{ fontWeight: 400 }}>(shows a countdown on the product page)</span></label>
          <input className="input" type="datetime-local" value={saleEndsLocal} onChange={(e) => setSaleEndsLocal(e.target.value)} />
          {saleEndsLocal && <button type="button" className="btn secondary" style={{ marginTop: 8 }} onClick={() => setSaleEndsLocal("")}>Clear</button>}
        </div>
        <div className="field" style={{ maxWidth: 200 }}>
          <label>Low-stock threshold <span className="muted" style={{ fontWeight: 400 }}>("Only X left!" when inventory ≤ this)</span></label>
          <input
            className="input"
            type="number"
            min={0}
            value={form.low_stock_threshold}
            onChange={(e) => update("low_stock_threshold", Number(e.target.value))}
          />
        </div>
        <p className="muted" style={{ fontSize: 13 }}>Current inventory: <strong>{product.inventory}</strong></p>
        <button className="btn" disabled={busy}>{busy ? "Saving..." : "Save changes"}</button>
      </form>
    </div>
  );
}

// ---------- datetime helpers ----------
function toLocalInput(iso: string): string {
  // ISO -> "YYYY-MM-DDTHH:mm" for <input type="datetime-local">
  const d = new Date(iso);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function fromLocalInput(s: string): string {
  return new Date(s).toISOString();
}
