// ForgotPassword.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import { Eye, EyeOff } from "lucide-react";
import "./liquid.css";

const randomImg = `https://picsum.photos/900/1200?random=${Math.floor(Math.random() * 1000)}`;

export default function ForgotPassword() {
  const navigate = useNavigate();
  const { forgotPassword, verifyOtp, resetPasswordOtp } = useAuth();

  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPasswordInfo, setShowPasswordInfo] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Step 1: Send OTP
  const handleSendOtp = async () => {
    setError("");
    setMessage("");
    setLoading(true);
    const res = await forgotPassword(email);
    setLoading(false);
    if (res.success) {
      setMessage(res.message);
      setStep(2);
    } else {
      setError(res.message);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async () => {
    setError("");
    setMessage("");
    setLoading(true);
    const res = await verifyOtp(email, otp);
    setLoading(false);
    if (res.success) {
      setMessage(res.message);
      setStep(3);
    } else {
      setError(res.message);
    }
  };

  // Step 3: Reset Password
  const handleResetPassword = async () => {
    setError("");
    setMessage("");
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    const res = await resetPasswordOtp(email, password, confirm);
    setLoading(false);
    if (res.success) {
      setMessage(res.message);
      setTimeout(() => navigate("/login"), 1500);
    } else {
      setError(res.message);
    }
  };

  const stepLabels = ["Enter email", "Verify OTP", "New password"];

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
            Secure<br />
            <span>Recovery</span><br />
            Process.
          </h1>
          <p>
            We'll guide you through a quick 3-step process to securely reset your password.
          </p>
          <div className="auth-panel-left-dots">
            <span></span>
            <span></span>
            <span className="active"></span>
          </div>
        </div>
      </div>

      {/* ── Right Panel ── */}
      <div className="auth-panel-right">
        <div className="auth-form-card">

          <img src="/tsfe_icon.svg" className="auth-logo" alt="TSFE" style={{ filter: "none" }} />

          {/* Step indicator */}
          <div className="step-indicator">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`step-dot ${s === step ? "active" : s < step ? "done" : ""}`}
              />
            ))}
          </div>

          <p className="form-eyebrow">Step {step} of 3 — {stepLabels[step - 1]}</p>
          <h2>Reset Password</h2>
          <p className="form-subtitle">
            {step === 1 && "Enter your email and we'll send a one-time code."}
            {step === 2 && "Enter the OTP sent to your inbox."}
            {step === 3 && "Choose a strong new password."}
          </p>

          {error && <div className="auth-error">{error}</div>}
          {message && <div className="auth-success">{message}</div>}

          {/* Step 1 */}
          {step === 1 && (
            <div className="field-group">
              <div className="field-wrap">
                <label>Email Address</label>
                <input
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <button className="auth-btn" onClick={handleSendOtp}>
                Send OTP
              </button>
            </div>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <div className="field-group">
              <div className="field-wrap">
                <label>One-Time Password</label>
                <input
                  type="text"
                  placeholder="Enter 6-digit OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                />
              </div>
              <button className="auth-btn" onClick={handleVerifyOtp}>
                Verify OTP
              </button>
            </div>
          )}

          {/* Step 3 */}
          {step === 3 && (
            <div className="field-group">

              <div className="field-wrap">
                <label>New Password</label>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setShowPasswordInfo(true)}
                  onBlur={() => setShowPasswordInfo(false)}
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
                <label>Confirm Password</label>
                <input
                  type={showConfirm ? "text" : "password"}
                  placeholder="••••••••"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="has-icon"
                />
                <button
                  type="button"
                  className="field-icon-btn"
                  onClick={() => setShowConfirm((p) => !p)}
                  aria-label={showConfirm ? "Hide confirm password" : "Show confirm password"}
                >
                  {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              <button className="auth-btn" onClick={handleResetPassword}>
                Reset Password
              </button>
            </div>
          )}

          <div className="auth-footer">
            <div className="auth-footer-row">
              <a href="/login" onClick={(e) => { e.preventDefault(); navigate("/login"); }}>
                Back to Sign In
              </a>
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