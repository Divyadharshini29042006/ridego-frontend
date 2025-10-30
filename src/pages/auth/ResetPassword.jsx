import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle, Sun, Moon, KeyRound } from "lucide-react";

function ResetPassword() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Extract token and userId from URL query parameters
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const userId = searchParams.get("id");

  useEffect(() => {
    if (!token || !userId) {
      showToast("Invalid reset link. Please request a new one.", "error");
    }
  }, [token, userId]);

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: '' });
    }, 4000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (newPassword.length < 8) {
      showToast("Password must be at least 8 characters long", "error");
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast("Passwords do not match", "error");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("http://localhost:5000/api/auth/reset-password", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          userId,
          newPassword,
          confirmPassword
        }),
      });

      const data = await response.json();

      if (response.ok) {
        showToast("Password reset successful! Redirecting to login...", "success");
        setTimeout(() => window.location.href = '/login', 2000);
      } else {
        if (data.expired) {
          showToast("Reset link has expired. Redirecting...", "error");
          setTimeout(() => window.location.href = '/forgot-password', 3000);
        } else {
          showToast(data.message || "Failed to reset password", "error");
        }
      }
    } catch (error) {
      console.error('Reset password error:', error);
      showToast("Network error. Please try again.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const getPasswordStrength = () => {
    if (newPassword.length === 0) return { label: '', className: '', width: 0 };
    if (newPassword.length >= 12) return { label: '✓ Strong password', className: 'strong', width: 100 };
    if (newPassword.length >= 8) return { label: '⚠ Medium strength', className: 'medium', width: 66 };
    return { label: '✗ Weak password (min 8 characters)', className: 'weak', width: 33 };
  };

  const strength = getPasswordStrength();

  return (
    <div className={isDarkMode ? 'dark' : ''}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');

        .rp-reset {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        .rp-body {
          font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }

        .rp-wrapper {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
          transition: all 0.3s ease;
          padding: 120px 20px 20px;
          position: relative;
        }

        .dark .rp-wrapper {
          background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%);
        }

        .rp-theme-toggle {
          position: fixed;
          top: 100px;
          right: 30px;
          width: 52px;
          height: 52px;
          border-radius: 50%;
          border: none;
          background: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
          z-index: 999;
        }

        .dark .rp-theme-toggle {
          background: #2a2a2a;
        }

        .rp-theme-toggle:hover {
          transform: scale(1.1);
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
        }

        .rp-card {
          width: 100%;
          max-width: 520px;
          background: white;
          border-radius: 32px;
          padding: 60px 50px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
          transition: all 0.3s ease;
        }

        .dark .rp-card {
          background: #1f1f1f;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
        }

        .rp-icon-box {
          width: 90px;
          height: 90px;
          border-radius: 24px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 32px;
        }

        .dark .rp-icon-box {
          background: linear-gradient(135deg, #4b65daff 0%, #764ba2 100%);
          box-shadow: 0 8px 20px rgba(102, 126, 234, 0.3);
        }

        .rp-icon-box svg {
          color: white;
        }

        .rp-h2 {
          font-size: 42px;
          font-weight: 700;
          color: #0f172a;
          margin-bottom: 16px;
          letter-spacing: -1px;
          line-height: 1.2;
        }

        .dark .rp-h2 {
          color: #f1f5f9;
        }

        .rp-subtitle {
          font-size: 17px;
          color: #64748b;
          margin-bottom: 40px;
          line-height: 1.7;
        }

        .dark .rp-subtitle {
          color: #94a3b8;
        }

        .rp-input-box {
          position: relative;
          margin-bottom: 24px;
        }

        .rp-input-icon {
          position: absolute;
          left: 20px;
          top: 50%;
          transform: translateY(-50%);
          color: #94a3b8;
          pointer-events: none;
          z-index: 1;
        }

        .dark .rp-input-icon {
          color: #64748b;
        }

        .rp-toggle-password {
          position: absolute;
          right: 20px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: #94a3b8;
          cursor: pointer;
          padding: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
          z-index: 2;
        }

        .dark .rp-toggle-password {
          color: #64748b;
        }

        .rp-toggle-password:hover {
          color: #667eea;
        }

        .rp-input {
          width: 100%;
          height: 62px;
          padding: 0 58px;
          border: 2px solid #e2e8f0;
          border-radius: 16px;
          font-size: 16px;
          font-weight: 500;
          background: #f8fafc;
          color: #0f172a;
          transition: all 0.2s ease;
          font-family: 'Poppins', sans-serif;
        }

        .dark .rp-input {
          background: #0a0a0a;
          border-color: #2a2a2a;
          color: #f1f5f9;
        }

        .rp-input:focus {
          outline: none;
          border-color: #667eea;
          background: white;
          box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1);
        }

        .dark .rp-input:focus {
          background: #1a1a1a;
          border-color: #667eea;
          box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.2);
        }

        .rp-input::placeholder {
          color: #94a3b8;
        }

        .rp-password-strength {
          margin-bottom: 28px;
        }

        .rp-strength-bar {
          width: 100%;
          height: 6px;
          background: #e2e8f0;
          border-radius: 6px;
          overflow: hidden;
          margin-bottom: 10px;
        }

        .dark .rp-strength-bar {
          background: #2a2a2a;
        }

        .rp-strength-fill {
          height: 100%;
          transition: all 0.3s ease;
          border-radius: 6px;
        }

        .rp-strength-fill.weak {
          background: linear-gradient(90deg, #ef4444 0%, #dc2626 100%);
        }

        .rp-strength-fill.medium {
          background: linear-gradient(90deg, #f59e0b 0%, #d97706 100%);
        }

        .rp-strength-fill.strong {
          background: linear-gradient(90deg, #10b981 0%, #059669 100%);
        }

        .rp-strength-text {
          font-size: 14px;
          font-weight: 600;
        }

        .weak-text {
          color: #ef4444;
        }

        .medium-text {
          color: #f59e0b;
        }

        .strong-text {
          color: #10b981;
        }

        .rp-btn-primary {
          width: 100%;
          height: 62px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          border-radius: 16px;
          font-size: 17px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          margin-bottom: 28px;
          box-shadow: 0 8px 20px rgba(102, 126, 234, 0.3);
        }

        .rp-btn-primary:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 12px 28px rgba(102, 126, 234, 0.4);
        }

        .rp-btn-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .rp-spinner {
          width: 20px;
          height: 20px;
          border: 2.5px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: rp-spin 0.8s linear infinite;
        }

        @keyframes rp-spin {
          to { transform: rotate(360deg); }
        }

        .rp-footer {
          text-align: center;
          font-size: 15px;
          color: #64748b;
        }

        .dark .rp-footer {
          color: #94a3b8;
        }

        .rp-footer a {
          color: #667eea;
          text-decoration: none;
          font-weight: 600;
          transition: all 0.2s ease;
        }

        .rp-footer a:hover {
          color: #764ba2;
          text-decoration: underline;
        }

        .rp-toast {
          position: fixed;
          top: 30px;
          right: 30px;
          background: white;
          color: #0f172a;
          padding: 18px 24px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          gap: 14px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
          animation: rp-slideIn 0.3s ease;
          z-index: 1000;
          max-width: 420px;
          cursor: pointer;
          border: 2px solid #e2e8f0;
        }

        .dark .rp-toast {
          background: #1f1f1f;
          color: #f1f5f9;
          border-color: #2a2a2a;
        }

        .rp-toast.error {
          background: #fef2f2;
          color: #991b1b;
          border-color: #fecaca;
        }

        .dark .rp-toast.error {
          background: #450a0a;
          color: #fca5a5;
          border-color: #7f1d1d;
        }

        .rp-toast.success {
          background: #f0fdf4;
          color: #065f46;
          border-color: #bbf7d0;
        }

        .dark .rp-toast.success {
          background: #064e3b;
          color: #86efac;
          border-color: #065f46;
        }

        @keyframes rp-slideIn {
          from {
            transform: translateX(450px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        .rp-toast-content {
          display: flex;
          align-items: center;
          gap: 14px;
          font-size: 15px;
          font-weight: 500;
        }

        @media (max-width: 640px) {
          .rp-wrapper {
            padding: 100px 16px 16px;
          }

          .rp-card {
            padding: 40px 28px;
            border-radius: 24px;
          }

          .rp-h2 {
            font-size: 34px;
          }

          .rp-subtitle {
            font-size: 16px;
          }

          .rp-toast {
            left: 16px;
            right: 16px;
            max-width: none;
            top: 20px;
          }

          .rp-theme-toggle {
            top: 90px;
            right: 16px;
            width: 48px;
            height: 48px;
          }
        }
      `}</style>

      {toast.show && (
        <div className={`rp-toast ${toast.type}`} onClick={() => setToast({ show: false, message: '', type: '' })}>
          <div className="rp-toast-content">
            {toast.type === 'success' ? (
              <CheckCircle size={22} />
            ) : (
              <AlertCircle size={22} />
            )}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      <div className="rp-wrapper">
        <button className="rp-theme-toggle" onClick={() => setIsDarkMode(!isDarkMode)}>
          {isDarkMode ? (
            <Sun size={24} color="#fbbf24" />
          ) : (
            <Moon size={24} color="#6366f1" />
          )}
        </button>

        <div className="rp-card">
          <div className="rp-icon-box">
            <KeyRound size={44} strokeWidth={2} />
          </div>

          <h2 className="rp-h2">Reset Your Password</h2>
          <p className="rp-subtitle">
            Enter your new password below. Make sure it's at least 8 characters long for security.
          </p>

          <div>
            <div className="rp-input-box">
              <span className="rp-input-icon">
                <Lock size={22} />
              </span>
              <input
                type={showPassword ? "text" : "password"}
                className="rp-input"
                placeholder="New password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSubmit(e)}
              />
              <button
                type="button"
                className="rp-toggle-password"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            <div className="rp-input-box">
              <span className="rp-input-icon">
                <Lock size={22} />
              </span>
              <input
                type={showConfirmPassword ? "text" : "password"}
                className="rp-input"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSubmit(e)}
              />
              <button
                type="button"
                className="rp-toggle-password"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            {newPassword && (
              <div className="rp-password-strength">
                <div className="rp-strength-bar">
                  <div 
                    className={`rp-strength-fill ${strength.className}`}
                    style={{ width: `${strength.width}%` }}
                  ></div>
                </div>
                <p className={`rp-strength-text ${strength.className}-text`}>
                  {strength.label}
                </p>
              </div>
            )}

            <button onClick={handleSubmit} disabled={isLoading} className="rp-btn-primary">
              {isLoading && <span className="rp-spinner"></span>}
              {isLoading ? "Resetting..." : "Reset Password"}
            </button>
          </div>

          <p className="rp-footer">
            Remember your password? <a href="/login">Sign in</a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default ResetPassword;