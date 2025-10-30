import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { CheckCircle, AlertCircle } from "lucide-react";

function VerifyPasswordResetOtp() {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const email = searchParams.get('email');

  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: '' });
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
  const [canResend, setCanResend] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(30);

  useEffect(() => {
    if (!email) {
      showToast('No email provided. Redirecting...', 'error');
      setTimeout(() => navigate('/forgot-password'), 2000);
    }
  }, [email, navigate]);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  useEffect(() => {
    if (resendCooldown <= 0) {
      setCanResend(true);
      return;
    }
    const timer = setInterval(() => setResendCooldown(prev => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: '' }), 4000);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleOtpChange = (index, value) => {
    if (value && !/^\d$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`)?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`)?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6);
    if (!/^\d+$/.test(pastedData)) return;
    const newOtp = pastedData.split('');
    setOtp([...newOtp, ...Array(6 - newOtp.length).fill('')]);
    const lastIndex = Math.min(pastedData.length, 5);
    document.getElementById(`otp-${lastIndex}`)?.focus();
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    const otpString = otp.join('');

    if (otpString.length !== 6) {
      showToast('Please enter complete OTP', 'error');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/auth/verify-reset-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: otpString })
      });

      const data = await response.json();

      if (response.ok) {
        showToast('OTP verified! Redirecting to reset password...', 'success');
        setTimeout(() => {
          navigate(`/reset-password?token=${data.resetToken}&id=${data.userId}`);
        }, 1500);
      } else {
        showToast(data.message || 'Invalid OTP. Please try again.', 'error');
        if (data.expired) {
          setTimeLeft(0);
        }
      }
    } catch (error) {
      console.error('Verification error:', error);
      showToast('Network error. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend) return;

    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/auth/resend-reset-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (response.ok) {
        showToast('New OTP sent to your email!', 'success');
        setTimeLeft(300);
        setResendCooldown(30);
        setCanResend(false);
        setOtp(['', '', '', '', '', '']);
      } else {
        showToast(data.message || 'Failed to resend OTP', 'error');
      }
    } catch (error) {
      console.error('Resend error:', error);
      showToast('Network error. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <style>{`
        * {
          box-sizing: border-box;
        }
        
        body {
          margin: 0;
          padding: 0;
        }

        .otp-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: #ffffff;
          padding: 40px 20px;
          font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
        }

        .otp-card {
          background: transparent;
          border: none;
          border-radius: 0;
          padding: 0;
          max-width: 500px;
          width: 100%;
          box-shadow: none;
        }

        .otp-header {
          text-align: center;
          margin-bottom: 48px;
        }

        .email-icon {
          width: 64px;
          height: 64px;
          margin: 0 auto 24px;
          background: #000000;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .otp-title {
          font-size: 32px;
          font-weight: 600;
          color: #000000;
          margin: 0 0 16px 0;
          letter-spacing: -0.5px;
        }

        .otp-subtitle {
          font-size: 15px;
          color: #666666;
          margin: 0 0 8px 0;
          line-height: 1.5;
          font-weight: 400;
        }

        .otp-email {
          font-size: 15px;
          color: #000000;
          font-weight: 600;
          margin: 0;
        }

        .otp-inputs {
          display: flex;
          gap: 12px;
          justify-content: center;
          margin-bottom: 32px;
        }

        .otp-input {
          width: 64px;
          height: 64px;
          font-size: 32px;
          font-weight: 600;
          text-align: center;
          border: 2px solid #e5e5e5;
          border-radius: 12px;
          color: #000000;
          background: #ffffff;
          outline: none;
          transition: all 0.2s ease;
          font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif;
        }

        .otp-input:hover:not(:disabled) {
          border-color: #000000;
        }

        .otp-input:focus {
          border-color: #000000;
          box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.1);
        }

        .otp-input:disabled {
          background: #f5f5f5;
          color: #999999;
          cursor: not-allowed;
        }

        .timer-section {
          text-align: center;
          margin-bottom: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-size: 14px;
          color: #666666;
        }

        .timer-icon {
          width: 16px;
          height: 16px;
        }

        .expired-alert {
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 12px;
          padding: 16px;
          margin-bottom: 24px;
          text-align: center;
        }

        .expired-text {
          color: #dc2626;
          font-size: 14px;
          font-weight: 500;
          margin: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .button-group {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .verify-button {
          width: 100%;
          padding: 16px 24px;
          border-radius: 12px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          border: none;
          background: #000000;
          color: #ffffff;
          transition: all 0.2s ease;
        }

        .verify-button:hover:not(:disabled) {
          background: #1a1a1a;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .verify-button:disabled {
          background: #e5e5e5;
          color: #999999;
          cursor: not-allowed;
          transform: none;
        }

        .resend-button {
          width: 100%;
          padding: 16px 24px;
          border-radius: 12px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          border: 2px solid #e5e5e5;
          background: #ffffff;
          color: #000000;
          transition: all 0.2s ease;
        }

        .resend-button:hover:not(:disabled) {
          border-color: #000000;
          background: #f8f8f8;
        }

        .resend-button:disabled {
          color: #999999;
          cursor: not-allowed;
          border-color: #e5e5e5;
        }

        .footer-text {
          text-align: center;
          margin-top: 32px;
          font-size: 14px;
          color: #666666;
        }

        .footer-link {
          color: #000000;
          text-decoration: none;
          font-weight: 600;
        }

        .footer-link:hover {
          opacity: 0.7;
        }

        .toast {
          position: fixed;
          top: 24px;
          right: 24px;
          background: #000000;
          color: #ffffff;
          border-radius: 12px;
          padding: 16px 24px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
          display: flex;
          align-items: center;
          gap: 12px;
          z-index: 1000;
          max-width: 400px;
          animation: slideIn 0.3s ease;
        }

        .toast-success {
          background: #000000;
        }

        .toast-error {
          background: #dc2626;
        }

        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        @media (max-width: 768px) {
          .otp-inputs {
            gap: 8px;
          }

          .otp-input {
            width: 50px;
            height: 50px;
            font-size: 24px;
          }
        }
      `}</style>

      <div className="otp-container">
        {toast.show && (
          <div className={`toast ${toast.type === 'success' ? 'toast-success' : 'toast-error'}`}>
            {toast.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
            <span>{toast.message}</span>
          </div>
        )}

        <div className="otp-card">
          <div className="otp-header">
            <div className="email-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            </div>
            <h1 className="otp-title">Verify Reset Code</h1>
            <p className="otp-subtitle">Enter the 6-digit code we sent to</p>
            <p className="otp-email">{email}</p>
          </div>

          <form onSubmit={handleVerify}>
            <div className="otp-inputs">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  id={`otp-${index}`}
                  type="text"
                  inputMode="numeric"
                  maxLength="1"
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={index === 0 ? handlePaste : undefined}
                  className="otp-input"
                  disabled={timeLeft <= 0}
                  autoComplete="off"
                />
              ))}
            </div>

            {timeLeft > 0 ? (
              <div className="timer-section">
                <svg className="timer-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
                <span>Code expires in {formatTime(timeLeft)}</span>
              </div>
            ) : (
              <div className="expired-alert">
                <p className="expired-text">
                  <AlertCircle size={16} />
                  Code has expired. Please request a new one.
                </p>
              </div>
            )}

            <div className="button-group">
              <button
                type="submit"
                disabled={isLoading || timeLeft <= 0 || otp.join('').length !== 6}
                className="verify-button"
              >
                {isLoading ? 'Verifying...' : 'Verify Code'}
              </button>

              <button
                type="button"
                onClick={handleResend}
                disabled={!canResend || isLoading}
                className="resend-button"
              >
                {canResend ? 'Resend code' : `Resend in ${resendCooldown}s`}
              </button>
            </div>
          </form>

          <p className="footer-text">
            Wrong email? <a href="/forgot-password" className="footer-link">Try again</a>
          </p>
        </div>
      </div>
    </>
  );
}

export default VerifyPasswordResetOtp;