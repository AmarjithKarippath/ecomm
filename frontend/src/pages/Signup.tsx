import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, setSession } from "../api";

export default function Signup() {
  const nav = useNavigate();
  const [storeName, setStoreName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const { access_token, user } = await api.signup({
        email,
        password,
        store_name: storeName,
      });
      setSession(access_token, user);
      nav("/products");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="container" style={{ maxWidth: 420, marginTop: 80 }}>
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Create your store</h2>
        <form onSubmit={onSubmit}>
          <div className="field">
            <label>Store name</label>
            <input className="input" value={storeName} required minLength={2} onChange={(e) => setStoreName(e.target.value)} />
          </div>
          <div className="field">
            <label>Email</label>
            <input className="input" type="email" value={email} required onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="field">
            <label>Password</label>
            <input className="input" type="password" value={password} required minLength={8} onChange={(e) => setPassword(e.target.value)} />
            <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>At least 8 characters.</div>
          </div>
          <button className="btn" disabled={busy}>{busy ? "Creating..." : "Create store"}</button>
          {error && <div className="error">{error}</div>}
        </form>
        <p className="muted" style={{ marginTop: 16 }}>
          Already have a store? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
