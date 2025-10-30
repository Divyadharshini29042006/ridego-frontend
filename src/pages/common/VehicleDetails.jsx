import React, { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import vehicleAPI from '../../api/vehicleAPI';
import {
  FaUsers,
  FaGasPump,
  FaCogs,
  FaMapMarkerAlt,
  FaArrowLeft,
  FaCalendarAlt,
  FaStar,
  FaShieldAlt,
  FaWifi,
  FaSnowflake,
  FaMusic,
  FaRoad,
  FaClock,
  FaMapMarked
} from 'react-icons/fa';
import { AuthContext } from '../../context/AuthContext';
import styles from '../../styles/VehicleDetails.module.css';

const VehicleDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useContext(AuthContext);
  
  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pickupDate, setPickupDate] = useState(null);
  const [returnDate, setReturnDate] = useState(null);
  const [tripType, setTripType] = useState(null);

  // Get location data from navigation state
  const selectedLocation = location.state?.selectedLocation;
  const selectedSubLocation = location.state?.selectedSubLocation;

  // Trip type options
  const tripTypes = [
    {
      id: 'outstation',
      label: 'Outstation Cabs',
      icon: FaRoad,
      description: 'Perfect for long-distance travel'
    },
    {
      id: 'hourly',
      label: 'Hourly Cabs',
      icon: FaClock,
      description: 'Flexible hourly rentals'
    },
    {
      id: 'local',
      label: 'Local Ride',
      icon: FaMapMarked,
      description: 'Same-city rides within the area'
    }
  ];

  useEffect(() => {
    const fetchVehicle = async () => {
      try {
        const vehicle = await vehicleAPI.getPublicVehicleById(id);
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
    navigate('/');
  };

  const handleBook = () => {
    // Validate trip type selection
    if (!tripType) {
      alert('Please select a trip type');
      return;
    }

    // Validate dates
    if (!pickupDate || !returnDate) {
      alert('Please select both pickup and return dates');
      return;
    }

    if (pickupDate > returnDate) {
      alert('Return date must be on or after pickup date');
      return;
    }

    // Get selected trip type details
    const selectedTripType = tripTypes.find(t => t.id === tripType);

    // Prepare booking data with COMPLETE vehicle information
    const bookingData = {
      vehicleId: vehicle._id,
      vehicleName: `${vehicle.brand} ${vehicle.vehicleModel}`,
      vehicleImage: vehicle.vehicleImage,
      vehicleType: vehicle.vehicleType,
      rentPerDay: vehicle.rentPerDay,
      rentPerHour: vehicle.rentPerHour || (vehicle.vehicleType === 'Bike' ? 100 : 300),
      pickupDate: pickupDate.toISOString(),
      returnDate: returnDate.toISOString(),
      tripType: selectedTripType?.label,
      tripTypeId: tripType,
      selectedLocation: selectedLocation || vehicle.assignedLocation?.city,
      selectedSubLocation: selectedSubLocation || ''
    };

    // Check if user is logged in
    if (!user) {
      alert('Please login to proceed with booking');
      navigate('/login', {
        state: {
          from: `/vehicle/${id}`,
          bookingData,
          selectedLocation: bookingData.selectedLocation,
          selectedSubLocation: bookingData.selectedSubLocation
        }
      });
      return;
    }

    // Navigate to booking page
    navigate('/booking', {
      state: {
        bookingData,
        selectedLocation: bookingData.selectedLocation,
        selectedSubLocation: bookingData.selectedSubLocation
      }
    });
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
        label: selectedLocation || vehicle.assignedLocation?.city || 'Location'
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

  // Additional features
  const getAdditionalFeatures = () => {
    const isBike = vehicle.vehicleType?.toLowerCase().includes('bike') || 
                   vehicle.vehicleType?.toLowerCase().includes('motorcycle');
    
    const baseFeatures = [
      { icon: FaShieldAlt, label: 'Insurance Included' }
    ];

    if (isBike) {
      return [
        ...baseFeatures,
        { icon: FaShieldAlt, label: 'Helmet Provided' },
        { icon: FaCogs, label: 'Well Maintained' },
        { icon: FaGasPump, label: 'Fuel Efficient' }
      ];
    } else {
      return [
        ...baseFeatures,
        { icon: FaWifi, label: 'WiFi Hotspot' },
        { icon: FaSnowflake, label: 'Air Conditioning' },
        { icon: FaMusic, label: 'Premium Audio' }
      ];
    }
  };

  const vehicleSpecs = getVehicleSpecs();
  const additionalFeatures = getAdditionalFeatures();
  const rating = 4.8;
  const reviewCount = Math.floor(Math.random() * 200) + 50;
  const isBike = vehicle.vehicleType?.toLowerCase().includes('bike') || 
                 vehicle.vehicleType?.toLowerCase().includes('motorcycle');

  return (
    <div className={styles['vehicle-details-container']}>
      {/* Back Button */}
      <div className={styles['back-button-container']}>
        <button className={styles['back-button']} onClick={handleBack}>
          <FaArrowLeft className={styles['back-icon']} />
          Back to all {isBike ? 'bikes' : 'vehicles'}
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
            <h1 className={styles['vehicle-title']}>
              {vehicle.brand} {vehicle.vehicleModel}
            </h1>
            <p className={styles['vehicle-subtitle']}>
              {vehicle.vehicleType} • {vehicle.modelYear}
            </p>
            {/* Rating stars */}
            <div className={styles['vehicle-rating']}>
              {[...Array(5)].map((_, index) => (
                <FaStar 
                  key={index} 
                  className={styles['star-icon']} 
                  style={{ 
                    color: index < Math.floor(rating) ? '#f59e0b' : '#d1d5db' 
                  }} 
                />
              ))}
              <span className={styles['rating-text']}>
                {rating} • {reviewCount} trips
              </span>
            </div>
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

          {/* Additional Features */}
          {additionalFeatures.length > 0 && (
            <div className={styles['vehicle-specs']}>
              {additionalFeatures.map((feature, index) => (
                <div key={index} className={styles['spec-item']}>
                  <feature.icon className={styles['spec-icon']} />
                  <span className={styles['spec-text']}>{feature.label}</span>
                </div>
              ))}
            </div>
          )}

          {/* Vehicle Description */}
          <div className={styles['vehicle-description']}>
            <h3>About this {isBike ? 'bike' : 'vehicle'}</h3>
            <p>
              Experience the perfect blend of comfort, performance, and style with the {vehicle.brand} {vehicle.vehicleModel}. 
              This {isBike 
                ? 'premium motorcycle offers exceptional fuel efficiency and thrilling performance with its reliable engine. Perfect for city rides and long touring adventures, this bike provides the freedom and excitement you crave.'
                : `premium ${vehicle.vehicleType?.toLowerCase()} offers exceptional fuel efficiency with its ${vehicle.fuelType?.toLowerCase()} engine 
              and smooth ${vehicle.transmission?.toLowerCase()} transmission. Whether you're navigating city streets or embarking on long road trips, 
              this vehicle provides the reliability and comfort you need. With spacious seating for ${vehicle.seatingCapacity || 4} passengers and modern amenities, 
              every journey becomes a memorable experience.`}
            </p>
          </div>
        </div>

        {/* Right Section - Booking Form */}
        <div className={styles['right-section']}>
          <div className={styles['booking-form']}>
            {/* Trip Type Selection */}
            <div className={styles['trip-type-selection']}>
              <label className={styles['trip-type-label']}>
                <FaRoad className={styles['label-icon']} />
                Select Trip Type
              </label>
              <div className={styles['trip-type-options']}>
                {tripTypes.map((type) => (
                  <div
                    key={type.id}
                    className={`${styles['trip-type-card']} ${tripType === type.id ? styles.selected : ''}`}
                    onClick={() => setTripType(type.id)}
                  >
                    <type.icon className={styles['trip-type-icon']} />
                    <div className={styles['trip-type-content']}>
                      <h4 className={styles['trip-type-title']}>
                        {type.label}
                      </h4>
                      <p className={styles['trip-type-description']}>{type.description}</p>
                    </div>
                    <div className={styles['trip-type-radio']}>
                      <div className={`${styles['radio-circle']} ${tripType === type.id ? styles.checked : ''}`}>
                        {tripType === type.id && <div className={styles['radio-dot']}></div>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Pickup Date */}
            <div className={styles['date-input-group']}>
              <label htmlFor="pickup-date">
                <FaCalendarAlt className={styles['label-icon']} />
                Pickup Date
              </label>
              <input
                type="date"
                id="pickup-date"
                value={pickupDate ? pickupDate.toISOString().split('T')[0] : ''}
                onChange={(e) => setPickupDate(e.target.value ? new Date(e.target.value) : null)}
                min={new Date().toISOString().split('T')[0]}
                className={styles['date-picker-input']}
                autoComplete="off"
              />
            </div>

            {/* Return Date */}
            <div className={styles['date-input-group']}>
              <label htmlFor="return-date">
                <FaCalendarAlt className={styles['label-icon']} />
                Return Date
              </label>
              <input
                type="date"
                id="return-date"
                value={returnDate ? returnDate.toISOString().split('T')[0] : ''}
                onChange={(e) => setReturnDate(e.target.value ? new Date(e.target.value) : null)}
                min={pickupDate ? pickupDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0]}
                className={styles['date-picker-input']}
                autoComplete="off"
              />
            </div>

            {/* Continue to Booking Button */}
            <button 
              onClick={handleBook} 
              className={styles['book-now-btn']}
              disabled={!tripType || !pickupDate || !returnDate}
            >
              Continue to Booking
            </button>

            <p className={styles['no-card-text']}>
              ✨ Free cancellation • 🔒 {user ? 'Secure booking' : 'Login required'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VehicleDetails;