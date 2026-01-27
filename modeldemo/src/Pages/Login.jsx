import React, { useState } from "react";
import api from "../Services/api";
import { useNavigate } from "react-router-dom";
import "./Login.css";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  
  // 🔐 Reset password states
  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [resetOtp, setResetOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetError, setResetError] = useState("");
  const [resetLoading, setResetLoading] = useState(false);

  const navigate = useNavigate();

  // =====================
  // LOGIN HANDLER
  // =====================
  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    // Basic validation
    if (!email.trim() || !password.trim()) {
      setError("Please enter both email and password");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("email", email);
      formData.append("password", password);

      const res = await api.post("/auth/login", formData);

      localStorage.setItem("token", res.data.access_token);
      localStorage.setItem("role", res.data.role);

      navigate("/home");
    } catch (err) {
      // Handle different error formats
      let errorMessage = "Login failed";
      
      if (err.response?.data) {
        const errorData = err.response.data;
        
        // Handle Pydantic validation errors
        if (errorData.detail && Array.isArray(errorData.detail)) {
          // Extract error messages from validation array
          errorMessage = errorData.detail.map(item => item.msg).join(", ");
        } 
        // Handle string error message
        else if (errorData.detail && typeof errorData.detail === "string") {
          errorMessage = errorData.detail;
        }
        // Handle object with msg property
        else if (errorData.detail && errorData.detail.msg) {
          errorMessage = errorData.detail.msg;
        }
        // Handle direct error message
        else if (errorData.message) {
          errorMessage = errorData.message;
        }
        // Handle other error formats
        else if (typeof errorData === "string") {
          errorMessage = errorData;
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    }
  };

  // =====================
  // RESET PASSWORD FUNCTIONS
  // =====================
const sendResetOtp = async () => {
  setResetError("");
  setResetLoading(true);

  try {
    await api.post("/auth/send-otp", {
      email: resetEmail,
      purpose: "reset_password"
    });

    setOtpSent(true);
  } catch (err) {
    setResetError(err.response?.data?.detail || "Failed to send OTP");
  } finally {
    setResetLoading(false);
  }
};


  const confirmReset = async () => {
    setResetError("");
    setResetLoading(true);
    try {
      await api.post("/auth/reset-password/confirm", {
        email: resetEmail,
        otp: resetOtp,
        new_password: newPassword,
        confirm_password: confirmPassword
      });

      alert("Password reset successful");
      setShowReset(false);
      setOtpSent(false);
      setResetEmail("");
      setResetOtp("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setResetError(err.response?.data?.detail || "Reset failed");
    } finally {
      setResetLoading(false);
    }
  };

  const handleCloseReset = () => {
    setShowReset(false);
    setOtpSent(false);
    setResetEmail("");
    setResetOtp("");
    setNewPassword("");
    setConfirmPassword("");
    setResetError("");
  };

  return (
    <div className="login-purple-container">
      {/* Background Elements */}
      <div className="login-purple-gradient-bg">
        <div className="login-gradient-circle login-circle-1"></div>
        <div className="login-gradient-circle login-circle-2"></div>
        <div className="login-gradient-circle login-circle-3"></div>
      </div>

      {/* Main Login Card */}
      <div className="login-purple-card">
        {/* Login Form Side */}
        <div className="login-form-side">
          <div className="login-form-container">
            <div className="login-form-header">
              <h2>Welcome Back</h2>
              <p className="login-form-subtitle">
                Sign in to access your fashion AI dashboard
              </p>
            </div>

            <form onSubmit={handleLogin} className="login-purple-form" autoComplete="off">
              {/* Hidden fake login form to completely trick Chrome */}
              <div style={{ display: 'none' }}>
                <input type="text" name="fake-username" autoComplete="username" />
                <input type="password" name="fake-password" autoComplete="current-password" />
              </div>
              
              <div className="login-input-group">
                <label htmlFor="login-email">Email Address</label>
                <div className="login-input-wrapper">
                  <div className="login-input-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                      <polyline points="22,6 12,13 2,6" />
                    </svg>
                  </div>
                  <input
                    id="login-email"
                    type="text"
                    inputMode="email"
                    placeholder="designer@fashion.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={(e) => {
                      e.target.removeAttribute('readonly');
                      e.target.setAttribute('type', 'email');
                    }}
                    onBlur={(e) => {
                      if (!e.target.value) {
                        e.target.setAttribute('readonly', true);
                        e.target.setAttribute('type', 'text');
                      }
                    }}
                    required
                    className="login-purple-input"
                    autoComplete="off"
                    autoCorrect="off"
                    spellCheck="false"
                    readOnly
                    name="user-identifier"
                    data-lpignore="true"
                    data-form-type="other"
                  />
                </div>
              </div>

              <div className="login-input-group">
                <label htmlFor="login-pass">Password</label>
                <div className="login-input-wrapper">
                  <div className="login-input-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  </div>
                  <input
                    id="login-pass"
                    type="text"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={(e) => {
                      e.target.removeAttribute('readonly');
                      e.target.setAttribute('type', 'password');
                    }}
                    onBlur={(e) => {
                      if (!e.target.value) {
                        e.target.setAttribute('readonly', true);
                        e.target.setAttribute('type', 'text');
                      }
                    }}
                    required
                    className="login-purple-input"
                    autoComplete="off"
                    readOnly
                    name="user-pin"
                    data-lpignore="true"
                    data-form-type="other"
                    style={{ fontFamily: 'text', letterSpacing: '2px' }}
                  />
                </div>
              </div>

              {/* Forgot Password Link */}
              <div className="login-forgot-password">
                <button
                  type="button"
                  className="login-forgot-password-btn"
                  onClick={() => {
                    setShowReset(true);
                    setResetEmail(email);
                  }}
                >
                  Forgot password?
                </button>
              </div>

              {/* Sign In Button */}
              <button type="submit" className="login-submit-btn">
                Sign In →
              </button>

              {/* Error Message */}
              {error && (
                <div className="login-error-message">
                  <svg className="login-error-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <circle cx="12" cy="12" r="10" strokeWidth="2" />
                    <line x1="12" y1="8" x2="12" y2="12" strokeWidth="2" strokeLinecap="round" />
                    <line x1="12" y1="16" x2="12" y2="16" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                  <span>{error}</span>
                </div>
              )}

              {/* Divider */}
              <div className="login-divider">or continue with</div>

              {/* Sign Up Link */}
              <div className="login-signup-link">
                Don't have an account?{" "}
                <a href="/signup" className="login-signup-text">
                  Sign up
                </a>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* =========================
          RESET PASSWORD MODAL
         ========================= */}
      {showReset && (
        <div className="reset-modal-overlay">
          <div className="reset-modal">
            <div className="reset-modal-content">
              <div className="reset-modal-header">
                <h3>Reset Password</h3>
                <button className="reset-modal-close" onClick={handleCloseReset}>
                  ×
                </button>
              </div>
              
              <div className="reset-modal-body">
                {!otpSent ? (
                  <>
                    <div className="reset-input-group">
                      <label htmlFor="reset-email">Email Address</label>
                      <input
                        id="reset-email"
                        type="email"
                        placeholder="Enter your email"
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        className="login-purple-input"
                      />
                    </div>
                    <button 
                      onClick={sendResetOtp} 
                      disabled={resetLoading || !resetEmail}
                      className="login-submit-btn reset-btn"
                    >
                      {resetLoading ? "Sending OTP..." : "Send OTP"}
                    </button>
                  </>
                ) : (
                  <>
                    <div className="reset-input-group">
                      <label htmlFor="reset-otp">OTP Code</label>
                      <input
                        id="reset-otp"
                        type="text"
                        placeholder="Enter OTP"
                        value={resetOtp}
                        onChange={(e) => setResetOtp(e.target.value)}
                        className="login-purple-input"
                        maxLength="6"
                      />
                    </div>
                    
                    <div className="reset-input-group">
                      <label htmlFor="new-password">New Password</label>
                      <input
                        id="new-password"
                        type="password"
                        placeholder="Enter new password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="login-purple-input"
                      />
                    </div>
                    
                    <div className="reset-input-group">
                      <label htmlFor="confirm-password">Confirm Password</label>
                      <input
                        id="confirm-password"
                        type="password"
                        placeholder="Confirm new password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="login-purple-input"
                      />
                    </div>
                    
                    <button 
                      onClick={confirmReset} 
                      disabled={resetLoading || !resetOtp || !newPassword || !confirmPassword}
                      className="login-submit-btn reset-btn"
                    >
                      {resetLoading ? "Resetting..." : "Reset Password"}
                    </button>
                  </>
                )}

                {resetError && (
                  <div className="login-error-message">
                    <svg className="login-error-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <circle cx="12" cy="12" r="10" strokeWidth="2" />
                      <line x1="12" y1="8" x2="12" y2="12" strokeWidth="2" strokeLinecap="round" />
                      <line x1="12" y1="16" x2="12" y2="16" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                    <span>{resetError}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Login;