import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './SignUp.css';
import api from "../Services/api";

const Signup = () => {
  const [userType, setUserType] = useState('standard');
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    enterpriseName: '',
    enterpriseLocation: ''
  });

  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [otpData, setOtpData] = useState({
    sent: false,
    verified: false,
    showOtpSection: false,
    resendTimer: 0,
    isSending: false,
    isVerifying: false,
    error: ''
  });

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const navigate = useNavigate();
  const otpInputRefs = useRef([]);

  /* ===============================
     OTP RESEND TIMER
  =============================== */
  useEffect(() => {
    if (otpData.resendTimer > 0) {
      const timer = setTimeout(() => {
        setOtpData(prev => ({ ...prev, resendTimer: prev.resendTimer - 1 }));
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [otpData.resendTimer]);

  /* ===============================
     PASSWORD VALIDATION - REAL TIME
  =============================== */
  const getPasswordError = (password) => {
    if (password.length === 0) return '';
    
    // Check requirements in order of priority
      if (password.length > 0 && password.length < 8) {
      return 'Password must be at least 8 characters long';
    }
    
    const lowercaseCount = (password.match(/[a-z]/g) || []).length;
    if (lowercaseCount < 4) {
      return 'Password must contain at least 4 lowercase letters';
    }
    
    const uppercaseCount = (password.match(/[A-Z]/g) || []).length;
    if (uppercaseCount < 1) {
      return 'Password must contain at least 1 uppercase letter';
    }
    
    const digitCount = (password.match(/[0-9]/g) || []).length;
    if (digitCount < 3) {
      return 'Password must contain at least 3 numbers';
    }
    
    const specialCount = (password.match(/[!@#$%^&*(),.?":{}|<>]/g) || []).length;
    if (specialCount < 1) {
      return 'Password must contain at least 1 special character (!@#$%^&* etc.)';
    }
    
    return ''; // No error
  };

  /* ===============================
     FORM HANDLERS
  =============================== */
  const handleUserTypeChange = (e) => {
    const type = e.target.value;
    setUserType(type);
    if (type === 'standard') {
      setFormData(prev => ({
        ...prev,
        enterpriseName: '',
        enterpriseLocation: ''
      }));
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Update form data
    setFormData(prev => {
      const newFormData = { ...prev, [name]: value };
      
      // Real-time password validation
      if (name === 'password') {
        const passwordError = getPasswordError(value);
        setErrors(prevErrors => ({ 
          ...prevErrors, 
          password: passwordError 
        }));
        
        // Also check confirm password if it exists
        if (newFormData.confirmPassword && value !== newFormData.confirmPassword) {
          setErrors(prevErrors => ({ 
            ...prevErrors, 
            confirmPassword: "Passwords don't match" 
          }));
        } else if (newFormData.confirmPassword && value === newFormData.confirmPassword) {
          setErrors(prevErrors => ({ 
            ...prevErrors, 
            confirmPassword: '' 
          }));
        }
      }
      
      // Real-time confirm password validation
      if (name === 'confirmPassword') {
        if (value && value !== newFormData.password) {
          setErrors(prevErrors => ({ 
            ...prevErrors, 
            confirmPassword: "Passwords don't match" 
          }));
        } else if (value && value === newFormData.password) {
          setErrors(prevErrors => ({ 
            ...prevErrors, 
            confirmPassword: '' 
          }));
        }
      }
      
      return newFormData;
    });

    // Clear general error for this field
    if (errors[name] && name !== 'password' && name !== 'confirmPassword') {
      setErrors({ ...errors, [name]: '' });
    }

    if (name === 'email' && (otpData.sent || otpData.verified)) {
      setOtpData({
        sent: false,
        verified: false,
        showOtpSection: false,
        resendTimer: 0,
        isSending: false,
        isVerifying: false,
        error: ''
      });
      setOtp(['', '', '', '', '', '']);
    }
  };

  /* ===============================
     OTP INPUT HANDLING
  =============================== */
  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  /* ===============================
     SEND OTP (BACKEND)
  =============================== */
  const sendOTP = async () => {
    if (!formData.email) {
      setErrors({ ...errors, email: 'Email is required' });
      return;
    }

    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      setErrors({ ...errors, email: 'Invalid email format' });
      return;
    }

    try {
      setOtpData(prev => ({
        ...prev,
        isSending: true,
        error: '',
        showOtpSection: true
      }));

       await api.post("/auth/send-otp", {
      email: formData.email,
  purpose: "signup"
      });


      setOtpData(prev => ({
        ...prev,
        sent: true,
        isSending: false,
        resendTimer: 60
      }));

    } catch (error) {
      const message = error.response?.data?.detail;

      // 🔴 EMAIL ALREADY EXISTS
      if (message === "Email already registered") {
        setErrors({ email: "User already exists" });
        setOtpData(prev => ({
          ...prev,
          isSending: false,
          showOtpSection: false
        }));
        return;
      }

      // 🔴 OTHER ERRORS
      setOtpData(prev => ({
        ...prev,
        isSending: false,
        error: message || 'Failed to send OTP'
      }));
    }
  };

  /* ===============================
     VERIFY OTP (FLAG ONLY)
     BACKEND VERIFIES ON SIGNUP
  =============================== */
  const verifyOTP = async () => {
    const otpString = otp.join('');
    if (otpString.length !== 6) {
      setOtpData(prev => ({ ...prev, error: 'Enter 6-digit OTP' }));
      return;
    }

    setOtpData(prev => ({
      ...prev,
      verified: true,
      isVerifying: false,
      error: ''
    }));
  };

  const resendOTP = async () => {
    if (otpData.resendTimer > 0) return;
    sendOTP();
  };

  /* ===============================
     FORM SUBMISSION VALIDATION
  =============================== */
  const validateForm = () => {
    const newErrors = {};

    if (!formData.username.trim()) newErrors.username = 'Username required';

    if (!formData.email) newErrors.email = 'Email required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Invalid email';

    if (!otpData.verified) newErrors.otp = 'Verify email first';

    if (!formData.phone) newErrors.phone = 'Phone required';
    else if (!/^\d{10}$/.test(formData.phone)) newErrors.phone = '10 digits required';

    if (userType === 'enterprise') {
      if (!formData.enterpriseName.trim())
        newErrors.enterpriseName = 'Enterprise name required';
      if (!formData.enterpriseLocation.trim())
        newErrors.enterpriseLocation = 'Location required';
    }

    // Password validation for submission (re-check)
    if (!formData.password) {
      newErrors.password = 'Password required';
    } else {
      const passwordError = getPasswordError(formData.password);
      if (passwordError) {
        newErrors.password = passwordError;
      }
    }

    // Confirm password validation for submission
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Confirm password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords don't match";
    }

    return newErrors;
  };

  /* ===============================
     SUBMIT SIGNUP (BACKEND)
  =============================== */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!otpData.verified) {
      setErrors({ ...errors, otp: 'Verify email first' });
      return;
    }

    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsLoading(true);

    try {
      const payload = {
        user_type: userType === "enterprise" ? "enterprise" : "normal",
        username: formData.username,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        confirm_password: formData.confirmPassword,
        otp: otp.join(""),
        ...(userType === "enterprise" && {
          enterprise_name: formData.enterpriseName,
          location: formData.enterpriseLocation
        })
      };

      await api.post("/auth/signup", payload);

      alert("Account created successfully!");
      navigate("/login");

    } catch (err) {
      const errorDetail = err.response?.data?.detail;
      
      // Handle specific backend errors
      if (errorDetail === "Passwords do not match") {
        setErrors({ confirmPassword: "Passwords do not match" });
      } else if (errorDetail && errorDetail.includes("Password must contain")) {
        setErrors({ password: errorDetail });
      } else if (errorDetail === "Email already registered") {
        setErrors({ email: "Email already registered" });
      } else if (errorDetail === "Invalid OTP") {
        setErrors({ otp: "Invalid OTP. Please verify again." });
      } else if (errorDetail === "OTP expired") {
        setErrors({ otp: "OTP expired. Please request a new one." });
      } else {
        setErrors({
          general: errorDetail || "Signup failed. Please try again."
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  /* ===============================
     UI
  =============================== */
  return (
    <div className="signup-page">
      <div className="signup-container">
        <div className="signup-form-wrapper">
          <div className="signup-header">
            <h2>Create Account</h2>
          </div>

          <form onSubmit={handleSubmit} className="signup-form">
            {/* Account Type DROPDOWN */}
            <div className="account-type-dropdown">
              <div className="account-type">
                <label htmlFor="userType">
                  <i className="fas fa-users"></i>
                  Account Type
                </label>
                <button
                  type="button"
                  className="account-type-info-icon"
                  onClick={() => window.open('/account-type-info', '_blank')}
                  title="Learn about account types"
                >
                  <i className="fas fa-info-circle"></i>
                </button>
              </div>
              <select
                id="userType"
                value={userType}
                onChange={handleUserTypeChange}
                className="dropdown-select"
              >
                <option value="standard">Standard User</option>
                <option value="enterprise">Enterprise User</option>
              </select>
            </div>

            {/* Username */}
            <div className="form-group">
              <label htmlFor="username">
                <i className="fas fa-user"></i>
                Username
              </label>
              <div className="input-with-icon">
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="Enter username"
                  className={errors.username ? 'error' : ''}
                />
                <i className="fas fa-user input-icon"></i>
              </div>
              {errors.username && (
                <div className="error-message">
                  <i className="fas fa-exclamation-circle"></i>
                  {errors.username}
                </div>
              )}
            </div>

            {/* Email with inline OTP button */}
            <div className="form-group">
              <label htmlFor="email">
                <i className="fas fa-envelope"></i>
                Email Address
              </label>
              <div className="email-with-otp">
                <div className="email-input-wrapper">
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="your@email.com"
                    className={errors.email ? 'error' : ''}
                  />
                  <i className="fas fa-envelope input-icon"></i>
                </div>
                
                <button
                  type="button"
                  className="send-otp-inline"
                  onClick={sendOTP}
                  disabled={otpData.isSending || !formData.email || otpData.verified}
                >
                  {otpData.isSending ? (
                    <>
                      <i className="fas fa-spinner fa-spin"></i>
                      Sending...
                    </>
                  ) : otpData.verified ? (
                    <>
                      <i className="fas fa-check"></i>
                      Verified
                    </>
                  ) : otpData.sent ? (
                    <>
                      <i className="fas fa-redo"></i>
                      Resend
                    </>
                  ) : (
                    <>
                      <i className="fas fa-paper-plane"></i>
                      Send OTP
                    </>
                  )}
                </button>
              </div>
              {errors.email && (
                <div className="error-message">
                  <i className="fas fa-exclamation-circle"></i>
                  {errors.email}
                </div>
              )}
              
              {/* OTP Section */}
              {otpData.showOtpSection && !otpData.verified && (
                <div className="email-otp-section">
                  <div className="otp-header">
                    <h4>Verify Email</h4>
                    <p>Enter code sent to {formData.email}</p>
                  </div>
                  
                  <div className="otp-inputs">
                    {[...Array(6)].map((_, index) => (
                      <input
                        key={index}
                        ref={el => otpInputRefs.current[index] = el}
                        type="text"
                        maxLength="1"
                        value={otp[index]}
                        onChange={(e) => handleOtpChange(index, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(index, e)}
                        className="otp-input"
                        disabled={otpData.verified || otpData.isVerifying}
                      />
                    ))}
                  </div>
                  
                  {otpData.error && (
                    <div className="error-message">
                      <i className="fas fa-exclamation-circle"></i>
                      {otpData.error}
                    </div>
                  )}
                  
                  <div className="otp-actions">
                    <button
                      type="button"
                      className="verify-otp-btn"
                      onClick={verifyOTP}
                      disabled={otpData.isVerifying}
                    >
                      {otpData.isVerifying ? (
                        <>
                          <i className="fas fa-spinner fa-spin"></i>
                          Verifying...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-check"></i>
                          Verify
                        </>
                      )}
                    </button>
                    
                    <button
                      type="button"
                      className="resend-otp"
                      onClick={resendOTP}
                      disabled={otpData.resendTimer > 0}
                    >
                      <i className="fas fa-redo"></i>
                      {otpData.resendTimer > 0 ? `Resend in ${otpData.resendTimer}s` : 'Resend'}
                    </button>
                  </div>
                </div>
              )}
              
              {/* Show verification status */}
              {otpData.verified && (
                <div className="success-message">
                  <i className="fas fa-check-circle"></i>
                  Email verified ✓
                </div>
              )}
            </div>

            {/* Phone */}
            <div className="form-group">
              <label htmlFor="phone">
                <i className="fas fa-phone"></i>
                Phone Number
              </label>
              <div className="input-with-icon">
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="10-digit number"
                  className={errors.phone ? 'error' : ''}
                  maxLength="10"
                />
                <i className="fas fa-phone input-icon"></i>
              </div>
              {errors.phone && (
                <div className="error-message">
                  <i className="fas fa-exclamation-circle"></i>
                  {errors.phone}
                </div>
              )}
            </div>

            {/* Enterprise Fields */}
            {userType === 'enterprise' && (
              <div className="enterprise-fields">
                <div className="form-group">
                  <label htmlFor="enterpriseName">
                    <i className="fas fa-building"></i>
                    Enterprise Name
                  </label>
                  <div className="input-with-icon">
                    <input
                      type="text"
                      id="enterpriseName"
                      name="enterpriseName"
                      value={formData.enterpriseName}
                      onChange={handleChange}
                      placeholder="Company name"
                      className={errors.enterpriseName ? 'error' : ''}
                    />
                    <i className="fas fa-building input-icon"></i>
                  </div>
                  {errors.enterpriseName && (
                    <div className="error-message">
                      <i className="fas fa-exclamation-circle"></i>
                      {errors.enterpriseName}
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="enterpriseLocation">
                    <i className="fas fa-map-marker-alt"></i>
                    Enterprise Location
                  </label>
                  <div className="input-with-icon">
                    <input
                      type="text"
                      id="enterpriseLocation"
                      name="enterpriseLocation"
                      value={formData.enterpriseLocation}
                      onChange={handleChange}
                      placeholder="Company location"
                      className={errors.enterpriseLocation ? 'error' : ''}
                    />
                    <i className="fas fa-map-marker-alt input-icon"></i>
                  </div>
                  {errors.enterpriseLocation && (
                    <div className="error-message">
                      <i className="fas fa-exclamation-circle"></i>
                      {errors.enterpriseLocation}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Password - Real-time validation */}
            <div className="form-group">
              <label htmlFor="password">
                <i className="fas fa-lock"></i>
                Password
              </label>
              <div className="input-with-icon">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Create secure password"
                  className={errors.password ? 'error' : ''}
                />
                <i className="fas fa-lock input-icon"></i>
                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <i className={showPassword ? "fas fa-eye-slash" : "fas fa-eye"}></i>
                </button>
              </div>
              {/* Show specific error message based on what's missing */}
              {errors.password && formData.password && (
                <div className="error-message">
                  <i className="fas fa-exclamation-circle"></i>
                  {errors.password}
                </div>
              )}
            </div>

            {/* Confirm Password - Real-time validation */}
            <div className="form-group">
              <label htmlFor="confirmPassword">
                <i className="fas fa-lock"></i>
                Confirm Password
              </label>
              <div className="input-with-icon">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Re-enter password"
                  className={errors.confirmPassword ? 'error' : ''}
                />
                <i className="fas fa-lock input-icon"></i>
                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <i className={showConfirmPassword ? "fas fa-eye-slash" : "fas fa-eye"}></i>
                </button>
              </div>
              {/* Show mismatch error */}
              {errors.confirmPassword && formData.confirmPassword && (
                <div className="error-message">
                  <i className="fas fa-exclamation-circle"></i>
                  {errors.confirmPassword}
                </div>
              )}
            </div>

            {/* Terms */}
            <div className="terms-checkbox">
              <input type="checkbox" id="terms" required />
              <label htmlFor="terms">
                I agree to the <Link to="/terms">Terms</Link> and <Link to="/privacy">Privacy Policy</Link>
              </label>
            </div>

            {/* General Error */}
            {errors.general && (
              <div className="error-message general-error">
                <i className="fas fa-exclamation-circle"></i>
                {errors.general}
              </div>
            )}

            {/* OTP Error */}
            {errors.otp && (
              <div className="error-message general-error">
                <i className="fas fa-exclamation-circle"></i>
                {errors.otp}
              </div>
            )}

            {/* Submit Button */}
            <button 
              type="submit" 
              className="signup-button"
              disabled={isLoading || !otpData.verified}
            >
              {isLoading ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i>
                  Creating Account...
                </>
              ) : (
                <>
                  <i className="fas fa-user-plus"></i>
                  Create Account
                </>
              )}
            </button>

            {/* Compact Footer */}
            <div className="signup-footer">
              <p>Already have an account? <Link to="/login">Sign In</Link></p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Signup;