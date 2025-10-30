import React, { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, Upload, User, Phone, FileText, MapPin, X, Loader } from 'lucide-react';

// Toast Component
const Toast = ({ message, type, onClose, isVisible }) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  return (
    <div className={`toast toast-${type} ${isVisible ? 'toast-enter' : 'toast-exit'}`}>
      <div className="toast-content">
        {type === 'success' ? (
          <CheckCircle className="toast-icon" />
        ) : (
          <AlertCircle className="toast-icon" />
        )}
        <span className="toast-message">{message}</span>
        <button className="toast-close" onClick={onClose}>
          <X size={16} />
        </button>
      </div>
    </div>
  );
};

const AddDriver = () => {
  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    gender: 'Male',
    licenseNumber: '',
    subLocation: 'Main Location',
    location: '',
  });
  const [locationDetails, setLocationDetails] = useState(null);
  const [subLocations, setSubLocations] = useState(['Main Location']);
  const [image, setImage] = useState(null);
  const [licenseFile, setLicenseFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState({ message: '', type: '', isVisible: false });

  useEffect(() => {
    const fetchManagerLocation = async () => {
      try {
        // Using axios-like fetch implementation
        const token = localStorage.getItem('token');
        const response = await fetch(`${backendUrl}/api/managers/me`, {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch manager location');
        }
        
        const data = await response.json();
        const location = data.manager.assignedLocation;
        setFormData((prev) => ({ ...prev, location: location._id }));
        setLocationDetails(location);

        // Fetch sublocations for the city
        if (location && location.city) {
          const subLocResponse = await fetch(`${backendUrl}/api/locations?city=${location.city}`, {
            headers: { 
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
          });
          if (subLocResponse.ok) {
            const subLocs = await subLocResponse.json();
            const subLocNames = ['Main Location', ...subLocs.map(loc => loc.name).filter(name => name !== location.name)];
            setSubLocations(subLocNames);
          }
        }
      } catch (err) {
        console.error('❌ Error fetching manager location:', err.message);
        showToast('Failed to fetch location details', 'error');
      }
    };
    fetchManagerLocation();
  }, [backendUrl]);

  const showToast = (message, type) => {
    setToast({ message, type, isVisible: true });
  };

  const hideToast = () => {
    setToast(prev => ({ ...prev, isVisible: false }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubLocationChange = (e) => {
    setFormData((prev) => ({ ...prev, subLocation: e.target.value }));
  };

  const handleFileChange = (e, fileType) => {
    const file = e.target.files[0];
    if (fileType === 'image') {
      setImage(file);
    } else if (fileType === 'license') {
      setLicenseFile(file);
    }
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      showToast('Driver name is required', 'error');
      return false;
    }
    if (!formData.email.trim()) {
      showToast('Email is required', 'error');
      return false;
    }
    if (!formData.phone.trim()) {
      showToast('Phone number is required', 'error');
      return false;
    }
    if (!formData.gender) {
      showToast('Gender is required', 'error');
      return false;
    }
    if (formData.licenseNumber.length !== 16) {
      showToast('License number must be exactly 16 characters', 'error');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);
    
    const data = new FormData();
    data.append('name', formData.name);
    data.append('email', formData.email);
    data.append('phone', formData.phone);
    data.append('gender', formData.gender);
    data.append('licenseNumber', formData.licenseNumber);
    data.append('subLocation', formData.subLocation);
    if (image) data.append('image', image);
    if (licenseFile) data.append('licenseFile', licenseFile);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${backendUrl}/api/managers/drivers`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: data,
      });

      if (!response.ok) {
        throw new Error('Failed to add driver');
      }

      const result = await response.json();
      showToast('Driver added successfully!', 'success');
      
      // Reset form
      setFormData({ 
        name: '', 
        email: '',
        phone: '', 
        gender: 'Male',
        licenseNumber: '', 
        subLocation: 'Main Location',
        location: formData.location 
      });
      setImage(null);
      setLicenseFile(null);
      
      // Reset file inputs
      const fileInputs = document.querySelectorAll('input[type="file"]');
      fileInputs.forEach(input => input.value = '');
      
    } catch (err) {
      console.error('❌ Error adding driver:', err.message);
      showToast('Failed to add driver. Please check your input.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <style>{`
        /* Toast Styles */
        .toast {
          position: fixed;
          top: 20px;
          right: 20px;
          z-index: 1000;
          min-width: 300px;
          max-width: 500px;
          border-radius: 12px;
          padding: 16px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
          backdrop-filter: blur(10px);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .toast-success {
          background: linear-gradient(135deg, rgba(34, 197, 94, 0.95), rgba(22, 163, 74, 0.95));
          border: 1px solid rgba(34, 197, 94, 0.3);
          color: white;
        }

        .toast-error {
          background: linear-gradient(135deg, rgba(239, 68, 68, 0.95), rgba(220, 38, 38, 0.95));
          border: 1px solid rgba(239, 68, 68, 0.3);
          color: white;
        }

        .toast-content {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .toast-icon {
          flex-shrink: 0;
          width: 20px;
          height: 20px;
        }

        .toast-message {
          flex: 1;
          font-weight: 500;
          font-size: 14px;
          line-height: 1.4;
        }

        .toast-close {
          background: none;
          border: none;
          color: inherit;
          cursor: pointer;
          padding: 4px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
          opacity: 0.8;
        }

        .toast-close:hover {
          opacity: 1;
          background: rgba(255, 255, 255, 0.2);
        }

        .toast-enter {
          animation: slideInFromRight 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .toast-exit {
          animation: slideOutToRight 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        @keyframes slideInFromRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        @keyframes slideOutToRight {
          from {
            transform: translateX(0);
            opacity: 1;
          }
          to {
            transform: translateX(100%);
            opacity: 0;
          }
        }

        /* Enhanced Form Styles */
        .add-driver-container {
          max-width: 700px;
          margin: 40px auto;
          padding: 40px;
          background: linear-gradient(145deg, #ffffff, #f8fafc);
          border-radius: 24px;
          box-shadow: 
            0 20px 60px rgba(0, 0, 0, 0.08),
            0 0 0 1px rgba(255, 255, 255, 0.5);
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
          position: relative;
          overflow: hidden;
        }

        .add-driver-container::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(90deg, #6366f1, #8b5cf6, #ec4899, #ef4444, #f59e0b, #10b981);
        }

        .form-header {
          text-align: center;
          margin-bottom: 40px;
        }

        .form-title {
          font-size: 2.5rem;
          font-weight: 700;
          background: linear-gradient(135deg, #1e293b, #475569);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 8px;
        }

        .form-subtitle {
          color: #64748b;
          font-size: 1rem;
          font-weight: 400;
        }

        .form-group {
          margin-bottom: 28px;
          position: relative;
        }

        .form-label {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 600;
          margin-bottom: 12px;
          color: #374151;
          font-size: 14px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .form-input {
          width: 100%;
          padding: 18px 20px;
          border: 2px solid #e5e7eb;
          border-radius: 16px;
          font-size: 16px;
          background: #ffffff;
          color: #1f2937;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-sizing: border-box;
          font-family: inherit;
        }

        .form-input:focus {
          outline: none;
          border-color: #6366f1;
          background: #fefefe;
          box-shadow: 
            0 0 0 4px rgba(99, 102, 241, 0.1),
            0 4px 20px rgba(99, 102, 241, 0.15);
          transform: translateY(-2px);
        }

        .form-input:hover:not(:focus) {
          border-color: #d1d5db;
          background: #fefefe;
        }

        .form-input::placeholder {
          color: #9ca3af;
          font-style: italic;
        }

        .form-input:disabled {
          background: #f9fafb;
          color: #6b7280;
          cursor: not-allowed;
          border-color: #e5e7eb;
        }

        .file-input {
          position: relative;
          display: inline-block;
          width: 100%;
        }

        .file-input input[type="file"] {
          position: absolute;
          opacity: 0;
          width: 100%;
          height: 100%;
          cursor: pointer;
        }

        .file-input-button {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          width: 100%;
          padding: 18px 20px;
          background: linear-gradient(135deg, #f8fafc, #f1f5f9);
          border: 2px dashed #cbd5e1;
          border-radius: 16px;
          color: #64748b;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s ease;
          min-height: 60px;
        }

        .file-input:hover .file-input-button {
          border-color: #6366f1;
          background: linear-gradient(135deg, #faf5ff, #f3f4f6);
          color: #6366f1;
        }

        .file-selected {
          border-color: #10b981;
          background: linear-gradient(135deg, #ecfdf5, #f0fdf4);
          color: #059669;
        }

        .submit-button {
          width: 100%;
          padding: 18px 24px;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          color: white;
          border: none;
          border-radius: 16px;
          font-weight: 600;
          font-size: 16px;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          position: relative;
          overflow: hidden;
          margin-top: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .submit-button::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
          transition: left 0.6s ease;
        }

        .submit-button:hover::before {
          left: 100%;
        }

        .submit-button:hover:not(:disabled) {
          background: linear-gradient(135deg, #5855eb, #7c3aed);
          transform: translateY(-2px);
          box-shadow: 0 10px 30px rgba(99, 102, 241, 0.4);
        }

        .submit-button:active:not(:disabled) {
          transform: translateY(0);
          box-shadow: 0 5px 20px rgba(99, 102, 241, 0.3);
        }

        .submit-button:disabled {
          background: #9ca3af;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }

        .location-display {
          background: linear-gradient(135deg, #f0f9ff, #e0f2fe);
          border: 2px solid #bae6fd;
          border-radius: 16px;
          padding: 18px 20px;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .loading-spinner {
          width: 20px;
          height: 20px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-radius: 50%;
          border-top-color: #ffffff;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        /* Responsive Design */
        @media (max-width: 768px) {
          .add-driver-container {
            margin: 20px;
            padding: 30px 20px;
          }
          
          .form-title {
            font-size: 2rem;
          }
          
          .form-input,
          .submit-button {
            padding: 16px 18px;
          }
        }

        @media (max-width: 480px) {
          .add-driver-container {
            margin: 10px;
            padding: 24px 16px;
          }
          
          .form-title {
            font-size: 1.75rem;
          }
          
          .toast {
            left: 10px;
            right: 10px;
            min-width: auto;
          }
        }
      `}</style>

      <div className="add-driver-container">
        <div className="form-header">
          <h2 className="form-title">Add New Driver</h2>
          <p className="form-subtitle">Register a new driver to your location</p>
        </div>

        <form className="add-driver-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">
              <User size={16} />
              Driver Name
            </label>
            <input
              type="text"
              name="name"
              placeholder="Enter driver's full name"
              value={formData.name}
              onChange={handleChange}
              className="form-input"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              <Phone size={16} />
              Phone Number
            </label>
            <input
              type="tel"
              name="phone"
              placeholder="Enter phone number"
              value={formData.phone}
              onChange={handleChange}
              className="form-input"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              <FileText size={16} />
              License Number
            </label>
            <input
              type="text"
              name="licenseNumber"
              placeholder="Enter 16-character license number"
              value={formData.licenseNumber}
              onChange={handleChange}
              className="form-input"
              maxLength={16}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              <User size={16} />
              Gender
            </label>
            <select
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              className="form-input"
              required
            >
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </div>

          {locationDetails && (
            <div className="form-group">
              <label className="form-label">
                <MapPin size={16} />
                Sub Location
              </label>
              <select
                value={formData.subLocation}
                onChange={handleSubLocationChange}
                className="form-input"
                required
              >
                {subLocations.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
            </div>
          )}

          {locationDetails && (
            <div className="form-group">
              <label className="form-label">
                <MapPin size={16} />
                Assigned City
              </label>
              <div className="location-display">
                <MapPin size={16} />
                <span>{locationDetails.city}</span>
              </div>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">
              <User size={16} />
              Email
            </label>
            <input
              type="email"
              name="email"
              placeholder="Enter driver's email"
              value={formData.email}
              onChange={handleChange}
              className="form-input"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              <Upload size={16} />
              Profile Image
            </label>
            <div className="file-input">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileChange(e, 'image')}
              />
              <div className={`file-input-button ${image ? 'file-selected' : ''}`}>
                <Upload size={20} />
                <span>
                  {image ? `Selected: ${image.name}` : 'Choose profile image'}
                </span>
              </div>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">
              <FileText size={16} />
              License Document
            </label>
            <div className="file-input">
              <input
                type="file"
                accept=".pdf,image/*"
                onChange={(e) => handleFileChange(e, 'license')}
              />
              <div className={`file-input-button ${licenseFile ? 'file-selected' : ''}`}>
                <FileText size={20} />
                <span>
                  {licenseFile ? `Selected: ${licenseFile.name}` : 'Choose license document (PDF/Image)'}
                </span>
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="submit-button"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <div className="loading-spinner" />
                Adding Driver...
              </>
            ) : (
              'Add Driver'
            )}
          </button>
        </form>
      </div>

      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={hideToast}
      />
    </>
  );
};

export default AddDriver;