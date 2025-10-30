import { useState, useContext, useEffect } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext.jsx";
import styles from "../../styles/Login.module.css";
import carBikeGif from "../../assets/Car-Bike transform.gif";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: '' });
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  // Toast notification function
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: '' });
    }, 3000);
  };

  // Redirect if already logged in
  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");

    if (token) {
      if (role === "admin" && location.pathname !== "/admin") {
        navigate("/admin");
      } else if (role === "manager" && location.pathname !== "/manager") {
        navigate("/manager");
      } else if (role === "customer" && location.pathname !== "/") {
        navigate("/");
      }
    }
  }, [navigate, location]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await axios.post("http://localhost:5000/api/auth/login", {
        email,
        password,
      });

      console.log('Backend response:', res.data);

      const { token, role, assignedLocation, user, name, email: userEmail } = res.data;

      if (!token || !role) {
        throw new Error("Missing token or role in response");
      }

      // Extract and normalize user data from backend response
      const userData = {
        id: user?._id || user?.id,
        name: user?.name || name || 'User', // Use 'User' as fallback instead of email username
        email: user?.email || userEmail || email,
        role: user?.role || role,
        assignedLocation: assignedLocation
      };
      console.log('Normalized user data:', userData);

      // Pass complete user data to login function (will be stored in localStorage)
      await login(token, userData);

      // Show success toast
      showToast("Welcome back! Login successful", "success");

      // Navigate after a short delay to show the toast
      setTimeout(() => {
        if (role === "admin") {
          navigate("/admin");
        } else if (role === "manager") {
          navigate("/manager");
        } else {
          navigate("/");
        }
      }, 1500);

    } catch (err) {
      console.error("Login error:", err.response?.data?.message || err.message);
      if (err.response?.data?.requiresVerification) {
        showToast("Please verify your email first", "error");
        setTimeout(() => {
          navigate(`/verify-otp?email=${encodeURIComponent(err.response.data.email || email)}`);
        }, 2000);
      } else {
        showToast(err.response?.data?.message || "Login failed. Please check your credentials.", "error");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Toast notification */}
      {toast.show && (
        <div className={`${styles.toast} ${toast.type === 'success' ? styles.toastSuccess : styles.toastError}`} onClick={() => setToast({ show: false, message: '', type: '' })}>
          <div className={styles.toastContent}>
            {toast.type === 'success' ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6L9 17l-5-5" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
            )}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      <div className={styles.loginPage}>
        <div className={styles.loginSplitContainer}>

          {/* Left GIF section */}
          <div className={styles.loginGif}>
            <img src={carBikeGif} alt="RideGo animation" />
          </div>

          {/* Right Login form section */}
          <div className={styles.loginFormContainer}>

            <div className={styles.loginHeader}>
              <h2>Welcome to RideGo</h2>
              <p>Sign in to continue your journey</p>
            </div>

            <form onSubmit={handleSubmit} className={styles.loginForm}>
              <div className={styles.inputGroup}>
                <input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className={styles.formInputLarge}
                />
                <span className={styles.inputIcon}>
                  <svg xmlns="http://www.w3.org/2000/svg"
                    width="24" height="24" fill="none" stroke="currentColor"
                    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0
                             1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2
                             2-2z"></path>
                    <polyline points="22,6 12,13 2,6"></polyline>
                  </svg>
                </span>
              </div>

              <div className={styles.inputGroup}>
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className={styles.formInputLarge}
                />
                <span className={styles.inputIcon}>
                  <svg xmlns="http://www.w3.org/2000/svg"
                    width="24" height="24" fill="none" stroke="currentColor"
                    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                  </svg>
                </span>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className={styles.loginButtonLarge}
              >
                {isLoading && <span className={styles.loadingSpinner}></span>}
                {isLoading ? "Signing you in..." : "Sign In"}
              </button>
            </form>

            <div className={styles.loginFooter}>
              <p>
                Don't have an account? <a href="/signup">Sign up</a>
              </p>
              <p>
                <a href="/forgot-password">Forgot password?</a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Login;