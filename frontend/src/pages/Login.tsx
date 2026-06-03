import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, setSession } from "../api";

export default function Login() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const { access_token, user } = await api.login({ email, password });
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
        <h2 style={{ marginTop: 0 }}>Sign in</h2>
        <form onSubmit={onSubmit}>
          <div className="field">
            <label>Email</label>
            <input className="input" type="email" value={email} required onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="field">
            <label>Password</label>
            <input className="input" type="password" value={password} required onChange={(e) => setPassword(e.target.value)} />
          </div>
          <button className="btn" disabled={busy}>{busy ? "Signing in..." : "Sign in"}</button>
          {error && <div className="error">{error}</div>}
        </form>
        <p className="muted" style={{ marginTop: 16 }}>
          New here? <Link to="/signup">Create a store</Link>
        </p>
      </div>
    </div>
  );
}
