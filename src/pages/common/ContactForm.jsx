// src/pages/common/ContactForm.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function ContactForm() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    issue: '',
    city: '',
    subLocation: '',
    comments: ''
  });

  const [cities, setCities] = useState([]);
  const [subLocations, setSubLocations] = useState([]);
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(false);

  // Pre-fill form data when user is loaded
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: user.name || '',
        email: user.email || '',
        mobile: user.mobile || user.phone || ''
      }));
    }
  }, [user]);

  // Fetch cities when user is available
  useEffect(() => {
    if (user) {
      fetchCities();
    }
  }, [user]);

  const fetchCities = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/contact/cities');
      const data = await response.json();
      setCities(data);
    } catch (error) {
      console.error('Error fetching cities:', error);
    }
  };

  const fetchSubLocations = async (city) => {
    try {
      const response = await fetch(`http://localhost:5000/api/contact/sublocations/${city}`);
      const data = await response.json();
      setSubLocations(data);
    } catch (error) {
      console.error('Error fetching sublocations:', error);
      setSubLocations([]);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Fetch sublocations when city changes
    if (name === 'city') {
      setFormData(prev => ({ ...prev, subLocation: '' }));
      if (value && value !== 'any') {
        fetchSubLocations(value);
      } else {
        setSubLocations([]);
      }
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Validation
    if (!formData.name || !formData.email || !formData.mobile || !formData.issue ||
        !formData.city || !formData.subLocation || !formData.comments) {
      showToast('Please fill in all required fields', 'error');
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/contact/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok) {
        showToast('Query submitted successfully! We will get back to you soon.', 'success');
        setFormData({
          name: user?.name || '',
          email: user?.email || '',
          mobile: user?.mobile || user?.phone || '',
          issue: '',
          city: '',
          subLocation: '',
          comments: ''
        });
        setSubLocations([]);
      } else {
        showToast(result.message || 'Failed to submit query', 'error');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      showToast('Failed to submit query. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Show loading spinner while auth is loading
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-5">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Login Prompt Screen
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-5">
        <style>{`
          .login-prompt-card {
            background: white;
            border-radius: 16px;
            padding: 48px 40px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
            max-width: 500px;
            text-align: center;
          }
          .login-icon {
            width: 80px;
            height: 80px;
            background: linear-gradient(135deg, #2563eb, #7c3aed);
            border-radius: 50%;
            margin: 0 auto 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 36px;
          }
          .login-title {
            font-size: 28px;
            font-weight: 700;
            color: #111827;
            margin-bottom: 12px;
          }
          .login-description {
            font-size: 16px;
            color: #6b7280;
            margin-bottom: 32px;
            line-height: 1.6;
          }
          .login-buttons {
            display: flex;
            gap: 12px;
            justify-content: center;
          }
          .btn-login, .btn-signup {
            padding: 14px 28px;
            font-size: 15px;
            font-weight: 600;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.3s ease;
            border: none;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .btn-login {
            background: black;
            color: white;
          }
          .btn-login:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
          }
          .btn-signup {
            background: white;
            color: black;
            border: 2px solid black;
          }
          .btn-signup:hover {
            background: black;
            color: white;
          }
        `}</style>

        <div className="login-prompt-card">
          <div className="login-icon">🔒</div>
          <h1 className="login-title">Login Required</h1>
          <p className="login-description">
            Please log in to submit a contact query. We need to verify your identity to provide better support.
          </p>
          <div className="login-buttons">
            <button className="btn-login" onClick={() => navigate('/login')}>
              Log In
            </button>
            <button className="btn-signup" onClick={() => navigate('/signup')}>
              Sign Up
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-5">
      <style>{`
        * { box-sizing: border-box; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', sans-serif;
          margin: 0;
          padding: 0;
        }

        .main-wrapper {
          max-width: 1400px;
          width: 100%;
          margin: 100px auto 0 auto;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 40px;
          align-items: start;
        }

        .contact-container {
          background-color: #fff;
          padding: 50px 60px;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
        }

        .contact-info-section {
          background-color: #fff;
          padding: 50px 60px;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
        }

        .contact-info-title {
          font-size: 24px;
          font-weight: 600;
          color: #111827;
          margin-bottom: 30px;
        }

        .contact-info-item {
          display: flex;
          align-items: flex-start;
          gap: 15px;
          margin-bottom: 25px;
          border-radius: 8px;
          padding: 10px;
        }

        .contact-icon {
          width: 40px;
          height: 40px;
          background-color: #f3f4f6;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .contact-info-content { flex: 1; }

        .contact-info-label {
          font-size: 14px;
          font-weight: 600;
          color: #111827;
          margin-bottom: 5px;
        }

        .contact-info-text {
          font-size: 14px;
          color: #6b7280;
          line-height: 1.5;
        }

        .map-container {
          margin-top: 30px;
          border-radius: 8px;
          overflow: hidden;
          height: 300px;
          background-color: #f3f4f6;
        }

        .page-title {
          font-size: 36px;
          font-weight: 400;
          font-style: italic;
          color: #111827;
          text-align: center;
          margin-bottom: 50px;
        }

        .contact-form {
          display: flex;
          flex-direction: column;
          gap: 25px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .form-group label {
          font-size: 17px;
          color: #111827;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .form-input {
          width: 100%;
          padding: 14px 18px;
          font-size: 15px;
          color: #111827;
          background-color: #fff;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          outline: none;
          transition: all 0.2s ease;
          font-family: inherit;
        }

        .form-input::placeholder {
          color: #9ca3af;
        }

        .form-input:focus {
          border-color: black;
          outline: none;
        }

        .form-input:disabled {
          background-color: #f3f4f6;
          cursor: not-allowed;
        }

        input:-webkit-autofill,
        input:-webkit-autofill:hover,
        input:-webkit-autofill:focus,
        input:-webkit-autofill:active {
          box-shadow: 0 0 0 30px white inset !important;
          -webkit-box-shadow: 0 0 0 30px white inset !important;
          -webkit-text-fill-color: #111827 !important;
        }

        textarea.form-input {
          min-height: 120px;
          resize: vertical;
        }

        select.form-input {
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236b7280' d='M6 8L2 4h8z'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 14px center;
          padding-right: 40px;
          cursor: pointer;
          color: #111827;
        }

        .submit-button {
          width: 100%;
          padding: 16px 24px;
          background: black;
          color: white;
          font-size: 15px;
          font-weight: 600;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.3s ease;
          margin-top: 20px;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .submit-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.4);
        }

        .submit-button:active {
          transform: translateY(0);
        }

        .submit-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .toast {
          position: fixed;
          top: 20px;
          right: 20px;
          background-color: #10b981;
          color: #fff;
          padding: 14px 20px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          min-width: 240px;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
          z-index: 1000;
          animation: slideIn 0.3s ease;
        }

        .toast.error {
          background-color: #ef4444;
        }

        @keyframes slideIn {
          from {
            transform: translateX(400px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        @media (max-width: 768px) {
          .main-wrapper {
            grid-template-columns: 1fr;
            gap: 30px;
          }

          .contact-container, .contact-info-section {
            padding: 30px 20px;
          }

          .page-title {
            font-size: 28px;
            margin-bottom: 35px;
          }

          .form-input {
            font-size: 14px;
          }
        }
      `}</style>

      <div className="main-wrapper">
        <div className="contact-container">
          <h1 className="page-title">Submit Your Query</h1>

          <form className="contact-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="name">Name *</label>
              <input
                type="text"
                id="name"
                name="name"
                className="form-input"
                value={formData.name}
                onChange={handleChange}
                disabled
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email Address *</label>
              <input
                type="email"
                id="email"
                name="email"
                className="form-input"
                value={formData.email}
                onChange={handleChange}
                disabled
              />
            </div>

            <div className="form-group">
              <label htmlFor="mobile">Mobile Number *</label>
              <input
                type="tel"
                id="mobile"
                name="mobile"
                className="form-input"
                value={formData.mobile}
                onChange={handleChange}
                placeholder="Enter your mobile number"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="issue">Issue Type *</label>
              <select
                id="issue"
                name="issue"
                className="form-input"
                value={formData.issue}
                onChange={handleChange}
                required
              >
                <option value="">Select Issue Type</option>
                <option value="general-inquiry">General Inquiry</option>
                <option value="technical-support">Technical Support</option>
                <option value="booking-issue">Booking Issue</option>
                <option value="billing-question">Billing Question</option>
                <option value="feedback">Feedback</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="city">City *</label>
              <select
                id="city"
                name="city"
                className="form-input"
                value={formData.city}
                onChange={handleChange}
                required
              >
                <option value="">Select City</option>
                <option value="any">Any</option>
                {cities.map((city, index) => (
                  <option key={index} value={city}>{city}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="subLocation">Sub Location *</label>
              <select
                id="subLocation"
                name="subLocation"
                className="form-input"
                value={formData.subLocation}
                onChange={handleChange}
                disabled={!formData.city}
                required
              >
                <option value="">Select Sub Location</option>
                {formData.city === 'any' ? (
                  <option value="any">Any</option>
                ) : (
                  subLocations.map((loc, index) => (
                    <option key={index} value={loc}>{loc}</option>
                  ))
                )}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="comments">Comments *</label>
              <textarea
                id="comments"
                name="comments"
                className="form-input"
                placeholder="Describe your query in detail..."
                value={formData.comments}
                onChange={handleChange}
                required
              />
            </div>

            <button type="submit" className="submit-button" disabled={loading}>
              {loading ? 'Submitting...' : 'Submit Query'}
            </button>
          </form>
        </div>

        <div className="contact-info-section">
          <h2 className="contact-info-title">Contact Information</h2>

          <div className="contact-info-item">
            <div className="contact-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
            </div>
            <div className="contact-info-content">
              <div className="contact-info-label">Address</div>
              <div className="contact-info-text">
                123 Business Avenue, Hitech city, Madurai, Tamil Nadu, IN 625014
              </div>
            </div>
          </div>

          <div className="contact-info-item">
            <div className="contact-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
              </svg>
            </div>
            <div className="contact-info-content">
              <div className="contact-info-label">Phone</div>
              <div className="contact-info-text">+1 (555) 123-4567</div>
            </div>
          </div>

          <div className="contact-info-item">
            <div className="contact-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
            </div>
            <div className="contact-info-content">
              <div className="contact-info-label">Email</div>
              <div className="contact-info-text">info@company.com</div>
            </div>
          </div>

          <div className="map-container">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d4028463.214673663!2d76.64198943749999!3d20.96740740000001!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x30635ff06b92b791%3A0xd78c4fa1854213a6!2sIndia!5e0!3m2!1sen!2sin!4v1234567890123!5m2!1sen!2sin"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen=""
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </div>

      {toast && (
        <div className={`toast ${toast.type}`}>
          {toast.message}
        </div>
      )}
    </div>
  );
}
