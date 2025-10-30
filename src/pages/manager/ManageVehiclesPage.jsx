import React, { useState, useEffect } from 'react';
import { FaCar, FaPlus, FaList, FaUpload, FaEdit, FaTrash, FaExclamationCircle, FaTimes } from 'react-icons/fa';
import axios from 'axios';
import { toast } from 'react-toastify';
import vehicleAPI from '../../api/vehicleAPI';
import VehicleCard from '../../components/cards/VehicleCard';
import { getVehicleImageUrl, handleImageError } from '../../utils/imageUtils';
import styles from '../../styles/ManageVehiclesPage.module.css';

const ManageVehiclesPage = () => {

  const [activeTab, setActiveTab] = useState('list');

  const [formData, setFormData] = useState({
    vehicleModel: '',
    vehicleType: '',
    brand: '',
    color: '',
    modelYear: '',
    rentPerDay: '',
    rentPerHour: '',
    fuelType: '',
    seatingCapacity: '',
    transmission: '',
    mileage: '',
    vehicleNumber: '',
    depositAmount: '',
    subLocation: 'Main Location',
  });
  const [imageFile, setImageFile] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('All');
  const [filterSubLocation, setFilterSubLocation] = useState('All');
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [availableSubLocations, setAvailableSubLocations] = useState([]);
  const [error, setError] = useState(null);

  const [managerLocation, setManagerLocation] = useState(null);
  const [locationDetails, setLocationDetails] = useState(null);
  const [subLocations, setSubLocations] = useState([]);
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Add this helper function at the top of the component
  const formatLocationDisplay = (city, subLocation) => {
    if (!subLocation) return 'No location assigned';

    // Special handling for White Town and Auroville
    if (subLocation === 'White Town' || subLocation === 'Auroville') {
      return subLocation;
    }

    // If we have both city and sublocation, format them together
    if (city) {
      return `${city} - ${subLocation}`;
    }

    // Fallback to just sublocation
    return subLocation;
  };

  // Fetch manager location once on component mount
  useEffect(() => {
    fetchManagerLocation();
  }, []); // Empty dependency array - runs only once

  // Fetch vehicles when list tab is active
  useEffect(() => {
    if (activeTab === 'list') {
      fetchVehicles();
      // Set up polling to refresh vehicle status every 30 seconds
      const interval = setInterval(fetchVehicles, 30000);
      return () => clearInterval(interval);
    }
  }, [activeTab]);

  // Also refresh when page becomes visible (user navigates back)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && activeTab === 'list') {
        fetchVehicles();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [activeTab]);

  // Listen for vehicle updates from other manager pages (like booking completion)
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'lastVehicleUpdate' && activeTab === 'list') {
        fetchVehicles();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [activeTab]);

  const fetchVehicles = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const data = await vehicleAPI.getManagerVehicles(token);
      setVehicles(data);

      const subLocs = [...new Set(
        data
        
          .map(v => v.subLocation)
          .filter(loc => loc && loc.trim() !== '')
      )].sort();
      setAvailableSubLocations(subLocs);
    } catch (err) {
      setError("Failed to fetch vehicles. Please try again.");
      setVehicles([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchManagerLocation = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await axios.get('/api/managers/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('Manager Profile Response:', response.data);

      const manager = response.data?.manager;

      if (!manager) {
        throw new Error('Manager data not found in response');
      }

      if (!manager.assignedLocation) {
        throw new Error('No location assigned to this manager');
      }

      setManagerLocation(manager.assignedLocation);
      setLocationDetails(manager.assignedLocation);

      // Get manager's specific sublocation
      let assignedSubLocation;
      if (manager.subLocation) {
        // Use manager's directly assigned sublocation
        assignedSubLocation = manager.subLocation;
      } else if (manager.assignedLocation?.subCities?.length > 0) {
        // Fallback to first subCity from assigned location
        assignedSubLocation = manager.assignedLocation.subCities[0];
      } else {
        // No sublocation found, set default
        assignedSubLocation = 'Main Location';
      }

      // Set the sublocation
      setSubLocations([assignedSubLocation]);
      setFormData(prev => ({
        ...prev,
        subLocation: assignedSubLocation
      }));

      console.log('📍 Set manager sublocation:', assignedSubLocation);
      setLoading(false);

    } catch (error) {
      console.error('Error fetching manager location:', error);
      setError(error.message);
      setLoading(false);
      toast.error('Failed to load manager location. Please refresh the page.');
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    setImageFile(e.target.files[0]);
  };

  const handleAddVehicle = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormErrors({});

    const data = new FormData();

    // Validate required fields
    const requiredFields = [
      'vehicleModel', 'vehicleType', 'brand', 'color',
      'modelYear', 'rentPerDay', 'fuelType', 'seatingCapacity',
      'transmission', 'vehicleNumber', 'depositAmount', 'subLocation'
    ];

    const missingFields = requiredFields.filter(field => !formData[field] || formData[field].toString().trim() === '');
    if (missingFields.length > 0) {
      setFormErrors({ general: `Missing required fields: ${missingFields.join(', ')}` });
      toast.error(`Missing required fields: ${missingFields.join(', ')}`);
      setIsSubmitting(false);
      return;
    }

    Object.entries(formData).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        data.append(key, value);
      }
    });

    // Add manager's location ID
    if (managerLocation?._id) {
      data.append('locationId', managerLocation._id);
    } else {
      setFormErrors({ general: 'Manager location not found. Please refresh the page.' });
      toast.error('Manager location not found. Please refresh the page.');
      setIsSubmitting(false);
      return;
    }

    if (imageFile) {
      data.append('vehicleImage', imageFile);
    }

    try {
      const token = localStorage.getItem('token');
      await vehicleAPI.createVehicle(data, token);
      toast.success('Vehicle added successfully');
      setFormData({
        vehicleModel: '',
        vehicleType: '',
        brand: '',
        color: '',
        modelYear: '',
        rentPerDay: '',
        rentPerHour: '',
        fuelType: '',
        seatingCapacity: '',
        transmission: '',
        mileage: '',
        vehicleNumber: '',
        depositAmount: '',
        subLocation: subLocations[0] || 'Main Location'
      });
      setImageFile(null);
      const fileInputs = document.querySelectorAll('input[type="file"]');
      fileInputs.forEach(input => input.value = '');
      setActiveTab('list');
      fetchVehicles(); // Refresh the list after adding
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to add vehicle';
      setFormErrors({ general: errorMessage });
      toast.error(errorMessage);
      console.error('Add vehicle error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this vehicle?')) return;
    try {
      const token = localStorage.getItem('token');
      await vehicleAPI.deleteVehicle(id, token);
      setVehicles((prev) => prev.filter((v) => v._id !== id));
      toast.success('Vehicle deleted successfully');

      const subLocs = [...new Set(
        vehicles
          .filter(v => v._id !== id)
          .map(v => v.subLocation)
          .filter(loc => loc && loc.trim() !== '')
      )].sort();
      setAvailableSubLocations(subLocs);
    } catch (err) {
      toast.error('Failed to delete vehicle');
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      await vehicleAPI.updateVehicleStatus(id, newStatus, token);
      setVehicles((prev) =>
        prev.map((v) => (v._id === id ? { ...v, status: newStatus } : v))
      );
      toast.success(`Vehicle status updated to ${newStatus}`);
    } catch (err) {
      toast.error('Failed to update vehicle status');
    }
  };

  const handleEdit = async (vehicle) => {
    try {
      const res = await axios.get(`/api/managers/vehicles/${vehicle._id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setEditingVehicle(res.data.vehicle);
    } catch (err) {
      setEditingVehicle(vehicle);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    const data = new FormData();
    Object.entries(editingVehicle).forEach(([key, value]) => {
      if (value !== undefined && value !== null && key !== '_id' && key !== '__v') data.append(key, value);
    });
    if (imageFile) data.append('vehicleImage', imageFile);

    try {
      await axios.put(`/api/managers/vehicles/${editingVehicle._id}`, data, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      fetchVehicles();
      setEditingVehicle(null);
      setImageFile(null);
      toast.success('Vehicle updated successfully');
    } catch (err) {
      toast.error('Failed to update vehicle');
    }
  };

  const filteredVehicles = vehicles.filter((v) => {
    const typeMatch = filterType === 'All' || v.vehicleType?.toLowerCase() === filterType.toLowerCase();
    const subLocMatch = filterSubLocation === 'All' || v.subLocation === filterSubLocation;
    return typeMatch && subLocMatch;
  });

  const handleResetFilters = () => {
    setFilterType('All');
    setFilterSubLocation('All');
  };



  return (
    <div className={styles['manage-vehicles-page']}>
      {error ? (
        <div className={styles['error-message']}>
          <p>{error}</p>
          <button
            onClick={() => {
              setError(null);
              fetchManagerLocation();
            }}
            className={styles['retry-button']}
          >
            Retry Loading
          </button>
        </div>
      ) : (
        <>
          <div className={styles['page-header']}>
            <div className={styles['header-top']}>
              <div className={styles['header-title']}>
                <FaCar className={styles['title-icon']} />
                <h1>Manage Vehicles</h1>
              </div>
              <div className={styles['header-tabs']}>
                <button
                  className={`${styles['tab-btn']} ${activeTab === 'list' ? styles['active'] : ''}`}
                  onClick={() => setActiveTab('list')}
                >
                  <FaList />
                  <span>Vehicle List</span>
                </button>
                <button
                  className={`${styles['tab-btn']} ${activeTab === 'add' ? styles['active'] : ''}`}
                  onClick={() => setActiveTab('add')}
                >
                  <FaPlus />
                  <span>Add Vehicle</span>
                </button>
              </div>
            </div>
          </div>

          <div className={styles['page-content']}>
        {activeTab === 'add' && (
          <div className={styles['add-vehicle-section']}>
            <form onSubmit={handleAddVehicle} className={styles['vehicle-form']}>
              {formErrors.general && (
                <div className={styles['error-message']}>
                  <FaExclamationCircle />
                  {formErrors.general}
                </div>
              )}

              <div className={styles['form-grid']}>
                <div className={styles['form-field']}>
                  <label>Vehicle Model</label>
                  <input
                    name="vehicleModel"
                    value={formData.vehicleModel}
                    onChange={handleFormChange}
                    placeholder="Enter vehicle model"
                    required
                  />
                </div>

                <div className={styles['form-field']}>
                  <label>Vehicle Type</label>
                  <select
                    name="vehicleType"
                    value={formData.vehicleType}
                    onChange={handleFormChange}
                    required
                  >
                    <option value="">Select Vehicle Type</option>
                    <option value="Car">Car</option>
                    <option value="Bike">Bike</option>
                    <option value="SUV">SUV</option>
                    <option value="Van">Van</option>
                  </select>
                </div>

                <div className={styles['form-field']}>
                  <label>Brand</label>
                  <input
                    name="brand"
                    value={formData.brand}
                    onChange={handleFormChange}
                    placeholder="Enter brand name"
                    required
                  />
                </div>

                <div className={styles['form-field']}>
                  <label>Color</label>
                  <input
                    name="color"
                    value={formData.color}
                    onChange={handleFormChange}
                    placeholder="Enter color"
                    required
                  />
                </div>

                <div className={styles['form-field']}>
                  <label>Model Year</label>
                  <input
                    name="modelYear"
                    value={formData.modelYear}
                    onChange={handleFormChange}
                    placeholder="Enter model year"
                    type="number"
                    required
                  />
                </div>

                <div className={styles['form-field']}>
                  <label>Rent Per Day</label>
                  <input
                    name="rentPerDay"
                    value={formData.rentPerDay}
                    onChange={handleFormChange}
                    placeholder="Enter rent per day"
                    type="number"
                    required
                  />
                </div>

                <div className={styles['form-field']}>
                  <label>Rent Per Hour</label>
                  <input
                    name="rentPerHour"
                    value={formData.rentPerHour}
                    onChange={handleFormChange}
                    placeholder="Enter rent per hour"
                    type="number"
                  />
                </div>

                <div className={styles['form-field']}>
                  <label>Fuel Type</label>
                  <select
                    name="fuelType"
                    value={formData.fuelType}
                    onChange={handleFormChange}
                    required
                  >
                    <option value="">Select Fuel Type</option>
                    <option value="Petrol">Petrol</option>
                    <option value="Diesel">Diesel</option>
                    <option value="CNG">CNG</option>
                    <option value="Electric">Electric</option>
                    <option value="Hybrid">Hybrid</option>
                  </select>
                </div>

                <div className={styles['form-field']}>
                  <label>Seating Capacity</label>
                  <input
                    name="seatingCapacity"
                    value={formData.seatingCapacity}
                    onChange={handleFormChange}
                    placeholder="Enter seating capacity"
                    type="number"
                    required
                  />
                </div>

                <div className={styles['form-field']}>
                  <label>Transmission</label>
                  <select
                    name="transmission"
                    value={formData.transmission}
                    onChange={handleFormChange}
                    required
                  >
                    <option value="">Select Transmission</option>
                    <option value="Manual">Manual</option>
                    <option value="Automatic">Automatic</option>
                  </select>
                </div>

                <div className={styles['form-field']}>
                  <label>Mileage</label>
                  <input
                    name="mileage"
                    value={formData.mileage}
                    onChange={handleFormChange}
                    placeholder="Enter mileage (km/l)"
                    type="number"
                  />
                </div>

                <div className={styles['form-field']}>
                  <label>Vehicle Number</label>
                  <input
                    name="vehicleNumber"
                    value={formData.vehicleNumber}
                    onChange={handleFormChange}
                    placeholder="Enter vehicle number"
                    required
                  />
                </div>

                <div className={styles['form-field']}>
                  <label>Deposit Amount</label>
                  <input
                    name="depositAmount"
                    value={formData.depositAmount}
                    onChange={handleFormChange}
                    placeholder="Enter deposit amount"
                    type="number"
                    required
                  />
                </div>

                <div className={styles['form-field']}>
                  <label>Sub Location</label>
                  <select
                    name="subLocation"
                    value={formData.subLocation}
                    onChange={handleFormChange}
                    required
                  >
                    {subLocations.map((loc) => (
                      <option key={loc} value={loc}>
                        {loc}
                      </option>
                    ))}
                  </select>
                </div>

                <div className={`${styles['form-field']} ${styles['full-width']}`}>
                  <label>Vehicle Image</label>
                  <div className={styles['file-upload']}>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      id="file-input"
                    />
                    <label htmlFor="file-input" className={styles['file-label']}>
                      <FaUpload />
                      <span>{imageFile ? imageFile.name : 'Choose vehicle image'}</span>
                    </label>
                  </div>
                </div>
              </div>

              <button type="submit" className={styles['submit-btn']} disabled={isSubmitting}>
                <FaPlus />
                {isSubmitting ? 'Adding Vehicle...' : 'Add Vehicle'}
              </button>
            </form>
          </div>
        )}

        {activeTab === 'list' && (
          <div className={styles['vehicle-list-section']}>
            <div className={styles['list-header']}>
              <h2>Your Vehicles</h2>
              <span className={styles['vehicle-count']}>{filteredVehicles.length} vehicles</span>
            </div>

            <div className={styles['filters-section']}>
              <div className={styles['filter-group']}>
                <label>Vehicle Type</label>
                <div className={styles['filter-btns']}>
                  {['All', 'Car', 'Bike', 'SUV', 'Van'].map((type) => (
                    <button
                      key={type}
                      className={`${styles['filter-chip']} ${filterType === type ? styles['active'] : ''}`}
                      onClick={() => setFilterType(type)}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div className={styles['filter-group']}>
                <label>Area / SubLocation</label>
                <div className={styles['filter-btns']}>
                  <button
                    className={`${styles['filter-chip']} ${filterSubLocation === 'All' ? styles['active'] : ''}`}
                    onClick={() => setFilterSubLocation('All')}
                  >
                    All Areas
                  </button>
                  {subLocations.map((subLoc) => (
                    <button
                      key={subLoc}
                      className={`${styles['filter-chip']} ${filterSubLocation === subLoc ? styles['active'] : ''}`}
                      onClick={() => setFilterSubLocation(subLoc)}
                    >
                      {subLoc}
                    </button>
                  ))}
                </div>
              </div>

              {(filterType !== 'All' || filterSubLocation !== 'All') && (
                <button className={styles['reset-btn']} onClick={handleResetFilters}>
                  <FaTimes />
                  Reset Filters
                </button>
              )}
            </div>

            {loading ? (
              <div className={styles['loading-state']}>
                <div className={styles['spinner']}></div>
                <p>Loading vehicles...</p>
              </div>
            ) : error ? (
              <div className={styles['error-state']}>
                <FaExclamationCircle />
                <p>{error}</p>
                <button onClick={fetchVehicles}>Retry</button>
              </div>
            ) : filteredVehicles.length === 0 ? (
              <div className={styles['empty-state']}>
                <FaCar />
                <p>No vehicles found</p>
                {(filterType !== 'All' || filterSubLocation !== 'All') && (
                  <button onClick={handleResetFilters}>Clear Filters</button>
                )}
              </div>
            ) : (
              <>
                <div className={styles['stats-row']}>
                  <div className={styles['stat-box']}>
                    <span className={styles['stat-num']}>{vehicles.filter(v => v.status === 'Available').length}</span>
                    <span className={styles['stat-text']}>Available</span>
                  </div>
                  <div className={styles['stat-box']}>
                    <span className={styles['stat-num']}>{vehicles.filter(v => v.status === 'Booked').length}</span>
                    <span className={styles['stat-text']}>Booked</span>
                  </div>
                  <div className={styles['stat-box']}>
                    <span className={styles['stat-num']}>{vehicles.filter(v => v.status === 'Maintenance').length}</span>
                    <span className={styles['stat-text']}>Maintenance</span>
                  </div>
                </div>

                <div className={styles['vehicles-grid']}>
                  {filteredVehicles.map((vehicle) => (
                    <VehicleCard
                      key={vehicle._id}
                      vehicle={vehicle}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      onStatusChange={handleStatusChange}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {editingVehicle && (
        <div className={styles['modal-overlay']} onClick={() => setEditingVehicle(null)}>
          <div className={styles['modal-box']} onClick={(e) => e.stopPropagation()}>
            <div className={styles['modal-header']}>
              <h3>Edit Vehicle</h3>
              <button className={styles['close-btn']} onClick={() => setEditingVehicle(null)}>
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className={styles['modal-form']}>
              {editingVehicle.vehicleImage && (
                <div className={styles['current-image']}>
                  <img
                    src={getVehicleImageUrl(editingVehicle.vehicleImage)}
                    alt={`${editingVehicle.brand} ${editingVehicle.vehicleModel}`}
                    onError={(e) => {
                      e.target.src = '/placeholder-vehicle.png';
                    }}
                  />
                </div>
              )}

              <div className={styles['form-grid']}>
                <input
                  name="vehicleModel"
                  value={editingVehicle.vehicleModel || ''}
                  onChange={(e) => setEditingVehicle({...editingVehicle, vehicleModel: e.target.value})}
                  placeholder="Vehicle Model"
                  required
                />

                <select
                  name="vehicleType"
                  value={editingVehicle.vehicleType || ''}
                  onChange={(e) => setEditingVehicle({...editingVehicle, vehicleType: e.target.value})}
                  required
                >
                  <option value="">Select Vehicle Type</option>
                  <option value="Car">Car</option>
                  <option value="Bike">Bike</option>
                  <option value="SUV">SUV</option>
                  <option value="Van">Van</option>
                </select>

                <input
                  name="brand"
                  value={editingVehicle.brand || ''}
                  onChange={(e) => setEditingVehicle({...editingVehicle, brand: e.target.value})}
                  placeholder="Brand"
                  required
                />

                <input
                  name="color"
                  value={editingVehicle.color || ''}
                  onChange={(e) => setEditingVehicle({...editingVehicle, color: e.target.value})}
                  placeholder="Color"
                  required
                />

                <input
                  name="modelYear"
                  value={editingVehicle.modelYear || ''}
                  onChange={(e) => setEditingVehicle({...editingVehicle, modelYear: e.target.value})}
                  placeholder="Model Year"
                  type="number"
                  required
                />

                <input
                  name="rentPerDay"
                  value={editingVehicle.rentPerDay || ''}
                  onChange={(e) => setEditingVehicle({...editingVehicle, rentPerDay: e.target.value})}
                  placeholder="Rent Per Day"
                  type="number"
                  required
                />

                <input
                  name="rentPerHour"
                  value={editingVehicle.rentPerHour || ''}
                  onChange={(e) => setEditingVehicle({...editingVehicle, rentPerHour: e.target.value})}
                  placeholder="Rent Per Hour"
                  type="number"
                />

                <select
                  name="fuelType"
                  value={editingVehicle.fuelType || ''}
                  onChange={(e) => setEditingVehicle({...editingVehicle, fuelType: e.target.value})}
                  required
                >
                  <option value="">Select Fuel Type</option>
                  <option value="Petrol">Petrol</option>
                  <option value="Diesel">Diesel</option>
                  <option value="CNG">CNG</option>
                  <option value="Electric">Electric</option>
                  <option value="Hybrid">Hybrid</option>
                </select>

                <input
                  name="seatingCapacity"
                  value={editingVehicle.seatingCapacity || ''}
                  onChange={(e) => setEditingVehicle({...editingVehicle, seatingCapacity: e.target.value})}
                  placeholder="Seating Capacity"
                  type="number"
                  required
                />

                <select
                  name="transmission"
                  value={editingVehicle.transmission || ''}
                  onChange={(e) => setEditingVehicle({...editingVehicle, transmission: e.target.value})}
                  required
                >
                  <option value="">Select Transmission</option>
                  <option value="Manual">Manual</option>
                  <option value="Automatic">Automatic</option>
                </select>

                <input
                  name="vehicleNumber"
                  value={editingVehicle.vehicleNumber || ''}
                  onChange={(e) => setEditingVehicle({...editingVehicle, vehicleNumber: e.target.value})}
                  placeholder="Vehicle Number"
                  required
                />

                <input
                  name="depositAmount"
                  value={editingVehicle.depositAmount || ''}
                  onChange={(e) => setEditingVehicle({...editingVehicle, depositAmount: e.target.value})}
                  placeholder="Deposit Amount"
                  type="number"
                  required
                />

                <select
                  name="subLocation"
                  value={editingVehicle.subLocation || ''}
                  onChange={(e) => setEditingVehicle({...editingVehicle, subLocation: e.target.value})}
                  required
                >
                  {subLocations.map((loc) => (
                    <option key={loc} value={loc}>
                      {loc}
                    </option>
                  ))}
                </select>

                <input
                  name="mileage"
                  value={editingVehicle.mileage || ''}
                  onChange={(e) => setEditingVehicle({...editingVehicle, mileage: e.target.value})}
                  placeholder="Mileage"
                  type="number"
                />

                <div className={`${styles['file-upload']} ${styles['full-width']}`}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    id="edit-file-input"
                  />
                  <label htmlFor="edit-file-input" className={styles['file-label']}>
                    <FaUpload />
                    <span>{imageFile ? imageFile.name : 'Update vehicle image'}</span>
                  </label>
                </div>
              </div>

              <div className={styles['modal-actions']}>
                <button type="submit" className={styles['btn-primary']}>Update Vehicle</button>
                <button type="button" onClick={() => setEditingVehicle(null)} className={styles['btn-secondary']}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}



        </>
      )}
    </div>
  );
};

export default ManageVehiclesPage;
