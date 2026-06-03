import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api, ProductInput } from "../api";

const empty: ProductInput = {
  name: "",
  description: "",
  price_cents: 0,
  currency: "USD",
  image_url: null,
  inventory: 0,
};

export default function ProductEdit() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const nav = useNavigate();
  const [form, setForm] = useState<ProductInput>(empty);
  const [priceDisplay, setPriceDisplay] = useState("0.00");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!isEdit) return;
    api.getProduct(Number(id)).then((p) => {
      setForm({
        name: p.name,
        description: p.description ?? "",
        price_cents: p.price_cents,
        currency: p.currency,
        image_url: p.image_url,
        inventory: p.inventory,
      });
      setPriceDisplay((p.price_cents / 100).toFixed(2));
    }).catch((e) => setError(e.message));
  }, [id]);

  function update<K extends keyof ProductInput>(key: K, value: ProductInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onImage(e: ChangeEvent<HTMLInputElement>) {
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
        price_cents: Math.round(parseFloat(priceDisplay || "0") * 100),
      };
      if (isEdit) await api.updateProduct(Number(id), payload);
      else await api.createProduct(payload);
      nav("/products");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="container" style={{ maxWidth: 640 }}>
      <h2>{isEdit ? "Edit product" : "New product"}</h2>
      <div className="card">
        <form onSubmit={onSubmit}>
          <div className="field">
            <label>Name</label>
            <input className="input" required value={form.name} onChange={(e) => update("name", e.target.value)} />
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
            <label>Image</label>
            {form.image_url && <div style={{ marginBottom: 8 }}><img src={form.image_url} alt="" style={{ maxHeight: 120, borderRadius: 6 }} /></div>}
            <input type="file" accept="image/*" onChange={onImage} disabled={uploading} />
            {uploading && <div className="muted" style={{ fontSize: 12 }}>Uploading...</div>}
          </div>
          <div className="row" style={{ marginTop: 8 }}>
            <button className="btn" disabled={busy}>{busy ? "Saving..." : isEdit ? "Save changes" : "Create product"}</button>
            <button type="button" className="btn secondary" onClick={() => nav("/products")}>Cancel</button>
          </div>
          {error && <div className="error">{error}</div>}
        </form>
      </div>
    </div>
  );
}
