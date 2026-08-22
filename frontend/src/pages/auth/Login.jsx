// Login.jsx
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import { Eye, EyeOff } from "lucide-react";
import "./liquid.css";

const randomImg = `https://picsum.photos/900/1200?random=${Math.floor(Math.random() * 1000)}`;

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await login(email, password);

    setLoading(false);

    if (result.success) {
      navigate("/", { replace: true });
    } else {
      setError(result.message);
    }
  };

  return (
    <div className="auth-page">

      {/* ── Left Panel ── */}
      <div className="auth-panel-left">
        <img
          className="bg-photo"
          src={randomImg}
          alt=""
        />

        <div className="auth-brand">
          <img src="/tsfe_icon.svg" alt="TSFE" />
          <span className="auth-brand-name">TSFE</span>
        </div>

        <div className="auth-panel-left-content">
          <h1>
            Asset<br />
            <span>Management</span><br />
            Simplified.
          </h1>
          <p>
            Track, manage and audit your organisation's assets — all from one unified platform.
          </p>
          <div className="auth-panel-left-dots">
            <span className="active"></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </div>

      {/* ── Right Panel ── */}
      <div className="auth-panel-right">
        <div className="auth-form-card">

          <img src="/tsfe_icon.svg" className="auth-logo" alt="TSFE" style={{ filter: "none" }} />

          <p className="form-eyebrow">Welcome back</p>
          <h2>Sign In</h2>
          <p className="form-subtitle">Enter your credentials to continue</p>

          {error && <div className="auth-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="field-group">

              <div className="field-wrap">
                <label>Email</label>
                <input
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="field-wrap">
                <label>Password</label>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="has-icon"
                />
                <button
                  type="button"
                  className="field-icon-btn"
                  onClick={() => setShowPassword((p) => !p)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

            </div>

            <button className="auth-btn" disabled={loading} type="submit">
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </form>

          <div className="auth-footer">
            <div className="auth-footer-row">
              <Link to="/forgot-password">Forgot password?</Link>
              <span className="divider"></span>
              <Link to="/signup">Create account</Link>
            </div>
          </div>

        </div>

        {loading && (
          <div className="loading-overlay">
            <div className="spinner"></div>
          </div>
        )}
      </div>
    </div>
  );
}