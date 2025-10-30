// frontend/src/api/managerAPI.js

import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const managerAPI = {
  /**
   * Get all bookings for the manager's assigned location
   * @param {string} token - JWT token
   * @returns {Promise<Object>} Object containing bookings, location, and stats
   */
  getManagerBookings: async (token) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/managers/bookings`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching manager bookings:', error);
      throw error;
    }
  },

  /**
   * Assign a driver to a booking (Manager override)
   * @param {string} bookingId - Booking ID
   * @param {string} driverId - Driver ID
   * @param {string} token - JWT token
   * @returns {Promise<Object>} Updated booking and driver info
   */
  assignDriverToBooking: async (bookingId, driverId, token) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/managers/bookings/assign-driver`,
        { bookingId, driverId },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error('❌ Error assigning driver to booking:', error);
      throw error;
    }
  },

  /**
   * Mark a booking as completed (legacy - use completeBookingWithPenalty instead)
   * @param {string} bookingId - Booking ID
   * @param {string} token - JWT token
   * @returns {Promise<Object>} Updated booking
   */
  completeBooking: async (bookingId, token) => {
    try {
      const response = await axios.put(
        `${API_BASE_URL}/bookings/manager/${bookingId}/status`,
        { status: 'completed' },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error('❌ Error completing booking:', error);
      throw error;
    }
  },

  /**
   * Complete booking with optional penalty
   * @param {string} bookingId - Booking ID
   * @param {Object} completionData - { hasDamage, damageReason, penaltyAmount }
   * @param {string} token - JWT token
   * @returns {Promise<Object>} Updated booking
   */
  completeBookingWithPenalty: async (bookingId, completionData, token) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/bookings/manager/${bookingId}/complete`,
        completionData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error('❌ Error completing booking with penalty:', error);
      throw error;
    }
  },

  /**
   * Get all payments for the manager's assigned location with pagination
   * @param {string} token - JWT token
   * @param {number} page - Page number (default: 1)
   * @param {number} limit - Items per page (default: 10)
   * @returns {Promise<Object>} Object containing payments array and pagination info
   */
  getManagerPayments: async (token, page = 1, limit = 10) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/managers/payments`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        params: { page, limit },
      });
      return response.data; // Returns { payments: [], pagination: { currentPage, totalPages, totalPayments, limit } }
    } catch (error) {
      console.error('❌ Error fetching manager payments:', error);
      throw error;
    }
  },

  /**
   * Create Razorpay order for penalty payment (for users)
   * @param {string} bookingId - Booking ID
   * @param {string} token - JWT token
   * @returns {Promise<Object>} Razorpay order details
   */
  createPenaltyPaymentOrder: async (bookingId, token) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/bookings/${bookingId}/penalty/create-order`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error('❌ Error creating penalty payment order:', error);
      throw error;
    }
  },

  /**
   * Process penalty payment (for users)
   * @param {string} bookingId - Booking ID
   * @param {Object} paymentData - { razorpay_payment_id, razorpay_order_id, razorpay_signature }
   * @param {string} token - JWT token
   * @returns {Promise<Object>} Payment result
   */
  payPenalty: async (bookingId, paymentData, token) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/bookings/${bookingId}/penalty/pay`,
        paymentData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error('❌ Error processing penalty payment:', error);
      throw error;
    }
  },
};

export default managerAPI;
