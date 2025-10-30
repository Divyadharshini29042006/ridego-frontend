// frontend/src/pages/common/MyBookings.jsx - COMPLETE VERSION WITH PENALTY PAYMENT

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import {
  Calendar,
  MapPin,
  Clock,
  X,
  User,
  Phone,
  CreditCard,
  Car,
  AlertCircle,
  CheckCircle,
  XCircle,
  Loader,
  AlertTriangle
} from 'lucide-react';
import '../../styles/MyBookings.css';

const MyBookings = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [completingBooking, setCompletingBooking] = useState(null);
  const [cancellingBooking, setCancellingBooking] = useState(null);
  const [pollingBookings, setPollingBookings] = useState(new Set());

  // Penalty payment states
  const [showPenaltyModal, setShowPenaltyModal] = useState(false);
  const [selectedPenaltyBooking, setSelectedPenaltyBooking] = useState(null);
  const [processingPenaltyPayment, setProcessingPenaltyPayment] = useState(false);
  const [penaltyError, setPenaltyError] = useState('');

  // Handle Pay Penalty - Opens Modal
  const handleOpenPenaltyModal = (booking) => {
    console.log('💰 Opening penalty modal for booking:', booking._id);
    setSelectedPenaltyBooking(booking);
    setShowPenaltyModal(true);
    setPenaltyError('');
  };

  // Handle Pay Penalty - Process Payment
  const handlePayPenalty = async () => {
    if (!selectedPenaltyBooking) return;

    try {
      setProcessingPenaltyPayment(true);
      setPenaltyError('');
      const token = localStorage.getItem('token');

      console.log('💰 Starting penalty payment for booking:', selectedPenaltyBooking._id);

      // Step 1: Create Razorpay order for penalty
      const orderResponse = await axios.post(
        `${import.meta.env.VITE_API_URL}/payments/penalty/${selectedPenaltyBooking._id}/create-order`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (!orderResponse.data.success) {
        throw new Error(orderResponse.data.message || 'Failed to create payment order');
      }

      const { order, razorpayKeyId } = orderResponse.data;

      console.log('✅ Penalty order created:', order);

      // Step 2: Initialize Razorpay
      const options = {
        key: razorpayKeyId,
        amount: order.amount,
        currency: order.currency,
        name: 'RideGo - Penalty Payment',
        description: `Penalty Payment for ${selectedPenaltyBooking.vehicleName}`,
        order_id: order.id,
        handler: async (response) => {
          try {
            console.log('💳 Payment successful:', response);

            // Step 3: Verify payment and mark penalty as paid
            const verifyResponse = await axios.post(
              `${import.meta.env.VITE_API_URL}/payments/penalty/${selectedPenaltyBooking._id}/verify`,
              {
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature
              },
              {
                headers: { Authorization: `Bearer ${token}` }
              }
            );

            if (verifyResponse.data.success) {
              alert('✅ Penalty payment successful! Your booking is now completed.');
              setShowPenaltyModal(false);
              setSelectedPenaltyBooking(null);
              await fetchBookings(); // Refresh bookings
            } else {
              throw new Error(verifyResponse.data.message || 'Payment verification failed');
            }
          } catch (verifyError) {
            console.error('❌ Payment verification failed:', verifyError);
            alert('Payment was successful but verification failed. Please contact support.');
            setPenaltyError('Payment verification failed. Please contact support.');
          }
        },
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
          contact: user?.phone || ''
        },
        theme: {
          color: '#f59e0b'
        },
        modal: {
          ondismiss: () => {
            console.log('💳 Payment modal dismissed');
            setProcessingPenaltyPayment(false);
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();

    } catch (err) {
      console.error('❌ Penalty payment error:', err);
      setPenaltyError(err.response?.data?.message || 'Failed to initiate penalty payment');
      alert(err.response?.data?.message || 'Failed to initiate penalty payment. Please try again.');
    } finally {
      setProcessingPenaltyPayment(false);
    }
  };

  // Fetch bookings
  useEffect(() => {
    fetchBookings();
  }, [user]);

  // Polling for driver assignment
  useEffect(() => {
    if (pollingBookings.size === 0) return;

    const pollInterval = setInterval(() => {
      pollingBookings.forEach(bookingId => {
        checkDriverAssignment(bookingId);
      });
    }, 5000);

    return () => clearInterval(pollInterval);
  }, [pollingBookings]);

  const fetchBookings = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/bookings/user`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        const bookingsData = response.data.bookings || [];
        console.log(`✅ Loaded ${bookingsData.length} bookings`);
        
        setBookings(bookingsData);
        filterBookings(activeTab, bookingsData);

        // Start polling for bookings with "Pending Assignment" status
        const pendingBookings = bookingsData
          .filter(b => b.status === 'Pending Assignment' && b.needsDriver)
          .map(b => b._id);
        
        setPollingBookings(new Set(pendingBookings));
      }
    } catch (err) {
      console.error('❌ Error fetching bookings:', err);
      setError('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const checkDriverAssignment = async (bookingId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/bookings/${bookingId}/driver-status`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success && response.data.driverAssigned) {
        console.log(`✅ Driver assigned for booking ${bookingId}`);
        fetchBookings();
        
        setPollingBookings(prev => {
          const newSet = new Set(prev);
          newSet.delete(bookingId);
          return newSet;
        });
      }
    } catch (err) {
      console.error('Error checking driver assignment:', err);
    }
  };

  const filterBookings = (tab, bookingsData = bookings) => {
    setActiveTab(tab);
    let filtered = [];

    switch (tab) {
      case 'upcoming':
        filtered = bookingsData.filter(
          b => ['confirmed', 'Driver Assigned', 'Pending Assignment', 'In Progress'].includes(b.status)
        );
        break;
      case 'completed':
        filtered = bookingsData.filter(b => b.status === 'completed');
        break;
      case 'cancelled':
        filtered = bookingsData.filter(b => b.status === 'cancelled');
        break;
      default:
        filtered = bookingsData;
    }

    setFilteredBookings(filtered);
  };

  const getStatusConfig = (status) => {
    const configs = {
      'pending': {
        label: 'Pending',
        className: 'status-pending',
        icon: Clock
      },
      'confirmed': {
        label: 'Confirmed',
        className: 'status-confirmed',
        icon: CheckCircle
      },
      'Pending Assignment': {
        label: 'Assigning Driver',
        className: 'status-pending',
        icon: Loader
      },
      'Driver Assigned': {
        label: 'Driver Assigned',
        className: 'status-confirmed',
        icon: CheckCircle
      },
      'In Progress': {
        label: 'In Progress',
        className: 'status-confirmed',
        icon: Car
      },
      'Waiting to pay penalty': {
        label: 'Penalty Pending',
        className: 'status-warning',
        icon: AlertCircle
      },
      'penalty paid': {
        label: 'Penalty Paid',
        className: 'status-completed',
        icon: CheckCircle
      },
      'completed': {
        label: 'Completed',
        className: 'status-completed',
        icon: CheckCircle
      },
      'cancelled': {
        label: 'Cancelled',
        className: 'status-cancelled',
        icon: XCircle
      }
    };
    return configs[status] || configs['pending'];
  };

  const handleViewDetails = (booking) => {
    setSelectedBooking(booking);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedBooking(null);
  };

  const handleCompleteJourney = async (bookingId) => {
    if (!window.confirm('Are you sure you want to mark this journey as completed?')) {
      return;
    }

    try {
      setCompletingBooking(bookingId);
      const token = localStorage.getItem('token');

      const response = await axios.patch(
        `${import.meta.env.VITE_API_URL}/bookings/${bookingId}/complete`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        alert('✅ Journey marked as completed! Vehicle and driver are now available.');
        await fetchBookings();

        if (showModal && selectedBooking?._id === bookingId) {
          handleCloseModal();
        }
      }
    } catch (err) {
      console.error('❌ Error completing journey:', err);
      alert(err.response?.data?.message || 'Failed to complete journey. Please try again.');
    } finally {
      setCompletingBooking(null);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    const reason = window.prompt('Please provide a reason for cancellation (optional):');
    if (reason === null) return;

    if (!window.confirm('Are you sure you want to cancel this booking? This action cannot be undone.')) {
      return;
    }

    try {
      setCancellingBooking(bookingId);
      const token = localStorage.getItem('token');

      const response = await axios.patch(
        `${import.meta.env.VITE_API_URL}/bookings/${bookingId}/cancel`,
        { cancellationReason: reason },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        alert('✅ Booking cancelled successfully! Vehicle and driver are now available.');
        await fetchBookings();

        if (showModal && selectedBooking?._id === bookingId) {
          handleCloseModal();
        }
      }
    } catch (err) {
      console.error('❌ Error cancelling booking:', err);
      alert(err.response?.data?.message || 'Failed to cancel booking. Please try again.');
    } finally {
      setCancellingBooking(null);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-IN', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getImageUrl = (vehicleImage) => {
    if (!vehicleImage) {
      return 'https://via.placeholder.com/240x160/6366f1/ffffff?text=No+Image';
    }

    if (vehicleImage.startsWith('http')) {
      return vehicleImage;
    }

    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
    return `${BACKEND_URL}/uploads/vehicles/${vehicleImage}`;
  };

  const getDriverImageUrl = (driverImage) => {
    if (!driverImage) {
      return null;
    }

    if (driverImage.startsWith('http')) {
      return driverImage;
    }

    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
    return `${BACKEND_URL}/uploads/drivers/${driverImage}`;
  };

  const tabCounts = {
    all: bookings.length,
    upcoming: bookings.filter(b => 
      ['confirmed', 'Driver Assigned', 'Pending Assignment', 'In Progress'].includes(b.status)
    ).length,
    completed: bookings.filter(b => b.status === 'completed').length,
    cancelled: bookings.filter(b => b.status === 'cancelled').length
  };

  if (loading) {
    return (
      <div className="bookings-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading your bookings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bookings-container">
      {/* Header */}
      <div className="bookings-header">
        <h1>My Bookings</h1>
        <p className="bookings-subtitle">Manage and track all your vehicle reservations</p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="error-message">
          <AlertCircle size={20} />
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="bookings-tabs">
        <button
          className={`tab-button ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => filterBookings('all')}
        >
          All Bookings
          <span className="tab-count">{tabCounts.all}</span>
        </button>
        <button
          className={`tab-button ${activeTab === 'upcoming' ? 'active' : ''}`}
          onClick={() => filterBookings('upcoming')}
        >
          <Clock size={16} />
          Upcoming
          <span className="tab-count">{tabCounts.upcoming}</span>
        </button>
        <button
          className={`tab-button ${activeTab === 'completed' ? 'active' : ''}`}
          onClick={() => filterBookings('completed')}
        >
          <CheckCircle size={16} />
          Completed
          <span className="tab-count">{tabCounts.completed}</span>
        </button>
        <button
          className={`tab-button ${activeTab === 'cancelled' ? 'active' : ''}`}
          onClick={() => filterBookings('cancelled')}
        >
          <XCircle size={16} />
          Cancelled
          <span className="tab-count">{tabCounts.cancelled}</span>
        </button>
      </div>

      {/* Bookings List */}
      {filteredBookings.length === 0 ? (
        <div className="no-bookings">
          <Car size={64} />
          <h3>No bookings found</h3>
          <p>You don't have any {activeTab !== 'all' ? activeTab : ''} bookings yet</p>
        </div>
      ) : (
        <div className="bookings-list">
          {filteredBookings.map((booking) => {
            const statusConfig = getStatusConfig(booking.status);
            const StatusIcon = statusConfig.icon;
            const isPolling = pollingBookings.has(booking._id);
            
            const canComplete = ['confirmed', 'Driver Assigned', 'In Progress', 'Pending Assignment'].includes(booking.status);
            const hasPenalty = booking.penaltyAmount > 0 && !booking.penaltyPaid;

            return (
              <div key={booking._id} className="booking-card">
                {/* Vehicle Image */}
                <div className="card-vehicle-image">
                  <img
                    src={getImageUrl(booking.vehicleImage)}
                    alt={booking.vehicleName || 'Vehicle'}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'https://via.placeholder.com/240x160/6366f1/ffffff?text=No+Image';
                    }}
                  />
                </div>

                {/* Card Info */}
                <div className="card-info">
                  <div className="card-header">
                    <div>
                      <h3 className="vehicle-name">{booking.vehicleName || 'Unknown Vehicle'}</h3>
                      <p className="vehicle-type">{booking.vehicleType || 'Car'}</p>
                    </div>
                    <div className={`booking-status ${statusConfig.className}`}>
                      <StatusIcon size={14} />
                      {statusConfig.label}
                      {isPolling && <span className="polling-indicator">⟳</span>}
                    </div>
                  </div>

                  <div className="info-list">
                    <div className="info-item">
                      <Calendar size={16} />
                      <span>{formatDateTime(booking.pickupDate)}</span>
                    </div>
                    <div className="info-item">
                      <MapPin size={16} />
                      <span>{booking.pickupLocation || 'N/A'}</span>
                    </div>
                    {booking.driver && (
                      <>
                        <div className="info-item">
                          <User size={16} />
                          <span>Driver: {booking.driver.name}</span>
                        </div>
                        <div className="info-item">
                          <Phone size={16} />
                          <span>{booking.driver.phone}</span>
                        </div>
                      </>
                    )}
                    {booking.needsDriver && !booking.driver && (
                      <div className="info-item">
                        <User size={16} />
                        <span>
                          {isPolling ? 'Driver being assigned...' : 'Driver required'}
                        </span>
                      </div>
                    )}
                    {hasPenalty && (
                      <div className="info-item penalty-notice">
                        <AlertTriangle size={16} />
                        <span style={{ color: '#f59e0b', fontWeight: 700 }}>
                          Penalty: ₹{booking.penaltyAmount}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                  minWidth: '200px'
                }}>
                  <button
                    className="view-details-btn"
                    onClick={() => handleViewDetails(booking)}
                  >
                    View Details
                  </button>

                  {/* Mark as Completed Button */}
                  {canComplete && (
                    <button
                      className="view-details-btn"
                      style={{
                        background: '#10b981',
                        color: 'white',
                        border: 'none',
                        opacity: completingBooking === booking._id ? 0.7 : 1,
                        cursor: completingBooking === booking._id ? 'not-allowed' : 'pointer'
                      }}
                      onClick={() => handleCompleteJourney(booking._id)}
                      disabled={completingBooking === booking._id}
                    >
                      {completingBooking === booking._id ? (
                        <>
                          <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} />
                          <span>Completing...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle size={16} />
                          <span>Mark as Completed</span>
                        </>
                      )}
                    </button>
                  )}

                  {/* Cancel Booking Button */}
                  {canComplete && (
                    <button
                      className="view-details-btn"
                      style={{
                        background: '#ef4444',
                        color: 'white',
                        border: 'none',
                        opacity: cancellingBooking === booking._id ? 0.7 : 1,
                        cursor: cancellingBooking === booking._id ? 'not-allowed' : 'pointer'
                      }}
                      onClick={() => handleCancelBooking(booking._id)}
                      disabled={cancellingBooking === booking._id}
                    >
                      {cancellingBooking === booking._id ? (
                        <>
                          <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} />
                          <span>Cancelling...</span>
                        </>
                      ) : (
                        <>
                          <XCircle size={16} />
                          <span>Cancel Booking</span>
                        </>
                      )}
                    </button>
                  )}

                  {/* Pay Penalty Button */}
                  {booking.status === 'Waiting to pay penalty' && hasPenalty && (
                    <button
                      className="view-details-btn penalty-btn"
                      onClick={() => handleOpenPenaltyModal(booking)}
                    >
                      <CreditCard size={16} />
                      <span>Pay Penalty ₹{booking.penaltyAmount}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Details Modal */}
      {showModal && selectedBooking && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Booking Details</h2>
              <button className="modal-close-btn" onClick={handleCloseModal}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              {/* Vehicle Info */}
              <div className="modal-section">
                <h4 className="modal-section-title">CAR</h4>
                <div className="vehicle-status-header">
                  <div>
                    <h3 className="vehicle-title">{selectedBooking.vehicleName || 'Unknown Vehicle'}</h3>
                    <p className="vehicle-subtitle">{selectedBooking.vehicleType || 'Car'}</p>
                  </div>
                  <div className={`booking-status ${getStatusConfig(selectedBooking.status).className}`}>
                    {React.createElement(getStatusConfig(selectedBooking.status).icon, { size: 14 })}
                    {getStatusConfig(selectedBooking.status).label}
                  </div>
                </div>
              </div>

              {/* Trip Details */}
              <div className="modal-section">
                <h4 className="modal-section-title">TRIP DETAILS</h4>
                <div className="detail-row">
                  <span>Trip Type</span>
                  <span className="detail-value">{selectedBooking.tripType || 'N/A'}</span>
                </div>
                <div className="detail-row">
                  <span>Pickup Date</span>
                  <span className="detail-value">{formatDateTime(selectedBooking.pickupDate)}</span>
                </div>
                <div className="detail-row">
                  <span>Return Date</span>
                  <span className="detail-value">{formatDateTime(selectedBooking.returnDate)}</span>
                </div>
                {selectedBooking.hours && (
                  <div className="detail-row">
                    <span>Duration</span>
                    <span className="detail-value">{selectedBooking.hours} hours</span>
                  </div>
                )}
              </div>

              {/* Location Details */}
              <div className="modal-section">
                <h4 className="modal-section-title">LOCATIONS</h4>
                <div className="location-row">
                  <MapPin size={20} />
                  <div>
                    <p className="location-label">PICKUP LOCATION</p>
                    <p className="location-text">{selectedBooking.pickupLocation || 'N/A'}</p>
                  </div>
                </div>
                {selectedBooking.dropLocation && (
                  <div className="location-row">
                    <MapPin size={20} />
                    <div>
                      <p className="location-label">DROP LOCATION</p>
                      <p className="location-text">{selectedBooking.dropLocation}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Driver Details */}
              {selectedBooking.driver && (
                <div className="modal-section">
                  <h4 className="modal-section-title">DRIVER DETAILS</h4>
                  <div className="driver-modal-info">
                    <div className="driver-modal-avatar">
                      {getDriverImageUrl(selectedBooking.driver.image) ? (
                        <img
                          src={getDriverImageUrl(selectedBooking.driver.image)}
                          alt={selectedBooking.driver.name}
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                          style={{
                            width: '100%',
                            height: '100%',
                            borderRadius: '50%',
                            objectFit: 'cover'
                          }}
                        />
                      ) : null}
                      <span style={{
                        display: getDriverImageUrl(selectedBooking.driver.image) ? 'none' : 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '100%',
                        height: '100%'
                      }}>
                        {selectedBooking.driver.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="driver-modal-details">
                      <h4 className="driver-modal-name">{selectedBooking.driver.name}</h4>
                      <p className="driver-modal-gender">{selectedBooking.driver.gender || 'N/A'}</p>
                      <a href={`tel:${selectedBooking.driver.phone}`} className="driver-modal-phone">
                        <Phone size={16} />
                        {selectedBooking.driver.phone}
                      </a>
                    </div>
                  </div>
                </div>
              )}

              {/* Penalty Info */}
              {selectedBooking.penaltyAmount > 0 && (
                <div className="modal-section">
                  <h4 className="modal-section-title">PENALTY DETAILS</h4>
                  <div className="penalty-detail-box">
                    <div className="penalty-icon">
                      <AlertTriangle size={24} />
                    </div>
                    <div className="penalty-info">
                      <p className="penalty-reason">
                        <strong>Reason:</strong> {selectedBooking.penaltyReason || 'Vehicle damage charges'}
                      </p>
                      <p className="penalty-amount">
                        Amount: <strong>₹{selectedBooking.penaltyAmount}</strong>
                      </p>
                      {selectedBooking.penaltyPaid && (
                        <p className="penalty-status-paid">
                          <CheckCircle size={16} />
                          Paid on {formatDateTime(selectedBooking.penaltyPaidAt)}
                        </p>
                      )}
                      {!selectedBooking.penaltyPaid && (
                        <p className="penalty-status-unpaid">
                          <AlertCircle size={16} />
                          Payment pending
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Payment Details */}
              <div className="modal-section">
                <h4 className="modal-section-title">PAYMENT</h4>
                <div className="payment-detail">
                  <span>Total Amount</span>
                  <span className="payment-price">₹{selectedBooking.totalAmount?.toLocaleString() || '0'}</span>
                </div>
              </div>

              {/* Booking ID */}
              <div className="modal-section">
                <div className="detail-row">
                  <span>Booking ID</span>
                  <span className="booking-id-value">{selectedBooking._id}</span>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              {['confirmed', 'Driver Assigned', 'In Progress', 'Pending Assignment'].includes(selectedBooking.status) && (
                <>
                  <button
                    className="cancel-booking-btn"
                    onClick={() => handleCancelBooking(selectedBooking._id)}
                    disabled={cancellingBooking === selectedBooking._id}
                  >
                    {cancellingBooking === selectedBooking._id ? (
                      <>
                        <Loader size={16} />
                        <span>Cancelling...</span>
                      </>
                    ) : (
                      <>
                        <XCircle size={16} />
                        <span>Cancel Booking</span>
                      </>
                    )}
                  </button>
                  <button
                    className="complete-booking-btn"
                    onClick={() => handleCompleteJourney(selectedBooking._id)}
                    disabled={completingBooking === selectedBooking._id}
                  >
                    {completingBooking === selectedBooking._id ? (
                      <>
                        <Loader size={16} />
                        <span>Completing...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle size={16} />
                        <span>Mark as Completed</span>
                      </>
                    )}
                  </button>
                </>
              )}
              <button className="modal-close-button" onClick={handleCloseModal}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Penalty Payment Modal */}
      {showPenaltyModal && selectedPenaltyBooking && (
        <div className="modal-overlay" onClick={() => !processingPenaltyPayment && setShowPenaltyModal(false)}>
          <div className="penalty-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="penalty-modal-header">
              <div className="penalty-modal-title">
                <AlertTriangle size={28} color="#f59e0b" />
                <h2>Pay Penalty</h2>
              </div>
              <button 
                className="modal-close-btn" 
                onClick={() => setShowPenaltyModal(false)}
                disabled={processingPenaltyPayment}
              >
                <X size={20} />
              </button>
            </div>

            <div className="penalty-modal-body">
              {penaltyError && (
                <div className="penalty-error">
                  <AlertCircle size={18} />
                  {penaltyError}
                </div>
              )}

              <div className="penalty-booking-info">
                <div className="penalty-info-row">
                  <span className="penalty-label">Booking ID:</span>
                  <span className="penalty-value">{selectedPenaltyBooking._id}</span>
                </div>
                <div className="penalty-info-row">
                  <span className="penalty-label">Vehicle:</span>
                  <span className="penalty-value">{selectedPenaltyBooking.vehicleName}</span>
                </div>
                <div className="penalty-info-row">
                  <span className="penalty-label">Reason:</span>
                  <span className="penalty-value">
                    {selectedPenaltyBooking.penaltyReason || 'Vehicle damage charges'}
                  </span>
                </div>
              </div>

              <div className="penalty-amount-box">
                <span className="penalty-amount-label">Penalty Amount</span>
                <span className="penalty-amount-value">₹{selectedPenaltyBooking.penaltyAmount}</span>
              </div>

              <div className="penalty-notice-box">
                <AlertCircle size={18} />
                <p>
                  This penalty must be paid to complete your booking. 
                  After payment, your booking will be marked as completed and the vehicle will be available for others.
                </p>
              </div>
            </div>

            <div className="penalty-modal-footer">
              <button
                className="penalty-cancel-btn"
                onClick={() => setShowPenaltyModal(false)}
                disabled={processingPenaltyPayment}
              >
                Cancel
              </button>
              <button
                className="penalty-pay-btn"
                onClick={handlePayPenalty}
                disabled={processingPenaltyPayment}
              >
                {processingPenaltyPayment ? (
                  <>
                    <Loader size={18} style={{ animation: 'spin 1s linear infinite' }} />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <CreditCard size={18} />
                    <span>Pay ₹{selectedPenaltyBooking.penaltyAmount}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        .view-details-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        
        .polling-indicator {
          display: inline-block;
          animation: spin 2s linear infinite;
        }

        .penalty-notice {
          background: #fef3c7;
          padding: 8px 12px;
          border-radius: 8px;
          border: 1px solid #fde68a;
        }

        .penalty-btn {
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%) !important;
          box-shadow: 0 4px 12px rgba(245, 158, 11, 0.2);
        }

        .penalty-btn:hover {
          background: linear-gradient(135deg, #d97706 0%, #b45309 100%) !important;
          box-shadow: 0 6px 16px rgba(245, 158, 11, 0.3);
        }
      `}</style>
    </div>
  );
};

export default MyBookings;