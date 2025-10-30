import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import styles from '../../styles/Signup.module.css';

const Signup = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    dateOfBirth: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});

  const { login } = useContext(AuthContext);
  const backendUrl = 'http://localhost:5000/api';
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  useEffect(() => {
    if (!clientId || !clientId.includes('.apps.googleusercontent.com')) {
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);

    script.onload = () => {
      if (window.google?.accounts?.id) {
        try {
          window.google.accounts.id.initialize({
            client_id: clientId.trim(),
            callback: handleCredentialResponse,
            auto_select: false,
            cancel_on_tap_outside: true,
          });

          const buttonDiv = document.getElementById("google-signin");
          if (buttonDiv) {
            window.google.accounts.id.renderButton(buttonDiv, {
              theme: "outline",
              size: "large",
              width: 400,
              text: "continue_with",
              shape: "rectangular"
            });
          }
        } catch (error) {
          console.error("Google initialization error:", error);
        }
      }
    };

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
      if (window.google?.accounts?.id) {
        try {
          window.google.accounts.id.cancel();
        } catch (e) {
          console.log("Cleanup error:", e);
        }
      }
    };
  }, [clientId]);

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: '' }), 3000);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateStep1 = () => {
    const newErrors = {};
    if (!formData.username.trim()) newErrors.username = 'Username is required';
    else if (formData.username.length < 3) newErrors.username = 'Username must be at least 3 characters';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Please enter a valid email';
    if (!formData.dateOfBirth) newErrors.dateOfBirth = 'Date of birth is required';
    else {
      const age = new Date().getFullYear() - new Date(formData.dateOfBirth).getFullYear();
      if (age < 18) newErrors.dateOfBirth = 'You must be at least 18 years old';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors = {};
    if (!formData.password) newErrors.password = 'Password is required';
    else if (formData.password.length < 8) newErrors.password = 'Password must be at least 8 characters';
    else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) newErrors.password = 'Password must contain uppercase, lowercase, and number';
    if (!formData.confirmPassword) newErrors.confirmPassword = 'Please confirm your password';
    else if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep1()) setCurrentStep(2);
  };

  const handleBack = () => {
    setCurrentStep(1);
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    if (validateStep2()) {
      setIsLoading(true);
      try {
        const response = await fetch(`${backendUrl}/auth/signup`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.username,
            email: formData.email,
            dateOfBirth: formData.dateOfBirth,
            password: formData.password,
            role: 'customer',
          }),
        });

        const data = await response.json();
        if (response.ok) {
          showToast('Account created! Please check your email for OTP.', 'success');
          setTimeout(() => {
            window.location.href = `/verify-otp?email=${encodeURIComponent(formData.email)}`;
          }, 1500);
        } else {
          showToast(data.message || 'Signup failed. Please try again.', 'error');
        }
      } catch (error) {
        console.error('Signup error:', error);
        showToast('Network error. Please check your connection and try again.', 'error');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleCredentialResponse = async (response) => {
    try {
      if (!response.credential) throw new Error('No credential received from Google');
      setIsLoading(true);
      const res = await fetch(`${backendUrl}/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: response.credential })
      });
      const data = await res.json();
      if (res.ok && data.token) {
        // Pass additional user data to login function
        login(data.token, {
          name: data.name,
          email: data.email,
          role: data.role,
          assignedLocation: data.assignedLocation
        });
        showToast(`Welcome ${data.name}! Logged in with Google.`, 'success');
        setTimeout(() => {
          if (data.role === 'admin') {
            window.location.href = '/admin';
          } else if (data.role === 'manager') {
            window.location.href = '/manager';
          } else {
            window.location.href = '/';
          }
        }, 1500);
      } else {
        showToast(data.message || 'Google login failed. Please try again.', 'error');
      }
    } catch (error) {
      console.error('Google login error:', error);
      showToast('Network error during Google login. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.signupContainer}>
      {toast.show && (
        <div className={`${styles.toast} ${toast.type === 'error' ? styles.error : ''}`}>
          <div className={styles.toastContent}>
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" className={`${styles.toastIcon} ${toast.type === 'error' ? styles.error : ''}`}>
              {toast.type === 'success' ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              )}
            </svg>
            <span className={styles.toastMessage}>{toast.message}</span>
          </div>
        </div>
      )}

      <div className={styles.signupCard}>
        <div className={styles.signupHeader}>
          <h1 className={styles.signupTitle}>Create your account</h1>
          <p className={styles.signupSubtitle}>Start your journey with us today</p>
        </div>

        <div className={styles.progressContainer}>
          <div className={styles.stepWrapper}>
            <div className={`${styles.stepCircle} ${currentStep >= 1 ? styles.active : ''}`}>1</div>
            <span className={`${styles.stepLabel} ${currentStep >= 1 ? styles.active : ''}`}>Personal Info</span>
          </div>

          <div className={`${styles.progressLine} ${currentStep >= 2 ? styles.active : ''}`}></div>

          <div className={styles.stepWrapper}>
            <div className={`${styles.stepCircle} ${currentStep >= 2 ? styles.active : ''}`}>2</div>
            <span className={`${styles.stepLabel} ${currentStep >= 2 ? styles.active : ''}`}>Security</span>
          </div>
        </div>

        <div>
          {currentStep === 1 && (
            <div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Username</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => handleInputChange('username', e.target.value)}
                  placeholder="Enter your username"
                  className={`${styles.input} ${errors.username ? styles.error : ''}`}
                />
                {errors.username && <span className={styles.errorText}>{errors.username}</span>}
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Email Address</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="your@email.com"
                  className={`${styles.input} ${errors.email ? styles.error : ''}`}
                />
                {errors.email && <span className={styles.errorText}>{errors.email}</span>}
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Date of Birth</label>
                <input
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                  className={`${styles.dateInput} ${errors.dateOfBirth ? styles.error : ''}`}
                />
                {errors.dateOfBirth && <span className={styles.errorText}>{errors.dateOfBirth}</span>}
              </div>

              <button
                type="button"
                onClick={handleNext}
                className={styles.button}
              >
                Continue
              </button>
            </div>
          )}

          {currentStep === 2 && (
            <div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Password</label>
                <div className={styles.passwordWrapper}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    placeholder="Create a strong password"
                    className={`${styles.passwordInput} ${errors.password ? styles.error : ''}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={styles.toggleBtn}
                  >
                    {showPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
                {errors.password && <span className={styles.errorText}>{errors.password}</span>}
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Confirm Password</label>
                <div className={styles.passwordWrapper}>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    placeholder="Confirm your password"
                    className={`${styles.passwordInput} ${errors.confirmPassword ? styles.error : ''}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className={styles.toggleBtn}
                  >
                    {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
                {errors.confirmPassword && <span className={styles.errorText}>{errors.confirmPassword}</span>}
              </div>

              <div className={styles.buttonGroup}>
                <button
                  type="button"
                  onClick={handleBack}
                  className={styles.backButton}
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleSignup}
                  disabled={isLoading}
                  className={styles.button}
                >
                  {isLoading ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className={styles.divider}>
          <div className={styles.dividerLine}></div>
          <span className={styles.dividerText}>or</span>
          <div className={styles.dividerLine}></div>
        </div>

        <div id="google-signin" className={styles.googleSignin}></div>

        <p className={styles.signupFooter}>
          Already have an account?{' '}
          <a href="/login" className={styles.link}>
            Login
          </a>
        </p>
      </div>
    </div>
  );
};

export default Signup;