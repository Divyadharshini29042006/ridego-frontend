// src/context/BookingContext.jsx
import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';

const BookingContext = createContext();

export const useBooking = () => {
  const context = useContext(BookingContext);
  if (!context) {
    throw new Error('useBooking must be used within a BookingProvider');
  }
  return context;
};

const STORAGE_KEY = 'ridego_booking_data';

// Ensure vehicle config has all required fields with fallbacks
const normalizeVehicleConfig = (config) => {
  return {
    id: config.id || Date.now(),
    vehicleId: config.vehicleId,
    vehicleName: config.vehicleName || 'Unknown Vehicle',
    vehicleImage: config.vehicleImage || null,
    vehicleType: config.vehicleType || 'Car',
    rentPerDay: typeof config.rentPerDay === 'number' ? config.rentPerDay : null,
    rentPerHour: typeof config.rentPerHour === 'number' ? config.rentPerHour : null,
    needsDriver: Boolean(config.needsDriver),
    driverGender: config.driverGender || 'Any'
  };
};

export const BookingProvider = ({ children }) => {
  const [bookingState, setBookingState] = useState({
    // Trip details
    pickupLocation: '',
    dropLocation: '',
    pickupDate: null,
    returnDate: null,
    pickupTime: '10:00',
    returnTime: '10:00',
    
    // Trip type specific
    tripType: null,
    tripTypeId: null,
    hourlyPurpose: '',
    hourlyHours: 1,
    flightTrainNumber: '',
    railwayStationAddress: '',
    airportTerminal: '',
    airportArea: '',
    
    // Pickup options
    pickupFromOurLocation: true,
    commonCustomAddress: '',
    
    // Vehicle configurations
    vehicleConfigs: [],
    
    // Fare details
    totalFare: 0,
    vehicleFares: [],
    
    // Pre-selected data
    preSelectedLocation: null,
    preSelectedSubLocation: null,
    
    // Initial vehicle data
    initialVehicle: null
  });

  // Load from localStorage on mount
  useEffect(() => {
    const loadBookingData = () => {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          
          // Convert date strings back to Date objects
          if (parsed.pickupDate && typeof parsed.pickupDate === 'string') {
            parsed.pickupDate = new Date(parsed.pickupDate);
          }
          if (parsed.returnDate && typeof parsed.returnDate === 'string') {
            parsed.returnDate = new Date(parsed.returnDate);
          }
          
          // Normalize vehicle configs to ensure rent values are preserved
          if (parsed.vehicleConfigs && Array.isArray(parsed.vehicleConfigs)) {
            parsed.vehicleConfigs = parsed.vehicleConfigs.map(normalizeVehicleConfig);
          }
          
          setBookingState(prev => ({
            ...prev,
            ...parsed
          }));
          
          console.log('💾 Booking data loaded from localStorage');
        }
      } catch (error) {
        console.error('❌ Error loading booking data:', error);
        localStorage.removeItem(STORAGE_KEY);
      }
    };

    loadBookingData();
  }, []);

  // Save to localStorage whenever state changes
  useEffect(() => {
    try {
      const dataToSave = {
        ...bookingState,
        // Convert dates to ISO strings for storage
        pickupDate: bookingState.pickupDate?.toISOString(),
        returnDate: bookingState.returnDate?.toISOString()
      };
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
      console.log('💾 Booking data saved to localStorage');
    } catch (error) {
      console.error('❌ Error saving booking data:', error);
    }
  }, [bookingState]);

  // Update booking state
  const updateBooking = useCallback((updates) => {
    setBookingState(prev => ({
      ...prev,
      ...updates
    }));
  }, []);

  // Update specific fields
  const setPickupLocation = useCallback((value) => {
    updateBooking({ pickupLocation: value });
  }, [updateBooking]);

  const setDropLocation = useCallback((value) => {
    updateBooking({ dropLocation: value });
  }, [updateBooking]);

  const setPickupDate = useCallback((value) => {
    updateBooking({ pickupDate: value });
  }, [updateBooking]);

  const setReturnDate = useCallback((value) => {
    updateBooking({ returnDate: value });
  }, [updateBooking]);

  const setPickupTime = useCallback((value) => {
    updateBooking({ pickupTime: value });
  }, [updateBooking]);

  const setReturnTime = useCallback((value) => {
    updateBooking({ returnTime: value });
  }, [updateBooking]);

  const setHourlyPurpose = useCallback((value) => {
    updateBooking({ hourlyPurpose: value });
  }, [updateBooking]);

  const setHourlyHours = useCallback((value) => {
    updateBooking({ hourlyHours: value });
  }, [updateBooking]);

  const setFlightTrainNumber = useCallback((value) => {
    updateBooking({ flightTrainNumber: value });
  }, [updateBooking]);

  const setPickupFromOurLocation = useCallback((value) => {
    updateBooking({ pickupFromOurLocation: value });
  }, [updateBooking]);

  const setCommonCustomAddress = useCallback((value) => {
    updateBooking({ commonCustomAddress: value });
  }, [updateBooking]);

  const setRailwayStationAddress = useCallback((value) => {
    updateBooking({ railwayStationAddress: value });
  }, [updateBooking]);

  const setAirportTerminal = useCallback((value) => {
    updateBooking({ airportTerminal: value });
  }, [updateBooking]);

  const setAirportArea = useCallback((value) => {
    updateBooking({ airportArea: value });
  }, [updateBooking]);

  const setVehicleConfigs = useCallback((value) => {
    // Normalize all vehicle configs before storing
    const normalized = Array.isArray(value) 
      ? value.map(normalizeVehicleConfig)
      : [];
    updateBooking({ vehicleConfigs: normalized });
  }, [updateBooking]);

  const setTotalFare = useCallback((value) => {
    updateBooking({ totalFare: value });
  }, [updateBooking]);

  const setVehicleFares = useCallback((value) => {
    updateBooking({ vehicleFares: value });
  }, [updateBooking]);

  // Initialize booking from vehicle details page
  const initializeBooking = useCallback((data) => {
    console.log('🚀 Initializing booking with vehicle data');
    
    const initialVehicleConfig = normalizeVehicleConfig({
      id: 1,
      vehicleId: data.vehicleId,
      vehicleName: data.vehicleName,
      vehicleImage: data.vehicleImage,
      vehicleType: data.vehicleType,
      rentPerDay: data.rentPerDay || null,
      rentPerHour: data.rentPerHour || null,
      needsDriver: false,
      driverGender: 'Any'
    });

    console.log('📦 Vehicle config normalized:', initialVehicleConfig);

    updateBooking({
      pickupDate: data.pickupDate ? new Date(data.pickupDate) : null,
      returnDate: data.returnDate ? new Date(data.returnDate) : null,
      tripType: data.tripType,
      tripTypeId: data.tripTypeId,
      vehicleConfigs: [initialVehicleConfig],
      preSelectedLocation: data.selectedLocation,
      preSelectedSubLocation: data.selectedSubLocation,
      initialVehicle: data
    });

    console.log('✅ Booking initialized');
  }, [updateBooking]);

  // Clear booking data
  const clearBooking = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setBookingState({
      pickupLocation: '',
      dropLocation: '',
      pickupDate: null,
      returnDate: null,
      pickupTime: '10:00',
      returnTime: '10:00',
      tripType: null,
      tripTypeId: null,
      hourlyPurpose: '',
      hourlyHours: 1,
      flightTrainNumber: '',
      railwayStationAddress: '',
      airportTerminal: '',
      airportArea: '',
      pickupFromOurLocation: true,
      commonCustomAddress: '',
      vehicleConfigs: [],
      totalFare: 0,
      vehicleFares: [],
      preSelectedLocation: null,
      preSelectedSubLocation: null,
      initialVehicle: null
    });
    console.log('🗑️ Booking cleared');
  }, []);

  // Get booking summary for confirmation
  const getBookingSummary = useCallback(() => {
    const mainPickupCity = bookingState.pickupLocation.split(' - ')[0];
    const mainDropCity = bookingState.dropLocation ? bookingState.dropLocation.split(' - ')[0] : mainPickupCity;

    // Helper function to create proper Date objects with time
    const createDateWithTime = (date, time) => {
      if (!date || !time) return null;
      const [hours, minutes] = time.split(':').map(Number);
      const dateWithTime = new Date(date);
      dateWithTime.setHours(hours, minutes, 0, 0); // Set hours, minutes, seconds, milliseconds
      return dateWithTime;
    };

    return {
      vehicles: bookingState.vehicleConfigs.map((config) => ({
        vehicleId: config.vehicleId,
        vehicleName: config.vehicleName,
        vehicleImage: config.vehicleImage,
        vehicleType: config.vehicleType,
        needsDriver: config.needsDriver,
        driverGender: config.driverGender,
        pickupLocation: bookingState.pickupFromOurLocation
          ? bookingState.pickupLocation
          : bookingState.commonCustomAddress,
        dropLocation: bookingState.dropLocation || bookingState.pickupLocation,
        pickupDate: createDateWithTime(bookingState.pickupDate, bookingState.pickupTime)?.toISOString() || null,
        returnDate: createDateWithTime(bookingState.returnDate, bookingState.returnTime)?.toISOString() || null,
        tripPurpose: bookingState.hourlyPurpose || null,
        flightOrTrain: bookingState.flightTrainNumber || null,
        railwayStationAddress: bookingState.hourlyPurpose === 'Railway Station' ? bookingState.railwayStationAddress : null,
        airportTerminal: bookingState.hourlyPurpose === 'Airport' ? bookingState.airportTerminal : null,
        airportArea: bookingState.hourlyPurpose === 'Airport' ? bookingState.airportArea : null,
        hours: bookingState.tripTypeId === 'hourly' ? bookingState.hourlyHours : null,
      })),
      tripType: bookingState.tripType,
      tripTypeId: bookingState.tripTypeId,
      totalFare: bookingState.totalFare,
      vehicleFares: bookingState.vehicleFares,
      numberOfVehicles: bookingState.vehicleConfigs.length,
      pickupFromOurLocation: bookingState.pickupFromOurLocation,
      commonPickupAddress: bookingState.pickupFromOurLocation
        ? bookingState.pickupLocation
        : bookingState.commonCustomAddress,
      pickupCity: mainPickupCity,
      dropCity: mainDropCity,
    };
  }, [bookingState]);

  const value = {
    // State
    ...bookingState,
    
    // Setters
    setPickupLocation,
    setDropLocation,
    setPickupDate,
    setReturnDate,
    setPickupTime,
    setReturnTime,
    setHourlyPurpose,
    setHourlyHours,
    setFlightTrainNumber,
    setPickupFromOurLocation,
    setCommonCustomAddress,
    setRailwayStationAddress,
    setAirportTerminal,
    setAirportArea,
    setVehicleConfigs,
    setTotalFare,
    setVehicleFares,
    
    // Actions
    updateBooking,
    initializeBooking,
    clearBooking,
    getBookingSummary
  };

  return (
    <BookingContext.Provider value={value}>
      {children}
    </BookingContext.Provider>
  );
};