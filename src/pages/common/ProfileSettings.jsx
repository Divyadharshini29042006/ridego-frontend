import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { FiPhone, FiMail, FiLogOut } from 'react-icons/fi';
import { FaUserCircle, FaLock } from 'react-icons/fa';
import '../../styles/ProfileSettings.css';

const ProfileSettings = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('profile');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showResetModal, setShowResetModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetchingProfile, setFetchingProfile] = useState(true);

  // Background images for slideshow
  const backgroundImages = [
    'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1920&h=400&fit=crop',
    'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=1920&h=400&fit=crop',
    'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1920&h=400&fit=crop'
  ];

  // Profile form state
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    gender: '',
    dateOfBirth: '',
    nationality: '',
    cityOfResidence: '',
    state: '',
    phoneNumber: '',
    email: '',
    aadharNumber: '',
    drivingLicenseNumber: '',
    licensePdf: null
  });

  // Reset password form state
  const [resetPasswordData, setResetPasswordData] = useState({
    oldPassword: '',
    newPassword: ''
  });

  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Fetch user profile from backend on component mount
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user?.id) {
        console.log('⚠️ No user ID found, skipping profile fetch');
        setFetchingProfile(false);
        return;
      }

      try {
        setFetchingProfile(true);
        const token = localStorage.getItem('token');
        
        console.log('🔄 Fetching user profile for ID:', user.id);
        
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/users/profile/${user.id}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );

        console.log('✅ Profile fetched:', response.data);

        const userData = response.data.user;
        const nameParts = userData.name?.split(' ') || ['', ''];
        
        setProfileData({
          firstName: nameParts[0] || '',
          lastName: nameParts.slice(1).join(' ') || '',
          gender: userData.gender || '',
          dateOfBirth: userData.dateOfBirth 
            ? new Date(userData.dateOfBirth).toISOString().split('T')[0] 
            : '',
          nationality: userData.nationality || '',
          cityOfResidence: userData.cityOfResidence || '',
          state: userData.state || '',
          phoneNumber: userData.phone || '',
          email: userData.email || '',
          aadharNumber: userData.aadharNumber || '',
          drivingLicenseNumber: userData.drivingLicenseNumber || '',
          licensePdf: null
        });

        console.log('✅ Profile data populated');
      } catch (error) {
        console.error('❌ Error fetching profile:', error);
        if (error.response?.status === 404) {
          toast.error('User profile not found. Please login again.');
          logout();
          navigate('/login');
          return;
        }
        toast.error('Failed to load profile data');
      } finally {
        setFetchingProfile(false);
      }
    };

    fetchUserProfile();
  }, [user?.id]);

  // Background slideshow
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % backgroundImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Calculate profile completion
  const calculateCompletion = () => {
    const fields = [
      profileData.firstName,
      profileData.lastName,
      profileData.gender,
      profileData.dateOfBirth,
      profileData.nationality,
      profileData.cityOfResidence,
      profileData.state,
      profileData.phoneNumber,
      profileData.aadharNumber
    ];
    const filledFields = fields.filter(field => field && field.trim() !== '').length;
    return Math.round((filledFields / fields.length) * 100);
  };

  // Get initials for avatar
  const getInitials = () => {
    if (!profileData.firstName && !profileData.lastName) return 'U';
    return `${profileData.firstName[0] || ''}${profileData.lastName[0] || ''}`
      .toUpperCase()
      .slice(0, 2);
  };

  // Handle profile form changes
  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
  };

  // Handle file upload
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'application/pdf') {
      setProfileData(prev => ({ ...prev, licensePdf: file }));
    } else {
      toast.error('Please upload a PDF file');
    }
  };

  // Validate Aadhar number
  const validateAadhar = (aadhar) => {
    return /^\d{12}$/.test(aadhar);
  };

  // Validate phone number
  const validatePhone = (phone) => {
    return /^\d{10}$/.test(phone);
  };

  // Validate email
  const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  // Save profile
  const handleSaveProfile = async () => {
    // Validation
    if (!profileData.firstName.trim()) {
      toast.error('First name is required');
      return;
    }

    if (profileData.phoneNumber && !validatePhone(profileData.phoneNumber)) {
      toast.error('Phone number must be exactly 10 digits');
      return;
    }

    if (profileData.email && !validateEmail(profileData.email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    if (profileData.aadharNumber && !validateAadhar(profileData.aadharNumber)) {
      toast.error('Aadhar number must be exactly 12 digits');
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      
      // Combine first and last name
      formData.append('name', `${profileData.firstName} ${profileData.lastName}`.trim());
      formData.append('gender', profileData.gender);
      formData.append('dateOfBirth', profileData.dateOfBirth);
      formData.append('nationality', profileData.nationality);
      formData.append('cityOfResidence', profileData.cityOfResidence);
      formData.append('state', profileData.state);
      formData.append('phoneNumber', profileData.phoneNumber);
      formData.append('email', profileData.email);
      formData.append('aadharNumber', profileData.aadharNumber);
      formData.append('drivingLicenseNumber', profileData.drivingLicenseNumber);
      
      if (profileData.licensePdf) {
        formData.append('licensePdf', profileData.licensePdf);
      }

      const token = localStorage.getItem('token');
      const response = await axios.put(
        `${import.meta.env.VITE_API_URL}/users/update/${user.id}`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      toast.success('Profile updated successfully!');
      
      // Update localStorage with new user data
      if (response.data.user) {
        const updatedUserData = {
          id: user.id,
          name: response.data.user.name,
          email: response.data.user.email,
          role: user.role,
          assignedLocation: user.assignedLocation
        };
        localStorage.setItem('userData', JSON.stringify(updatedUserData));
        
        // Clear the file input
        setProfileData(prev => ({ ...prev, licensePdf: null }));
      }
    } catch (error) {
      console.error('Update error:', error);
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  // Handle reset password
  const handleResetPassword = async (e) => {
    e.preventDefault();

    if (!resetPasswordData.oldPassword || !resetPasswordData.newPassword) {
      toast.error('Please fill in all fields');
      return;
    }

    if (resetPasswordData.newPassword.length < 8) {
      toast.error('New password must be at least 8 characters long');
      return;
    }

    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])/.test(resetPasswordData.newPassword)) {
      toast.error('Password must include uppercase, lowercase, number, and special character');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      await axios.post(
        `${import.meta.env.VITE_API_URL}/users/change-password`,
        {
          oldPassword: resetPasswordData.oldPassword,
          newPassword: resetPasswordData.newPassword,
          userId: user.id
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      toast.success('Password changed successfully!');
      setShowResetModal(false);
      setResetPasswordData({ oldPassword: '', newPassword: '' });
    } catch (error) {
      console.error('Password reset error:', error);
      toast.error(error.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  // Handle logout
  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully!');
    navigate('/login');
  };

  const completion = calculateCompletion();

  // Show loading state while fetching profile
  if (fetchingProfile) {
    return (
      <div className="profile-settings" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <i className="fas fa-spinner fa-spin" style={{ fontSize: '3rem', color: '#000000' }}></i>
          <p style={{ marginTop: '1rem', fontSize: '1.1rem' }}>Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-settings">
      {/* Fixed Hero Section with Slideshow */}
      <div className="profile-hero">
        {backgroundImages.map((img, idx) => (
          <div
            key={idx}
            className={`hero-slide ${idx === currentImageIndex ? 'active' : ''}`}
            style={{ backgroundImage: `url(${img})` }}
          />
        ))}
        <div className="hero-overlay">
          <div className="hero-content">
            <div className="user-avatar">
              {getInitials()}
            </div>
            <div className="user-info">
              <div className="contact-item">
                <FiPhone className="contact-icon" />
                <span>{profileData.phoneNumber || 'Not provided'}</span>
              </div>
              <div className="contact-item">
                <FiMail className="contact-icon" />
                <span>{profileData.email || user?.email || 'Not provided'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable Content Area */}
      <div className="profile-content-wrapper">
        <div className="profile-container">
          {/* Sidebar */}
          <aside className="profile-sidebar">
            <h3>MY ACCOUNT</h3>
            <ul className="sidebar-menu">
              <li className={activeSection === 'profile' ? 'active' : ''} onClick={() => setActiveSection('profile')}>
                <FaUserCircle className="sidebar-icon" />
                <span>My Profile</span>
                {completion < 100 && <span className="indicator"></span>}
              </li>
              <li onClick={() => setShowResetModal(true)}>
                <FaLock className="sidebar-icon" />
                <span>Reset Password</span>
              </li>
              <li onClick={handleLogout}>
                <FiLogOut className="sidebar-icon" />
                <span>Logout</span>
              </li>
            </ul>
          </aside>

          {/* Main Section */}
          <main className="profile-main">
            <div className="profile-header">
              <h2>My Profile</h2>
              <button className="btn-save" onClick={handleSaveProfile} disabled={loading}>
                {loading ? 'SAVING...' : 'SAVE'}
              </button>
            </div>

            {/* Completion Alert */}
            {completion < 100 && (
              <div className="completion-alert">
                <div className="completion-icon">{completion}%</div>
                <div className="completion-text">
                  <strong>Complete your profile</strong>
                  <p>Please fill in your details to help us personalize your experience</p>
                </div>
                <div className="completion-progress">
                  <div className="progress-bar" style={{ width: `${completion}%` }}></div>
                </div>
              </div>
            )}

            {/* General Information */}
            <section className="profile-section">
              <h3>General Information</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label>FIRST & MIDDLE NAME</label>
                  <input
                    type="text"
                    name="firstName"
                    value={profileData.firstName}
                    onChange={handleProfileChange}
                    placeholder="Enter first name"
                  />
                </div>
                <div className="form-group">
                  <label>LAST NAME</label>
                  <input
                    type="text"
                    name="lastName"
                    value={profileData.lastName}
                    onChange={handleProfileChange}
                    placeholder="Enter last name"
                  />
                </div>
                <div className="form-group">
                  <label>GENDER</label>
                  <select name="gender" value={profileData.gender} onChange={handleProfileChange}>
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>DATE OF BIRTH</label>
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={profileData.dateOfBirth}
                    onChange={handleProfileChange}
                  />
                </div>
                <div className="form-group">
                  <label>NATIONALITY</label>
                  <input
                    type="text"
                    name="nationality"
                    value={profileData.nationality}
                    onChange={handleProfileChange}
                    placeholder="Enter nationality"
                  />
                </div>
                <div className="form-group">
                  <label>CITY OF RESIDENCE</label>
                  <input
                    type="text"
                    name="cityOfResidence"
                    value={profileData.cityOfResidence}
                    onChange={handleProfileChange}
                    placeholder="Enter city"
                  />
                </div>
                <div className="form-group">
                  <label>STATE</label>
                  <input
                    type="text"
                    name="state"
                    value={profileData.state}
                    onChange={handleProfileChange}
                    placeholder="Enter state"
                  />
                </div>
              </div>
            </section>

            {/* Contact Details */}
            <section className="profile-section">
              <h3>Contact Details</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label>PHONE NUMBER</label>
                  <input
                    type="tel"
                    name="phoneNumber"
                    value={profileData.phoneNumber}
                    onChange={handleProfileChange}
                    placeholder="Enter 10-digit phone number"
                    maxLength="10"
                  />
                </div>
                <div className="form-group">
                  <label>EMAIL ADDRESS</label>
                  <input
                    type="email"
                    name="email"
                    value={profileData.email}
                    onChange={handleProfileChange}
                    placeholder="Enter email address"
                  />
                  <small style={{ color: '#6b7280', fontSize: '0.85rem', marginTop: '0.25rem', display: 'block' }}>
                    {user?.email && profileData.email === user.email ? 
                      '(Account email)' : 
                      'You can update your contact email here'}
                  </small>
                </div>
              </div>
            </section>

            {/* Documents Details */}
            <section className="profile-section">
              <h3>Documents Details</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label>AADHAR NUMBER *</label>
                  <input
                    type="text"
                    name="aadharNumber"
                    value={profileData.aadharNumber}
                    onChange={handleProfileChange}
                    placeholder="Enter 12-digit Aadhar number"
                    maxLength="12"
                  />
                </div>
                <div className="form-group">
                  <label>DRIVING LICENSE NUMBER</label>
                  <input
                    type="text"
                    name="drivingLicenseNumber"
                    value={profileData.drivingLicenseNumber}
                    onChange={handleProfileChange}
                    placeholder="Enter license number"
                  />
                </div>
                <div className="form-group full-width">
                  <label>UPLOAD LICENSE PDF</label>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleFileChange}
                  />
                  {profileData.licensePdf && (
                    <span className="file-name">{profileData.licensePdf.name}</span>
                  )}
                </div>
              </div>
            </section>
          </main>
        </div>
      </div>

      {/* Reset Password Modal */}
      {showResetModal && (
        <div className="modal-overlay" onClick={() => setShowResetModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowResetModal(false)}>
              ✕
            </button>
            <div className="modal-header">
              <h2>Reset Password</h2>
            </div>
            <p className="modal-description">
              Your password must be at least 8 characters long and include both small and uppercase letters, numbers, and special characters (e.g., $!@%)
            </p>
            <form onSubmit={handleResetPassword}>
              <div className="password-input">
                <label>OLD PASSWORD</label>
                <input
                  type={showOldPassword ? 'text' : 'password'}
                  value={resetPasswordData.oldPassword}
                  onChange={(e) => setResetPasswordData(prev => ({ ...prev, oldPassword: e.target.value }))}
                  placeholder="Enter old password"
                />
                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => setShowOldPassword(!showOldPassword)}
                >
                  <i className={`fas ${showOldPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                </button>
              </div>
              <div className="password-input">
                <label>NEW PASSWORD</label>
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={resetPasswordData.newPassword}
                  onChange={(e) => setResetPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                  placeholder="Enter new password"
                />
                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  <i className={`fas ${showNewPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                </button>
              </div>
              <div className="forgot-link">
                <a href="/forgot-password">Forgot your password?</a>
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setShowResetModal(false)}
                >
                  CANCEL
                </button>
                <button type="submit" className="btn-reset" disabled={loading}>
                  {loading ? 'RESETTING...' : 'RESET PASSWORD'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileSettings;