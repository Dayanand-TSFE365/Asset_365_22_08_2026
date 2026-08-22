// Signup.jsx
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import { Eye, EyeOff } from "lucide-react";
import "./liquid.css";

const randomImg = `https://picsum.photos/900/1200?random=${Math.floor(Math.random() * 1000)}`;

export default function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [contact, setContact] = useState("");
  const [company, setCompany] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordInfo, setShowPasswordInfo] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!/^\d{10}$/.test(contact)) {
      setError("Contact number must be exactly 10 digits");
      return;
    }

    try {
      setLoading(true);

      const result = await signup(email, password, contact, company);

      if (!result || typeof result !== "object") {
        throw new Error("Invalid server response");
      }

      if (result.success) {
        setMessage("Signup successful. Please verify your email.");
        setTimeout(() => navigate("/login"), 1500);
      } else {
        setError(result.message || "Signup failed");
      }
    } catch (err) {
      console.error("Signup Error:", err);
      let msg = "Something went wrong";
      if (err.response?.data?.detail) {
        const detail = err.response.data.detail;
        if (Array.isArray(detail)) {
          msg = detail.map((d) => d.msg).join(", ");
        } else if (typeof detail === "string") {
          msg = detail;
        }
      }
      setError(msg);
    } finally {
      setLoading(false);
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
            Join the<br />
            <span>Future</span> of<br />
            Asset Ops.
          </h1>
          <p>
            Create your account and start taking control of your asset lifecycle today.
          </p>
          <div className="auth-panel-left-dots">
            <span></span>
            <span className="active"></span>
            <span></span>
          </div>
        </div>
      </div>

      {/* ── Right Panel ── */}
      <div className="auth-panel-right compact">
        <div className="auth-form-card">

          <img src="/tsfe_icon.svg" className="auth-logo" alt="TSFE" style={{ filter: "none" }} />

          <p className="form-eyebrow">Get started</p>
          <h2>Create Account</h2>
          <p className="form-subtitle">Fill in your details to register</p>

          {error && <div className="auth-error">{String(error)}</div>}
          {message && <div className="auth-success">{message}</div>}

          <form onSubmit={handleSubmit}>
            <div className="field-group">

              <div className="field-wrap">
                <label>Email</label>
                <input
                  type="email"
                  placeholder="you@company.com"
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="field-wrap">
                <label>Password</label>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setShowPasswordInfo(true)}
                  onBlur={() => setShowPasswordInfo(false)}
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

                {showPasswordInfo && (
                  <div className="password-tooltip">
                    <strong>Requirements</strong>
                    <ul>
                      <li>Minimum 8 characters</li>
                      <li>At least one letter</li>
                      <li>At least one number</li>
                      <li>One special character (@$!%*?&)</li>
                    </ul>
                  </div>
                )}
              </div>

              <div className="field-wrap">
                <label>Contact Number</label>
                <input
                  type="text"
                  placeholder="10-digit mobile number"
                  value={contact}
                  maxLength={10}
                  onChange={(e) => setContact(e.target.value.replace(/\D/g, ""))}
                  required
                />
              </div>

              <div className="field-wrap">
                <label>Company Name</label>
                <input
                  type="text"
                  placeholder="Your organisation"
                  onChange={(e) => setCompany(e.target.value)}
                  required
                />
              </div>

            </div>

            <button className="auth-btn" disabled={loading} type="submit">
              {loading ? "Creating account…" : "Sign Up"}
            </button>
          </form>

          <div className="auth-footer">
            <div className="auth-footer-row">
              <Link to="/login">Already have an account? Sign in</Link>
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