import React, { useState, useEffect } from 'react';
import { X, Upload, Image as ImageIcon } from 'lucide-react';
import '../../styles/EditDriverModal.css';

const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

const EditDriverModal = ({ driver, onClose, onUpdated }) => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    licenseNumber: '',
    status: '',
    ...driver,
  });
  const [imageFile, setImageFile] = useState(null);
  const [licenseFile, setLicenseFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setFormData({
      name: '',
      phone: '',
      licenseNumber: '',
      status: '',
      ...driver,
    });
  }, [driver]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLicenseFileChange = (e) => {
    setLicenseFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const data = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      if (value) data.append(key, value);
    });
    if (imageFile) data.append('image', imageFile);
    if (licenseFile) data.append('licenseFile', licenseFile);

    try {
      const response = await fetch(`${backendUrl}/api/drivers/${driver._id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: data,
      });

      if (!response.ok) {
        throw new Error('Failed to update driver');
      }

      onUpdated();
      onClose();
      alert('Driver updated successfully!');
    } catch (err) {
      console.error('Error updating driver:', err.message);
      alert('Failed to update driver');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-container">
        <div className="modal-header">
          <h2>Edit Driver Details</h2>
          <button className="close-btn" onClick={onClose} type="button">
            <X size={24} />
          </button>
        </div>

        <div className="modal-body">
          <div className="image-section">
            <div className="current-image">
              <p className="image-label">Current Photo</p>
              <img
                src={imagePreview || `${backendUrl}/${driver.image}`}
                alt={driver.name}
                className="driver-image"
                onError={(e) => { 
                  e.target.src = '/api/placeholder/120/120'; 
                }}
              />
            </div>

            <div className="upload-section">
              <label className="upload-label">
                <input
                  type="file"
                  onChange={handleImageChange}
                  accept="image/*"
                  style={{ display: 'none' }}
                />
                <div className="upload-button">
                  <ImageIcon size={20} />
                  <span>Upload New Photo</span>
                </div>
              </label>
              <p className="upload-hint">JPG, PNG or GIF (Max 5MB)</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="driver-form">
            <div className="form-row">
              <div className="form-group">
                <label>Driver Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name || ''}
                  onChange={handleChange}
                  placeholder="Enter driver name"
                  required
                />
              </div>

              <div className="form-group">
                <label>Phone Number *</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone || ''}
                  onChange={handleChange}
                  placeholder="Enter phone number"
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>License Number *</label>
                <input
                  type="text"
                  name="licenseNumber"
                  value={formData.licenseNumber || ''}
                  onChange={handleChange}
                  placeholder="Enter license number"
                  required
                />
              </div>

              <div className="form-group">
                <label>Status *</label>
                <select
                  name="status"
                  value={formData.status || ''}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Status</option>
                  <option value="Available">Available</option>
                  <option value="On Duty">On Duty</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div className="form-group full-width">
              <label>License Document</label>
              <label className="file-input-label">
                <input
                  type="file"
                  onChange={handleLicenseFileChange}
                  accept=".pdf,image/*"
                  style={{ display: 'none' }}
                />
                <div className="file-input-button">
                  <Upload size={18} />
                  <span>{licenseFile ? licenseFile.name : 'Choose license file'}</span>
                </div>
              </label>
              <p className="file-hint">PDF or image file (Max 10MB)</p>
            </div>

            <div className="form-actions">
              <button 
                type="button" 
                className="btn-cancel" 
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="btn-submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Updating...' : 'Update Driver'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditDriverModal;