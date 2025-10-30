// src/pages/manager/ManageBookingsPage.jsx

import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import managerAPI from '../../api/managerAPI.js';
import vehicleAPI from '../../api/vehicleAPI.js';
import vehicleLocationSimulator from '../../utils/vehicleLocationSimulator.js';
import CompleteBookingModal from './CompleteBookingModal.jsx';
import styles from '../../styles/ManageBookingsPage.module.css';

// Fix for default markers in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const ManageBookingsPage = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [locationInfo, setLocationInfo] = useState(null);
  const [stats, setStats] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [showMap, setShowMap] = useState(false);
  const [mapCenter, setMapCenter] = useState([13.0827, 80.2707]); // Default to Chennai
  const mapRef = useRef(null);

  // Modal states
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);

  // Driver assignment modal states
  const [showAssignDriverModal, setShowAssignDriverModal] = useState(false);
  const [selectedBookingForDriver, setSelectedBookingForDriver] = useState(null);
  const [availableDrivers, setAvailableDrivers] = useState([]);
  const [assigningDriver, setAssigningDriver] = useState(false);

  // Filter states
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [driverFilter, setDriverFilter] = useState('all');

  useEffect(() => {
    fetchBookings();
    fetchVehicles();

    // Cleanup: stop all simulations when component unmounts
    return () => {
      vehicleLocationSimulator.stopAllSimulations();
    };
  }, []);

  useEffect(() => {
    applyFilters();
  }, [bookings, statusFilter, searchTerm, driverFilter]);

  // Refresh bookings periodically
  useEffect(() => {
    const interval = setInterval(() => {
      fetchBookings();
      fetchVehicles();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, []);

  // Start vehicle simulations when vehicles are loaded
  useEffect(() => {
    if (vehicles.length > 0) {
      startVehicleSimulations();
    }
  }, [vehicles]);

  // Update map center when vehicles change
  useEffect(() => {
    if (vehicles.length > 0) {
      const validVehicles = vehicles.filter(v => v.currentLocation?.lat && v.currentLocation?.lng);
      if (validVehicles.length > 0) {
        const avgLat = validVehicles.reduce((sum, v) => sum + v.currentLocation.lat, 0) / validVehicles.length;
        const avgLng = validVehicles.reduce((sum, v) => sum + v.currentLocation.lng, 0) / validVehicles.length;
        setMapCenter([avgLat, avgLng]);
      }
    }
  }, [vehicles]);

  const fetchBookings = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await managerAPI.getManagerBookings(token);

      // Extract data from response
      const bookingsData = response.bookings || [];
      const locationData = response.location;
      const statsData = response.stats;

      // Backend already filters by location, no need for additional frontend filtering
      setBookings(bookingsData);
      setFilteredBookings(bookingsData);

      setLocationInfo(locationData);
      setStats(statsData);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching bookings:', err);
      setError(err.response?.data?.message || 'Failed to load bookings');
      setLoading(false);
    }
  };

  const fetchVehicles = async () => {
    try {
      const token = localStorage.getItem('token');
      const vehiclesData = await vehicleAPI.getManagerVehicleLocations(token);
      setVehicles(vehiclesData);
    } catch (err) {
      console.error('Error fetching vehicles:', err);
    }
  };

  const startVehicleSimulations = () => {
    const validVehicles = vehicles.filter(vehicle =>
      vehicle._id &&
      vehicle.assignedLocation?.lat &&
      vehicle.assignedLocation?.lng &&
      vehicle.assignedLocation?.radius
    );

    validVehicles.forEach(vehicle => {
      if (!vehicleLocationSimulator.isSimulationRunning(vehicle._id)) {
        vehicleLocationSimulator.startSimulation(vehicle._id, 10000);
      }
    });
  };

  const applyFilters = () => {
    let filtered = [...bookings];

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(b => {
        const bookingStatus = b.status.trim();
        const filterStatus = statusFilter.trim();
        return bookingStatus === filterStatus;
      });
    }

    // Driver filter
    if (driverFilter === 'needs') {
      filtered = filtered.filter(b => b.needsDriver && !b.driver);
    } else if (driverFilter === 'assigned') {
      filtered = filtered.filter(b => b.driver);
    }

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(b =>
        b._id.toLowerCase().includes(term) ||
        b.customerName?.toLowerCase().includes(term) ||
        b.vehicleName?.toLowerCase().includes(term) ||
        b.customer?.name?.toLowerCase().includes(term)
      );
    }

    setFilteredBookings(filtered);
  };

  const handleCompleteBooking = (bookingId) => {
    const booking = bookings.find(b => b._id === bookingId);
    if (booking) {
      setSelectedBooking(booking);
      setShowCompleteModal(true);
    }
  };

  const handleCompleteBookingSubmit = async (completionData) => {
    try {
      const token = localStorage.getItem('token');
      await managerAPI.completeBookingWithPenalty(selectedBooking._id, completionData, token);

      // Refresh bookings and vehicles from backend to ensure consistency
      await fetchBookings();
      await fetchVehicles();

      // Trigger refresh of vehicle data across all manager pages
      localStorage.setItem('lastVehicleUpdate', Date.now().toString());

      const customerName = selectedBooking.customerName || selectedBooking.customer?.name || 'the customer';
      const message = completionData.hasDamage
        ? `✅ Booking marked as completed with penalty!\n\nCustomer (${customerName}) has been notified about the damage and penalty payment.`
        : `✅ Booking marked as completed successfully!\n\nThe customer (${customerName}) has been notified and the vehicle/driver is now available.`;

      alert(message);
      console.log(`✅ Booking ${selectedBooking._id} marked as completed`);

      // Close modal and reset state
      setShowCompleteModal(false);
      setSelectedBooking(null);
    } catch (err) {
      console.error('Error completing booking:', err);
      alert('Failed to complete booking. Please try again.');
    }
  };

  const handleAssignDriver = async (bookingId) => {
    const booking = bookings.find(b => b._id === bookingId);
    if (!booking) return;

    try {
      // Fetch available drivers for the manager's location using the new endpoint
      const token = localStorage.getItem('token');
      const response = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/managers/drivers/available`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      const drivers = response.data.drivers || [];

      setAvailableDrivers(drivers);
      setSelectedBookingForDriver(booking);
      setShowAssignDriverModal(true);
    } catch (err) {
      console.error('Error fetching available drivers:', err);
      alert('Failed to load available drivers. Please try again.');
    }
  };

  const handleAssignDriverSubmit = async (driverId) => {
    if (!selectedBookingForDriver || !driverId) return;

    setAssigningDriver(true);
    try {
      const token = localStorage.getItem('token');
      const response = await managerAPI.assignDriverToBooking(selectedBookingForDriver._id, driverId, token);

      // Update local state
      setBookings(prevBookings =>
        prevBookings.map(booking =>
          booking._id === selectedBookingForDriver._id
            ? { ...booking, driver: response.driver, status: 'Driver Assigned' }
            : booking
        )
      );

      alert(`✅ Driver assigned successfully!\n\n${response.driver.name} has been assigned to the booking.`);
      console.log(`✅ Driver ${response.driver.name} assigned to booking ${selectedBookingForDriver._id}`);

      // Close modal and reset state
      setShowAssignDriverModal(false);
      setSelectedBookingForDriver(null);
      setAvailableDrivers([]);
    } catch (err) {
      console.error('Error assigning driver:', err);
      const errorMessage = err.response?.data?.message || 'Failed to assign driver. Please try again.';
      alert(errorMessage);
    } finally {
      setAssigningDriver(false);
    }
  };

  const getVehicleMarkerIcon = (status) => {
    const color = status === 'Available' ? 'green' : status === 'Booked' ? 'blue' : 'red';
    return L.divIcon({
      className: 'custom-vehicle-marker',
      html: `<div style="background-color: ${color}; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white;"></div>`,
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    });
  };

  const getStatusBadgeClass = (status) => {
    const statusMap = {
      'pending': styles.statusPending,
      'confirmed': styles.statusConfirmed,
      'Pending Assignment': styles.statusWarning,
      'Driver Assigned': styles.statusInfo,
      'In Progress': styles.statusProgress,
      'Waiting to pay penalty': styles.statusWarning,
      'completed': styles.statusCompleted,
      'cancelled': styles.statusCancelled
    };
    return statusMap[status] || styles.statusDefault;
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className={styles.manageBookingsContainer}>
        <div className={styles.loadingSpinner}>Loading bookings...</div>
      </div>
    );
  }

  return (
    <div className={styles.manageBookingsContainer}>
      {/* Header */}
      <div className={styles.bookingsHeader}>
        <div>
          <h1>Manage Bookings</h1>
          {locationInfo && (
            <p className={styles.locationInfo}>
              📍 {locationInfo.fullName || `${locationInfo.name}, ${locationInfo.city}`}
            </p>
          )}
        </div>
        <button onClick={fetchBookings} className={styles.refreshBtn}>
          🔄 Refresh
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <h3>{stats.total}</h3>
            <p>Total Bookings</p>
          </div>
          <div className={`${styles.statCard} ${styles.pending}`}>
            <h3>{stats.pending}</h3>
            <p>Pending Assignment</p>
          </div>
          <div className={`${styles.statCard} ${styles.cancelled}`}>
            <h3>{stats.cancelled}</h3>
            <p>Cancelled</p>
          </div>
          <div className={`${styles.statCard} ${styles.completed}`}>
            <h3>{stats.completed}</h3>
            <p>Completed</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className={styles.filtersSection}>
        <div className={styles.filterGroup}>
          <label>Status:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="Pending Assignment">Pending Assignment</option>
            <option value="Driver Assigned">Driver Assigned</option>
            <option value="In Progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label>Driver:</label>
          <select
            value={driverFilter}
            onChange={(e) => setDriverFilter(e.target.value)}
          >
            <option value="all">All Bookings</option>
            <option value="needs">Needs Driver</option>
            <option value="assigned">Driver Assigned</option>
          </select>
        </div>

        <div className={`${styles.filterGroup} ${styles.search}`}>
          <label>Search:</label>
          <input
            type="text"
            placeholder="Booking ID, Customer, Vehicle..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className={styles.filterGroup}>
          <button
            onClick={() => setShowMap(!showMap)}
            className={styles.btnMapToggle}
          >
            {showMap ? 'Hide Map' : 'Show Map'}
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && <div className={styles.errorMessage}>{error}</div>}

      {/* Map View */}
      {showMap && (
        <div className={styles.mapContainer}>
          <MapContainer
            center={mapCenter}
            zoom={12}
            style={{ height: '400px', width: '100%' }}
            ref={mapRef}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            {vehicles.map((vehicle) => (
              vehicle.currentLocation && vehicle.currentLocation.lat && vehicle.currentLocation.lng && (
                <Marker
                  key={vehicle._id}
                  position={[vehicle.currentLocation.lat, vehicle.currentLocation.lng]}
                  icon={getVehicleMarkerIcon(vehicle.status)}
                >
                  <Popup>
                    <div>
                      <strong>{vehicle.name}</strong><br />
                      <small>{vehicle.vehicleNumber}</small><br />
                      <small>Status: {vehicle.status}</small><br />
                      <small>Driver: {vehicle.assignedDriver?.name || 'None'}</small>
                    </div>
                  </Popup>
                </Marker>
              )
            ))}
          </MapContainer>
        </div>
      )}

      {/* Bookings Table */}
      <div className={styles.bookingsTableContainer}>
        {filteredBookings.length === 0 ? (
          <div className={styles.noBookings}>
            <p>No bookings found</p>
          </div>
        ) : (
          <table className={styles.bookingsTable}>
            <thead>
              <tr>
                <th>Booking ID</th>
                <th>Customer</th>
                <th>Vehicle</th>
                <th>Driver</th>
                <th>Trip Type</th>
                <th>Pickup Date</th>
                <th>Route</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.map((booking) => (
                <tr key={booking._id}>
                  <td>
                    <span className={styles.bookingId}>
                      {booking._id.slice(-8)}
                    </span>
                  </td>
                  <td>
                    <div className={styles.customerInfo}>
                      <strong>{booking.customerName || booking.customer?.name}</strong>
                      <small>{booking.customer?.email}</small>
                    </div>
                  </td>
                  <td>
                    <div className={styles.vehicleInfo}>
                      <strong>{booking.vehicleName}</strong>
                      <small>{booking.vehicle?.vehicleNumber}</small>
                    </div>
                  </td>
                  <td>
                    {booking.needsDriver ? (
                      booking.driver ? (
                        <div className={styles.driverInfo}>
                          <strong>{booking.driver.name}</strong>
                          <small>📞 {booking.driver.phone}</small>
                        </div>
                      ) : (
                        <span className={`${styles.badge} ${styles.badgeWarning}`}>Need Driver</span>
                      )
                    ) : (
                      <span className={`${styles.badge} ${styles.badgeSecondary}`}>Self Drive</span>
                    )}
                  </td>
                  <td>
                    <span className={styles.tripType}>{booking.tripType}</span>
                    {booking.hours && <small>({booking.hours}h)</small>}
                  </td>
                  <td>{formatDate(booking.pickupDate)}</td>
                  <td>
                    <div className={styles.routeInfo}>
                      <small>📍 {booking.pickupLocation}</small>
                      <small>📍 {booking.dropLocation}</small>
                    </div>
                  </td>
                  <td>
                    <strong>₹{booking.totalAmount.toLocaleString()}</strong>
                  </td>
                  <td>
                    <span className={`${styles.statusBadge} ${getStatusBadgeClass(booking.status)}`}>
                      {booking.status}
                    </span>
                  </td>
                  <td>
                    <div className={styles.actionButtons}>
                      {/* Show Assign Driver button only if:
                          1. Booking needs driver AND
                          2. No driver is assigned AND
                          3. Booking is not completed/cancelled */}
                      {booking.needsDriver &&
                       !booking.driver &&
                       !['completed', 'cancelled'].includes(booking.status?.toLowerCase()) && (
                        <button
                          onClick={() => handleAssignDriver(booking._id)}
                          className={`${styles.btnAction} ${styles.btnAssign}`}
                        >
                          Assign Driver
                        </button>
                      )}

                      {/* Show Complete button for bookings that can be completed */}
                      {(['In Progress', 'Driver Assigned', 'Waiting to pay penalty'].includes(booking.status)) && (
                        <button
                          onClick={() => handleCompleteBooking(booking._id)}
                          className={`${styles.btnAction} ${styles.btnComplete}`}
                        >
                          {booking.status === 'Waiting to pay penalty' ? 'Complete (Penalty Paid)' : 'Complete'}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Complete Booking Modal */}
      {showCompleteModal && selectedBooking && (
        <CompleteBookingModal
          booking={selectedBooking}
          onClose={() => {
            setShowCompleteModal(false);
            setSelectedBooking(null);
          }}
          onComplete={handleCompleteBookingSubmit}
        />
      )}

      {/* Assign Driver Modal */}
      {showAssignDriverModal && selectedBookingForDriver && (
        <div className={styles.modalOverlay}>
          <div className={`${styles.modalContent} ${styles.assignDriverModal}`}>
            <div className={styles.modalHeader}>
              <h2>Assign Driver to Booking</h2>
              <button
                onClick={() => {
                  setShowAssignDriverModal(false);
                  setSelectedBookingForDriver(null);
                  setAvailableDrivers([]);
                }}
                className={styles.closeBtn}
              >
                ×
              </button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.bookingSummary}>
                <h3>Booking Details</h3>
                <p><strong>Booking ID:</strong> {selectedBookingForDriver._id.slice(-8)}</p>
                <p><strong>Customer:</strong> {selectedBookingForDriver.customerName || selectedBookingForDriver.customer?.name}</p>
                <p><strong>Vehicle:</strong> {selectedBookingForDriver.vehicleName}</p>
                <p><strong>Pickup:</strong> {selectedBookingForDriver.pickupLocation}</p>
                <p><strong>Drop:</strong> {selectedBookingForDriver.dropLocation}</p>
                <p><strong>Date:</strong> {formatDate(selectedBookingForDriver.pickupDate)}</p>
                <p><strong>Preferred Driver:</strong> {selectedBookingForDriver.driverGender || 'Any'}</p>
              </div>

              <div className={styles.driversList}>
                <h3>Available Drivers</h3>
                {availableDrivers.length === 0 ? (
                  <p className={styles.noDrivers}>No available drivers found for your location.</p>
                ) : (
                  <div className={styles.driversGrid}>
                    {availableDrivers.map((driver) => (
                      <div key={driver._id} className={styles.driverCard}>
                        <div className={styles.driverInfo}>
                          <strong>{driver.name}</strong>
                          <small>📞 {driver.phone}</small>
                          <small>⭐ Rating: {driver.rating || 'N/A'}</small>
                          <small>🚗 Gender: {driver.gender}</small>
                        </div>
                        <button
                          onClick={() => handleAssignDriverSubmit(driver._id)}
                          disabled={assigningDriver}
                          className={styles.btnAssignDriver}
                        >
                          {assigningDriver ? 'Assigning...' : 'Assign'}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageBookingsPage;