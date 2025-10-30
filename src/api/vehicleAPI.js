// src/api/vehicleAPI.js

import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const vehicleAPI = {
  /**
   * Fetch public vehicles with optional filters
   * @param {Object} filters - Filter options
   * @param {string} filters.city - Main location/city
   * @param {string} filters.subLocation - Sub-location/area
   * @param {string} filters.vehicleType - Type of vehicle (Car, Bike, etc.)
   * @param {string} filters.fuelType - Fuel type (Petrol, Diesel, etc.)
   * @returns {Promise<Array>} Array of vehicles
   */
  getPublicVehicles: async (filters = {}) => {
    try {
      const params = {};
      
      // Only add non-empty filters
      if (filters.city) params.city = filters.city;
      if (filters.subLocation) params.subLocation = filters.subLocation;
      if (filters.vehicleType) params.vehicleType = filters.vehicleType;
      if (filters.fuelType) params.fuelType = filters.fuelType;

      console.log('🔍 Fetching vehicles with filters:', params);

      const response = await axios.get(`${API_BASE_URL}/vehicles/public/vehicles`, {
        params: params
      });

      return response.data;
    } catch (error) {
      console.error('❌ Error fetching public vehicles:', error);
      throw error;
    }
  },

  /**
   * Fetch single vehicle by ID
   * @param {string} vehicleId - Vehicle ID
   * @returns {Promise<Object>} Vehicle object
   */
  getPublicVehicleById: async (vehicleId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/vehicles/${vehicleId}`);
      return response.data.vehicle;
    } catch (error) {
      console.error('❌ Error fetching vehicle by ID:', error);
      throw error;
    }
  },

  /**
   * Create a new vehicle (Manager only)
   * @param {FormData} formData - Vehicle data with image
   * @param {string} token - JWT token
   * @returns {Promise<Object>} Created vehicle
   */
  createVehicle: async (formData, token) => {
    try {
      console.log('🚗 Creating vehicle with data:', Object.fromEntries(formData.entries()));
      console.log('🔑 Using token:', token ? 'Present' : 'Missing');

      const response = await axios.post(`${API_BASE_URL}/vehicles`, formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          // Do NOT set Content-Type manually — axios will add boundary for multipart/form-data
        },
      });

      console.log('✅ Vehicle created successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error creating vehicle:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        url: `${API_BASE_URL}/vehicles`,
        method: 'POST',
        headers: {
          'Authorization': token ? 'Bearer [TOKEN]' : 'Missing',
          'Content-Type': 'multipart/form-data'
        }
      });
      throw error;
    }
  },

  /**
   * Update vehicle (Manager only)
   * @param {string} vehicleId - Vehicle ID
   * @param {FormData} formData - Updated vehicle data
   * @param {string} token - JWT token
   * @returns {Promise<Object>} Updated vehicle
   */
  updateVehicle: async (vehicleId, formData, token) => {
    try {
      const response = await axios.put(
        `${API_BASE_URL}/vehicles/${vehicleId}`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error('❌ Error updating vehicle:', error);
      throw error;
    }
  },

  /**
   * Delete vehicle (Manager only)
   * @param {string} vehicleId - Vehicle ID
   * @param {string} token - JWT token
   * @returns {Promise<Object>} Success message
   */
  deleteVehicle: async (vehicleId, token) => {
    try {
      const response = await axios.delete(`${API_BASE_URL}/vehicles/${vehicleId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      console.error('❌ Error deleting vehicle:', error);
      throw error;
    }
  },

  /**
   * Get vehicles by manager's location (Manager only)
   * @param {string} token - JWT token
   * @returns {Promise<Array>} Array of vehicles
   */
  getVehiclesByLocation: async (token) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/vehicles/location`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      return response.data.vehicles;
    } catch (error) {
      console.error('❌ Error fetching vehicles by location:', error);
      throw error;
    }
  },

  /**
   * Get all manager's vehicles (Manager only)
   * @param {string} token - JWT token
   * @returns {Promise<Array>} Array of vehicles
   */
  getManagerVehicles: async (token) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/vehicles`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      // Ensure each vehicle has location data
      const vehicles = response.data.vehicles.map(vehicle => ({
        ...vehicle,
        location: vehicle.location || {
          lat: 11.9416,
          lng: 79.8083
        }
      }));

      return vehicles;
    } catch (error) {
      console.error('❌ Error fetching manager vehicles:', error);
      throw error;
    }
  },

  /**
   * Update vehicle status (Manager only)
   * @param {string} vehicleId - Vehicle ID
   * @param {string} status - New status (Available, Booked, Maintenance)
   * @param {string} token - JWT token
   * @returns {Promise<Object>} Updated vehicle
   */
  updateVehicleStatus: async (vehicleId, status, token) => {
    try {
      const response = await axios.patch(
        `${API_BASE_URL}/vehicles/${vehicleId}/status`,
        { status },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error('❌ Error updating vehicle status:', error);
      throw error;
    }
  },

  /**
   * Update vehicle location
   * @param {string} vehicleId - Vehicle ID
   * @param {number} lat - Latitude
   * @param {number} lng - Longitude
   * @returns {Promise<Object>} Updated vehicle location
   */
  updateVehicleLocation: async (vehicleId, lat, lng) => {
    try {
      const response = await axios.put(`${API_BASE_URL}/vehicles/${vehicleId}/location`, {
        lat,
        lng,
      });
      return response.data;
    } catch (error) {
      console.error('❌ Error updating vehicle location:', error);
      throw error;
    }
  },

  /**
   * Get vehicle locations for manager (for map display)
   * @param {string} token - JWT token
   * @returns {Promise<Array>} Array of vehicle locations
   */
  getManagerVehicleLocations: async (token) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/vehicles/locations/manager`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      return response.data.vehicles;
    } catch (error) {
      console.error('❌ Error fetching vehicle locations:', error);
      throw error;
    }
  },
};

export default vehicleAPI;
