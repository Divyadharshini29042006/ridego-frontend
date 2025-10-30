import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import managerAPI from '../../api/managerAPI';
import {
  FaUsers,
  FaGasPump,
  FaCogs,
  FaMapMarkerAlt,
  FaArrowLeft,
  FaEdit,
  FaEye,
  FaCheckCircle,
  FaTimesCircle,
  FaClock
} from 'react-icons/fa';
import styles from '../../styles/VehicleDetails.module.css';

const VehicleDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchVehicle = async () => {
      try {
        const vehicle = await managerAPI.getVehicleById(id);
        setVehicle(vehicle);
      } catch (err) {
        console.error('Error fetching vehicle:', err);
        setError('Vehicle not found');
      } finally {
        setLoading(false);
      }
    };
    fetchVehicle();
  }, [id]);

  const handleBack = () => {
    navigate('/manager/vehicles');
  };

  const handleEdit = () => {
    navigate(`/manager/vehicles/${id}/edit`);
  };

  // Loading state
  if (loading) {
    return (
      <div className={styles['vehicle-details-container']}>
        <div className={styles.loading}>
          <div className={styles['loading-spinner']}></div>
          <p>Loading vehicle details...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !vehicle) {
    return (
      <div className={styles['vehicle-details-container']}>
        <div className={styles.error}>
          <h3>Oops! Something went wrong</h3>
          <p>{error || 'Vehicle not found'}</p>
          <button onClick={handleBack} className={styles['back-button']}>
            <FaArrowLeft className={styles['back-icon']} />
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const imageSrc = vehicle.vehicleImage
    ? `http://localhost:5000/uploads/vehicles/${vehicle.vehicleImage}`
    : '/default-car.jpg';

  // Vehicle specifications
  const getVehicleSpecs = () => {
    const isBike = vehicle.vehicleType?.toLowerCase().includes('bike') ||
                   vehicle.vehicleType?.toLowerCase().includes('motorcycle');

    const baseSpecs = [
      {
        icon: FaGasPump,
        label: vehicle.fuelType || 'Petrol'
      },
      {
        icon: FaCogs,
        label: vehicle.transmission || 'Manual'
      },
      {
        icon: FaMapMarkerAlt,
        label: vehicle.assignedLocation?.city || 'Location'
      }
    ];

    if (isBike) {
      baseSpecs.unshift({
        icon: FaCogs,
        label: 'Motorcycle'
      });
    } else {
      baseSpecs.unshift({
        icon: FaUsers,
        label: `${vehicle.seatingCapacity || 4} Seats`
      });
    }

    return baseSpecs;
  };

  // Status badge
  const getStatusBadge = () => {
    const status = vehicle.status || 'available';
    const statusConfig = {
      available: { icon: FaCheckCircle, color: '#10b981', text: 'Available' },
      booked: { icon: FaClock, color: '#f59e0b', text: 'Booked' },
      maintenance: { icon: FaTimesCircle, color: '#ef4444', text: 'Maintenance' },
      inactive: { icon: FaTimesCircle, color: '#6b7280', text: 'Inactive' }
    };

    const config = statusConfig[status] || statusConfig.available;
    const IconComponent = config.icon;

    return (
      <div className={styles['status-badge']} style={{ backgroundColor: config.color }}>
        <IconComponent className={styles['status-icon']} />
        <span>{config.text}</span>
      </div>
    );
  };

  const vehicleSpecs = getVehicleSpecs();
  const isBike = vehicle.vehicleType?.toLowerCase().includes('bike') ||
                 vehicle.vehicleType?.toLowerCase().includes('motorcycle');

  return (
    <div className={styles['vehicle-details-container']}>
      {/* Back Button */}
      <div className={styles['back-button-container']}>
        <button className={styles['back-button']} onClick={handleBack}>
          <FaArrowLeft className={styles['back-icon']} />
          Back to Vehicles
        </button>
      </div>

      <div className={styles['vehicle-content']}>
        {/* Left Section - Vehicle Details */}
        <div className={styles['left-section']}>
          {/* Vehicle Image */}
          <div className={styles['image-section']}>
            <img
              src={imageSrc}
              alt={`${vehicle.brand} ${vehicle.vehicleModel}`}
              onError={(e) => {
                e.target.src = '/default-car.jpg';
              }}
            />
          </div>

          {/* Vehicle Header Information */}
          <div className={styles['vehicle-header']}>
            <div className={styles['header-top']}>
              <h1 className={styles['vehicle-title']}>
                {vehicle.brand} {vehicle.vehicleModel}
              </h1>
              {getStatusBadge()}
            </div>
            <p className={styles['vehicle-subtitle']}>
              {vehicle.vehicleType} • {vehicle.modelYear} • {vehicle.vehicleNumber}
            </p>
          </div>

          {/* Vehicle Specifications */}
          <div className={styles['vehicle-specs']}>
            {vehicleSpecs.map((spec, index) => (
              <div key={index} className={styles['spec-item']}>
                <spec.icon className={styles['spec-icon']} />
                <span className={styles['spec-text']}>{spec.label}</span>
              </div>
            ))}
          </div>

          {/* Vehicle Description */}
          <div className={styles['vehicle-description']}>
            <h3>Vehicle Information</h3>
            <div className={styles['info-grid']}>
              <div className={styles['info-item']}>
                <strong>Brand:</strong> {vehicle.brand}
              </div>
              <div className={styles['info-item']}>
                <strong>Model:</strong> {vehicle.vehicleModel}
              </div>
              <div className={styles['info-item']}>
                <strong>Year:</strong> {vehicle.modelYear}
              </div>
              <div className={styles['info-item']}>
                <strong>Vehicle Number:</strong> {vehicle.vehicleNumber}
              </div>
              <div className={styles['info-item']}>
                <strong>Type:</strong> {vehicle.vehicleType}
              </div>
              <div className={styles['info-item']}>
                <strong>Fuel Type:</strong> {vehicle.fuelType}
              </div>
              <div className={styles['info-item']}>
                <strong>Transmission:</strong> {vehicle.transmission}
              </div>
              <div className={styles['info-item']}>
                <strong>Seating Capacity:</strong> {vehicle.seatingCapacity}
              </div>
              <div className={styles['info-item']}>
                <strong>Rent per Day:</strong> ₹{vehicle.rentPerDay}
              </div>
              <div className={styles['info-item']}>
                <strong>Rent per Hour:</strong> ₹{vehicle.rentPerHour || 'N/A'}
              </div>
              <div className={styles['info-item']}>
                <strong>Location:</strong> {vehicle.assignedLocation?.city || 'Not Assigned'}
              </div>
              <div className={styles['info-item']}>
                <strong>Status:</strong> {vehicle.status || 'Available'}
              </div>
            </div>
          </div>
        </div>

        {/* Right Section - Actions */}
        <div className={styles['right-section']}>
          <div className={styles['manager-actions']}>
            <h3>Manager Actions</h3>

            <button
              onClick={handleEdit}
              className={styles['action-btn']}
            >
              <FaEdit className={styles['action-icon']} />
              Edit Vehicle
            </button>

            <button
              onClick={() => navigate('/manager/vehicles')}
              className={`${styles['action-btn']} ${styles.secondary}`}
            >
              <FaEye className={styles['action-icon']} />
              View All Vehicles
            </button>
          </div>

          {/* Additional Info */}
          <div className={styles['additional-info']}>
            <h4>Quick Stats</h4>
            <div className={styles['stats-grid']}>
              <div className={styles['stat-item']}>
                <span className={styles['stat-label']}>Daily Rate</span>
                <span className={styles['stat-value']}>₹{vehicle.rentPerDay}</span>
              </div>
              <div className={styles['stat-item']}>
                <span className={styles['stat-label']}>Hourly Rate</span>
                <span className={styles['stat-value']}>₹{vehicle.rentPerHour || 'N/A'}</span>
              </div>
              <div className={styles['stat-item']}>
                <span className={styles['stat-label']}>Capacity</span>
                <span className={styles['stat-value']}>{vehicle.seatingCapacity || 4} {isBike ? 'Rider' : 'Passengers'}</span>
              </div>
              <div className={styles['stat-item']}>
                <span className={styles['stat-label']}>Fuel</span>
                <span className={styles['stat-value']}>{vehicle.fuelType || 'Petrol'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VehicleDetails;
