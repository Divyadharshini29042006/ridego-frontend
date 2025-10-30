import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import {
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaClock,
  FaPlus,
  FaMinus,
  FaArrowLeft,
  FaCheckCircle,
  FaExclamationTriangle,
  FaCar,
  FaMotorcycle,
  FaTimes,
} from 'react-icons/fa';
import { useAuth } from "../context/AuthContext.jsx";
import { useBooking } from "../context/BookingContext.jsx";
import { calculateFare } from '../utils/fareCalculator';
import { getVehicleImageUrl } from '../utils/imageUtils';
import vehicleAPI from '../api/vehicleAPI';
import axios from 'axios';
import '../styles/BookingForm.css';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

const BookingForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const booking = useBooking();

  // Get data from route state (for initial navigation)
  const routeBookingData = location.state?.bookingData;
  const routeSelectedLocation = location.state?.selectedLocation;
  const routeSelectedSubLocation = location.state?.selectedSubLocation;

  const [availableLocations, setAvailableLocations] = useState([]);
  const [fetchedVehicles, setFetchedVehicles] = useState([]);
  const [loadingVehicles, setLoadingVehicles] = useState(false);
  const [loadingLocations, setLoadingLocations] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showVehicleSelector, setShowVehicleSelector] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Initialize booking from route state if available (first time navigation)
  useEffect(() => {
    if (routeBookingData && !initialized) {
      booking.initializeBooking({
        ...routeBookingData,
        selectedLocation: routeSelectedLocation,
        selectedSubLocation: routeSelectedSubLocation
      });
      setInitialized(true);
    } else if (booking.initialVehicle && !initialized) {
      // Already have data from context
      setInitialized(true);
    }
  }, [routeBookingData, routeSelectedLocation, routeSelectedSubLocation, initialized, booking]);

  // Fetch locations on mount
  useEffect(() => {
    fetchLocations();
  }, []);

  // Fetch vehicles when pickup location changes
  useEffect(() => {
    if (booking.pickupLocation) {
      fetchVehiclesForLocation(booking.pickupLocation);
    }
  }, [booking.pickupLocation]);

  // Set drop location for outstation trips
  useEffect(() => {
    if (booking.tripTypeId === 'outstation' && booking.pickupLocation) {
      booking.setDropLocation(booking.pickupLocation);
    }
  }, [booking.pickupLocation, booking.tripTypeId]);

  // Calculate fare when relevant fields change
  useEffect(() => {
    if (booking.pickupLocation && booking.pickupDate && booking.vehicleConfigs.length > 0) {
      calculateCurrentFare();
    }
  }, [
    booking.pickupLocation,
    booking.dropLocation,
    booking.pickupDate,
    booking.returnDate,
    booking.vehicleConfigs,
    booking.hourlyHours
  ]);

  // Clear trip-specific fields when purpose changes
  useEffect(() => {
    booking.setFlightTrainNumber('');
    booking.setRailwayStationAddress('');
    booking.setAirportTerminal('');
    booking.setAirportArea('');
  }, [booking.hourlyPurpose]);

  // Set initial location if pre-selected
  useEffect(() => {
    if (booking.preSelectedLocation && availableLocations.length > 0 && !booking.pickupLocation) {
      const city = availableLocations.find(loc => loc.city === booking.preSelectedLocation);
      if (city) {
        const subCities = city.subCities || [];
        const subLocation = booking.preSelectedSubLocation || 'Main Location';
        
        if (subCities.includes(subLocation)) {
          const fullLocation = `${booking.preSelectedLocation} - ${subLocation}`;
          booking.setPickupLocation(fullLocation);
          booking.setPickupFromOurLocation(true);
        } else if (booking.preSelectedSubLocation) {
          // Custom location
          booking.setPickupLocation(`${booking.preSelectedLocation} - Main Location`);
          booking.setPickupFromOurLocation(false);
          booking.setCommonCustomAddress(booking.preSelectedSubLocation);
        }
      }
    }
  }, [availableLocations, booking.preSelectedLocation, booking.preSelectedSubLocation]);

  const fetchLocations = async () => {
    setLoadingLocations(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/locations/public`);
      const consolidatedLocations = {};
      
      (response.data || []).forEach(loc => {
        if (!consolidatedLocations[loc.city]) {
          consolidatedLocations[loc.city] = {
            _id: loc._id,
            city: loc.city,
            state: loc.state,
            subCities: []
          };
        }
        if (loc.subCities && Array.isArray(loc.subCities)) {
          loc.subCities.forEach(subCity => {
            if (!consolidatedLocations[loc.city].subCities.includes(subCity)) {
              consolidatedLocations[loc.city].subCities.push(subCity);
            }
          });
        }
        if (loc.name && !consolidatedLocations[loc.city].subCities.includes(loc.name)) {
          consolidatedLocations[loc.city].subCities.push(loc.name);
        }
      });
      
      const uniqueLocations = Object.values(consolidatedLocations).sort((a, b) => 
        a.city.localeCompare(b.city)
      );
      
      setAvailableLocations(uniqueLocations);
      console.log('✅ Locations loaded:', uniqueLocations.length);
    } catch (error) {
      console.error('❌ Error fetching locations:', error);
      setError('Failed to load locations. Please refresh the page.');
    } finally {
      setLoadingLocations(false);
    }
  };

  const fetchVehiclesForLocation = async (locationString) => {
    setLoadingVehicles(true);
    try {
      const parts = locationString.split(' - ');
      const mainCity = parts[0];
      const subCity = parts[1] || '';

      const filters = { city: mainCity };
      if (subCity && subCity !== 'Main Location') {
        filters.subLocation = subCity;
      }

      const vehicles = await vehicleAPI.getPublicVehicles(filters);
      setFetchedVehicles(vehicles || []);
      console.log('✅ Vehicles loaded:', vehicles?.length || 0);
    } catch (error) {
      console.error('❌ Error fetching vehicles:', error);
      setFetchedVehicles([]);
    } finally {
      setLoadingVehicles(false);
    }
  };

  const availableVehicles = useMemo(() => {
    return (fetchedVehicles || []).filter(vehicle => {
      if (booking.vehicleConfigs.some(vc => String(vc.vehicleId) === String(vehicle._id))) {
        return false;
      }
      const vehicleCity = vehicle.assignedLocation?.city || '';
      const mainCity = booking.pickupLocation.split(' - ')[0];
      return vehicleCity === mainCity;
    });
  }, [fetchedVehicles, booking.vehicleConfigs, booking.pickupLocation]);

  const calculateCurrentFare = () => {
    try {
      const tripType = booking.tripTypeId;
      
      // Validation
      if (!tripType || !booking.pickupLocation || !booking.pickupDate) {
        console.log('⚠️ Missing required data for fare calculation');
        return;
      }

      if (booking.vehicleConfigs.length === 0) {
        console.log('⚠️ No vehicles configured');
        return;
      }

      let totalAmount = 0;
      const fares = [];
      const mainPickupCity = booking.pickupLocation.split(' - ')[0];
      const mainDropCity = booking.dropLocation ? booking.dropLocation.split(' - ')[0] : mainPickupCity;

      console.log('🧮 Starting fare calculation for:', {
        tripType,
        vehicleCount: booking.vehicleConfigs.length
      });

      booking.vehicleConfigs.forEach((vehicle, index) => {
        // Validate vehicle has required fields
        if (!vehicle.vehicleId || !vehicle.vehicleName) {
          console.error(`❌ Vehicle #${index + 1} missing required fields`);
          return;
        }

        console.log(`📊 Vehicle #${index + 1}: ${vehicle.vehicleName}`, {
          rentPerDay: vehicle.rentPerDay,
          rentPerHour: vehicle.rentPerHour,
          needsDriver: vehicle.needsDriver
        });

        // Validate that rent values exist (fareCalculator has fallbacks but we should warn)
        if (typeof vehicle.rentPerDay !== 'number' && typeof vehicle.rentPerHour !== 'number') {
          console.warn(`⚠️ Vehicle #${index + 1} has no rent data, using defaults`);
        }

        let fareData = {};
        
        if (tripType === 'outstation' && mainDropCity && booking.returnDate) {
          fareData = calculateFare({
            tripType: 'outstation',
            pickupLocation: mainPickupCity,
            dropLocation: mainDropCity,
            pickupDate: booking.pickupDate.toISOString(),
            returnDate: booking.returnDate.toISOString(),
            vehicleRentPerDay: vehicle.rentPerDay,
            vehicleType: vehicle.vehicleType,
            needsDriver: vehicle.needsDriver,
          });
        } else if (tripType === 'hourly') {
          fareData = calculateFare({
            tripType: 'hourly',
            hours: booking.hourlyHours,
            vehicleRentPerHour: vehicle.rentPerHour,
            vehicleType: vehicle.vehicleType,
            needsDriver: vehicle.needsDriver,
            pickupDate: booking.pickupDate.toISOString(),
          });
        } else if (tripType === 'local' && mainDropCity) {
          fareData = calculateFare({
            tripType: 'local',
            pickupLocation: mainPickupCity,
            dropLocation: mainDropCity,
            vehicleRentPerDay: vehicle.rentPerDay,
            vehicleType: vehicle.vehicleType,
            needsDriver: vehicle.needsDriver,
            pickupDate: booking.pickupDate.toISOString(),
          });
        }
        
        if (fareData && fareData.total) {
          totalAmount += fareData.total;
          fares.push({
            vehicleId: vehicle.id,
            vehicleName: vehicle.vehicleName,
            fare: fareData.total,
            breakdown: fareData.breakdown,
            ...(fareData.days ? { days: fareData.days } : {}),
          });
          
          console.log(`✅ Vehicle #${index + 1} fare: ₹${fareData.total}`);
        } else {
          console.warn(`⚠️ Vehicle #${index + 1} fare calculation returned 0`);
        }
      });
      
      console.log(`💰 Total fare: ₹${totalAmount} (${fares.length} vehicle(s))`);
      
      booking.setTotalFare(totalAmount);
      booking.setVehicleFares(fares);
    } catch (error) {
      console.error('❌ Error calculating fare:', error);
      setError('Failed to calculate fare. Please check your selections.');
    }
  };

  // ✅ NEW: Helper functions for time validation
  const getMinTimeForDate = (selectedDate) => {
    const now = new Date();
    const selected = new Date(selectedDate);

    // If selected date is today, set minimum time to current time + 2 hours buffer
    if (selected.toDateString() === now.toDateString()) {
      const minTime = new Date(now.getTime() + (2 * 60 * 60 * 1000)); // +2 hours
      return minTime.toTimeString().slice(0, 5);
    }

    // For future dates, no minimum time constraint
    return '00:00';
  };

  const validatePickupTime = (selectedDate, selectedTime) => {
    if (!selectedDate || !selectedTime) return true;

    const now = new Date();
    const selectedDateTime = new Date(selectedDate);
    const [hours, minutes] = selectedTime.split(':').map(Number);

    selectedDateTime.setHours(hours, minutes, 0, 0);

    // For same-day bookings, ensure at least 2 hours buffer
    if (selectedDate.toDateString() === now.toDateString()) {
      const minAllowedTime = new Date(now.getTime() + (2 * 60 * 60 * 1000));
      return selectedDateTime >= minAllowedTime;
    }

    return true;
  };

  const autoAdjustTimeForSameDay = (selectedDate) => {
    if (!selectedDate) return;

    const minTime = getMinTimeForDate(selectedDate);

    // If current time is invalid for same-day booking, auto-adjust to minimum allowed time
    if (!validatePickupTime(selectedDate, booking.pickupTime)) {
      console.log('⏰ Auto-adjusting pickup time for same-day booking');
      booking.setPickupTime(minTime);
    }
  };

  const handleAddVehicle = (vehicle) => {
    // ✅ FIX: Ensure rent values exist with proper fallbacks
    const rentPerDay = typeof vehicle.rentPerDay === 'number' && vehicle.rentPerDay > 0
      ? vehicle.rentPerDay
      : (vehicle.vehicleType === 'Bike' ? 500 : 2000);

    const rentPerHour = typeof vehicle.rentPerHour === 'number' && vehicle.rentPerHour > 0
      ? vehicle.rentPerHour
      : (vehicle.vehicleType === 'Bike' ? 100 : 300);

    const newId = Math.max(...booking.vehicleConfigs.map(v => v.id), 0) + 1;
    const newVehicleConfig = {
      id: newId,
      vehicleId: vehicle._id,
      vehicleName: `${vehicle.brand} ${vehicle.vehicleModel}`,
      vehicleImage: vehicle.vehicleImage,
      vehicleType: vehicle.vehicleType,
      rentPerDay,
      rentPerHour,
      needsDriver: false,
      driverGender: 'Any',
    };

    console.log('➕ Adding vehicle:', newVehicleConfig);
    booking.setVehicleConfigs([...booking.vehicleConfigs, newVehicleConfig]);
    setShowVehicleSelector(false);
  };

  const handleRemoveVehicle = (vehicleId) => {
    if (booking.vehicleConfigs.length > 1) {
      booking.setVehicleConfigs(booking.vehicleConfigs.filter(v => v.id !== vehicleId));
      console.log('➖ Vehicle removed');
    }
  };

  const handleDriverToggle = (vehicleIndex, needsDriver) => {
    const updated = [...booking.vehicleConfigs];
    updated[vehicleIndex].needsDriver = needsDriver;
    if (!needsDriver) {
      updated[vehicleIndex].driverGender = 'Any';
    }
    booking.setVehicleConfigs(updated);
  };

  const handleDriverGenderChange = (vehicleIndex, gender) => {
    const updated = [...booking.vehicleConfigs];
    updated[vehicleIndex].driverGender = gender;
    booking.setVehicleConfigs(updated);
  };

  const getLocationAddress = (locationString) => {
    const parts = locationString.split(' - ');
    const city = parts[0];
    const subCity = parts[1] || '';
    const locationObj = availableLocations.find(loc => loc.city === city);
    
    if (locationObj) {
      const baseAddress = `RideGo Office, ${city}${locationObj.state ? ', ' + locationObj.state : ''}`;
      if (subCity && subCity !== 'Main Location') {
        return `${baseAddress} (${subCity})`;
      }
      return baseAddress;
    }
    return locationString;
  };

  const validateForm = () => {
    if (!booking.pickupLocation) {
      setError('Please select a pickup location');
      return false;
    }
    if (booking.tripTypeId !== 'hourly' && booking.tripTypeId !== 'outstation' && !booking.dropLocation) {
      setError('Please select a drop location');
      return false;
    }
    if (!booking.pickupDate) {
      setError('Please select a pickup date');
      return false;
    }
    if (booking.tripTypeId === 'outstation' && !booking.returnDate) {
      setError('Please select a return date');
      return false;
    }
    if (booking.tripTypeId === 'hourly' && !booking.hourlyPurpose) {
      setError('Please select the purpose of your trip');
      return false;
    }
    if (booking.tripTypeId === 'hourly' && booking.hourlyPurpose === 'Railway Station' && !booking.railwayStationAddress.trim()) {
      setError('Please provide the railway station address');
      return false;
    }
    if (booking.tripTypeId === 'hourly' && booking.hourlyPurpose === 'Airport' && !booking.airportTerminal.trim()) {
      setError('Please provide the airport terminal');
      return false;
    }
    if (booking.tripTypeId === 'hourly' && booking.hourlyPurpose === 'Airport' && !booking.airportArea) {
      setError('Please select the airport area');
      return false;
    }
    if (!booking.pickupFromOurLocation && !booking.commonCustomAddress.trim()) {
      setError('Please provide your pickup address');
      return false;
    }

    setError('');
    return true;
  };

  const handleConfirmBooking = async () => {
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    try {
      const bookingPayload = booking.getBookingSummary();
      
      navigate('/confirm-booking', {
        state: { bookingData: bookingPayload }
      });
    } catch (error) {
      console.error('❌ Error preparing booking:', error);
      setError('Failed to prepare booking. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getCurrentLocationText = () => {
    const parts = booking.pickupLocation.split(' - ');
    const subCity = parts[1];
    if (subCity && subCity !== 'Main Location') {
      return `${parts[0]} - ${subCity}`;
    }
    return parts[0];
  };

  if (!booking.tripType && !routeBookingData) {
    return (
      <div className="vehicle-details-container">
        <div className="error">
          <h3>No booking data found</h3>
          <p>Please start a new booking from the home page</p>
          <button onClick={() => navigate('/')} className="book-now-btn">
            <FaArrowLeft style={{ marginRight: '8px' }} />
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="vehicle-details-container">
      <div className="back-button-container">
        <button className="back-button" onClick={() => navigate(-1)}>
          <FaArrowLeft className="back-icon" />
          Back to vehicle details
        </button>
      </div>

      {error && (
        <div className="info-box error">
          <FaExclamationTriangle />
          <span>{error}</span>
        </div>
      )}

      <div className="vehicle-content">
        <div className="left-section">
          <div className="vehicle-header">
            <h1 className="vehicle-title">Complete Your Booking</h1>
            <p className="vehicle-subtitle">
              {booking.vehicleConfigs[0]?.vehicleName || 'Vehicle'} • {booking.tripType}
            </p>
          </div>

          <div className="booking-form">
            <h3 style={{ margin: '0 0 20px 0', fontSize: '20px', fontWeight: '700' }}>
              Trip Details
            </h3>

            <div className="date-input-group">
              <label>
                <FaMapMarkerAlt className="label-icon" />
                Pickup City/Location
              </label>
              {loadingLocations ? (
                <div style={{ padding: '18px 20px', color: '#64748b', textAlign: 'center' }}>
                  Loading locations...
                </div>
              ) : (
                <select
                  value={booking.pickupLocation}
                  onChange={(e) => booking.setPickupLocation(e.target.value)}
                  className="date-picker-input"
                >
                  <option value="">Select pickup location</option>
                  {availableLocations.map((loc) => (
                    <optgroup key={loc._id} label={`📍 ${loc.city}`}>
                      {loc.subCities && loc.subCities.length > 0 ? (
                        loc.subCities.map((subCity, idx) => (
                          <option key={`${loc._id}-${idx}`} value={`${loc.city} - ${subCity}`}>
                            {subCity}
                          </option>
                        ))
                      ) : (
                        <option value={`${loc.city} - Main Location`}>{loc.city} - Main Location</option>
                      )}
                    </optgroup>
                  ))}
                </select>
              )}
            </div>

            {booking.tripTypeId !== 'hourly' && (
              <div className="date-input-group">
                <label>
                  <FaMapMarkerAlt className="label-icon" />
                  Drop City/Location
                </label>
                {booking.tripTypeId === 'outstation' ? (
                  <>
                    <input
                      type="text"
                      value={booking.pickupLocation}
                      readOnly
                      className="date-picker-input"
                      style={{ background: '#f8fafc', cursor: 'not-allowed', color: '#64748b' }}
                      placeholder="Same as pickup location"
                    />
                    <p style={{ fontSize: '14px', color: '#64748b', fontStyle: 'italic', marginTop: '8px' }}>
                      For round trips, the drop location will be the same as the pickup location.
                    </p>
                  </>
                ) : loadingLocations ? (
                  <div style={{ padding: '18px 20px', color: '#64748b', textAlign: 'center' }}>
                    Loading locations...
                  </div>
                ) : (
                  <select
                    value={booking.dropLocation}
                    onChange={(e) => booking.setDropLocation(e.target.value)}
                    className="date-picker-input"
                  >
                    <option value="">Select drop location</option>
                    {availableLocations.map((loc) => (
                      <optgroup key={loc._id} label={`📍 ${loc.city}`}>
                        {loc.subCities && loc.subCities.length > 0 ? (
                          loc.subCities.map((subCity, idx) => (
                            <option key={`${loc._id}-${idx}`} value={`${loc.city} - ${subCity}`}>
                              {subCity}
                            </option>
                          ))
                        ) : (
                          <option value={`${loc.city} - Main Location`}>{loc.city} - Main Location</option>
                        )}
                      </optgroup>
                    ))}
                  </select>
                )}
              </div>
            )}

            {booking.pickupLocation && (
              <div className="pickup-info-box">
                <h4 className="pickup-info-title">
                  📍 Vehicle Pickup Option (Applies to all vehicles)
                </h4>
                
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px', display: 'block' }}>
                    Pick up vehicles from our location?
                  </label>
                  <div className="toggle-button-group">
                    <button
                      onClick={() => {
                        booking.setPickupFromOurLocation(true);
                        booking.setCommonCustomAddress('');
                      }}
                      className={`toggle-button ${booking.pickupFromOurLocation ? 'active' : ''}`}
                    >
                      Yes - From Our Location
                    </button>
                    <button
                      onClick={() => booking.setPickupFromOurLocation(false)}
                      className={`toggle-button ${!booking.pickupFromOurLocation ? 'active' : ''}`}
                    >
                      No - My Custom Address
                    </button>
                  </div>
                </div>

                {booking.pickupFromOurLocation && (
                  <div className="pickup-location-display">
                    <div className="pickup-location-content">
                      <FaMapMarkerAlt className="pickup-location-icon" />
                      <div>
                        <h5 className="pickup-location-title">
                          Our Location in {getCurrentLocationText()}
                        </h5>
                        <p className="pickup-location-address">
                          {getLocationAddress(booking.pickupLocation)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {!booking.pickupFromOurLocation && (
                  <div className="date-input-group">
                    <label>
                      <FaMapMarkerAlt className="label-icon" />
                      Your Pickup Address in {getCurrentLocationText()}
                    </label>
                    <textarea
                      placeholder={`Enter your complete pickup address in ${getCurrentLocationText()}`}
                      className="date-picker-input"
                      style={{ minHeight: '100px', resize: 'vertical', fontFamily: 'inherit' }}
                      onChange={(e) => booking.setCommonCustomAddress(e.target.value)}
                      value={booking.commonCustomAddress}
                    />
                    <p style={{ margin: '8px 0 0 0', fontSize: '13px', color: '#64748b' }}>
                      💡 This address will be used for all vehicles in your booking
                    </p>
                  </div>
                )}
              </div>
            )}

            <div className="date-input-group">
              <label>
                <FaCalendarAlt className="label-icon" />
                Pickup Date & Time
              </label>
              <div style={{ display: 'flex', gap: '12px' }}>
                <DatePicker
                  selected={booking.pickupDate}
                  onChange={(date) => {
                    booking.setPickupDate(date);
                    autoAdjustTimeForSameDay(date);
                  }}
                  dateFormat="dd/MM/yyyy"
                  minDate={new Date()}
                  className="date-picker-input"
                  placeholderText="Select date"
                  style={{ flex: 1 }}
                />
                <input
                  type="time"
                  value={booking.pickupTime}
                  onChange={(e) => booking.setPickupTime(e.target.value)}
                  className="date-picker-input"
                  style={{ width: '140px' }}
                  min={booking.pickupDate ? getMinTimeForDate(booking.pickupDate) : undefined}
                />
              </div>
              {booking.pickupDate && booking.pickupDate.toDateString() === new Date().toDateString() && (
                <p style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                  ⏰ Same-day bookings require at least 2 hours advance notice
                </p>
              )}
            </div>

            {booking.tripTypeId === 'outstation' && (
              <div className="date-input-group">
                <label>
                  <FaCalendarAlt className="label-icon" />
                  Return Date & Time
                </label>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <DatePicker
                    selected={booking.returnDate}
                    onChange={(date) => booking.setReturnDate(date)}
                    dateFormat="dd/MM/yyyy"
                    minDate={booking.pickupDate || new Date()}
                    className="date-picker-input"
                    placeholderText="Select return date"
                    style={{ flex: 1 }}
                  />
                  <input
                    type="time"
                    value={booking.returnTime}
                    onChange={(e) => booking.setReturnTime(e.target.value)}
                    className="date-picker-input"
                    style={{ width: '140px' }}
                  />
                </div>
              </div>
            )}

            {booking.tripTypeId === 'hourly' && (
              <>
                <div className="date-input-group">
                  <label>
                    <FaClock className="label-icon" />
                    Purpose
                  </label>
                  <select
                    value={booking.hourlyPurpose}
                    onChange={(e) => booking.setHourlyPurpose(e.target.value)}
                    className="date-picker-input"
                  >
                    <option value="">Select purpose</option>
                    <option value="Vacations">Vacations</option>
                    <option value="Airport">Airport Transfer</option>
                    <option value="Railway Station">Railway Station Transfer</option>
                  </select>
                </div>

                <div className="date-input-group">
                  <label>
                    <FaClock className="label-icon" />
                    Duration (Hours)
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <button
                      onClick={() => booking.setHourlyHours(Math.max(1, booking.hourlyHours - 1))}
                      className="increment-button"
                    >
                      <FaMinus />
                    </button>
                    <input
                      type="number"
                      value={booking.hourlyHours}
                      readOnly
                      className="date-picker-input"
                      style={{ textAlign: 'center', width: '80px' }}
                    />
                    <button
                      onClick={() => booking.setHourlyHours(booking.hourlyHours + 1)}
                      className="increment-button"
                    >
                      <FaPlus />
                    </button>
                  </div>
                </div>

                {(booking.hourlyPurpose === 'Airport' || booking.hourlyPurpose === 'Railway Station') && (
                  <div className="date-input-group">
                    <label>
                      {booking.hourlyPurpose === 'Airport' ? 'Flight Number' : 'Train Number'} (Optional)
                    </label>
                    <input
                      type="text"
                      value={booking.flightTrainNumber}
                      onChange={(e) => booking.setFlightTrainNumber(e.target.value)}
                      placeholder={`Enter ${booking.hourlyPurpose === 'Airport' ? 'flight' : 'train'} number`}
                      className="date-picker-input"
                    />
                  </div>
                )}

                {booking.hourlyPurpose === 'Railway Station' && (
                  <div className="date-input-group">
                    <label>Railway Station Address</label>
                    <input
                      type="text"
                      value={booking.railwayStationAddress}
                      onChange={(e) => booking.setRailwayStationAddress(e.target.value)}
                      placeholder="Enter the railway station address"
                      className="date-picker-input"
                    />
                  </div>
                )}

                {booking.hourlyPurpose === 'Airport' && (
                  <>
                    <div className="date-input-group">
                      <label>Airport Terminal</label>
                      <input
                        type="text"
                        value={booking.airportTerminal}
                        onChange={(e) => booking.setAirportTerminal(e.target.value)}
                        placeholder="e.g., Terminal 1, Terminal 2"
                        className="date-picker-input"
                      />
                    </div>
                    <div className="date-input-group">
                      <label>Airport Area</label>
                      <select
                        value={booking.airportArea}
                        onChange={(e) => booking.setAirportArea(e.target.value)}
                        className="date-picker-input"
                      >
                        <option value="">Select area</option>
                        <option value="Domestic">Domestic</option>
                        <option value="International">International</option>
                      </select>
                    </div>
                  </>
                )}
              </>
            )}
          </div>

          <div className="booking-form">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '700' }}>
                Vehicle Configuration ({booking.vehicleConfigs.length})
              </h3>
              <button
                onClick={() => setShowVehicleSelector(true)}
                className="book-now-btn"
                disabled={!booking.pickupLocation}
                style={{
                  width: 'auto',
                  padding: '12px 24px',
                  fontSize: '14px',
                  marginTop: 0,
                  opacity: !booking.pickupLocation ? 0.6 : 1,
                  cursor: !booking.pickupLocation ? 'not-allowed' : 'pointer',
                }}
              >
                <FaPlus style={{ marginRight: '8px' }} />
                Add Vehicle
              </button>
            </div>

            {!booking.pickupLocation && (
              <div className="info-box warning">
                <FaExclamationTriangle />
                <span>Please select a pickup location first to add more vehicles</span>
              </div>
            )}

            {showVehicleSelector && (
              <div className="modal-overlay">
                <div className="modal-content">
                  <div className="modal-header">
                    <div>
                      <h3 className="modal-title">Select a Vehicle</h3>
                      <p className="modal-subtitle">
                        Available vehicles from {getCurrentLocationText()}
                      </p>
                      <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
                        Showing {availableVehicles.length} vehicle(s) available at this location
                      </p>
                    </div>
                    <button
                      onClick={() => setShowVehicleSelector(false)}
                      className="modal-close-btn"
                    >
                      <FaTimes />
                    </button>
                  </div>

                  {loadingVehicles ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                      <div style={{ marginBottom: '12px' }}>⏳</div>
                      Loading vehicles from {getCurrentLocationText()}...
                    </div>
                  ) : availableVehicles.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px' }}>
                      <div style={{ fontSize: '48px', marginBottom: '16px' }}>🚗</div>
                      <p style={{ color: '#64748b', marginBottom: '8px', fontWeight: '600' }}>
                        No vehicles available in {getCurrentLocationText()}
                      </p>
                      <p style={{ fontSize: '14px', color: '#94a3b8', marginBottom: '20px' }}>
                        There are currently no vehicles at this specific location.
                      </p>
                      <button 
                        onClick={() => setShowVehicleSelector(false)}
                        className="book-now-btn"
                        style={{ width: 'auto', padding: '12px 24px', fontSize: '14px' }}
                      >
                        Try Different Location
                      </button>
                    </div>
                  ) : (
                    <div className="vehicle-grid">
                      {availableVehicles.map((vehicle) => (
                        <div
                          key={vehicle._id}
                          onClick={() => handleAddVehicle(vehicle)}
                          className="vehicle-selector-card"
                          style={{ cursor: 'pointer' }}
                        >
                          <img
                            src={getVehicleImageUrl(vehicle.vehicleImage)}
                            alt={vehicle.name}
                            style={{ width: '100%', height: '120px', objectFit: 'cover', borderRadius: '12px', marginBottom: '8px' }}
                            onError={(e) => {
                              if (!e.target.dataset.errorHandled) {
                                e.target.dataset.errorHandled = 'true';
                                e.target.src = 'https://via.placeholder.com/400x120?text=No+Image';
                              }
                            }}
                          />
                          <h4>{vehicle.brand} {vehicle.vehicleModel}</h4>
                          <p>{vehicle.vehicleType}</p>
                          <p style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                            {vehicle.assignedLocation?.city || ''}{vehicle.subLocation ? ` - ${vehicle.subLocation}` : ''}
                          </p>
                          <p className="vehicle-price">₹{vehicle.rentPerDay}/day</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {booking.vehicleConfigs.map((config, index) => (
                <div key={config.id} className="vehicle-card" style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div className="vehicle-card-header">
                      <h4 className="vehicle-card-title">
                        {config.vehicleType === 'Bike' ? <FaMotorcycle /> : <FaCar />}
                        Vehicle #{index + 1} - {config.vehicleName}
                      </h4>
                      {booking.vehicleConfigs.length > 1 && (
                        <button
                          onClick={() => handleRemoveVehicle(config.id)}
                          className="remove-vehicle-btn"
                        >
                          <FaTimes />
                          Remove
                        </button>
                      )}
                    </div>

                    <div style={{ marginBottom: '16px' }}>
                      <img
                        src={getVehicleImageUrl(config.vehicleImage)}
                        alt={config.vehicleName}
                        style={{ width: '100%', height: '180px', objectFit: 'cover', borderRadius: '12px' }}
                        onError={(e) => {
                          if (!e.target.dataset.errorHandled) {
                            e.target.dataset.errorHandled = 'true';
                            e.target.src = 'https://via.placeholder.com/400x180?text=No+Image';
                          }
                        }}
                      />
                    </div>

                    <div style={{ marginBottom: '16px' }}>
                      <label style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px', display: 'block' }}>
                        Do you need a driver?
                      </label>
                      <div className="toggle-button-group">
                        <button
                          onClick={() => handleDriverToggle(index, true)}
                          className={`toggle-button ${config.needsDriver ? 'active' : ''}`}
                        >
                          Yes
                        </button>
                        <button
                          onClick={() => handleDriverToggle(index, false)}
                          className={`toggle-button ${!config.needsDriver ? 'active' : ''}`}
                        >
                          No
                        </button>
                      </div>
                    </div>

                    {config.needsDriver && (
                      <div style={{ marginBottom: '16px' }}>
                        <label style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px', display: 'block' }}>
                          Preferred Driver Gender
                        </label>
                        <div className="toggle-button-group">
                          <button
                            onClick={() => handleDriverGenderChange(index, 'Male')}
                            className={`toggle-button ${config.driverGender === 'Male' ? 'active' : ''}`}
                          >
                            Male
                          </button>
                          <button
                            onClick={() => handleDriverGenderChange(index, 'Female')}
                            className={`toggle-button ${config.driverGender === 'Female' ? 'active' : ''}`}
                          >
                            Female
                          </button>
                          <button
                            onClick={() => handleDriverGenderChange(index, 'Any')}
                            className={`toggle-button ${config.driverGender === 'Any' ? 'active' : ''}`}
                          >
                            Any
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="right-section">
          <div className="booking-form">
            <h3 style={{ margin: '0 0 20px 0', fontSize: '20px', fontWeight: '700' }}>
              Fare Summary
            </h3>

            {booking.vehicleFares.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                {booking.vehicleFares.map((vehicleFare, index) => (
                  <div key={vehicleFare.vehicleId} className="fare-vehicle-card">
                    <div className="fare-vehicle-header">
                      <h4 className="fare-vehicle-name">
                        Vehicle #{index + 1} - {vehicleFare.vehicleName}
                      </h4>
                      <span className="fare-vehicle-amount">
                        ₹{vehicleFare.fare}
                      </span>
                    </div>
                    
                    {vehicleFare.breakdown && (
                      <div className="fare-breakdown">
                        {vehicleFare.days && (
                          <div className="fare-breakdown-row">
                            <span>Duration</span>
                            <span>{vehicleFare.days} day{vehicleFare.days > 1 ? 's' : ''}</span>
                          </div>
                        )}
                        <div className="fare-breakdown-row">
                          <span>Vehicle Rent</span>
                          <span>₹{vehicleFare.breakdown.vehicleRent}</span>
                        </div>
                        {vehicleFare.breakdown.distanceCharges > 0 && (
                          <div className="fare-breakdown-row">
                            <span>Distance Charges</span>
                            <span>₹{vehicleFare.breakdown.distanceCharges}</span>
                          </div>
                        )}
                        {vehicleFare.breakdown.driverCharges > 0 && (
                          <div className="fare-breakdown-row">
                            <span>Driver Charges</span>
                            <span>₹{vehicleFare.breakdown.driverCharges}</span>
                          </div>
                        )}
                        {vehicleFare.breakdown.nightCharges > 0 && (
                          <div className="fare-breakdown-row">
                            <span>Night Charges</span>
                            <span>₹{vehicleFare.breakdown.nightCharges}</span>
                          </div>
                        )}
                        <div className="fare-breakdown-row">
                          <span>Platform Fee</span>
                          <span>₹{vehicleFare.breakdown.platformFee}</span>
                        </div>
                        <div className="fare-breakdown-row">
                          <span>GST (5%)</span>
                          <span>₹{Math.round(vehicleFare.breakdown.gst)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="total-fare-card">
              <div className="total-fare-subtitle">
                {booking.vehicleConfigs.length} Vehicle{booking.vehicleConfigs.length > 1 ? 's' : ''}
              </div>
              <div className="total-fare-amount">
                <span className="total-fare-label">Total Fare</span>
                <span className="total-fare-value">₹{booking.totalFare}</span>
              </div>
            </div>

            <button
              onClick={handleConfirmBooking}
              className="book-now-btn"
              disabled={loading || !booking.pickupLocation || !booking.pickupDate}
              style={{
                marginTop: '20px',
                opacity: (loading || !booking.pickupLocation || !booking.pickupDate) ? 0.6 : 1,
                cursor: (loading || !booking.pickupLocation || !booking.pickupDate) ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? (
                'Processing...'
              ) : (
                <>
                  <FaCheckCircle style={{ marginRight: '8px' }} />
                  Confirm Booking
                </>
              )}
            </button>

            <p className="no-card-text">
              ✨ Free cancellation up to 24 hours before pickup
            </p>
          </div>

          <div className="booking-form">
            <h4 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '700' }}>
              Important Information
            </h4>
            <ul className="info-list">
              <li>Valid driving license required</li>
              <li>Security deposit may be collected</li>
              <li>Fuel charges not included</li>
              <li>Toll and parking charges extra</li>
              <li>Driver accommodation (if applicable) to be arranged by customer</li>
              <li>You can add multiple vehicles from the same location</li>
              <li>All vehicles will be picked up from the same address</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingForm;