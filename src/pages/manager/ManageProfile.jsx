import React, { useEffect, useState } from 'react';
import axios from 'axios';
import '../../styles/ManagerProfile.css';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ManagerSidebar from '../../components/Sidebar/ManagerSidebar';

const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

const ManagerProfile = () => {
  const [manager, setManager] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
  });
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [previewSource, setPreviewSource] = useState('server'); // 'server' or 'local'
  const [loading, setLoading] = useState(true);
  const [showPasswordField, setShowPasswordField] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);

  useEffect(() => {
    fetchProfile();
    return () => {
      if (previewSource === 'local' && preview.startsWith('blob:')) {
        URL.revokeObjectURL(preview);
      }
    };
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await axios.get('/api/managers/profile', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });

      // ✅ ACCESS NESTED manager OBJECT
      const managerData = res.data.manager;

      setManager(managerData);
      setFormData({
        name: managerData.name,
        email: managerData.email,
        phone: managerData.phone || '',
        password: '',
      });

      if (previewSource !== 'local') {
        const imageUrl = managerData.profileImage
          ? `${backendUrl}/uploads/managers/${encodeURIComponent(managerData.profileImage)}`
          : '/default-profile.png';
        setPreview(imageUrl);
        setPreviewSource('server');
      }

      setLoading(false);
    } catch (err) {
      console.error('Error fetching profile:', err);
      toast.error('Failed to load profile');
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (previewSource === 'local' && preview.startsWith('blob:')) {
      URL.revokeObjectURL(preview);
    }

    setImageFile(file);
    setPreview(URL.createObjectURL(file));
    setPreviewSource('local');
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    const payload = { ...formData };
    if (!showPasswordField || !formData.password.trim()) {
      delete payload.password;
    }

    try {
      await axios.put('/api/managers/profile', payload, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      toast.success('Profile updated successfully');
      fetchProfile();
    } catch (err) {
      console.error('Error updating profile:', err);
      toast.error('Update failed');
    }
  };

  const handleImageUpload = async () => {
    if (!imageFile) return;
    const data = new FormData();
    data.append('profileImage', imageFile);

    try {
      await axios.put('/api/managers/profile/image', data, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      toast.success('Image updated successfully');
      setImageFile(null);
      setPreviewSource('server');
      fetchProfile();
    } catch (err) {
      console.error('Error uploading image:', err);
      toast.error('Image upload failed');
    }
  };

  const handleImageError = (e) => {
    if (!e.target.src.includes('default-profile.png')) {
      e.target.onerror = null;
      e.target.src = '/default-profile.png';
    }
  };

  if (loading) return <p>Loading profile...</p>;

  if (!manager) return <p>Loading profile...</p>;

  return (
    <div className="manager-layout">
      <ManagerSidebar />
      <div className="manager-content">
        <div className="manager-profile">
          <h2>Welcome back, {manager.name} 👋</h2>

          <div className="profile-card">
            <img
              src={preview || '/default-profile.png'}
              alt="Profile"
              className="profile-image"
              onError={handleImageError}
            />
            <input type="file" onChange={handleImageChange} />
            <button onClick={handleImageUpload} disabled={!imageFile}>
              Update Image
            </button>
          </div>

          <button onClick={() => setShowEditForm(!showEditForm)}>
            {showEditForm ? 'Cancel' : 'Edit Profile'}
          </button>

          {showEditForm && (
            <form onSubmit={handleUpdate} className="edit-form">
              <label htmlFor="name">Name:</label>
              <input id="name" name="name" value={formData.name} onChange={handleChange} />

              <label htmlFor="email">Email:</label>
              <input id="email" name="email" value={formData.email} onChange={handleChange} />

              <label htmlFor="phone">Phone:</label>
              <input id="phone" name="phone" value={formData.phone} onChange={handleChange} />

              <label>
                <input
                  type="checkbox"
                  checked={showPasswordField}
                  onChange={() => setShowPasswordField(!showPasswordField)}
                />
                Change Password
              </label>

              {showPasswordField && (
                <>
                  <label htmlFor="password">New Password:</label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter new password"
                  />
                </>
              )}

              <button type="submit">Update Profile</button>
            </form>
          )}

          <div className="location-info">
            <h4>📍 Assigned Location</h4>
            <p>
              {manager.assignedLocation?.name || 'N/A'} —{' '}
              {manager.assignedLocation?.city || ''}
            </p>
          </div>

          <div className="account-meta">
            <p>
              <strong>🗓️ Account Created:</strong>{' '}
              {(() => {
                const date = new Date(manager.createdAt);
                return isNaN(date.getTime())
                  ? 'Date not available'
                  : date.toLocaleDateString('en-IN', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    });
              })()}
            </p>
          </div>

          <ToastContainer position="bottom-right" autoClose={3000} />
        </div>
      </div>
    </div>
  );
};

export default ManagerProfile;