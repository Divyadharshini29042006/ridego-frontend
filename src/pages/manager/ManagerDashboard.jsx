// frontend/src/pages/manager/ManagerDashboard.jsx
import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import { User, Mail, Calendar, MapPin, Edit2, X, Save, Upload, Users, Car, BookOpen, Check, AlertCircle } from 'lucide-react';
import ManagerSidebar from '../../components/Sidebar/ManagerSidebar';
import '../../styles/ManagerDashboard.css';

// Toast Component
const Toast = ({ message, type = 'success', onClose }) => (
  <div className={`toast toast-${type}`}>
    <div className="toast-icon">
      {type === 'success' && <Check size={20} />}
      {type === 'error' && <AlertCircle size={20} />}
      {type === 'warning' && <AlertCircle size={20} />}
    </div>
    <span>{message}</span>
    <button className="toast-close" onClick={onClose}>
      <X size={16} />
    </button>
  </div>
);

// Custom Toast Container Component
const CustomToastContainer = ({ toasts, removeToast }) => (
  <div className="toast-container">
    {toasts.map(toast => (
      <Toast
        key={toast.id}
        message={toast.message}
        type={toast.type}
        onClose={() => removeToast(toast.id)}
      />
    ))}
  </div>
);

// Helper to extract filename from path
const getFilename = (path) => {
  if (!path) return '';
  const normalizedPath = path.replace(/\\\\/g, '/').replace(/\\/g, '/');
  const parts = normalizedPath.split('/');
  return parts[parts.length - 1];
};

const ManagerDashboard = () => {
  const [manager, setManager] = useState(null);
  const [stats, setStats] = useState({
    drivers: 0,
    vehicles: 0,
    bookings: 0,
  });
  const [imageLoaded, setImageLoaded] = useState(false);
  
  // State for editing functionality
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
    profileImage: null
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [isLoading, setIsLoading] = useState(false);



  // Toast state
  const [toasts, setToasts] = useState([]);

  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

  // Toast functions
  const addToast = (message, type = 'success') => {
    const id = Date.now() + Math.random();
    const toast = { id, message, type };
    setToasts(prev => [...prev, toast]);
    
    // Auto remove after 4 seconds
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.map(toast => 
      toast.id === id 
        ? { ...toast, className: 'slide-out' } 
        : toast
    ));
    
    // Remove from state after animation
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, 300);
  };

  useEffect(() => {
    fetchManagerData();
  }, []);

  const fetchManagerData = async () => {
    try {
      const res = await axios.get('/api/managers/dashboard', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      if (res.status === 200 && res.data) {
        setManager(res.data.manager);
        setStats(res.data.stats);
        
        // Initialize edit form with current data
        setEditForm({
          name: res.data.manager.name || '',
          email: res.data.manager.email || '',
          oldPassword: '',
          newPassword: '',
          confirmPassword: '',
          profileImage: null
        });
      } else {
        console.error('❌ Unexpected response:', res);
        addToast('Failed to load dashboard data', 'error');
      }
    } catch (err) {
      console.error('❌ Dashboard fetch failed:', err.response?.data || err.message);
      addToast('Failed to load dashboard data', 'error');
    }
  };



  const profileImageFilename = getFilename(manager?.profileImage);

  const profileImageURL = useMemo(() => {
    return profileImageFilename
      ? `${backendUrl}/uploads/managers/${encodeURIComponent(profileImageFilename)}`
      : '/default-profile.png';
  }, [profileImageFilename, backendUrl]);

  // Editing functionality
  const handleEditToggle = () => {
    if (isEditing) {
      // Reset form when canceling
      setEditForm({
        name: manager.name || '',
        email: manager.email || '',
        oldPassword: '',
        newPassword: '',
        confirmPassword: '',
        profileImage: null
      });
      setImagePreview(null);
    }
    setIsEditing(!isEditing);
  };

  const handleInputChange = (field, value) => {
    setEditForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        addToast('File size must be less than 5MB', 'error');
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        addToast('Please select a valid image file', 'error');
        return;
      }

      setEditForm(prev => ({
        ...prev,
        profileImage: file
      }));
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target.result);
      reader.readAsDataURL(file);
      
      addToast('Image selected successfully', 'success');
    }
  };

  const handleSave = async () => {
    if (isLoading) return;
    
    try {
      setIsLoading(true);

      // Validate required fields
      if (!editForm.name.trim()) {
        addToast('Name is required', 'error');
        return;
      }

      if (!editForm.email.trim()) {
        addToast('Email is required', 'error');
        return;
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(editForm.email)) {
        addToast('Please enter a valid email address', 'error');
        return;
      }

      // Password validation (only if provided)
      if (editForm.newPassword && editForm.newPassword.length < 6) {
        addToast('Password must be at least 6 characters long', 'error');
        return;
      }

      if (editForm.newPassword && editForm.newPassword !== editForm.confirmPassword) {
        addToast('New Password and Confirm Password do not match', 'error');
        return;
      }

      const formData = new FormData();
      formData.append('name', editForm.name.trim());
      formData.append('email', editForm.email.trim());
      
      if (editForm.newPassword.trim()) {
        formData.append('oldPassword', editForm.oldPassword);
        formData.append('password', editForm.newPassword);
      }
      
      if (editForm.profileImage) {
        formData.append('profileImage', editForm.profileImage);
      }

      const res = await axios.put('/api/managers/profile', formData, {
        headers: { 
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'multipart/form-data'
        },
      });
      
      if (res.status === 200 && res.data.success) {
        // Update local state with new data
        setManager(res.data.manager);
        setIsEditing(false);
        setImagePreview(null);
        
        // Reset form
        setEditForm({
          name: res.data.manager.name || '',
          email: res.data.manager.email || '',
          oldPassword: '',
          newPassword: '',
          confirmPassword: '',
          profileImage: null
        });
        
        addToast('Profile updated successfully!', 'success');
        
        // Refresh the page data to ensure consistency
        fetchManagerData();
      } else {
        throw new Error('Update failed');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      
      if (error.response?.data?.message) {
        addToast(error.response.data.message, 'error');
      } else if (error.response?.status === 400) {
        addToast('Invalid data provided. Please check your inputs.', 'error');
      } else if (error.response?.status === 401) {
        addToast('Session expired. Please login again.', 'error');
        localStorage.removeItem('token');
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
      } else if (error.response?.status === 409) {
        addToast('Email already exists. Please use a different email.', 'error');
      } else {
        addToast('Failed to update profile. Please try again.', 'error');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Escape' && isEditing) {
      handleEditToggle();
    }
  };

  // Add keyboard event listener
  useEffect(() => {
    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [isEditing]);

  if (!manager) {
    return (
      <div className="manager-layout">
        <ManagerSidebar />
        <div className="manager-content">
          <p>Loading dashboard... Please wait</p>
        </div>
      </div>
    );
  }

  return (
    <div className="manager-layout">
      <ManagerSidebar />
      <div className="manager-content">
        <div className="dashboard-header">
          <h1>Welcome back, {manager.name}</h1>
          <p className="dashboard-subtitle">Here's what's happening with your team today</p>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-header">
              <div className="stat-icon">
                <Users size={20} />
              </div>
              <div className="stat-label">Total Drivers</div>
            </div>
            <div className="stat-value">{stats.drivers ?? 'N/A'}</div>
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <div className="stat-icon">
                <Car size={20} />
              </div>
              <div className="stat-label">Assigned Vehicles</div>
            </div>
            <div className="stat-value">{stats.vehicles ?? 'N/A'}</div>
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <div className="stat-icon">
                <BookOpen size={20} />
              </div>
              <div className="stat-label">Total Bookings</div>
            </div>
            <div className="stat-value">{stats.bookings ?? 'N/A'}</div>
          </div>
        </div>



        <div className="location-section">
          <div className="location-header">
            <MapPin size={20} className="location-icon" />
            <h3 className="location-title">Assigned Location</h3>
          </div>
          <p className="location-text">
            {manager.assignedLocation?.name || 'N/A'} — {manager.assignedLocation?.city || ''}
          </p>
        </div>

        <div className="profile-section">
          <div className="profile-header">
            <h3 className="profile-title">Profile Summary</h3>
            <button 
              className="edit-btn"
              onClick={handleEditToggle}
              disabled={isLoading}
            >
              <Edit2 size={16} />
              Edit Profile
            </button>
          </div>

          <div className="profile-content">
            <div className="profile-image-wrapper">
              {!imageLoaded && <div className="image-skeleton">Loading...</div>}
              <img
                src={profileImageURL}
                alt="Manager Profile"
                onLoad={() => setImageLoaded(true)}
                onError={(e) => {
                  const fallback = '/default-profile.png';
                  if (!e.target.src.includes(fallback)) {
                    console.warn('⚠️ Profile image failed to load:', e.target.src);
                    e.target.onerror = null;
                    e.target.src = fallback;
                  }
                }}
                className="profile-image"
                style={{ display: imageLoaded ? 'block' : 'none' }}
              />
            </div>

            <div className="profile-details">
              <div className="profile-info-item">
                <User size={18} />
                <span>{manager.name}</span>
              </div>
              <div className="profile-info-item">
                <Mail size={18} />
                <span>{manager.email}</span>
              </div>
              <div className="profile-info-item">
                <Calendar size={18} />
                <span>
                  Joined{' '}
                  {manager.createdAt
                    ? new Date(manager.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })
                    : 'Date not available'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Edit Modal */}
        {isEditing && (
          <div className="dashboard-modal-overlay" onClick={(e) => {
            if (e.target.className.includes('dashboard-modal-overlay')) handleEditToggle();
          }}>
            <div className="dashboard-modal">
              <h2 className="dashboard-modal-header">Edit Profile</h2>

              <div className="dashboard-image-upload-area">
                <img
                  src={imagePreview || profileImageURL}
                  alt="Profile preview"
                  className="dashboard-preview-image"
                  onError={(e) => {
                    e.target.src = '/default-profile.png';
                  }}
                />
                <label className="dashboard-upload-btn">
                  <Upload size={16} />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    disabled={isLoading}
                  />
                  {editForm.profileImage ? 'Change Image' : 'Upload New Image'}
                </label>
                <p className="dashboard-upload-hint">Maximum 5MB • JPG, PNG, GIF</p>
              </div>

              <div className="dashboard-form-group">
                <label className="dashboard-form-label">Full Name *</label>
                <input
                  type="text"
                  className="dashboard-form-input"
                  value={editForm.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter your full name"
                  disabled={isLoading}
                  maxLength="50"
                  required
                />
              </div>

              <div className="dashboard-form-group">
                <label className="dashboard-form-label">Email Address *</label>
                <input
                  type="email"
                  className="dashboard-form-input"
                  value={editForm.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="Enter your email address"
                  disabled={isLoading}
                  maxLength="100"
                  required
                />
              </div>

              <div className="dashboard-form-group">
                <label className="dashboard-form-label">Old Password</label>
                <input
                  type="password"
                  className="dashboard-form-input"
                  value={editForm.oldPassword}
                  onChange={(e) => handleInputChange('oldPassword', e.target.value)}
                  placeholder="Enter current password"
                  disabled={isLoading}
                />
              </div>

              <div className="dashboard-form-group">
                <label className="dashboard-form-label">New Password</label>
                <input
                  type="password"
                  className="dashboard-form-input"
                  value={editForm.newPassword}
                  onChange={(e) => handleInputChange('newPassword', e.target.value)}
                  placeholder="Enter new password"
                  disabled={isLoading}
                  minLength="6"
                  maxLength="50"
                />
                <p className="dashboard-form-hint">Minimum 6 characters • Leave empty to keep current</p>
              </div>

              <div className="dashboard-form-group">
                <label className="dashboard-form-label">Confirm New Password</label>
                <input
                  type="password"
                  className="dashboard-form-input"
                  value={editForm.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  placeholder="Confirm new password"
                  disabled={isLoading}
                />
              </div>

              <div className="dashboard-form-group">
                <label className="dashboard-form-label">Assigned Location</label>
                <input
                  type="text"
                  className="dashboard-form-input"
                  value={`${manager.assignedLocation?.name || 'N/A'} — ${manager.assignedLocation?.city || ''}`}
                  disabled
                  readOnly
                />
                <p className="dashboard-form-hint">Contact admin to change location assignment</p>
              </div>

              <div className="dashboard-modal-actions">
                <button
                  className="dashboard-modal-btn dashboard-modal-btn-cancel"
                  onClick={handleEditToggle}
                  disabled={isLoading}
                >
                  <X size={16} />
                  Cancel
                </button>
                <button
                  className="dashboard-modal-btn dashboard-modal-btn-save"
                  onClick={handleSave}
                  disabled={isLoading}
                >
                  <Save size={16} />
                  {isLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Toast Container */}
      <CustomToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
};

export default ManagerDashboard;