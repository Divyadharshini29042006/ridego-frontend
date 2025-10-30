import React, { useState, useEffect } from 'react';
import { 
  FaSearch, 
  FaPlus, 
  FaEdit, 
  FaTrash, 
  FaPhone, 
  FaMapMarkerAlt, 
  FaEye,
  FaChevronLeft,
  FaChevronRight,
  FaUsers,
  FaCheckCircle,
  FaExclamationCircle,
  FaTimes,
  FaUser,
  FaFileAlt,
  FaUpload,
  FaImage,
  FaSpinner
} from 'react-icons/fa';
import styles from '../../styles/MDriver.module.css';


const MDriver = () => {
  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
  
  const [view, setView] = useState('list'); // 'list', 'add', 'edit'
  const [drivers, setDrivers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  
  // Add driver form state
  const [addFormData, setAddFormData] = useState({
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
  const [addImage, setAddImage] = useState(null);
  const [addLicenseFile, setAddLicenseFile] = useState(null);
  const [addImagePreview, setAddImagePreview] = useState(null);
  
  // Edit driver form state
  const [editFormData, setEditFormData] = useState({
    name: '',
    phone: '',
    licenseNumber: '',
    status: '',
  });
  const [editImage, setEditImage] = useState(null);
  const [editLicenseFile, setEditLicenseFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch drivers
  const fetchDrivers = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${backendUrl}/api/managers/drivers?page=${page}`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch drivers');
      }
      
      const data = await response.json();
      setDrivers(data.drivers || []);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      console.error('Error fetching drivers:', err.message);
      showNotification('Failed to load drivers', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch manager location for add form
  useEffect(() => {
    const fetchManagerLocation = async () => {
      try {
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
        setAddFormData((prev) => ({ ...prev, location: location._id }));
        setLocationDetails(location);

        if (location && location.city) {
          const subLocResponse = await fetch(`${backendUrl}/api/managers/locations?city=${location.city}`, {
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
        console.error('Error fetching manager location:', err.message);
        showNotification('Failed to fetch location details', 'error');
      }
    };
    fetchManagerLocation();
  }, [backendUrl]);

  useEffect(() => {
    if (view === 'list') {
      fetchDrivers();
    }
  }, [page, view]);

  const filteredDrivers = drivers.filter((d) =>
    d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.phone.includes(searchTerm) ||
    d.licenseNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const showNotification = (message, type) => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 3000);
  };

  // Add driver handlers
  const handleAddFormChange = (e) => {
    const { name, value } = e.target;
    setAddFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAddImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAddImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddLicenseChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAddLicenseFile(file);
    }
  };

  const validateAddForm = () => {
    if (!addFormData.name.trim()) {
      showNotification('Driver name is required', 'error');
      return false;
    }
    if (!addFormData.email.trim()) {
      showNotification('Email is required', 'error');
      return false;
    }
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(addFormData.email)) {
      showNotification('Please enter a valid email', 'error');
      return false;
    }
    if (!addFormData.phone.trim()) {
      showNotification('Phone number is required', 'error');
      return false;
    }
    // Phone validation (10 digits)
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(addFormData.phone.replace(/\D/g, ''))) {
      showNotification('Phone number must be 10 digits', 'error');
      return false;
    }
    if (addFormData.licenseNumber.length !== 16) {
      showNotification('License number must be exactly 16 characters', 'error');
      return false;
    }
    return true;
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateAddForm()) return;

    setIsSubmitting(true);
    
    const data = new FormData();
    data.append('name', addFormData.name);
    data.append('email', addFormData.email);
    data.append('phone', addFormData.phone);
    data.append('gender', addFormData.gender);
    data.append('licenseNumber', addFormData.licenseNumber);
    data.append('subLocation', addFormData.subLocation);
    if (addImage) data.append('image', addImage);
    if (addLicenseFile) data.append('licenseFile', addLicenseFile);

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
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to add driver');
      }

      showNotification('Driver added successfully', 'success');
      
      // Reset form
      setAddFormData({ 
        name: '', 
        email: '',
        phone: '', 
        gender: 'Male',
        licenseNumber: '', 
        subLocation: 'Main Location',
        location: addFormData.location 
      });
      setAddImage(null);
      setAddLicenseFile(null);
      setAddImagePreview(null);
      
      setView('list');
      setPage(1);
      fetchDrivers();
      
    } catch (err) {
      console.error('Error adding driver:', err.message);
      showNotification(err.message || 'Failed to add driver', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Edit driver handlers
  const handleEdit = (driver) => {
    setSelectedDriver(driver);
    setEditFormData({
      name: driver.name,
      phone: driver.phone,
      licenseNumber: driver.licenseNumber,
      status: driver.status,
    });
    setImagePreview(null);
    setEditImage(null);
    setEditLicenseFile(null);
    setView('edit');
  };

  const handleEditFormChange = (e) => {
    setEditFormData({ ...editFormData, [e.target.name]: e.target.value });
  };

  const handleEditImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setEditImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEditLicenseChange = (e) => {
    setEditLicenseFile(e.target.files[0]);
  };

  const validateEditForm = () => {
    if (!editFormData.name.trim()) {
      showNotification('Driver name is required', 'error');
      return false;
    }
    if (!editFormData.phone.trim()) {
      showNotification('Phone number is required', 'error');
      return false;
    }
    if (!editFormData.licenseNumber.trim()) {
      showNotification('License number is required', 'error');
      return false;
    }
    if (!editFormData.status) {
      showNotification('Status is required', 'error');
      return false;
    }
    return true;
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateEditForm()) return;
    
    setIsSubmitting(true);
    
    const data = new FormData();
    Object.entries(editFormData).forEach(([key, value]) => {
      if (value) data.append(key, value);
    });
    if (editImage) data.append('image', editImage);
    if (editLicenseFile) data.append('licenseFile', editLicenseFile);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${backendUrl}/api/drivers/${selectedDriver._id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: data,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update driver');
      }

      showNotification('Driver updated successfully', 'success');
      setView('list');
      fetchDrivers();
    } catch (err) {
      console.error('Error updating driver:', err.message);
      showNotification(err.message || 'Failed to update driver', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (driverId) => {
    if (window.confirm('Are you sure you want to delete this driver? This action cannot be undone.')) {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${backendUrl}/api/drivers/${driverId}`, {
          method: 'DELETE',
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to delete driver');
        }

        showNotification('Driver deleted successfully', 'success');
        fetchDrivers();
      } catch (err) {
        console.error('Error deleting driver:', err.message);
        showNotification(err.message || 'Failed to delete driver', 'error');
      }
    }
  };

  const handleCancelEdit = () => {
    setView('list');
    setSelectedDriver(null);
    setEditFormData({
      name: '',
      phone: '',
      licenseNumber: '',
      status: '',
    });
    setEditImage(null);
    setEditLicenseFile(null);
    setImagePreview(null);
  };

  const handleCancelAdd = () => {
    setView('list');
    setAddFormData({ 
      name: '', 
      email: '',
      phone: '', 
      gender: 'Male',
      licenseNumber: '', 
      subLocation: 'Main Location',
      location: addFormData.location 
    });
    setAddImage(null);
    setAddLicenseFile(null);
    setAddImagePreview(null);
  };

  return (
    <div className={styles.driverContainer}>
      {/* Header */}
      <div className={styles.pageHeader}>
        <div className={styles.headerLeft}>
          <h1>
            <FaUsers />
            Manage Drivers
          </h1>
          <p>Oversee and manage your fleet of drivers</p>
        </div>
        <div className={styles.viewTabs}>
          <button
            className={`${styles.tabBtn} ${view === 'list' ? styles.active : ''}`}
            onClick={() => setView('list')}
          >
            <FaUsers />
            Driver List
          </button>
          <button
            className={`${styles.tabBtn} ${view === 'add' ? styles.active : ''}`}
            onClick={() => setView('add')}
          >
            <FaPlus />
            Add Driver
          </button>
        </div>
      </div>

      {/* List View */}
      {view === 'list' && (
        <>
          <div className={styles.controlsSection}>
            <div className={styles.searchWrapper}>
              <FaSearch className={styles.searchIcon} size={16} />
              <input
                className={styles.searchInput}
                type="text"
                placeholder="Search by name, phone, or license number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {isLoading ? (
            <div className={styles.loadingContainer}>
              <div className={styles.loadingSpinner}></div>
              <p>Loading drivers...</p>
            </div>
          ) : filteredDrivers.length === 0 ? (
            <div className={styles.emptyState}>
              <FaUsers size={64} />
              <h3>No drivers found</h3>
              <p>
                {searchTerm
                  ? "No drivers match your search criteria."
                  : "You haven't added any drivers yet. Click 'Add Driver' to get started."
                }
              </p>
            </div>
          ) : (
            <div className={styles.driversGrid}>
              {filteredDrivers.map((driver) => (
                <div key={driver._id} className={styles.driverCard}>
                  <div className={styles.driverHeader}>
                    <img
                      src={driver.image ? `${backendUrl}/${driver.image}` : '/api/placeholder/80/80'}
                      alt={driver.name}
                      className={styles.driverAvatar}
                      onError={(e) => {
                        e.target.src = '/api/placeholder/80/80';
                      }}
                    />
                    <div className={styles.driverNameSection}>
                      <h3 className={styles.driverName}>{driver.name}</h3>
                      <p className={styles.driverLicenseText}>{driver.licenseNumber}</p>
                    </div>
                  </div>

                  <div className={styles.driverInfo}>
                    <div className={styles.infoItem}>
                      <FaPhone size={14} />
                      <span>{driver.phone}</span>
                    </div>

                    <div className={styles.infoItem}>
                      <FaMapMarkerAlt size={14} />
                      <span>
                        {driver.location?.name || 'N/A'}, {driver.location?.city || 'N/A'}
                      </span>
                    </div>

                    <div className={styles.infoItem}>
                      {driver.status === 'Active' || driver.status === 'Available' ? (
                        <FaCheckCircle size={14} />
                      ) : (
                        <FaExclamationCircle size={14} />
                      )}
                      <span className={`${styles.status} ${styles[`status${driver.status?.toLowerCase().replace(' ', '')}`]}`}>
                        {driver.status || 'N/A'}
                      </span>
                    </div>
                  </div>

                  {driver.licenseFile && (
                    <a
                      href={`${backendUrl}/${driver.licenseFile}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.licenseLink}
                    >
                      <FaEye size={14} />
                      <span>View License</span>
                    </a>
                  )}

                  <div className={styles.driverActions}>
                    <button
                      className={styles.actionBtn}
                      onClick={() => handleEdit(driver)}
                    >
                      <FaEdit size={14} />
                      Edit
                    </button>

                    <button
                      className={styles.actionBtn}
                      onClick={() => handleDelete(driver._id)}
                    >
                      <FaTrash size={14} />
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className={styles.pagination}>
              <button
                className={styles.paginationNav}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <FaChevronLeft size={14} />
              </button>

              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i + 1)}
                  className={`${styles.paginationBtn} ${page === i + 1 ? styles.active : ''}`}
                >
                  {i + 1}
                </button>
              ))}

              <button
                className={styles.paginationNav}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                <FaChevronRight size={14} />
              </button>
            </div>
          )}
        </>
      )}

      {/* Add Driver View */}
      {view === 'add' && (
        <div className={styles.formContainer}>
          <div className={styles.formHeader}>
            <h2>Add New Driver</h2>
            <p>Register a new driver to your location</p>
          </div>

          <form onSubmit={handleAddSubmit}>
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>
                  <FaUser size={14} />
                  Driver Name
                </label>
                <input
                  type="text"
                  name="name"
                  className={styles.formInput}
                  placeholder="Enter driver's full name"
                  value={addFormData.name}
                  onChange={handleAddFormChange}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>
                  <FaPhone size={14} />
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phone"
                  className={styles.formInput}
                  placeholder="Enter phone number"
                  value={addFormData.phone}
                  onChange={handleAddFormChange}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>
                  <FaFileAlt size={14} />
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  className={styles.formInput}
                  placeholder="Enter driver's email"
                  value={addFormData.email}
                  onChange={handleAddFormChange}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>
                  <FaUser size={14} />
                  Gender
                </label>
                <select
                  name="gender"
                  className={`${styles.formInput} ${styles.formSelect}`}
                  value={addFormData.gender}
                  onChange={handleAddFormChange}
                  required
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>

              <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                <label className={styles.formLabel}>
                  <FaFileAlt size={14} />
                  License Number (16 characters)
                </label>
                <input
                  type="text"
                  name="licenseNumber"
                  className={styles.formInput}
                  placeholder="Enter 16-character license number"
                  value={addFormData.licenseNumber}
                  onChange={handleAddFormChange}
                  maxLength={16}
                  required
                />
              </div>

              {locationDetails && (
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>
                    <FaMapMarkerAlt size={14} />
                    Sub Location
                  </label>
                  <select
                    name="subLocation"
                    className={`${styles.formInput} ${styles.formSelect}`}
                    value={addFormData.subLocation}
                    onChange={handleAddFormChange}
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
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>
                    <FaMapMarkerAlt size={14} />
                    Assigned City
                  </label>
                  <div className={styles.locationDisplay}>
                    <FaMapMarkerAlt size={14} />
                    <span>{locationDetails.city}</span>
                  </div>
                </div>
              )}

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>
                  <FaImage size={14} />
                  Profile Image
                </label>
                <div className={styles.fileInputWrapper}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAddImageChange}
                  />
                  <div className={`${styles.fileInputButton} ${addImage ? styles.hasFile : ''}`}>
                    <FaUpload size={16} />
                    <span>{addImage ? addImage.name : 'Choose profile image'}</span>
                  </div>
                </div>
                {addImagePreview && (
                  <img
                    src={addImagePreview}
                    alt="Preview"
                    style={{ marginTop: '10px', maxWidth: '150px', borderRadius: '8px' }}
                  />
                )}
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>
                  <FaFileAlt size={14} />
                  License Document
                </label>
                <div className={styles.fileInputWrapper}>
                  <input
                    type="file"
                    accept=".pdf,image/*"
                    onChange={handleAddLicenseChange}
                  />
                  <div className={`${styles.fileInputButton} ${addLicenseFile ? styles.hasFile : ''}`}>
                    <FaFileAlt size={16} />
                    <span>{addLicenseFile ? addLicenseFile.name : 'Choose license document'}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.formActions}>
              <button
                type="button"
                className={`${styles.btn} ${styles.btnSecondary}`}
                onClick={handleCancelAdd}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={`${styles.btn} ${styles.btnPrimary}`}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <FaSpinner className={styles.loadingSpinner} />
                    Adding...
                  </>
                ) : (
                  <>
                    <FaPlus />
                    Add Driver
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edit Driver View */}
      {view === 'edit' && selectedDriver && (
        <div className={styles.formContainer}>
          <div className={styles.formHeader}>
            <h2>Edit Driver Details</h2>
            <p>Update driver information</p>
          </div>

          <div className={styles.imageSection}>
            <div className={styles.currentImage}>
              <p className={styles.imageLabel}>Current Photo</p>
              <img
                src={imagePreview || (selectedDriver.image ? `${backendUrl}/${selectedDriver.image}` : '/api/placeholder/140/140')}
                alt={selectedDriver.name}
                className={styles.driverImage}
                onError={(e) => {
                  e.target.src = '/api/placeholder/140/140';
                }}
              />
            </div>

            <div className={styles.uploadSection}>
              <label>
                <input
                  type="file"
                  onChange={handleEditImageChange}
                  accept="image/*"
                  style={{ display: 'none' }}
                />
                <div className={styles.uploadButton}>
                  <FaImage size={16} />
                  <span>Upload New Photo</span>
                </div>
              </label>
              <p className={styles.uploadHint}>JPG, PNG or GIF (Max 5MB)</p>
            </div>
          </div>

          <form onSubmit={handleEditSubmit}>
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Driver Name</label>
                <input
                  type="text"
                  name="name"
                  className={styles.formInput}
                  value={editFormData.name}
                  onChange={handleEditFormChange}
                  placeholder="Enter driver name"
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Phone Number</label>
                <input
                  type="tel"
                  name="phone"
                  className={styles.formInput}
                  value={editFormData.phone}
                  onChange={handleEditFormChange}
                  placeholder="Enter phone number"
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>License Number</label>
                <input
                  type="text"
                  name="licenseNumber"
                  className={styles.formInput}
                  value={editFormData.licenseNumber}
                  onChange={handleEditFormChange}
                  placeholder="Enter license number"
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Status</label>
                <select
                  name="status"
                  className={`${styles.formInput} ${styles.formSelect}`}
                  value={editFormData.status}
                  onChange={handleEditFormChange}
                  required
                >
                  <option value="">Select Status</option>
                  <option value="Available">Available</option>
                  <option value="On Duty">On Duty</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                <label className={styles.formLabel}>License Document</label>
                <div className={styles.fileInputWrapper}>
                  <input
                    type="file"
                    onChange={handleEditLicenseChange}
                    accept=".pdf,image/*"
                  />
                  <div className={`${styles.fileInputButton} ${editLicenseFile ? styles.hasFile : ''}`}>
                    <FaUpload size={16} />
                    <span>{editLicenseFile ? editLicenseFile.name : 'Choose license file'}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.formActions}>
              <button
                type="button"
                className={`${styles.btn} ${styles.btnSecondary}`}
                onClick={handleCancelEdit}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={`${styles.btn} ${styles.btnPrimary}`}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <FaSpinner className={styles.loadingSpinner} />
                    Updating...
                  </>
                ) : (
                  'Update Driver'
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Notification */}
      {notification && (
        <div className={`notification notification-${notification.type}`}>
          {notification.type === 'success' ? (
            <FaCheckCircle size={18} />
          ) : (
            <FaExclamationCircle size={18} />
          )}
          <span>{notification.message}</span>
          <button onClick={() => setNotification(null)}>
            <FaTimes size={14} />
          </button>
        </div>
      )}
    </div>
  );
};

export default MDriver;