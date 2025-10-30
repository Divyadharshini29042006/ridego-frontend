import { useState } from "react";
import { Mail, Lock, ArrowLeft, CheckCircle, AlertCircle, Sun, Moon } from "lucide-react";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: '' });
  const [emailSent, setEmailSent] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: '' });
    }, 4000);
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  
  if (!email) {
    showToast("Please enter your email address", "error");
    return;
  }

  setIsLoading(true);

  try {
    const response = await fetch("http://localhost:5000/api/auth/forgot-password", {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    const data = await response.json();

    if (response.ok) {
      showToast("OTP sent to your email!", "success");
      // Redirect to OTP verification page with email parameter
      setTimeout(() => {
        window.location.href = `/verify-password-reset-otp?email=${encodeURIComponent(email)}`;
      }, 1500);
    } else {
      showToast(data.message || "Something went wrong. Please try again.", "error");
    }
  } catch (error) {
    console.error('Forgot password error:', error);
    showToast("Network error. Please try again.", "error");
  } finally {
    setIsLoading(false);
  }
};
  return (
    <div className={isDarkMode ? 'dark' : ''}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');

        .fp-reset {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        .fp-body {
          font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }

        .fp-wrapper {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
          transition: all 0.3s ease;
          padding: 120px 20px 20px;
          position: relative;
        }

        .dark .fp-wrapper {
          background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%);
        }

        .fp-theme-toggle {
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

        .dark .fp-theme-toggle {
          background: #2a2a2a;
        }

        .fp-theme-toggle:hover {
          transform: scale(1.1);
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
        }

        .fp-card {
          width: 100%;
          max-width: 520px;
          background: white;
          border-radius: 32px;
          padding: 60px 50px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
          transition: all 0.3s ease;
        }

        .dark .fp-card {
          background: #1f1f1f;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
        }

        .fp-back-btn {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          background: none;
          border: none;
          color: #64748b;
          font-size: 15px;
          font-weight: 500;
          cursor: pointer;
          padding: 10px 16px;
          border-radius: 12px;
          margin-bottom: 40px;
          transition: all 0.2s ease;
        }

        .dark .fp-back-btn {
          color: #94a3b8;
        }

        .fp-back-btn:hover {
          background: #f1f5f9;
          color: #1e293b;
        }

        .dark .fp-back-btn:hover {
          background: #2a2a2a;
          color: #e2e8f0;
        }

        .fp-icon-box {
          width: 90px;
          height: 90px;
          border-radius: 24px;
          background: linear-gradient(135deg, #0b0b0bff 0%, #060606ff 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 32px;
        }

        .dark .fp-icon-box {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          box-shadow: 0 8px 20px rgba(102, 126, 234, 0.3);
        }

        .fp-icon-box svg {
          color: white;
        }

        .fp-h2 {
          font-size: 42px;
          font-weight: 700;
          color: #0f172a;
          margin-bottom: 16px;
          letter-spacing: -1px;
          line-height: 1.2;
        }

        .dark .fp-h2 {
          color: #f1f5f9;
        }

        .fp-subtitle {
          font-size: 17px;
          color: #64748b;
          margin-bottom: 40px;
          line-height: 1.7;
        }

        .dark .fp-subtitle {
          color: #94a3b8;
        }

        .fp-subtitle strong {
          color: #1e293b;
          font-weight: 600;
        }

        .dark .fp-subtitle strong {
          color: #e2e8f0;
        }

        .fp-input-box {
          position: relative;
          margin-bottom: 28px;
        }

        .fp-input-icon {
          position: absolute;
          left: 20px;
          top: 50%;
          transform: translateY(-50%);
          color: #94a3b8;
          pointer-events: none;
          z-index: 1;
        }

        .dark .fp-input-icon {
          color: #64748b;
        }

        .fp-input {
          width: 100%;
          height: 62px;
          padding: 0 20px 0 58px;
          border: 2px solid #e2e8f0;
          border-radius: 16px;
          font-size: 16px;
          font-weight: 500;
          background: #f8fafc;
          color: #0f172a;
          transition: all 0.2s ease;
          font-family: 'Poppins', sans-serif;
        }

        .dark .fp-input {
          background: #0a0a0a;
          border-color: #2a2a2a;
          color: #f1f5f9;
        }

        .fp-input:focus {
          outline: none;
          border-color: #667eea;
          background: white;
          box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1);
        }

        .dark .fp-input:focus {
          background: #1a1a1a;
          border-color: #667eea;
          box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.2);
        }

        .fp-input::placeholder {
          color: #94a3b8;
        }

        .fp-btn-primary {
          width: 100%;
          height: 62px;
          background: linear-gradient(135deg, #060606ff 0%, #18171aff 100%);
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

        .fp-btn-primary:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 12px 28px rgba(102, 126, 234, 0.4);
        }

        .fp-btn-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .fp-spinner {
          width: 20px;
          height: 20px;
          border: 2.5px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: fp-spin 0.8s linear infinite;
        }

        @keyframes fp-spin {
          to { transform: rotate(360deg); }
        }

        .fp-success-box {
          text-align: center;
        }

        .fp-success-icon {
          width: 90px;
          height: 90px;
          border-radius: 24px;
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 32px;
          box-shadow: 0 8px 20px rgba(16, 185, 129, 0.3);
        }

        .fp-success-icon svg {
          color: white;
        }

        .fp-info-text {
          font-size: 15px;
          color: #64748b;
          margin-bottom: 28px;
        }

        .dark .fp-info-text {
          color: #94a3b8;
        }

        .fp-btn-secondary {
          width: 100%;
          height: 62px;
          background: transparent;
          color: #667eea;
          border: 2px solid #e2e8f0;
          border-radius: 16px;
          font-size: 17px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          margin-bottom: 28px;
        }

        .dark .fp-btn-secondary {
          color: #818cf8;
          border-color: #2a2a2a;
        }

        .fp-btn-secondary:hover {
          background: #f8fafc;
          border-color: #667eea;
        }

        .dark .fp-btn-secondary:hover {
          background: #1a1a1a;
          border-color: #667eea;
        }

        .fp-footer {
          text-align: center;
          font-size: 15px;
          color: #64748b;
        }

        .dark .fp-footer {
          color: #94a3b8;
        }

        .fp-footer a {
          color: #667eea;
          text-decoration: none;
          font-weight: 600;
          transition: all 0.2s ease;
        }

        .fp-footer a:hover {
          color: #764ba2;
          text-decoration: underline;
        }

        .fp-toast {
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
          animation: fp-slideIn 0.3s ease;
          z-index: 1000;
          max-width: 420px;
          cursor: pointer;
          border: 2px solid #e2e8f0;
        }

        .dark .fp-toast {
          background: #1f1f1f;
          color: #f1f5f9;
          border-color: #2a2a2a;
        }

        .fp-toast.error {
          background: #fef2f2;
          color: #991b1b;
          border-color: #fecaca;
        }

        .dark .fp-toast.error {
          background: #450a0a;
          color: #fca5a5;
          border-color: #7f1d1d;
        }

        .fp-toast.success {
          background: #f0fdf4;
          color: #065f46;
          border-color: #bbf7d0;
        }

        .dark .fp-toast.success {
          background: #064e3b;
          color: #86efac;
          border-color: #065f46;
        }

        @keyframes fp-slideIn {
          from {
            transform: translateX(450px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        .fp-toast-content {
          display: flex;
          align-items: center;
          gap: 14px;
          font-size: 15px;
          font-weight: 500;
        }

        @media (max-width: 640px) {
          .fp-wrapper {
            padding: 100px 16px 16px;
          }

          .fp-card {
            padding: 40px 28px;
            border-radius: 24px;
          }

          .fp-h2 {
            font-size: 34px;
          }

          .fp-subtitle {
            font-size: 16px;
          }

          .fp-toast {
            left: 16px;
            right: 16px;
            max-width: none;
            top: 20px;
          }

          .fp-theme-toggle {
            top: 90px;
            right: 16px;
            width: 48px;
            height: 48px;
          }
        }
      `}</style>

      {toast.show && (
        <div className={`fp-toast ${toast.type}`} onClick={() => setToast({ show: false, message: '', type: '' })}>
          <div className="fp-toast-content">
            {toast.type === 'success' ? (
              <CheckCircle size={22} />
            ) : (
              <AlertCircle size={22} />
            )}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      <div className="fp-wrapper">
        <button className="fp-theme-toggle" onClick={() => setIsDarkMode(!isDarkMode)}>
          {isDarkMode ? (
            <Sun size={24} color="#fbbf24" />
          ) : (
            <Moon size={24} color="#6366f1" />
          )}
        </button>

        <div className="fp-card">
          <button className="fp-back-btn" onClick={() => window.location.href = '/login'}>
            <ArrowLeft size={20} />
            Back to Login
          </button>

          {!emailSent ? (
            <>
              <div className="fp-icon-box">
                <Lock size={44} strokeWidth={2} />
              </div>

              <h2 className="fp-h2">Forgot Password?</h2>
              <p className="fp-subtitle">
                No worries! Enter your email address and we'll send you a link to reset your password.
              </p>

              <div>
                <div className="fp-input-box">
                  <span className="fp-input-icon">
                    <Mail size={22} />
                  </span>
                  <input
                    type="email"
                    className="fp-input"
                    placeholder="Enter your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSubmit(e)}
                  />
                </div>

                <button onClick={handleSubmit} disabled={isLoading} className="fp-btn-primary">
                  {isLoading && <span className="fp-spinner"></span>}
                  {isLoading ? "Sending..." : "Send Reset Link"}
                </button>
              </div>
            </>
          ) : (
            <div className="fp-success-box">
              <div className="fp-success-icon">
                <CheckCircle size={44} strokeWidth={2.5} />
              </div>
              <h2 className="fp-h2">Check Your Email</h2>
              <p className="fp-subtitle">
                If an account exists with <strong>{email}</strong>, you will receive a password reset link shortly.
              </p>
              <p className="fp-info-text">
                Didn't receive the email? Check your spam folder or try again.
              </p>
              <button className="fp-btn-secondary" onClick={() => { setEmailSent(false); setEmail(""); }}>
                Try Another Email
              </button>
            </div>
          )}

          <p className="fp-footer">
            Remember your password? <a href="/login">Sign in</a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;